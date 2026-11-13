import {validateBackup} from './model.mjs';
import {mergeWorkspace} from './workspace.mjs';
export function mergeBackups(local,cloud){
 const a=validateBackup(local),b=validateBackup(cloud),workspace=mergeWorkspace(a.workspace,b.workspace);
 const records=new Map(b.sessions.map(s=>[s.id,s]));for(const s of a.sessions)records.set(s.id,s);
 const preference=!a.preferences?b.preferences:!b.preferences?a.preferences:a.preferences.updatedAt>=b.preferences.updatedAt?a.preferences:b.preferences;
 const subjects=[...a.subjects];for(const s of b.subjects)if(!subjects.some(v=>v.toLowerCase()===s.toLowerCase()))subjects.push(s);
 return{app:'StudyTimely',schema:1,subjects,dailyGoal:a.dailyGoal||b.dailyGoal,...(preference?{preferences:preference}:{}),sessions:[...records.values()].filter(s=>!Object.hasOwn(workspace.deletedSessions,s.id)).sort((x,y)=>y.endedAt-x.endedAt),workspace};
}
export async function accountRequest(path,{method='GET',data,csrf}={}){
 let response;try{response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{...(data!==undefined?{'Content-Type':'application/json'}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});}catch{throw Object.assign(Error('You appear to be offline. Local study data is still available.'),{code:'OFFLINE'});}
 let body;try{body=await response.json();}catch{throw Error('The account service could not be reached. Try again later.');}
 if(!response.ok)throw Object.assign(Error(body.error?.message||'The request could not be completed.'),{code:body.error?.code,status:response.status});return body;
}
