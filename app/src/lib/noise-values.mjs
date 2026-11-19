// These are explicitly labelled optional noise generators, never nature recordings.
export function createNoiseValues(id,length,sampleRate,random=Math.random){
 if(!['white','pink','brown'].includes(id))throw Error('Choose a noise generator, or use a field recording.');
 const out=new Float32Array(length),pink=new Float64Array(7);let brown=0;
 for(let i=0;i<length;i++){
  const white=random()*2-1;brown=(brown+.02*white)/1.02;
  pink[0]=.99886*pink[0]+white*.0555179;pink[1]=.99332*pink[1]+white*.0750759;
  pink[2]=.969*pink[2]+white*.153852;pink[3]=.8665*pink[3]+white*.3104856;
  pink[4]=.55*pink[4]+white*.5329522;pink[5]=-.7616*pink[5]-white*.016898;
  const soft=(pink[0]+pink[1]+pink[2]+pink[3]+pink[4]+pink[5]+pink[6]+white*.5362)*.11;pink[6]=white*.115926;
  out[i]=Math.max(-.9,Math.min(.9,id==='white'?white*.28:id==='brown'?brown*3.2:soft));
 }
 const edge=Math.min(Math.floor(sampleRate*.006),Math.floor(length/2));
 for(let i=0;i<edge;i++){out[i]*=i/edge;out[length-i-1]*=i/edge;}return out;
}
