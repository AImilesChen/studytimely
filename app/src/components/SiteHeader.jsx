import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {CaretDown,List,UsersThree,Trophy,UserCircle,ArrowUpRight} from '@phosphor-icons/react';
import {Dialog} from './Dialog.jsx';
import {TOOL_GROUPS,primaryLinks,isToolPath} from '../lib/global-navigation.mjs';
import {accountStatus,accountNavigation} from '../lib/account-status.mjs';
import '../site-navigation.css';
const icons={community:UsersThree,'/leaderboard':Trophy,account:UserCircle};
function ToolLinks({path,follow,prefix}){return <nav className="site-tool-groups" aria-label="All tools">{TOOL_GROUPS.map((group,i)=><section key={group.title} aria-labelledby={prefix+i}><h3 id={prefix+i}>{group.title}</h3><ul>{group.links.map(([label,url])=>{const current=path===url||(url==='/time'&&path.startsWith('/time/'));return <li key={url}><a href={url} onClick={follow} aria-current={current?'page':undefined}>{label}{current&&<span className="site-current-label">Current</span>}</a></li>;})}</ul></section>)}</nav>;}
export function SiteHeader({path,navigate,children,hidden=false,communityEnabled=true,accountsEnabled=true}){
 const status=useSyncExternalStore(accountStatus.subscribe,accountStatus.getSnapshot,accountStatus.getServerSnapshot);
 const [open,setOpen]=useState(false),[toolsOpen,setToolsOpen]=useState(false),links=primaryLinks({communityEnabled,accountsEnabled}).map(link=>link.kind==='account'?{...link,...accountNavigation(status)}:link),disclosure=useRef(null),trigger=useRef(null),mobileTrigger=useRef(null);
 useEffect(()=>{if(accountsEnabled)accountStatus.refresh();},[accountsEnabled,path]);
 useEffect(()=>{if(!accountsEnabled)return;const refresh=()=>{if(!document.hidden)accountStatus.refresh(true);};window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};},[accountsEnabled]);
 useEffect(()=>{setOpen(false);setToolsOpen(false);},[path,hidden]);
 useEffect(()=>{
  const mq=window.matchMedia('(max-width:1050px)');
  function resize(){const restore=disclosure.current?.contains(document.activeElement)||document.activeElement?.closest('.site-explorer-dialog');setToolsOpen(false);setOpen(false);if(restore)requestAnimationFrame(()=>(mq.matches?mobileTrigger.current:trigger.current)?.focus({preventScroll:true}));}
  mq.addEventListener('change',resize);return()=>mq.removeEventListener('change',resize);
 },[]);
 useEffect(()=>{
  if(!toolsOpen||hidden)return;
  disclosure.current?.querySelector('.site-tools-dropdown a')?.focus({preventScroll:true});
  const outside=e=>{if(!disclosure.current?.contains(e.target))setToolsOpen(false);};
  const escape=e=>{if(e.key==='Escape'){e.preventDefault();setToolsOpen(false);trigger.current?.focus({preventScroll:true});}};
  document.addEventListener('pointerdown',outside);document.addEventListener('focusin',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',outside);document.removeEventListener('keydown',escape);};
 },[toolsOpen,hidden]);
 function follow(event){navigate(event);if(event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){setOpen(false);setToolsOpen(false);}}
 return <><header className="site-header global-site-header"><a className="wordmark" href="/" onClick={follow}>StudyTimely</a>
  <nav className="site-primary-nav" aria-label="Primary navigation"><div className="site-tool-disclosure" ref={disclosure}><button ref={trigger} type="button" className="site-tools-trigger" onClick={()=>setToolsOpen(v=>!v)} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setToolsOpen(true);}}} aria-expanded={toolsOpen&&!hidden} aria-controls="site-tools-dropdown" data-active={isToolPath(path)||undefined}>Tools <CaretDown size={15} aria-hidden="true"/></button><div id="site-tools-dropdown" className="site-tools-dropdown" hidden={!toolsOpen||hidden}><ToolLinks path={path} follow={follow} prefix="desktop-tool-group-"/></div></div>{links.map(link=><a key={link.path} className={link.kind==='account'?'site-account-link':undefined} href={link.href||link.path} onClick={follow} aria-current={path===link.path?'page':undefined}>{link.label}</a>)}</nav>
  <div className="header-actions">{children}<button ref={mobileTrigger} className="icon-button site-menu-toggle" type="button" onClick={()=>setOpen(true)} aria-label="Open navigation menu" aria-expanded={open} aria-haspopup="dialog" aria-controls="site-explorer-content"><List size={23}/><span>Menu</span></button></div>
 </header>
 <Dialog open={open&&!hidden} title="Explore StudyTimely" close={()=>setOpen(false)} initialFocus="a" className="site-explorer-dialog" preserveScroll><div className="site-explorer-body" id="site-explorer-content">
  {links.length>0&&<nav className="site-explorer-primary" aria-label="Community and account">{links.map(link=>{const Icon=icons[link.path]||icons[link.kind];return <a key={link.path} href={link.href||link.path} onClick={follow} aria-current={path===link.path?'page':undefined}><Icon size={24} weight="light"/><span><strong>{link.label}</strong><small>{link.description}</small></span><ArrowUpRight size={16}/></a>;})}</nav>}
  <ToolLinks path={path} follow={follow} prefix="mobile-tool-group-"/>
  <p className="site-explorer-note">Timers and planning tools are free to use without an account. Sign in to participate in study groups or use optional cloud sync.</p>
 </div></Dialog></>;
}
