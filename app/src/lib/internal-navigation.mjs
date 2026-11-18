// Preserve only the private planner entry parameters used by the application.
export function navigationDestination(url){
 if(url.pathname==='/account')return url.pathname+(url.searchParams.get('view')==='signin'?'?view=signin':'');
 if(url.pathname!=='/study-planner')return url.pathname;
 const search=new URLSearchParams(),view=url.searchParams.get('view');if(['today','week','plans'].includes(view))search.set('view',view);
 for(const key of ['exam','syllabus']){const value=url.searchParams.get(key);if(value&&value.length<=160){search.set(key,value);if(!search.has('view'))search.set('view','plans');}}
 const example=url.searchParams.get('example');if(['1','prep'].includes(example))search.set('example',example);
 return url.pathname+(search.size?'?'+search:'');
}
