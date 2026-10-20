// 網站上的個人資料。改這裡就會同步到首頁、頁尾、聯絡區。
// url 留空字串 = 網站上顯示「連結待補」，填入網址後就會變成可點擊。

export const profile = {
  name: '黃思敏',
  nameEn: 'C MIN',
  title: 'Product Designer × 產品規劃',
  location: '台灣・台北',
  positioning: '擅長把混亂需求整理成可落地介面與規格的設計師。',
  intro:
    '專精於大型 SaaS 後台網站規劃與系統架構設計。善於將複雜的業務邏輯拆解為直覺、高效的產品體驗，並具備從 0 到 1 獨立定義 Design System、架構規劃至最終完稿落地的能力。',
  keywords: ['SaaS 後台', 'Design System', '需求收斂', '跨部門溝通'],
  // 首頁打字機效果輪播的句子（前面固定接「我把混亂的需求，」）
  typewriter: ['整理成可落地的介面。', '收斂成工程看得懂的規格。', '轉化成團隊對齊的共識。'],
  philosophy: '懂得溝通，可以讓事情變得簡單',
  difference:
    '不同於傳統僅專注於介面視覺的設計師，我抱持「不設限、全方位拓寬技能樹」的工作哲學。我將自己定位為產品問題解決者，不僅具備大型 SaaS 架構與跨領域設計能力，更能為了確保產品最佳落地，主動跨足流程梳理與新技術研究，為團隊帶來極高的協作彈性與不可替代性。',
  // ───── 首頁 ② 自我介紹（左文字、右單張照片）─────
  about: {
    eyebrow: 'Hello, I’m Min',
    heading: '嗨！我是思敏\n一個擁有從0到1，初期需求釐清拆解並規劃成可交付開發的設計稿的設計師。',
    body: [
      '目前在 CoolBe 負責 WorksHub+ 與 LINE OA 等大型 SaaS 後台的產品規劃與介面設計。從需求訪談、規格撰寫，到完成 Design Mockup 與制定 Design System 跟最後驗收，我習慣把整條產品開發鏈走完，以確保品質。',
      '工作之外，我喜歡投資自己，除了在投資以外也喜歡學習新事物。額外的興趣也可拓展我的視野，也可在專業能力上給我加持。因為很多事物的設計都是圍繞在「人本」、「體驗」的感受上。',
    ],
    // 個人照片：把照片放進 public/about/，再把路徑填進 src（例：/about/me.jpg）；留空 = 顯示佔位框
    photo: { src: '', alt: '黃思敏的個人照片' },
  },
  // ───── 首頁 ③ 三張角色卡：左 PM、中 UI/UX、右 Design─────
  roles: [
    {
      key: 'PM',
      icon: '/images/Home/icon-pm.svg', // 卡片最下方的彩色 icon
      en: 'Product Management',
      title: '把一句話需求，收斂成能開發的規格',
      body: '主導需求訪談與邊界定義，產出功能規格書與決議紀錄，讓開發團隊共用同一份文件對齊資訊。並在會議中釐清各角色語言，解構並收斂成定案，確保團隊認知。',
      highlights: ['需求訪談', '規格撰寫', '流程梳理', '決議管理'],
    },
    {
      key: 'UI/UX',
      icon: '/images/Home/icon-uiux.svg', // 卡片最下方的彩色 icon
      en: 'UI / UX Design',
      title: '大型 SaaS 後台的介面與體驗',
      body: '負責WorksHub+跟 LINE OA 後台模組的資訊架構、操作流程與高保真畫面，並制定Design System 確保產品有各自的元件規範跟色彩定義，並將系統 Token 化，方便未來迭代。',
      highlights: ['SaaS 後台', 'Design System', 'Prototype', 'Figma'],
    },
    {
      key: 'Design',
      icon: '/images/Home/icon-designer.svg', // 卡片最下方的彩色 icon
      en: 'Visual Design',
      title: '品牌、主視覺與網站',
      body: '從 LOGO、活動主視覺到公司官網，協助公司建立品牌形象，並制定一套品牌識別CIS系統與規範。將公司的識別轉化成一致的視覺語言，並在不同節慶或是禮品設計相關視覺製作物。',
      highlights: ['品牌識別', '品牌識別CIS', '主視覺', '網頁設計', 'Illustrator'],
    },
  ],
  traits: [
    {
      name: '同理心',
      en: 'Empathy',
      body: '我相信好的設計始於傾聽。不只關注使用者表面說了什麼，更透過行為觀察與情境脈絡，挖掘未被滿足的潛在需求，讓設計精準解決痛點，帶來順暢且有溫度的體驗。',
    },
    {
      name: '協作與溝通',
      en: 'Collaboration',
      body: '設計不是單打獨鬥。我習慣主動搭建溝通橋樑，用清晰的視覺邏輯與文字與工程、產品及商業團隊對齊目標，在多方期待與技術限制之間找到最優解答。',
    },
    {
      name: '成長與適應',
      en: 'Growth',
      body: '面對快速變動的市場與新工具，我保持好奇與敏捷。勇於嘗試新方法，並透過數據與反饋持續修正，在不確定性中建立秩序，讓自己與產品共同進化。',
    },
  ],
  contacts: [
    { label: '104 履歷', url: '' },
    { label: 'Cake 履歷', url: '' },
    { label: 'LinkedIn', url: '' },
  ],
};
