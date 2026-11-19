// Small editorial illustrations for the public group guide; UI controls keep
// their existing icon system. Each object represents the card beside it.
export function GroupFeatureMark({kind}){
 const paper='#fffaf0',mint='#b9e4cd',blue='#b8d6f4',lilac='#d5c4f2',peach='#f7d6a5',rose='#eba49c';
 return <svg className="group-feature-mark" viewBox="0 0 80 72" fill="none" stroke="#304f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
 {kind==='partners'&&<>
  <circle cx="24" cy="19" r="9" fill={peach}/><circle cx="56" cy="19" r="9" fill={rose}/>
  <path d="M9 44v-5c0-7 6-11 15-11s15 4 15 11v5" fill={mint}/><path d="M41 44v-5c0-7 6-11 15-11s15 4 15 11v5" fill={blue}/>
  <path d="M13 41c9-3 18-2 27 3 9-5 18-6 27-3v23c-10-3-18-2-27 2-9-4-17-5-27-2Z" fill={paper}/>
  <path d="M40 44v22M20 49c4-1 8 0 13 2m-13 6c4-1 8 0 13 2m14-8c5-2 9-3 13-2m-13 10c5-2 9-3 13-2"/>
  <path d="m23 12 3 1m29-1 3 1"/>
 </>}
 {kind==='tasks'&&<>
  <path d="M13 15h43v47H13Z" fill={blue} transform="rotate(-7 34 38)"/>
  <rect x="23" y="10" width="43" height="53" rx="5" fill={paper}/>
  <rect x="34" y="7" width="21" height="9" rx="3" fill={mint}/>
  <rect x="30" y="24" width="8" height="8" rx="2" fill={mint}/><path d="m32 28 2 2 4-5m6 2h13m-27 14h8m6 0h13m-27 13h8m6 0h8"/>
  <path d="m55 50 12-22 6 4-12 22-7 5Z" fill={peach}/><path d="m67 28 2-4 6 4-2 4m-18 18 6 4"/>
 </>}
 {kind==='appointment'&&<>
  <rect x="12" y="14" width="55" height="48" rx="6" fill={paper}/>
  <path d="M18 14h43a6 6 0 0 1 6 6v9H12v-9a6 6 0 0 1 6-6Z" fill={lilac}/>
  <path d="M25 9v12m28-12v12" strokeWidth="4"/>
  <path d="M22 38h5m10 0h5m10 0h5m-35 12h5m10 0h5"/>
  <circle cx="60" cy="55" r="13" fill={mint}/><path d="M60 47v8l5 3"/>
 </>}
 {kind==='journal'&&<>
  <path d="M13 13h43l10 10v40H13Z" fill={lilac}/>
  <path d="M21 9h35l10 10v40H21Z" fill={paper}/><path d="M56 9v10h10M28 22h20"/>
  <path d="M28 34h13m-13 7h9m-9 7h7"/>
  <path d="M44 47V35h6v12m3 0V28h6v19" fill={blue}/><path d="M41 48h20"/>
  <path d="M13 20h11m-11 12h11m-11 12h11m-11 12h11" strokeWidth="3"/>
  <circle cx="61" cy="58" r="10" fill={mint}/><path d="m56 58 4 4 6-8"/>
 </>}
 {kind==='organisers'&&<>
  <path d="m15 16 40-4 4 46-40 4Z" fill={blue}/>
  <rect x="26" y="17" width="42" height="46" rx="5" fill={paper}/>
  <path d="M38 17v-5h18v5"/><circle cx="47" cy="33" r="7" fill={peach}/>
  <path d="M35 51v-2c0-6 5-10 12-10s12 4 12 10v2Z" fill={mint}/><path d="M37 57h20"/>
  <path d="m18 36-9 6 4 10 7 2 5-4-3-8Z" fill={lilac}/><path d="m16 45 3 3 4-6"/>
 </>}
 {kind==='atmosphere'&&<>
  <path d="M18 40V30a22 22 0 0 1 44 0v10" stroke={blue} strokeWidth="10"/>
  <path d="M18 39V30a22 22 0 0 1 44 0v9"/>
  <rect x="12" y="34" width="14" height="23" rx="6" fill={blue}/><rect x="54" y="34" width="14" height="23" rx="6" fill={lilac}/>
  <path d="M34 61c-3-14 0-22 12-28 4 13 1 22-12 28Z" fill={mint}/><path d="m34 61 8-18m-8 18v5"/>
  <path d="M63 18v-9l8-2v9"/><ellipse cx="60" cy="19" rx="3" ry="2" fill={peach}/><ellipse cx="68" cy="17" rx="3" ry="2" fill={peach}/>
 </>}
 </svg>;
}
