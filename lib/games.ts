import rawConfig from '../config/slots.config.json' with { type: 'json' };
export const config = rawConfig;
export const bets = config.bets;
export type GameId = keyof typeof config.games;
export interface Game { id: GameId; name: string; sub: string; tag: string; color: string; cols: number; rows: number; cost: number; superCost: number; symbols: string[]; paylines: number; type: 'cluster' | 'lines' | 'classic' }
const catalog: Omit<Game, 'cost' | 'superCost'>[] = [
  {id:'crystal',name:'Crystal Forge',sub:'Tajemství zářící hlubiny',tag:'CLUSTER PAYS',color:'#a595ff',cols:7,rows:7,symbols:['◆','⬟','✦','⬢','●','▲','✿','★'],paylines:0,type:'cluster'},
  {id:'ocean',name:'Abyss Hunters',sub:'Poklady pod hladinou',tag:'COLLECT BONUS',color:'#62dfdd',cols:5,rows:3,symbols:['◆','⚓','✦','⬡','●','▲','◈','★'],paylines:10,type:'lines'},
  {id:'cosmic',name:'Nova Raiders',sub:'Výprava za hranice galaxie',tag:'WILD MULTIPLIERS',color:'#ffb77d',cols:5,rows:3,symbols:['◆','☄','✦','⬡','●','▲','✧','★'],paylines:10,type:'lines'},
  {id:'gaming',name:'Pixel Arcade',sub:'Level up. Roztoč další level.',tag:'CLASSIC · 3 REELS',color:'#92f889',cols:3,rows:3,symbols:['👑','🎮','💎','🕹️','⚡','♥','W','★'],paylines:5,type:'classic'},
  {id:'gta',name:'GTA: Neon Streets',sub:'Noční město. Vlastní pravidla.',tag:'CLASSIC · 3 REELS',color:'#ff83b5',cols:3,rows:3,symbols:['🚘','💵','🏍️','🌴','📻','🍸','W','★'],paylines:5,type:'classic'},
  {id:'royal',name:'Velvet Royale',sub:'Luxusní salón plný královských výher',tag:'20 PAYLINES · HIGH SOCIETY',color:'#e7c47a',cols:5,rows:3,symbols:['👑','💎','♠️','🍸','🎭','🃏','W','★'],paylines:20,type:'lines'},
  {id:'wildwest',name:'Dust & Destiny',sub:'Zlatá horečka na Divokém západě',tag:'10 PAYLINES · WILD WEST',color:'#e99c62',cols:5,rows:3,symbols:['🤠','🌵','🐎','⭐','🪙','🔫','W','★'],paylines:10,type:'lines'},
  {id:'pharaoh',name:'Pharaoh’s Fortune',sub:'Starověké zlato ukryté v písku',tag:'CLASSIC · 3 REELS',color:'#e6bd64',cols:3,rows:3,symbols:['👁️','🏺','🐈','𓂀','🪙','🔱','W','★'],paylines:5,type:'classic'},
  {id:'garden',name:'Moonlit Garden',sub:'Tajná zahrada rozkvétá o půlnoci',tag:'20 PAYLINES · MOON MAGIC',color:'#bb94ff',cols:5,rows:3,symbols:['🌙','🦋','🌸','🍄','✨','🪷','W','★'],paylines:20,type:'lines'},
  {id:'westside',name:'West Side Gang',sub:'Velké město. Vysoké sázky. Vlastní legendy.',tag:'20 PAYLINES · CITY NIGHTS',color:'#bc8b5a',cols:5,rows:3,symbols:['🕴️','🚕','🃏','💎','🥃','🌃','W','★'],paylines:20,type:'lines'},
  {id:'zeus',name:'Zeus vs Hades',sub:'Blesk olympský, oheň podsvětí.',tag:'20 PAYLINES · GODS OF OLYMPUS',color:'#c9a45e',cols:5,rows:3,symbols:['⚡','🔱','🏛️','🦅','🔥','💀','W','★'],paylines:20,type:'lines'},
];
export const games: Game[] = catalog.map(g => ({...g,cost:config.games[g.id].bonusBuyMultiplier,superCost:config.games[g.id].superBuyMultiplier}));
export interface Bonus { game: GameId; bet: number; left: number; super: boolean; total: number; mult: number[] }
export interface Frame { board: number[]; hits: number[]; win: number; mult: number[]; lines?: number[][] }
export interface Outcome { frames: Frame[]; total: number; scatter: number; mult: number[] }
export function random(n: number) { const a = new Uint32Array(1); crypto.getRandomValues(a); return Math.floor(a[0] / 4294967296 * n); }
export function validateConfig(value = config) {
  const positive = (n: number) => Number.isFinite(n) && n > 0;
  const integer = (n: number) => Number.isSafeInteger(n) && n > 0;
  if (!value.bets.length || !value.bets.every(integer) || new Set(value.bets).size !== value.bets.length || !value.bets.every((n,i,a)=>!i||n>a[i-1])) throw Error('Sázky musí být kladná vzestupná celá čísla.');
  if (![value.maxWinMultiplier,value.maxCascades,value.maxPositionMultiplier,...Object.values(value.bonus)].every(integer)||!Number.isInteger(value.winChancePercent)||value.winChancePercent<0||value.winChancePercent>100) throw Error('Neplatné limity nebo free spiny.');
  if (value.maxCascades > 50 || value.maxPositionMultiplier > 1024 || value.bonus.maxRemainingSpins > 200 || value.maxWinMultiplier>100000) throw Error('Limity překračují bezpečný rozsah.');
  for (const [id,c] of Object.entries(value.games)) {
    for (const n of [c.scatterChancePercent,c.bonusScatterChancePercent,c.wildChancePercent]) if (!Number.isFinite(n)||n<0||n>100) throw Error(`${id}: šance musí být 0–100 %.`);
    if (Math.max(c.scatterChancePercent,c.bonusScatterChancePercent)+c.wildChancePercent>100) throw Error(`${id}: součet scatter + wild nesmí překročit 100 %.`);
    if(c.symbolWeights.length!==7||!c.symbolWeights.every(n=>Number.isFinite(n)&&n>=0)||!c.symbolWeights.some(positive)) throw Error(`${id}: neplatné váhy symbolů.`);
    if(id!=='crystal'&&c.symbolWeights[6]!==0) throw Error(`${id}: wild nastavuj jen přes wildChancePercent.`);
    if(id==='crystal'&&c.wildChancePercent!==0) throw Error('Crystal Forge nemá wild.');
    if(![c.bonusBuyMultiplier,c.superBuyMultiplier,c.baseWildMultiplier,c.bonusWildMultiplier,...c.classicPayouts].every(positive)||c.classicPayouts.length!==7) throw Error(`${id}: neplatné výplaty nebo cena bonusu.`);
  }
  const m=value.miniGame;
  if(![m.rounds,m.perfectReward,m.goodReward,m.periodMs,m.roundTimeoutMs].every(integer)||m.rounds>30||m.periodMs<1000||m.roundTimeoutMs<m.periodMs||m.goodRadius<=m.perfectRadius||m.perfectRadius<=0||m.goodRadius>.3) throw Error('Neplatná konfigurace Pulse Runner.');
  return true;
}
validateConfig();
export function drawSymbol(id: GameId, bonus: boolean, rng = random) {
  const c = config.games[id];
  const sample = rng(1000000) / 10000;
  const scatter = bonus ? c.bonusScatterChancePercent : c.scatterChancePercent;
  if (sample < scatter) return 7;
  if (sample < scatter + c.wildChancePercent) return 6;
  const weights = c.symbolWeights;
  let roll = rng(1000000) / 1000000 * weights.reduce((a,b)=>a+b,0);
  for (let i=0;i<weights.length;i++) { roll-=weights[i]; if(roll<0)return i; }
  return weights.findLastIndex(x=>x>0);
}
export function groups(board: number[], cols: number) {
  const seen = new Uint8Array(board.length); const out: number[][] = [];
  for(let i=0;i<board.length;i++) {
    if(seen[i]||board[i]===7)continue;
    const q=[i];seen[i]=1;
    for(let j=0;j<q.length;j++) {const k=q[j]; for(const n of [k%cols>0?k-1:-1,k%cols<cols-1?k+1:-1,k-cols,k+cols]) if(n>=0&&n<board.length&&!seen[n]&&board[n]===board[i]){seen[n]=1;q.push(n);}}
    if(q.length>=5)out.push(q);
  }
  return out;
}
export const classicLines = [[1,1,1],[0,0,0],[2,2,2],[0,1,2],[2,1,0]];
export const standardLines = [[0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0]];
export const extendedLines = [...standardLines,[0,0,0,1,2],[2,2,2,1,0],[1,0,1,2,1],[1,2,1,0,1],[0,1,0,1,2],[2,1,2,1,0],[0,1,1,2,1],[2,1,1,0,1],[1,0,2,0,1],[1,2,0,2,1]];
export function evaluateLines(g: Game, board: number[], bet: number, bonus: Bonus|null) {
  let total=0;const hits=new Set<number>();const winningLines:number[][]=[];const c=config.games[g.id];
  for (const path of g.type==='classic'?classicLines:g.paylines>=20?extendedLines:standardLines) {
    const ids=path.map((r,col)=>r*g.cols+col);const sym=ids.map(i=>board[i]).find(x=>x!==6)??6;
    let count=0;for(const i of ids){if(board[i]===7||(board[i]!==sym&&board[i]!==6))break;count++;}
    if(count>=3){const wild=ids.slice(0,count).some(i=>board[i]===6);const payout=g.type==='classic'?c.classicPayouts[sym]:[0,0,0,1,3,8][count]*(sym<3?1.5:1);
      total+=Math.round(bet*payout*(wild?(bonus?c.bonusWildMultiplier:c.baseWildMultiplier):1));
      ids.slice(0,count).forEach(i=>hits.add(i));winningLines.push(ids.slice(0,count));}
  }
  if(g.id==='ocean'&&bonus&&board.includes(6)){total+=bet*board.filter(x=>x===0).length*(bonus.super?8:3);board.forEach((x,i)=>{if(x===0||x===6)hits.add(i);});}
  return {total,hits:[...hits],lines:winningLines};
}
export function outcome(gameId: string, bet: number, bonus: Bonus|null, rng = random): Outcome {
  const g=games.find(x=>x.id===gameId);if(!g||!Number.isSafeInteger(bet)||bet<=0)throw Error('Neplatná hra nebo sázka.');
  const draw=()=>drawSymbol(g.id,!!bonus,rng);const weights=config.games[g.id].symbolWeights.slice(0,6),weightTotal=weights.reduce((a,b)=>a+b,0);
  const baseSymbol=()=>{let roll=rng(1000000)/1000000*weightTotal;for(let i=0;i<weights.length;i++){roll-=weights[i];if(roll<0)return i;}return 5;};
  let board:number[]=[];
  for(let i=0;i<g.cols*g.rows;i++){const row=Math.floor(i/g.cols),col=i%g.cols;const neighbors=[col>0?i-1:-1,row>0&&col>0?i-g.cols-1:-1,row>0?i-g.cols:-1,row>0&&col<g.cols-1?i-g.cols+1:-1].filter(n=>n>=0).map(n=>board[n]);let symbol=baseSymbol();for(let tries=0;neighbors.includes(symbol)&&tries<20;tries++)symbol=baseSymbol();if(neighbors.includes(symbol))symbol=[0,1,2,3,4,5].find(x=>!neighbors.includes(x))??0;board.push(symbol);}
  const forceWin=rng(100)<config.winChancePercent;
  if(!bonus&&!forceWin){
    if(g.type==='cluster'){
      for(let i=0;i<board.length;i++)board[i]=(Math.floor(i/g.cols)+i%g.cols)%2;
    } else {
      for(let i=0;i<board.length;i++)board[i]=i%g.cols;
    }
  }
  if(forceWin&&g.type==='cluster'){for(const i of [0,1,2,g.cols+2,g.cols+3])board[i]=0;}
  else if(forceWin){const path=g.type==='classic'?classicLines[0]:standardLines[0];for(let c=0;c<(g.type==='classic'?3:4);c++)board[path[c]*g.cols+c]=5;}
  const protectedCells=new Set(g.type==='cluster'&&forceWin?[0,1,2,g.cols+2,g.cols+3]:g.type==='cluster'?[]:(g.type==='classic'?classicLines[0]:standardLines[0]).slice(0,g.type==='classic'?3:4).map((r,c)=>r*g.cols+c));
  for(let i=0;i<board.length;i++){if(protectedCells.has(i))continue;const roll=rng(100000)/1000;const scatterChance=bonus?config.games[g.id].bonusScatterChancePercent:config.games[g.id].scatterChancePercent;if(roll<scatterChance)board[i]=7;else if(forceWin&&roll<scatterChance+config.games[g.id].wildChancePercent)board[i]=6;}
  const frames:Frame[]=[];let total=0;const cap=bet*config.maxWinMultiplier;
  const mult=bonus?.mult?.length===board.length?[...bonus.mult]:Array(board.length).fill(0);
  let scatter=board.filter(x=>x===7).length;
  if(g.type==='cluster'){
    for(let tumble=0;tumble<config.maxCascades;tumble++){
      const clusters=groups(board,g.cols);
      if(!clusters.length){frames.push({board:[...board],hits:[],win:0,mult:[...mult]});break;}
      const hits=clusters.flat();let pay=0;
      for(const c of clusters)pay+=Math.round(bet*(.15+(6-board[c[0]])*.04)*c.length*Math.max(1,...c.map(i=>mult[i])));
      pay=Math.min(pay,cap-total);total+=pay;
      frames.push({board:[...board],hits,win:pay,mult:[...mult]});
      for(const i of hits)mult[i]=Math.min(config.maxPositionMultiplier,mult[i]?mult[i]*2:1);
      if(total>=cap||tumble===config.maxCascades-1)break;
      const removed=new Set(hits);
      for(let c=0;c<g.cols;c++){const keep:number[]=[];for(let r=0;r<g.rows;r++){const i=r*g.cols+c;if(!removed.has(i))keep.push(board[i]);}const added=Array.from({length:g.rows-keep.length},draw);const next=[...added,...keep];for(let r=0;r<g.rows;r++)board[r*g.cols+c]=next[r];}
      scatter=Math.max(scatter,board.filter(x=>x===7).length);
    }
  } else {const result=evaluateLines(g,board,bet,bonus);total=Math.min(result.total,cap);frames.push({board,hits:result.hits,win:total,mult:[],lines:result.lines});}
  return {frames,total,scatter,mult};
}
export function pulsePosition(elapsed:number,period=config.miniGame.periodMs){const t=((elapsed%period)+period)%period/period;return t<.5?t*2:2-t*2;}
export function pulseReward(elapsed:number,target:number){const c=config.miniGame;if(elapsed<300||elapsed>c.roundTimeoutMs)return {reward:0,grade:'MISS'};const distance=Math.abs(pulsePosition(elapsed)-target);return distance<=c.perfectRadius?{reward:c.perfectReward*100,grade:'PERFECT'}:distance<=c.goodRadius?{reward:c.goodReward*100,grade:'GOOD'}:{reward:0,grade:'MISS'};}
