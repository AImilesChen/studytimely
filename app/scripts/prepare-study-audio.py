"""Acquire explicitly licensed audio and make quiet, versioned local encodes.
No audio is played by this script. Raw sources and license snapshots stay in ignored evidence.
"""
import concurrent.futures, hashlib, html, json, re, subprocess, urllib.parse, urllib.request
from pathlib import Path
import imageio_ffmpeg
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
EVIDENCE=ROOT/'docs/development/evidence/sound-library-2026-11-19'
RAW=EVIDENCE/'sources'
RAW.mkdir(parents=True,exist_ok=True)
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
HEADERS={'User-Agent':'Mozilla/5.0 (StudyTimely audio source verification)'}
NATURE=[
 ('rain','Gentle rain','Nature','free','Legnalegna55','551989'),
 ('stream','Small brook','Nature','free','SamsterBirdies','584269'),
 ('waves','Calm shore','Nature','free','clement.bernardeau','699225'),
 ('nature','Soft breeze','Nature','free','fthgurdy','528944'),
 ('forest','Forest ambience','Nature','free','deadrobotmusic','687053'),
 ('fire','Soft fireplace','Spaces','free','BonnyOrbit','484337'),
 ('fan','Steady fan','Spaces','free','shyguy014','537881'),
 ('keyboard','Gentle typing','Spaces','free','grcekh','546043'),
 ('cafe','Distant cafe','Spaces','free','mikemoons','579500'),
]
ADDITIONS=[
 ('meditation-02','Meditation Impromptu 02','Piano'),('meditation-03','Meditation Impromptu 03','Piano'),
 ('fresh-air','Fresh Air','Piano'),('gymnopedie-1','Gymnopedie No. 1','Piano'),
 ('gymnopedie-2','Gymnopedie No. 2','Piano'),('clear-waters','Clear Waters','Piano'),
 ('moonstone','Moonstone','Piano'),('starry','Starry','Piano'),
 ('manatees','Music for Manatees','Ambient'),('organic-one','Organic Meditations One','Ambient'),
 ('organic-three','Organic Meditations Three','Ambient'),('tranquility','Tranquility','Ambient'),
 ('soaring','Soaring','Ambient'),('northern-glade','Northern Glade','Ambient'),
 ('dreamer','Dreamer','Gentle rhythm'),('late-night-radio','Late Night Radio','Gentle rhythm'),
 ('study-relax','Study And Relax','Gentle rhythm'),('clean-soul','Clean Soul','Gentle rhythm'),
 ('light-thought','Light Thought var 1','Gentle rhythm'),('easy-lemon','Easy Lemon','Gentle rhythm')
]

def request(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=45) as r:return r.read()
def source(url,path):
 if not path.exists():
  if url.endswith('.mp3'):
   # Official byte ranges keep large downloads bounded and resumable on slow connections.
   req=urllib.request.Request(url,headers={**HEADERS,'Range':'bytes=0-1023'})
   with urllib.request.urlopen(req,timeout=45) as r:
    part=r.read();span=r.headers.get('Content-Range','')
   if span.startswith('bytes '):
    total=int(span.split('/')[-1]);chunk=1024*1024
    def piece(start):
     end=min(total-1,start+chunk-1);target=path.with_suffix('.part-'+str(start))
     if target.exists() and target.stat().st_size==end-start+1:return target.read_bytes()
     for attempt in range(3):
      try:
       req=urllib.request.Request(url,headers={**HEADERS,'Range':f'bytes={start}-{end}'})
       with urllib.request.urlopen(req,timeout=45) as response:
        if response.status!=206 or response.headers.get('Content-Range')!=f'bytes {start}-{end}/{total}':raise RuntimeError('Audio range not supported')
        data=response.read()
       if len(data)!=end-start+1:raise RuntimeError('Incomplete audio range')
       target.write_bytes(data);return data
      except Exception:
       if attempt==2:raise
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as download:
     data=b''.join(download.map(piece,range(0,total,chunk)))
    if len(data)!=total:raise RuntimeError('Incomplete recording')
    path.write_bytes(data)
   else:path.write_bytes(request(url))
  else:path.write_bytes(request(url))
 return path.read_bytes()
def run(args):
 r=subprocess.run([FFMPEG,'-hide_banner','-nostdin',*args],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=240)
 if r.returncode:raise RuntimeError(r.stderr[-1200:])
 return r
def duration(path):
 r=run(['-i',str(path),'-t','0','-f','null','-'])
 m=re.search(r'Duration: (\d+):(\d+):([\d.]+)',r.stderr)
 if not m:raise RuntimeError('Missing media duration')
 return int(m[1])*3600+int(m[2])*60+float(m[3])
def finish(tmp,folder,id):
 data=tmp.read_bytes()
 if len(data)<4096:raise RuntimeError(id+': empty or truncated audio encode')
 digest=hashlib.sha256(data).hexdigest();target=folder/(id+'.'+digest[:12]+'.mp3')
 folder.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 return {'src':'/'+str(target.relative_to(ROOT/'app/public')).replace('\\','/'),'bytes':len(data),'sha256':digest,'durationSeconds':round(duration(target),3)}

def nature(item):
 id,title,group,tier,author,sound=item
 url=f'https://freesound.org/people/{author}/sounds/{sound}/'
 page=source(url,RAW/(id+'-license.html')).decode('utf-8')
 if 'creativecommons.org/publicdomain/zero/1.0' not in page:raise RuntimeError(id+': CC0 not verified')
 matches=re.findall(r'https://cdn\.freesound\.org/[^\s\"<>]+-hq\.mp3',page)
 if not matches:raise RuntimeError(id+': no public high-quality media preview')
 download=html.unescape(matches[0]);original=RAW/(id+'-original.mp3');source(download,original)
 total=duration(original);start=2 if total>14 else 0;length=min(44,total-start-.25);fade=min(2,length/8)
 tmp=RAW/(id+'-processed.mp3')
 # Crossfade decoded samples explicitly so the loop has no hard edge or silent dip.
 pcm=RAW/(id+'-excerpt.f32')
 run(['-y','-i',str(original),'-ss',str(start),'-t',str(length),'-ac','1','-ar','32000','-f','f32le',str(pcm)])
 data=np.fromfile(pcm,dtype='<f4');n=int(fade*32000)
 if len(data)<n*4:raise RuntimeError(id+': insufficient decoded audio')
 weight=np.linspace(0,1,n,dtype=np.float32)
 loop=np.concatenate([data[n:-n],data[-n:]*(1-weight)+data[:n]*weight]);loop.tofile(pcm)
 filters=f'highpass=f=70,lowpass=f={1800 if id=="cafe" else 5500},acompressor=threshold=0.15:ratio=2:attack=25:release=250,loudnorm=I=-25:TP=-5:LRA=6'
 run(['-y','-f','f32le','-ar','32000','-ac','1','-i',str(pcm),'-af',filters,'-map_metadata','-1','-ar','32000','-c:a','libmp3lame','-b:a','96k',str(tmp)])
 result={'id':id,'title':title,'group':group,'plannedTier':tier,'kind':'Field recording','artist':author,'source':url,'downloadSource':download,'license':'CC0 1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','changes':'Excerpt, mono conversion, gentle high/low-pass filtering, controlled peaks, loudness adjustment and blended loop boundary.','sourceSha256':hashlib.sha256(original.read_bytes()).hexdigest(),**finish(tmp,ROOT/'app/public/ambient',id)}
 print('Prepared ambience: '+id,flush=True);return result

def music(item,rows,old):
 id,title,category=item;row=next(r for r in rows if r['title']==title)
 url='https://incompetech.com/music/royalty-free/index.html?isrc='+row['isrc']
 page=source(url,RAW/(id+'-license.html')).decode('utf-8')
 if 'creativecommons.org/licenses/by/4.0' not in page:raise RuntimeError(id+': CC BY 4.0 not verified')
 download='https://incompetech.com/music/royalty-free/mp3-royaltyfree/'+urllib.parse.quote(row['filename'])
 original=RAW/(id+'-original.mp3')
 if id in old:
  if not original.exists():original.write_bytes((ROOT/'app/public'/old[id]['src'].lstrip('/')).read_bytes())
 else:source(download,original)
 tmp=RAW/(id+'-processed.mp3')
 run(['-y','-i',str(original),'-map','0:a:0','-af','loudnorm=I=-23:TP=-3:LRA=8','-map_metadata','-1','-ar','44100','-c:a','libmp3lame','-b:a','160k',str(tmp)])
 result={'id':id,'title':title,'category':category,'style':'Harp' if id=='evening-harp' else {'Piano':'Piano','Ambient':'Ambient instrumental','Gentle rhythm':'Gentle instrumental rhythm'}[category],'plannedTier':'free' if id in old else 'expanded','artist':'Kevin MacLeod','artistUrl':'https://incompetech.com/','isrc':row['isrc'],'source':url,'downloadSource':download,'license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','changes':'Full recording; loudness adjusted for quiet playback and re-encoded to MP3. No melodic edits.','instruments':row.get('instruments',''),'sourceFeel':row.get('feel',''),'sourceSha256':hashlib.sha256(original.read_bytes()).hexdigest(),**finish(tmp,ROOT/'app/public/music',id)}
 if result['bytes']>=25*1024*1024:raise RuntimeError(id+': media exceeds static asset limit')
 print('Prepared music: '+id,flush=True);return result

if __name__=='__main__':
 rows=json.loads((EVIDENCE/'incompetech-pieces.json').read_text(encoding='utf-8'))
 oldspec=json.loads((ROOT/'app/public/music/catalog.json').read_text(encoding='utf-8'))
 # Preserve the first manifest so repeat runs always read the original five recordings.
 backup=EVIDENCE/'original-music-catalog.json'
 if not backup.exists():backup.write_text(json.dumps(oldspec,indent=2),encoding='utf-8')
 oldspec=json.loads(backup.read_text(encoding='utf-8'));old={t['id']:t for t in oldspec['tracks']}
 initial=[(t['id'],t['title'],'Ambient' if t['id']=='water-prelude' else 'Gentle rhythm' if t['id']=='dream-culture' else 'Piano') for t in oldspec['tracks']]
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  ambient=list(pool.map(nature,NATURE))
  tracks=list(pool.map(lambda item:music(item,rows,old),initial+ADDITIONS))
 for name,data in [('ambient',{'checkedAt':'2026-11-19','sounds':ambient}),('music',{**oldspec,'checkedAt':'2026-11-19','tracks':tracks})]:
  path=ROOT/'app/public'/name/'catalog.json';path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  credit=[f'StudyTimely {name} credits — 19 November 2026','']
  for t in data.get('sounds',data.get('tracks',[])):
   credit += [t['title']+' — '+t['artist'],t.get('isrc',''),t['source'],t['license']+' — '+t['licenseUrl'],'Changes: '+t['changes'],'']
  (path.parent/'CREDITS.txt').write_text('\n'.join(credit),encoding='utf-8')
 (EVIDENCE/'source-manifest.json').write_text(json.dumps({'ambient':ambient,'music':tracks},ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'recordings':len(ambient),'music':len(tracks),'ambientBytes':sum(s['bytes'] for s in ambient),'musicBytes':sum(t['bytes'] for t in tracks)}),flush=True)
