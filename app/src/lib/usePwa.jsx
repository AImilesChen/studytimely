import {useEffect,useRef,useState} from 'react';
export function usePwa(){
 const [installPrompt,setInstallPrompt]=useState(null),[ready,setReady]=useState(false),[update,setUpdate]=useState(false),[online,setOnline]=useState(true),[error,setError]=useState('');
 const registration=useRef(null),applying=useRef(false);
 useEffect(()=>{
  if(!('serviceWorker'in navigator)||import.meta.env.DEV)return;let disposed=false;
  const changed=()=>setOnline(navigator.onLine),prompt=e=>{e.preventDefault();setInstallPrompt(e);},installed=()=>setInstallPrompt(null),controller=()=>{if(applying.current)location.reload();};
  changed();window.addEventListener('online',changed);window.addEventListener('offline',changed);window.addEventListener('beforeinstallprompt',prompt);window.addEventListener('appinstalled',installed);navigator.serviceWorker.addEventListener('controllerchange',controller);
  navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(async r=>{
   if(disposed)return;registration.current=r;if(r.waiting)setUpdate(true);
   r.addEventListener('updatefound',()=>{const installing=r.installing;installing?.addEventListener('statechange',()=>{if(installing.state==='installed'&&navigator.serviceWorker.controller&&!disposed)setUpdate(true);});});
   await navigator.serviceWorker.ready;if(!disposed)setReady(true);
  }).catch(()=>{if(!disposed)setError('Offline setup is unavailable. The open timer still works; keep a backup of your records.');});
  return()=>{disposed=true;window.removeEventListener('online',changed);window.removeEventListener('offline',changed);window.removeEventListener('beforeinstallprompt',prompt);window.removeEventListener('appinstalled',installed);navigator.serviceWorker.removeEventListener('controllerchange',controller);};
 },[]);
 async function install(){if(!installPrompt)return;await installPrompt.prompt();await installPrompt.userChoice;setInstallPrompt(null);}
 function applyUpdate(){if(registration.current?.waiting){applying.current=true;registration.current.waiting.postMessage({type:'APPLY_UPDATE'});}}
 return{ready,update,online,error,canInstall:!!installPrompt,install,applyUpdate};
}
