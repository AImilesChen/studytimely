import test from 'node:test';
import assert from 'node:assert/strict';
import {setupSubscribedCommunity as setupCommunity} from './helpers/community.mjs';
import {rankingWindow,rankingPage,rankingDuration,rankingStandings} from '../src/lib/leaderboard-model.mjs';
import {metadata} from '../src/lib/site.mjs';
import {createCommunityApi} from '../server/community.mjs';
import fs from 'node:fs/promises';

function credit(s,profileId,day,seconds){s.db.prepare('INSERT INTO community_daily(profile_id,day,seconds) VALUES(?,?,?)').run(profileId,day,seconds);}
async function publish(s,a,on=true,version=1){return s.call('/profile','PUT',{nickname:'Learner '+a.profileId.slice(0,5),publicRanking:on,version},a);}
test('leaderboard period boundaries use UTC calendar weeks and durations retain exact seconds',()=>{
 const sunday=Date.UTC(2026,10,15,23,59,59),week=rankingWindow('week',sunday);
 assert.equal(week.start,'2026-11-09');assert.equal(week.nextResetAt,Date.UTC(2026,10,16));
 assert.equal(rankingWindow('week',Date.UTC(2026,10,16)).start,'2026-11-16');
 assert.equal(rankingWindow('bad',sunday).period,'today');assert.equal(rankingWindow('streak',sunday).start,null);
 assert.equal(rankingDuration(0),'0 min');assert.equal(rankingDuration(59),'59 sec');assert.equal(rankingDuration(3661),'1h 1m 1s');
});
test('personal ranking is authenticated, private and cannot select another account by query',async()=>{
 const s=await setupCommunity();try{
  const a=await s.user('privateA'),b=await s.user('privateB'),legacy=await s.user('legacyRank',false);
  credit(s,a.profileId,'2026-11-13',1800);credit(s,b.profileId,'2026-11-13',600);
  assert.equal((await s.call('/leaderboard/me')).status,401);assert.equal((await s.call('/leaderboard/me','GET',undefined,legacy)).status,403);
  const own=await s.call('/leaderboard/me?profileId='+b.profileId,'GET',undefined,a);assert.equal(own.profile.id,a.profileId);assert.equal(own.score,1800);assert.equal(own.rank,null);assert.equal(own.profile.publicRanking,false);
  const publicList=await s.call('/leaderboard');assert.deepEqual(publicList.rows,[]);assert.equal(publicList.participants,0);assert.ok(!JSON.stringify(publicList).includes(a.profileId));
  const response=await createCommunityApi({now:()=>s.now})(new Request('https://study.test/api/community/leaderboard/me',{headers:{cookie:a.cookie}}),s.env);assert.match(response.headers.get('Cache-Control'),/no-store, private/);assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
  s.db.prepare('DELETE FROM community_profiles WHERE id=?').run(b.profileId);const unconfigured=await s.call('/leaderboard/me','GET',undefined,b);assert.equal(unconfigured.status,200);assert.equal(unconfigured.profile,null);assert.equal(unconfigured.rank,null);
 }finally{s.close();}
});
test('exact rank beyond Top100 and tied competition ranks use the full opted-in population',async()=>{
 const s=await setupCommunity();try{
  const own=await s.user('outsideTop');credit(s,own.profileId,'2026-11-13',60);await publish(s,own);
  const insertAccount=s.db.prepare('INSERT INTO accounts(id,email,google_sub,created_at) VALUES(?,?,?,?)'),insertProfile=s.db.prepare('INSERT INTO community_profiles(id,account_id,nickname,public_ranking,accepted_at,created_at) VALUES(?,?,?,?,?,?)');
  for(let i=0;i<105;i++){const id=crypto.randomUUID(),profileId=crypto.randomUUID();insertAccount.run(id,`synthetic${i}@example.invalid`,'synthetic-'+id,s.now);insertProfile.run(profileId,id,'Synthetic '+i,1,s.now,s.now);credit(s,profileId,'2026-11-13',i<2?1000:1000-i);}
  const list=await s.call('/leaderboard'),me=await s.call('/leaderboard/me','GET',undefined,own);
  assert.equal(list.rows.length,100);assert.equal(list.participants,106);assert.deepEqual(list.rows.slice(0,3).map(r=>r.rank),[1,1,3]);assert.equal(me.rank,106);assert.equal(me.score,60);assert.ok(!list.rows.some(r=>r.id===own.profileId));assert.ok(!JSON.stringify(list).includes('email'));
 }finally{s.close();}
});
test('weekly totals, pending-today streaks, missed days and opt-out match the public board',async()=>{
 const s=await setupCommunity();try{
  s.setTime(Date.UTC(2026,10,16,12));const a=await s.user('weeklyRank'),b=await s.user('streakRank');await publish(s,a);await publish(s,b);
  for(const [day,seconds] of [['2026-11-13',120],['2026-11-14',60],['2026-11-15',59],['2026-11-16',90]])credit(s,a.profileId,day,seconds);
  for(const day of ['2026-11-13','2026-11-14','2026-11-15'])credit(s,b.profileId,day,60);
  const weekly=await s.call('/leaderboard?period=week'),own=await s.call('/leaderboard/me?period=week','GET',undefined,a);assert.equal(own.score,90);assert.equal(weekly.rows.find(r=>r.id===a.profileId).score,90);
  const streak=await s.call('/leaderboard/me?period=streak','GET',undefined,b);assert.equal(streak.score,3);assert.equal(streak.rank,1);assert.equal((await s.call('/leaderboard/me?period=streak','GET',undefined,a)).score,1);
  credit(s,b.profileId,'2026-11-16',60);assert.equal((await s.call('/leaderboard/me?period=streak','GET',undefined,b)).score,4);
  s.db.prepare('INSERT INTO community_rank_history(day,profile_id,rank,seconds) VALUES(?,?,?,?)').run('2026-11-15',b.profileId,1,60);
  assert.equal((await s.call('/leaderboard/me','GET',undefined,b)).history.length,1);assert.equal((await publish(s,b,false,2)).status,200);
  const off=await s.call('/leaderboard/me?period=streak','GET',undefined,b);assert.equal(off.score,4);assert.equal(off.rank,null);assert.deepEqual(off.history,[]);assert.ok(!(await s.call('/leaderboard?period=streak')).rows.some(r=>r.id===b.profileId));
 }finally{s.close();}
});
test('search and pagination do not invent ranks or expand beyond the provided Top100',()=>{
 const rows=Array.from({length:45},(_,i)=>({nickname:'Reader '+i,rank:i+20}));assert.equal(rankingPage(rows,'',3).rows.length,5);assert.equal(rankingPage(rows,'Reader 44',3).page,1);assert.equal(rankingPage(rows,'Reader 44').rows[0].rank,64);assert.equal(rankingPage(rows,'absent').total,0);
});
test('podium and following pages cover every participant once while search includes leaders',()=>{
 const rows=Array.from({length:100},(_,i)=>({id:String(i),nickname:'Reader '+String(i+1).padStart(3,'0'),rank:i+1}));
 const first=rankingStandings(rows);assert.equal(first.rows[0].rank,4);assert.equal(first.total,97);assert.equal(first.pages,5);
 const following=Array.from({length:first.pages},(_,i)=>rankingStandings(rows,'',i+1).rows).flat();
 assert.deepEqual([...rows.slice(0,3),...following],rows);assert.equal(new Set(following.map(r=>r.id)).size,97);
 const leaderSearch=rankingStandings(rows,'reader 001',5);assert.equal(leaderSearch.searching,true);assert.equal(leaderSearch.page,1);assert.equal(leaderSearch.rows[0].rank,1);
 assert.equal(rankingStandings(rows,'missing').total,0);assert.equal(rankingStandings(rows,'  ').rows[0].rank,4);
 for(let n=0;n<=3;n++){const few=rows.slice(0,n);assert.equal(rankingStandings(few).total,0);assert.equal(rankingStandings(few).rows.length,0);assert.equal(rankingStandings(few,'reader').total,n);}
});
test('continuation skips people already showcased, not rank numbers, including ties beyond the podium',()=>{
 const rows=[1,1,1,1,5,6].map((rank,i)=>({id:String(i),nickname:'Tied reader '+i,rank}));
 const view=rankingStandings(rows);assert.deepEqual(view.rows.map(r=>r.rank),[1,5,6]);assert.equal(view.rows[0].id,'3');
 assert.deepEqual(rankingStandings(rows,'tied reader 0').rows.map(r=>r.rank),[1]);
 assert.deepEqual(rows.map(r=>r.rank),[1,1,1,1,5,6]);
});
test('leaderboard public guide metadata is indexable only in the configured release environment',()=>{
 const m=metadata('/leaderboard',{origin:'https://studytimely.com',indexable:true});assert.equal(m.robots,'index,follow');assert.equal(m.breadcrumb.itemListElement[1].name,'Leaderboard');assert.match(m.title,/Study Time & Streaks/);assert.equal(m.schema['@type'],'WebPage');assert.equal(metadata('/leaderboard',{origin:'',indexable:false}).robots,'noindex,nofollow');assert.equal(metadata('/account',{origin:'https://studytimely.com',indexable:true}).robots,'noindex,nofollow');
});
test('initial leaderboard HTML contains the full guide, working contents and no synthetic participant data',async()=>{
 const html=await fs.readFile(new URL('../dist/client/leaderboard/index.html',import.meta.url),'utf8'),guide=html.split('<article class="lb-guide"')[1]?.split('</article>')[0];
 assert.ok(guide);assert.ok(guide.replace(/<[^>]*>/g,' ').split(/\s+/).length>2000);assert.equal((guide.match(/<details>/g)||[]).length,12);
 for(const [,anchor] of guide.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${anchor}"`),anchor);
 assert.match(html,/"@type":"WebPage"/);assert.match(html,/"@type":"BreadcrumbList"/);assert.ok(!html.includes('Sample Learner'));assert.ok(!html.includes('Sample QA Reader'));
 assert.match(guide,/Maximum|eight credited hours/);assert.match(guide,/90 seconds/);assert.match(guide,/25 minutes/);assert.match(guide,/private rooms/);
});
