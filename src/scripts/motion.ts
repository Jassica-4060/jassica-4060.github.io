// 全站動效：平滑捲動、進場、視差、捲動帶動的大字、打字機。
// 使用者若在系統開啟「減少動態效果」，全部改為靜態呈現。
import Lenis from 'lenis';

const root = document.documentElement;
root.classList.remove('no-js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
