// Exact local destinations only. Never accept a URL or caller-supplied query.
export const authReturnPath=value=>['/study-groups','/pricing'].includes(value)?value:'/account';
