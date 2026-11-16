import {rankingWindow} from '../src/lib/leaderboard-model.mjs';
const statement=(env,sql,args)=>env.DB.prepare(sql).bind(...args);
// Public and personal ranks use the same uncapped population and exact-second ties.
export function rankingQuery(period,at){
 const window=rankingWindow(period,at);let scores,args;
 if(window.period==='streak'){
  scores=`WITH days AS (SELECT d.profile_id,CAST(julianday(?)-julianday(d.day) AS INTEGER) AS gap,ROW_NUMBER() OVER(PARTITION BY d.profile_id ORDER BY d.day DESC)-1 AS idx FROM community_daily d WHERE d.seconds>=60 AND d.day<=?),groups AS (SELECT *,MIN(gap) OVER(PARTITION BY profile_id) AS base FROM days),scores AS (SELECT profile_id,count(*) AS score FROM groups WHERE base<=1 AND gap-idx=base GROUP BY profile_id)`;args=[window.day,window.day];
 }else{
  scores='WITH scores AS (SELECT profile_id,SUM(seconds) AS score FROM community_daily WHERE day>=? AND day<=? GROUP BY profile_id HAVING score>0)';args=[window.start,window.end];
 }
 const sql=scores+`,ranked AS (SELECT p.id,p.nickname,s.score,RANK() OVER(ORDER BY s.score DESC) AS rank FROM scores s JOIN community_profiles p ON p.id=s.profile_id WHERE p.public_ranking=1)`;
 return {window,sql,args};
}
export async function publicRanking(env,period,at){
 const {window,sql,args}=rankingQuery(period,at);
 const list=(await statement(env,sql+' SELECT *,COUNT(*) OVER() AS participants FROM ranked ORDER BY score DESC,id LIMIT 100',args).all()).results||[];
 return {...window,participants:list[0]?.participants||0,rows:list.map(({participants,...row})=>row)};
}
export async function personalRanking(env,period,at,profile){
 const {window,sql,args}=rankingQuery(period,at);
 if(!profile)return {...window,profile:null,score:0,rank:null,history:[]};
 const own=await statement(env,sql+' SELECT COALESCE(s.score,0) AS score,r.rank FROM community_profiles p LEFT JOIN scores s ON s.profile_id=p.id LEFT JOIN ranked r ON r.id=p.id WHERE p.id=?',[...args,profile.id]).first();
 const history=(await statement(env,'SELECT day,rank,seconds FROM community_rank_history WHERE profile_id=? ORDER BY day DESC LIMIT 30',[profile.id]).all()).results||[];
 return {...window,profile:{id:profile.id,nickname:profile.nickname,publicRanking:!!profile.public_ranking,version:profile.version},score:own?.score||0,rank:own?.rank??null,history};
}
