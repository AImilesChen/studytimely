// Shared, conservative rules; semantic review is still required for free-text chat.
export const STUDY_CHAT_RULES='Keep messages about study tasks, questions, progress or brief encouragement. No dating or sexual solicitation, threats, hate, harassment, advertising, external links or exchanging contact details. Do not share personal or confidential information.';
export function localContentIssue(value){
 const text=String(value).normalize('NFKC').toLowerCase().replace(/[\u200b-\u200f\u2060\ufeff]/g,'');
 const compact=text.replace(/\s+/g,'');
 if(/[\w.+-]+\s*(?:@|\[at\]|\(at\))\s*[\w-]+\s*(?:\.|\[dot\]|\(dot\))\s*[a-z]{2,}/i.test(text)||/(?:https?:\s*\/\s*\/|www\s*\.|\b[a-z0-9-]+\.(?:com|net|org|io|app|gg|me|cn|xyz|edu|co)(?:\b|\/))/i.test(compact))return 'contact';
 if(/(?:^|[^\d])\+?\d[\d ()-]{7,}\d(?:$|[^\d])/.test(text)&&/(?:\+\d|\b(?:phone|call|text|whatsapp|mobile|contact)\b|电话|手机|联系)/i.test(text))return 'contact';
 if(/(?:^|[^\d])\d{10,15}(?:$|[^\d])/.test(compact)||/(?:微信|微\s*信|加\s*[vｖ]|qq\s*[:：号]|\bqq\s*\d{5,12}|\b(?:wx|vx)\s*[:：]|扣扣|电报|私聊加|加我|联系我)/i.test(text)||/\b(?:wechat|whatsapp|telegram|snapchat|discord|instagram)\s*(?:[:：@]|id\b|is\b)|\b(?:add|follow|dm|message)\s+me\b|\b(?:my|on)\s+(?:wechat|whatsapp|telegram|snapchat|discord|instagram)\b/i.test(text))return 'contact';
 if(/(?:找对象|找男友|找女友|处对象|约炮|裸聊|色情交易)/.test(compact)||/\b(?:date me|looking for (?:a |an )?(?:girlfriend|boyfriend|romantic partner)|send (?:me )?nudes|sex chat)\b/i.test(text))return 'offtopic';
 if(/(?:我要杀了你|弄死你|杀你全家)/.test(compact)||/^\s*i\s+(?:(?:will|am going to|'m going to)\s+)?(?:kill|shoot|rape)\s+you\b/i.test(text)||/\b(?:fuck you|you (?:fucking )?(?:idiot|bitch))\b/i.test(text))return 'harmful';
 return null;
}
export function contentIssueMessage(issue){return issue==='contact'?'Do not post contact details, social handles, invitations to move off-site or external links.':issue==='offtopic'?'This room is for learning. Dating and sexual solicitation are not allowed.':'This content does not meet the study-community safety rules.';}
