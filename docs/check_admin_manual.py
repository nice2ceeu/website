from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from zipfile import ZipFile
import json

root = Path(__file__).resolve().parent
path = root / 'Lightmare_PH_Admin_Visual_Manual.docx'
doc = Document(path)
pages = [[]]
for p in doc.paragraphs:
    if 'w:type="page"' in p._p.xml:
        pages.append([])
    else:
        pages[-1].append(p)
normal = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 42)
bold = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 48)
report = {'sections': len(pages), 'images': len(doc.inline_shapes), 'estimated_layout': []}
for i, paragraphs in enumerate(pages, 1):
    h = 0
    for p in paragraphs:
        if p._p.xpath('.//w:drawing'):
            h += sum(int(e.get('cy')) / 12700 for e in p._p.xpath('.//wp:extent')) + 4
            continue
        name = p.style.name
        size = {'Title':25, 'Heading 1':21, 'Heading 2':12, 'Caption':8}.get(name,10)
        f = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf' if name in ['Title','Heading 1','Heading 2'] else 'C:/Windows/Fonts/arial.ttf', int(size*4))
        lines = 1
        line = ''
        for word in p.text.split():
            test = (line+' '+word).strip()
            if f.getlength(test) > 6.93*72*4:
                lines += 1
                line = word
            else:
                line = test
        h += lines * size * 1.3 + (16 if name == 'Heading 2' else 8)
    report['estimated_layout'].append({'section':i,'height_points':round(h),'available_points':752,'within_estimate':h<735})
assert len(pages)==16 and len(doc.inline_shapes)==17
assert all(x['within_estimate'] for x in report['estimated_layout'])
with ZipFile(path) as z:
    assert z.testzip() is None
report['renderer'] = 'DOCX HTML preview in local headless Chromium. See browser-render/layout.json. Microsoft Word pagination is not verified.'
(root/'manual-review'/'structure-and-layout.json').write_text(json.dumps(report,indent=2))
sheet = Image.new('RGB',(1440,1220),'white')
for i in range(1,17):
    im=Image.open(root/'manual-review'/'browser-render'/f'page-{i}.png')
    im.thumbnail((360,305))
    sheet.paste(im,(((i-1)%4)*360,((i-1)//4)*305))
sheet.save(root/'manual-review'/'revised-pages-overview.png')
print(json.dumps(report,indent=2))
