// Local-only integration fixture. This file is not imported by the production build.
import worker from '../../dist/cloudflare/worker.mjs';
const deliveries=new Map();
export default{
 async fetch(request,env){
  const url=new URL(request.url);
  if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))return new Response('Local test fixture only',{status:403});
  if(url.pathname==='/__test/otp'){
   const address=url.searchParams.get('email');
   if(!address?.endsWith('@studytimely.invalid'))return new Response('Synthetic addresses only',{status:400});
   return Response.json({code:deliveries.get(address)||null},{headers:{'Cache-Control':'no-store'}});
  }
  return worker.fetch(request,{...env,EMAIL:{async send(message){if(!message.to.endsWith('@studytimely.invalid'))throw Error('Local test mail only');deliveries.set(message.to,message.text.match(/\b\d{6}\b/)?.[0]);}}});
 }
};
