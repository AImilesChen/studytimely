export function calculateStudy({minutes,days,weeks,session,rest}){
 for(const [k,v,max]of [['minutes',minutes,1440],['days',days,7],['weeks',weeks,520],['session',session,240],['rest',rest,120]])if(!Number.isInteger(v)||v<(k==='rest'?0:1)||v>max)throw Error(`Choose a valid whole number for ${k}.`);
 const sessionsPerDay=Math.ceil(minutes/session),breakMinutesPerDay=Math.max(0,sessionsPerDay-1)*rest;
 return{weeklyStudyMinutes:minutes*days,totalStudyMinutes:minutes*days*weeks,sessionsPerDay,breakMinutesPerDay,totalScheduledMinutes:(minutes+breakMinutesPerDay)*days*weeks};
}
