const base='/design-assets/chat-stickers/';
export const STUDY_STICKERS=Object.freeze({
 study:{src:base+'study-cat-v2.webp',label:'study cat'},
 encourage:{src:base+'encourage-cat-v2.webp',label:'cheering cat'},
 complete:{src:base+'complete-cat-v2.webp',label:'celebration cat'},
 break:{src:base+'break-cat-v2.webp',label:'break cat'},
 help:{src:base+'help-cat-v2.webp',label:'puzzled cat'}
});
const mapping={starting:'study',completed:'complete',break:'break',help:'help','keep-going':'encourage','well-done':'complete',thanks:'encourage','start-together':'study','another-round':'study','break-together':'break'};
export function stickerForMessage(message){const id=typeof message==='string'?message:message?.quick_id||message?.template_id;if(!Object.hasOwn(mapping,id))return null;const type=mapping[id];return {...STUDY_STICKERS[type],type};}
