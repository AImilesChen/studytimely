import {UsersThree,CalendarBlank,ChartBar,SquaresFour,GearSix} from '@phosphor-icons/react';

const tabs = [
  ['study','Study together','Timers & partners','Start your own timer and study alongside your partners. No activity booking is needed.',UsersThree],
  ['tasks','Study activities','Book, join & review','Arrange a group session, bring your own task and record your result afterwards.',CalendarBlank],
  ['progress','Group progress','Study time & goals','See confirmed room study time and progress towards your shared daily goal.',ChartBar],
  ['advanced','Group tools','Tasks, routines & atmosphere','Open a shared task, recurring activity, challenge or room atmosphere. Each tool explains its access and next step.',SquaresFour],
  ['manage','Manage','Room access & settings','Review room access, theme, invitations and community preferences. Owner controls depend on your role.',GearSix]
];

export function RoomWorkspaceNav({value,onChange}) {
  function choose(id) {onChange(id);}
  function onKeyDown(event,index) {
    if(event.ctrlKey || event.metaKey || event.altKey)return;
    let next=index;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=tabs.length-1;
    else return;
    event.preventDefault();choose(tabs[next][0]);document.getElementById('room-tab-'+tabs[next][0])?.focus();
  }
  return <>
    <div className="room-workspace-tabs room-workspace-explained" role="tablist" aria-label="Room workspace" data-active={value}>
      {tabs.map(([id,label,short,,Icon],index)=><button type="button" role="tab" key={id} id={'room-tab-'+id} data-tone={id} aria-label={label} aria-describedby={'room-tab-description-'+id} aria-selected={value===id} aria-controls={['study','tasks','progress'].includes(id)?'room-panel-basic':'room-panel-'+id} tabIndex={value===id?0:-1} onClick={()=>choose(id)} onKeyDown={event=>onKeyDown(event,index)}><Icon size={19} aria-hidden="true"/><span><strong>{label}</strong><small id={'room-tab-description-'+id}>{short}</small></span></button>)}
    </div>
    {!['tasks','progress','advanced'].includes(value)&&<p className="room-workspace-description">{tabs.find(tab=>tab[0]===value)?.[3]}</p>}
  </>;
}
