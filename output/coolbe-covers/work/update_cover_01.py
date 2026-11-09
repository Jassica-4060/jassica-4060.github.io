from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import math
O=Path('/Users/coolbe/Claude/portfolio-site/output/coolbe-covers'); W=O/'work'
F=Path('/Users/coolbe/.agents/skills/synced/05c40a78-fde3-49a1-ac6a-4ce745e458c9_9156276c-480e-4f19-8a8a-2469f80294fa/canvas-design/canvas-fonts')
B='#3B444B'; BLUE='#2F91C9'; WEB='#68B1E8'; GRAY='#E6E7E9'; MUT='#7C858D'; LINE='#E0E5E9'
def font(s,b=False,mono=False):return ImageFont.truetype(str(F/('DMMono-Regular.ttf' if mono else 'InstrumentSans-Bold.ttf' if b else 'InstrumentSans-Regular.ttf')),s)
def txt(im,xy,t,s=26,c=B,b=False,mono=False):ImageDraw.Draw(im).text(xy,t,font=font(s,b,mono),fill=c)
def line(im,xy,c=LINE,w=2):ImageDraw.Draw(im).line(xy,fill=c,width=w)
def box(im,xy,c='white',r=28):ImageDraw.Draw(im).rounded_rectangle(xy,r,fill=c)
def crop(pg,rect,transparent=False):
 im=Image.open(W/f'hi-{pg}.png').crop(tuple(round(x*5) for x in rect)).convert('RGBA')
 if transparent:
  # Retain the source colours and antialiased outlines; only the white page becomes transparent.
  px=im.load()
  for y in range(im.height):
   for x in range(im.width):
    r,g,b,a=px[x,y]; v=min(r,g,b)
    if v>245: px[x,y]=(r,g,b,0)
 return im
logo=crop(3,(515,260,730,308),True)
vertical=crop(3,(143,215,277,348),True)
symbol=crop(3,(168,215,266,304),True)
cn=crop(4,(48,231,385,268),True)
en=crop(4,(438,231,818,267),True)
front=crop(16,(280,375,413,518))
ImageDraw.Draw(front).rectangle((0,0,200,100),fill=GRAY)
side=crop(16,(473,375,582,518))
back=crop(16,(662,375,797,518))
# Native mascot crops include the manual's original neutral field. Match it in the design.
def put(im,asset,rect):
 x,y,w,h=rect; a=asset.copy();a.thumbnail((int(w),int(h)),Image.Resampling.LANCZOS);im.paste(a,(int(x+(w-a.width)/2),int(y+(h-a.height)/2)),a if a.mode=='RGBA' else None)
def label(im,x,y,n,t,c=MUT):
 txt(im,(x,y),n,23,c,mono=True);txt(im,(x+57,y-2),t,26,c)
def grid(im,rect,step=50,c='#E8ECEF'):
 x,y,w,h=rect
 for a in range(x,x+w+1,step):line(im,(a,y,a,y+h),c,1)
 for b in range(y,y+h+1,step):line(im,(x,b,x+w,b),c,1)

a=Image.new('RGB',(3200,2000),'#F1F4F6')
txt(a,(110,72),'CoolBe / Brand Identity System',37,B,True)
txt(a,(2530,84),'IDENTITY COLLECTION',22,MUT,mono=True)
line(a,(110,144,3090,144),'#D7DFE5')
# A: exact modular system board, generous negative space.
box(a,(110,198,2015,1010))
label(a,158,237,'01','Brand signature')
put(a,logo,(340,438,1435,283))
txt(a,(164,924),'C + B  /  PRIMARY SIGNATURE',23,MUT,mono=True)
# Mascot main board
box(a,(2055,198,3090,1370),GRAY)
label(a,2103,237,'04','Meet the mascot',B)
put(a,front,(2215,383,715,770))
txt(a,(2110,1250),'COOLBE CHARACTER',22,MUT,mono=True)
txt(a,(2110,1290),'FRONT VIEW / ORIGINAL ARTWORK',20,MUT,mono=True)
# Secondary symbol board
box(a,(110,1050,720,1734))
label(a,158,1092,'02','Vertical signature')
grid(a,(205,1195,420,420),42)
put(a,vertical,(245,1225,340,340))
# Typography real outlined wordmarks, no substitute font
box(a,(760,1050,2015,1734))
label(a,808,1092,'03','Typography')
txt(a,(817,1180),'CHINESE SIGNATURE',20,MUT,mono=True)
put(a,cn,(817,1227,1135,124))
line(a,(817,1424,1958,1424))
txt(a,(817,1470),'ENGLISH SIGNATURE',20,MUT,mono=True)
put(a,en,(817,1521,1135,110))
# Swatches web specification - exact named values from PDF
box(a,(2055,1410,3090,1734))
label(a,2103,1448,'05','Digital palette')
for x,c,h in [(2103,'#68B1E8','#68B1E8'),(2426,'#6C757D','#6C757D'),(2749,'#231815','#231815')]:
 box(a,(x,1510,x+293,1621),c,13);txt(a,(x,1650),h,23,MUT,mono=True)
# Quiet bottom rhythm
line(a,(110,1811,3090,1811),'#D7DFE5')
txt(a,(110,1860),'LOGO  /  TYPOGRAPHY  /  COLOUR  /  CHARACTER',23,MUT,mono=True)
txt(a,(2698,1855),'CoolBe',43,B,True)
a.save(O/'CoolBe-cover-01-system-v2.png',optimize=True)
a.resize((1440,900),Image.Resampling.LANCZOS).save(W/'preview-01-system-v2.png')
