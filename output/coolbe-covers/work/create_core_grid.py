from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
O=Path('/Users/coolbe/Claude/portfolio-site/output/coolbe-covers');W=O/'work'
source=(W/'create_core_minimal.py').read_text().split("\na=Image.new")[0]
exec(compile(source,'core_helpers','exec'))
a=Image.open(O/'CoolBe-core-identity-minimal.png').convert('RGB')
d=ImageDraw.Draw(a)
# Retain all four panel bounds and headings and the original logo module pixel for pixel.
# Clear only the content areas of the three remaining modules.
for rect in [(1530,199,2309,828),(90,1032,1453,1706),(1530,1032,2309,1706)]:d.rectangle(rect,fill='white')
BLUE='#2F91C9'; PALE='#EDF2F5'; LIGHT='#DDE5EB'
# Clear-space illustration: one square, regular grid, inset frame and quiet handles.
gx,gy,cell=1640,220,80
for k in range(8):
 x=gx+k*cell;y=gy+k*cell
 d.line((x,gy,x,gy+560),fill='#E4EAF0',width=2)
 d.line((gx,y,gx+560,y),fill='#E4EAF0',width=2)
d.rectangle((gx,gy,gx+560,gy+560),outline='#C9D5DF',width=3)
d.rectangle((gx+160,gy+160,gx+400,gy+400),fill='#E8F3FA',outline=BLUE,width=4)
for x,y in [(gx+160,gy+160),(gx+400,gy+160),(gx+160,gy+400),(gx+400,gy+400)]:
 d.rectangle((x-8,y-8,x+8,y+8),fill='white',outline=BLUE,width=3)
# Typography illustration inspired by the supplied token SVG.
# Large Aa, square selection frame and skeleton bars simplify the original long wordmarks.
fx,fy,fw,fh=168,1124,506,300
f=font(285,True)
bb=d.textbbox((0,0),'Aa',font=f)
d.text((fx+(fw-(bb[2]-bb[0]))/2-bb[0],fy+(fh-(bb[3]-bb[1]))/2-bb[1]),'Aa',font=f,fill=NAVY)
d.rectangle((fx,fy,fx+fw,fy+fh),outline=BLUE,width=4)
for x,y in [(fx,fy),(fx+fw,fy),(fx,fy+fh),(fx+fw,fy+fh)]:
 d.rectangle((x-9,y-9,x+9,y+9),fill='white',outline=BLUE,width=3)
# Modular text-like rectangles, no additional wording.
d.rectangle((790,1128,894,1232),fill='#DEE7ED')
d.rectangle((926,1128,1358,1164),fill='#DEE7ED')
d.rectangle((926,1192,1246,1228),fill='#EDF1F4')
d.rectangle((790,1296,1358,1330),fill='#EDF1F4')
d.rectangle((790,1360,1270,1394),fill='#EDF1F4')
# A few compact baseline samples keep the lower portion balanced.
for i,h in enumerate([54,74,40,64,84,48,66,38]):
 x=170+i*62
 d.rectangle((x,1588-h,x+40,1588),fill='#DCE8F0' if i%3 else '#A9CFE8')
for x,w in [(790,568),(790,398)]:
 y=1508 if w==568 else 1574
 d.rectangle((x,y,x+w,y+28),fill='#EDF1F4')
# Palette: six exact square blocks; lower row is an illustrative tint of each original hue.
colors=['#68B1E8','#6C757D','#231815']
def tint(h,t=.80):
 rgb=tuple(int(h[i:i+2],16) for i in (1,3,5))
 return tuple(round(v+(255-v)*t) for v in rgb)
for i,col in enumerate(colors):
 x=1558+i*246
 d.rectangle((x,1124,x+220,1344),fill=col)
 d.rectangle((x,1380,x+220,1600),fill=tint(col))
a.save(O/'CoolBe-core-identity-grid.png',optimize=True)
a.resize((1200,900),Image.Resampling.LANCZOS).save(W/'preview-core-grid.png')
