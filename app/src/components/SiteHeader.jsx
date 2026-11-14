import {useEffect,useState} from 'react';
import {CaretDown,List,UsersThree,Trophy,UserCircle,ArrowUpRight} from '@phosphor-icons/react';
import {Dialog} from './Dialog.jsx';
import {TOOL_GROUPS,primaryLinks,isToolPath} from '../lib/global-navigation.mjs';
import '../site-navigation.css';
const icons={community:UsersThree,'/leaderboard':Trophy,account:UserCircle};
export function SiteHeader({path,navigate,children,hidden=false,communityEnabled=true,accountsEnabled=true}){
 const [open,setOpen]=useState(false),links=primaryLinks({communityEnabled,accountsEnabled});
 useEffect(()=>{setOpen(false);},[path,hidden]);
 function follow(event){navigate(event);if(event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey)setOpen(false);}
 return <><header className="site-header global-site-header"><a className="wordmark" href="/" onClick={follow}>StudyTimely</a>
  <nav className="site-primary-nav" aria-label="Primary navigation"><button type="button" className="site-tools-trigger" onClick={()=>setOpen(true)} aria-expanded={open} aria-haspopup="dialog" aria-controls="site-explorer-content" data-active={isToolPath(path)||undefined}>Tools <CaretDown size={15}/></button>{links.map(link=><a key={link.path} href={link.path} onClick={follow} aria-current={path===link.path?'page':undefined}>{link.label}</a>)}</nav>
  <div className="header-actions">{children}<button className="icon-button site-menu-toggle" type="button" onClick={()=>setOpen(true)} aria-label="Open navigation menu" aria-expanded={open} aria-haspopup="dialog" aria-controls="site-explorer-content"><List size={23}/><span>Menu</span></button></div>
 </header>
 <Dialog open={open&&!hidden} title="Explore StudyTimely" close={()=>setOpen(false)} initialFocus="a" className="site-explorer-dialog" preserveScroll><div className="site-explorer-body" id="site-explorer-content">
  {links.length>0&&<nav className="site-explorer-primary" aria-label="Community and account">{links.map(link=>{const Icon=icons[link.path]||icons[link.kind];return <a key={link.path} href={link.path} onClick={follow} aria-current={path===link.path?'page':undefined}><Icon size={24} weight="light"/><span><strong>{link.label}</strong><small>{link.description}</small></span><ArrowUpRight size={16}/></a>;})}</nav>}
  <nav className="site-tool-groups" aria-label="All tools">{TOOL_GROUPS.map((group,i)=><section key={group.title} aria-labelledby={'site-tool-group-'+i}><h3 id={'site-tool-group-'+i}>{group.title}</h3><ul>{group.links.map(([label,url])=><li key={url}><a href={url} onClick={follow} aria-current={path===url?'page':undefined}>{label}{path===url&&<span className="site-current-label">Current</span>}</a></li>)}</ul></section>)}</nav>
  <p className="site-explorer-note">Timers and planning tools are free to use without an account. Sign in to participate in study groups or use optional cloud sync.</p>
 </div></Dialog></>;
}
