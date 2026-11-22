"""Derive public eight-second samples from the reviewed local recordings.
Uses the existing local imageio-ffmpeg tool, without downloading sources or
changing the original recordings. Keep attribution with the music catalogue.
"""
import hashlib
import json
import subprocess
from pathlib import Path
import imageio_ffmpeg

root=Path(__file__).resolve().parents[1]
catalogue=root/'public/music/catalog.json'
data=json.loads(catalogue.read_text(encoding='utf-8'))
folder=root/'public/music/samples'
folder.mkdir(exist_ok=True)
for track in data['tracks']:
    temporary=folder/(track['id']+'.tmp.mp3')
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-y','-i',str(root/'public'/track['src'].lstrip('/')),'-t','8','-vn','-af','afade=t=out:st=7.5:d=0.5','-codec:a','libmp3lame','-b:a','96k',str(temporary)],check=True)
    audio=temporary.read_bytes()
    sha=hashlib.sha256(audio).hexdigest()
    name=f"{track['id']}-8s.{sha[:12]}.mp3"
    temporary.replace(folder/name)
    track.update(sampleSrc='/music/samples/'+name,sampleBytes=len(audio),sampleSha256=sha)
catalogue.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"Prepared {len(data['tracks'])} eight-second samples; original recordings unchanged.")
scenes=root/'public/focus-scenes'
previews=scenes/'previews'
previews.mkdir(exist_ok=True)
count=0
for source in scenes.glob('*.webp'):
    for ending in ['-generated-v1.webp','-nature-v1.webp']:
        if source.name.endswith(ending):
            scene_id=source.name.removesuffix(ending)
            subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-y','-i',str(source),'-vf','scale=480:-2','-frames:v','1','-quality','76',str(previews/(scene_id+'-v1.webp'))],check=True)
            count+=1
print(f"Prepared {count} public scene thumbnails; full scenes unchanged.")
