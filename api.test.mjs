import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173/api/game';let cookie='';let data;
async function call(body){const r=await fetch(base,{method:body?'POST':'GET',headers:{cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];const d=await r.json();if(r.ok)data=d;return {r,d};}
await call();assert.equal(data.player.balance,0);let initial=data.player.version;
let bad=await call({action:'spin',game:'crystal',bet:1,version:initial});assert.equal(bad.r.status,400);assert.equal(data.player.balance,0);
await call({action:'miniStart',version:data.player.version});for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,300));const x=await call({action:'miniHit',index:data.mini.index,version:data.player.version});assert(x.r.ok,JSON.stringify(x.d));}assert.equal(data.player.balance,18000);assert.equal(data.reward,18000);assert.equal(data.mini,null);
let replay=await call({action:'miniHit',index:0,version:data.player.version});assert.equal(replay.r.status,400);
await call({action:'buy',game:'crystal',bet:1,super:false,version:data.player.version});assert.equal(data.player.balance,10000);assert.equal(data.bonus.left,10);await call();assert.equal(data.bonus.left,10);
const v=data.player.version;const pair=await Promise.all([call({action:'spin',game:'crystal',bet:1,version:v}),call({action:'spin',game:'crystal',bet:1,version:v})]);assert.equal(pair.filter(x=>x.r.ok).length,1);assert.equal(pair.filter(x=>x.r.status===409).length,1);
await call();assert.equal(data.player.version,v+1);let n=0;while(data.bonus&&n++<100){const x=await call({action:'spin',game:'crystal',bet:1,version:data.player.version});assert(x.r.ok);}assert(!data.bonus);
for(const game of ['ocean','cosmic']){await call({action:'spin',game,bet:1,version:data.player.version});assert.equal(data.frames[0].board.length,15);}
const other=await (await fetch(base)).json();assert.equal(other.player.balance,0);assert(other.top.length>0);assert.deepEqual(other.top,data.top);
console.log('PASS: zero start, insufficient balance, 12 minigame hits, exactly-once reward, bonus purchase/persistence, concurrent spin prevention, completed bonus, all games, shared leaderboard with separate account.');
