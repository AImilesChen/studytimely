export const chartColour=name=>{let hash=0;for(const c of name)hash=(hash*31+c.charCodeAt(0))>>>0;return ['#79e1bd','#78b7ff','#b8a0ff','#ffc775','#6cd5e5','#f69ac5'][hash%6];};

export function trendGroups(series,previous=[],maxGroups=31){
 const step=Math.max(1,Math.ceil(series.length/maxGroups)),groups=[];
 for(let i=0;i<series.length;i+=step){const days=series.slice(i,i+step);groups.push({start:days[0].date,end:days.at(-1).date,value:days.reduce((n,d)=>n+d.seconds,0),previous:i<previous.length?previous.slice(i,i+step).reduce((n,d)=>n+d.seconds,0):null});}
 return groups;
}
export function chartScale(groups){
 const peak=Math.max(0,...groups.flatMap(g=>[g.value,g.previous]));
 const step=[15,30,60,120,300,600,900,1800,3600,7200,14400,28800,86400].find(s=>s*4>=peak)||Math.ceil(peak/4/86400)*86400;
 const max=Math.max(step,Math.ceil(peak/step)*step);
 return {max,ticks:Array.from({length:Math.round(max/step)+1},(_,i)=>i*step)};
}
export function chartPoints(groups,max,{width=640,height=290,left=54,right=20,top=22,bottom=40}={}){
 const plotWidth=Math.max(1,width-left-right),plotHeight=height-top-bottom,base=height-bottom;
 return groups.map((g,i)=>({...g,x:left+(i+.5)*plotWidth/groups.length,y:base-g.value/max*plotHeight,previousY:g.previous===null?null:base-g.previous/max*plotHeight}));
}
export function curvePath(points,key='y'){
 if(!points.length)return '';
 // Controls stay inside each endpoint rectangle: the curve cannot overshoot a recorded value.
 let path='',previous=null;for(const point of points){if(point[key]===null){previous=null;continue;}if(!previous)path+=`${path?' ':''}M ${point.x} ${point[key]}`;else{const mid=(previous.x+point.x)/2;path+=` C ${mid} ${previous[key]}, ${mid} ${point[key]}, ${point.x} ${point[key]}`;}previous=point;}return path;
}
export const axisLabel=seconds=>seconds>=3600?`${Number((seconds/3600).toFixed(1))}h`:seconds>=60?`${Number((seconds/60).toFixed(1))}m`:`${seconds}s`;
