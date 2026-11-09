from pathlib import Path
import pdfplumber
from collections import defaultdict
O=Path('/Users/coolbe/Claude/portfolio-site/output/coolbe-covers')
# Obtain the actual brand lettering outlines from the original PDF, including counters.
paths=defaultdict(list);rects=[]
with pdfplumber.open('/Users/coolbe/Documents/企業識別/Coolbe-企業識別.pdf') as doc:
 page=doc.pages[2]
 for c in page.curves:
  if c['x0']>515 and c['x1']<730 and c['top']>260 and c['bottom']<309:
   color='#1999CC' if c['non_stroking_color'][3]==0 else '#3B444B'
   s=[]
   for cmd in c['path']:
    s.append(('Z' if cmd[0]=='h' else cmd[0].upper())+' '+' '.join(f'{v:.4f}' for pt in cmd[1:] for v in pt))
   paths[color].append(' '.join(s)+' Z')
 for c in page.rects:
  if c['x0']>515 and c['x1']<730 and c['top']>260 and c['bottom']<309:
   rects.append(f'<rect x="{c["x0"]}" y="{c["top"]}" width="{c["x1"]-c["x0"]}" height="{c["bottom"]-c["top"]}" fill="#3B444B"/>')
logo=''.join(f'<path fill="{col}" fill-rule="evenodd" d="{" ".join(ps)}"/>' for col,ps in paths.items())+''.join(rects)
a=['<svg xmlns="http://www.w3.org/2000/svg" width="1448" height="1086" viewBox="0 0 1448 1086">','<title>CoolBe 品牌應用｜色塊向量版</title>','<desc>虛構 T 恤、名片、識別證、賀卡及酷客杯墊。所有物件與陰影皆為純色向量圖形。標誌輪廓取自原企業識別手冊。</desc>',f'<defs><g id="coolbe-logo">{logo}</g></defs>','<rect id="beige-background" width="1448" height="1086" fill="#F3F0E8"/>']
def add(s):a.append(s)
def path(d,c):add(f'<path d="{d}" fill="{c}"/>')
def rect(x,y,w,h,c,rx=0):add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{c}"/>')
def ellipse(x,y,rx,ry,c):add(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}"/>')
def brand(x,y,w):
 k=w/200.2
 add(f'<use href="#coolbe-logo" transform="translate({x} {y}) scale({k}) translate(-520.9 -264.352)"/>')
# Shirt: the cut, collar, seams and shadow all use filled geometry.
add('<g id="t-shirt">')
path('M160 916 L177 565 L67 524 L45 478 L153 287 Q198 234 300 213 Q393 241 489 213 Q590 234 637 287 L744 478 L721 524 L612 565 L628 916 Z','#D8D7D2')
path('M145 894 L164 530 L58 483 L154 296 Q196 251 300 224 Q393 255 489 224 Q591 250 633 296 L729 483 L622 530 L642 894 Z','#FFFFFF')
path('M300 224 Q391 254 489 224 Q474 316 394 319 Q316 316 300 224 Z','#DDDFE0')
path('M316 229 Q394 249 473 229 Q454 291 394 295 Q335 292 316 229 Z','#F3F0E8')
path('M164 530 L177 401 L184 547 L160 884 L145 894 Z','#ECEDEE')
path('M622 530 L609 401 L603 547 L627 884 L642 894 Z','#E6E7E7')
path('M58 483 L70 462 L166 508 L164 530 Z','#E8EAEB')
path('M729 483 L717 462 L620 508 L622 530 Z','#E4E6E7')
rect(150,877,487,17,'#ECEDEE')
brand(385,408,171)
add('</g>')
# Business cards: grey offset slabs indicate depth, with no outline.
add('<g id="business-cards">')
rect(800,400,279,165,'#D6D5D0',5);rect(794,388,279,165,'#68B1E8',5)
rect(823,454,47,47,'#E5F2FC');rect(888,458,80,12,'#F3F8FC');rect(888,481,148,12,'#D8EBF9');rect(888,504,91,12,'#E5F2FC')
rect(764,274,272,167,'#D6D5D0',5);rect(758,264,272,167,'#FFFFFF',5)
brand(797,328,193)
add('</g>')
# Lanyard and badge. Top is deliberately inside the canvas.
add('<g id="employee-id">')
path('M1138 62 L1177 62 L1228 216 L1279 62 L1318 62 L1250 250 L1207 250 Z','#68B1E8')
path('M1240 214 L1279 62 L1292 62 L1248 239 Z','#4699D2')
rect(1200,214,60,35,'#6C757D',6);rect(1218,245,24,57,'#C6CDD0',9);rect(1224,251,12,47,'#E7EBED',5)
rect(1134,298,207,337,'#D6D5D0',13);rect(1127,286,207,337,'#FFFFFF',13)
rect(1201,297,54,11,'#D8DEDF',5)
brand(1158,351,143)
rect(1172,415,115,99,'#E4F1FA',3)
ellipse(1229,451,17,17,'#A7C8DF');path('M1195 501 Q1196 474 1229 473 Q1262 474 1263 501 Z','#A7C8DF')
rect(1164,545,132,14,'#BCC7CE');rect(1164,573,86,14,'#DEE5E9')
add('</g>')
# Greeting card plus envelope, folds are separate blue-grey polygons.
add('<g id="greeting-card">')
rect(677,643,350,229,'#D6D5D0',5);rect(671,633,350,229,'#DDEAF3',5)
path('M671 633 L846 764 L1021 633 Z','#BBDCEF')
path('M671 862 L825 724 L846 740 L868 724 L1021 862 Z','#D0E5F2')
rect(709,703,358,231,'#D6D5D0',3);rect(701,691,358,231,'#FFFFFF',3)
path('M701 691 L783 691 A82 82 0 0 1 701 773 Z','#E3F1FA')
path('M934 922 A125 125 0 0 1 1059 797 L1059 922 Z','#C1DFF3')
path('M979 758 Q986 782 1008 788 Q986 794 979 818 Q973 795 951 788 Q973 781 979 758 Z','#68B1E8')
path('M1013 733 Q1018 746 1030 750 Q1018 754 1013 767 Q1009 754 996 750 Q1009 746 1013 733 Z','#C1DFF3')
brand(738,795,174)
add('</g>')
# Mascot coaster: a flat blue disk and a displaced grey disk, no strokes or gradient.
add('<g id="mascot-coaster">')
ellipse(1241,825,146,146,'#D6D5D0');ellipse(1235,813,146,146,'#B5DBF3');ellipse(1235,809,137,137,'#DEEFFA')
# fins behind the body
path('M1171 805 Q1134 824 1134 862 Q1159 866 1190 837 Z','#FFFFFF')
path('M1295 804 Q1333 827 1337 854 Q1309 866 1284 837 Z','#FFFFFF')
path('M1134 862 Q1156 861 1186 838 L1190 846 Q1160 872 1134 870 Z','#CDD1D4')
path('M1290 836 Q1314 858 1337 854 L1337 862 Q1310 871 1285 847 Z','#CDD1D4')
# Original mascot's egg body interpreted with two pure tone shapes.
path('M1235 738 C1172 738 1157 810 1173 859 C1184 897 1210 917 1235 917 C1262 917 1289 894 1301 852 C1315 799 1294 738 1235 738 Z','#FFFFFF')
path('M1173 859 Q1195 889 1236 889 Q1273 889 1301 852 C1289 894 1262 917 1235 917 C1210 917 1184 897 1173 859 Z','#D4D8DA')
path('M1189 809 C1183 787 1201 754 1231 753 C1256 750 1282 772 1286 794 Q1261 817 1202 824 Q1193 824 1189 809 Z','#53616B')
path('M1235 761 Q1261 762 1274 781 Q1255 770 1236 768 Z','#FFFFFF')
path('M1229 743 L1226 719 L1233 716 L1238 741 Z','#CDD2D5')
path('M1246 697 A18 18 0 1 0 1246 716 L1238 712 A9 9 0 1 1 1238 701 Z','#F0DE38')
add('</g></svg>')
svg='\n'.join(a)
(O/'CoolBe-brand-merchandise-flat-vector.svg').write_text(svg)
print('SVG saved; all geometry is vector, no fonts, no embedded raster, no strokes.')
