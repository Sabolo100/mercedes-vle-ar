// Procedurális (helyőrző) képek canvasra rajzolva. Valódi fotó esetén ugyanebbe a keretbe kerül a kép.
import * as THREE from 'three';

// ---------- színsegédek ----------
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function shade(hex, amt) {
  // amt: -1..1 (sötétít / világosít)
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- háttér ----------
function studio(ctx, w, h, tint = '#2a2f38') {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.05, w * 0.5, h * 0.5, w * 0.75);
  g.addColorStop(0, shade(tint, 0.18));
  g.addColorStop(0.6, shade(tint, -0.45));
  g.addColorStop(1, '#050608');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // padló-reflexió
  const f = ctx.createLinearGradient(0, h * 0.72, 0, h);
  f.addColorStop(0, 'rgba(255,255,255,0.05)');
  f.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = f;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
}

// ---------- felni ----------
export function drawWheel(ctx, cx, cy, r, wheel) {
  // gumi
  ctx.fillStyle = '#0d0e10';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = r * 0.04;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2); ctx.stroke();

  const rr = r * 0.74; // felni sugár
  // felni alap (sötét, a küllők közötti rész)
  const base = ctx.createRadialGradient(cx, cy, rr * 0.1, cx, cy, rr);
  base.addColorStop(0, shade(wheel.dark, 0.15));
  base.addColorStop(1, wheel.dark);
  ctx.fillStyle = base;
  ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();

  const metal = ctx.createLinearGradient(cx - rr, cy - rr, cx + rr, cy + rr);
  metal.addColorStop(0, shade(wheel.rim, 0.35));
  metal.addColorStop(0.5, wheel.rim);
  metal.addColorStop(1, shade(wheel.rim, -0.35));
  ctx.fillStyle = metal;

  const spoke = (ang, wIn, wOut, len = rr * 0.98) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-wIn / 2, 0);
    ctx.lineTo(-wOut / 2, -len);
    ctx.lineTo(wOut / 2, -len);
    ctx.lineTo(wIn / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  switch (wheel.style) {
    case 'twin':
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        spoke(a - 0.13, rr * 0.12, rr * 0.16);
        spoke(a + 0.13, rr * 0.12, rr * 0.16);
      }
      break;
    case 'multi':
      for (let i = 0; i < 10; i++) spoke((i / 10) * Math.PI * 2, rr * 0.08, rr * 0.16);
      for (let i = 0; i < 10; i++) {
        ctx.save();
        ctx.fillStyle = shade(wheel.rim, -0.6);
        spoke((i / 10) * Math.PI * 2 + 0.02, rr * 0.02, rr * 0.03, rr * 0.9);
        ctx.restore();
      }
      break;
    case 'y':
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        spoke(a, rr * 0.16, rr * 0.1, rr * 0.55);
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(a); ctx.translate(0, -rr * 0.5);
        ctx.beginPath();
        ctx.moveTo(-rr * 0.05, 0); ctx.lineTo(-rr * 0.26, -rr * 0.46); ctx.lineTo(-rr * 0.14, -rr * 0.48); ctx.lineTo(0, -rr * 0.12);
        ctx.lineTo(rr * 0.14, -rr * 0.48); ctx.lineTo(rr * 0.26, -rr * 0.46); ctx.lineTo(rr * 0.05, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      break;
    case 'aero': {
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = wheel.dark;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(0, -rr * 0.72, rr * 0.06, rr * 0.17, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = shade(wheel.rim, -0.25);
      ctx.lineWidth = rr * 0.03;
      ctx.beginPath(); ctx.arc(cx, cy, rr * 0.45, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'turbine':
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, -rr * 0.2);
        ctx.quadraticCurveTo(rr * 0.35, -rr * 0.5, rr * 0.18, -rr * 0.98);
        ctx.lineTo(rr * 0.05, -rr * 0.98);
        ctx.quadraticCurveTo(rr * 0.2, -rr * 0.5, -rr * 0.06, -rr * 0.2);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // vékony fényes él
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = rr * 0.02;
      ctx.beginPath(); ctx.arc(cx, cy, rr * 0.97, 0, Math.PI * 2); ctx.stroke();
      break;
  }
  // perem és agy
  ctx.strokeStyle = shade(wheel.rim, -0.1);
  ctx.lineWidth = rr * 0.06;
  ctx.beginPath(); ctx.arc(cx, cy, rr * 0.98, 0, Math.PI * 2); ctx.stroke();
  const hub = ctx.createRadialGradient(cx - rr * 0.05, cy - rr * 0.05, 1, cx, cy, rr * 0.22);
  hub.addColorStop(0, '#f0f2f4');
  hub.addColorStop(1, shade(wheel.rim, -0.4));
  ctx.fillStyle = hub;
  ctx.beginPath(); ctx.arc(cx, cy, rr * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1c20';
  ctx.beginPath(); ctx.arc(cx, cy, rr * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9cdd2';
  ctx.lineWidth = rr * 0.015;
  ctx.beginPath(); ctx.arc(cx, cy, rr * 0.1, 0, Math.PI * 2); ctx.stroke();
}

// ---------- autó oldalnézet (stilizált nagy MPV) ----------
function bodyGradient(ctx, y0, y1, paint) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, shade(paint, 0.35));
  g.addColorStop(0.18, shade(paint, 0.12));
  g.addColorStop(0.5, paint);
  g.addColorStop(0.52, shade(paint, -0.2));
  g.addColorStop(1, shade(paint, -0.55));
  return g;
}

export function drawSide(ctx, w, h, paint, wheel) {
  studio(ctx, w, h);
  const bx = w * 0.07, by = h * 0.24, bw = w * 0.86, bh = h * 0.5;
  const X = (u) => bx + u * bw, Y = (v) => by + v * bh;

  // árnyék
  const sh = ctx.createRadialGradient(w / 2, Y(1.02), 1, w / 2, Y(1.02), bw * 0.55);
  sh.addColorStop(0, 'rgba(0,0,0,0.75)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.beginPath(); ctx.ellipse(w / 2, Y(1.02), bw * 0.55, bh * 0.08, 0, 0, Math.PI * 2); ctx.fill();

  // karosszéria
  ctx.fillStyle = bodyGradient(ctx, Y(0), Y(1), paint);
  ctx.beginPath();
  ctx.moveTo(X(0.01), Y(0.9));
  ctx.lineTo(X(0.0), Y(0.3));
  ctx.quadraticCurveTo(X(0.0), Y(0.02), X(0.07), Y(0.01));
  ctx.lineTo(X(0.6), Y(0.0));
  ctx.quadraticCurveTo(X(0.66), Y(0.0), X(0.7), Y(0.08));
  ctx.lineTo(X(0.8), Y(0.38));
  ctx.quadraticCurveTo(X(0.82), Y(0.42), X(0.9), Y(0.45));
  ctx.quadraticCurveTo(X(1.0), Y(0.48), X(1.0), Y(0.62));
  ctx.lineTo(X(0.995), Y(0.88));
  ctx.quadraticCurveTo(X(0.99), Y(0.95), X(0.95), Y(0.95));
  ctx.lineTo(X(0.04), Y(0.95));
  ctx.quadraticCurveTo(X(0.01), Y(0.95), X(0.01), Y(0.9));
  ctx.closePath();
  ctx.fill();

  // üvegfelület
  const glass = ctx.createLinearGradient(0, Y(0.05), 0, Y(0.4));
  glass.addColorStop(0, '#2b3542');
  glass.addColorStop(0.5, '#0b0f15');
  glass.addColorStop(1, '#05070a');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(X(0.03), Y(0.36));
  ctx.lineTo(X(0.03), Y(0.12));
  ctx.quadraticCurveTo(X(0.035), Y(0.06), X(0.08), Y(0.06));
  ctx.lineTo(X(0.6), Y(0.055));
  ctx.quadraticCurveTo(X(0.64), Y(0.06), X(0.67), Y(0.12));
  ctx.lineTo(X(0.765), Y(0.37));
  ctx.closePath();
  ctx.fill();
  // tükröződés
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.moveTo(X(0.3), Y(0.06)); ctx.lineTo(X(0.42), Y(0.06)); ctx.lineTo(X(0.32), Y(0.36)); ctx.lineTo(X(0.2), Y(0.36));
  ctx.closePath(); ctx.fill();
  // oszlopok
  ctx.fillStyle = shade(paint, -0.5);
  ctx.fillRect(X(0.24), Y(0.055), bw * 0.012, bh * 0.31);
  ctx.fillRect(X(0.5), Y(0.055), bw * 0.012, bh * 0.31);
  // tolóajtó sín / karakterél
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = Math.max(1, h * 0.004);
  ctx.beginPath(); ctx.moveTo(X(0.02), Y(0.55)); ctx.lineTo(X(0.97), Y(0.53)); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.moveTo(X(0.26), Y(0.4)); ctx.lineTo(X(0.26), Y(0.9)); ctx.moveTo(X(0.51), Y(0.4)); ctx.lineTo(X(0.51), Y(0.9)); ctx.stroke();
  // lámpák
  ctx.fillStyle = '#e8f3ff';
  ctx.shadowColor = '#bfe3ff'; ctx.shadowBlur = h * 0.03;
  ctx.fillRect(X(0.93), Y(0.5), bw * 0.06, bh * 0.025);
  ctx.fillStyle = '#ff2a3a'; ctx.shadowColor = '#ff2a3a';
  ctx.fillRect(X(0.0), Y(0.32), bw * 0.012, bh * 0.16);
  ctx.shadowBlur = 0;

  // kerékjárat + kerekek
  const wr = bh * 0.25;
  for (const u of [0.17, 0.82]) {
    ctx.fillStyle = '#050506';
    ctx.beginPath(); ctx.arc(X(u), Y(0.9), wr * 1.12, Math.PI, 0); ctx.fill();
    drawWheel(ctx, X(u), Y(0.9), wr, wheel);
  }
}

// ---------- autó szemből ----------
export function drawFront(ctx, w, h, paint, wheel) {
  studio(ctx, w, h);
  const cx = w / 2;
  const top = h * 0.16, bottom = h * 0.84;
  const bw = Math.min(w * 0.62, h * 0.95);
  const sh = ctx.createRadialGradient(cx, bottom, 1, cx, bottom, bw * 0.7);
  sh.addColorStop(0, 'rgba(0,0,0,0.8)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.beginPath(); ctx.ellipse(cx, bottom, bw * 0.7, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();

  // kerekek (látható alsó rész)
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#0b0b0c';
    roundRect(ctx, cx + s * bw * 0.4 - bw * 0.07, bottom - h * 0.13, bw * 0.14, h * 0.14, h * 0.02);
    ctx.fill();
  }
  // test
  ctx.fillStyle = bodyGradient(ctx, top, bottom, paint);
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.36, top);
  ctx.lineTo(cx + bw * 0.36, top);
  ctx.quadraticCurveTo(cx + bw * 0.42, top, cx + bw * 0.44, top + h * 0.08);
  ctx.lineTo(cx + bw * 0.5, bottom - h * 0.22);
  ctx.quadraticCurveTo(cx + bw * 0.52, bottom - h * 0.04, cx + bw * 0.46, bottom - h * 0.03);
  ctx.lineTo(cx - bw * 0.46, bottom - h * 0.03);
  ctx.quadraticCurveTo(cx - bw * 0.52, bottom - h * 0.04, cx - bw * 0.5, bottom - h * 0.22);
  ctx.lineTo(cx - bw * 0.44, top + h * 0.08);
  ctx.quadraticCurveTo(cx - bw * 0.42, top, cx - bw * 0.36, top);
  ctx.closePath(); ctx.fill();

  // szélvédő
  const glass = ctx.createLinearGradient(0, top, 0, top + h * 0.28);
  glass.addColorStop(0, '#34404f'); glass.addColorStop(1, '#06080b');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.34, top + h * 0.04);
  ctx.lineTo(cx + bw * 0.34, top + h * 0.04);
  ctx.lineTo(cx + bw * 0.42, top + h * 0.3);
  ctx.lineTo(cx - bw * 0.42, top + h * 0.3);
  ctx.closePath(); ctx.fill();

  // fénycsík + fényszórók
  const ly = top + h * 0.4;
  ctx.shadowColor = '#cfe9ff'; ctx.shadowBlur = h * 0.04;
  ctx.fillStyle = '#eaf6ff';
  ctx.fillRect(cx - bw * 0.36, ly, bw * 0.72, h * 0.008);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * bw * 0.28, ly - h * 0.02);
    ctx.lineTo(cx + s * bw * 0.45, ly - h * 0.03);
    ctx.lineTo(cx + s * bw * 0.46, ly + h * 0.02);
    ctx.lineTo(cx + s * bw * 0.3, ly + h * 0.025);
    ctx.closePath(); ctx.fill();
  }
  ctx.shadowBlur = 0;

  // hűtőrács (fekete panel pontmintával)
  const gy = ly + h * 0.06;
  ctx.fillStyle = '#07080a';
  roundRect(ctx, cx - bw * 0.27, gy, bw * 0.54, h * 0.16, h * 0.04);
  ctx.fill();
  ctx.fillStyle = 'rgba(210,225,240,0.35)';
  for (let y = gy + h * 0.025; y < gy + h * 0.15; y += h * 0.024) {
    for (let x = cx - bw * 0.25; x < cx + bw * 0.25; x += h * 0.024) {
      ctx.beginPath(); ctx.arc(x, y, h * 0.0045, 0, Math.PI * 2); ctx.fill();
    }
  }
  // középső embléma-helyőrző (gyűrű)
  ctx.strokeStyle = '#dfe3e8'; ctx.lineWidth = h * 0.008;
  ctx.beginPath(); ctx.arc(cx, gy + h * 0.08, h * 0.045, 0, Math.PI * 2); ctx.stroke();
  // alsó légbeömlő
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRect(ctx, cx - bw * 0.32, bottom - h * 0.1, bw * 0.64, h * 0.045, h * 0.02);
  ctx.fill();
}

// ---------- belső tér: hátsó lounge ülések ----------
export function drawLounge(ctx, w, h, interior) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#16181c'); bg.addColorStop(0.65, '#0c0d10'); bg.addColorStop(1, '#050506');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  // ambient fénycsíkok
  ctx.shadowColor = interior.ambient; ctx.shadowBlur = h * 0.06;
  ctx.strokeStyle = interior.ambient; ctx.lineWidth = h * 0.008;
  ctx.beginPath(); ctx.moveTo(w * 0.02, h * 0.2); ctx.quadraticCurveTo(w * 0.5, h * 0.1, w * 0.98, h * 0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.02, h * 0.62); ctx.lineTo(w * 0.12, h * 0.6); ctx.moveTo(w * 0.88, h * 0.6); ctx.lineTo(w * 0.98, h * 0.62); ctx.stroke();
  ctx.shadowBlur = 0;
  // padló
  ctx.fillStyle = '#1b1c1f';
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w * 0.2, h * 0.78); ctx.lineTo(w * 0.8, h * 0.78); ctx.lineTo(w, h); ctx.fill();

  const seat = (cx) => {
    const s = h * 0.62;
    const up = interior.color;
    // ülőlap
    ctx.fillStyle = shade(up, -0.25);
    roundRect(ctx, cx - s * 0.36, h * 0.66, s * 0.72, s * 0.2, s * 0.06); ctx.fill();
    // háttámla
    const g = ctx.createLinearGradient(cx - s * 0.3, 0, cx + s * 0.3, 0);
    g.addColorStop(0, shade(up, -0.3)); g.addColorStop(0.5, shade(up, 0.08)); g.addColorStop(1, shade(up, -0.35));
    ctx.fillStyle = g;
    roundRect(ctx, cx - s * 0.3, h * 0.24, s * 0.6, s * 0.72, s * 0.1); ctx.fill();
    // steppelés
    ctx.strokeStyle = shade(up, -0.45); ctx.lineWidth = Math.max(1, s * 0.008);
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * s * 0.09, h * 0.32); ctx.lineTo(cx + i * s * 0.09, h * 0.66); ctx.stroke();
    }
    // fejtámla
    ctx.fillStyle = shade(up, 0.05);
    roundRect(ctx, cx - s * 0.2, h * 0.1, s * 0.4, s * 0.17, s * 0.07); ctx.fill();
    // karfák
    ctx.fillStyle = shade(up, -0.4);
    roundRect(ctx, cx - s * 0.44, h * 0.55, s * 0.1, s * 0.22, s * 0.04); ctx.fill();
    roundRect(ctx, cx + s * 0.34, h * 0.55, s * 0.1, s * 0.22, s * 0.04); ctx.fill();
  };
  seat(w * 0.3);
  seat(w * 0.7);
}

// ---------- belső tér: műszerfal ----------
export function drawCockpit(ctx, w, h, interior) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#3a4350'); bg.addColorStop(0.4, '#15181d'); bg.addColorStop(1, '#060607');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  // műszerfal test
  ctx.fillStyle = '#0d0e10';
  ctx.beginPath(); ctx.moveTo(0, h * 0.45); ctx.quadraticCurveTo(w / 2, h * 0.36, w, h * 0.45); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  // kijelző sáv
  const sg = ctx.createLinearGradient(w * 0.1, 0, w * 0.9, 0);
  sg.addColorStop(0, '#0b2a4a'); sg.addColorStop(0.5, '#1b5f9e'); sg.addColorStop(1, '#3a1b6e');
  ctx.fillStyle = sg;
  ctx.shadowColor = '#4aa8ff'; ctx.shadowBlur = h * 0.05;
  roundRect(ctx, w * 0.08, h * 0.46, w * 0.84, h * 0.13, h * 0.03); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 6; i++) roundRect(ctx, w * (0.14 + i * 0.12), h * 0.5, w * 0.08, h * 0.05, h * 0.01), ctx.fill();
  // ambient csík
  ctx.shadowColor = interior.ambient; ctx.shadowBlur = h * 0.05;
  ctx.fillStyle = interior.ambient;
  ctx.fillRect(w * 0.04, h * 0.63, w * 0.92, h * 0.008);
  ctx.shadowBlur = 0;
  // kormány
  ctx.strokeStyle = '#1e2024'; ctx.lineWidth = h * 0.035;
  ctx.beginPath(); ctx.arc(w * 0.28, h * 0.86, h * 0.2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  // első ülések teteje
  for (const cx of [w * 0.28, w * 0.72]) {
    ctx.fillStyle = shade(interior.color, -0.1);
    roundRect(ctx, cx - h * 0.16, h * 0.82, h * 0.32, h * 0.3, h * 0.08); ctx.fill();
    ctx.fillStyle = shade(interior.color, 0.05);
    roundRect(ctx, cx - h * 0.09, h * 0.72, h * 0.18, h * 0.12, h * 0.05); ctx.fill();
  }
}

// ---------- felni közeli ----------
export function drawWheelCard(ctx, w, h, wheel, paint = '#2a2f38') {
  studio(ctx, w, h, paint);
  // karosszéria-ív a háttérben
  ctx.fillStyle = bodyGradient(ctx, 0, h, paint);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h * 0.7);
  const cx = w * 0.64, cy = h * 0.5, r = h * 0.38;
  ctx.lineTo(cx + r * 1.15, h * 0.7);
  ctx.arc(cx, cy, r * 1.15, 0.5, Math.PI - 0.5, true);
  ctx.lineTo(0, h * 0.7); ctx.closePath();
  ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
  drawWheel(ctx, cx, cy, r, wheel);
}

// ---------- összegző lap ----------
export function drawSummary(ctx, w, h, { title, rows, paint, interior }) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#0e1013'); g.addColorStop(1, '#1d2128');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
  roundRect(ctx, w * 0.06, h * 0.06, w * 0.88, h * 0.88, w * 0.04); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `600 ${w * 0.11}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('VLE', w / 2, h * 0.27);
  ctx.font = `400 ${w * 0.05}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(title, w / 2, h * 0.36);
  ctx.textAlign = 'left';
  rows.forEach(([k, v, sw], i) => {
    const y = h * (0.5 + i * 0.13);
    ctx.fillStyle = sw;
    ctx.beginPath(); ctx.arc(w * 0.17, y - w * 0.015, w * 0.035, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `400 ${w * 0.04}px system-ui, sans-serif`;
    ctx.fillText(k, w * 0.25, y - w * 0.035);
    ctx.fillStyle = '#fff';
    ctx.font = `600 ${w * 0.048}px system-ui, sans-serif`;
    ctx.fillText(v, w * 0.25, y + w * 0.015);
  });
  ctx.fillStyle = interior.ambient;
  ctx.fillRect(w * 0.2, h * 0.9, w * 0.6, 3);
  ctx.fillStyle = paint;
  ctx.fillRect(w * 0.35, h * 0.9, w * 0.3, 3);
}

// ---------- kártya-textúra keret: lekerekített sarok + felirat ----------
const imgCache = new Map();
function loadImage(src) {
  if (!imgCache.has(src)) {
    imgCache.set(src, new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    }));
  }
  return imgCache.get(src);
}

/**
 * @param {object} o
 * @param {(ctx,w,h)=>void} o.draw  procedurális rajz
 * @param {string} [o.img]          opcionális valódi fotó
 * @param {string} [o.label]
 * @param {string} [o.sub]
 * @param {number} [o.w=512] [o.h=340]
 * @param {number} [o.radius]
 */
export function makeCardTexture({ draw, img, label, sub, w = 512, h = 340, radius = w === h ? 0 : 26 }) {
  // négyzetes = kockalap → nincs lekerekítés
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const paint = (image) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    roundRect(ctx, 0, 0, w, h, radius);
    ctx.clip();
    if (image) {
      const s = Math.max(w / image.width, h / image.height);
      ctx.drawImage(image, (w - image.width * s) / 2, (h - image.height * s) / 2, image.width * s, image.height * s);
    } else {
      draw(ctx, w, h);
    }
    if (label) {
      const g = ctx.createLinearGradient(0, h * 0.62, 0, h);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
      ctx.fillStyle = '#fff';
      ctx.font = `600 ${Math.round(h * 0.075)}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(label, w * 0.06, h * (sub ? 0.84 : 0.91));
      if (sub) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = `400 ${Math.round(h * 0.055)}px system-ui, -apple-system, Segoe UI, sans-serif`;
        ctx.fillText(sub, w * 0.06, h * 0.93);
      }
    }
    ctx.restore();
    // finom keret
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 3;
    roundRect(ctx, 1.5, 1.5, w - 3, h - 3, radius);
    ctx.stroke();
    tex.needsUpdate = true;
  };

  paint(null);
  if (img) loadImage(img).then((im) => im && paint(im));
  return tex;
}

// Puha kör sprite a részecskékhez
export function makeDotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export { rgba };
