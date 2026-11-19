"""Encode the reviewed built-in image_gen outputs; never modifies the originals."""
import json, hashlib, shutil
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parents[2]
spec = json.loads((root / 'docs/development/focus-nature-prompts-2026-11-19.json').read_text(encoding='utf-8'))
out = root / 'app/public/focus-scenes'
evidence = root / 'docs/development/evidence/focus-nature-library-2026-11-19'
evidence.mkdir(parents=True, exist_ok=True)
originals = evidence / 'originals'
originals.mkdir(exist_ok=True)
manifest = []
sheet = Image.new('RGB', (1200, 4 * 255), '#f4f6f1')
draw = ImageDraw.Draw(sheet)
for i, scene in enumerate(spec['scenes']):
    source = Path(scene['source'])
    shutil.copy2(source, originals / (scene['id'] + '.png'))
    with Image.open(source) as im:
        image = ImageOps.fit(im.convert('RGB'), (1664, 936), method=Image.Resampling.LANCZOS)
        target = out / (scene['id'] + '-generated-v1.webp')
        image.save(target, 'WEBP', quality=87, method=6)
        thumb = image.resize((384, 216), Image.Resampling.LANCZOS)
        x, y = (i % 3) * 400 + 8, (i // 3) * 255 + 8
        sheet.paste(thumb, (x, y))
        draw.text((x, y + 222), scene['name'] + ' / ' + scene['group'], fill='#253d36')
    data = target.read_bytes()
    manifest.append({'id':scene['id'], 'file':target.name, 'bytes':len(data), 'dimensions':[1664,936], 'sha256':hashlib.sha256(data).hexdigest()})
sheet.save(evidence / 'scene-contact-sheet.jpg', quality=91)
(evidence / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps({'images':len(manifest), 'totalBytes':sum(x['bytes'] for x in manifest), 'maxBytes':max(x['bytes'] for x in manifest), 'contactSheet':str(evidence / 'scene-contact-sheet.jpg')}, indent=2))
