export const PLANNER_REMINDER_KEY='studytimely-planning-reminders-v1';
export const MANUAL_SYNC_KEY='studytimely-last-manual-sync-v1';
export function clearPlannerDeviceState(storage){
 for(const key of [PLANNER_REMINDER_KEY,MANUAL_SYNC_KEY])try{storage.removeItem(key);}catch{/* Do not turn a completed study-data reset into a false failure. */}
}
