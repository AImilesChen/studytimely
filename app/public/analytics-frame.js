// Created only after opt-in, destroyed on withdrawal or private-page navigation.
(() => {
 let initialized=false,id='',key='',lastPage='',ahrefsScript=null,pending=[];
 const paths=new Set(['/','/pomodoro-timer','/focus-timer','/flip-clock','/countdown-timer','/stopwatch','/study-tracker','/study-planner','/study-schedule-maker','/study-habit-tracker','/syllabus-tracker','/exam-countdown','/aesthetic-timer','/alarm-clock','/study-time-calculator']);
 const events=new Set(['timer_start','timer_pause','session_saved']),modes=new Set(['study','pomodoro','focus','countdown','stopwatch','clock']);
 function ahrefs(name,path,mode){if(!key)return;const item={name,path,mode};if(!window.AhrefsAnalytics){if(pending.length<20)pending.push(item);return;}ahrefsScript.setAttribute('data-page-location',location.origin+path);document.title='StudyTimely · '+path;window.AhrefsAnalytics.sendEvent(name,mode?{props:{mode}}:undefined);}
 function page(path){if(!paths.has(path)||path===lastPage)return;lastPage=path;if(id)gtag('event','page_view',{page_location:location.origin+path,page_title:'StudyTimely · '+path,page_referrer:''});ahrefs('pageview',path);}
 addEventListener('message',e=>{
  if(e.source!==parent||e.origin!==location.origin)return;const m=e.data;
  if(m?.type==='init'&&!initialized&&paths.has(m.path)){
   initialized=true;id=/^G-[A-Z0-9]+$/.test(m.id)?m.id:'';key=/^[A-Za-z0-9/+_-]{16,80}$/.test(m.ahrefsKey)?m.ahrefsKey:'';
   if(id){window.dataLayer=[];window.gtag=function(){dataLayer.push(arguments);};
    gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    gtag('js',new Date());gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,allow_user_provided_data:false,first_party_collection:false,cookie_domain:'none',cookie_path:'/',cookie_expires:2592000,cookie_update:false,page_location:location.origin+m.path,page_title:'StudyTimely · '+m.path,page_referrer:''});
    const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.append(script);
   }
   if(key){ahrefsScript=document.createElement('script');ahrefsScript.async=true;ahrefsScript.src='https://analytics.ahrefs.com/analytics.js';ahrefsScript.setAttribute('data-key',key);ahrefsScript.setAttribute('data-no-pageview-on-load','');ahrefsScript.setAttribute('data-no-pageview-auto','');ahrefsScript.setAttribute('data-page-location',location.origin+m.path);ahrefsScript.onload=()=>{const q=pending;pending=[];q.forEach(x=>ahrefs(x.name,x.path,x.mode));};document.head.append(ahrefsScript);}
   page(m.path);
  }else if(initialized&&m?.type==='page'){page(m.path);
  }else if(initialized&&m?.type==='event'&&lastPage&&events.has(m.name)&&modes.has(m.params?.mode)){if(id)gtag('event',m.name,{mode:m.params.mode,page_location:location.origin+lastPage,page_title:'StudyTimely · '+lastPage,page_referrer:''});ahrefs(m.name,lastPage,m.params.mode);}
 });
 parent.postMessage({type:'studytimely-analytics-ready'},location.origin);
})();
