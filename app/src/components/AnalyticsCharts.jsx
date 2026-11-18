import {useEffect,useId,useRef,useState} from 'react';
import {ChartBar,ChartLine,ArrowRight} from '@phosphor-icons/react';
import {trackerDuration as duration} from '../lib/tracker.mjs';
import {trendGroups,chartScale,chartPoints,curvePath,axisLabel,chartColour} from '../lib/analytics-chart.mjs';
const dayLabel=d=>new Intl.DateTimeFormat('en',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
const label=s=>s||'Unlabelled';
const activate=(event,run)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();run();}};

export function Trend({report,previous,onDays}){
 const [kind,setKind]=useState('line'),[active,setActive]=useState(null),[width,setWidth]=useState(640),ref=useRef(null),id=useId().replace(/[^a-zA-Z0-9_-]/g,'');
 useEffect(()=>{if(!ref.current)return;if(typeof ResizeObserver==='undefined'){setWidth(Math.max(250,ref.current.clientWidth||640));return;}const observer=new ResizeObserver(([entry])=>setWidth(Math.max(250,Math.round(entry.contentRect.width))));observer.observe(ref.current);return()=>observer.disconnect();},[]);
 useEffect(()=>setActive(null),[report.range.start,report.range.end,report.subject,report.mode,kind]);
 const groups=trendGroups(report.series,previous?.series),scale=chartScale(groups),height=290,left=50,right=16,top=24,bottom=46,base=height-bottom,plotWidth=width-left-right,plotHeight=base-top;
 const points=chartPoints(groups,scale.max,{width,height,left,right,top,bottom}),currentPath=curvePath(points),previousPath=curvePath(points,'previousY'),area=points.length>1?`${currentPath} L ${points.at(-1).x} ${base} L ${points[0].x} ${base} Z`:'';
 const labelCount=Math.min(points.length,Math.max(2,Math.floor(plotWidth/100))),labels=new Set(Array.from({length:labelCount},(_,i)=>labelCount===1?0:Math.round(i*(points.length-1)/(labelCount-1)))),point=points[active],barWidth=Math.min(27,plotWidth/Math.max(1,points.length)*(previous?.series? .28:.48));
 return <>
  <div className="sa-chart-toolbar"><div className="sa-chart-key"><span><i className="current"/>This period</span>{previous&&<span><i className="previous"/>Previous</span>}</div><div className="sa-chart-switch" role="group" aria-label="Trend chart style"><button aria-pressed={kind==='line'} onClick={()=>setKind('line')}><ChartLine size={17}/>Line</button><button aria-pressed={kind==='bar'} onClick={()=>setKind('bar')}><ChartBar size={17}/>Bars</button></div></div>
  <div className="sa-plot" ref={ref} onPointerLeave={()=>setActive(null)}>
   <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${kind==='line'?'Line':'Bar'} chart of recorded study time`}>
    <defs><linearGradient id={`sa-area-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--sa-chart-current)" stopOpacity=".25"/><stop offset="100%" stopColor="var(--sa-chart-current)" stopOpacity=".015"/></linearGradient></defs>
    {scale.ticks.map(t=>{const y=base-t/scale.max*plotHeight;return <g key={t} className="sa-axis"><line x1={left} y1={y} x2={width-right} y2={y}/><text x={left-10} y={y} dy=".35em" textAnchor="end">{axisLabel(t)}</text></g>;})}
    {kind==='line'&&<g className="sa-series" pointerEvents="none">{area&&<path d={area} fill={`url(#sa-area-${id})`}/>} {previous&&<path d={previousPath} className="sa-previous-line"/>}<path d={currentPath} className="sa-current-line"/></g>}
    {points.map((p,i)=>{
     const selected=active===i,tooltip=`${p.start}${p.end!==p.start?' through '+p.end:''}: ${duration(p.value)}${previous?', previous '+(p.previous===null?'not comparable':duration(p.previous)):''}. View learning records.`;
     return <g key={p.start} role="button" tabIndex={0} aria-label={tooltip} className={`sa-plot-point ${selected?'is-active':''}`} onClick={()=>onDays(p.start,p.end)} onKeyDown={e=>activate(e,()=>onDays(p.start,p.end))} onFocus={()=>setActive(i)} onBlur={()=>setActive(null)} onPointerEnter={()=>setActive(i)}>
      <rect className="sa-point-hit" x={left+i*plotWidth/points.length} y={top} width={plotWidth/points.length} height={plotHeight+8}/>
      {selected&&<line className="sa-crosshair" x1={p.x} y1={top} x2={p.x} y2={base}/>}
      {kind==='line'?<>{previous&&p.previousY!==null&&<circle className="sa-previous-dot" cx={p.x} cy={p.previousY} r={selected?4:3}/>}<circle className="sa-current-dot" cx={p.x} cy={p.y} r={selected?6:4}/><circle className="sa-point-focus" cx={p.x} cy={p.y} r="10"/></>:<>{previous&&p.previousY!==null&&<rect className="sa-previous-bar" x={p.x-barWidth-3} y={p.previousY} width={barWidth} height={Math.max(0,base-p.previousY)} rx="5"/>}<rect className="sa-current-bar" x={p.x+(previous?3:-barWidth/2)} y={p.y} width={barWidth} height={Math.max(0,base-p.y)} rx="5"/><rect className="sa-point-focus" x={p.x-barWidth-7} y={top-3} width={barWidth*2+14} height={plotHeight+6} rx="7"/></>}
      {labels.has(i)&&<text className="sa-x-label" x={Math.max(28,Math.min(width-28,p.x))} y={base+29} textAnchor="middle">{p.start===report.range.today?'Today':dayLabel(p.start)}</text>}
     </g>;
    })}
   </svg>
   {point&&<div className="sa-plot-tooltip" role="tooltip" style={{left:Math.max(0,Math.min(width-190,point.x-95)),top:Math.max(2,Math.min(point.y,point.previousY??base)-83)}}><strong>{dayLabel(point.start)}{point.end!==point.start?' – '+dayLabel(point.end):''}{point.end===report.range.today?' · so far':''}</strong><span><i/>{duration(point.value)}<small>This period</small></span>{previous&&<span className="prior"><i/>{point.previous===null?'—':duration(point.previous)}<small>Previous</small></span>}</div>}
  </div>
  <details className="sa-data-list"><summary>View chart data</summary><div className="sa-table-scroll"><table><thead><tr><th>Date</th><th>This period</th>{previous&&<th>Previous</th>}</tr></thead><tbody>{groups.map(g=><tr key={g.start}><td><button className="text-button" onClick={()=>onDays(g.start,g.end)}>{g.start}{g.end!==g.start?' – '+g.end:''}</button></td><td>{duration(g.value)}</td>{previous&&<td>{g.previous===null?'Not comparable':duration(g.previous)}</td>}</tr>)}</tbody></table></div></details>
 </>;
}

export function SubjectChart({report,previous,onSubject}){
 const [active,setActive]=useState(null),subjects=report.subjects,ring=subjects.length>0&&subjects.length<=5,total=report.total??subjects.reduce((n,s)=>n+s.seconds,0),selected=subjects[active],radius=79,circumference=2*Math.PI*radius;
 useEffect(()=>setActive(null),[subjects]);
 let cumulative=0;
 if(!subjects.length)return <div className="sa-empty"><ChartLine size={32} weight="light"/><h3>No subject breakdown yet</h3><p>Saved sessions will appear here, including unlabelled study.</p></div>;
 const Item=onSubject?'button':'div';
 return <div className={`sa-subject-chart ${ring?'has-ring':'has-bars'}`}>
  {ring&&<div className="sa-donut-wrap" onPointerLeave={()=>setActive(null)}><svg viewBox="0 0 220 220" role="group" aria-label="Recorded study by subject"><circle className="sa-donut-track" cx="110" cy="110" r={radius}/>{subjects.map((s,i)=>{const offset=cumulative*circumference;cumulative+=s.share;const run=()=>onSubject?.(s.name||'none');return <circle key={s.name} cx="110" cy="110" r={radius} className={`sa-donut-slice ${active===i?'is-active':''}`} stroke={chartColour(s.name)} strokeDasharray={`${Math.max(0,s.share*circumference-(subjects.length>1?3:0))} ${circumference}`} strokeDashoffset={-offset} transform="rotate(-90 110 110)" {...(onSubject?{role:'button',tabIndex:0,onClick:run,onKeyDown:e=>activate(e,run)}:{role:'img'})} aria-label={`${label(s.name)}: ${duration(s.seconds)}, ${Math.round(s.share*100)} percent${onSubject?'. View subject records.':''}`} onPointerEnter={()=>setActive(i)} onFocus={()=>setActive(i)} onBlur={()=>setActive(null)}><title>{`${label(s.name)} · ${duration(s.seconds)}`}</title></circle>;})}</svg><div className="sa-donut-center"><span title={selected?label(selected.name):'Total recorded study'}>{selected?label(selected.name):'Total study'}</span><strong className={duration(selected?selected.seconds:total).length>8?'is-long':''}>{duration(selected?selected.seconds:total)}</strong><small>{selected?`${Math.round(selected.share*100)}% of this view`:`${subjects.length} subject${subjects.length===1?'':'s'}`}</small></div></div>}
  <div className={`sa-subjects ${ring?'sa-subject-legend':''}`} onPointerLeave={()=>setActive(null)}>{subjects.map((s,i)=>{const p=previous?.subjects.find(v=>v.name===s.name)?.seconds||0;return <Item key={s.name} className={active===i?'is-active':''} onClick={onSubject?()=>onSubject(s.name||'none'):undefined} onPointerEnter={()=>setActive(i)} onFocus={()=>setActive(i)} onBlur={()=>setActive(null)}><span className="sa-subject-title"><span><i style={{background:chartColour(s.name)}}/>{label(s.name)}</span><strong>{duration(s.seconds)}</strong></span>{!ring&&<span className="sa-subject-track"><i style={{width:`${s.share*100}%`,background:chartColour(s.name)}}/></span>}<span className="sa-subject-caption"><span>{Math.round(s.share*100)}% of this view</span>{previous&&<span>{p?`${s.seconds>=p?'+':'−'}${duration(Math.abs(s.seconds-p))}`:'No prior records'}</span>}{onSubject&&<ArrowRight size={15} className="sa-legend-arrow" aria-hidden="true"/>}</span></Item>;})}</div>
 </div>;
}
