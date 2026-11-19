export const MOTION_SCENES=['rain','coast'];
export function canAnimateScene({scene,enabled=true,reduced=false,hidden=false,intersecting=true}){return MOTION_SCENES.includes(scene)&&enabled&&!reduced&&!hidden&&intersecting;}
export function coverFrame(width,height,imageWidth,imageHeight){
 if([width,height,imageWidth,imageHeight].some(n=>!Number.isFinite(n)||n<=0))return null;
 const scale=Math.max(width/imageWidth,height/imageHeight);return {scale,x:(width-imageWidth*scale)/2,y:(height-imageHeight*scale)/2};
}
export const WINDOW_MASKS={rain:[[.12,0],[.91,0],[.91,1],[0,1],[0,.33]],cafe:[[0,0],[.61,0],[.61,.62],[0,.98]],coast:[[0,.43],[.5,.43],[.76,.44],[1,.44],[1,.52],[.8,.6],[.55,.8],[.24,1],[0,1]]};
export function rainDrop(index,seconds){
 const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 return {x:.03+rand(index+1)*.94,y:(rand(index+71)+seconds*(.025+rand(index+31)*.04))%1,length:.008+rand(index+101)*.018,alpha:.12+rand(index+151)*.2};
}
// A single cancellable frame loop. Visibility, reduced-motion and off-screen
// gating are handled without changing any timing or study state.
export function sceneFrameLoop({request,cancel,draw,now=()=>performance.now(),interval=50}){
 let id=null,last=-Infinity,live=true;
 const frame=at=>{id=null;if(!live)return;if(at-last>=interval){last=at;try{draw(at/1000);}catch{live=false;return;}}if(live)id=request(frame);};
 id=request(frame);return()=>{live=false;if(id!==null)cancel(id);id=null;};
}
