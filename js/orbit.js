/* The five steps orbiting the Data Meld mark. Sticky while the steps scroll; the active step swings to the front. */
(function () {
  const NAMES = ['Discover', 'Brand', 'Build', 'Sell', 'Run'];
  const TAU = Math.PI * 2, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function init(canvas, logoSrc) {
    const ctx = canvas.getContext('2d');
    const mobile = matchMedia('(max-width: 860px)').matches;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const logo = new Image(); let logoReady = false;
    logo.onload = () => { logoReady = true; }; logo.src = logoSrc;

    const RINGS = [{ r: 0.62, n: 320, sp: 0.16 }, { r: 0.96, n: 480, sp: -0.09 }, { r: 1.30, n: 600, sp: 0.05 }];
    const k = mobile ? 0.45 : 1;
    const parts = [];
    RINGS.forEach((ring, ri) => {
      for (let i = 0; i < ring.n * k; i++) parts.push({ ri, a: Math.random() * TAU, j: (Math.random() - 0.5) * 0.09, s: 0.9 + Math.random() * 1.5, o: 0.5 + Math.random() * 0.5, ph: Math.random() * TAU });
    });
    const nodeAng = NAMES.map((_, i) => (i / NAMES.length) * TAU - Math.PI / 2);
    const nodeK = NAMES.map(() => 0);

    let w = 0, h = 0, cx = 0, cy = 0, R = 100, dpr = 1;
    let active = 0, rot = 0, rotT = 0, appear = 0, visible = false, raf = 0, last = 0, t = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h * 0.5; R = Math.min(w * (mobile ? 0.3 : 0.34), h * 0.42);
    }

    function setTarget(i) { rotT = Math.PI / 2 - nodeAng[i]; }
    setTarget(0); rot = rotT;

    function draw(dt) {
      t += dt;
      mouse.x = lerp(mouse.x, mouse.tx, 0.05); mouse.y = lerp(mouse.y, mouse.ty, 0.05);
      let diff = ((rotT - rot + Math.PI) % TAU + TAU) % TAU - Math.PI;
      rot += diff * Math.min(1, dt * 3.2);
      appear = Math.min(1, appear + dt * 0.7);
      const tilt = 0.4 + mouse.y * 0.05, yaw = mouse.x * 0.22;
      ctx.clearRect(0, 0, w, h);

      // core glow
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
      g.addColorStop(0, 'rgba(77,225,255,.20)'); g.addColorStop(0.5, 'rgba(124,92,255,.07)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // faint ring guides
      ctx.lineWidth = 1;
      RINGS.forEach(ring => {
        ctx.strokeStyle = 'rgba(120,220,255,' + (0.10 * appear) + ')';
        ctx.beginPath(); ctx.ellipse(cx, cy, ring.r * R, ring.r * R * tilt, 0, 0, TAU); ctx.stroke();
      });

      const pass = front => {
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i], ring = RINGS[p.ri];
          const a = p.a + rot * (p.ri === 1 ? 1 : 0.35) + t * ring.sp + yaw;
          const rr = ring.r * R * (1 + p.j + Math.sin(t * 0.8 + p.ph) * 0.004);
          const z = Math.sin(a);
          if ((z >= 0) !== front) continue;
          const x = Math.cos(a) * rr, d = (z + 1) / 2;
          const px = cx + x, py = cy + z * rr * tilt;
          const f = clamp((x / (ring.r * R) + 1) / 2, 0, 1);
          const rC = f < 0.5 ? 255 + (233 - 255) * f * 2 : 233 + (77 - 233) * (f - 0.5) * 2;
          const gC = f < 0.5 ? 179 + (251 - 179) * f * 2 : 251 + (225 - 251) * (f - 0.5) * 2;
          const bC = f < 0.5 ? 71 + (255 - 71) * f * 2 : 255;
          const al = (0.2 + 0.8 * d) * p.o * appear, sz = p.s * (0.6 + 0.7 * d);
          ctx.fillStyle = 'rgba(' + (rC | 0) + ',' + (gC | 0) + ',' + (bC | 0) + ',' + al + ')';
          ctx.fillRect(px, py, sz, sz);
        }
      };

      const nodes = () => {
        const out = [];
        NAMES.forEach((name, i) => {
          const a = nodeAng[i] + rot + t * RINGS[1].sp * 0 + yaw, rr = RINGS[1].r * R;
          const z = Math.sin(a), x = Math.cos(a) * rr;
          out.push({ i, name, px: cx + x, py: cy + z * rr * tilt, d: (z + 1) / 2 });
          nodeK[i] = lerp(nodeK[i], i === active ? 1 : 0, 0.09);
        });
        return out.sort((a, b) => a.d - b.d);
      };

      const drawNode = n => {
        const kk = nodeK[n.i], base = 0.55 + 0.45 * n.d;
        const r = (5 + kk * 7) * (0.7 + 0.5 * n.d);
        ctx.globalCompositeOperation = 'lighter';
        const gl = ctx.createRadialGradient(n.px, n.py, 0, n.px, n.py, r * (3.5 + kk * 3));
        gl.addColorStop(0, 'rgba(77,225,255,' + (0.5 + kk * 0.4) * base * appear + ')'); gl.addColorStop(1, 'rgba(77,225,255,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(n.px, n.py, r * (3.5 + kk * 3), 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(233,251,255,' + base * appear + ')'; ctx.beginPath(); ctx.arc(n.px, n.py, r, 0, TAU); ctx.fill();
        if (kk > 0.02) { // pulse ring on the active node
          const pr = r + 6 + ((t * 18) % 22);
          ctx.strokeStyle = 'rgba(77,225,255,' + (0.5 * kk * (1 - ((t * 18) % 22) / 22)) + ')'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(n.px, n.py, pr, 0, TAU); ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        const fs = Math.round((12 + kk * 5) * (0.85 + 0.25 * n.d));
        ctx.font = '600 ' + fs + 'px "Space Grotesk",system-ui,sans-serif'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(233,251,255,' + (0.35 + 0.65 * kk) * base * appear + ')';
        const label = (n.i + 1 < 10 ? '0' : '') + (n.i + 1) + '  ' + n.name;
        const tx = n.px + r + 12; ctx.textAlign = tx + 120 > w ? 'right' : 'left';
        ctx.fillText(label, ctx.textAlign === 'left' ? tx : n.px - r - 12, n.py);
      };

      const list = nodes();
      pass(false);
      list.filter(n => n.d < 0.5).forEach(drawNode);

      // centre mark
      if (logoReady) {
        const lw = R * 0.62, lh = lw * (logo.naturalHeight / logo.naturalWidth), s = 1 + Math.sin(t * 1.3) * 0.015;
        ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = 'rgba(77,225,255,.8)'; ctx.shadowBlur = 24;
        ctx.globalAlpha = 0.95 * appear; ctx.drawImage(logo, cx - lw * s / 2, cy - lh * s / 2, lw * s, lh * s);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      }

      // spoke from the core to the active node
      const an = list.find(n => n.i === active);
      if (an) {
        const sp = ctx.createLinearGradient(cx, cy, an.px, an.py);
        sp.addColorStop(0, 'rgba(255,179,71,.5)'); sp.addColorStop(1, 'rgba(77,225,255,.7)');
        ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = sp; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(an.px, an.py); ctx.stroke();
      }

      ctx.globalCompositeOperation = 'lighter';
      pass(true);
      list.filter(n => n.d >= 0.5).forEach(drawNode);
      ctx.globalCompositeOperation = 'source-over';
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      draw(reduce ? 0 : dt);
    }

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && reduce) draw(0.016); }).observe(canvas);
    addEventListener('resize', () => { layout(); });
    canvas.parentElement.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; });
    canvas.parentElement.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = 0; });
    layout(); raf = requestAnimationFrame(loop);

    return { setActive(i) { active = i; setTarget(i); if (reduce) draw(0.016); } };
  }

  window.OrbitFX = { init };
})();
