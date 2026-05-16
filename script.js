/* ============================================================
   BLXCK — interactions
   Loader, magnetic buttons, labeled cursor, hero spotlight,
   reveal-on-scroll, live HUD. Native scroll only.
   ============================================================ */

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  document.body.classList.add('is-loading');

  /* ============================================================
     REVEAL — bind first so it works regardless of loader state
     ============================================================ */
  const revealTargets = [
    ...document.querySelectorAll('[data-reveal]'),
    document.querySelector('.lookbook__media'),
    document.querySelector('.manifesto'),
  ].filter(Boolean);

  const revealAll = () => revealTargets.forEach((el) => el.classList.add('is-revealed'));

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealAll();
  }

  /* ============================================================
     LOADER
     Counts to 100, fills bar, curtains away, unlocks scroll.
     ============================================================ */
  const loader = document.getElementById('loader');
  const startHeroReveal = () => {
    const hero = document.querySelector('.hero');
    if (hero) hero.classList.add('is-revealed');
  };
  const finishLoader = () => {
    document.body.classList.remove('is-loading');
    startHeroReveal();
  };

  const runLoader = () => {
    if (!loader || reduceMotion) {
      if (loader) loader.classList.add('is-done', 'is-gone');
      finishLoader();
      return;
    }
    const count = loader.querySelector('.loader__count');
    const bar = loader.querySelector('.loader__bar i');
    const dur = 1500;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const n = Math.floor(eased * 100);
      if (count) count.textContent = String(n).padStart(3, '0');
      if (bar) bar.style.transform = `scaleX(${eased})`;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          loader.classList.add('is-done');
          finishLoader();
        }, 200);
        setTimeout(() => loader.classList.add('is-gone'), 1400);
      }
    };
    requestAnimationFrame(step);
  };

  if (document.readyState === 'complete') {
    runLoader();
  } else {
    window.addEventListener('load', runLoader, { once: true });
    // safety: if `load` is blocked or delayed, run anyway
    setTimeout(() => {
      if (document.body.classList.contains('is-loading')) runLoader();
    }, 2200);
  }

  /* ============================================================
     STICKY HEADER
     ============================================================ */
  const header = document.getElementById('site-header');
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 24) header.classList.add('is-stuck');
    else header.classList.remove('is-stuck');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============================================================
     MOBILE NAV
     ============================================================ */
  const menuBtn = document.querySelector('.header__menu');
  const mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    const setOpen = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      mobileNav.dataset.open = String(open);
      if (open) mobileNav.removeAttribute('hidden');
      else setTimeout(() => mobileNav.setAttribute('hidden', ''), 400);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
    });
    mobileNav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => setOpen(false))
    );
  }

  /* ============================================================
     HERO SPOTLIGHT — pointer-driven radial highlight
     ============================================================ */
  const hero = document.querySelector('.hero');
  if (hero && !reduceMotion && isFinePointer) {
    let pending = 0;
    let nextX = 50, nextY = 35;
    const apply = () => {
      hero.style.setProperty('--mx', `${nextX}%`);
      hero.style.setProperty('--my', `${nextY}%`);
      pending = 0;
    };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      nextX = ((e.clientX - r.left) / r.width) * 100;
      nextY = ((e.clientY - r.top) / r.height) * 100;
      if (!pending) pending = requestAnimationFrame(apply);
    });
    hero.addEventListener('pointerleave', () => {
      nextX = 50; nextY = 35;
      if (!pending) pending = requestAnimationFrame(apply);
    });
  }

  /* ============================================================
     HERO MEDIA — rotating product showcase (crossfade carousel)
     ============================================================ */
  const heroMedia = document.querySelector('.hero__media');
  if (heroMedia) {
    const items = [...heroMedia.querySelectorAll('.hero__media-item')];
    const nameEl = document.querySelector('.hero__media-name');
    const counterEl = document.querySelector('.hero__media-counter');
    const progressEl = document.querySelector('.hero__media-progress');
    const pad = (n) => String(n).padStart(2, '0');
    const intervalMs = 4200;

    if (items.length > 1) {
      let idx = 0;
      const total = items.length;
      if (counterEl) counterEl.textContent = `${pad(1)} / ${pad(total)}`;
      if (nameEl) nameEl.textContent = items[0].dataset.label || '';

      const setActive = (next) => {
        items[idx].classList.remove('is-active');
        idx = next;
        items[idx].classList.add('is-active');
        if (nameEl) nameEl.textContent = items[idx].dataset.label || '';
        if (counterEl) counterEl.textContent = `${pad(idx + 1)} / ${pad(total)}`;
        if (progressEl && !reduceMotion) {
          progressEl.classList.remove('is-running');
          void progressEl.offsetWidth; // restart CSS transition
          progressEl.classList.add('is-running');
        }
      };

      const kick = () => {
        if (progressEl && !reduceMotion) progressEl.classList.add('is-running');
        setInterval(() => setActive((idx + 1) % total), intervalMs);
      };
      // wait for hero reveal to finish before kicking the timer
      setTimeout(kick, 600);
    }
  }

  /* ============================================================
     LABELED CURSOR (desktop only)
     ============================================================ */
  const cursor = document.querySelector('.cursor-spot');
  const cursorLabel = cursor && cursor.querySelector('.cursor-spot__label');
  if (cursor && !reduceMotion && isFinePointer) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    let active = false;
    document.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!active) {
        active = true;
        cursor.classList.add('is-active');
        cx = tx; cy = ty;
      }
    });
    document.addEventListener('mouseleave', () => {
      active = false;
      cursor.classList.remove('is-active');
    });
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest('[data-cursor-label]');
      if (el) {
        if (cursorLabel) cursorLabel.textContent = el.dataset.cursorLabel;
        cursor.classList.add('is-over');
      }
    });
    document.addEventListener('mouseout', (e) => {
      const el = e.target.closest('[data-cursor-label]');
      if (el && !e.relatedTarget?.closest('[data-cursor-label]')) {
        cursor.classList.remove('is-over');
      }
    });
    const loop = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ============================================================
     MAGNETIC BUTTONS — translate toward pointer within radius
     ============================================================ */
  if (!reduceMotion && isFinePointer) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 0.28;
      const radius = 120;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const cxEl = r.left + r.width / 2;
        const cyEl = r.top + r.height / 2;
        const dx = e.clientX - cxEl;
        const dy = e.clientY - cyEl;
        const dist = Math.hypot(dx, dy);
        if (dist > radius * 2.5) return;
        const damp = Math.min(1, radius / (dist + 1));
        el.style.transform = `translate3d(${dx * strength * damp}px, ${dy * strength * damp}px, 0)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ============================================================
     LIVE HUD TIMECODE
     ============================================================ */
  const hudTime = document.querySelector('.hero__hud-line');
  if (hudTime && /REC/.test(hudTime.textContent)) {
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const d = new Date();
      hudTime.textContent = `REC // ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ============================================================
     ENLIST FORM (demo)
     ============================================================ */
  const enlist = document.querySelector('.enlist__form');
  if (enlist) {
    enlist.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = enlist.querySelector('input');
      const btnLabel = enlist.querySelector('button span');
      if (!input.value || !/.+@.+\..+/.test(input.value)) {
        input.focus();
        input.style.borderColor = '#FF2A2A';
        setTimeout(() => (input.style.borderColor = ''), 1600);
        return;
      }
      if (btnLabel) btnLabel.textContent = 'Signed in';
      input.value = '';
      input.disabled = true;
      setTimeout(() => {
        if (btnLabel) btnLabel.textContent = 'Sign in';
        input.disabled = false;
      }, 3000);
    });
  }
})();
