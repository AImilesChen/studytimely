import test from 'node:test';
import assert from 'node:assert/strict';
import {CITIES,clockText,difference,offsetMinutes,offsetText,parts,dayDifference,searchCities} from '../src/lib/world-clock.mjs';
test('Los Angeles offsets follow winter and summer and the spring-forward transition',()=>{
 assert.equal(offsetText(Date.parse('2026-01-15T12:00Z'),'America/Los_Angeles'),'UTC−08:00');
 assert.equal(offsetText(Date.parse('2026-07-15T12:00Z'),'America/Los_Angeles'),'UTC−07:00');
 assert.equal(clockText(Date.parse('2026-03-08T09:59:00Z'),'America/Los_Angeles',true),'01:59');
 assert.equal(clockText(Date.parse('2026-03-08T10:00:00Z'),'America/Los_Angeles',true),'03:00');
});
test('half-hour, quarter-hour and date-boundary differences remain correct',()=>{
 const at=Date.parse('2026-11-13T23:45:00Z');
 assert.equal(offsetMinutes(at,'Asia/Kolkata'),330);assert.equal(offsetMinutes(at,'Asia/Kathmandu'),345);
 assert.equal(difference(at,'Asia/Kathmandu','Europe/London'),'5h 45m ahead');
 assert.equal(dayDifference(at,'Australia/Sydney','Europe/London'),1);
 assert.equal(dayDifference(Date.parse('2026-11-13T01:00Z'),'America/Los_Angeles','Europe/London'),-1);
 assert.equal(dayDifference(Date.parse('2026-11-13T11:30Z'),'Pacific/Auckland','Etc/GMT+12'),2);
 assert.equal(parts(Date.parse('2026-11-13T00:00Z'),'Europe/London',true).hour,'00');
 assert.equal(clockText(Date.parse('2026-11-13T00:00Z'),'Europe/London',false),'12:00 AM');
});
test('different DST change dates affect the actual difference, not a fixed city offset',()=>{
 assert.equal(difference(Date.parse('2026-03-15T12:00Z'),'America/New_York','Europe/London'),'4h behind');
 assert.equal(difference(Date.parse('2026-04-15T12:00Z'),'America/New_York','Europe/London'),'5h behind');
});
test('all cities format using valid IANA zones and search handles accents and regions',()=>{
 for(const c of CITIES)assert.doesNotThrow(()=>clockText(Date.now(),c.zone));
 assert.equal(new Set(CITIES.map(c=>c.slug)).size,CITIES.length);
 assert.equal(searchCities('sao paulo')[0].slug,'sao-paulo');
 assert.equal(searchCities('United States','Europe').length,0);
 assert.equal(searchCities('Los Angeles')[0].zone,'America/Los_Angeles');
 assert.equal(searchCities('not a real city').length,0);
});
