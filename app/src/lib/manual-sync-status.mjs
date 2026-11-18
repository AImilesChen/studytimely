import {MANUAL_SYNC_KEY as KEY} from './planner-device-state.mjs';
export function readManualSync(storage,epoch){try{const v=JSON.parse(storage.getItem(KEY)||'null');return v?.epoch===epoch&&Number.isSafeInteger(v.at)&&v.at>0?v.at:0;}catch{return 0;}}
export function recordManualSync(storage,epoch,at){try{if(!Number.isSafeInteger(at)||at<=0)return;storage.setItem(KEY,JSON.stringify({epoch,at}));}catch{/* Successful sync is not undone by an unavailable optional timestamp. */}}
