from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageChops
import pypdfium2 as pdf
import numpy as np
O=Path('/Users/coolbe/Claude/portfolio-site/output/coolbe-overview');W=O/'work'
F=Path('/Users/coolbe/.agents/skills/synced/05c40a78-fde3-49a1-ac6a-4ce745e458c9_9156276c-480e-4f19-8a8a-2469f80294fa/canvas-design/canvas-fonts')
CN='/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
NAVY='#253C50';MUT='#7E8B94';BG='#F3F0E8';EDGE='#D9E0E3';BLUE='#2F91C9'
pdfdoc=pdf.PdfDocument('/Users/coolbe/Documents/企業識別/Coolbe-企業識別.pdf')
def font(s,b=False,zh=False,mono=False):return ImageFont.truetype(CN if zh else str(F/('DMMono-Regular.ttf' if mono else 'InstrumentSans-Bold.ttf' if b else 'InstrumentSans-Regular.ttf')),s)
def text(im,xy,t,s=40,c=NAVY,b=False,zh=False,mono=False):ImageDraw.Draw(im).text(xy,t,fill=c,font=font(s,b,zh,mono))
assets={}
# Page headers are replaced by one consistent hierarchy; all body information remains.
for p in range(3,23):
 raw=pdfdoc[p-1].render(scale=3).to_pil().convert('RGB')
 ImageDraw.Draw(raw).rectangle((0,0,45*3,110*3),fill='white')
 x0,y0,x1,y1=(0,88 if p==3 else 95,842,595)
 if p in [20,21]:x0,y0,x1,y1=(95,110,800,585)
 if p==22:x0,y0,x1,y1=(35,110,800,585)
 im=raw.crop(tuple(round(v*3) for v in (x0,y0,x1,y1)))
 # Tighten excess whitespace; retain a safety margin around the real source content.
 arr=np.array(im); mask=np.min(arr,axis=2)<244
 if mask.any():
  yy,xx=np.where(mask);pad=30
  im=im.crop((max(0,xx.min()-pad),max(0,yy.min()-pad),min(im.width,xx.max()+pad+1),min(im.height,yy.max()+pad+1)))
 assets[p]=im

def put(im,asset,rect):
 x,y,w,h=map(int,rect);t=asset.copy();t.thumbnail((w,h),Image.Resampling.LANCZOS);im.paste(t,(x+(w-t.width)//2,y+(h-t.height)//2))
# Layout plan. Every substantive page is represented exactly once.
sections=[
 ('01','標誌與企業標準字','SIGNATURE & TYPOGRAPHY',[(3,'標誌組合與設計概念'),(4,'中文、英文標準用字')],1430),
 ('02','標誌最小尺寸','MINIMUM SIZE',[(5,'直式、橫式組合的印刷尺寸'),(6,'完整公司名稱組合的印刷尺寸')],1390),
 ('03','企業色與標準色運用','COLOUR SYSTEM',[(7,'標準色與標誌色彩表現'),(8,'完整公司名稱組合的色彩表現')],1450),
 (None,None,None,[(9,'標誌色 × 背景色適用對照'),(10,'完整公司名稱組合 × 背景色')],1390),
 ('04','標誌留白規範','CLEAR SPACE',[(13,'直式組合'),(14,'橫式組合'),(15,'圓形使用範圍')],1080),
 ('05','標誌禁止使用範例','INCORRECT USAGE',[(11,'比例、對齊與間距'),(12,'完整公司名稱組合的限制')],1410),
 ('06','吉祥物與應用','CHARACTER & APPLICATIONS',[(16,'酷客設定、造型與三視圖'),(17,'LINE 行銷遊戲與後台應用')],1490),
 ('07','品牌背景圖樣','BRAND PATTERNS',[(18,'藍底背景圖樣'),(19,'白底背景圖樣')],1340),
 ('08','文宣與實體應用','BRAND COLLATERAL',[(20,'公司名片'),(21,'公司識別證'),(22,'T 恤正面與背面')],1110)
]
HEIGHT=740+sum(h+(190 if n else 45) for n,_,_,_,h in sections)+260
board=Image.new('RGB',(4800,HEIGHT),BG);d=ImageDraw.Draw(board)
# Hero: the original wordmark, no generated brand shapes.
raw=pdfdoc[2].render(scale=5).to_pil().convert('RGB')
logo=raw.crop((515*5,260*5,730*5,308*5))
# Remove white only for the header to let the warm ground remain continuous.
arr=np.array(logo);alpha=np.where(np.min(arr,axis=2)>245,0,255).astype('uint8')
l=logo.convert('RGBA');l.putalpha(Image.fromarray(alpha));l.thumbnail((1640,400),Image.Resampling.LANCZOS)
board.paste(l,(150,170),l)
text(board,(2320,132),'品牌識別系統總覽',102,zh=True)
text(board,(2323,280),'Brand Identity System',64,b=True)
text(board,(2326,387),'LOGO / TYPE / COLOUR / SPACE / CHARACTER / APPLICATION',25,MUT,mono=True)
for i,c in enumerate(['#68B1E8','#6C757D','#231815']):d.rectangle((2326+i*238,475,2540+i*238,505),fill=c)
d.line((150,590,4650,590),fill='#D4D9DC',width=3)
text(board,(150,634),'01  SIGNATURE     02  SIZE     03  COLOUR     04  SPACE     05  USAGE     06  CHARACTER     07  PATTERN     08  COLLATERAL',27,MUT,mono=True)
y=740
mapping=[]
for num,title,en,cards,h in sections:
 if num:
  text(board,(150,y+35),num,50,BLUE,mono=True)
  text(board,(268,y+19),title,68,zh=True)
  # Right aligned English label.
  ef=font(32,mono=True);tw=d.textlength(en,font=ef)
  text(board,(4650-tw,y+54),en,32,MUT,mono=True)
  y+=190
 else:y+=45
 gap=48;n=len(cards);cw=(4500-gap*(n-1))//n
 for k,(p,caption) in enumerate(cards):
  x=150+k*(cw+gap)
  d.rounded_rectangle((x,y,x+cw,y+h),radius=32,fill='white',outline=EDGE,width=3)
  text(board,(x+52,y+37),caption,42 if n<3 else 36,zh=True)
  text(board,(x+cw-167,y+48),f'P.{p:02}',25,'#A1ABB2',mono=True)
  put(board,assets[p],(x+45,y+125,cw-90,h-178))
  mapping.append((p,caption))
 y+=h
# Source-based completion line; source title and pagination are provenance, not new standards.
d.line((150,y+96,4650,y+96),fill='#D4D9DC',width=3)
text(board,(150,y+140),'CoolBe / Brand Identity System Manual',34,MUT)
text(board,(3245,y+140),'20 CONTENT PAGES / ONE OVERVIEW',28,MUT,mono=True)
board.save(O/'CoolBe-Brand-Identity-Complete-Overview.png',optimize=True)
preview=board.resize((1440,round(HEIGHT*.3)),Image.Resampling.LANCZOS)
preview.save(O/'CoolBe-Brand-Identity-Overview-Preview.png',optimize=True)
# Separate inspection images preserve readability during visual QA.
for k in range(4):
 top=round(HEIGHT*k/4);bottom=round(HEIGHT*(k+1)/4)
 board.crop((0,top,4800,bottom)).resize((1440,round((bottom-top)*.3)),Image.Resampling.LANCZOS).save(W/f'qa-{k+1}.png')
assert sorted(p for p,_ in mapping)==list(range(3,23))
(O/'內容對照.md').write_text('# 企業識別總圖\n\n原始手冊共 23 頁，封面與目錄轉為總圖標題及導覽，結尾閱讀頁不重複展示。第 3 至 22 頁的 20 頁實質設計內容皆收錄於同一張 PNG，保留手冊原有圖形、文字及規範。\n\n'+ '\n'.join(f'- 原手冊 P.{p:02}：{c}' for p,c in sorted(mapping))+'\n\n原圖尺寸：4800 × '+str(HEIGHT)+' px。預覽版：1440 px 寬。\n')
print('Output size',board.size,'Covered pages',len(mapping))
