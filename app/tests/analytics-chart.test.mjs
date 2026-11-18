import test from 'node:test';
import assert from 'node:assert/strict';
import {trendGroups,chartScale,chartPoints,curvePath,axisLabel,chartColour} from '../src/lib/analytics-chart.mjs';
const days=n=>Array.from({length:n},(_,i)=>({date:new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10),seconds:(i%5)*900}));

test('readable chart groups retain every date and second through a partial last group',()=>{
 const series=days(366),previous=days(365),groups=trendGroups(series,previous);
 assert.ok(groups.length<=31);assert.equal(groups[0].start,series[0].date);assert.equal(groups.at(-1).end,series.at(-1).date);
 assert.equal(groups.reduce((n,g)=>n+g.value,0),series.reduce((n,d)=>n+d.seconds,0));assert.equal(groups.reduce((n,g)=>n+(g.previous||0),0),previous.reduce((n,d)=>n+d.seconds,0));
});
test('missing previous-month dates remain missing rather than becoming zero-time days',()=>{
 const groups=trendGroups(days(31),days(28));assert.equal(groups[27].previous,days(28)[27].seconds);assert.equal(groups[28].previous,null);
 const points=chartPoints(groups,chartScale(groups).max);assert.equal(points[28].previousY,null);assert.ok(!curvePath(points,'previousY').includes('null'));
});
test('axis ticks are ordered, include zero and contain every recorded value',()=>{
 for(const value of [0,12,60,1200,5400,50000,1000000]){const scale=chartScale([{value,previous:0}]);assert.equal(scale.ticks[0],0);assert.equal(scale.ticks.at(-1),scale.max);assert.ok(scale.max>=value);assert.ok(scale.max>0);assert.ok(scale.ticks.length<=6);assert.ok(scale.ticks.every((n,i)=>!i||n>scale.ticks[i-1]));}
 assert.equal(axisLabel(5400),'1.5h');assert.equal(axisLabel(900),'15m');assert.equal(axisLabel(30),'30s');
});
test('chart coordinates stay inside desktop and phone plots including a single point',()=>{
 for(const width of [250,320,640,900])for(const series of [days(1),days(7),days(31)]){const groups=trendGroups(series),scale=chartScale(groups),points=chartPoints(groups,scale.max,{width});for(const p of points){assert.ok(p.x>=54&&p.x<=width-20);assert.ok(p.y>=22&&p.y<=250);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}assert.ok(!curvePath(points).includes('NaN'));}
 assert.equal(curvePath([]),'');
});
test('curve controls stay within adjacent values instead of inventing higher peaks',()=>{
 const p=[{x:0,y:100},{x:100,y:20},{x:200,y:80}],path=curvePath(p);assert.equal(path,'M 0 100 C 50 100, 50 20, 100 20 C 150 20, 150 80, 200 80');
 for(let i=0;i<2;i++)for(let j=0;j<=20;j++){const t=j/20,a=p[i].y,b=p[i+1].y,y=(1-t)**3*a+3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3*b;assert.ok(y>=Math.min(a,b)-1e-8&&y<=Math.max(a,b)+1e-8);}
});
test('subject colours stay stable across chart and record representations',()=>{assert.equal(chartColour('Maths'),chartColour('Maths'));assert.match(chartColour(''),/^#[a-f0-9]{6}$/);assert.match(chartColour('A very long subject name'),/^#[a-f0-9]{6}$/);});
