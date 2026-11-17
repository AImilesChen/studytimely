import {useEffect,useRef} from 'react';
import {X} from '@phosphor-icons/react';
export function Dialog({open,title,close,children,initialFocus,className,preserveScroll=false,busy=false}){
 const ref=useRef(null),previous=useRef(null);
 useEffect(()=>{const dialog=ref.current;if(open&&!dialog.open){previous.current=document.activeElement;const position=preserveScroll?{left:window.scrollX,top:window.scrollY,behavior:'instant'}:null;dialog.showModal();if(initialFocus)dialog.querySelector(initialFocus)?.focus({preventScroll:true});if(position)window.scrollTo(position);}else if(!open&&dialog.open){dialog.close();previous.current?.focus?.({preventScroll:true});}},[open,initialFocus,preserveScroll]);
 return <dialog ref={ref} className={className} aria-label={title} onCancel={e=>{e.preventDefault();if(!busy)close();}} onClick={e=>{if(!busy&&e.target===ref.current)close();}}><div className="modal-head"><h2>{title}</h2><button className="icon-button" type="button" aria-label="Close" disabled={busy} onClick={close}><X size={22}/></button></div>{children}</dialog>;
}
