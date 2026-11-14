// Workers Static Assets currently returns whole files for Range requests.
// Slice the response stream for our versioned MP3s without buffering a full song in Worker memory.
export function parseMusicRange(value,total){
 const match=/^bytes=(\d*)-(\d*)$/.exec(value||'');
 if(!match||(!match[1]&&!match[2])||!Number.isSafeInteger(total)||total<=0)return null;
 const a=match[1]?Number(match[1]):null,b=match[2]?Number(match[2]):null;
 if((a!==null&&!Number.isSafeInteger(a))||(b!==null&&!Number.isSafeInteger(b)))return null;
 if(a===null){if(!b)return null;return {start:Math.max(0,total-b),end:total-1};}
 if(a>=total||(b!==null&&b<a))return null;
 return {start:a,end:Math.min(b??total-1,total-1)};
}
function portion(body,start,length){
 const reader=body.getReader();let offset=0,left=length;
 return new ReadableStream({
  async pull(controller){
   try{
    while(left>0){
     const {value,done}=await reader.read();
     if(done){controller.error(Error('The music transfer ended early.'));return;}
     const skip=Math.max(0,start-offset);offset+=value.byteLength;
     if(skip>=value.byteLength)continue;
     const part=value.subarray(skip,Math.min(value.byteLength,skip+left));
     left-=part.byteLength;controller.enqueue(part);
     if(!left){controller.close();await reader.cancel();}
     return;
    }
   }catch(e){controller.error(e);}
  },
  cancel(reason){return reader.cancel(reason);}
 });
}
export async function musicAssetResponse(request,response,knownBytes){
 if(response.status!==200)return response;
 const headers=new Headers(response.headers);headers.set('Content-Type','audio/mpeg');headers.set('Accept-Ranges','bytes');
 const total=Number(headers.get('Content-Length')||knownBytes),range=request.headers.get('Range'),ifRange=request.headers.get('If-Range');
 if(!headers.has('Content-Length')&&!headers.has('Content-Encoding')&&Number.isSafeInteger(total)&&total>0)headers.set('Content-Length',String(total));
 const validatorMatches=!ifRange||(ifRange===headers.get('ETag')&&!ifRange.startsWith('W/'))||ifRange===headers.get('Last-Modified');
 if(request.method!=='GET'||!range||!validatorMatches||!Number.isSafeInteger(total)||!total||headers.has('Content-Encoding'))return new Response(response.body,{status:200,headers});
 const selection=parseMusicRange(range,total);
 if(!selection){await response.body?.cancel();headers.set('Content-Range',`bytes */${total}`);headers.set('Content-Length','0');return new Response(null,{status:416,headers});}
 const {start,end}=selection;headers.set('Content-Range',`bytes ${start}-${end}/${total}`);headers.set('Content-Length',String(end-start+1));
 return new Response(portion(response.body,start,end-start+1),{status:206,headers});
}
