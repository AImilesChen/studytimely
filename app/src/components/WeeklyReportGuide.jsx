import {useState} from 'react';
import {ArrowRight,MagnifyingGlassPlus,Play,CalendarBlank,CheckCircle} from '@phosphor-icons/react';
import {Dialog} from './Dialog.jsx';
import './weekly-report-guide.css';

const steps=[
 {id:'week',title:'Choose the week',path:'Group progress → Weekly reports → Report week',image:'weekly',alt:'Weekly report with the date selector and Download CSV button',text:'Open Report week or use the arrows to move between the twelve available weeks. Read the full Monday–Sunday range in UTC.',note:'In an example, dates are read only. A retained snapshot shows when it was saved and excludes later study.'},
 {id:'read',title:'Understand the figures',path:'Weekly report → Four metrics and daily trend',image:'weekly-read',alt:'Illustrative weekly metrics and five different weekday bars',text:'Recorded together adds confirmed room timer time. Studying members counts unique people for the whole week. Study days counts dates with recorded time; Activities attended counts activities with attendance.',note:'Example: the same two people studying on five days still count as two weekly members, not ten. Colours identify weekdays; the table gives exact values.'},
 {id:'export',title:'Export and plan what is next',path:'Weekly report → Daily totals → Download CSV',image:'weekly-export',alt:'Saved weekly report with its date controls, CSV export and daily totals',text:'Check daily dates, recorded time and member counts. Choose Download CSV in the report header to keep the daily figures, then arrange another session or return to your timer.',note:'CSV contains dates, recorded minutes and daily member counts. It excludes personal task text and private reflections. Export is available for an accessible real report.'}
];

export function WeeklyReportActions({onStudy,onPlan,onActivities}){
 if(!onStudy&&!onPlan&&!onActivities)return null;
 return <section className="weekly-next" aria-label="Next steps after your weekly report"><h3>Turn your review into a next step</h3><p>Keep studying, arrange another session or record what you finished.</p><div>{[[onStudy,Play,'Keep studying','Go to Study together'],[onPlan,CalendarBlank,'Make time together','Plan a session'],[onActivities,CheckCircle,'Record an activity outcome','View study activities']].filter(([action])=>action).map(([action,Icon,title,label])=><article key={label}><Icon size={21} aria-hidden="true"/><h4>{title}</h4><button type="button" className="button" onClick={action}>{label}<ArrowRight size={16}/></button></article>)}</div></section>;
}

export function WeeklyReportGuide({idPrefix='weekly-report',publicGuide=false}){
 const [image,setImage]=useState(null);
 return <section className="weekly-guide" aria-labelledby={idPrefix+'-guide-title'}>
  <h3 id={idPrefix+'-guide-title'}>How to use weekly study reports</h3><p>{publicGuide?'See where each step happens in the room.':'Follow these three screens below the report.'} Screenshots use synthetic records or clearly marked example figures.</p>
  <ol>{steps.map((s,i)=><li key={s.id}><div className="weekly-guide-step"><span>0{i+1}</span><h4>{s.title}</h4></div><button type="button" className="weekly-guide-image" onClick={()=>setImage(s)} aria-label={'Enlarge weekly example: '+s.title}><img src={'/images/group-progress/'+s.image+'.jpg'} alt={s.alt} width="1280" height="720" loading="lazy"/><span><MagnifyingGlassPlus size={15}/>View example</span></button><strong className="weekly-guide-path">{s.path}</strong><p>{s.text}</p><p className="weekly-guide-note">{s.note}</p></li>)}</ol>
  <div className="weekly-guide-answers" aria-label="Weekly report questions"><article><h4>Why is my report empty?</h4><p>Only confirmed room timer time counts. Start your own timer in Study together and check in when prompted. Online presence, breaks, bookings and result submissions do not add minutes. Personal study outside this room stays separate.</p></article><article><h4>What does a dash mean?</h4><p>A future date has not happened yet. In a saved snapshot, dates after its cutoff have not been reported. A dash means unavailable, while zero means the report contains no recorded time for that date.</p></article><article><h4>Who can use weekly reports?</h4><p>Current reports require eligible advanced room access. An owner can enable the optional free preview when available; it creates no payment or subscription. After access ends, available retained snapshots stay read only. An illustrative example is never a room record.</p></article></div>
  {!publicGuide&&<a className="weekly-guide-more" href="/study-groups#group-weekly-reports" target="_blank" rel="noopener">Read the public weekly report guide<ArrowRight size={16}/></a>}
  <Dialog open={!!image} title={image?'Weekly example: '+image.title:'Weekly report example'} close={()=>setImage(null)} className="weekly-guide-dialog" preserveScroll>{image&&<div className="weekly-guide-dialog-body"><p><strong>{image.path}</strong></p><img src={'/images/group-progress/'+image.image+'.jpg'} alt={image.alt}/><p>{image.text}</p><p>{image.note} Viewing an example does not change your records.</p></div>}</Dialog>
 </section>;
}
