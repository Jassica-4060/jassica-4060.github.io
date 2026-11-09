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
c=canvas.Canvas(str(OUT/'C-MIN-Designer-CV-A4.pdf'),pagesize=(W,H))
c.setTitle('黃思敏 C MIN | Product Designer CV'); c.setAuthor('黃思敏')
svg=[]; ink='#353535'; gray='#656565'; yellow='#FFDF57'
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
 for ch in t:
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
# Header: reference-inspired semicircle, with live vector geometry.
p=c.beginPath();p.moveTo(187,0);p.lineTo(407,0);p.curveTo(399,-127,195,-127,187,0)
# Explicit bottom semicircle path in PDF coordinates.
p=c.beginPath();p.moveTo(187,H);p.lineTo(407,H);p.curveTo(407,H-61,358,H-107,297,H-107);p.curveTo(236,H-107,187,H-61,187,H);p.close()
c.setFillColor(HexColor(ink));c.drawPath(p,fill=1,stroke=0)
svg.append(f'<path d="M187 0 H407 C407 61 358 107 297 107 C236 107 187 61 187 0 Z" fill="{ink}"/>')
circle(297,106,54,yellow)
text(297,111,'C MIN',19,'Helvetica-Bold',anchor='middle')
text(297,128,'DESIGNER',6.5,'Helvetica',anchor='middle',spacing=1.2)
text(42,100,'黃思敏',27)
text(43,120,'C MIN',15,'Helvetica-Bold',spacing=1)
text(43,137,'PRODUCT DESIGNER',7.3,'Helvetica-Bold',spacing=1.1)
text(376,104,'產品設計 × 產品規劃',9.1)
text(376,121,'Taipei, Taiwan',8,'Helvetica')
text(376,138,'104 履歷  ↗',8)
c.linkURL('https://pda.104.com.tw/profile/preview?vno=74rk3wa0w',(376,H-144,473,H-128),relative=0)
section('ABOUT ME',184)
intro='累積 7 年 UI/UX 設計經驗，專注 SaaS 後台與系統化設計。從需求背後的「為什麼」出發，釐清使用者與業務目標，梳理複雜流程，透過原型驗證方向；串聯產品與工程，將想法推進到實作。'
para(57,204,intro,481,9,14)
for x,w,t in [(117,112,'需求洞察與產品規劃'),(241,112,'Design System'),(365,112,'原型驗證與開發交付')]:
 rect(x,244,w,18,yellow);text(x+w/2,256.5,t,7.8,anchor='middle')
section('CAREER TIMELINE',291)
line(53,318,542,318)
for x,date,company in [(65,'2018/05','大學光學'),(181,'2021/04','CoolBe'),(297,'2022/02','91APP'),(413,'2022/09','永豐金控'),(529,'2023/10','CoolBe')]:
 text(x,308,date,7,'Helvetica-Bold',anchor='middle');circle(x,318,3.2,yellow,ink);text(x,334,company,8,anchor='middle')
section('WORK EXPERIENCE',368)
a=job(42,392,'2023/10 - PRESENT','酷必資訊 CoolBe','資深產品設計師',[
 '規劃 LINE WORKS MVP，採核心模組優先、加值服務分階段導入。',
 '承接 Bot 一對一服務，串接需求釐清、PRD、介面與 RD 開發規格。',
 '導入 Design Token 與模組化元件，以 JSON 串接設計與開發。',
 '彙整 3 間成衣品牌需求，規劃 LINE OA「以圖搜圖」購買路徑。'])
b=job(310,392,'2022/09 - 2023/10','永豐金融控股','UI/UX 設計師 · UI/UX 團隊 Leader',[
 '迭代行動網銀信用卡模組與大戶 APP，優化資訊層級及操作流程。',
 '建立新網銀 Design System，含 53 組元件與頁面範本，推動共同維護。',
 '從 0 到 1 規劃徵才網站並完成上線，整合 104 履歷快速匯入。',
 '主責 2 場 Workshop，並執行 1 場內部 A/B Test 回饋收集。'])
c1=job(42,602,'2022/02 - 2022/09','九易宇軒 91APP','產品設計師',[
 '負責「店員幫手」熟客管理新功能，從需求收斂、設計至協作上線。',
 '完成 30 位內部使用者測試，辨識 10 項問題並推動 2 項設計調整。'])
c2=job(310,602,'2021/04 - 2022/02','酷必資訊 CoolBe','UI/UX 設計師',[
 '負責產品前後台介面、流程優化，以及產品營運與行銷視覺設計。'])
# A compact early-career block retains all five appointments.
text(321,715,'2018/05 - 2021/02',7.8,'Helvetica-Bold')
text(321,731,'大學光學 · 平面設計師',9.2)
para(321,746,'門市文宣、產品包裝、社群廣告與網頁視覺。',228,8.6,13)
# Footer
line(42,770,553,770)
text(42,791,'SKILLS',8.5,'Helvetica-Bold',spacing=.7)
text(117,791,'複雜流程規劃  /  設計系統  /  Figma 互動原型  /  可用性測試',8.2)
text(117,807,'訪談與 GA4 行為分析  /  跨部門協作  /  視覺與品牌設計',8.2)
text(42,822,'C MIN / DESIGNER CV',6.1,'Helvetica',color=gray,spacing=.6)
text(553,822,'01',7,'Helvetica',color=gray,anchor='end')
c.save()
(OUT/'C-MIN-Designer-CV-A4-editable.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="white"/>'+''.join(svg)+'</svg>')
print(json.dumps({'block_bottoms':[a,b,c1,c2],'pdf':str(OUT/'C-MIN-Designer-CV-A4.pdf')}))
