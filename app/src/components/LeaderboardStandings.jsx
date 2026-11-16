import {rankingDuration} from '../lib/leaderboard-model.mjs';
const score=(value,period)=>period==='streak'?`${value} ${value===1?'day':'days'}`:rankingDuration(value);
const awards={1:'gold-trophy-v1.png',2:'silver-medal-v1.png',3:'bronze-medal-v1.png'};

export function RankingPodium({rows=[],period,status='ready'}){
 return <ol className="lb-podium" aria-label="Leading participants">{[0,1,2].map(slot=>{
  const row=status==='ready'?rows[slot]:null;
  const label=row?`Rank #${row.rank}`:`${slot+1}${['st','nd','rd'][slot]} place`;
  return <li key={slot} className={`lb-podium-place lb-podium-place-${slot+1} ${row?'lb-podium-filled':'lb-podium-open'}`}>
   <span className="lb-place-label">{label}</span><img className="lb-podium-emblem" src={`/design-assets/awards/${awards[row?.rank??slot+1]}`} width="256" height="256" alt="" aria-hidden="true" decoding="async"/>
   <strong className="lb-podium-name">{row?row.nickname:status==='loading'?'Loading…':status==='error'?'Unavailable':'Open place'}</strong>
   <span className="lb-podium-score">{row?score(row.score,period):<><span aria-hidden="true">—</span><span className="sr-only">No score displayed</span></>}</span>
  </li>;
 })}</ol>;
}

export function RankingTable({rows=[],period,caption,profileId,emptyMessage='No matching nicknames in this Top 100.'}){
 return <table className="lb-table"><caption className="sr-only">{caption}</caption><thead><tr><th scope="col">Rank</th><th scope="col">Nickname</th><th scope="col">{period==='streak'?'Consecutive days':'Credited time'}</th></tr></thead><tbody>
   {rows.map(r=><tr key={r.id} className={profileId===r.id?'lb-your-row':''}><td>{r.rank<=3?<span className="lb-rank-number">{r.rank}</span>:r.rank}</td><th scope="row">{r.nickname}{profileId===r.id&&<span className="lb-you">You</span>}</th><td>{score(r.score,period)}</td></tr>)}
   {!rows.length&&<tr><td colSpan={3} className="lb-table-status">{emptyMessage}</td></tr>}
 </tbody></table>;
}
