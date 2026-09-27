// ================= Data Meld — site script =================

// ---- More projects: add your sites here ----
// { kind, title, desc, url }  — url is optional (card links out when present)
// The "More projects" block stays hidden until this list has at least one entry.
const moreProjects = [
  // { kind: 'Website', title: 'Client name', desc: 'One line about it.', url: 'https://example.com' },
];

const WHATSAPP = { uk: '447510294896', pk: '923101539434' };
const EMAIL = 'datameldltd@gmail.com';

// ---- render more projects ----
const moreGrid = document.getElementById('moreGrid');
const arrow = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

moreProjects.forEach((p) => {
  const el = document.createElement(p.url ? 'a' : 'div');
  el.className = 'proj reveal';
  if (p.url) { el.href = p.url; el.target = '_blank'; el.rel = 'noopener'; }
  el.innerHTML = `
    <div class="proj-top"><span class="proj-kind">${esc(p.kind)}</span>${p.url ? `<span class="proj-arrow">${arrow}</span>` : ''}</div>
    <h4>${esc(p.title)}</h4>
    <p>${esc(p.desc)}</p>`;
  moreGrid.appendChild(el);
});
const next = document.createElement('a');
next.href = '#contact';
next.className = 'proj soon reveal';
next.innerHTML = `<div class="proj-top"><span class="proj-kind">Your project</span><span class="proj-arrow">${arrow}</span></div>
  <h4>Could be yours next.</h4><p>Tell us what you're building — we'll plan it with you.</p>`;
moreGrid.appendChild(next);
if (moreProjects.length === 0) { moreGrid.hidden = true; document.querySelector('.more-head').hidden = true; }

// ---- work galleries ----
document.querySelectorAll('.work-visual').forEach((vis) => {
  const media = vis.querySelector('.work-media');
  const main = media.querySelector('img.main');
  const video = media.querySelector('video');
  vis.querySelectorAll('.thumb').forEach((t, i) => t.addEventListener('click', () => {
    if (t.classList.contains('on')) return;
    vis.querySelectorAll('.thumb').forEach((x) => x.classList.toggle('on', x === t));
    // the hover video belongs to the first shot only
    if (video) { video.pause(); media.classList.remove('playing'); media.classList.toggle('no-video', i !== 0); }
    main.classList.add('fading');
    setTimeout(() => {
      main.src = t.dataset.src; main.alt = t.dataset.alt;
      main.style.objectFit = t.classList.contains('contain') ? 'contain' : '';
      main.style.objectPosition = t.classList.contains('contain') ? 'center' : '';
      main.classList.remove('fading');
    }, 200);
  }));
});

// ---- lightbox ----
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
const lbCap = lb.querySelector('.lb-cap');
let lbReturn = null;
const closeLb = () => { lb.classList.remove('open'); setTimeout(() => { lb.hidden = true; }, 250); document.body.style.overflow = ''; lbReturn?.focus(); };
document.querySelectorAll('.work-media').forEach((m) => m.addEventListener('click', () => {
  const img = m.querySelector('img.main');
  lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = img.alt;
  lbReturn = m; lb.hidden = false; document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => lb.classList.add('open'));
  lb.querySelector('.lb-close').focus();
}));
lb.addEventListener('click', (e) => { if (e.target !== lbImg) closeLb(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

// ---- ribbons: repeat the items so the loop is seamless at any width ----
document.querySelectorAll('[data-marquee]').forEach((track) => {
  const set = track.innerHTML;
  track.innerHTML = set.repeat(3);
  while (track.scrollWidth < window.innerWidth * 1.2) track.innerHTML += set.repeat(3);
  track.innerHTML += track.innerHTML; // two identical halves → translateX(-50%) loops cleanly
  [...track.children].slice(track.children.length / 2).forEach((el) => el.setAttribute('aria-hidden', 'true'));
});

// ---- load-in ----
requestAnimationFrame(() => document.body.classList.add('loaded'));
setTimeout(() => document.body.classList.add('loaded'), 300); // fallback if rAF is throttled
document.getElementById('year').textContent = new Date().getFullYear();

// ---- nav ----
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
document.querySelectorAll('#navLinks a').forEach((a) => a.addEventListener('click', () => {
  nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
}));

// ---- reveal on scroll ----
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const siblings = [...e.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
    e.target.style.transitionDelay = `${Math.min(siblings.indexOf(e.target), 5) * 70}ms`;
    e.target.classList.add('in');
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .step, .mini-chart').forEach((el) => io.observe(el));
// ?snapshot shows everything at once (used for full-page screenshots)
if (location.search.includes('snapshot')) document.querySelectorAll('.reveal, .step, .mini-chart').forEach((el) => el.classList.add('in'));

// ---- counters ----
document.querySelectorAll('[data-count]').forEach((el) => {
  const target = +el.dataset.count; let n = 0;
  const tick = () => { n++; el.textContent = n; if (n < target) setTimeout(tick, 120); };
  setTimeout(tick, 700);
});

// ---- pointer effects (desktop only) ----
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (fine && !calm) {
  const glow = document.querySelector('.cursor-glow');
  window.addEventListener('pointermove', (e) => {
    glow.style.setProperty('--mx', e.clientX + 'px');
    glow.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });

  // spotlight on cards
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.spot');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--x', `${e.clientX - r.left}px`);
    card.style.setProperty('--y', `${e.clientY - r.top}px`);
  }, { passive: true });

  // hero mark tilt
  const mark = document.getElementById('markWrap');
  document.querySelector('.hero').addEventListener('pointermove', (e) => {
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    mark.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
  });

  // magnetic buttons
  document.querySelectorAll('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  // work media: tilt + hover-to-play
  document.querySelectorAll('.work-media').forEach((m) => {
    const v = m.querySelector('video');
    m.addEventListener('pointermove', (e) => {
      const r = m.getBoundingClientRect();
      m.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`);
      m.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 6}deg`);
    });
    m.addEventListener('pointerenter', () => {
      if (v && !m.classList.contains('no-video')) { v.play().then(() => m.classList.add('playing')).catch(() => {}); }
    });
    m.addEventListener('pointerleave', () => {
      m.style.setProperty('--ry', '0deg'); m.style.setProperty('--rx', '0deg');
      if (v) { v.pause(); m.classList.remove('playing'); }
    });
  });
}

// ---- floating WhatsApp ----
const waFloat = document.getElementById('waFloat');
const waBtn = document.getElementById('waBtn');
waBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = waFloat.classList.toggle('open');
  waBtn.setAttribute('aria-expanded', open);
});
document.addEventListener('click', (e) => {
  if (!waFloat.contains(e.target)) { waFloat.classList.remove('open'); waBtn.setAttribute('aria-expanded', 'false'); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { waFloat.classList.remove('open'); waBtn.setAttribute('aria-expanded', 'false'); }
});

// ---- contact form → WhatsApp / email ----
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
document.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => c.classList.toggle('on')));

let sendTo = 'uk';
form.querySelectorAll('[data-to]').forEach((b) => b.addEventListener('click', () => { sendTo = b.dataset.to; }));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.elements.name.value.trim();
  const nameField = form.elements.name.closest('.field');
  if (!name) {
    nameField.classList.add('error');
    note.textContent = 'Please add your name so we know who to reply to.';
    note.classList.add('err');
    form.elements.name.focus();
    return;
  }
  nameField.classList.remove('error'); note.classList.remove('err');

  const needs = [...document.querySelectorAll('.chip.on')].map((c) => c.textContent).join(', ');
  const lines = [
    `Hi Data Meld, I'm ${name}${form.elements.business.value.trim() ? ` from ${form.elements.business.value.trim()}` : ''}.`,
    needs && `I'm interested in: ${needs}.`,
    form.elements.message.value.trim(),
  ].filter(Boolean).join('\n\n');

  const url = sendTo === 'email'
    ? `mailto:${EMAIL}?subject=${encodeURIComponent('New project enquiry — ' + name)}&body=${encodeURIComponent(lines)}`
    : `https://wa.me/${WHATSAPP[sendTo]}?text=${encodeURIComponent(lines)}`;
  window.open(url, sendTo === 'email' ? '_self' : '_blank', 'noopener');
  note.textContent = 'Opening… just hit send.';
});
