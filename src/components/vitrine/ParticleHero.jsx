import React, { useRef, useEffect } from "react";

/**
 * Essaim de « drones » qui s'assemble UNE FOIS en TERRAIN DE FOOTBALL et y RESTE.
 * Les drones continuent de bouger en permanence (légère oscillation autonome
 * autour de leur position) → le terrain est stable mais vivant. Lignes reliées
 * (connexions) + lueur émeraude + réaction au curseur (l'essaim ondule puis
 * revient se poser).
 */
export default function ParticleHero() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0, t0 = performance.now();
    let agents = [], targets = [];
    const mouse = { x: -9999, y: -9999 };
    const PERC = 60, SEP = 24, MAXV = 3.2, MINV = 0.7, LINK = 58;
    let LINKS_ON = true;

    // Points cibles : lignes d'un terrain (coords 105×68).
    const buildTargets = () => {
      const pts = [];
      const push = (x, y) => pts.push([x, y]);
      const seg = (x1, y1, x2, y2, gap) => { const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), n = Math.max(1, Math.round(len / gap)); for (let i = 0; i <= n; i++) push(x1 + dx * i / n, y1 + dy * i / n); };
      const arc = (cx, cy, r, a0, a1, gap) => { const len = Math.abs(a1 - a0) * r, n = Math.max(2, Math.round(len / gap)); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } };
      const PW = 105, PH = 68, gap = 2.6;
      seg(0, 0, PW, 0, gap); seg(PW, 0, PW, PH, gap); seg(PW, PH, 0, PH, gap); seg(0, PH, 0, 0, gap);
      seg(PW / 2, 0, PW / 2, PH, gap);
      arc(PW / 2, PH / 2, 9.15, 0, Math.PI * 2, gap); push(PW / 2, PH / 2);
      const pY = PH / 2 - 20.16, pH = 40.32;
      seg(0, pY, 16.5, pY, gap); seg(16.5, pY, 16.5, pY + pH, gap); seg(16.5, pY + pH, 0, pY + pH, gap);
      seg(PW, pY, PW - 16.5, pY, gap); seg(PW - 16.5, pY, PW - 16.5, pY + pH, gap); seg(PW - 16.5, pY + pH, PW, pY + pH, gap);
      const gY = PH / 2 - 9.16, gH = 18.32;
      seg(0, gY, 5.5, gY, gap); seg(5.5, gY, 5.5, gY + gH, gap); seg(5.5, gY + gH, 0, gY + gH, gap);
      seg(PW, gY, PW - 5.5, gY, gap); seg(PW - 5.5, gY, PW - 5.5, gY + gH, gap); seg(PW - 5.5, gY + gH, PW, gY + gH, gap);
      push(11, PH / 2); push(PW - 11, PH / 2);
      const boxW = Math.min(W * 0.76, H * 1.5), s = boxW / PW;
      const ox = W / 2 - PW * s / 2, oy = H * 0.44 - PH * s / 2;
      return pts.map(([x, y]) => ({ x: ox + x * s, y: oy + y * s }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      LINKS_ON = W >= 640;
      targets = buildTargets();
      const want = W < 640 ? Math.min(220, targets.length) : targets.length;
      while (agents.length < want) {
        const a = Math.random() * Math.PI * 2, sp = MINV + Math.random();
        agents.push({
          x: Math.random() * W, y: Math.random() * H, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          r: 0.8 + Math.random() * 1.1,
          phx: Math.random() * 6.28, phy: Math.random() * 6.28,
          fx: 0.5 + Math.random() * 0.9, fy: 0.5 + Math.random() * 0.9,
          amp: 2.2 + Math.random() * 3.2,
        });
      }
      agents.length = want;
      for (let i = 0; i < agents.length; i++) agents[i].ti = i % targets.length;
    };

    const smooth = (x) => x * x * (3 - 2 * x);

    const step = (now) => {
      // Assemblage en ~2,6 s, puis on RESTE (form = 1). flock ne sert qu'au début.
      const form = smooth(Math.min(1, (now - t0) / 2600));
      const flock = 1 - form;
      const ts = now * 0.001;

      ctx.fillStyle = "rgba(10,14,26,0.30)";
      ctx.fillRect(0, 0, W, H);

      const N = agents.length, cx0 = W * 0.5, cy0 = H * 0.44;
      for (let i = 0; i < N; i++) {
        const a = agents[i];
        // Flocking (seulement pendant l'assemblage initial).
        if (flock > 0.02) {
          let ax = 0, ay = 0, gx = 0, gy = 0, sx = 0, sy = 0, n = 0;
          for (let j = 0; j < N; j++) {
            if (i === j) continue;
            const b = agents[j]; const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
            if (d2 < PERC * PERC) { n++; ax += b.vx; ay += b.vy; gx += b.x; gy += b.y; if (d2 < SEP * SEP && d2 > 0) { const inv = 1 / Math.sqrt(d2); sx -= dx * inv; sy -= dy * inv; } }
          }
          if (n > 0) {
            a.vx += (ax / n - a.vx) * 0.045 * flock; a.vy += (ay / n - a.vy) * 0.045 * flock;
            a.vx += (gx / n - a.x) * 0.0009 * flock; a.vy += (gy / n - a.y) * 0.0009 * flock;
            a.vx += sx * 0.05 * flock; a.vy += sy * 0.05 * flock;
          }
          const tdx = cx0 - a.x, tdy = cy0 - a.y;
          a.vx += (tdx * 0.0006 - tdy * 0.00035) * flock; a.vy += (tdy * 0.0006 + tdx * 0.00035) * flock;
        }
        // Cible vivante = point du terrain + oscillation autonome (drone qui flotte).
        const tg = targets[a.ti];
        const tx = tg.x + Math.sin(ts * a.fx + a.phx) * a.amp;
        const ty = tg.y + Math.cos(ts * a.fy + a.phy) * a.amp;
        const k = 0.10 * form;
        a.vx += (tx - a.x) * k; a.vy += (ty - a.y) * k;
        a.vx *= (1 - 0.12 * form); a.vy *= (1 - 0.12 * form);
        // Répulsion souris (l'essaim ondule puis revient).
        const mdx = a.x - mouse.x, mdy = a.y - mouse.y, md2 = mdx * mdx + mdy * mdy;
        if (md2 < 120 * 120 && md2 > 0) { const d = Math.sqrt(md2), f = (1 - d / 120) * 2.2; a.vx += (mdx / d) * f; a.vy += (mdy / d) * f; }
        const sp = Math.hypot(a.vx, a.vy) || 1;
        if (sp > MAXV) { a.vx *= MAXV / sp; a.vy *= MAXV / sp; }
        else if (sp < MINV && form < 0.5) { a.vx *= MINV / sp; a.vy *= MINV / sp; }
        a.x += a.vx; a.y += a.vy;
        if (a.x < -30) a.x = W + 30; else if (a.x > W + 30) a.x = -30;
        if (a.y < -30) a.y = H + 30; else if (a.y > H + 30) a.y = -30;
      }

      // Connexions (relient les drones proches → lignes du terrain qui brillent).
      if (LINKS_ON) {
        ctx.lineWidth = 0.7;
        for (let i = 0; i < N; i++) {
          const a = agents[i];
          for (let j = i + 1; j < N; j++) {
            const b = agents[j]; const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
            if (d2 < LINK * LINK) { ctx.strokeStyle = `rgba(16,185,129,${(1 - Math.sqrt(d2) / LINK) * 0.22})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          }
        }
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const a = agents[i];
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 1.5, 0, Math.PI * 2); ctx.fillStyle = "rgba(16,185,129,0.18)"; ctx.fill();
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fillStyle = "rgba(195,255,228,0.95)"; ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(step);
    };

    const onMove = (e) => { const rect = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; mouse.x = p.clientX - rect.left; mouse.y = p.clientY - rect.top; };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    resize();
    ctx.fillStyle = "#0a0e1a"; ctx.fillRect(0, 0, W, H);
    raf = requestAnimationFrame(step);
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}
