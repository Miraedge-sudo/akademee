import { useEffect, useRef } from "react";

// ── Color Palettes ──
const LIGHT = {
  bg: "#d7f6ad", wall: "#d7f6ad", wallEnd: "#c0eba0",
  desk: "#28715b", deskMid: "#1e5b49", deskDark: "#174638", deskTop: "#3c8d70",
  screen: "#1E293B", screenEnd: "#0F172A",
  body: "#4aa660", tie: "#315fce",
  skin: "#FDE68A", skinEnd: "#FCD34D",
  hair: "#3a241b", hairHighlight: "#5a3828",
  eye: "#0F172A", pupil: "rgba(255,255,255,0.85)", lip: "#92400E", frame: "#94A3B8",
  card: "#FFFFFF", cardShadow: "rgba(0,0,0,0.08)", cardText: "#1F2937", cardSub: "#6B7280",
  cardGreen: "#24966d", cardAmber: "#d3a43a", cardIndigo: "#3d7cc9", cardViolet: "#5f8b77",
  lampBase: "#64748B", lampArm: "#94A3B8", lampBulb: "#FDE68A", lampCone: "rgba(253,230,138,0.12)",
  bookColors: ["#477bc9", "#4aa660", "#d3a43a", "#6a8d7b"],
  mug: "#FFFFFF", coffee: "#92400E",
  plant: "#32785a", shelf: "#b8d8aa",
  paper: "#FFFFFF", barBg: "#CBD5E1",
  particle: "rgba(41,119,78,0.10)",
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}

function ball(ctx, cx, cy, r, c1, c2, shadow = false) {
  if (shadow) { ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.12)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5; }
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  if (shadow) ctx.restore();
}

function rr(ctx, x, y, w, h, r, c1, c2, shadow = false) {
  ctx.save();
  if (shadow) { ctx.shadowColor = "rgba(0,0,0,0.10)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; }
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, r);
  ctx.restore();
}

// ── Canvas Scene ──
export default function ClayScene() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const isDark = useRef(false);

  // ── Animation Loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let W, H, dpr;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    };

    // Watch dark mode
    const darkObserver = new MutationObserver(() => {
      isDark.current = document.documentElement.classList.contains("dark");
    });
    darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    isDark.current = document.documentElement.classList.contains("dark");

    // Watch password field
    let passwordFocused = false;
    const passHandler = (e) => { passwordFocused = e.type === "focus"; };
    const tryAttachPassword = () => {
      const el = document.querySelector('input[name="password"]');
      if (el && !el.dataset.clayWatched) {
        el.dataset.clayWatched = "true";
        el.addEventListener("focus", passHandler);
        el.addEventListener("blur", passHandler);
      }
    };
    tryAttachPassword();
    const formObserver = new MutationObserver(() => tryAttachPassword());
    formObserver.observe(document.body, { childList: true, subtree: true });

    resize();
    window.addEventListener("resize", resize);

    const draw = (t) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // The register illustration has its own fixed art direction so it stays
      // bright and legible even when the application uses dark mode.
      const C = LIGHT;
      const mx = (mouse.current.x - 0.5) * 2;
      const my = (mouse.current.y - 0.5) * 2;
      ctx.clearRect(0, 0, W, H);

      // ── Background ──
      const bg = ctx.createLinearGradient(0, 0, 0, H * 0.7);
      bg.addColorStop(0, C.wall); bg.addColorStop(1, C.wallEnd);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = isDark.current ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < W; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for (let i = 0; i < H; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

      // ── Shelf ──
      const sy = H * 0.10;
      rr(ctx, W * 0.06, sy, W * 0.32, 5, 2.5, C.shelf, C.shelf);
      // Books
      [[0.08, 24, 0], [0.12, 30, 1], [0.16, 20, 2], [0.19, 28, 3]].forEach(([x, h, ci]) => {
        rr(ctx, W * x, sy + 5 - h, 10, h, 2, C.bookColors[ci], C.bookColors[ci], true);
      });
      // Plant
      const px = W * 0.26;
      rr(ctx, px, sy + 5 - 16, 7, 16, 3, "#78350F", "#78350F");
      ctx.fillStyle = C.plant;
      ctx.beginPath(); ctx.arc(px + 3.5, sy - 13, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#059669";
      ctx.beginPath(); ctx.arc(px + 1, sy - 17, 5, 0, Math.PI * 2); ctx.fill();

      // ── Certificate ──
      const cx2 = W * 0.72, cy2 = H * 0.08;
      rr(ctx, cx2, cy2, W * 0.18, H * 0.11, 4, C.card, C.card);
      ctx.fillStyle = C.cardIndigo; ctx.font = `${H * 0.04}px sans-serif`; ctx.textAlign = "center";
      ctx.fillText("🎓", cx2 + W * 0.09, cy2 + H * 0.055);
      ctx.fillStyle = C.cardSub; ctx.font = `${H * 0.018}px sans-serif`;
      ctx.fillText("Certificat", cx2 + W * 0.09, cy2 + H * 0.085);

      // ── Desk ──
      const dy = H * 0.7, dh = H * 0.3, dw = W * 0.88, dx = W * 0.06;
      ctx.save(); ctx.shadowColor = C.cardShadow; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
      rr(ctx, dx, dy, dw, dh, 6, C.desk, C.deskDark); ctx.restore();
      rr(ctx, dx, dy, dw, 7, 6, C.deskTop, C.deskMid);
      rr(ctx, dx + dw * 0.35, dy + dh * 0.25, dw * 0.3, dh * 0.5, 4, C.deskDark, C.deskDark);
      ctx.fillStyle = C.deskMid; ctx.beginPath(); ctx.arc(dx + dw * 0.5, dy + dh * 0.5, 4, 0, Math.PI * 2); ctx.fill();

      // ── Body ──
      const bCx = W * 0.5, bTop = dy - H * 0.42;
      rr(ctx, bCx - W * 0.12, bTop + H * 0.07, W * 0.24, H * 0.35, 8, C.body, C.body);
      rr(ctx, bCx - W * 0.018, bTop + H * 0.07, W * 0.036, H * 0.2, 2, C.tie, C.tie);

      // Arms
      const armS = Math.sin(t * 0.5) * 0.03;
      // Left arm (covers eyes if password focused)
      ctx.save();
      ctx.translate(bCx - W * 0.14, bTop + H * 0.12);
      if (passwordFocused) {
        // Arm covers eyes
        ctx.rotate(-0.6 + Math.sin(t * 0.8) * 0.05);
        rr(ctx, -W * 0.02, -H * 0.08, W * 0.035, H * 0.12, 4, C.skin, C.skinEnd);
      } else {
        ctx.rotate(-0.15 + armS);
        rr(ctx, -W * 0.02, 0, W * 0.035, H * 0.15, 4, C.skin, C.skinEnd);
      }
      ctx.restore();

      // Right arm typing
      ctx.save(); ctx.translate(bCx + W * 0.14, bTop + H * 0.12); ctx.rotate(0.1);
      rr(ctx, -W * 0.02, 0, W * 0.035, H * 0.15, 4, C.skin, C.skinEnd); ctx.restore();

      // ── Head ──
      const hY = bTop, hR = W * 0.075;
      rr(ctx, bCx - W * 0.022, hY + hR * 0.5, W * 0.044, H * 0.04, 3, C.skinEnd, C.skinEnd);
      ctx.save();
      ctx.translate(mx * W * 0.01, my * H * 0.015);
      ball(ctx, bCx, hY, hR, C.skin, C.skinEnd, true);

      // Hair
      ctx.save();
      ctx.beginPath(); ctx.arc(bCx, hY - hR * 0.15, hR * 1.05, Math.PI * 1.15, Math.PI * 1.85); ctx.closePath();
      const hg = ctx.createLinearGradient(bCx - hR, hY - hR, bCx + hR, hY);
      hg.addColorStop(0, C.hair); hg.addColorStop(1, C.hairHighlight);
      ctx.fillStyle = hg; ctx.fill(); ctx.restore();

      // Glasses
      const eY = hY + hR * 0.05, eOff = hR * 0.35;
      ctx.strokeStyle = C.frame; ctx.lineWidth = 1.5;
      ctx.strokeRect(bCx - eOff - hR * 0.3, eY - hR * 0.25, hR * 0.6, hR * 0.45);
      ctx.strokeRect(bCx + eOff - hR * 0.3, eY - hR * 0.25, hR * 0.6, hR * 0.45);
      ctx.beginPath(); ctx.moveTo(bCx - eOff + hR * 0.3, eY); ctx.lineTo(bCx + eOff - hR * 0.3, eY); ctx.stroke();

      // Eyes
      const pm = hR * 0.12, pdx = mx * pm, pdy = my * pm + (passwordFocused ? -hR * 0.1 : 0);
      ball(ctx, bCx - eOff, eY, hR * 0.17, C.eye, C.eye);
      ball(ctx, bCx - eOff + pdx, eY + pdy, passwordFocused ? hR * 0.05 : hR * 0.08, C.pupil, C.pupil);
      ball(ctx, bCx + eOff, eY, hR * 0.17, C.eye, C.eye);
      ball(ctx, bCx + eOff + pdx, eY + pdy, passwordFocused ? hR * 0.05 : hR * 0.08, C.pupil, C.pupil);

      // Brows
      ctx.strokeStyle = isDark.current ? "#94A3B8" : "#475569"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(bCx - eOff - hR * 0.2, eY - hR * 0.35); ctx.lineTo(bCx - eOff + hR * 0.2, eY - hR * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bCx + eOff - hR * 0.2, eY - hR * 0.4); ctx.lineTo(bCx + eOff + hR * 0.2, eY - hR * 0.35); ctx.stroke();
      // Smile
      ctx.strokeStyle = C.lip; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(bCx, eY + hR * 0.45, hR * 0.25, 0.15, Math.PI - 0.15); ctx.stroke();
      ctx.restore(); // End head tilt

      // ── Laptop ──
      const lx = bCx - W * 0.02, ly = dy - H * 0.2, lw = W * 0.32, lh = H * 0.16;
      // Glow
      if (!isDark.current) {
        const sg = ctx.createRadialGradient(lx + lw * 0.5, ly + lh * 0.5, 0, lx + lw * 0.5, ly + lh * 0.5, lw * 0.5);
        sg.addColorStop(0, "rgba(99,102,241,0.08)"); sg.addColorStop(1, "rgba(99,102,241,0)");
        ctx.fillStyle = sg; ctx.fillRect(lx - lw * 0.2, ly - lh * 0.3, lw * 1.4, lh * 1.2);
      }
      rr(ctx, lx, ly, lw, lh, 5, C.screen, C.screenEnd);
      rr(ctx, lx + 4, ly + 4, lw - 8, lh - 8, 3, "#1E293B", "#0F172A");
      // Screen bars
      const colors = [C.cardIndigo, C.cardViolet, C.cardIndigo, C.cardGreen, C.cardIndigo];
      [20, 28, 16, 32, 24].forEach((h, i) => {
        const bw = (lw - 20) / 7, bx = lx + 8 + i * (bw + 3);
        rr(ctx, bx, ly + lh - 12 - h * 0.3, bw, h * 0.3, 1.5, colors[i % 5], colors[i % 5]);
      });
      // Keyboard
      rr(ctx, lx + 2, ly + lh - 2, lw - 4, 6, 2, "#475569", "#334155");

      // ── Lamp ──
      const lmX = dx + dw * 0.08, lmY = dy + 4;
      ctx.fillStyle = C.lampBase; ctx.beginPath(); ctx.ellipse(lmX, lmY, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.lampArm; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      const la = Math.sin(t * 0.3) * 0.1 + 0.3;
      ctx.save(); ctx.translate(lmX, lmY - 1); ctx.rotate(-la);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -18); ctx.stroke(); ctx.restore();
      ball(ctx, lmX + Math.sin(-la) * 18, lmY - 1 - Math.cos(-la) * 18, 5, C.lampBulb, C.lampBulb);
      ctx.fillStyle = C.lampCone;
      ctx.beginPath();
      ctx.moveTo(lmX + Math.sin(-la) * 18 - 4, lmY - 1 - Math.cos(-la) * 18);
      ctx.lineTo(lmX - 25, lmY + 35); ctx.lineTo(lmX + 25, lmY + 35); ctx.closePath(); ctx.fill();

      // ── Books on desk ──
      const bdx = dx + dw * 0.16, bdy = dy + 4;
      [[5, 18, 0], [-2, 20, 1], [12, 16, 2]].forEach(([dx2, h, ci]) => {
        rr(ctx, bdx + dx2, bdy - h + 8, 7, h, 2, C.bookColors[ci], C.bookColors[ci], true);
      });

      // ── Coffee mug ──
      const mx2 = bdx + 26;
      rr(ctx, mx2, bdy - 10, 9, 12, 3, C.mug, C.mug);
      ctx.strokeStyle = C.mug; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(mx2 + 11, bdy - 3, 4, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      ctx.fillStyle = C.coffee;
      ctx.beginPath(); ctx.ellipse(mx2 + 4.5, bdy - 8, 3.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      // Steam
      ctx.strokeStyle = isDark.current ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(mx2 + 3 + i * 1.5, bdy - 12 + i * 3);
        ctx.quadraticCurveTo(mx2 + 3 + i * 1.5 + Math.sin(t * 1.5 + i) * 3, bdy - 16 - i * 3, mx2 + 3 + i * 1.5 + Math.sin(t * 2 + i * 2) * 4, bdy - 20 - i * 2);
        ctx.stroke();
      }

      // ── Papers ──
      const ppx = dx + dw * 0.76;
      rr(ctx, ppx, dy + 5, 24, 18, 2, C.paper, C.paper, true);
      rr(ctx, ppx + 3, dy + 3, 24, 18, 2, C.paper, C.paper, true);
      ctx.fillStyle = isDark.current ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
      [6, 10, 14].forEach((y) => ctx.fillRect(ppx + 5, dy + y, 16, 1.5));

      // ── Floating Cards ──
      const cards = [
        { x: W * 0.78, y: H * 0.22, w: 76, h: 48, d: 0, draw: (cx, cy, cw, ch) => {
          ctx.fillStyle = C.cardText; ctx.font = `bold ${ch * 0.12}px sans-serif`;
          ctx.fillText("Élèves", cx + cw * 0.1, cy + ch * 0.3);
          ctx.font = `bold ${ch * 0.2}px sans-serif`; ctx.fillText("1,247", cx + cw * 0.1, cy + ch * 0.55);
          [50, 70, 40, 85, 65].forEach((h, i) => {
            rr(ctx, cx + cw * 0.1 + i * (cw * 0.11), cy + ch * 0.65 - h * 0.15, 4, h * 0.15, 1.5, C.cardIndigo, C.cardIndigo);
          });
        }},
        { x: W * 0.03, y: H * 0.42, w: 64, h: 42, d: 0.7, draw: (cx, cy, cw, ch) => {
          ctx.fillStyle = C.cardText; ctx.font = `bold ${ch * 0.12}px sans-serif`;
          ctx.fillText("Bulletins", cx + cw * 0.1, cy + ch * 0.3);
          rr(ctx, cx + cw * 0.1, cy + ch * 0.42, cw * 0.7, 4, 2, C.barBg, C.barBg);
          rr(ctx, cx + cw * 0.1, cy + ch * 0.42, cw * 0.5, 4, 2, C.cardGreen, C.cardGreen);
          ctx.fillStyle = C.cardGreen; ctx.font = `bold ${ch * 0.1}px sans-serif`;
          ctx.fillText("A+", cx + cw * 0.1, cy + ch * 0.7);
          ctx.fillStyle = C.cardAmber; ctx.fillText("B", cx + cw * 0.35, cy + ch * 0.7);
        }},
        { x: W * 0.82, y: H * 0.58, w: 54, h: 36, d: 1.4, draw: (cx, cy, cw, ch) => {
          ctx.fillStyle = C.cardText; ctx.font = `bold ${ch * 0.11}px sans-serif`;
          ctx.fillText("Taux", cx + cw * 0.1, cy + ch * 0.28);
          ctx.fillStyle = C.cardGreen; ctx.font = `bold ${ch * 0.24}px sans-serif`;
          ctx.fillText("94%", cx + cw * 0.1, cy + ch * 0.72);
          ctx.fillStyle = C.cardGreen; ctx.font = `bold ${ch * 0.09}px sans-serif`;
          ctx.fillText("▲ 12%", cx + cw * 0.5, cy + ch * 0.35);
        }},
        { x: W * 0.05, y: H * 0.65, w: 48, h: 32, d: 2.1, draw: (cx, cy, cw, ch) => {
          ctx.fillStyle = C.cardText; ctx.font = `bold ${ch * 0.12}px sans-serif`;
          ctx.fillText("Présents", cx + cw * 0.1, cy + ch * 0.32);
          ctx.fillStyle = C.cardGreen; ctx.font = `bold ${ch * 0.22}px sans-serif`;
          ctx.fillText("92%", cx + cw * 0.1, cy + ch * 0.78);
        }},
      ];

      cards.forEach((c) => {
        const fY = Math.sin(t * 0.4 + c.d) * 5;
        const fX = Math.sin(t * 0.3 + c.d * 1.3) * 3;
        ctx.save(); ctx.shadowColor = C.cardShadow; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
        rr(ctx, c.x + fX, c.y + fY, c.w, c.h, 5, C.card, C.card);
        ctx.restore();
        c.draw(c.x + fX, c.y + fY, c.w, c.h);
      });

      // ── Particles ──
      for (let i = 0; i < 10; i++) {
        const px = (Math.sin(t * 0.1 + i * 2.7) * 0.5 + 0.5) * W;
        const py = (Math.cos(t * 0.08 + i * 1.3) * 0.5 + 0.5) * H;
        ctx.fillStyle = C.particle;
        ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    };

    const loop = (time) => { draw(time * 0.001); animId = requestAnimationFrame(loop); };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      darkObserver.disconnect();
      formObserver.disconnect();
    };
  }, []);

  // ── Mouse Tracking (via ref, no re-renders) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    const onLeave = () => { mouse.current = { x: 0.5, y: 0.5 }; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full cursor-default" />;
}
