from pathlib import Path
p=Path('app/page.tsx'); s=p.read_text(encoding='utf-8-sig')
a=s.index('function Art('); b=s.index('export default function Home')
art=s[a:b].replace('function Art(', 'function BaseArt(')
Path('components/game/GameArt.tsx').write_text(art,encoding='utf-8')
s=s[:a]+s[b:]
s=s.replace("import {games,bets} from '../lib/games';", "import {games,bets,config,type Frame,type Game} from '../lib/games';\nimport {gameRequest} from '../lib/api';\nimport Art from '../components/game/GameArt';\nimport ReelBoard,{type Phase} from '../components/game/ReelBoard';\nimport PulseRunner from '../components/game/PulseRunner';\nimport GameRules from '../components/game/GameRules';")
s=s.replace('Check,Orbit,Anchor,Menu','Check')
s=s.replace("const fmt=(n:number)=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(n/100);", "const formatter=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2});\nconst fmt=(n:number)=>formatter.format(n/100);\nconst wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));")
s=s.replace("[game,setGame]=useState<any>(null)","[game,setGame]=useState<Game|null>(null)")
s=s.replace("[frame,setFrame]=useState<any>(null)","[frame,setFrame]=useState<Frame|null>(null)")
s=s.replace('[miniTick,setMiniTick]=useState(0)',"[phase,setPhase]=useState<Phase>('idle'),[serverOffset,setServerOffset]=useState(0)")
s=s.replace('function apply(d:any){dataRef.current=d;setData(d);}',"function apply(d:any){if(dataRef.current&&d.player.version<dataRef.current.player.version)return;dataRef.current=d;setData(d);if(d.serverTime)setServerOffset(d.serverTime-Date.now());}")
start=s.index('async function refresh()');end=s.index('useEffect(()=>{if(!toast)',start)
s=s[:start]+'''async function refresh(){try{const d=await gameRequest();apply(d);setError('');}catch(e:any){setError(e.message);}}
useEffect(()=>{refresh();const t=setInterval(()=>{if(!lock.current&&!document.hidden)refresh();},15000);const hide=()=>{if(document.hidden)setAuto(0);};document.addEventListener('visibilitychange',hide);return()=>{clearInterval(t);document.removeEventListener('visibilitychange',hide);};},[]);
useEffect(()=>{try{const prefs=JSON.parse(localStorage.getItem('santyslots:prefs')||'{}');setTurbo(!!prefs.turbo);setSound(!!prefs.sound);}catch{}},[]);
useEffect(()=>{try{localStorage.setItem('santyslots:prefs',JSON.stringify({turbo,sound}));}catch{}},[turbo,sound]);
useEffect(()=>{if(!modal)return;const previous=document.activeElement as HTMLElement;const box=document.querySelector<HTMLElement>('.modal');box?.focus();const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab'||!box)return;const list=Array.from(box.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href],[tabindex="0"]'));if(!list.length)return;const first=list[0],last=list[list.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===box)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};document.addEventListener('keydown',trap);return()=>{document.removeEventListener('keydown',trap);previous?.focus();};},[modal]);
''' +s[end:]
start=s.index('async function action(');end=s.index('function beep(',start)
s=s[:start]+'''async function action(action:string,extra:any={}){try{return await gameRequest({action,version:dataRef.current?.player.version,...extra});}catch(e){await refresh();throw e;}}
'''+s[end:]
s=s.replace('function openGame(g:any)', 'function openGame(g:Game)').replace('setGame(g);setFrame','setPhase(\'idle\');setGame(g);setFrame')
start=s.index('async function spin()');end=s.index('useEffect(()=>{if(auto>0',start)
s=s[:start]+'''async function spin(){if(lock.current||!game)return;lock.current=true;setBusy(true);setPhase('rolling');setLastWin(0);setError('');const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;try{const [d]=await Promise.all([action('spin',{game:game.id,bet}),wait(reduced?0:turbo?180:800)]);beep();setFrame(d.frames[0]);setPhase('settling');await wait(reduced?0:turbo?120:650);for(let i=0;i<d.frames.length;i++){if(i){setPhase('cascade');setFrame(d.frames[i]);}if(d.frames[i].win)beep(true);await wait(reduced?0:turbo?90:d.frames[i].hits.length?420:80);}setPhase('idle');apply(d);setLastWin(d.total);if(d.triggered)setToast(`BONUS! Získáváš ${config.bonus.freeSpins} free spinů.`);if(d.bonusFinished!==undefined)setToast('Bonus dokončen! Celkem '+fmt(d.bonusFinished)+' kreditů.');if(autoRef.current>0)setAuto(n=>Math.max(0,n-1));}catch(e:any){setError(e.message);setAuto(0);setPhase('idle');}finally{lock.current=false;setBusy(false);}}
''' +s[end:]
s=s.replace("if(e.key==='Escape'&&!lock.current){setModal('');setAuto(0);setGame(null);}","if(e.key==='Escape'&&!lock.current){setAuto(0);if(modal)setModal('');else setGame(null);}")
start=s.index("useEffect(()=>{if(modal!=='mini'");end=s.index('async function simple',start);s=s[:start]+s[end:]
s=s.replace('setBusy(true);try{const d=await action(act','setBusy(true);setError(\'\');try{const d=await action(act')
s=s.replace('href="/"','href="./"').replace('<aside className="sidebar">','<aside className="sidebar" inert={!!modal||!!game}>').replace('<div className="main-wrap">','<div className="main-wrap" inert={!!modal||!!game}>')
s=s.replace('className="nav-count">3','className="nav-count">{games.length}').replace('3 originální hry','{games.length} originálních her').replace('<span>03</span>','<span>{String(games.length).padStart(2,\'0\')}</span>')
s=s.replace('Chyť krystaly v minihře','Tref neónový puls v minihře').replace('Crystal Catch','Pulse Runner').replace('<strong>180 kreditů</strong>','<strong>{config.miniGame.rounds*config.miniGame.perfectReward} kreditů</strong>')
s=s.replace('<span><ShieldCheck size={13}/> Vlastní témata', '<button className={filter===\'classic\'?\'selected\':\'\'} onClick={()=>setFilter(\'classic\')}>Klasické automaty</button><span><ShieldCheck size={13}/> Vlastní témata')
s=s.replace("g.id==='crystal'?'✦ OBLÍBENÉ':g.id==='ocean'?'COLLECT BONUS':'WILD ×5'", "g.type==='classic'?'NEW · CLASSIC REELS':g.id==='crystal'?'✦ OBLÍBENÉ':g.id==='ocean'?'COLLECT BONUS':'WILD ×5'")
s=s.replace("{g.name.split(' ')[1]}","{g.name.split(' ').slice(1).join(' ')}")
s=s.replace("className={'game-overlay '+game.id}","className={'game-overlay '+game.id+' '+game.type} inert={!!modal}")
s=s.replace(":'10 výherních linií · Wild nahrazuje běžné symboly'", ":game.type==='classic'?'3 VÁLCE · 5 LINIÍ · KLASICKÝ AUTOMAT':'10 výherních linií · Wild nahrazuje běžné symboly'")
s=s.replace('<span>10 FREE SPINŮ</span>','<span>{config.bonus.freeSpins} FREE SPINŮ</span>').replace('<span>15 FREE SPINŮ</span>','<span>{config.bonus.superFreeSpins} FREE SPINŮ</span>')
a=s.index("<div className={'reel-frame '");b=s.index('<aside className="game-decoration">',a);s=s[:a]+'<ReelBoard game={game} frame={frame} phase={phase} turbo={turbo}/>'+s[b:]
s=s.replace('MAX. VÝHRA 5 000×','MAX. VÝHRA {config.maxWinMultiplier.toLocaleString(\'cs-CZ\')}×')
s=s.replace('<div className="game-controls">','<div className={\'spin-result \'+(lastWin>0?\'has-win\':\'\')} aria-live="polite">{phase===\'rolling\'?\'ROZTÁČÍME…\':lastWin>0?`VÝHRA +${fmt(lastWin)} kr.`:data?.bonus?.game===game.id?`FREE SPINY: ${data.bonus.left}`:\'TVŮJ DALŠÍ MOMENT ČEKÁ\'}</div><div className="game-controls">')
s=s.replace('bet===1','bet===bets[0]').replace('bet===50','bet===bets[bets.length-1]')
s=s.replace('Math.min(bets.length-1,bets.indexOf(bet)+1)','Math.min(bets.length-1,bets.indexOf(bet)+1)')
s=s.replace('role="dialog" aria-modal="true"','role="dialog" tabIndex={-1} aria-modal="true"')
a=s.index("{modal==='mini'?<>");b=s.index("modal==='profile'?",a)
s=s[:a]+"{modal==='mini'?<PulseRunner mini={data?.mini} reward={miniReward} busy={busy} ready={!!data} serverOffset={serverOffset} onStart={()=>{setMiniReward(null);simple('miniStart');}} onHit={()=>simple('miniHit')}/>:"+s[b:]
s=s.replace("{modal==='super'?'15':'10'}", "{modal==='super'?config.bonus.superFreeSpins:config.bonus.freeSpins}")
s=s.replace("'Wild násobí výhry ×5.'", "`Wild násobí výhry ×${config.games[game!.id].bonusWildMultiplier}.`")
a=s.index("modal==='rules'?<>");b=s.index('<><div className="modal-icon"><ShieldCheck',a)
s=s[:a]+"modal==='rules'&&game?<GameRules game={game}/>:"+s[b:]
s=s.replace('Tři vlastní automaty','Pět vlastních automatů').replace('Pulse Runner odměňuje rychlé zásahy','Pulse Runner odměňuje přesné načasování')
s=s.replace('Tento prohlížeč si tě pamatuje pomocí cookie; přihlášený účet funguje i na dalších zařízeních.','Na GitHub Pages je přístupový klíč uložen v tomto prohlížeči. Smazáním dat webu ztratíš přístup k anonymnímu účtu. Na původním webu funguje přihlášení a cookie.')
s=s.replace('Účet bez přihlášení je vázán na cookie prohlížeče. Její smazání znamená ztrátu přístupu k anonymnímu účtu. S přihlášením se používá účet návštěvníka.','Na GitHub Pages si prohlížeč pamatuje klíč účtu v místním úložišti. Zůstatek i výsledky jsou na serveru. Smazáním úložiště ztratíš přístup k anonymnímu účtu. Původní web používá cookie nebo přihlášení.')
# Surface persisted bonuses in the lobby, including after a reload.
s=s.replace('<section className="earn-banner">', '''{data?.bonus&&<button className="resume-bonus" onClick={()=>openGame(games.find(g=>g.id===data.bonus.game)!)}><Zap size={18}/><span>Rozehraný bonus · {games.find(g=>g.id===data.bonus.game)?.name} · {data.bonus.left} free spinů</span><ArrowRight size={18}/></button>}<section className="earn-banner">''')
# TS narrows game inside the overlay, but not in the modal's ternary.
s=s.replace("modal==='bonus'||modal==='super'?", "(modal==='bonus'||modal==='super')&&game?")
p.write_text(s,encoding='utf-8')
