const lifetime=600000,resumeKey='studytimely-my-groups-return';
const store=()=>{try{return window.sessionStorage;}catch{return null;}};
export function readGroupDraft(accountId,storage=store(),now=Date.now()){
 try{const value=JSON.parse(storage?.getItem('studytimely-group-draft:'+(accountId||'guest'))||'null');return value&&value.expires>now&&value.expires<=now+lifetime?{invite:String(value.invite||'').slice(0,500),name:String(value.name||'').slice(0,60),subject:['general','maths','science','languages','humanities','coding','writing','exam'].includes(value.subject)?value.subject:'general',visibility:value.visibility==='public'?'public':'private'}:{invite:'',name:'',subject:'general',visibility:'private'};}catch{return{invite:'',name:'',subject:'general',visibility:'private'};}
}
export function writeGroupDraft(accountId,values,storage=store(),now=Date.now()){
 try{storage?.setItem('studytimely-group-draft:'+(accountId||'guest'),JSON.stringify({invite:String(values.invite||'').slice(0,500),name:String(values.name||'').slice(0,60),subject:values.subject,visibility:values.visibility,expires:now+lifetime}));}catch{}
}
export function rememberGroupsReturn(accountId,roomId,storage=store(),now=Date.now()){
 try{storage?.setItem(resumeKey,JSON.stringify({accountId:accountId||'guest',roomId:roomId||'',expires:now+lifetime}));}catch{}
}
export function readGroupsReturn(accountId,storage=store(),now=Date.now()){
 try{const value=JSON.parse(storage?.getItem(resumeKey)||'null');if(value&&value.expires>now&&value.expires<=now+lifetime&&(value.accountId==='guest'||value.accountId===accountId))return value;}catch{}return null;
}
export function clearGroupsReturn(storage=store()){try{storage?.removeItem(resumeKey);}catch{}}
