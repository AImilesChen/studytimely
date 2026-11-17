// Synthetic local provider only. Never imported into the production Worker.
export function syntheticCloudflareReview(){return {async run(_model,input){
 const text=input.messages.at(-1).content;
 if(text.includes('synthetic-review-unavailable'))throw Error('Synthetic provider unavailable');
 if(text.includes('synthetic-review-malformed'))return {};
 if(text.includes('synthetic-review-timeout'))return new Promise(()=>{});
 const blocked=text.includes('synthetic-review-block');
 return {response:{safe:!blocked,categories:blocked?['S1']:[]},usage:{prompt_tokens:230,completion_tokens:blocked?6:3,neurons:10.14}};
}};}
