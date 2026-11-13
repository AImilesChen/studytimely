import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {createRepository,persistedState,backupOf} from '../src/lib/storage.mjs';
import {emptyState,validateSettings,transition} from '../src/lib/model.mjs';
test('city favourites survive a real repository reload without starting a timer or uploading preferences',async()=>{
 const db=new IDBFactory(),a=createRepository({indexedDB:db}),initial=await a.load();
 await a.command({type:'settings',epoch:initial.epoch,patch:{worldClockCities:['los-angeles','kathmandu']}},{owner:'test',id:'settings',now:1000});a.close();
 const b=createRepository({indexedDB:db});try{const loaded=await b.load();assert.deepEqual(loaded.settings.worldClockCities,['los-angeles','kathmandu']);assert.equal(loaded.timer,null);assert.equal(loaded.sessions.length,0);assert.equal(Object.hasOwn(backupOf(loaded,2000,{includePreferences:true}).preferences.values,'worldClockCities'),false);}finally{b.close();}
});
test('forgetting preferences clears city favourites but preserves active study timing',()=>{
 const s=emptyState('e');s.settings.rememberPreferences=false;s.settings.worldClockCities=['tokyo'];s.timer={fixture:'active timer is kept'};
 const saved=persistedState(s);assert.deepEqual(saved.settings.worldClockCities,[]);assert.deepEqual(saved.timer,s.timer);assert.deepEqual(s.settings.worldClockCities,['tokyo']);
});
test('legacy states gain empty favourites, malformed city preferences are rejected',()=>{
 assert.deepEqual(validateSettings({theme:'dark'}).worldClockCities,[]);
 for(const pins of [['not-a-city'],['tokyo','tokyo'],Array(7).fill('london'),'london',null])assert.throws(()=>validateSettings({worldClockCities:pins}));
});
test('changing saved cities leaves a running study session and its accounting unchanged',()=>{
 let s=transition(emptyState('e'),{type:'start',mode:'study',epoch:'e'},{owner:'test',id:'run',now:1000}).state;const timer=structuredClone(s.timer);
 s=transition(s,{type:'settings',epoch:'e',patch:{worldClockCities:['london']}},{owner:'test',id:'prefs',now:6000}).state;
 assert.deepEqual(s.timer,timer);assert.equal(s.sessions.length,0);assert.deepEqual(s.settings.worldClockCities,['london']);
});
