import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import worker from '../dist/cloudflare/worker.mjs';
const base=path.resolve(import.meta.dirname,'../dist/client'),port=Number(process.env.PORT||4174);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.mp3':'audio/mpeg','.pdf':'application/pdf'};
const env={ASSETS:{async fetch(request){try{const pathname=decodeURIComponent(new URL(request.url).pathname),file=path.resolve(base,'.'+pathname);if(!file.startsWith(base+path.sep))return new Response('Not found',{status:404});const content=await fs.readFile(file);return new Response(request.method==='HEAD'?null:content,{headers:{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':String(content.byteLength)}});}catch{return new Response('Not found',{status:404});}}}};
const server=http.createServer(async(req,res)=>{try{const request=new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method,headers:req.headers}),response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Preview request failed');}});
server.listen(port,'127.0.0.1',()=>console.log(`StudyTimely verified-build preview: http://127.0.0.1:${port}`));
