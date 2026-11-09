from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np, math, json
ROOT=Path('/Users/coolbe/Claude/portfolio-site'); O=ROOT/'output/coolbe-book-mockup';W=O/'work'
source=(ROOT/'output/coolbe-overview/work/create_overview.py').read_text().split('# Layout plan.')[0]
exec(compile(source,'source_helpers','exec'))
O=ROOT/'output/coolbe-book-mockup';W=O/'work'
PW,PH=590,800; STAGE=(1400,1000); X,Y=110,86;SPINE=700
pages=[];meta=[]
def crop(p,r):
 im=pdfdoc[p-1].render(scale=3).to_pil().convert('RGB')
 result=im.crop(tuple(round(v*3) for v in r))
 if p==16 and r==(50,135,384,380):ImageDraw.Draw(result).rectangle((238*3,204*3,334*3,245*3),fill='white')
 if p==16 and r==(350,120,625,338):ImageDraw.Draw(result).rectangle((0,0,35*3,85*3),fill='white')
 if p==16 and r==(280,375,413,546):ImageDraw.Draw(result).rectangle((0,0,40*3,12*3),fill='#E6E7E9')
 return result
def trim(im):
 ar=np.array(im);yy,xx=np.where(ar.min(axis=2)<244)
 if len(xx):return im.crop((max(0,int(xx.min())-15),max(0,int(yy.min())-15),min(im.width,int(xx.max())+16),min(im.height,int(yy.max())+16)))
 return im
logo=crop(3,(515,260,730,308))
def newpage(ch,title,items,sourcepage=None):
 # Author at double size for crisp downsampling onto the mockup.
 a=Image.new('RGB',(1180,1600),'#FEFEFD');d=ImageDraw.Draw(a)
 text(a,(90,64),'CoolBe / Brand Identity',21,MUT)
 text(a,(90,128),ch,25,BLUE,mono=True)
 text(a,(90,182),title,42,zh=True)
 d.line((90,268,1090,268),fill='#D8DEE1',width=2)
 for asset,r in items:put(a,asset,r)
 d.line((90,1498,1090,1498),fill='#E1E5E7',width=1)
 text(a,(90,1524),f'{len(pages)+1:02}',22,MUT,mono=True)
 if sourcepage:text(a,(890,1524),f'SOURCE {sourcepage:02}',17,MUT,mono=True)
 pages.append(a.resize((PW,PH),Image.Resampling.LANCZOS));meta.append({'page':len(pages),'chapter':ch,'title':title,'source':sourcepage})
# Cover and table of contents.
a=Image.new('RGB',(1180,1600),'#FEFEFD');d=ImageDraw.Draw(a)
put(a,logo,(170,520,840,195));text(a,(171,842),'品牌識別系統手冊',54,zh=True);text(a,(172,950),'Brand Identity System',34,b=True)
for k,c in enumerate(['#68B1E8','#6C757D','#231815']):d.rectangle((173+k*190,1105,338+k*190,1122),fill=c)
text(a,(173,1440),'COOLBE / VISUAL IDENTITY',22,MUT,mono=True)
pages.append(a.resize((PW,PH),Image.Resampling.LANCZOS));meta.append({'page':1,'title':'品牌識別系統手冊'})
a=Image.new('RGB',(1180,1600),'#FEFEFD');text(a,(90,130),'目錄',64,zh=True);text(a,(92,230),'CONTENTS',27,BLUE,mono=True)
chapters=['標誌與企業標準字','標誌最小尺寸','企業色與標準色運用','標誌留白規範','標誌禁止使用範例','吉祥物與應用','品牌背景圖樣','文宣與實體應用']
for k,t in enumerate(chapters):
 yy=380+k*120;text(a,(92,yy),f'{k+1:02}',27,BLUE,mono=True);text(a,(175,yy-4),t,35,zh=True);ImageDraw.Draw(a).line((92,yy+72,1080,yy+72),fill='#E0E5E7',width=1)
pages.append(a.resize((PW,PH),Image.Resampling.LANCZOS));meta.append({'page':2,'title':'八大主題目錄'})
# Chapter 1: use generous individual pages for original lockups and type specimens.
ch='01 / SIGNATURE & TYPOGRAPHY'
newpage(ch,'直式標誌與設計概念',[(crop(3,(48,90,315,175)),(90,325,1000,280)),(crop(3,(143,215,277,348)),(260,690,660,660))],3)
newpage(ch,'橫式標誌與比例格線',[(logo,(105,430,970,230)),(crop(3,(490,381,753,556)),(125,800,930,595))],3)
newpage(ch,'中文標準字',[(trim(crop(4,(45,155,405,565))),(90,340,1000,1070))],4)
newpage(ch,'英文標準字',[(trim(crop(4,(430,155,820,565))),(90,340,1000,1070))],4)
# Chapter 2: original sizes, no invented ratios.
ch='02 / MINIMUM SIZE'
newpage(ch,'標誌印刷最小尺寸',[(crop(5,(55,147,290,258)),(90,350,1000,360)),(crop(5,(410,172,470,237)),(250,800,270,380)),(crop(5,(612,174,766,237)),(620,840,430,250))],5)
newpage(ch,'直式標誌的等比縮放',[(crop(5,(0,283,470,595)),(90,400,1000,930))],5)
newpage(ch,'橫式標誌的等比縮放',[(crop(5,(470,298,841,594)),(90,350,1000,1050))],5)
newpage(ch,'完整公司名稱組合｜最小尺寸',[(crop(6,(310,148,555,205)),(90,450,1000,500)),(crop(6,(90,255,800,375)),(90,1040,1000,240))],6)
newpage(ch,'完整公司名稱組合｜縮放',[(crop(6,(90,390,800,575)),(90,430,1000,850))],6)
# Chapter 3: palettes and treatments get their own pages.
ch='03 / COLOUR SYSTEM'
newpage(ch,'企業標準色與印刷規格',[(trim(crop(7,(45,115,325,575))),(210,340,760,1090))],7)
newpage(ch,'標誌的彩色、反白與特殊色',[(trim(crop(7,(330,110,820,575))),(90,340,1000,1090))],7)
newpage(ch,'完整組合的標準色規格',[(trim(crop(8,(45,145,270,570))),(215,350,750,1070))],8)
newpage(ch,'完整組合的彩色與反白',[(trim(crop(8,(285,115,820,575))),(90,360,1000,1050))],8)
# Split dense tables into two pages, repeating row labels on the second page.
for p,end,title in [(9,473,'標誌'),(10,473,'完整公司名稱組合')]:
 first=crop(p,(45,110,end,575));head=crop(p,(45,110,134,575));tail=crop(p,(end,110,820,575))
 combined=Image.new('RGB',(head.width+tail.width,head.height),'white');combined.paste(head,(0,0));combined.paste(tail,(head.width,0))
 newpage(ch,title+'｜背景對照 1',[(trim(first),(90,335,1000,1100))],p)
 newpage(ch,title+'｜背景對照 2',[(trim(combined),(90,335,1000,1100))],p)
# Chapter 4: construction diagram and clear zone sample stacked rather than squeezed.
ch='04 / CLEAR SPACE'
for p,title in [(13,'直式標誌留白'),(14,'橫式標誌留白'),(15,'圓形範圍留白')]:
 newpage(ch,title,[(trim(crop(p,(45,110,390,590))),(110,330,960,570)),(trim(crop(p,(400,110,842,590))),(255,970,670,465))],p)
# Chapter 5: original do/don't examples, divided by rows.
ch='05 / INCORRECT USAGE'
newpage(ch,'直式標誌｜比例與組合',[(trim(crop(11,(45,142,790,330))),(90,470,1000,650))],11)
newpage(ch,'橫式標誌｜對齊與間距',[(trim(crop(11,(45,382,790,565))),(90,470,1000,650))],11)
newpage(ch,'完整組合｜正常與錯誤位置',[(trim(crop(12,(130,115,695,340))),(90,385,1000,930))],12)
newpage(ch,'完整組合｜位置與高度限制',[(trim(crop(12,(130,340,695,570))),(90,385,1000,930))],12)
# Chapter 6: original mascot artwork, details, views and actual applications.
ch='06 / CHARACTER & APPLICATION'
newpage(ch,'酷客｜品牌吉祥物',[(crop(16,(50,135,384,380)),(90,450,1000,750))],16)
newpage(ch,'酷客｜造型與角色設定',[(crop(16,(350,120,625,338)),(90,320,1000,700)),(crop(16,(645,100,820,335)),(340,1020,500,420))],16)
newpage(ch,'酷客｜正面、側面與背面',[(crop(16,(280,375,413,546)),(375,320,430,460)),(crop(16,(473,375,582,546)),(170,855,350,550)),(crop(16,(662,375,797,546)),(660,855,350,550))],16)
newpage(ch,'吉祥物應用｜LINE 行銷遊戲',[(trim(crop(17,(48,175,265,565))),(290,330,600,1090))],17)
newpage(ch,'吉祥物應用｜後台登入與首頁',[(trim(crop(17,(285,175,740,565))),(90,420,1000,930))],17)
# Chapter 7.
ch='07 / BRAND PATTERNS'
for p,title in [(18,'藍底背景圖樣'),(19,'白底背景圖樣')]:newpage(ch,title,[(crop(p,(94,151,770,556)),(90,450,1000,800))],p)
# Chapter 8. Use actual manual assets, not previously invented merchandise.
ch='08 / BRAND COLLATERAL'
for p,title in [(20,'公司名片'),(21,'公司識別證'),(22,'T 恤｜正面與背面')]:newpage(ch,title,[(assets[p],(90,360,1000,1070))],p)
if len(pages)%2:
 newpage('COOLBE / BRAND IDENTITY','謝謝閱讀',[(logo,(160,650,860,210))])
print('PAGE COUNT',len(pages),flush=True)
for k,im in enumerate(pages):im.save(W/f'page-{k+1:02}.png')
(O/'分頁內容對照.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
# Build a warm neutral tabletop, realistic paper stack and soft book shadow.
base=Image.new('RGB',STAGE,'#F0EFEB')
shadow=Image.new('RGBA',STAGE);sd=ImageDraw.Draw(shadow)
sd.rounded_rectangle((X-4,Y+19,X+2*PW+10,Y+PH+31),radius=17,fill=(53,59,63,72));shadow=shadow.filter(ImageFilter.GaussianBlur(21));base.paste(shadow,(0,0),shadow)
d=ImageDraw.Draw(base)
for i in range(9,0,-1):
 d.rectangle((X-4,Y+i,X+2*PW+4,Y+PH+i),fill=('#D5D6D4' if i%2 else '#E9E9E6'))
# Page lighting is strongest beside the spine, with a restrained paper edge.
def shade(im,side):
 ar=np.array(im).astype(float);xx=np.arange(PW)
 dist=(PW-1-xx) if side=='left' else xx
 light=1-.145*np.exp(-dist/10)-.018*np.exp(-dist/55)
 ar*=light[None,:,None]
 return Image.fromarray(np.uint8(np.clip(ar,0,255)))
def spread(k):
 im=base.copy();im.paste(shade(pages[k*2],'left'),(X,Y));im.paste(shade(pages[k*2+1],'right'),(SPINE,Y))
 dr=ImageDraw.Draw(im);dr.line((SPINE,Y+2,SPINE,Y+PH-2),fill='#BFC1BE',width=1)
 return im
spreads=[spread(k) for k in range(len(pages)//2)]
spreads[1].save(O/'CoolBe-Book-Mockup-Preview.png')
# One overview of all spreads for QA and convenient review.
thumb=Image.new('RGB',(1400*3,1000*math.ceil(len(spreads)/3)),'#F0EFEB')
for k,im in enumerate(spreads):thumb.paste(im,((k%3)*1400,(k//3)*1000))
thumb.resize((1260,round(thumb.height*.3)),Image.Resampling.LANCZOS).save(O/'CoolBe-Book-All-Spreads.png')
# An output-to-source perspective map for the turning sheet.
def warp(image,quad):
 src=[(0,0),(PW,0),(PW,PH),(0,PH)];A=[];B=[]
 for (x,y),(u,v) in zip(quad,src):
  A.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]]);B.extend([u,v])
 coef=np.linalg.solve(np.array(A),np.array(B))
 return image.convert('RGBA').transform(STAGE,Image.Transform.PERSPECTIVE,coef,Image.Resampling.BICUBIC)
def flip(k,t):
 nxt=(k+1)%len(spreads);im=base.copy()
 im.paste(shade(pages[2*k],'left'),(X,Y));im.paste(shade(pages[2*nxt+1],'right'),(SPINE,Y))
 c=math.cos(math.pi*t);s=math.sin(math.pi*t);outer=SPINE+PW*c
 # Thin trapezoidal sheet lifts above the spread as it passes the spine.
 lift=33*s;drop=24*s
 if t<.5:
  q=[(SPINE,Y),(outer,Y-lift),(outer,Y+PH+drop),(SPINE,Y+PH)];sheet=pages[2*k+1]
 else:
  q=[(outer,Y-lift),(SPINE,Y),(SPINE,Y+PH),(outer,Y+PH+drop)];sheet=pages[2*nxt]
 sh=Image.new('RGBA',STAGE);ImageDraw.Draw(sh).polygon([(x+8*s,y+10*s) for x,y in q],fill=(35,42,46,int(45*s)))
 sh=sh.filter(ImageFilter.GaussianBlur(9));im.paste(sh,(0,0),sh)
 if abs(c)>.012:
  ar=np.array(sheet).astype(float);ar*=1-.19*s
  turning=warp(Image.fromarray(np.uint8(ar)),q);im.paste(turning,(0,0),turning)
 return im
# One common palette across all frames avoids colour flicker and keeps the GIF compact.
palboard=Image.new('RGB',(700,500*len(spreads)))
for k,im in enumerate(spreads):palboard.paste(im.resize((700,500)),(0,k*500))
palette=palboard.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
frames=[];dur=[]
for k,im in enumerate(spreads):
 frames.append(im.quantize(palette=palette,dither=Image.Dither.NONE));dur.append(2100 if k else 2600)
 for j in range(1,14):
  f=flip(k,j/14);frames.append(f.quantize(palette=palette,dither=Image.Dither.NONE));dur.append(60)
 if k%3==0:print('Animated spreads',k+1,'/',len(spreads),flush=True)
frames[0].save(O/'CoolBe-Brand-Manual-Page-Flip.gif',save_all=True,append_images=frames[1:],duration=dur,loop=0,disposal=2,optimize=True)
# Sample actual turning frames for visual QA.
frames[17].convert('RGB').save(W/'flip-sample.png')
print('DONE',len(frames),'frames',sum(dur)/1000,'seconds',flush=True)
