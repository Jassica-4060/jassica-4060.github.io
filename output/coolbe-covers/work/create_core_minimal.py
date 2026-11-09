from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import pypdfium2 as pdf
O=Path('/Users/coolbe/Claude/portfolio-site/output/coolbe-covers'); W=O/'work'
# Reuse the precise source crops and fonts, without running a previous composition.
source=(W/'update_cover_01_clearspace.py').read_text().split("a=Image.new")[0]
exec(compile(source,'source_assets','exec'))
CN='/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
NAVY='#20384F'; EDGE='#C6CED3'; BG='#F3F0E8'; SUB='#80909B'
def zh(im,xy,text,size=38,c=NAVY):
 ImageDraw.Draw(im).text(xy,text,font=ImageFont.truetype(CN,size),fill=c)
def panel(im,rect):ImageDraw.Draw(im).rounded_rectangle(rect,radius=30,fill='white',outline=EDGE,width=3)
def heading(im,x,y,num,title):
 txt(im,(x,y+8),num,25,SUB,mono=True);zh(im,(x+64,y),title,36)
a=Image.new('RGB',(2400,1800),BG)
# The asset is deliberately flat: no shadows, gradients, mascot render or perspective.
panel(a,(72,72,1472,850));panel(a,(1512,72,2328,850))
panel(a,(72,890,1472,1728));panel(a,(1512,890,2328,1728))
heading(a,118,109,'01','標誌組合')
put(a,logo,(218,326,1108,248))
# Quiet baseline reinforces the identity system without decorative complexity.
line(a,(241,671,1303,671),'#E7ECEF',2)
txt(a,(592,720),'C + B / CoolBe',27,SUB,mono=True)
heading(a,1558,109,'02','留白規範')
p=pdf.PdfDocument('/Users/coolbe/Documents/企業識別/Coolbe-企業識別.pdf')
hi=p[12].render(scale=5).to_pil().convert('RGB')
clear=hi.crop(tuple(int(v*5) for v in (86,205,326,439)))
put(a,clear,(1602,221,635,560))
heading(a,118,930,'03','企業標準字')
put(a,cn,(151,1118,1240,137))
line(a,(151,1362,1393,1362),'#E7ECEF',2)
put(a,en,(151,1450,1240,117))
heading(a,1558,930,'04','標準色')
# Pantone-style swatches; labels follow the user's original manual.
for x,col,ref in [(1558,'#68B1E8','17-4433 TCX'),(1800,'#6C757D','19-4108 TCX'),(2042,'#231815','CSI 1000018')]:
 d=ImageDraw.Draw(a)
 d.rectangle((x,1112,x+240,1582),fill='white',outline='#DEE3E7',width=2)
 d.rectangle((x,1112,x+240,1466),fill=col)
 txt(a,(x+16,1490),'PANTONE',27,'#171717',True)
 txt(a,(x+172,1488),'®',14,'#171717')
 txt(a,(x+16,1536),ref,20,'#3B444B',mono=True)
a.save(O/'CoolBe-core-identity-minimal.png',optimize=True)
a.resize((1200,900),Image.Resampling.LANCZOS).save(W/'preview-core-minimal.png')
