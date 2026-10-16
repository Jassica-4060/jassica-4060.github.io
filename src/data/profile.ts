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
  // ───── 首頁 ② 自我介紹（左文字、右單張照片）（範本文字，等 Figma 定稿後替換）─────
  about: {
    eyebrow: 'Hello, I’m Min',
    heading: '嗨，我是思敏，\n一個橫跨 PM、UI/UX 與視覺設計的產品設計師。',
    body: [
      '範本文字：目前在 Coolbe 負責 WorksHub+ 與 LINE OA 等大型 SaaS 後台的產品規劃與介面設計。從需求訪談、規格撰寫，到 Design System 與最終上線，我習慣把整條鏈路走完。',
      '範本文字：工作之外，我喜歡＿＿＿＿（興趣／生活）。這些經驗讓我更在意「人」在使用產品時真正的感受。',
    ],
    // 個人照片：把照片放進 public/about/，再把路徑填進 src（例：/about/me.jpg）；留空 = 顯示佔位框
    photo: { src: '', alt: '黃思敏的個人照片' },
  },
  // ───── 首頁 ③ 三張角色卡：左 PM、中 UI/UX、右 Design（範本文字）─────
  roles: [
    {
      key: 'PM',
      en: 'Product Management',
      title: '把一句話需求，收斂成能開發的規格',
      body: '範本文字：主導需求訪談與邊界定義，產出功能規格書與決議紀錄，讓 PM、RD、QA 用同一份文件對齊。',
      highlights: ['需求訪談', '規格撰寫', '流程梳理', '決議管理'],
    },
    {
      key: 'UI/UX',
      en: 'UI / UX Design',
      title: '大型 SaaS 後台的介面與體驗',
      body: '範本文字：負責 WorksHub+、LINE OA 後台的資訊架構、操作流程與高保真介面，並從 0 到 1 建立 Design System。',
      highlights: ['SaaS 後台', 'Design System', 'Prototype', 'Figma'],
    },
    {
      key: 'Design',
      en: 'Visual Design',
      title: '品牌、主視覺與網站',
      body: '範本文字：從 LOGO、活動主視覺到公司官網，把品牌與產品訊息轉化成一致的視覺語言，並能獨立完成上線。',
      highlights: ['品牌識別', '主視覺', '網頁設計', 'Illustrator'],
    },
  ],
  traits: [
    {
      name: '同理心',
      en: 'Empathy',
      body: '能夠放下個人偏好，站在使用者或商業客戶的角度思考問題。真正的同理心包含聽出對方「沒說出口的隱性需求」。',
    },
    {
      name: '協作與溝通',
      en: 'Collaboration',
      body: '能用 PM 聽得懂的「商業語言」、工程師聽得懂的「邏輯語言」、以及決策者看得懂的「價值語言」進行對話，說服團隊並對齊目標。',
    },
    {
      name: '成長與適應',
      en: 'Growth',
      body: '科技與設計工具（如 AI 工具、自動化 workflow）更新極快，保持「不害怕嘗試新方法」的心態，隨時提升工作效率。',
    },
  ],
  contacts: [
    { label: '104 履歷', url: '' },
    { label: 'Cake 履歷', url: '' },
    { label: 'LinkedIn', url: '' },
  ],
};
