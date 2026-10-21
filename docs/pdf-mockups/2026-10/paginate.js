/* Minimal A4 paginator for the quote mockups.
 * Each variant builds a flat list of blocks; the pager flows them into fixed A4 sheets,
 * keeps "keep" blocks with the next block and re-inserts a continuation head
 * (block.cont) when a table breaks across sheets.
 * Header (page 1 only) and footer (every page) replicate the current PDF exactly. */
(function () {
  const RATIOS = {
    azimut: 4.348, 'azimut-benetti': 4.639, sasga: 4.225, windy: 3.619, mimi: 3.875,
    pirelli: 4.688, capelli: 1.994, 'solaris-power': 3, wider: 9.706,
  };

  const css = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { background: #d9dbe0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .sheets { display: flex; flex-direction: column; align-items: center; gap: 10mm; padding: 10mm 0 16mm; }
  .sheet { width: 210mm; height: 297mm; background: #fff; position: relative; overflow: hidden;
    display: flex; flex-direction: column; padding: 28pt 36pt 0; box-shadow: 0 1px 2px rgba(26,26,46,.12), 0 8px 28px rgba(26,26,46,.14); }
  .sheet-body { flex: 1 1 auto; min-height: 0; overflow: hidden; }
  .sheet-foot { flex: 0 0 auto; height: 58pt; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 6pt; }
  @media print {
    body { background: #fff; }
    .sheets { display: block; padding: 0; }
    .sheet { box-shadow: none; break-after: page; page-break-after: always; }
    .sheet:last-child { break-after: auto; page-break-after: auto; }
  }
  /* Header — as in PDFDetailedTemplate */
  .nm-head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10pt; margin-bottom: 12pt; border-bottom: .75pt solid #1a1a2e; }
  .nm-head img { height: 62pt; display: block; }
  .nm-head-r { text-align: right; color: #1a1a2e; }
  .nm-head-r .t { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 13pt; line-height: 1.15; margin-bottom: 2pt; }
  .nm-head-r .n { font-weight: 700; font-size: 8.5pt; margin-bottom: 2pt; }
  .nm-head-r .m { font-size: 7pt; color: #333; line-height: 1.35; }
  .nm-head-r .m b { color: #1a1a2e; font-weight: 500; }
  /* Footer — partner logos + registration text */
  .nm-logos { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6pt; }
  .nm-logos img { display: block; object-fit: contain; }
  .nm-reg { font-size: 5.5pt; line-height: 1.6; color: #333; text-align: center; }
  .nm-reg b { font-weight: 700; }
  `;

  function h(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function header(q) {
    return h(`<header class="nm-head">
      <img src="assets/navis-marine.png" alt="navis marine">
      <div class="nm-head-r"><div class="t">QUOTE</div><div class="n">${q.number}</div>
      <div class="m">Date: <b>${q.date}</b></div><div class="m">Valid Until: <b>${q.validUntil}</b></div></div>
    </header>`);
  }

  function footer(q) {
    const H = 22, MAXW = 80, GAP = 12, W = 523;
    const sized = q.partners.map((k) => { const r = RATIOS[k]; const w = Math.min(H * r, MAXW); return { k, w, h: w / r }; });
    const total = sized.reduce((s, l) => s + l.w, 0);
    const sc = Math.min(1, (W - GAP * (sized.length - 1)) / total);
    const s = q.seller;
    return h(`<footer>
      <div class="nm-logos">${sized.map((l) => `<img src="assets/${l.k}.png" alt="${l.k}" style="width:${(l.w * sc).toFixed(1)}pt;height:${(l.h * sc).toFixed(1)}pt">`).join('')}</div>
      <p class="nm-reg">Registered at the Commercial Court in Zagreb under Reg. No. <b>MB:</b> ${s.mb} | <b>OIB:</b> ${s.oib} | <b>IBAN:</b> ${s.iban} | <b>SWIFT:</b> ${s.bic}, ${s.bank}</p>
      <p class="nm-reg"><b>Share capital fully paid:</b> ${s.capital} | <b>Director:</b> ${s.director}</p>
    </footer>`);
  }

  /* Deterministic QR-like placeholder (version 3 layout: finders, separators, timing,
   * alignment pattern, quiet zone). Looks like a real code but is not scannable. */
  function qr(size, color) {
    const n = 29; let seed = 143; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const inFinder = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
    const inAlign = (x, y) => x >= 20 && x <= 24 && y >= 20 && y <= 24;
    let r = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (inFinder(x, y) || inAlign(x, y)) continue;
      if (x === 6 || y === 6) { if ((x + y) % 2 === 0) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; continue; }
      const dense = (x * 7 + y * 13) % 11 < 2 ? 0.35 : 0.5;
      if (rnd() > dense) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    const f = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    const a = `<rect x="20" y="20" width="5" height="5"/><rect x="21" y="21" width="3" height="3" fill="#fff"/><rect x="22" y="22" width="1" height="1"/>`;
    return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" width="${size}" height="${size}" fill="${color || '#1a1a2e'}" shape-rendering="crispEdges" role="img" aria-label="Payment QR code placeholder"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/>${f(0, 0)}${f(n - 7, 0)}${f(0, n - 7)}${a}<rect x="8" y="${n - 8}" width="1" height="1"/>${r}</svg>`;
  }

  async function run(q, blocks, opts) {
    opts = opts || {};
    const st = document.createElement('style'); st.textContent = css; document.head.prepend(st);
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const root = h('<main class="sheets"></main>'); document.body.appendChild(root);
    let flow, body, placed;
    const newSheet = (first) => {
      const sh = h(`<section class="sheet ${opts.sheetClass || ''}"><div class="sheet-body"><div class="flow"></div></div><div class="sheet-foot"></div></section>`);
      if (first) sh.insertBefore(header(q), sh.firstChild);
      sh.querySelector('.sheet-foot').appendChild(footer(q));
      root.appendChild(sh);
      body = sh.querySelector('.sheet-body'); flow = sh.querySelector('.flow'); placed = [];
    };
    /* 6px slack: print snaps hairlines differently than screen, so leave room for drift */
    const over = () => flow.scrollHeight > body.clientHeight - 6;
    newSheet(true);
    for (const b of blocks) {
      flow.appendChild(b.el);
      if (!over()) { placed.push(b); continue; }
      flow.removeChild(b.el);
      const moved = [b];
      while (placed.length && placed[placed.length - 1].keep) { const p = placed.pop(); flow.removeChild(p.el); moved.unshift(p); }
      if (!placed.length && !flow.children.length && moved.length === 1) { flow.appendChild(b.el); placed.push(b); continue; }
      newSheet(false);
      if (moved[0].cont) flow.appendChild(moved[0].cont());
      moved.forEach((m) => { flow.appendChild(m.el); placed.push(m); });
    }
    if (opts.after) opts.after(root);
    document.body.dataset.pages = root.children.length;
    document.body.dataset.ready = '1';
  }

  window.Pager = { run, h, qr };
})();
