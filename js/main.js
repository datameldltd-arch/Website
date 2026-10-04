(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mobile = matchMedia('(max-width: 860px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- helpers ---------- */
  function splitWords(el) {
    const out = [];
    el.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(tok => {
          if (!tok.trim()) { if (tok) out.push(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.textContent = tok; w.appendChild(i); out.push(w);
        });
      } else out.push(n.cloneNode(true));
    });
    el.textContent = ''; out.forEach(n => el.appendChild(n));
    return $$('.w > span', el);
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target, o) => lenis ? lenis.scrollTo(target, o) : window.scrollTo({ top: typeof target === 'number' ? target : $(target).offsetTop, behavior: 'smooth' });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2 || !$(id)) return;
    e.preventDefault(); closeMenu(); scrollTo(id, { duration: 1.6 });
  }));

  /* ---------- hero logo particles ---------- */
  const fx = LogoFX.init($('#logoFx'), 'assets/logo-mark.png');
  splitWords($('.hero h1'));

  /* ---------- loader: dismisses itself ---------- */
  const heroImg = $('.hero-bg img');
  let loaded = false, pct = 0, entered = false;
  const pctEl = $('#loadPct'), t0 = performance.now();
  const markLoaded = () => { loaded = true; };
  (heroImg.complete ? Promise.resolve() : new Promise(r => { heroImg.onload = r; heroImg.onerror = r; })).then(() => {
    const wait = () => (fx.isReady() ? markLoaded() : setTimeout(wait, 60)); wait();
  });
  setTimeout(markLoaded, 6000); // never trap anyone on the loader
  const tick = setInterval(() => {
    pct = Math.min(loaded ? 100 : 92, pct + (loaded ? 7 : 1.8));
    pctEl.textContent = Math.round(pct);
    if (pct >= 100 && performance.now() - t0 > 1300 && !entered) { entered = true; clearInterval(tick); enter(); }
  }, 40);

  function enter() {
    $('#gate').classList.add('done');
    document.body.classList.remove('is-loading');
    const words = $$('.hero h1 .w > span');
    const tl = gsap.timeline({ delay: 0.25 });
    tl.from('.nav', { yPercent: -100, opacity: 0, duration: 1, ease: 'power3.out' })
      .fromTo(words, { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.2, ease: 'power4.out', stagger: 0.09 }, 0.4)
      .from('.hero .eyebrow, .hero .lede, .hero-actions', { y: 24, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out' }, 0.8)
      .from('.scroll-cue', { opacity: 0, duration: 1 }, 1.5);
    gsap.fromTo('.hero-bg img', { scale: 1.3 }, { scale: 1.08, duration: 3, ease: 'power3.out' });
    fx.start();
    ScrollTrigger.refresh();
  }

  /* ---------- nav + scroll progress line ---------- */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks');
  function closeMenu() { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.onclick = () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o); };
  const bar = document.createElement('div'); bar.className = 'progress'; nav.appendChild(bar);
  ScrollTrigger.create({
    start: 0, end: 'max', onUpdate: s => {
      nav.classList.toggle('solid', s.scroll() > 80);
      nav.classList.toggle('hide', s.direction === 1 && s.scroll() > 600);
      if (s.direction === -1) nav.classList.remove('hide');
      bar.style.transform = 'scaleX(' + s.progress + ')';
    }
  });

  /* ---------- hero scroll-out ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: s => fx.setProgress(s.progress) } })
    .to('.hero-bg img', { scale: 1.28, yPercent: 8, ease: 'none' }, 0)
    .to('.hero-copy', { yPercent: -18, opacity: 0, ease: 'none' }, 0)
    .to('.scroll-cue', { opacity: 0 }, 0);

  /* ---------- section headings + generic reveals ---------- */
  $$('.sec-head .split, .cta .split').forEach(el => {
    const words = splitWords(el);
    gsap.fromTo(words, { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.1, ease: 'power4.out', stagger: 0.07, scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
  });
  $$('.sec-head .eyebrow, .cta .eyebrow').forEach(el => gsap.from(el, { x: -20, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
  $$('.rv').forEach(el => gsap.from(el, { y: 32, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));

  /* ---------- process: sticky orbit follows the steps ---------- */
  const orbit = OrbitFX.init($('#orbitFx'), 'assets/logo-mark.png');
  const steps = $$('.proc-step');
  const activate = i => { steps.forEach((s, k) => s.classList.toggle('on', k === i)); orbit.setActive(i); };
  activate(0);
  steps.forEach((step, i) => ScrollTrigger.create({
    trigger: step, start: 'top 60%', end: 'bottom 60%',
    onToggle: s => { if (s.isActive) activate(i); }
  }));

  /* ---------- work: reveal, parallax, hover tilt ---------- */
  $$('.proj').forEach(proj => {
    const media = $('.proj-media', proj), inner = $('img, video', media), info = $$('.proj-info > *', proj);
    gsap.fromTo(media, { clipPath: 'inset(14% 10% 14% 10% round 22px)', opacity: 0, y: 70 },
      { clipPath: 'inset(0% 0% 0% 0% round 22px)', opacity: 1, y: 0, duration: 1.4, ease: 'power4.out', scrollTrigger: { trigger: proj, start: 'top 80%', once: true } });
    gsap.from(info, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: proj, start: 'top 72%', once: true } });
    if (!reduce) gsap.fromTo(inner, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: proj, start: 'top bottom', end: 'bottom top', scrub: true } });
    if (inner.tagName === 'VIDEO') ScrollTrigger.create({ trigger: media, start: 'top 85%', end: 'bottom 15%', onToggle: s => { if (s.isActive) inner.play().catch(() => {}); else inner.pause(); } });
    if (matchMedia('(hover:hover)').matches && !reduce) {
      gsap.set(media, { transformPerspective: 1100 });
      const rx = gsap.quickTo(media, 'rotateX', { duration: 0.6, ease: 'power3' }), ry = gsap.quickTo(media, 'rotateY', { duration: 0.6, ease: 'power3' });
      media.addEventListener('pointermove', e => { const r = media.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 7); rx(-((e.clientY - r.top) / r.height - 0.5) * 7); });
      media.addEventListener('pointerleave', () => { rx(0); ry(0); });
    }
  });

  /* ---------- cursor glow + magnetic buttons ---------- */
  const cur = $('#cursor');
  if (matchMedia('(hover:hover)').matches) {
    const mx = gsap.quickTo(cur, 'x', { duration: 0.6, ease: 'power3' }), my = gsap.quickTo(cur, 'y', { duration: 0.6, ease: 'power3' });
    addEventListener('pointermove', e => { cur.classList.add('on'); mx(e.clientX); my(e.clientY); });
    $$('.magnetic').forEach(b => {
      const bx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), by = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); bx((e.clientX - r.left - r.width / 2) * 0.25); by((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener('pointerleave', () => { bx(0); by(0); });
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
