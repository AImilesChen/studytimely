export function nextAlarm(value,now){
 if(!/^\d{2}:\d{2}(?::\d{2})?$/.test(value))throw Error('Choose a valid local time.');
 const [h,m,s=0]=value.split(':').map(Number);if(h>23||m>59||s>59)throw Error('Choose a valid local time.');
 const d=new Date(now);d.setHours(h,m,s,0);if(d.getTime()<=now)d.setDate(d.getDate()+1);
 if(d.getHours()!==h||d.getMinutes()!==m)throw Error('This local time does not exist on the selected day. Choose another time.');
 return d.getTime();
}
