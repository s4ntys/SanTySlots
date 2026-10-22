import rawConfig from '../config/slots.config.json' with { type: 'json' };
export const config = rawConfig;
export const bets = config.bets;
export type GameId = keyof typeof config.games;
export interface Game { id: GameId; name: string; sub: string; tag: string; color: string; cols: number; rows: number; cost: number; superCost: number; symbols: string[]; type: 'cluster' | 'lines' | 'classic' }
const catalog: Omit<Game, 'cost' | 'superCost'>[] = [
  {id:'crystal',name:'Crystal Forge',sub:'Tajemství zářící hlubiny',tag:'CLUSTER PAYS',color:'#a595ff',cols:7,rows:7,symbols:['◆','⬟','✦','⬢','●','▲','✿','★'],type:'cluster'},
  {id:'ocean',name:'Abyss Hunters',sub:'Poklady pod hladinou',tag:'COLLECT BONUS',color:'#62dfdd',cols:5,rows:3,symbols:['◆','⚓','✦','⬡','●','▲','◈','★'],type:'lines'},
  {id:'cosmic',name:'Nova Raiders',sub:'Výprava za hranice galaxie',tag:'WILD MULTIPLIERS',color:'#ffb77d',cols:5,rows:3,symbols:['◆','☄','✦','⬡','●','▲','✧','★'],type:'lines'},
  {id:'gaming',name:'Pixel Arcade',sub:'Level up. Roztoč další level.',tag:'CLASSIC · 3 REELS',color:'#92f889',cols:3,rows:3,symbols:['👑','🎮','💎','🕹️','⚡','♥','W','★'],type:'classic'},
  {id:'gta',name:'GTA: Neon Streets',sub:'Noční město. Vlastní pravidla.',tag:'CLASSIC · 3 REELS',color:'#ff83b5',cols:3,rows:3,symbols:['🚘','💵','🏍️','🌴','📻','🍸','W','★'],type:'classic'},
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
  if (![value.maxWinMultiplier,value.maxCascades,value.maxPositionMultiplier,...Object.values(value.bonus)].every(integer)) throw Error('Neplatné limity nebo free spiny.');
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
export function evaluateLines(g: Game, board: number[], bet: number, bonus: Bonus|null) {
  let total=0;const hits=new Set<number>();const winningLines:number[][]=[];const c=config.games[g.id];
  for (const path of g.type==='classic'?classicLines:standardLines) {
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
  const draw=()=>drawSymbol(g.id,!!bonus,rng);let board=Array.from({length:g.cols*g.rows},draw);
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
