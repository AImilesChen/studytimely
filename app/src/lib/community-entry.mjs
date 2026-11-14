export const COMMUNITY_ENTRY_KEY='studytimely-community-entry';
const lifetime=10*60*1000;
export function invitationCode(value,origin='https://studytimely.com'){
 const text=String(value||'').trim();
 if(/^[A-Za-z0-9_-]{12,80}$/.test(text))return text;
 try{
  const url=new URL(text),allowed=new Set(['https://studytimely.com',new URL(origin).origin]);
  const code=url.searchParams.get('invite');
  if(!allowed.has(url.origin)||url.username||url.password||url.hash||url.pathname.replace(/\/$/,'')!=='/study-groups'||url.searchParams.getAll('invite').length!==1||!/^[A-Za-z0-9_-]{12,80}$/.test(code||''))throw Error();
  return code;
 }catch{throw Error('Paste a valid invitation code or a StudyTimely invitation link.');}
}
export function studyAgenda({topic,focusMinutes,breakMinutes}){
 const title=String(topic||'').replace(/[\r\n\t]/g,' ').trim(),focus=Number(focusMinutes),rest=Number(breakMinutes);
 if(!title||title.length>80)throw Error('Add a study topic of 1–80 characters.');
 if(!Number.isInteger(focus)||focus<5||focus>120||!Number.isInteger(rest)||rest<1||rest>30)throw Error('Choose 5–120 minutes of study and a 1–30 minute break.');
 return {title,total:focus+rest+5,text:[title,'2 min · Check in: each person chooses one task.',`${focus} min · Study quietly on your own task.`,'3 min · Check out: share what you completed.',`${rest} min · Take a break and decide whether to continue.`].join('\n')};
}
export function readCommunityEntry(storage,now=Date.now()){
 try{
  const data=JSON.parse(storage.getItem(COMMUNITY_ENTRY_KEY)||'null');
  if(!data||!['create','join'].includes(data.action)||!Number.isFinite(data.expires)||data.expires<=now||data.expires>now+lifetime){storage.removeItem(COMMUNITY_ENTRY_KEY);return null;}
  return {action:data.action,expires:data.expires,...(typeof data.topic==='string'?{topic:data.topic.replace(/[\r\n\t]/g,' ').trim().slice(0,60)}:{}),...(typeof data.code==='string'&&/^[A-Za-z0-9_-]{12,80}$/.test(data.code)?{code:data.code}:{}),...(/^[a-f0-9-]{36}$/.test(data.roomId||'')?{roomId:data.roomId}:{})};
 }catch{return null;}
}
export function saveCommunityEntry(storage,{action,topic,code,roomId},now=Date.now()){
 try{
  if(!['create','join'].includes(action))return false;
  storage.setItem(COMMUNITY_ENTRY_KEY,JSON.stringify({action,expires:now+lifetime,...(topic?{topic:String(topic).slice(0,60)}:{}),...(code?{code}:{}),...(roomId?{roomId}:{} )}));return true;
 }catch{return false;}
}
export function clearCommunityEntry(storage){try{storage.removeItem(COMMUNITY_ENTRY_KEY);}catch{}}
