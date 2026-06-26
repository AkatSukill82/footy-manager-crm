import React, { useRef, useEffect } from "react";

/**
 * Hero animé en particules (canvas). Des « billes » convergent depuis tous les
 * côtés et forment un FOOTBALLEUR (silhouette échantillonnée depuis un emoji).
 * Un BALLON (groupe de particules) arrive en arc, frappe la TÊTE, puis repart
 * (coup de tête), en boucle. Léger scintillement quand la forme est assemblée.
 */
export default function ParticleHero() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf = 0, W = 0, H = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    // ── Échantillonne les pixels opaques d'un emoji → points normalisés (0..1) ──
    const sample = (glyph, px, gap) => {
      const off = document.createElement("canvas");
      off.width = off.height = px;
      const o = off.getContext("2d");
      o.clearRect(0, 0, px, px);
      o.fillStyle = "#fff";
      o.font = `${Math.floor(px * 0.82)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      o.textAlign = "center"; o.textBaseline = "middle";
      o.fillText(glyph, px / 2, px / 2);
      const d = o.getImageData(0, 0, px, px).data;
      const pts = [];
      for (let y = 0; y < px; y += gap) for (let x = 0; x < px; x += gap) {
        if (d[(y * px + x) * 4 + 3] > 130) pts.push([x / px - 0.5, y / px - 0.5]);
      }
      return pts;
    };

    let figure = sample("🏃", 220, 4);
    if (figure.length < 60) figure = sample("⚽", 200, 4); // fallback si l'emoji ne rend pas
    const ballShape = (() => {
      const pts = []; const n = 70;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, r = 0.5 * Math.sqrt(Math.random()); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
      return pts;
    })();

    let figParticles = [], ballParticles = [], focal = { x: 0, y: 0, s: 0 }, headY = 0;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = Math.min(W, H) * 0.58;
      focal = { x: W * 0.5, y: H * 0.42, s };
      // figure
      figParticles = figure.map(([nx, ny]) => ({
        tx: focal.x + nx * s, ty: focal.y + ny * s,
        x: Math.random() * W, y: Math.random() * H,
        vx: 0, vy: 0, ph: Math.random() * Math.PI * 2,
      }));
      // tête = barycentre du 12 % supérieur des points figure
      const sorted = figure.map(([, ny]) => ny).sort((a, b) => a - b);
      const topThresh = sorted[Math.floor(sorted.length * 0.1)] ?? -0.4;
      const topPts = figure.filter(([, ny]) => ny <= topThresh);
      const hx = topPts.reduce((a, [nx]) => a + nx, 0) / (topPts.length || 1);
      const hy = topPts.reduce((a, [, ny]) => a + ny, 0) / (topPts.length || 1);
      headPos = { x: focal.x + hx * s, y: focal.y + hy * s };
      headY = headPos.y;
      // ballon
      const bs = s * 0.26;
      ballParticles = ballShape.map(([nx, ny]) => ({ ox: nx * bs, oy: ny * bs, x: 0, y: 0 }));
    };

    let headPos = { x: 0, y: 0 };
    let t0 = performance.now();
    // état du ballon : approche → header → sortie → reset (cycle)
    const CYCLE = 4200;

    const draw = (now) => {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);

      // ── Figure : ressort vers la cible + scintillement ──
      for (const p of figParticles) {
        const k = 0.06;
        p.vx += (p.tx - p.x) * k; p.vy += (p.ty - p.y) * k;
        p.vx *= 0.82; p.vy *= 0.82;
        p.x += p.vx; p.y += p.vy;
        p.ph += 0.05;
      }
      ctx.save();
      ctx.fillStyle = "rgba(16,185,129,0.85)";
      ctx.shadowBlur = 8; ctx.shadowColor = "rgba(16,185,129,0.6)";
      for (const p of figParticles) {
        const sx = p.x + Math.cos(p.ph) * 0.8, sy = p.y + Math.sin(p.ph) * 0.8;
        ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // ── Ballon : cycle approche/header/sortie ──
      const ct = (t % CYCLE) / CYCLE; // 0..1
      const start = { x: W + 60, y: focal.y - focal.s * 0.1 };
      const exit = { x: focal.x - focal.s * 0.9, y: focal.y - focal.s * 0.95 };
      let cx, cy, alpha = 1;
      if (ct < 0.45) {                       // approche en arc vers la tête
        const u = ct / 0.45, e = u * u * (3 - 2 * u);
        cx = start.x + (headPos.x - start.x) * e;
        cy = start.y + (headPos.y - start.y) * e - Math.sin(u * Math.PI) * focal.s * 0.18;
      } else if (ct < 0.52) {                // impact tête (petit rebond)
        cx = headPos.x; cy = headPos.y - Math.sin((ct - 0.45) / 0.07 * Math.PI) * 6;
      } else if (ct < 0.78) {                // header : repart vers le haut-gauche
        const u = (ct - 0.52) / 0.26, e = u * u;
        cx = headPos.x + (exit.x - headPos.x) * e;
        cy = headPos.y + (exit.y - headPos.y) * e;
        alpha = 1 - u * 0.7;
      } else { cx = start.x; cy = start.y; alpha = 0; }  // reset hors écran

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.shadowBlur = 12; ctx.shadowColor = "rgba(255,255,255,0.7)";
      for (const b of ballParticles) {
        ctx.beginPath(); ctx.arc(cx + b.ox, cy + b.oy, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    setup();
    raf = requestAnimationFrame(draw);
    const onResize = () => setup();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
