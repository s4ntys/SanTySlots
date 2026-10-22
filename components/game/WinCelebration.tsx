'use client';
import {useEffect,useState} from 'react';
export default function WinCelebration({amount,english,level,onSkip}:{amount:number;english:boolean;level:string;onSkip:()=>void}){
 const [shown,setShown]=useState(0);
 useEffect(()=>{let frame=0;let start=0;const tick=(now:number)=>{if(!start)start=now;const p=Math.min(1,(now-start)/1850);const eased=1-Math.pow(1-p,3);setShown(Math.round(amount*eased));if(p<1)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[amount]);
 return <button className={`big-win ${level}`} onClick={onSkip} aria-label={english?'Skip win animation':'Preskočiť animáciu výhry'}><span className="win-rays"/><span className="win-caption">SANTY SLOTS · {english?'BIG WIN':'VEĽKÁ VÝHRA'}</span><strong>{level==='epic'?'EPIC WIN':level==='mega'?'MEGA WIN':'BIG WIN'}</strong><b>+{new Intl.NumberFormat(english?'en-US':'sk-SK').format(shown/100)} <small>{english?'credits':'kreditov'}</small></b><span className="skip-win">{english?'Click anywhere to continue':'Kliknutím pokračuj'}</span>{Array.from({length:32},(_,i)=><i className="coin" key={i} style={{left:`${(i*37)%100}%`,animationDelay:`${(i%9)*.15}s`}}/>)}</button>
}
