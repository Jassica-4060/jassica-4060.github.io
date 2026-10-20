// 全站動效：平滑捲動、進場、視差、捲動帶動的大字、打字機。
// 使用者若在系統開啟「減少動態效果」，全部改為靜態呈現。
import Lenis from 'lenis';

const root = document.documentElement;
root.classList.remove('no-js');
// 擷取到 Figma 時（網址帶 #figmacapture）也以靜態呈現，避免內容停在淡入前的狀態
const capturing = location.hash.includes('figmacapture');
if (capturing) root.classList.add('is-capturing');
const reduce = capturing || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 平滑捲動（參考 jonprinzdesigns.com 的滑動感） */
if (!reduce) {
  const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -80 } });
  const raf = (t: number) => {
    lenis.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

/* 捲動進場 */
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -8% 0px' },
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* 視差 [data-speed] 與捲動帶動的橫向大字 [data-marquee] */
if (!reduce) {
  const para = [...document.querySelectorAll<HTMLElement>('[data-speed]')];
  const marq = [...document.querySelectorAll<HTMLElement>('[data-marquee]')];
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    for (const el of para) {
      const r = (el.parentElement ?? el).getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const offset = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(offset * -Number(el.dataset.speed)).toFixed(1)}px, 0)`;
    }
    for (const el of marq) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const p = (vh - r.top) / (vh + r.height); // 0 → 1
      const dir = el.dataset.marquee === 'right' ? 1 : -1;
      el.style.transform = `translate3d(${(dir * p * innerWidth * 0.5).toFixed(1)}px, 0, 0)`;
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
}

/* 案例頁疊卡 [data-stack]：往下捲動，最上面那張依序被抽走（左、右交替）；
   最後一張是定案，抽完後放大到滿版，再繼續往下一段。不支援動效時維持原本的宮格 */
if (!reduce) {
  document.querySelectorAll<HTMLElement>('[data-stack]').forEach((stack) => {
    const cards = [...stack.querySelectorAll<HTMLElement>('[data-stack-card]')];
    const box = stack.querySelector<HTMLElement>('[data-stack-box]');
    const counter = stack.querySelector<HTMLElement>('[data-stack-current]');
    const count = counter?.parentElement;
    const n = cards.length;
    if (n < 2 || !box) return;
    const tilt = [-3, 2, -2, 0]; // 疊在下面時的歪斜角度（度），最後一張擺正
    stack.style.setProperty('--n', String(n));
    stack.classList.add('is-stack');
    cards.forEach((c, i) => { c.style.zIndex = String(n - i); });

    let zoomTo = 1;
    const measure = () => {
      const last = cards[n - 1];
      // 用未變形的尺寸計算：放大到撐滿卡片區的寬或高（取較小者）
      zoomTo = Math.max(1, Math.min(box.clientWidth / last.offsetWidth, box.clientHeight / last.offsetHeight) * 0.96);
    };
    const smooth = (t: number) => t * t * (3 - 2 * t);
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = stack.getBoundingClientRect();
      const raw = Math.min(Math.max(-r.top / (r.height - innerHeight), 0), 1);
      // 前留 8%、後留 14% 停頓；中間先抽走 n-1 張，最後 1 段放大定案
      const t = Math.min(Math.max((raw - 0.08) / 0.78, 0), 1) * n;
      const p = Math.min(t, n - 1);
      const zoom = smooth(Math.min(Math.max(t - (n - 1), 0), 1));
      cards.forEach((c, i) => {
        const out = i < n - 1 ? Math.min(Math.max(p - i, 0), 1) : 0; // 0 = 還在疊上，1 = 已抽走
        const depth = Math.max(i - p, 0);                               // 0 = 最上面那張
        const dir = i % 2 ? 1 : -1;
        const ease = smooth(out);
        const x = dir * ease * 110;
        const rot = tilt[i % tilt.length] * Math.min(depth, 1) + dir * ease * 18;
        let scale = 1 - Math.min(depth, 2) * 0.05;
        if (i === n - 1) scale *= 1 + zoom * (zoomTo - 1);
        c.style.transform = `translate(${x.toFixed(2)}vw, calc(${(depth * 16).toFixed(1)}px - ${(ease * 12).toFixed(2)}vh)) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        c.style.opacity = String(1 - ease * 0.4);
      });
      if (counter) counter.textContent = String(Math.min(Math.round(p) + 1, n)).padStart(2, '0');
      if (count) count.style.opacity = String(1 - zoom);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => { measure(); onScroll(); });
    cards[n - 1].querySelector('img')?.addEventListener('load', () => { measure(); update(); });
    measure();
    update();
  });
}

/* 案例頁 Tab [data-tabs]：點擊或左右鍵切換（例：淺色／深色模式） */
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((group) => {
  const tabs = [...group.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const select = (tab: HTMLButtonElement, focus = false) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls')!);
      if (!panel) continue;
      panel.hidden = !on;
      if (on && !reduce) {
        panel.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
          { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
    }
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
});

/* 案例頁關鍵畫面預覽 [data-preview]：點「預覽」開啟 Modal，左邊大圖、右邊說明；點背景、✕ 或按 Esc 關閉（例：甜心卡） */
const previewModal = document.querySelector<HTMLDialogElement>('.ui-modal');
if (previewModal) {
  const big = previewModal.querySelector<HTMLImageElement>('.ui-modal-img')!;
  const num = previewModal.querySelector<HTMLElement>('.ui-modal-num')!;
  const title = previewModal.querySelector<HTMLElement>('#ui-modal-title')!;
  const detail = previewModal.querySelector<HTMLElement>('.ui-modal-detail')!;
  document.querySelectorAll<HTMLButtonElement>('[data-preview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest<HTMLElement>('.ui-shot')!;
      const img = card.querySelector<HTMLImageElement>('.ui-shot-media > img')!;
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      num.textContent = card.querySelector('.ui-shot-num')?.textContent ?? '';
      title.textContent = card.querySelector('.ui-shot-name')?.textContent ?? '';
      detail.innerHTML = card.querySelector('.ui-detail')?.innerHTML ?? '';
      previewModal.showModal();
    });
  });
  previewModal.querySelector('.ui-modal-close')!.addEventListener('click', () => previewModal.close());
  previewModal.addEventListener('click', (e) => { if (e.target === previewModal) previewModal.close(); });
}

/* 打字機（參考 aaronjames.design 首頁） */
const tw = document.querySelector<HTMLElement>('[data-typewriter]');
if (tw) {
  const phrases: string[] = JSON.parse(tw.dataset.typewriter ?? '[]');
  if (reduce || phrases.length < 2) {
    tw.textContent = phrases[0] ?? '';
  } else {
    let i = 0;
    let n = 0;
    let deleting = false;
    const step = () => {
      const full = phrases[i];
      n += deleting ? -1 : 1;
      tw.textContent = full.slice(0, n);
      let delay = deleting ? 38 : 95;
      if (!deleting && n === full.length) {
        deleting = true;
        delay = 2200;
      } else if (deleting && n === 0) {
        deleting = false;
        i = (i + 1) % phrases.length;
        delay = 400;
      }
      setTimeout(step, delay);
    };
    tw.textContent = '';
    setTimeout(step, 600);
  }
}
