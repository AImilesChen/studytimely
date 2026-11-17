// The server resolves these IDs. Client-supplied text never becomes a trusted template.
export const STUDY_MESSAGES=Object.freeze([
 Object.freeze({id:'starting',label:'Starting study',text:'I am starting my study session.',icon:'study'}),
 Object.freeze({id:'completed',label:'Goal completed',text:'I have completed my study goal.',icon:'complete'}),
 Object.freeze({id:'break',label:'Taking a break',text:'I am taking a short break.',icon:'break'}),
 Object.freeze({id:'help',label:'Need help',text:'I need help with my study task.',icon:'help'})
]);
export const studyMessage=id=>STUDY_MESSAGES.find(message=>message.id===id)||null;
