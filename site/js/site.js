/* Page animation: word reveals, scroll-linked depth, pointer tilt, screen carousel, story steps, palettes. */
'use strict';
(() => {
  // Momo follows the visitor's clock by default; on the website he stays playful at any hour.
  try { if (!localStorage.getItem('skylit.momo')) localStorage.setItem('skylit.momo', JSON.stringify({ hat: 'auto', motion: 'lively', routine: false })); } catch (_) {}
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // Split headings into masked words, preserving inline elements such as <em>.
  for (const el of $$('[data-split]')) {
    let n = 0;
    const walk = node => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const word = document.createElement('span'), inner = document.createElement('span');
            word.className = 'word'; inner.textContent = part; inner.style.setProperty('--w', n++);
            word.append(inner); frag.append(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      }
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    $$('.word', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
  }

  // Reveal on scroll.
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
  $$('[data-reveal],[data-split]').forEach(el => io.observe(el));
  // The hero headline animates immediately.
  requestAnimationFrame(() => $$('.hero [data-split],.hero [data-reveal]').forEach(el => el.classList.add('in')));

  // Floating light motes in the hero.
  const motes = $('.motes');
  if (motes && !reduce) for (let i = 0; i < 18; i++) {
    const m = document.createElement('span'); m.className = 'mote';
    m.style.left = Math.random() * 100 + '%'; m.style.top = 30 + Math.random() * 60 + '%';
    m.style.animationDelay = -Math.random() * 12 + 's'; m.style.animationDuration = 9 + Math.random() * 8 + 's';
    m.style.transform = `scale(${.5 + Math.random()})`;
    motes.append(m);
  }

  // Scroll-linked values: hero parallax, section progress, header state.
  const header = $('.site-header'), hero = $('.hero'), progress = $$('[data-progress]');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    header.classList.toggle('scrolled', y > 20);
    if (hero) hero.style.setProperty('--hero', clamp(y / vh).toFixed(4));
    if (reduce) { progress.forEach(el => el.style.setProperty('--p2', 1)); return; }
    for (const el of progress) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      el.style.setProperty('--p2', eased(clamp((vh - r.top) / (vh * .75))).toFixed(4));
    }
  }
  const eased = x => 1 - Math.pow(1 - x, 3);
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Pointer tilt for devices and cards.
  if (!reduce && matchMedia('(pointer: fine)').matches) for (const el of $$('[data-tilt]')) {
    const max = +el.dataset.tilt || 6, host = el.closest('.showcase') || el;
    host.addEventListener('pointermove', e => {
      const r = host.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--ry', (x * max * 2).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-y * max * 1.4).toFixed(2) + 'deg');
      el.style.setProperty('--glare', (50 + x * 100).toFixed(1) + '%');
    });
    host.addEventListener('pointerleave', () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); el.style.removeProperty('--glare'); });
  }

  // Hero: cycle through the app's real screens; tabs jump to one and restart the timer.
  const showcase = $('#showcase');
  if (showcase) {
    const shots = $$('.shot', showcase), tabs = $$('.showcase-tabs button', showcase), DWELL = 5200;
    let index = 0, timer = 0, inView = true;
    const show = i => {
      index = (i + shots.length) % shots.length;
      shots.forEach((s, k) => s.classList.toggle('on', k === index));
      tabs.forEach((t, k) => { t.setAttribute('aria-pressed', String(k === index)); t.style.setProperty('--dwell', DWELL + 'ms'); t.classList.remove('run'); });
      if (!reduce) { void tabs[index].offsetWidth; tabs[index].classList.add('run'); }
      clearTimeout(timer);
      if (!reduce && inView) timer = setTimeout(() => show(index + 1), DWELL);
    };
    tabs.forEach((t, k) => t.addEventListener('click', () => show(k)));
    new IntersectionObserver(([e]) => { const was = inView; inView = e.isIntersecting; if (inView !== was || !timer) show(index); }).observe(showcase);
    // Warm the other screens once the page is idle so cross-fades never flash.
    addEventListener('load', () => setTimeout(() => shots.forEach(s => { s.loading = 'eager'; }), 600));
  }

  // Story: the sticky device follows the step in view.
  const storyShots = $$('.story-visual .shot');
  const stepIO = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) {
      const i = +e.target.dataset.step;
      $$('.step').forEach(s => s.classList.toggle('on', s === e.target));
      storyShots.forEach(s => s.classList.toggle('on', +s.dataset.shot === i));
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  $$('.step').forEach(s => stepIO.observe(s));

  // Update policy pill steps through to "Install when idle" while visible.
  const policy = $('#policy');
  if (policy) {
    const pill = $('.policy-pill', policy), spans = $$('span:not(.policy-pill)', policy);
    let i = 0, timer = 0;
    const place = () => { const s = spans[i]; pill.style.left = s.offsetLeft + 'px'; pill.style.top = s.offsetTop + 'px'; pill.style.width = s.offsetWidth + 'px'; pill.style.height = s.offsetHeight + 'px'; spans.forEach(x => x.classList.toggle('on', x === s)); };
    place();
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting && !reduce) { i = 0; place(); timer = setInterval(() => { i = (i + 1) % spans.length; place(); if (i === spans.length - 1) clearInterval(timer); }, 900); }
    }, { threshold: .6 }).observe(policy);
    addEventListener('resize', place);
  }

  // Palettes: swap between real screenshots of the overview in each palette and mode.
  const picks = $('#palette-picks'), shot = $('#palette-shot'), A = window.SkylitAppearance;
  if (picks && shot && A) {
    const order = ['linen', 'sage', 'stone', 'ocean', 'plum', 'contrast'], state = { theme: 'linen', mode: 'light' };
    const apply = () => {
      const name = A.palettes[state.theme].name, src = `img/palette-${state.theme}-${state.mode}.webp`;
      $$('button', picks).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === state.theme)));
      $$('#palettes .seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
      const next = new Image(); next.src = src;
      next.decode().catch(() => {}).then(() => {
        shot.animate([{ opacity: .35, filter: 'blur(4px)' }, { opacity: 1, filter: 'none' }], { duration: reduce ? 1 : 520, easing: 'cubic-bezier(.16,1,.3,1)' });
        shot.src = src; shot.alt = `Skylit overview in the ${name} ${state.mode} palette`;
      });
    };
    for (const id of order) {
      const p = A.palettes[id], b = document.createElement('button');
      b.type = 'button'; b.dataset.theme = id; b.className = 'pick';
      b.innerHTML = `<i style="--a:${p.light[0]};--b:${p.light[6]};--c:${p.dark[0]};--d:${p.dark[6]}"></i>${p.name}`;
      b.addEventListener('click', () => { state.theme = id; apply(); });
      picks.append(b);
    }
    $$('#palettes .seg button').forEach(b => b.addEventListener('click', () => { state.mode = b.dataset.mode; apply(); }));
    $$('button', picks).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === state.theme)));
  }

  // FAQ: animate open and close.
  for (const d of $$('.faq details')) {
    const summary = $('summary', d), body = $('.a', d);
    summary.addEventListener('click', e => {
      if (reduce) return;
      e.preventDefault();
      if (d.open) {
        body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => { d.open = false; };
        summary.querySelector('i').style.transform = '';
      } else {
        d.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  }

})();
