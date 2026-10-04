/* The Data Meld mark assembled from particles: gold streams from the left, cyan from the right, melding in the middle. */
(function () {
  const GOLD = [255, 179, 71], CYAN = [77, 225, 255], ICE = [233, 251, 255];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function init(canvas, src) {
    const ctx = canvas.getContext('2d');
    const mobile = matchMedia('(max-width: 860px)').matches;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MAX = mobile ? 1700 : 4200, STEP = mobile ? 5 : 3;
    const logo = new Image();
    let pts = [], w = 0, h = 0, dpr = 1, cx = 0, cy = 0, scale = 1;
    let t0 = 0, running = false, visible = true, progress = 0, raf = 0, ready = false;
    const mouse = { x: -999, y: -999 };
    let samples = []; // target points in logo space

    function sample() {
      const c = document.createElement('canvas');
      c.width = logo.naturalWidth; c.height = logo.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(logo, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      samples = [];
      for (let y = 0; y < c.height; y += STEP) for (let x = 0; x < c.width; x += STEP) {
        if (d[(y * c.width + x) * 4 + 3] > 140) samples.push([x - c.width / 2, y - c.height / 2]);
      }
      for (let i = samples.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [samples[i], samples[j]] = [samples[j], samples[i]]; }
      samples = samples.slice(0, MAX);
    }

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // fit the mark into the free space between the nav and the headline block
      const copy = canvas.parentElement.querySelector('.hero-copy');
      const top = 76, bottom = copy ? copy.offsetTop - 44 : h * 0.7;
      const free = Math.max(120, bottom - top);
      cx = w / 2; cy = top + free / 2;
      scale = Math.min((w * (mobile ? 0.62 : 0.5)) / logo.naturalWidth, (free * 0.96) / logo.naturalHeight);
      build();
    }

    function build() {
      const ox = cx, oy = cy;
      pts = samples.map(([sx, sy], i) => {
        const tx = ox + sx * scale, ty = oy + sy * scale;
        const side = sx < 0 ? -1 : 1;
        const f = clamp((sx / (logo.naturalWidth / 2) + 1) / 2, 0, 1); // 0 left .. 1 right
        const col = f < 0.5 ? mix(GOLD, ICE, f * 2) : mix(ICE, CYAN, (f - 0.5) * 2);
        return {
          x: side < 0 ? -40 - Math.random() * 120 : w + 40 + Math.random() * 120,
          y: cy + (Math.random() - 0.5) * h * 0.7,
          vx: 0, vy: 0, tx, ty, col,
          s: (mobile ? 1.5 : 1.7) * (0.7 + Math.random() * 0.7),
          delay: Math.random() * 1.5 + Math.abs(sx) / logo.naturalWidth * 0.8,
          ph: Math.random() * 6.28, a: 0.55 + Math.random() * 0.45
        };
      });
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const out = progress, fade = 1 - clamp(out * 1.25, 0, 1);
      if (fade <= 0) return;
      const R = 120, R2 = R * R;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (t < p.delay) continue;
        const wob = Math.sin(t * 1.4 + p.ph) * 1.1;
        let tx = p.tx + wob, ty = p.ty + Math.cos(t * 1.2 + p.ph) * 1.1;
        if (out > 0) { // scroll disperses the mark outward
          tx = cx + (tx - cx) * (1 + out * 2.4) + Math.sin(p.ph) * out * 90;
          ty = cy + (ty - cy) * (1 + out * 2.4) + Math.cos(p.ph) * out * 90;
        }
        let ax = (tx - p.x) * 0.045, ay = (ty - p.y) * 0.045;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 1) { const f = (1 - d2 / R2) * 5.5, d = Math.sqrt(d2); ax += dx / d * f; ay += dy / d * f; }
        p.vx = (p.vx + ax) * 0.84; p.vy = (p.vy + ay) * 0.84;
        p.x += p.vx; p.y += p.vy;
        const c = p.col, al = p.a * fade;
        ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${al})`;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      // crisp mark fades in once the particles have settled
      const la = clamp((t - 2.6) / 1.6, 0, 1) * 0.5 * fade;
      if (la > 0.01) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = la;
        ctx.drawImage(logo, cx - logo.naturalWidth * scale / 2, cy - logo.naturalHeight * scale / 2, logo.naturalWidth * scale, logo.naturalHeight * scale);
        ctx.globalAlpha = 1;
      }
    }

    function staticDraw() { // reduced motion: just the mark
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(logo, cx - logo.naturalWidth * scale / 2, cy - logo.naturalHeight * scale / 2, logo.naturalWidth * scale, logo.naturalHeight * scale);
    }

    logo.onload = () => { sample(); layout(); ready = true; };
    logo.src = src;

    addEventListener('resize', () => { if (ready) { layout(); if (reduce) staticDraw(); } });
    canvas.parentElement.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

    return {
      start() {
        const go = () => {
          if (!ready) return setTimeout(go, 50);
          if (reduce) return staticDraw();
          t0 = performance.now(); running = true; raf = requestAnimationFrame(frame);
        };
        go();
      },
      setProgress(v) { progress = v; },
      isReady: () => ready
    };
  }

  window.LogoFX = { init };
})();
