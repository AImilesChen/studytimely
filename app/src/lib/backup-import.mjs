import {transition,validateBackup,hasProgress} from './model.mjs';
import {backupOf} from './storage.mjs';
import {packDocument,summaryOf,diffRecords} from './cloud-sync.mjs';

export async function readStudyBackup(file){
 if(!file||file.size>5*1024*1024)throw Error('Choose a StudyTimely JSON backup smaller than 5 MB.');
 let value;try{value=JSON.parse(await file.text());}catch{throw Error('This file is not valid JSON. Choose a downloaded StudyTimely learning backup.');}
 if(value?.account||value?.automaticSync)throw Error('This is an account data copy, not a learning backup. Use the file from Download learning backup.');
 validateBackup(value);return value;
}
export function previewStudyBackup(state,backup,{accountId='guest',now=Date.now()}={}){
 validateBackup(backup);
 const result=transition(state,{type:'import',epoch:state.epoch,backup},{now,owner:'backup-preview',id:'backup-preview'});
 const before=packDocument(backupOf(state)),after=packDocument(backupOf(result.state)),changes=diffRecords(before,after);
 const rows=Object.entries(changes).map(([key,value])=>({key,kind:value===null?'removed':Object.hasOwn(before,key)?'updated':'added'}));
 return{backup,accountId,epoch:state.epoch,revision:state.revision,before:summaryOf(before),after:summaryOf(after),rows,counts:Object.fromEntries(['added','updated','removed'].map(kind=>[kind,rows.filter(r=>r.kind===kind).length]))};
}
export async function importStudyBackup(store,preview,accountId='guest'){
 if(!preview||preview.accountId!==accountId)throw Error('Your account changed. Choose the backup again.');
 const current=await store.getSnapshot();
 if(current.epoch!==preview.epoch||current.revision!==preview.revision)throw Error('Your saved data changed after this preview. Preview the file again before importing.');
 if(hasProgress(current.timer))throw Error('Finish or reset the current timer before importing.');
 const result=await store.command('import',{backup:preview.backup,expected:{epoch:preview.epoch,revision:preview.revision}});
 if(!result)throw Error('The backup was not imported. Review the save message and preview the file again.');
 return result;
}
