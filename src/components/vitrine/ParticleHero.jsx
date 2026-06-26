import React, { useRef, useEffect } from "react";

/**
 * Essaim de « drones » (boids / flocking). Chaque agent est AUTONOME : il suit
 * la meute via 3 règles (séparation, alignement, cohésion) + une dérive douce et
 * une réaction au curseur. Rendu premium : traînées lumineuses, connexions fines
 * et lueur émeraude. Mouvement organique type murmuration.
 */
export default function ParticleHero() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0;
    let agents = [];
    const mouse = { x: -9999, y: -9999 };

    let N = 0, PERC = 64, SEP = 26, MAXV = 2.4, MINV = 0.7, LINK = 78, LINKS_ON = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = W < 640 ? 110 : W < 1100 ? 220 : 320;
      LINKS_ON = W >= 640;
      if (agents.length === 0) {
        for (let i = 0; i < target; i++) {
          const a = Math.random() * Math.PI * 2, sp = MINV + Math.random();
          agents.push({ x: Math.random() * W, y: Math.random() * H, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 0.8 + Math.random() * 1.4 });
        }
      }
      N = agents.length;
    };

    const step = () => {
      // Traînées : on n'efface pas tout → effet de scie lumineuse.
      ctx.fillStyle = "rgba(10,14,26,0.22)";
      ctx.fillRect(0, 0, W, H);

      const cx0 = W * 0.5, cy0 = H * 0.44;
      for (let i = 0; i < N; i++) {
        const a = agents[i];
        let ax = 0, ay = 0, gx = 0, gy = 0, sx = 0, sy = 0, n = 0;
        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const b = agents[j];
          const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
          if (d2 < PERC * PERC) {
            n++;
            ax += b.vx; ay += b.vy;            // alignement
            gx += b.x; gy += b.y;              // cohésion
            if (d2 < SEP * SEP && d2 > 0) { const inv = 1 / Math.sqrt(d2); sx -= dx * inv; sy -= dy * inv; } // séparation
          }
        }
        if (n > 0) {
          a.vx += (ax / n - a.vx) * 0.045;
          a.vy += (ay / n - a.vy) * 0.045;
          a.vx += (gx / n - a.x) * 0.0009;
          a.vy += (gy / n - a.y) * 0.0009;
          a.vx += sx * 0.05; a.vy += sy * 0.05;
        }
        // Dérive douce vers le centre + léger tourbillon (garde la meute à l'écran, vivante).
        const tdx = cx0 - a.x, tdy = cy0 - a.y;
        a.vx += tdx * 0.0006 - tdy * 0.00035;
        a.vy += tdy * 0.0006 + tdx * 0.00035;
        // Répulsion souris (interactif).
        const mdx = a.x - mouse.x, mdy = a.y - mouse.y, md2 = mdx * mdx + mdy * mdy;
        if (md2 < 130 * 130 && md2 > 0) { const d = Math.sqrt(md2), f = (1 - d / 130) * 1.8; a.vx += (mdx / d) * f; a.vy += (mdy / d) * f; }
        // Limite de vitesse.
        const sp = Math.hypot(a.vx, a.vy) || 1;
        if (sp > MAXV) { a.vx *= MAXV / sp; a.vy *= MAXV / sp; }
        else if (sp < MINV) { a.vx *= MINV / sp; a.vy *= MINV / sp; }
        a.x += a.vx; a.y += a.vy;
        // Bords : on enveloppe.
        if (a.x < -30) a.x = W + 30; else if (a.x > W + 30) a.x = -30;
        if (a.y < -30) a.y = H + 30; else if (a.y > H + 30) a.y = -30;
      }

      // Connexions (réseau) entre agents proches.
      if (LINKS_ON) {
        ctx.lineWidth = 0.6;
        for (let i = 0; i < N; i++) {
          const a = agents[i];
          for (let j = i + 1; j < N; j++) {
            const b = agents[j];
            const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
            if (d2 < LINK * LINK) {
              ctx.strokeStyle = `rgba(16,185,129,${(1 - Math.sqrt(d2) / LINK) * 0.16})`;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
      }

      // Agents (mode "lighter" → lueur naturelle aux recouvrements).
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const a = agents[i];
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(16,185,129,0.18)"; ctx.fill();           // halo
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(190,255,225,0.95)"; ctx.fill();          // cœur
      }
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(step);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      mouse.x = p.clientX - rect.left; mouse.y = p.clientY - rect.top;
    };
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
