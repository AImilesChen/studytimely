// Shared, conservative rules; semantic review is still required for free-text chat.
export const STUDY_CHAT_RULES='Keep messages about study tasks, questions, progress or brief encouragement. No dating or sexual solicitation, threats, hate, harassment, advertising, external links or exchanging contact details. Do not share personal or confidential information.';
// Detection copies only: never rewrite the message saved or shown to members.
export function normalizeSafetyText(value){return String(value).normalize('NFKC').replace(/\p{Cf}/gu,'').toLowerCase();}
export function localContentIssue(value){
 const text=normalizeSafetyText(value);
 const compact=text.replace(/\s+/g,'');
 const joined=text.replace(/[\s\p{P}\p{S}]/gu,'');
 if(/[\w.+-]+\s*(?:@|\[at\]|\(at\))\s*[\w-]+\s*(?:\.|\[dot\]|\(dot\))\s*[a-z]{2,}/i.test(text)||/(?:https?:\s*\/\s*\/|www\s*\.|\b[a-z0-9-]+\.(?:com|net|org|io|app|gg|me|cn|xyz|edu|co)(?:\b|\/))/i.test(compact))return 'contact';
 if(/(?:^|[^\d])\+?\d[\d ()-]{7,}\d(?:$|[^\d])/.test(text)&&/(?:\+\d|\b(?:phone|call|text|whatsapp|mobile|contact)\b|电话|手机|联系)/i.test(text))return 'contact';
 if(/(?:^|[^\d])\d{10,15}(?:$|[^\d])/.test(compact)||/(?:加\s*[vｖ]|qq\s*[:：号]|\bqq\s*\d{5,12}|\b(?:wx|vx)\s*[:：]|私聊加|加我|联系我)/i.test(text)||/\b(?:wechat|whatsapp|telegram|snapchat|discord|instagram)\s*(?:[:：@]|id\b|is\b)|\b(?:add|follow|dm|message)\s+me\b|\b(?:my|on)\s+(?:wechat|whatsapp|telegram|snapchat|discord|instagram)\b/i.test(text))return 'contact';
 if(/(?:微信|微[·・.\s_-]*信|扣扣|电报)\s*[:：号]/.test(text)||/(?:加|我的|联系|私聊|扫码|交换).{0,8}(?:微信|薇信|威信|v信|weixin|wechat|whatsapp|telegram|discord)|(?:微信|薇信|v信|weixin).{0,5}(?:号是|账号|帐号|号码|加我)|(?:my|addmeon|contactmeon)(?:wechat|whatsapp|telegram|discord)/.test(joined))return 'contact';
 if(/(?:找|征|处)(?:一个|个|位)?(?:对象|男友|女友|男朋友|女朋友)|(?:约炮|裸聊|色情交易|网恋)|(?:和|跟)我(?:谈恋爱|交往)|(?:做|当)我(?:男|女)朋友|(?:单身|小姐姐|小哥哥|有人|愿意).{0,16}(?:谈恋爱|做我(?:男|女)朋友)/.test(joined)||/\b(?:date me|looking for (?:a |an )?(?:girlfriend|boyfriend|romantic partner)|(?:be|become) my (?:girlfriend|boyfriend)|sex chat)\b/i.test(text))return 'offtopic';
 if(/(?:发|互发|发送|交换|给我看|想看|求|来|互相).{0,12}(?:裸照|裸体照|裸自拍|私密照|(?:没|不)穿衣服的?(?:自拍|照片))|(?:聊|看|来|搞|约).{0,6}(?:涩涩|瑟瑟|色色|黄段子|色情)/.test(joined)||/\b(?:send|share|exchange|show me)\b.{0,25}\b(?:nudes|(?:naked|nude) (?:pics|pictures|photos))\b/.test(text))return 'offtopic';
 if(/(?:出售|售卖|贩卖|代写|代考|有偿).{0,16}(?:答案|论文|作业|考试|课程)|(?:付钱|付款|转账).{0,10}(?:发答案|发课程|给答案)/.test(joined)||/\b(?:buy|purchase|subscribe to) (?:my|our)\b.{0,35}\b(?:course|answers?|subscription|service)\b/.test(text))return 'promotion';
 if(/(?:我要杀了你|弄死你|杀你全家)/.test(compact)||/^\s*i\s+(?:(?:will|am going to|'m going to)\s+)?(?:kill|shoot|rape)\s+you\b/i.test(text)||/\b(?:fuck you|you (?:fucking )?(?:idiot|bitch))\b/i.test(text))return 'harmful';
 if(/(?:我|老子).{0,8}(?:把你|找你|找到你|让你).{0,8}(?:揍|打残|打死|打到|杀|弄死|爬不起来)/.test(joined)||/\bi\s+(?:will|am going to|'m going to)\b.{0,25}\b(?:beat|hurt|attack|stab)\s+you\b/.test(text))return 'harmful';
 return null;
}
export function contentIssueMessage(issue){return issue==='contact'?'Do not post contact details, social handles, invitations to move off-site or external links.':issue==='offtopic'?'This room is for learning. Dating and sexual solicitation are not allowed.':issue==='promotion'?'Advertising, paid offers and selling exam answers are not allowed.':'This content does not meet the study-community safety rules.';}
