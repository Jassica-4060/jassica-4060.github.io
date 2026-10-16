---
title: 漸進式訊息
product: LINE OA 後台
tier: main
order: 2
duration: 5 個工作天
role: 產品部 UIUX，支援專案處：互動設計、Mockup 與 SPEC 交付
proves: [跨部門協作, 互動設計, 規格交付]
summary: 從產品部支援專案處，把 PM 定義好、但很抽象的觸發規則，設計成一看就懂、動手就會設定的流程圖介面。
category: 產品設計
kind: SaaS 後台・互動設計
date: "2024.11"
skills: [互動設計, 元件設計, 跨部門協作, Figma]
cover: /covers/progressive.svg
---

## 背景與問題

漸進式訊息是 LINE OA 後台底下的微服務：品牌可以依照不同條件、不同時間點，自動發送自訂的訊息，做更深層的分群與行銷。很多客戶都提出過這個需求，公司也決定把它做成模組。

<div class="scope">
  <div class="scope-row is-out">
    <span class="scope-mark">原本</span>
    <div><strong>一次性推播</strong><p>分群行銷只能推一次訊息，推完之後就沒有下文。</p></div>
  </div>
  <div class="scope-row is-in">
    <span class="scope-mark">現在</span>
    <div><strong>依客戶的動向，決定下一則訊息</strong><p>例如推一則抽獎活動：有參加的人，接著收到新的行銷訊息；沒參加的人，收到提醒或其他誘因。</p></div>
  </div>
</div>

這次的需求不模糊。PM 的需求簡報已經有完整的規格、觸發規則和時間條件。真正的難題是：**這些規則非常抽象，要怎麼讓品牌的行銷人員看得懂、設定得出來？**

## 角色與團隊

- **我的角色：** 我隸屬於產品部，這次支援**專案處**的專案。負責把 PM 的規格轉成可以操作的介面，產出 Mockup 和 SPEC，並交付給開發。
- **合作夥伴：** 專案處的 PM、前端與後端。三個角色都不是我平常合作的同事。
- **時程：** 設計製作 5 個工作天。

<div class="team" role="list" aria-label="分工：專案處 PM → 我（產品部 UIUX）→ 專案處前端 → 專案處後端">
  <div class="team-node is-stake" role="listitem"><strong>PM</strong><span>專案處</span><span>需求與規則</span></div>
  <span class="team-arrow" aria-hidden="true">→</span>
  <div class="team-node is-me" role="listitem"><strong>UIUX</strong><span>產品部支援</span><span>互動與規格</span></div>
  <span class="team-arrow" aria-hidden="true">→</span>
  <div class="team-node is-dev" role="listitem"><strong>FE</strong><span>專案處</span><span>前端開發</span></div>
  <span class="team-arrow" aria-hidden="true">→</span>
  <div class="team-node is-dev" role="listitem"><strong>BE</strong><span>專案處</span><span>後端開發</span></div>
</div>

## 跨部門合作：先懂對方，再動手

和不熟的團隊合作，我把力氣花在「讓對方不必適應我」：

<ol class="steps">
  <li><strong>先理解對方的系統。</strong>專案處的後台架構、技術限制和元件規範，都和產品部不是同一套。我先把這些摸清楚，設計才不會做出對方的系統接不住的東西。</li>
  <li><strong>前期只和 PM 對焦。</strong>規則在需求初期就已經定義好，所以設計方向拍板之前，我只和 PM 小範圍來回確認，不佔用開發的時間。</li>
  <li><strong>方向拍板後，一場交付會議講清楚。</strong>開發看的是 Mockup、直接寫在設計稿上的 SPEC，以及各種狀態的情境稿。不熟的開發也能照著稿子看懂每個操作的規則。</li>
</ol>

<p class="principle"><strong>主動補上的一條規則：</strong>研究 LINE API 時，我發現訊息的發送數量有上限。所以我在設定中加上「訊息上限」：達到上限，系統就自動關閉這個旅程，不再發送，並在介面上提示。這是為了讓品牌不會超出當初設定好的訊息額度。</p>

## 關鍵設計決策

規則本身已經定好，我負責的是決定這些規則「長什麼樣子、怎麼操作」：

<div class="decisions">
  <div class="decision">
    <p class="q">這麼抽象的規則，要用什麼形式呈現？</p>
    <p class="a">把旅程畫成流程圖：往下代表時間順序，往右代表分支條件。這個概念來自 FigJam 的流程圖。</p>
    <p class="why">畫面簡單；看慣列表的使用者會覺得新鮮；邊操作就能理解怎麼設定，不必依賴操作手冊。</p>
  </div>
  <div class="decision">
    <p class="q">新增按鈕要一直顯示嗎？</p>
    <p class="a">不要。游標移到條件框或旅程線上時才出現；並用顏色區分單位：條件是藍色，訊息是綠色。</p>
    <p class="why">流程和規則越長，按鈕就越多，會造成視覺疲勞和操作阻礙。讓元件跟著操作動線出現，最直覺。</p>
  </div>
  <div class="decision">
    <p class="q">每個條件的設定內容要放在哪裡？</p>
    <p class="a">左邊是流程畫布，右邊是設定面板。點選哪一個框，右側就展開哪一個框的設定。</p>
    <p class="why">看著流程就能馬上改對應的設定，不用切換視窗，一個螢幕完成所有設定。</p>
  </div>
  <div class="decision">
    <p class="q">拖曳受技術限制、只能橫向，怎麼設計？</p>
    <p class="a">只支援同一層的條件左右拖曳；只有右側有其他條件時，才顯示拖曳圖示。</p>
    <p class="why">這是技術限制。拖曳圖示只出現在真的能拖的地方，使用者就不會去嘗試做不到的操作。</p>
  </div>
</div>

## 把規格轉成看得見的限制

PM 規格中的限制條件，我一條一條對應到介面上，讓使用者在操作的當下就知道邊界在哪：

| 規則 | 介面上怎麼呈現 |
|---|---|
| 同時最多啟用 5 個旅程 | 列表頁上方直接寫出限制；超過時跳出提示，新的旅程維持關閉，等其他旅程結束後再手動開啟 |
| 一個旅程最多 10 個條件（含起始條件）、10 則訊息 | 旅程設定標題即時顯示「觸發條件 N 筆／傳送訊息 N 筆」；達到上限後，新增按鈕變成 Disable |
| 間隔時間最小單位是「天」 | 間隔用「−　1 天後　＋」調整天數，不提供分鐘、小時（SI 主機負載考量） |
| 刪除條件會一併刪除下方訊息與右側分支 | 刪除前先跳出確認，說明會連帶刪除的內容 |
| 旅程期間內不能編輯 | 旅程期間內鎖定設定，無法編輯 |
| 發送數量每日重新計算 | 「已發送訊息數」旁加上提示：系統每日白天重新計算數量 |

### 把規格轉成啟用前的檢核流程

規格中定義了哪些情況不能啟用。我把它們整理成按下「啟用」時依序執行的檢核，並為沒通過的情況設計提示：

<ol class="steps">
  <li><strong>必填欄位是否空白：</strong>提示「尚有設定尚未完成，請確認完成所有設定後才可啟用。」</li>
  <li><strong>欄位是否有錯誤：</strong>有錯誤就不能啟用。</li>
  <li><strong>是否在有效期間內：</strong>有效期間以外的旅程是「強制停用」，不能再啟用。</li>
  <li><strong>是否已達 5 個旅程：</strong>提示「列表尚有正在發送的漸進式訊息，此排程將顯示關閉」，請使用者等其他排程結束後再手動開啟。</li>
</ol>

## 互動設計：三種新元件、四種狀態

既有的設計系統裡，沒有能表達「流程」的元件。所以我打破既有元件，新增三種元件：**條件框、訊息框、旅程線**，並為每一種定義 Default、Hover、Clicked、Disable 四種狀態，最後建進設計系統。

<figure class="shot">
  <img src="/images/Progressive/states.png" width="1760" height="760" loading="lazy" alt="元件狀態規格：左邊是條件框與起始條件的 Default、Hover、Clicked、Disable 四種狀態，Hover 時下方與右側出現新增箭頭；右邊是訊息框與旅程線的四種狀態，Hover 旅程線時出現「新增訊息」按鈕">
  <figcaption>條件框（藍）與訊息框（綠）用顏色區分；新增的箭頭和按鈕，只在 Hover 時出現。</figcaption>
</figure>

新增的方式也跟著方向的意義設計：游標移到框上，下方和右側會出現箭頭。點下方的箭頭，是在時間順序上接下一步；點右側的箭頭，是新增一個分支條件。

<figure class="shot is-narrow">
  <img src="/images/Progressive/add-condition.png" width="903" height="430" loading="lazy" alt="新增條件的互動說明：游標移到條件框上，下方與右側出現新增箭頭；點擊下方箭頭會出現虛線的「新增條件」框，完成後兩個條件之間自動帶入「1 天後」的間隔">
  <figcaption>在條件底下新增條件：Hover 出現箭頭 → 點擊後出現預覽框 → 自動帶入「1 天後」的間隔。</figcaption>
</figure>

## 介面設計

整個模組分成三個畫面：**旅程列表**、**旅程設定**、**查看分析**。

<div class="screens">
  <section class="screen">
    <div class="screen-text">
      <p class="screen-label">畫面 1</p>
      <h3>旅程列表</h3>
      <p>品牌管理所有漸進式訊息的入口。設計目標是讓使用者一眼看出：哪些旅程正在發送、訊息額度還剩多少。</p>
      <ul>
        <li><strong>狀態開關：</strong>新建的旅程預設關閉，要手動開啟才會正式啟用；最多同時開啟 5 個。</li>
        <li><strong>額度看得見：</strong>「已發送訊息數／訊息上限」並排顯示，達到上限時以紅字標示。</li>
        <li><strong>三種狀態：</strong>啟用中、停用中，以及有效期間結束後的「強制停用」。</li>
      </ul>
    </div>
    <figure class="ph screen-media"><span>畫面待補｜旅程列表</span><img src="/images/Progressive/list.png" width="1419" height="972" loading="lazy" alt="漸進式訊息的旅程列表：上方提示最多同時開啟 5 個漸進式訊息，表格列出旅程名稱、有效期間、更新時間、已發送訊息數與狀態開關" onerror="this.remove()"></figure>
  </section>
  <section class="screen">
    <div class="screen-text">
      <p class="screen-label">畫面 2</p>
      <h3>旅程設定｜條件</h3>
      <p>使用者停留最久的畫面。上方是基本設定，下方是旅程畫布。</p>
      <ul>
        <li><strong>基本設定：</strong>旅程名稱、旅程期間、每人參與次數、訊息上限。</li>
        <li><strong>即時計數：</strong>標題下方顯示目前的條件數與訊息數，快到上限時一看就知道。</li>
        <li><strong>條件類型：</strong>加入好友、會員綁定、會員綁定櫃點、貼上指定標籤、收到指定訊息模板、指定優惠券；選完後可以再加上指定的時間區間。</li>
      </ul>
    </div>
    <figure class="ph screen-media"><span>畫面待補｜旅程設定（條件）</span><img src="/images/Progressive/setting-condition.png" width="1419" height="1317" loading="lazy" alt="旅程設定畫面：上方是基本設定表單；下方左側是旅程畫布，從起始條件往下接「1 天後」再分出多個條件與訊息，右側是起始條件的設定面板" onerror="this.remove()"></figure>
  </section>
  <section class="screen">
    <div class="screen-text">
      <p class="screen-label">畫面 3</p>
      <h3>旅程設定｜訊息</h3>
      <p>點選訊息框，右側面板切換成訊息編輯。</p>
      <ul>
        <li><strong>訊息類型：</strong>文字、圖片、影片、語音、貼圖，以及訊息模板；每則訊息都要設定發送時段。</li>
        <li><strong>泡泡上限：</strong>一則訊息最多 5 個泡泡。</li>
        <li><strong>模板二擇一：</strong>訊息模板和自訂訊息只能擇一。選擇模板會覆蓋原本的泡泡內容，且模板內容只能查看、不能編輯。</li>
        <li><strong>設定說明：</strong>右上角的「設定說明」用 4 個步驟說明整個設定方式。</li>
      </ul>
    </div>
    <figure class="ph screen-media"><span>畫面待補｜旅程設定（訊息）</span><img src="/images/Progressive/setting-message.png" width="1419" height="1536" loading="lazy" alt="旅程設定的訊息編輯：左側畫布選取了綠色的訊息框，右側面板可以選擇文字、圖片、影片、語音、貼圖或訊息模板，並設定發送時段" onerror="this.remove()"></figure>
  </section>
  <section class="screen">
    <div class="screen-text">
      <p class="screen-label">畫面 4</p>
      <h3>查看分析</h3>
      <p>旅程啟用後，品牌要知道每一則訊息送給了誰、送了多少。</p>
      <ul>
        <li><strong>沿用同一張流程圖：</strong>只有訊息框可以點選，點選後在右側查看訊息內容（唯讀）。</li>
        <li><strong>訊息列表：</strong>列出每則訊息的傳送則數，以及總發送數／訊息上限。</li>
        <li><strong>下載 UID 名單：</strong>每則訊息都能匯出收到訊息的 UID 名單。</li>
      </ul>
      <p class="screen-note">畫面中的名稱與數字都是模擬資料。</p>
    </div>
    <figure class="ph screen-media"><span>畫面待補｜查看分析</span><img src="/images/Progressive/analysis.png" width="1419" height="1306" loading="lazy" alt="查看分析畫面：上方是唯讀的旅程流程圖與訊息內容，下方訊息列表顯示每則訊息的傳送則數與下載 UID 名單按鈕" onerror="this.remove()"></figure>
  </section>
</div>

## 工作流程與交付

這個專案發生在公司導入 AI 之前，所有畫面、元件和情境稿都是我手工繪製的。5 個工作天裡，**最花時間的是構思互動方式**，最費工的則是把新元件建進設計系統。

<div class="workflow" role="list" aria-label="工作流程，共 6 步，依 S 形方向閱讀">
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">01</span><img class="wf-ico" src="/icons/step-define.svg" alt="" width="28" height="28"></span><strong>讀懂需求簡報</strong><p>整理 PM 定義好的觸發規則、時間條件與各種上限。</p></div>
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">02</span><img class="wf-ico" src="/icons/step-scope.svg" alt="" width="28" height="28"></span><strong>理解專案處的系統</strong><p>摸清後台架構、技術限制與元件規範。</p></div>
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">03</span><img class="wf-ico" src="/icons/step-prototype.svg" alt="" width="28" height="28"></span><strong>構思互動方式</strong><p>借用 FigJam 流程圖的概念，定義往下與往右的意義。</p></div>
  <div class="wf-turn" aria-hidden="true"><span></span></div>
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">04</span><img class="wf-ico" src="/icons/step-review.svg" alt="" width="28" height="28"></span><strong>建立新元件</strong><p>條件框、訊息框、旅程線，各自做出四種狀態並建進設計系統。</p></div>
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">05</span><img class="wf-ico" src="/icons/step-spec.svg" alt="" width="28" height="28"></span><strong>組 Mockup、寫 SPEC</strong><p>和 PM 對焦拍板，同時把規則直接標註在設計稿上。</p></div>
  <div class="wf-card" role="listitem"><span class="wf-head"><span class="wf-num">06</span><img class="wf-ico" src="/icons/step-handoff.svg" alt="" width="28" height="28"></span><strong>交付會議</strong><p>用 Mockup 與各狀態情境稿，一次和開發講清楚。</p></div>
</div>

### 交付物

<div class="deliverables" role="list" aria-label="交付物，共 4 項">
  <div class="dv-card" role="listitem"><img src="/icons/dv-prototype.svg" alt="" width="32" height="32"><strong>Mockup</strong><p>旅程列表、旅程設定（條件／訊息）、查看分析，以及儲存、啟用、刪除等提示視窗。</p></div>
  <div class="dv-card" role="listitem"><img src="/icons/dv-doc.svg" alt="" width="32" height="32"><strong>設計稿上的 SPEC</strong><p>欄位說明、狀態定義、各種上限與規則，直接標註在對應的畫面旁邊。</p></div>
  <div class="dv-card" role="listitem"><img src="/icons/dv-table.svg" alt="" width="32" height="32"><strong>各狀態的情境稿</strong><p>新增條件、新增訊息、拖曳行為、刪除確認，每個互動都畫出操作前後的樣子。</p></div>
  <div class="dv-card" role="listitem"><img src="/icons/dv-backend.svg" alt="" width="32" height="32"><strong>新增的設計系統元件</strong><p>條件框、訊息框、旅程線三種元件，各含 Default、Hover、Clicked、Disable 四種狀態。</p></div>
</div>

## 成果

<div class="outcome">
  <p class="oc-lead">規則再完整，使用者看不懂就用不起來。<br>我把抽象的觸發規則變成可以直接操作的流程圖，讓品牌不必讀操作手冊也能設定。</p>
  <div class="oc-stats" role="list" aria-label="專案成果">
    <div class="oc-stat" role="listitem"><p class="oc-num">5<span>天</span></p><strong>從需求簡報到交付</strong><p>跨部門支援，完成互動設計、Mockup 與 SPEC</p></div>
    <div class="oc-stat" role="listitem"><p class="oc-num">3<span>種</span></p><strong>新增的流程元件</strong><p>條件框、訊息框、旅程線，各 4 種狀態</p></div>
    <div class="oc-stat" role="listitem"><p class="oc-num">已上線</p><strong>功能正式上線</strong><p>成為 LINE OA 後台的漸進式訊息模組</p></div>
  </div>
  <p class="oc-reuse">這是導入 AI 之前的作品。之後的「<a href="/work/01-bot-1v1/">Bot 一對一真人服務</a>」，則是用 AI 加速同一套「需求 → 介面 → 規格」的流程。</p>
</div>
