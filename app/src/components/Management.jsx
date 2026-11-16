import {SyllabusPage} from './SyllabusPage.jsx';
import {ExamPage} from './ExamPage.jsx';
export {Planner} from './Planner.jsx';
export {Habits} from './HabitsPage.jsx';
export {Schedule} from './Schedule.jsx';
export function Syllabus(props){return props.countdownOnly?<ExamPage {...props}/>:<SyllabusPage {...props}/>;}
