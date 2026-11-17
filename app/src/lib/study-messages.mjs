// Server-resolved fixed text. Additional user text always requires subscriber review.
export const STUDY_MESSAGES=Object.freeze([
 {id:'starting',group:'status',label:'Starting study',text:'I am starting my study session.',icon:'study'},
 {id:'completed',group:'status',label:'Goal completed',text:'I have completed my study goal.',icon:'complete'},
 {id:'break',group:'status',label:'Taking a break',text:'I am taking a short break.',icon:'break'},
 {id:'help',group:'status',label:'Need help',text:'I need help with my study task.',icon:'help'},
 {id:'keep-going',group:'encourage',label:'Keep going',text:'Keep going. You can do this!',icon:'complete'},
 {id:'well-done',group:'encourage',label:'Well done',text:'Well done on your progress!',icon:'complete'},
 {id:'thanks',group:'encourage',label:'Thanks for the company',text:'Thanks for studying alongside me.',icon:'study'},
 {id:'start-together',group:'invite',label:'Start together?',text:'Shall we start a study session together?',icon:'study'},
 {id:'another-round',group:'invite',label:'One more round?',text:'Would you like to study for one more round?',icon:'study'},
 {id:'break-together',group:'invite',label:'Take a break?',text:'Shall we take a short break together?',icon:'break'}
].map(Object.freeze));
export const studyMessage=id=>STUDY_MESSAGES.find(message=>message.id===id)||null;
export const legacyStudyMessage=id=>['starting','completed','break','help'].includes(id)?id:null;
