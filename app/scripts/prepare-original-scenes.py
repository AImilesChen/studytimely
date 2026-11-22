"""Encode reviewed image_gen outputs. No source art is downloaded.
Source PNGs stay in ignored evidence; changed artwork needs a new asset version.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import hashlib
import json
import shutil

project=Path(__file__).resolve().parents[2]
generated=Path('G:/CodexHome/generated_images/01a1f805-75b4-74d2-a8ea-bee79e06a206')
evidence=project/'docs/development/evidence/original-wallpapers-2026-11-22'
source_folder=evidence/'originals'
public=project/'app/public/focus-scenes'
previews=public/'previews'
for folder in [evidence,source_folder,previews]:
    folder.mkdir(parents=True,exist_ok=True)
items=[
 ('cobalt-horizon','blue','exec-2a9c7a8b-62db-4a36-92ca-a47c2d85e917.png'),
 ('reedwater','reeds','exec-e009e7c1-07fd-4da4-9e7d-df0ecdb7a44d.png'),
 ('cosmos-shore','flowers','exec-e59f0ae4-bd5b-4296-9326-16c912809a54.png'),
 ('golden-birches','birch','exec-326b7d3c-7cf5-4000-a173-9b7ddecbdcf4.png'),
 ('amber-canopy','amber','exec-b7261688-e799-4cfe-9f60-554f253a4683.png'),
 ('harbor-bookshop','street','exec-d85c7faf-80bb-4097-84ae-6cb1568bc381.png'),
 ('daisy-nap','kitten','exec-3abddb13-72e4-4304-8a4e-c3e838834b39.png'),
 ('curious-calves','calves','exec-e7016622-fbb9-436a-8647-6bbecbc5f745.png'),
 ('blanket-capybara','capybara','exec-e76adbb2-2331-46bd-9bbb-89c545ba74ab.png'),
 ('professor-duck','duck','exec-eef77c92-289c-4fb7-a1cb-dab8daf7f94c.png'),
 ('coastal-carriage','window','exec-041c51bb-139c-4fc3-a35f-19890b77fdf2.png'),
 ('golden-koi','koi','exec-7f2d0109-186a-4f27-9501-bffcbb43e070.png')
]
rows=[]
sheet=Image.new('RGB',(1440,4*302),(246,242,232))
draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
for index,(scene_id,key,filename) in enumerate(items):
    src=generated/filename
    shutil.copy2(src,source_folder/(scene_id+'.png'))
    image=Image.open(src).convert('RGB')
    image=ImageOps.fit(image,(1664,936),method=Image.Resampling.LANCZOS)
    full=public/(scene_id+'-generated-v1.webp')
    image.save(full,'WEBP',quality=86,method=6)
    thumb=previews/(scene_id+'-v1.webp')
    image.resize((480,270),Image.Resampling.LANCZOS).save(thumb,'WEBP',quality=76,method=6)
    assert full.stat().st_size<800000
    data=full.read_bytes()
    rows.append(dict(id=scene_id,sourceSha256=hashlib.sha256(src.read_bytes()).hexdigest(),src='/focus-scenes/'+full.name,width=1664,height=936,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),thumbnail='/focus-scenes/previews/'+thumb.name,thumbnailSha256=hashlib.sha256(thumb.read_bytes()).hexdigest(),promptKey=key))
    x=(index%3)*480
    y=(index//3)*302
    sheet.paste(image.resize((480,270),Image.Resampling.LANCZOS),(x,y))
    draw.text((x+12,y+277),scene_id.replace('-',' ').title(),font=font,fill=(39,35,30))
sheet.save(evidence/'collection.jpg',quality=90)
manifest=dict(generatedDate='2026-11-22',tool='built-in image_gen',description='New AI-generated artwork; no social-media source image files were copied or supplied as edit targets. General subjects, palettes and moods informed original text prompts.',assets=rows)
(project/'docs/development/wallpaper-assets-2026-11-22.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(count=len(rows),totalBytes=sum(row['bytes'] for row in rows),sheet=str(evidence/'collection.jpg'))))
