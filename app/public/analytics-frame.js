// This browsing context exists only after explicit opt-in. Removing it on
// withdrawal destroys the SDK and its timers/listeners, not just its script tag.
(() => {
 let id='',lastPage='';const allowedPaths=new Set(['/','/pomodoro-timer','/focus-timer','/flip-clock','/countdown-timer','/stopwatch','/study-tracker','/privacy','/terms','/cookies']);
 const events=new Set(['timer_start','timer_pause','session_saved']),modes=new Set(['study','pomodoro','focus','countdown','stopwatch','clock']);
 addEventListener('message',e=>{
   if(e.source!==parent||e.origin!==location.origin)return;const m=e.data;
   if(m?.type==='init'&&!id&&/^G-[A-Z0-9]+$/.test(m.id)){
     id=m.id;window.dataLayer=[];window.gtag=function(){dataLayer.push(arguments);};
     gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
     gtag('js',new Date());gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:'none',cookie_path:'/',cookie_expires:2592000,cookie_update:false,page_location:location.origin+'/',page_referrer:''});
     const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.append(script);
   }else if(id&&m?.type==='page'&&allowedPaths.has(m.path)&&lastPage!==m.path){lastPage=m.path;gtag('event','page_view',{page_location:location.origin+m.path,page_referrer:''});
   }else if(id&&m?.type==='event'&&events.has(m.name)&&modes.has(m.params?.mode)){gtag('event',m.name,{mode:m.params.mode,page_location:location.origin+(lastPage||'/'),page_referrer:''});}
 });
 parent.postMessage({type:'studytimely-analytics-ready'},location.origin);
})();
