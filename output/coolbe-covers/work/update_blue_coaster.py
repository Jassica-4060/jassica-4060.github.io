from PIL import Image,ImageDraw
import numpy as np
from pathlib import Path
from collections import defaultdict
import re
O=Path('/Users/coolbe/Claude/portfolio-site/output/coolbe-covers'); W=O/'work'
# Source artwork itself, from the AI's PDF-compatible image; exclude all printing rings.
import pypdfium2 as pdf
from PIL import ImageFilter
src=pdf.PdfDocument('/Users/coolbe/Documents/業務協助/杯墊設計/CoolBe杯墊-印刷檔案-圓款.ai')
im=src[0].render(scale=4).to_pil().convert('RGB').crop((264,172,928,876))
arr=np.array(im)
# Remove red/yellow printing guides by their warm colour, preserving the blue character.
warm=(arr[:,:,0].astype(int)>arr[:,:,2].astype(int)+25)&(arr[:,:,0]>130)
arr[warm]=[255,255,255]
base=Image.fromarray(arr).resize((500,530),Image.Resampling.LANCZOS).filter(ImageFilter.MedianFilter(3))
q=base.quantize(colors=8,method=Image.Quantize.MEDIANCUT)
pal=q.getpalette();qa=np.array(q);white=int(qa[0,0])
# Retain white inside closed character shapes, but remove the surrounding white field.
maskim=q.convert('RGB'); ImageDraw.floodfill(maskim,(0,0),(255,0,255),thresh=10)
valid=np.any(np.array(maskim)!=[255,0,255],axis=2)
# Trace filled palette masks into closed vector contours. No raster image is embedded.
def simplify(points):
 if len(points)<4:return points
 out=[]
 for i,p in enumerate(points):
  a=points[i-1]; b=points[(i+1)%len(points)]
  if (p[0]-a[0])*(b[1]-p[1])!=(p[1]-a[1])*(b[0]-p[0]):out.append(p)
 return out
paths=[]
for k in range(8):
 m=(qa==k)&valid;h,w=m.shape
 edges=defaultdict(list)
 for y,x in zip(*np.where(m & ~np.pad(m[:-1,:],((1,0),(0,0))))): edges[(int(x),int(y))].append((int(x+1),int(y)))
 for y,x in zip(*np.where(m & ~np.pad(m[:,1:],((0,0),(0,1))))): edges[(int(x+1),int(y))].append((int(x+1),int(y+1)))
 for y,x in zip(*np.where(m & ~np.pad(m[1:,:],((0,1),(0,0))))): edges[(int(x+1),int(y+1))].append((int(x),int(y+1)))
 for y,x in zip(*np.where(m & ~np.pad(m[:,:-1],((0,0),(1,0))))): edges[(int(x),int(y+1))].append((int(x),int(y)))
 loops=[]
 while edges:
  first=next(iter(edges));p=first;pts=[]
  while True:
   pts.append(p);nxt=edges[p].pop()
   if not edges[p]:del edges[p]
   p=nxt
   if p==first:break
   if p not in edges:break
  area=abs(sum(pts[i][0]*pts[(i+1)%len(pts)][1]-pts[(i+1)%len(pts)][0]*pts[i][1] for i in range(len(pts))))/2
  if area<7:continue
  pts=simplify(pts)
  if pts:loops.append('M'+' L'.join(f'{x} {y}' for x,y in pts)+' Z')
 col='#%02x%02x%02x'%tuple(pal[k*3:k*3+3])
 if loops:paths.append(f'<path fill="{col}" fill-rule="evenodd" d="{" ".join(loops)}"/>')
# The coaster's face stays white; neutral layered ellipses produce its physical edge.
group='''<g id="mascot-coaster">
<ellipse cx="1242" cy="836" rx="147" ry="141" fill="#D6D5D0"/>
<ellipse cx="1235" cy="821" rx="146" ry="140" fill="#C7CDD0"/>
<ellipse cx="1235" cy="812" rx="146" ry="140" fill="#E5E8E9"/>
<ellipse cx="1235" cy="804" rx="146" ry="140" fill="#FFFFFF"/>
<g id="original-blue-coolke" transform="translate(1136 683) scale(.396)">'''+''.join(paths)+'</g></g>'
s=(O/'CoolBe-brand-merchandise-flat-vector.svg').read_text()
s=re.sub(r'<g id="mascot-coaster">.*?</g>',group,s,flags=re.S)
(O/'CoolBe-brand-merchandise-blue-coaster.svg').write_text(s)
print('vector paths',len(paths),'SVG bytes',len(s))
