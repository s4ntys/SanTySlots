'use client';
import {memo,type CSSProperties} from 'react';
import type {Frame,Game} from '../../lib/games';
export type Phase='idle'|'rolling'|'settling'|'cascade';
export default memo(function ReelBoard({game,frame,phase,turbo}:{game:Game;frame:Frame|null;phase:Phase;turbo:boolean}){
 if(!frame)return null;
 const columns=Array.from({length:game.cols},(_,c)=>Array.from({length:game.rows},(_,r)=>r*game.cols+c));
 const repeated=phase==='rolling'?3:1;
 return <div className={`reel-frame reel-machine ${game.type} phase-${phase} ${turbo?'fast':''}`} style={{'--cols':game.cols,'--rows':game.rows} as CSSProperties} aria-label="Výsledek automatu" aria-busy={phase==='rolling'}><div className="reel-columns">{columns.map((ids,c)=><div className="reel-window" key={c} style={{'--column':c} as CSSProperties}><div className="reel-strip">{Array.from({length:repeated},(_,copy)=>ids.map((i,r)=>{const sym=frame.board[i];return <div key={`${copy}-${r}`} className={`symbol reel-cell s${sym} ${phase!=='rolling'&&frame.hits.includes(i)?'winning':''}`}><span>{game.symbols[sym]}</span>{sym===7?<small>SCATTER</small>:sym===6&&game.type!=='cluster'?<small>WILD</small>:null}{(frame.mult[i]||0)>1&&<b>×{frame.mult[i]}</b>}</div>;}))}</div></div>)}</div>{game.type==='classic'&&<><div className="payline-guide"/><div className="cabinet-label">3 REELS · 5 PAYLINES · SANTY CLASSICS</div></>}{phase==='idle'&&frame.lines?.length?<svg className="winning-lines" viewBox={`0 0 ${game.cols*100} ${game.rows*100}`} preserveAspectRatio="none" aria-hidden="true">{frame.lines.map((line,k)=><polyline key={k} points={line.map(i=>`${(i%game.cols)*100+50},${Math.floor(i/game.cols)*100+50}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="3"/>)}</svg>:null}</div>;
});
