from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from pathlib import Path
from html import escape
import json
OUT=Path(__file__).parent
W,H=595.2756,841.8898
pdfmetrics.registerFont(TTFont('CJK','/Library/Fonts/Arial Unicode.ttf'))
c=canvas.Canvas(str(OUT/'C-MIN-Designer-CV-A4-v2.pdf'),pagesize=(W,H))
c.setTitle('黃思敏 C MIN | Product Designer CV'); c.setAuthor('黃思敏')
svg=[]; ink='#152c4c'; gray='#46576b'; yellow='#ffc23d'
def rect(x,y,w,h,fill):
 c.setFillColor(HexColor(fill));c.rect(x,H-y-h,w,h,fill=1,stroke=0);svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>')
def circle(x,y,r,fill,stroke=None):
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(stroke or fill));c.setLineWidth(.65);c.circle(x,H-y,r,stroke=bool(stroke),fill=1);svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke or fill}" stroke-width=".65"/>')
def line(x,y,xx,yy,color=ink,width=.6):
 c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x,H-y,xx,H-yy);svg.append(f'<path d="M{x} {y} L{xx} {yy}" fill="none" stroke="{color}" stroke-width="{width}"/>')
def text(x,y,t,size=9,font='CJK',color=ink,anchor='start',spacing=0):
 c.setFillColor(HexColor(color));c.setFont(font,size)
 width=pdfmetrics.stringWidth(t,font,size)
 if anchor=='middle': x-=width/2
 elif anchor=='end':x-=width
 obj=c.beginText(x,H-y);obj.setFont(font,size);obj.setCharSpace(spacing);obj.textLine(t);c.drawText(obj)
 family='Arial Unicode MS' if font=='CJK' else 'Arial'
 weight='700' if 'Bold' in font else '400'
 svg.append(f'<text x="{x}" y="{y}" fill="{color}" font-family="{family}" font-size="{size}" font-weight="{weight}" letter-spacing="{spacing}">{escape(t)}</text>')
def wrap(t,width,size):
 rows=[]; row=''
 import re
 for ch in re.findall(r'[A-Za-z0-9]+|.',t):
  if pdfmetrics.stringWidth(row+ch,'CJK',size)>width:
   rows.append(row);row=ch
  else:row+=ch
 if row:rows.append(row)
 return rows
def para(x,y,t,width,size=8.6,leading=13):
 for row in wrap(t,width,size):text(x,y,row,size);y+=leading
 return y

def bullet(x,y,t,width,size=8.6):
 circle(x+1,y-3,1.15,yellow)
 return para(x+9,y,t,width-9,size,13)+5

def section(t,y):
 text(W/2,y,t,10,'Helvetica-Bold',anchor='middle',spacing=.6)

def job(x,y,date,company,role,bullets,width=243):
 text(x+11,y,date,7.8,'Helvetica-Bold')
 line(x,y+9,x+width,y+9);circle(x+11,y+9,3.1,yellow,ink)
 text(x+11,y+28,company,10.4)
 text(x+11,y+43,role,8.5,color=gray)
 by=y+61
 for b in bullets:by=bullet(x+11,by,b,width-15)
 return by

paper='#f4f0e6'
rect(0,0,W,H,paper)
def box(x,y,w,h,fill=paper,stroke=ink,lw=1.4):
 rect(x,y,w,h,fill)
 line(x,y,x+w,y,stroke,lw);line(x+w,y,x+w,y+h,stroke,lw)
 line(x+w,y+h,x,y+h,stroke,lw);line(x,y+h,x,y,stroke,lw)
def handle(x,y,size=7):box(x-size/2,y-size/2,size,size,'#ffffff',ink,1.2)
# The left column acts as a selected design-tool window.
box(27,29,225,779,'#ffffff',ink,1.8)
text(46,56,'CV RESUME',10,'Helvetica-Bold',spacing=1)
line(192,53,201,53,ink,1.2);box(210,47,8,8,'#ffffff',ink,.8)
line(231,47,238,54,ink,1);line(238,47,231,54,ink,1)
rect(39,76,201,208,ink)
circle(205,120,34,yellow)
text(52,169,'C',88,'Helvetica-Bold',color=paper)
text(51,236,'MIN',57,'Helvetica-Bold',color=paper)
text(54,266,'PORTRAIT / 待補個人照',7.4,color=paper)
# Floating role label and selection handles.
box(159,258,107,54,yellow,ink,1.5)
text(212,280,'PRODUCT',10,'Helvetica-Bold',anchor='middle')
text(212,295,'DESIGNER',10,'Helvetica-Bold',anchor='middle')
for x in [159,266]:
 for y in [258,312]:handle(x,y,6)
text(47,350,'黃思敏',30)
text(48,381,'C MIN',25,'Helvetica-Bold',spacing=.5)
line(215,361,230,376,ink,1.2);line(218,376,230,376,ink,1.2);line(230,364,230,376,ink,1.2)
line(47,401,232,401,ink,1.7)
text(48,425,'產品設計 × 產品規劃',10)
text(48,448,'Taipei, Taiwan',9.2,'Helvetica')
text(48,471,'104 履歷 / 點此查看',9.2)
c.linkURL('https://pda.104.com.tw/profile/preview?vno=74rk3wa0w',(47,H-477,207,H-458),relative=0)
line(47,493,232,493,ink,1.7)
text(47,522,'CORE SKILLS',13,'Helvetica-Bold')
for y,title,sub in [(553,'複雜流程規劃','角色、權限與資料狀態'),(600,'Design System','共用元件與互動規範'),(647,'原型與使用者驗證','Figma、訪談與可用性測試'),(694,'跨部門協作','需求、MVP 與開發交付')]:
 text(48,y,title,10)
 rect(48,y+9,26,3,yellow);line(81,y+10.5,231,y+10.5,ink,.6)
 text(48,y+29,sub,8.3,color=gray)
line(47,746,232,746,ink,.7)
text(48,767,'從複雜需求，到清楚體驗。',9)
text(48,787,'UI/UX  /  SYSTEMS  /  PRODUCT',6.7,'Helvetica-Bold',spacing=.2)
for x in [27,139.5,252]:
 for y in [29,808]:handle(x,y,9)
# Right column: profile then a continuous work timeline.
text(294,65,'MY PROFILE',14,'Helvetica-Bold')
rect(294,78,35,4,yellow)
para(294,106,'累積 7 年 UI/UX 設計經驗，專注 SaaS 後台與系統化設計。從「為什麼」出發，釐清使用者與業務目標，讓複雜需求成為清楚好用的產品體驗。',267,9.5,15)
para(294,193,'透過原型驗證方向，串聯產品與工程，將需求規劃推進到實作。',267,9.5,15)
text(294,260,'WORK EXPERIENCE',14,'Helvetica-Bold')
rect(294,273,35,4,yellow)
line(300,298,300,746,ink,1)
def xp(y,company,role,date,items):
 handle(300,y-4,8)
 text(315,y,company,10.8)
 text(315,y+17,role,9.1)
 text(315,y+33,date,7.6,'Helvetica-Bold',color=gray)
 by=y+51
 for item in items:
  by=para(315,by,item,245,8.8,13)+5
 return by
bottom=[]
bottom.append(xp(300,'酷必資訊 CoolBe','資深產品設計師','2023/10 - PRESENT',[
 '規劃 LINE WORKS MVP，核心模組優先、加值服務分階段導入。',
 '串接 Bot 一對一服務的需求、PRD、介面與開發規格；導入 Token 與模組化元件。',
 '彙整 3 間成衣品牌需求，規劃 LINE OA「以圖搜圖」功能。']))
bottom.append(xp(450,'永豐金融控股','UI/UX 設計師 · UI/UX 團隊 Leader','2022/09 - 2023/10',[
 '優化行動網銀信用卡模組與大戶 APP；建立 53 組元件與頁面範本。',
 '徵才網站從規劃到上線，整合 104 履歷匯入；主責 2 場 Workshop。']))
bottom.append(xp(574,'九易宇軒 91APP','產品設計師','2022/02 - 2022/09',[
 '負責「店員幫手」熟客管理新功能至上線；完成 30 人測試，辨識 10 項問題，推動 2 項設計調整。']))
bottom.append(xp(672,'酷必資訊 CoolBe','UI/UX 設計師','2021/04 - 2022/02',[
 '前後台介面、流程優化與行銷視覺設計。']))
bottom.append(xp(746,'大學光學','平面設計師','2018/05 - 2021/02',[
 '門市文宣、產品包裝、社群與網頁視覺。']))
text(560,822,'C MIN / CV 02',6.5,'Helvetica',color=gray,anchor='end',spacing=.5)
c.save()
(OUT/'C-MIN-Designer-CV-A4-v2-editable.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 {W} {H}">'+''.join(svg)+'</svg>')
print('Experience block bottoms:',bottom)
