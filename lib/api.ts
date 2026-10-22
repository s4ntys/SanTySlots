// Pages supplies an absolute API URL. Sites uses its same-origin API.
let token: string | null = null;
const key = 'santyslots:account:v2';
export async function gameRequest(body?: Record<string,unknown>) {
  const endpoint=(window as Window & {SANTY_API?:string}).SANTY_API || '/api/game';
  const crossOrigin=new URL(endpoint,location.href).origin!==location.origin;
  const headers:Record<string,string>={};
  if(crossOrigin){headers['X-Santy-Client']='pages';if(token===null){try{token=localStorage.getItem(key);}catch{throw Error('Pro uložení účtu povol úložiště tohoto webu.');}}if(token)headers.Authorization='Bearer '+token;}
  if(body)headers['Content-Type']='application/json';
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const r=await fetch(endpoint,{method:body?'POST':'GET',headers,credentials:crossOrigin?'omit':'same-origin',body:body?JSON.stringify(body):undefined,signal:controller.signal});
    const d:any=await r.json();if(!r.ok)throw Error(d.error||'Server není dostupný.');
    if(d.token){token=d.token;localStorage.setItem(key,d.token);delete d.token;}
    return d;
  }catch(e){if(e instanceof Error&&e.name==='AbortError')throw Error('Server neodpověděl včas. Obnov účet; již zapsaný spin se neopakuje.');throw e;}finally{clearTimeout(timer);}
}
export async function socialRequest(body:Record<string,unknown>,admin=false){
  const root=(window as Window & {SANTY_API?:string}).SANTY_API || '';
  const base=root?new URL(root,location.href):new URL(location.origin);
  const endpoint=new URL(admin?'/api/admin':'/api/social',base).toString();
  const crossOrigin=new URL(endpoint).origin!==location.origin;
  const headers:Record<string,string>={'Content-Type':'application/json'};
  if(crossOrigin){headers['X-Santy-Client']='pages';try{const saved=localStorage.getItem(key);if(saved)headers.Authorization='Bearer '+saved;}catch{throw Error('Povol úložiště účtu v prohlížeči.');}}
  const r=await fetch(endpoint,{method:'POST',headers,credentials:crossOrigin?(admin?'include':'omit'):'same-origin',body:JSON.stringify(body)});const data:any=await r.json();if(!r.ok)throw Error(data.error||'Server není dostupný.');return data;
}
