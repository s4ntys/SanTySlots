'use client';
import {memo,type CSSProperties} from 'react';
import type {Frame,Game} from '../../lib/games';
import PharaohSymbol from './PharaohSymbol';
export type Phase='idle'|'rolling'|'settling'|'cascade';
export default memo(function ReelBoard({game,frame,phase,turbo,english=false}:{game:Game;frame:Frame|null;phase:Phase;turbo:boolean;english?:boolean}){
 if(!frame)return null;
 const columns=Array.from({length:game.cols},(_,c)=>Array.from({length:game.rows},(_,r)=>r*game.cols+c));
 const repeated=phase==='rolling'?3:1;
 const railCount=game.paylines;
 const rail=(side:'left'|'right')=><aside className={`cabinet-rail ${side}`} aria-hidden="true">{Array.from({length:railCount},(_,i)=><span key={i}><i/>{i+1}</span>)}</aside>;
 const anticipation=phase==='rolling'&&frame.board.filter(x=>x===7).length>=2;
 return <div className={`cabinet-shell ${game.id} ${anticipation?'anticipation':''}`}>
  {rail('left')}
  <div className={`reel-frame reel-machine ${game.type} phase-${phase} ${turbo?'fast':''}`} style={{'--cols':game.cols,'--rows':game.rows} as CSSProperties} aria-label={english?'Slot result':'Výsledek automatu'} aria-busy={phase==='rolling'}>
   <div className="cabinet-bulbs" aria-hidden="true"/>
   <div className="reel-columns">{columns.map((ids,c)=><div className="reel-window" key={c} style={{'--column':c} as CSSProperties}><div className="reel-strip">{Array.from({length:repeated},(_,copy)=>ids.map((i,r)=>{const sym=frame.board[i];return <div key={`${copy}-${r}`} className={`symbol reel-cell s${sym} ${phase!=='rolling'&&frame.hits.includes(i)?'winning':''}`}><span>{game.id==='pharaoh'?<PharaohSymbol index={sym}/>:game.symbols[sym]}</span>{sym===7?<small>{english?'SCATTER':'SCATTER'}</small>:sym===6&&game.type!=='cluster'?<small>WILD</small>:null}{(frame.mult[i]||0)>1&&<b>×{frame.mult[i]}</b>}</div>}))}</div></div>)}</div>
   {game.type==='classic'&&<><div className="payline-guide"/><div className="cabinet-label">3 REELS · {game.paylines} PAYLINES · {english?'SANTY CLASSICS':'SANTY KLASIKA'}</div></>}
   {phase==='idle'&&frame.lines?.length?<svg className="winning-lines" viewBox={`0 0 ${game.cols*100} ${game.rows*100}`} preserveAspectRatio="none" aria-hidden="true">{frame.lines.map((line,k)=><polyline key={k} points={line.map(i=>`${(i%game.cols)*100+50},${Math.floor(i/game.cols)*100+50}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="3"/>)}</svg>:null}
  </div>
  {rail('right')}
 </div>;
});
