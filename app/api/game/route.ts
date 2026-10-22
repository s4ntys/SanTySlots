import {env} from 'cloudflare:workers';
import {games,bets,config,random,outcome,pulseReward,type Bonus} from '../../../lib/games';
import type {D1Database} from '@cloudflare/workers-types';
const allowedOrigins = new Set(['https://s4ntys.github.io']);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
interface Mini { kind:'pulse'; step:number; earned:number; target:number; issued:number; started:number; grade?:string }
interface State { bonus?:Bonus; mini?:Mini; daily?:{ date:string; streak:number }; welcomeSpinAwarded?:boolean; lastMutationId?:string; lastActionAt?:number }
interface Player { id:string; name:string; balance:number; version:number; state:string }
class GameError extends Error { constructor(message:string,public status=400){super(message);} }
function response(value:unknown,status=200,headers:Record<string,string>={}) {return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});}
function cors(req:Request):Record<string,string>{const origin=req.headers.get('origin');const own=new URL(req.url).origin;if(origin&&origin!==own&&!allowedOrigins.has(origin))throw new GameError('Tento původ není povolen.',403);return origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};}
export async function OPTIONS(req:Request){try{return new Response(null,{status:204,headers:{...cors(req),'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Santy-Client','Access-Control-Max-Age':'86400'}});}catch{return response({error:'Nepovolený původ.'},403);}}
export const GET=handle;export const POST=handle;
async function leaderboard(db:D1Database){const results=await db.batch([db.prepare('SELECT name,game,amount,bet,created FROM wins ORDER BY amount DESC,created DESC LIMIT 20'),db.prepare('SELECT name,game,amount,bet,created FROM wins ORDER BY created DESC LIMIT 8')]);return {top:results[0].results,recent:results[1].results};}
async function handle(req:Request){let headers:Record<string,string>={};try{
  headers=cors(req);const db=env.DB;if(!db)throw new GameError('Databáze není připojena.',503);
  const auth=req.headers.get('authorization');const bearer=auth?.startsWith('Bearer ')?auth.slice(7):null;
  if(auth&&(!bearer||!uuid.test(bearer)))throw new GameError('Neplatný klíč účtu.',401);
  const cookie=req.headers.get('cookie')?.match(/(?:^|; )santy_player=([a-f0-9-]{36})(?:;|$)/)?.[1];
  let id=bearer||req.headers.get('oai-authenticated-user-id')||(cookie&&uuid.test(cookie)?cookie:null);
  let freshToken:string|undefined;
  if(!id){if(req.method==='POST')throw new GameError('Nejdřív načti účet.',401);id=crypto.randomUUID();if(req.headers.get('X-Santy-Client')==='pages')freshToken=id;else headers['Set-Cookie']=`santy_player=${id}; HttpOnly; Path=/; SameSite=Lax; Max-Age=31536000${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
  if(bearer&&!await db.prepare('SELECT id FROM players WHERE id=?').bind(id).first())throw new GameError('Účet nebyl nalezen. Obnov spojení v profilu.',401);
  await db.prepare('INSERT OR IGNORE INTO players (id,name) VALUES (?,?)').bind(id,'Hráč '+id.slice(-4)).run();
  const p=await db.prepare('SELECT * FROM players WHERE id=?').bind(id).first<Player>();if(!p)throw new GameError('Účet není dostupný.',503);
  const state:State=JSON.parse(p.state);let balance=p.balance;let result:Record<string,unknown>={};let win:{id:string;game:string;bet:number;amount:number}|undefined;
  // Old Crystal Catch sessions are not accepted by the replacement minigame.
  if(state.mini?.kind!=='pulse')delete state.mini;
  if(req.method==='POST'){
    const raw=await req.text();if(raw.length>2048)throw new GameError('Požadavek je příliš velký.',413);
    let b:Record<string,any>;try{b=JSON.parse(raw);}catch{throw new GameError('Neplatný JSON.');}if(!b||typeof b!=='object'||Array.isArray(b))throw new GameError('Neplatný požadavek.');
    if(!Number.isSafeInteger(b.version)||b.version!==p.version)throw new GameError('Účet se změnil v jiné záložce. Stav byl obnoven.',409);
    const now=Date.now();if(state.lastActionAt&&now-state.lastActionAt<120)throw new GameError('Chvilku počkej před další akcí.',429);
    switch(b.action){
      case 'dailyClaim': {const today=new Date(now).toISOString().slice(0,10);if(state.daily?.date===today)throw new GameError('Dnešní denní odměna už byla vyzvednuta.');const yesterday=new Date(now-86400000).toISOString().slice(0,10);const streak=state.daily?.date===yesterday?Math.min(7,state.daily.streak+1):1;const reward=60+20*(streak-1);balance+=reward*100;state.daily={date:today,streak};result={dailyReward:reward*100,dailyStreak:streak};break;}
      case 'name': {if(typeof b.name!=='string')throw new GameError('Neplatná přezdívka.');const name=b.name.trim();if(name.length<2||name.length>20||/[\u0000-\u001f<>]/.test(name))throw new GameError('Přezdívka musí mít 2–20 znaků bez řídicích znaků.');p.name=name;break;}
      case 'miniStart': {if(state.mini&&now-state.mini.started<3000)throw new GameError('Dokonči aktuální kolo.');state.mini={kind:'pulse',step:0,earned:0,target:.25+random(500)/1000,issued:now,started:now};break;}
      case 'miniHit': {const m=state.mini;if(!m||m.step>=config.miniGame.rounds)throw new GameError('Nejdřív spusť Pulse Runner.');const elapsed=now-m.issued;if(elapsed<300)throw new GameError('Počkej, až se ukazovatel rozběhne.');const hit=pulseReward(elapsed,m.target);m.earned+=hit.reward;m.grade=hit.grade;m.step++;result={grade:hit.grade,roundReward:hit.reward};if(m.step===config.miniGame.rounds){balance+=m.earned;result.reward=m.earned;delete state.mini;}else{m.target=.25+random(500)/1000;m.issued=now;}break;}
      case 'buy': {const g=games.find(g=>g.id===b.game);if(!g||!bets.includes(b.bet)||typeof b.super!=='boolean'||state.bonus)throw new GameError('Bonus nyní nelze koupit.');const cost=Math.round(b.bet*100*(b.super?g.superCost:g.cost));if(balance<cost)throw new GameError('Nedostatek kreditů. Zahraj si Pulse Runner.');balance-=cost;state.bonus={game:g.id,bet:b.bet*100,left:b.super?config.bonus.superFreeSpins:config.bonus.freeSpins,super:b.super,total:0,mult:g.type==='cluster'?Array(49).fill(b.super?2:0):[]};break;}
      case 'spin': {const g=games.find(g=>g.id===b.game);if(!g||!bets.includes(b.bet))throw new GameError('Neplatná hra nebo sázka.');if(state.bonus&&state.bonus.game!==g.id)throw new GameError('Nejdřív dokonči bonus na '+games.find(g=>g.id===state.bonus?.game)?.name+'.');const bonus=state.bonus||null;const bet=bonus?bonus.bet:b.bet*100;if(!bonus&&balance<bet)throw new GameError('Chybí kredity. Zahraj si Pulse Runner.');if(!bonus)balance-=bet;const o=outcome(g.id,bet,bonus);balance+=o.total;result={...o};if(!state.welcomeSpinAwarded){state.welcomeSpinAwarded=true;balance+=10000;result.welcomeSpinReward=10000;}if(bonus){bonus.left--;bonus.mult=o.mult;bonus.total+=o.total;if(o.scatter>=config.bonus.triggerScatters)bonus.left=Math.min(config.bonus.maxRemainingSpins,bonus.left+config.bonus.retriggerSpins);if(!bonus.left){result.bonusFinished=bonus.total;delete state.bonus;}}else if(o.scatter>=config.bonus.triggerScatters){state.bonus={game:g.id,bet,left:config.bonus.freeSpins,super:false,total:0,mult:Array(g.cols*g.rows).fill(0)};result.triggered=true;}if(o.total>0)win={id:crypto.randomUUID(),game:g.id,amount:o.total,bet};break;}
      default:throw new GameError('Neznámá akce.');
    }
    if(!Number.isSafeInteger(balance)||balance<0)throw new GameError('Limit zůstatku byl dosažen.',409);
    // The account update and win insertion are one atomic D1 transaction.
    // A unique marker prevents a losing concurrent update from inserting a win.
    state.lastMutationId=crypto.randomUUID();state.lastActionAt=now;
    const commands=[db.prepare('UPDATE players SET name=?,balance=?,state=?,version=version+1 WHERE id=? AND version=?').bind(p.name,balance,JSON.stringify(state),id,p.version)];
    if(win)commands.push(db.prepare("INSERT INTO wins (id,player,name,game,amount,bet,created) SELECT ?,?,?,?,?,?,? FROM players WHERE id=? AND version=? AND json_extract(state,'$.lastMutationId')=?").bind(win.id,id,p.name,win.game,win.amount,win.bet,now,id,p.version+1,state.lastMutationId));
    const update=await db.batch(commands);if(update[0].meta.changes!==1)throw new GameError('Probíhá jiná akce. Stav byl obnoven.',409);p.version++;
  }
  const today=new Date().toISOString().slice(0,10);
  return response({player:{name:p.name,balance,version:p.version},bonus:state.bonus||null,mini:state.mini||null,daily:{available:state.daily?.date!==today,streak:state.daily?.streak||0},serverTime:Date.now(),...(freshToken?{token:freshToken}:{}),...await leaderboard(db),...result},200,headers);
}catch(e){if(e instanceof GameError)return response({error:e.message},e.status,headers);console.error('Game API failed',e instanceof Error?e.message:'Unknown');return response({error:'Spojení se nezdařilo. Obnov stav účtu před další akcí.'},500,headers);}}
