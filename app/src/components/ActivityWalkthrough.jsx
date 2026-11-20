import {useState} from 'react';
import {MagnifyingGlassPlus} from '@phosphor-icons/react';
import {Dialog} from './Dialog.jsx';

const steps = [
  {id:'plan', title:'Plan a time', role:'Organiser', action:'Plan an activity', opens:'Opens a booking window', image:'plan', alt:'Example booking window with subject, date, time zone and study duration fields.', text:'Choose a date, time zone and duration. Select Schedule activity, then share your room invitation.'},
  {id:'join', title:'Join with a task', role:'Each member', action:'Join activity', opens:'Expands a form on this page', image:'join', alt:'Example joining form with a study subject, private task and Confirm & join button.', text:'Choose a subject and one private task. Select Confirm & join. Your timer does not start yet.'},
  {id:'study', title:'Start your timer', role:'Each member', action:'Start my study', opens:'Starts your personal activity timer', image:'study', alt:'Example activity countdown beside a personal Start my study button.', text:'The organiser selects Start activity first. Then start your own timer; you can pause independently.'},
  {id:'result', title:'Record your result', role:'Each member', action:'Add result', opens:'Expands a form on this page', image:'result', alt:'Example result form with a shared outcome and an optional private reflection.', text:'Select your result and an optional private reflection, then Save result. During a session, use Finish & add result.'}
];

export function ActivityWalkthrough() {
  const [example,setExample] = useState(null);
  return <section className="ga-walkthrough" aria-labelledby="ga-walkthrough-title" id="activity-examples">
    <header className="ga-walkthrough-heading">
      <div><span className="ga-guide-eyebrow">STEP-BY-STEP EXAMPLES</span><h4 id="ga-walkthrough-title" tabIndex={-1}>How to use study activities</h4><p>New to group sessions? Follow these examples, from booking to your result.</p></div>
    </header>
    <ol className="ga-walkthrough-steps">
      {steps.map((step,index)=><li key={step.id}>
        <div className="ga-step-heading"><span className="ga-step-number">{'0'+(index+1)}</span><h5>{step.title}</h5></div>
        <button type="button" className="ga-example-button" onClick={()=>setExample(step)} aria-label={'Enlarge example: '+step.title}>
          <img src={'/images/study-activities/'+step.image+'.jpg'} alt={step.alt} width="800" height="500" loading="lazy"/>
          <span><MagnifyingGlassPlus size={15} aria-hidden="true"/>View example</span>
        </button>
        <div className="ga-step-copy"><strong>{step.action}</strong><span className="ga-step-opens">{step.role} · {step.opens}</span><p>{step.text}</p></div>
      </li>)}
    </ol>
    <Dialog open={Boolean(example)} title={example?'Example: '+example.title:'Activity example'} close={()=>setExample(null)} className="ga-example-dialog" preserveScroll>
      {example&&<><p className="ga-example-caption"><strong>{example.action}</strong> · {example.opens}. {example.text}</p><img src={'/images/study-activities/'+example.image+'.jpg'} alt={example.alt}/><p className="ga-example-caption">Illustrative sample screen. Viewing it does not change your activity or start a timer.</p></>}
    </Dialog>
  </section>;
}
