(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.085 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2 || !$(id)) return;
      e.preventDefault(); lenis.scrollTo(id, { duration: 1.6 });
    }));
  }

  const burger = $('#burger'), links = $('#navLinks');
  burger.onclick = () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o); };
  links.addEventListener('click', e => { if (e.target.tagName === 'A') { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });

  const heroSel = $('.sv-hero') ? '.sv-hero' : $('.ct-hero') ? '.ct-hero' : null;
  if (heroSel) {
    gsap.from(heroSel + ' .bg', { scale: 1.25, duration: 3, ease: 'power3.out' });
    gsap.to(heroSel + ' .bg', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: heroSel, start: 'top top', end: 'bottom top', scrub: true } });
  }
  $$('.rv').forEach(el => gsap.from(el, { y: 44, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));

  // gentle 3D tilt on cards (pointer devices only)
  if (matchMedia('(hover:hover)').matches && !reduce) {
    $$('.sv-card, .pack').forEach(c => {
      const rx = gsap.quickTo(c, 'rotateX', { duration: 0.5, ease: 'power3' }), ry = gsap.quickTo(c, 'rotateY', { duration: 0.5, ease: 'power3' });
      gsap.set(c, { transformPerspective: 900 });
      c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 8); rx(-((e.clientY - r.top) / r.height - 0.5) * 8); });
      c.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }
})();
