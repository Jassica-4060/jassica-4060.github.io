from pathlib import Path
from PIL import Image,ImageDraw
import zipfile
src=Path('/Users/coolbe/Claude/portfolio-site/output/coolbe-overview/work/create_overview.py').read_text().split('# Layout plan.')[0]
exec(compile(src,'overview_helpers','exec'))
DEST=Path('/Users/coolbe/Claude/portfolio-site/output/coolbe-identity-sections-white')
DEST.mkdir(parents=True,exist_ok=True)
BG='white'
def canvas(num,title,en):
 return Image.new('RGB',(3200,2400),'white')
def card(a,rect,title,asset=None):
 x,y,x2,y2=rect
 if asset is not None:put(a,asset,(x+35,y+110,x2-x-70,y2-y-145))
def crop(p,rect):
 im=pdfdoc[p-1].render(scale=4).to_pil().convert('RGB');return im.crop(tuple(int(v*4) for v in rect))
files=[]
def save(a,n):
 arr=np.array(a);yy,xx=np.where(np.min(arr,axis=2)<248)
 if len(xx):
  content=a.crop((max(0,int(xx.min())-24),max(0,int(yy.min())-24),min(a.width,int(xx.max())+25),min(a.height,int(yy.max())+25)))
  a=Image.new('RGB',(3200,2400),'white');put(a,content,(100,100,3000,2200))
 p=DEST/n;a.save(p,optimize=True);files.append(p)
# 1. Horizontal lockup only. Extract the source construction grid and source measurements.
a=canvas('01','LOGO 標誌比例','HORIZONTAL SIGNATURE')
card(a,(100,310,3100,1040),'橫式標誌')
put(a,crop(3,(515,260,730,308)),(560,505,2080,420))
card(a,(100,1080,1550,2300),'橫式比例格線')
put(a,crop(3,(490,381,753,556)),(190,1320,1270,840))
card(a,(1590,1080,3100,2300),'印刷最小尺寸與等比縮放')
put(a,crop(5,(612,174,766,237)),(1860,1230,970,350))
put(a,crop(5,(470,298,841,594)),(1770,1590,1150,645))
save(a,'01-Logo-Horizontal-Proportions.png')
# 2. All original standard-font choices, Chinese and English.
a=canvas('02','企業標準字','CORPORATE TYPOGRAPHY')
card(a,(100,310,3100,2300),'中文與英文標準用字',assets[4])
save(a,'02-Corporate-Typography.png')
# 3. Include specifications, treatments and both background-application matrices.
a=canvas('03','標準色應用','COLOUR SYSTEM & APPLICATION')
for rect,p,t in [((100,310,1580,1285),7,'標準色與標誌色彩'),((1620,310,3100,1285),8,'公司名稱組合色彩'),((100,1325,1580,2300),9,'標誌色與背景色對照'),((1620,1325,3100,2300),10,'公司名稱組合與背景色對照')]:card(a,rect,t,assets[p])
save(a,'03-Colour-System-Application.png')
# 4. Every original clear-space construction, unchanged proportions.
a=canvas('04','留白規範','CLEAR SPACE')
for rect,p,t in [((100,310,1073,2300),13,'直式標誌留白'),((1113,310,2086,2300),14,'橫式標誌留白'),((2126,310,3100,2300),15,'圓形範圍留白')]:
 card(a,rect,t)
 for source_rect,dest_rect in [((45,110,390,590),(rect[0]+45,530,883,760)),((400,110,842,590),(rect[0]+85,1390,803,785))]:
  sample=crop(p,source_rect)
  arr=np.array(sample);yy,xx=np.where(np.min(arr,axis=2)<244)
  if len(xx):sample=sample.crop((max(0,int(xx.min())-12),max(0,int(yy.min())-12),min(sample.width,int(xx.max())+13),min(sample.height,int(yy.max())+13)))
  put(a,sample,dest_rect)
save(a,'04-Clear-Space.png')
# 5. Both pages of original correct/incorrect usage comparisons.
a=canvas('05','禁止使用範例','INCORRECT USAGE')
card(a,(100,310,1580,2300),'比例、對齊與間距',assets[11]);card(a,(1620,310,3100,2300),'完整公司名稱組合限制',assets[12])
save(a,'05-Incorrect-Usage.png')
# 6. The complete original character specification and three views.
a=canvas('06','吉祥物','COOLBE CHARACTER')
card(a,(100,310,3100,2300),'酷客｜角色設定、造型與三視圖',assets[16])
save(a,'06-Mascot-Coolke.png')
# A visual index, in the order requested.
contact=Image.new('RGB',(2400,2700),BG)
for k,p in enumerate(files):
 im=Image.open(p);im.thumbnail((1170,878),Image.Resampling.LANCZOS);contact.paste(im,((k%2)*1200+15,(k//2)*900+10))
contact.save(DEST/'Six-Sections-Preview.png',optimize=True)
with zipfile.ZipFile(DEST/'CoolBe-Identity-Six-Sections-White.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in files:z.write(p,p.name)
print('\n'.join(str(p) for p in files))
