const key='studytimely-weekly-report-entry';
export function rememberWeeklyEntry(storage,now=Date.now()){try{(storage||globalThis.sessionStorage).setItem(key,String(now+10*60000));}catch{}}
export function consumeWeeklyEntry(storage,now=Date.now()){try{storage=storage||globalThis.sessionStorage;const value=storage.getItem(key);if(!value)return false;storage.removeItem(key);const expires=Number(value);return Number.isSafeInteger(expires)&&expires>now&&expires<=now+10*60000;}catch{return false;}}
