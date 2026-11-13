import {useEffect,useRef} from 'react';
import {X} from '@phosphor-icons/react';
export function Dialog({open,title,close,children,initialFocus}){
 const ref=useRef(null),previous=useRef(null);
 useEffect(()=>{const dialog=ref.current;if(open&&!dialog.open){previous.current=document.activeElement;dialog.showModal();if(initialFocus)dialog.querySelector(initialFocus)?.focus();}else if(!open&&dialog.open){dialog.close();previous.current?.focus?.({preventScroll:true});}},[open,initialFocus]);
 return <dialog ref={ref} aria-label={title} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===ref.current)close();}}><div className="modal-head"><h2>{title}</h2><button className="icon-button" type="button" aria-label="Close" onClick={close}><X size={22}/></button></div>{children}</dialog>;
}
