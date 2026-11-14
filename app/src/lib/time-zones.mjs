import {TIME_ZONE_DATA as data} from './time-zone-data.mjs';
export const TIME_ZONE_VERSION=data.version;
export function zoneState(at,zone){
 const rows=data.zones[zone],seconds=Math.floor(at/1000);
 if(!rows||!Number.isFinite(seconds)||seconds<data.start||seconds>=data.end)return null;
 let lo=0,hi=rows.length;while(lo+1<hi){const mid=(lo+hi)>>1;if(rows[mid][0]<=seconds)lo=mid;else hi=mid;}
 const row=rows[lo];return{offset:row[1],daylight:row[2],abbreviation:row[3],since:row[0]*1000};
}
export function nextClockChange(at,zone){
 const current=zoneState(at,zone);if(!current)return null;
 const row=data.zones[zone].find(r=>r[0]*1000>at&&r[1]!==current.offset);
 return row?{at:row[0]*1000,before:current.offset,after:row[1],daylight:row[2],abbreviation:row[3]}:null;
}
export function zoneOffset(at,zone){
 const known=zoneState(at,zone);if(known)return known.offset;
 const text=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'longOffset'}).formatToParts(at).find(p=>p.type==='timeZoneName').value;
 const match=text.match(/GMT(?:([+-])(\d{1,2}):(\d{2}))?$/);if(!match)throw Error('Time-zone offset unavailable');
 return match[1]?(match[1]==='-'?-1:1)*(Number(match[2])*60+Number(match[3])):0;
}
export function utcOffset(value){return value===0?'UTC':`UTC${value<0?'−':'+'}${String(Math.floor(Math.abs(value)/60)).padStart(2,'0')}:${String(Math.abs(value)%60).padStart(2,'0')}`;}
// Format the wall-clock instant in UTC so host ICU cannot apply obsolete zone rules.
const formats=new Map();
export function zonedFormatter(zone,options){
 const key=JSON.stringify(options);if(!formats.has(key))formats.set(key,new Intl.DateTimeFormat('en-US',{...options,timeZone:'UTC'}));
 const f=formats.get(key),shift=at=>at+zoneOffset(at,zone)*60000;
 return{format:at=>f.format(shift(at)),formatToParts:at=>f.formatToParts(shift(at))};
}
const names={
 'America/New_York':['Eastern Standard Time','Eastern Daylight Time'], 'America/Toronto':['Eastern Standard Time','Eastern Daylight Time'],
 'America/Los_Angeles':['Pacific Standard Time','Pacific Daylight Time'], 'America/Chicago':['Central Standard Time','Central Daylight Time'],
 'America/Vancouver':['Pacific Time','Pacific Time'], 'America/Mexico_City':['Central Standard Time','Central Daylight Time'], 'America/Sao_Paulo':['Brasília Time','Brasília Summer Time'],
 'Europe/London':['Greenwich Mean Time','British Summer Time'],'Europe/Lisbon':['Western European Time','Western European Summer Time'],
 'Europe/Istanbul':['Türkiye Time','Türkiye Time'],'Africa/Cairo':['Eastern European Time','Eastern European Summer Time'],
 'Africa/Johannesburg':['South African Standard Time','South African Standard Time'],'Africa/Nairobi':['East Africa Time','East Africa Time'],
 'Asia/Shanghai':['China Standard Time','China Daylight Time'],'Asia/Hong_Kong':['Hong Kong Time','Hong Kong Summer Time'],
 'Asia/Singapore':['Singapore Standard Time','Singapore Standard Time'],'Asia/Manila':['Philippine Standard Time','Philippine Daylight Time'],
 'Asia/Tokyo':['Japan Standard Time','Japan Daylight Time'],'Asia/Seoul':['Korea Standard Time','Korea Daylight Time'],
 'Asia/Bangkok':['Indochina Time','Indochina Time'],'Asia/Dubai':['Gulf Standard Time','Gulf Standard Time'],
 'Asia/Kolkata':['India Standard Time','India Standard Time'],'Asia/Kathmandu':['Nepal Time','Nepal Time'],
 'Australia/Sydney':['Australian Eastern Standard Time','Australian Eastern Daylight Time'],
 'Australia/Adelaide':['Australian Central Standard Time','Australian Central Daylight Time'],
 'Pacific/Auckland':['New Zealand Standard Time','New Zealand Daylight Time']
};
export function timeZoneName(at,zone,long=false){
 const state=zoneState(at,zone);
 if(!state)return new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:long?'long':'short'}).formatToParts(at).find(p=>p.type==='timeZoneName').value;
 if(long)return (names[zone]||['Central European Time','Central European Summer Time'])[state.daylight?1:0];
 if(zone==='America/Vancouver'&&at>=Date.parse('2026-11-01T09:00:00Z'))return 'Pacific Time';
 return /^[+-]/.test(state.abbreviation)?utcOffset(state.offset):state.abbreviation;
}
