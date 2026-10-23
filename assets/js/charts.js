// Result charts (index.html #results), drawn as SVG from the paper's numbers.
// Colours come from CSS classes (.ser-1 / .fill-1 = ours, .ser-2 / .fill-2 = baseline), so both themes work.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const C1 = "var(--accent)", C2 = "var(--base)";

  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const text = (parent, x, y, str, cls = "lbl", anchor = "start", extra = {}) => {
    const t = el("text", { x, y, class: cls, "text-anchor": anchor, ...extra }, parent);
    t.textContent = str;
    return t;
  };
  const scale = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

  // one tooltip per chart; rows are {color, value, label}; built with textContent only
  function tipper(box) {
    const tip = document.createElement("div");
    tip.className = "tip";
    tip.setAttribute("role", "status");
    box.appendChild(tip);
    return {
      show(x, y, head, rows) {
        tip.replaceChildren();
        const h = document.createElement("div");
        h.className = "th";
        h.textContent = head;
        tip.appendChild(h);
        rows.forEach((r) => {
          const d = document.createElement("div");
          d.className = "tr";
          const i = document.createElement("i");
          i.style.background = r.color;
          const b = document.createElement("b");
          b.textContent = r.value;
          const s = document.createElement("span");
          s.textContent = r.label;
          d.append(i, b, s);
          tip.appendChild(d);
        });
        tip.classList.add("on");
        const w = tip.offsetWidth, hgt = tip.offsetHeight, W = box.clientWidth;
        let left = x + 16;
        if (left + w > W) left = x - w - 16;
        tip.style.left = Math.max(0, left) + "px";
        tip.style.top = Math.max(0, y - hgt / 2) + "px";
      },
      hide() { tip.classList.remove("on"); },
    };
  }

  // keyboard: arrows step through a chart's points, Escape hides
  function keys(svg, count, show, hide) {
    let i = -1;
    svg.setAttribute("tabindex", "0");
    svg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") i = Math.min(count - 1, i + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") i = Math.max(0, i - 1);
      else if (e.key === "Escape") { hide(); return; }
      else return;
      e.preventDefault();
      show(i);
    });
    svg.addEventListener("blur", hide);
  }

  function frame(box, height, label) {
    box.querySelectorAll("svg, .tip").forEach((n) => n.remove());
    const W = Math.max(280, box.clientWidth);
    const svg = el("svg", { viewBox: `0 0 ${W} ${height}`, width: W, height, role: "img", "aria-label": label }, box);
    return { svg, W, H: height, tip: tipper(box) };
  }

  // ── 1. trigger vs every N-th window ──
  const TRIG = { x: [39, 59, 74, 89, 100], tau: ["0.8", "0.7", "0.6", "0.5", "–"], cost: [0.66, 0.99, 1.22, 1.44, 1.64],
                 ours: [49, 66, 86, 91, 94], base: [54, 73, 75, 92, 94] };

  function drawTrigger(box) {
    const narrow = box.clientWidth < 520;
    const { svg, W, H, tip } = frame(box, narrow ? 290 : 340,
      "Line chart: actions found against share of windows sent. Trigger 49, 66, 86, 91, 94; every N-th 54, 73, 75, 92, 94 at 39, 59, 74, 89 and 100 percent.");
    const m = { l: 40, r: narrow ? 14 : 28, t: 26, b: 42 };
    const x = scale(35, 100, m.l, W - m.r), y = scale(40, 100, H - m.b, m.t);

    const g = el("g", { class: "grid" }, svg);
    for (let v = 40; v <= 100; v += 10) {
      el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, g);
      text(svg, m.l - 8, y(v) + 4, String(v), "tick", "end");
    }
    const ax = el("g", { class: "axis" }, svg);
    el("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }, ax);
    [40, 50, 60, 70, 80, 90, 100].forEach((v) => {
      if (narrow && v % 20) return;
      text(svg, x(v), H - m.b + 18, v + "%", "tick", "middle");
    });
    text(svg, m.l - 32, m.t - 12, "Actions found (of 307)", "axis-title");
    text(svg, W - m.r, H - 4, "Share of windows sent to the VLM", "axis-title", "end");

    const line = (ys, cls) => el("path", {
      d: ys.map((v, i) => (i ? "L" : "M") + x(TRIG.x[i]) + " " + y(v)).join(""),
      class: cls, fill: "none", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round",
    }, svg);
    line(TRIG.base, "ser-2");
    line(TRIG.ours, "ser-1");

    // the story point: the gap between the two lines at 74 %
    const xa = x(74);
    el("line", { x1: xa, x2: xa, y1: y(86), y2: y(75), stroke: "var(--ink-2)", "stroke-width": 1, "stroke-dasharray": "2 3" }, svg);
    text(svg, xa + 10, y(80.5) + 4, "+11", "lbl strong");

    const dots = (ys, cls) => ys.forEach((v, i) =>
      el("circle", { cx: x(TRIG.x[i]), cy: y(v), r: 4.5, class: cls + " ring" }, svg));
    dots(TRIG.base, "fill-2");
    dots(TRIG.ours, "fill-1");
    text(svg, xa - 8, y(86) - 10, "86", "lbl strong", "end");
    text(svg, xa, y(75) + 21, "75", "lbl", "middle");
    if (!narrow) text(svg, x(100) - 8, y(94) - 12, "every window: 94", "lbl", "end");

    // crosshair + tooltip, snapping to the five budgets
    const cross = el("line", { y1: m.t, y2: H - m.b, class: "crosshair", visibility: "hidden" }, svg);
    const show = (i) => {
      cross.setAttribute("x1", x(TRIG.x[i]));
      cross.setAttribute("x2", x(TRIG.x[i]));
      cross.setAttribute("visibility", "visible");
      const head = TRIG.x[i] === 100 ? "Every window described"
        : `${TRIG.x[i]}% of windows sent · τ = ${TRIG.tau[i]} · ${TRIG.cost[i]} s VLM per s`;
      tip.show(x(TRIG.x[i]), y((TRIG.ours[i] + TRIG.base[i]) / 2), head, [
        { color: C1, value: String(TRIG.ours[i]), label: "trigger (ours)" },
        { color: C2, value: String(TRIG.base[i]), label: "every N-th window" },
      ]);
    };
    const hide = () => { cross.setAttribute("visibility", "hidden"); tip.hide(); };
    const hit = el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, class: "hit" }, svg);
    hit.addEventListener("pointermove", (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      let best = 0;
      TRIG.x.forEach((v, i) => { if (Math.abs(x(v) - px) < Math.abs(x(TRIG.x[best]) - px)) best = i; });
      show(best);
    });
    hit.addEventListener("pointerleave", hide);
    keys(svg, TRIG.x.length, show, hide);
  }

  // ── 2. state memory: dumbbells, captions → + states ──
  const STATES = [
    { k: "Open / close / on / off actions found", a: 25, b: 43, an: "17 of 69", bn: "30 of 69" },
    { k: "All actions found", a: 26, b: 31, an: "81 of 307", bn: "94 of 307" },
    { k: "Diary rows correct (precision)", a: 15, b: 15, an: "15%", bn: "15%" },
    { k: "Question accuracy, 1-minute clips", a: 77, b: 80, an: "77%", bn: "80%" },
  ];

  function drawStates(box) {
    const narrow = box.clientWidth < 520;
    const rowH = 58, m = { l: 4, r: narrow ? 70 : 120, t: 8, b: 30 };
    const { svg, W, H, tip } = frame(box, m.t + rowH * STATES.length + m.b,
      "Dumbbell chart, captions versus state memory: state actions 25 to 43 percent, all actions 26 to 31, precision 15 to 15, question accuracy 77 to 80.");
    const x = scale(0, 100, m.l + 6, W - m.r);

    const g = el("g", { class: "grid" }, svg);
    [0, 25, 50, 75, 100].forEach((v) => {
      el("line", { x1: x(v), x2: x(v), y1: m.t, y2: H - m.b + 4 }, g);
      text(svg, x(v), H - 8, v + "%", "tick", "middle");
    });

    const rows = STATES.map((d, i) => {
      const top = m.t + i * rowH, cy = top + 38;
      text(svg, m.l + 6, top + 16, d.k, "lbl");
      el("line", { x1: x(d.a), x2: x(d.b), y1: cy, y2: cy, class: "connector" }, svg);
      el("circle", { cx: x(d.a), cy, r: 5, class: "fill-2 ring" }, svg);
      el("circle", { cx: x(d.b), cy, r: 5, class: "fill-1 ring" }, svg);
      const delta = d.b - d.a;
      text(svg, x(Math.max(d.a, d.b)) + 12, cy + 4, `${d.b}%`, "lbl strong");
      if (!narrow) text(svg, x(Math.max(d.a, d.b)) + 46, cy + 4, delta ? `+${delta} pts` : "no change", "lbl");
      const hit = el("rect", { x: 0, y: top, width: W, height: rowH, class: "hit" }, svg);
      return { hit, cy, d };
    });

    const show = (i) => {
      const { cy, d } = rows[i];
      tip.show(x(d.b), cy, d.k, [
        { color: C1, value: d.bn, label: "with state memory" },
        { color: C2, value: d.an, label: "plain captions" },
      ]);
    };
    rows.forEach((r, i) => {
      r.hit.addEventListener("pointermove", () => show(i));
      r.hit.addEventListener("pointerleave", tip.hide);
    });
    keys(svg, rows.length, show, tip.hide);
  }

  // ── 3. one minute vs a morning: slope chart ──
  const SPAN = [
    { name: "Mnemo", cls: "1", v: [76, 76], note: ["yes→yes 55/106 · invented 3/120", "yes→yes 15/24 · invented 0/14"] },
    { name: "Direct VLM", cls: "2", v: [88, 66], note: ["yes→yes 80/106 · invented 1/120", "yes→yes 12/24 · invented 1/14"] },
  ];

  function drawSpan(box) {
    const narrow = box.clientWidth < 520;
    const { svg, W, H, tip } = frame(box, narrow ? 280 : 320,
      "Slope chart, question accuracy: Mnemo 76 percent over one minute and 76 over a morning; direct VLM 88 and 66.");
    const m = { l: 40, r: narrow ? 104 : 150, t: 20, b: 40 };
    const xs = [m.l + 46, W - m.r];
    const y = scale(50, 100, H - m.b, m.t);

    const g = el("g", { class: "grid" }, svg);
    for (let v = 50; v <= 100; v += 10) {
      el("line", { x1: m.l, x2: W - m.r + 20, y1: y(v), y2: y(v) }, g);
      text(svg, m.l - 8, y(v) + 4, v + "%", "tick", "end");
    }
    text(svg, xs[0], H - 12, "One minute", "lbl", "middle");
    text(svg, xs[1], H - 12, narrow ? "2.4-h morning" : "A 2.4-hour morning", "lbl", "middle");

    const pts = [];
    SPAN.forEach((s) => {
      el("line", { x1: xs[0], x2: xs[1], y1: y(s.v[0]), y2: y(s.v[1]), class: "ser-" + s.cls, "stroke-width": 2, "stroke-linecap": "round" }, svg);
      s.v.forEach((v, j) => {
        el("circle", { cx: xs[j], cy: y(v), r: 5, class: `fill-${s.cls} ring` }, svg);
        pts.push({ s, j, v });
      });
      text(svg, xs[0] - 12, y(s.v[0]) + 4, s.v[0] + "%", "lbl", "end");
      text(svg, xs[1] + 12, y(s.v[1]) + 4, `${s.v[1]}%`, "lbl strong");
      text(svg, xs[1] + 46, y(s.v[1]) + 4, s.name, "lbl");
    });

    const show = (i) => {
      const p = pts[i];
      tip.show(xs[p.j], y(p.v), (p.j ? "A 2.4-hour morning" : "One-minute clips") + " · " + p.s.name, [
        { color: p.s.cls === "1" ? C1 : C2, value: p.v + "%", label: p.s.note[p.j] },
      ]);
    };
    pts.forEach((p, i) => {
      const h = el("circle", { cx: xs[p.j], cy: y(p.v), r: 16, class: "hit" }, svg);
      h.addEventListener("pointermove", () => show(i));
      h.addEventListener("pointerleave", tip.hide);
    });
    keys(svg, pts.length, show, tip.hide);
  }

  const DRAW = { trigger: drawTrigger, states: drawStates, span: drawSpan };
  const boxes = [...document.querySelectorAll("[data-chart]")];
  const render = (b) => DRAW[b.dataset.chart] && DRAW[b.dataset.chart](b);
  boxes.forEach(render);

  // redraw when the width changes (not on every height change)
  const widths = new WeakMap();
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver((entries) => entries.forEach((e) => {
      const w = Math.round(e.contentRect.width);
      if (widths.get(e.target) !== w) { widths.set(e.target, w); requestAnimationFrame(() => render(e.target)); }
    }));
    boxes.forEach((b) => { widths.set(b, Math.round(b.clientWidth)); ro.observe(b); });
  }
})();
