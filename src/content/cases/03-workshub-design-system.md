---
title: LOGO 與 Design System 從 0 到 1
product: WorksHub+ 系統後台
tier: main
order: 3
duration: LOGO 提案至正式上線
role: LOGO 設計、後台視覺與 Design Token，並與前端合作上線
proves: [視覺系統化, AI 協作, 設計交付]
summary: 從 LOGO 推導出後台的視覺語言，用自己的美學判斷帶著 AI 擴張成完整介面，再轉成前端的 AI 也讀得懂的 Design Token，提案一次通過、前端零來回上線。
category: 產品設計
kind: Design System
date: "2026.10"
skills: [Design Token, 品牌識別, AI 協作, 設計交付]
cover: /images/worksHub+/WorksHub-Design-Tokens-1440x900.svg
---

## 背景與問題

<div class="split">
<figure class="ph split-media"><span>原始版本截圖</span><img src="/images/worksHub+/shots/before-original.jpg" alt="原始版本的後台首頁：白色側欄、白色卡片、淺灰底，主色是一般的亮藍，卡片之間只靠細灰線分隔" onerror="this.remove()"></figure>
<div class="split-text">

WorksHub+ 一開始為了快速驗證功能，直接套用現成的 UI kit（Naive UI）規劃後台。功能告一段落、產品名稱也確定之後，問題浮現了：**這個後台看起來跟任何一個後台都一樣，沒有屬於 WorksHub+ 的樣子。**

所以這個專案要從 0 開始建立兩件事：先有品牌識別（LOGO），再把品牌延伸成後台的視覺語言，最後整理成前端可以直接套用的 Design Token。

這裡的「0 到 1」指的是**品牌識別、視覺語言與 Token 系統**；元件本身沿用 Naive UI，透過 Token 與覆寫規則換上新的樣子。

</div>
</div>

## WorksHub+ 由來

<div class="split is-origin">
<figure class="split-media"><img src="/images/worksHub+/works.png" width="854" height="768" loading="lazy" alt="WorksHub+ 平台概念圖：中央的 WorksHub+ 圓環串聯 LINE 官方帳號與 AI 智慧應用，並帶動觸發、判斷、指派、提醒與追蹤的工作流程"></figure>
<div class="split-text">

企業日常運作涉及溝通、資訊查找與各項作業流程。當工具與服務分散在不同系統中，使用者需要反覆切換，也增加了資訊整合與管理的負擔。因此，產品希望以整合平台為核心，讓不同工作需求能在同一個入口被連結與處理。

| 文字拆解 | 意象 |
|---|---|
| Works | 代表工作與企業日常作業，也呼應 LINE WORKS 的產品背景，讓名稱與實際工作情境建立連結。 |
| Hub | 代表中樞與匯聚，傳達平台串聯工具、資訊與服務的角色，讓分散的工作資源形成彼此連通的整體。 |
| 「＋」 | 則代表加值與持續擴充，象徵產品能隨著企業需求成長，在既有基礎上延伸更多功能與應用。 |

</div>
</div>

## 角色與團隊

- **我的角色：** 設計端從頭到尾由我負責：LOGO 提案、後台視覺、Design Token，以及寫給前端的差異說明文件。
- **合作夥伴：** 前端工程師，負責把 Token 套進產品並上線。LOGO 方向由團隊從提案中選定。

<div class="team" role="list" aria-label="分工：品牌定調與我雙向討論，我完成 LOGO、後台視覺與 Design Token，整理成交付物給前端套用上線">
  <div class="team-node is-plain" role="listitem"><strong>品牌定調</strong><span>LOGO 提案</span><span>團隊選定方向</span></div>
  <span class="team-arrow" aria-hidden="true">⇄</span>
  <div class="team-node is-me" role="listitem"><strong>我</strong><span>LOGO 提案</span><span>後台視覺定調</span><span>Design Token</span></div>
  <span class="team-arrow" aria-hidden="true">→</span>
  <div class="team-node is-plain" role="listitem"><strong>交付</strong><span>差異說明</span><span>Design Token</span><span>情境畫面</span></div>
  <span class="team-arrow" aria-hidden="true">→</span>
  <div class="team-node is-dev" role="listitem"><strong>FE</strong><span>套用 Token</span><span>正式上線</span></div>
</div>

## LOGO：四個方向，選定「通訊中樞」

產品名稱確定後，我提出四個 LOGO 方向，每個方向都從「C（Coolbe）與 B（Bot）」出發，延伸出不同的產品意象：

<div class="logo-stack" data-stack>
<div class="logo-stack-sticky">
<div class="logo-grid" role="list" aria-label="四款 LOGO 提案" data-stack-box>
  <figure data-stack-card role="listitem"><img src="/images/worksHub+/logo/proposal-01.png" width="755" height="561" loading="lazy" alt="提案 01 智能機器人：C 與 B 融合成機器人頭像，上方有訊號圖示，綠色與藍灰色"><figcaption>01 智能機器人｜C 與 B 融合成 Bot 頭像</figcaption></figure>
  <figure data-stack-card role="listitem"><img src="/images/worksHub+/logo/proposal-02.png" width="749" height="540" loading="lazy" alt="提案 02 協作軌道：C 與 B 的流體線條交織成閉環，紫藍漸層"><figcaption>02 協作軌道｜C 與 B 交織成閉環</figcaption></figure>
  <figure data-stack-card role="listitem"><img src="/images/worksHub+/logo/proposal-03.png" width="733" height="537" loading="lazy" alt="提案 03 智慧通訊：機器人、對話框與字母 B 融合，右上角加號，深藍與亮藍"><figcaption>03 智慧通訊｜機器人＋對話框＋B</figcaption></figure>
  <figure data-stack-card role="listitem" class="is-picked"><img src="/images/worksHub+/logo/concept-04.png" width="2400" height="1800" loading="lazy" alt="提案 04 通訊中樞：C 形圓環包覆對話意象的 B，右上加號，藍綠漸層"><figcaption>04 通訊中樞（選定）｜C 形圓環包覆對話的 B</figcaption></figure>
</div>
<p class="stack-count" aria-hidden="true"><span data-stack-current>01</span> / 04</p>
</div>
</div>

團隊選定 **04 通訊中樞**：外側的 C 形圓環包住像對話視窗的 B，代表平台以 Bot 為核心，整合並守護企業通訊；右上的「＋」代表功能持續擴充。

<div class="logo-final">
  <div class="lf-tiles">
    <figure class="lf-tile is-light"><img src="/images/worksHub+/logo/final-horizontal-light.png" width="900" height="253" loading="lazy" alt="WorksHub+ 正式 LOGO（淺色底）：藍綠漸層的 C 形圓環包住深藍與品牌藍的對話框，右側是 WorksHub 字標與青綠色加號"></figure>
    <figure class="lf-tile is-dark"><img src="/images/worksHub+/logo/final-horizontal-dark.png" width="900" height="253" loading="lazy" alt="WorksHub+ 正式 LOGO（深色底）：白色對話框與白色 Works 字樣，Hub 與圓環維持藍綠漸層"></figure>
  </div>
  <ol class="lf-concept" aria-label="LOGO 概念拆解：閉環＋C、對話＋B、PLUS，組合成完整圖形">
    <li class="lf-part"><span class="lf-img"><img src="/images/worksHub+/logo/logo-atomsC.svg" width="107" height="107" style="--w:107" loading="lazy" alt="" onerror="this.remove()"></span><span class="lf-label">閉環＋C</span></li>
    <li class="lf-op" aria-hidden="true">&amp;</li>
    <li class="lf-part"><span class="lf-img"><img src="/images/worksHub+/logo/logo-atomsB.svg" width="61" height="59" style="--w:61" loading="lazy" alt="" onerror="this.remove()"></span><span class="lf-label">對話＋B</span></li>
    <li class="lf-op" aria-hidden="true">&amp;</li>
    <li class="lf-part"><span class="lf-img"><img src="/images/worksHub+/logo/logo-atoms+.svg" width="29" height="29" style="--w:29" loading="lazy" alt="" onerror="this.remove()"></span><span class="lf-label">PLUS</span></li>
    <li class="lf-op" aria-hidden="true">=</li>
    <li class="lf-part"><span class="lf-img"><img src="/images/worksHub+/logo/logo-atoms.svg" width="107" height="107" style="--w:107" loading="lazy" alt="" onerror="this.remove()"></span><span class="sr-only">完整圖形</span></li>
  </ol>
</div>

## 從 LOGO 推導介面語言

LOGO 不只是放在左上角。我把它的每個元素，都對應到後台的一個視覺規則：

<div class="rule-map">
<div class="rule-table">

| LOGO 元素 | 介面規則 | 用在哪 |
|---|---|---|
| C 形圓環的圓弧 | 全面圓角，按鈕與篩選元件用膠囊形 | 按鈕、下拉框、狀態標籤、麵包屑 |
| 藍綠漸層 | 品牌漸層 | 使用者頭像、空狀態 icon、彈窗標題 icon |
| 青綠色的「＋」 | 品牌輔助色 | 子選單選中態、分組標題前的小方塊、「使用中」狀態 |
| 對話框的深藍 | 強調文字色 | 子項被選中時的父選單文字 |
| 對話框的品牌藍 | 主色 | 選單選中、勾選框、開關、連結 |

</div>
<figure class="rule-logo"><img src="/images/worksHub+/logo/logo-stacked.svg" width="368" height="269" loading="lazy" alt="WorksHub+ 正式 LOGO 直式版：上方是藍綠漸層圓環包住對話框的圖形，下方是 WorksHub 字標與青綠色加號" onerror="this.parentElement.remove()"></figure>
</div>

<ul class="swatches" aria-label="品牌色">
  <li><span class="chip" style="background:#124479"></span><strong>深藍</strong><code>#124479</code></li>
  <li><span class="chip" style="background:#348BDD"></span><strong>品牌藍（主色）</strong><code>#348BDD</code></li>
  <li><span class="chip" style="background:#33D1B2"></span><strong>青綠（輔助色）</strong><code>#33D1B2</code></li>
  <li><span class="chip" style="background:linear-gradient(135deg,#33D1B2,#348BDD)"></span><strong>品牌漸層</strong><code>135deg</code></li>
</ul>

## 讓 AI 照我的意思擴張

方向定了，接下來是把它變成一整套介面。我的做法是：**我決定方向和規則，AI 負責快速產出，我再一輪一輪修正。**

<div class="workflow is-row" role="list" aria-label="工作流程，共 6 步，由左到右">
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">01</span><img class="wf-ico" src="/icons/step-define.svg" alt="" width="28" height="28"></span><strong>給方向</strong><p>LOGO、三個品牌色，加上 2026 的介面趨勢：簡潔的漸層科技感、元件全部圓角。</p></div>
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">02</span><img class="wf-ico" src="/icons/step-prototype.svg" alt="" width="28" height="28"></span><strong>AI 產出 HTML 初稿</strong><p>直接產出可以點的後台畫面，比畫靜態稿更快看到整體感。</p></div>
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">03</span><img class="wf-ico" src="/icons/step-review.svg" alt="" width="28" height="28"></span><strong>用我的眼睛審</strong><p>圓角、漸層都有了，但配色是死白配無彩灰，畫面沒有層次。</p></div>
  <div class="wf-turn" aria-hidden="true"><span></span></div>
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">04</span><img class="wf-ico" src="/icons/step-scope.svg" alt="" width="28" height="28"></span><strong>自己定義背景色階</strong><p>用些微的暖灰搭配藍淺灰，讓元件堆疊出層次。</p></div>
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">05</span><img class="wf-ico" src="/icons/step-spec.svg" alt="" width="28" height="28"></span><strong>拍板細部規則</strong><p>圓角分層、主按鈕對比、取消主題色切換，一條一條定下來。</p></div>
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">06</span><img class="wf-ico" src="/icons/step-handoff.svg" alt="" width="28" height="28"></span><strong>AI 擴張到全站</strong><p>規則定好後，讓 AI 套到其他頁面、彈窗、登入頁與深色模式。</p></div>
</div>

### 關鍵修正：AI 給了死白，我給了層次

<div class="fix-row">
<div class="fix-text">

我要 AI 做「科技感的圓角版本」時，它給的配色是**純白底加上無彩色的灰**。單看每個元件都沒問題，但側欄、卡片、篩選列、輸入框疊在一起時，全部糊成一片白，看不出誰在上、誰在下。

我自己定義了一整組背景色階：**以些微的暖灰搭配藍淺灰**，每一層之間只差一點點，讓元件堆疊時層次清楚，又不會花亂；整體維持簡潔，但多了一點科技的冷調。

</div>
<div class="layers" role="img" aria-label="背景色階示意：最外層畫布 #E6EBF0，上面浮起側欄 #F8FAFB 與主內容卡片 #FFFFFF；卡片裡是篩選列 #F4F7F9，篩選列裡有次要按鈕 #EDF1F4">
  <p class="ly-name ly-canvas">畫布 <code>shell-bg #E6EBF0</code></p>
  <div class="ly" style="background:#F8FAFB"><p class="ly-name">側欄 <code>panel #F8FAFB</code></p></div>
  <div class="ly" style="background:#FFFFFF"><p class="ly-name">主內容卡片 <code>surface #FFFFFF</code></p>
    <div class="ly" style="background:#F4F7F9"><p class="ly-name">篩選列 <code>section-bg #F4F7F9</code></p>
      <div class="ly ly-chip" style="background:#EDF1F4"><p class="ly-name">次要按鈕 <code>secondary-bg #EDF1F4</code></p></div>
    </div>
  </div>
</div>
</div>

<div class="compare is-labeled">
  <figure><figcaption><span class="cmp-tag">原始版本</span>純白＋無彩灰，元件疊在一起分不出層次。</figcaption><img src="/images/worksHub+/shots/before-original.jpg" width="2400" height="1324" loading="lazy" alt="原始版本：純白側欄與白色卡片放在淺灰底上，層次只靠細線分隔"></figure>
  <figure><figcaption><span class="cmp-tag">新版本</span>畫布、側欄、主內容卡片與設定卡片各自一層，一眼看出結構。</figcaption><img src="/images/worksHub+/shots/after-home-light.jpg" width="2400" height="1218" loading="lazy" alt="新版本的後台首頁：灰藍畫布上浮起圓角側欄與白色主卡片，選中的選單是品牌藍底白字，七張設定卡片的 icon 用品牌漸層"></figure>
</div>

### 其他由我拍板的規則

<div class="decisions">
  <div class="decision">
    <p class="q">圓角要不要全部做成膠囊形？</p>
    <p class="a">按鈕和篩選元件用膠囊形，其他依容器層級遞增：標籤 8px → 操作按鈕 10px → 彈窗輸入框 12px → 區塊 14px → 卡片 16px → 彈窗 20px。</p>
    <p class="why">圓角跟著層級走，外層大、內層小，堆疊時看得出誰包住誰。</p>
  </div>
  <div class="decision">
    <p class="q">品牌藍當主按鈕，白字夠清楚嗎？</p>
    <p class="a">品牌藍上的白字對比只有 3.57，我只把主要按鈕加深一階（#2B7BC9，對比 4.39），選單、勾選框、開關、連結維持品牌藍。</p>
    <p class="why">提高最重要的行動按鈕的可讀性，同時不讓整體配色變暗。</p>
  </div>
  <div class="decision">
    <p class="q">原本的藍／綠／紫主題切換要保留嗎？</p>
    <p class="a">只保留淺色與深色兩種模式。</p>
    <p class="why">品牌色確立後，多套主題色會稀釋識別；前端也能少維護三套設定。</p>
  </div>
</div>

## 介面成果

同一套規則，讓 AI 擴張到後台的主要畫面，淺色、深色兩種模式共用同一組 Token 結構，只替換色值：

<div class="mode-tabs" data-tabs>
  <div class="mode-tablist" role="tablist" aria-label="切換淺色與深色模式">
    <button class="mode-tab" type="button" role="tab" id="mode-tab-light" aria-controls="mode-light" aria-selected="true">淺色模式</button>
    <button class="mode-tab" type="button" role="tab" id="mode-tab-dark" aria-controls="mode-dark" aria-selected="false" tabindex="-1">深色模式</button>
  </div>
  <div class="mode-panel" role="tabpanel" id="mode-light" aria-labelledby="mode-tab-light">
    <figure class="shot"><img src="/images/worksHub+/shots/after-users-light.jpg" width="2400" height="1350" loading="lazy" alt="淺色模式的使用者管理頁：灰藍畫布上浮起圓角側欄與白色主卡片，選中的子選單是青綠色，主按鈕是膠囊形品牌藍"></figure>
    <div class="compare">
      <figure><img src="/images/worksHub+/shots/after-modal-light.jpg" width="2400" height="1350" loading="lazy" alt="淺色模式的新增使用者彈窗：背景模糊，彈窗 20px 圓角，標題前有品牌漸層 icon，關閉鈕為圓形，取消與確定都是膠囊按鈕"><figcaption><strong>彈窗</strong>｜遮罩加上模糊，標題 icon 用品牌漸層，輸入框 12px 圓角。</figcaption></figure>
      <figure><img src="/images/worksHub+/shots/after-login-light.jpg" width="2400" height="1350" loading="lazy" alt="淺色模式的登入頁：淺灰格線背景，左上與右下有淡淡的青綠與藍色光暈，中間是白色圓角登入卡片與膠囊形登入按鈕"><figcaption><strong>登入頁</strong>｜背景的青綠與藍色光暈，延續 LOGO 的漸層。</figcaption></figure>
    </div>
  </div>
  <div class="mode-panel" role="tabpanel" id="mode-dark" aria-labelledby="mode-tab-dark" hidden>
    <figure class="shot"><img src="/images/worksHub+/shots/after-users-dark.jpg" width="2400" height="1350" loading="lazy" alt="深色模式的使用者管理頁：深灰畫布上浮起深色卡片，選中的子選單是青綠色，主按鈕維持品牌藍"></figure>
    <div class="compare">
      <figure><img src="/images/worksHub+/shots/after-modal-dark.jpg" width="2400" height="1350" loading="lazy" alt="深色模式的新增使用者彈窗：深色背景模糊，深灰彈窗，標題前有品牌漸層 icon，確定按鈕維持品牌藍"><figcaption><strong>彈窗</strong>｜遮罩加上模糊，標題 icon 用品牌漸層，輸入框 12px 圓角。</figcaption></figure>
      <figure><img src="/images/worksHub+/shots/after-login-dark.jpg" width="2400" height="1350" loading="lazy" alt="深色模式的登入頁：深色格線背景，左上與右下有淡淡的青綠與藍色光暈，中間是深灰圓角登入卡片與品牌藍登入按鈕"><figcaption><strong>登入頁</strong>｜背景的青綠與藍色光暈，延續 LOGO 的漸層。</figcaption></figure>
    </div>
  </div>
</div>

<p class="screen-note">截圖為設計稿，人名與資料已替換為示意內容。</p>

## 交付：讓前端的 AI 也讀得懂

前端現在也用 AI 寫程式。所以我的交付物不只要讓人看得懂，也要讓**前端的 AI 工具讀了就能正確套用**。

<div class="deliverables" role="list" aria-label="交付物，共 3 項">
  <div class="dv-card" role="listitem"><img src="/icons/dv-table.svg" alt="" width="32" height="32"><strong>Design Token（tokens.json）</strong><p>沿用前端既有的檔案結構，可以直接取代舊檔；淺色、深色各一組，每個值都寫明用在哪個元件。</p></div>
  <div class="dv-card" role="listitem"><img src="/icons/dv-doc.svg" alt="" width="32" height="32"><strong>差異說明文件</strong><p>新舊版本逐項對照。「會讓程式壞掉的變動」放在最前面，每一項都標上改值、新增、移除、設計決議四種標籤，連 Naive UI 該怎麼覆寫都寫清楚。</p></div>
  <div class="dv-card" role="listitem"><img src="/icons/dv-prototype.svg" alt="" width="32" height="32"><strong>補充情境畫面</strong><p>前端套用時，再補上錯誤情境、404 等空值畫面，讓例外狀態也有一致的樣子。</p></div>
</div>

<figure class="shot is-narrow">
  <img src="/images/worksHub+/shots/deliver-diff-doc.jpg" width="1768" height="1636" loading="lazy" alt="Token 差異說明文件：最上方是版本與來源說明，接著是「會造成程式破壞的變動」清單，每一項前面有移除、改值、新增等彩色標籤">
  <figcaption>差異說明文件：先講會讓程式壞掉的地方，再列色彩、圓角、版面的逐項對照。</figcaption>
</figure>


## 亮點

<div class="outcome">
  <p class="oc-lead">提案一次通過，前端零來回，直接上了正式線。</p>
  <div class="oc-stats" role="list" aria-label="關鍵成果">
    <div class="oc-stat" role="listitem"><p class="oc-num">1<span>次</span></p><strong>提案通過</strong><p>LOGO、視覺與 Token 一次過關</p></div>
    <div class="oc-stat" role="listitem"><p class="oc-num">0<span>來回</span></p><strong>前端實作</strong><p>交付 Token 與差異說明後，只補了幾個情境畫面，前端確認後就完成</p></div>
    <div class="oc-stat" role="listitem"><p class="oc-num">2<span>種模式</span></p><strong>一套 Token</strong><p>淺色、深色共用同一份結構，取代原本三套主題色<br>也方便角色在不同裝置環境下的操作。</p></div>
  </div>
  <p class="oc-reuse">導入後，有稍微對內部做了簡易的使用者調查，獲得了4.5顆星的優良回饋。</p>
</div>
