export const COMMUNITY={maxRooms:3,maxMemberships:10,maxCapacity:24,maxMessage:500,heartbeatMs:30000,maxHeartbeatGapMs:90000,checkInMs:25*60000,dailyCapSeconds:8*3600};
export const utcDay=at=>new Date(at).toISOString().slice(0,10);
export function weekStart(at){const d=new Date(at);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return utcDay(+d);}
export function cleanText(value,{min=1,max=80,label='Text'}={}){
 if(typeof value!=='string')throw Error(`${label} is required.`);const text=value.trim().normalize('NFC');
 if([...text].length<min||[...text].length>max||/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(text))throw Error(`${label} must contain ${min}–${max} characters, without control characters.`);return text;
}
export function nickname(value){const text=cleanText(value,{min:2,max:30,label:'Nickname'});if(/[\n\t@]|https?:|www\./i.test(text))throw Error('Use a nickname, not an email or website.');return text;}
export function roomInput(input){const name=cleanText(input.name,{min:2,max:60,label:'Room name'}),capacity=Number(input.capacity),goalMinutes=Number(input.goalMinutes);if(/[\n\t]/.test(name)||!['public','private'].includes(input.visibility)||!Number.isInteger(capacity)||capacity<2||capacity>COMMUNITY.maxCapacity||!Number.isInteger(goalMinutes)||goalMinutes<1||goalMinutes>11520)throw Error('Choose a public/private room, 2–24 members and a daily room goal of 1–11,520 minutes.');return{name,visibility:input.visibility,capacity,goalMinutes};}
export function creditWindow(timer,at){
 const elapsed=at-timer.last_at;
 if(timer.status!=='running')return{seconds:0,needsCheck:timer.status==='check',segments:[]};
 // A disconnected client cannot claim its unobserved gap on reconnect.
 if(elapsed<0||elapsed>COMMUNITY.maxHeartbeatGapMs)return{seconds:0,needsCheck:true,segments:[]};
 const end=Math.min(at,timer.check_at),start=timer.last_at,total=Math.max(0,Math.floor((end-start)/1000)),segments=[];
 let cursor=start,remaining=total;
 while(remaining>0){const d=new Date(cursor);d.setUTCHours(24,0,0,0);const seconds=Math.min(remaining,Math.ceil((+d-cursor)/1000));if(seconds<=0)break;segments.push({day:utcDay(cursor),seconds});remaining-=seconds;cursor+=seconds*1000;}
 return{seconds:total,needsCheck:at>=timer.check_at,segments};
}
export function communityRules(){return 'Only the server-checked room timer counts. One active timer per account across tabs/devices; heartbeat gaps over 90 seconds are not credited. Check in every 25 minutes. Maximum 8 credited hours per UTC day. Local/imported study history never changes rankings. Today and Monday–Sunday weeks use UTC. Public rankings are optional. These checks reduce abuse; they cannot prove attention or prevent every bot.';}
