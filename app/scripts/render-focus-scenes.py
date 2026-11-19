"""Render fixed-camera nature loops. Run from app/: python scripts/render-focus-scenes.py.
Needs the local imageio-ffmpeg tool; not an app dependency. Source clips and
provenance are recorded in StudyTimely-Focus-Motion-2026-11-19.md.
"""
from pathlib import Path
import subprocess
import imageio_ffmpeg
APP=Path(__file__).resolve().parents[1]
EVIDENCE=APP.parent/'docs/development/evidence/focus-space-2026-11-19'
OUT=APP/'public/focus-scenes'
for key in ['rain','coast']:
    grade='eq=brightness=0.16:contrast=0.9:saturation=0.65' if key=='rain' else 'eq=brightness=0.02:saturation=0.78'
    graph=('[0:v]split[a][b];[a]trim=start=2:end=18,setpts=PTS-STARTPTS,fps=24,settb=1/24[body];'
           '[b]trim=start=0:end=2,setpts=PTS-STARTPTS,fps=24,settb=1/24[head];'
           '[body][head]xfade=transition=fade:duration=2:offset=14,'
           +grade+',scale=1600:900,setsar=1,format=yuv420p[out]')
    output=OUT/f'{key}-nature-v1.mp4'
    args=[imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-y','-i',str(EVIDENCE/f'{key}-source-trim.mp4'),
          '-filter_complex',graph,'-map','[out]','-t','16','-an','-c:v','libx264','-preset','slow','-crf','25',
          '-maxrate','2500k','-bufsize','5000k','-movflags','+faststart',str(output)]
    with (EVIDENCE/f'{key}-nature-render.log').open('w') as log:
        subprocess.run(args,check=True,stdout=log,stderr=log)
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-y','-i',str(output),'-frames:v','1',
                    '-quality','87',str(OUT/f'{key}-nature-v1.webp')],check=True)
    print(key,output.stat().st_size,flush=True)
