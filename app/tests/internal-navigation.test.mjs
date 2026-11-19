import test from 'node:test';import assert from 'node:assert/strict';
import {navigationDestination} from '../src/lib/internal-navigation.mjs';
test('exam and syllabus entries keep their private planner context, while unrelated query values are excluded',()=>{
 for(const key of ['exam','syllabus'])assert.equal(navigationDestination(new URL('https://studytimely.com/study-planner?'+key+'=abc&unrelated=value')),'/study-planner?'+key+'=abc&view=plans');
 assert.equal(navigationDestination(new URL('https://studytimely.com/study-planner?example=prep&view=plans')),'/study-planner?view=plans&example=prep');assert.equal(navigationDestination(new URL('https://studytimely.com/account?view=signin&extra=ignored')),'/account?view=signin');assert.equal(navigationDestination(new URL('https://studytimely.com/time?private=ignored')),'/time');
});
test('account community and settings entries survive internal navigation without unrelated values',()=>{
 for(const view of ['community','settings','sync'])assert.equal(navigationDestination(new URL('https://studytimely.com/account?view='+view+'&private=ignored')),'/account?view='+view);
 assert.equal(navigationDestination(new URL('https://studytimely.com/account?view=unknown&private=ignored')),'/account');
});
