import assert from 'node:assert/strict';
import {games,groups,outcome} from './lib/games.ts';
assert.deepEqual(groups([0,0,0,0,0,1,2,3,4],3),[[0,1,3,2,4]]);
assert.deepEqual(groups(Array(49).fill(7),7),[]);
for(const g of games)for(let i=0;i<2000;i++){const r=outcome(g.id,100,null);assert(r.total>=0&&r.total<=500000);assert(r.frames.length>0&&r.frames.length<=12);for(const f of r.frames){assert.equal(f.board.length,g.cols*g.rows);assert(f.board.every(x=>Number.isInteger(x)&&x>=0&&x<=7));}const b=outcome(g.id,100,{mult:Array(g.cols*g.rows).fill(2),super:true});assert(b.total>=0&&b.total<=500000);}
console.log('PASS: clusters, scatter exclusion, 12,000 base/bonus outcomes, symbol bounds, win limits.');
