// Demonstration section (index.html #demo). Data: assets/data/demo.js → window.MNEMO_DATA,
// exported from a finished benchmark run by the code repo's `python -m evaluation.export_demo`.
// All data is inserted with textContent, never innerHTML.
(function () {
  const D = window.MNEMO_DATA;
  if (!D) return;
  const $ = (id) => document.getElementById(id);
  const mk = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  // ── 1. replay: video + window scores + diary rows ──
  const ex = D.example, video = $("replay"), tl = $("tl"), rowsBox = $("rows"), foot = $("rows-foot");
  if (ex && video && tl && rowsBox) {
    const WIN = 4, LEN = ex.windows.length * WIN, TAU = 0.6;

    ex.windows.forEach((w) => {
      const b = mk("button", w.called ? "called" : "");
      b.setAttribute("aria-label", `${mmss(w.t)} to ${mmss(w.t + WIN)}: score ${w.score.toFixed(2)}, ${w.called ? "sent to the VLM" : "skipped"}`);
      b.title = `${mmss(w.t)}–${mmss(w.t + WIN)} · score ${w.score.toFixed(2)} · ${w.called ? "sent to VLM" : "skipped"}`;
      const bar = mk("span");
      bar.style.height = Math.max(4, w.score * 100) + "%";
      b.appendChild(bar);
      b.addEventListener("click", () => { video.currentTime = w.t + 0.05; sync(); });
      tl.appendChild(b);
    });
    const thr = mk("div", "thr");
    thr.style.top = (1 - TAU) * 100 + "%";
    tl.appendChild(thr);
    const head = mk("div", "head");
    tl.appendChild(head);

    // diary rows grouped by window; skipped windows get a muted line of their own
    const diary = [];
    ex.windows.forEach((w) => {
      if (!w.called) {
        diary.push({ show: w.t + WIN, t: w.t, text: `window skipped, score ${w.score.toFixed(2)}`, skip: true });
        return;
      }
      const lines = ex.log.filter((r) => Math.round(r.t) === w.t);
      if (!lines.length) diary.push({ show: w.t + WIN, t: w.t, text: "nothing new", skip: true });
      lines.forEach((r) => diary.push({ show: w.t + WIN, t: r.t, text: `${r.verb} ${r.object}`.trim(), state: r.state }));
    });
    const diaryEls = diary.map((r) => {
      const row = mk("div", "row" + (r.skip ? " skip" : ""));
      row.append(mk("span", "t", mmss(r.t)), mk("span", null, r.text));
      row.appendChild(r.state ? mk("span", "b st", "state") : mk("span"));
      return row;
    });
    const truthEls = ex.truth.map((r) => {
      const row = mk("div", "row");
      row.append(mk("span", "t", mmss(r.t)), mk("span", null, r.narration));
      row.appendChild(r.found ? mk("span", "b found", "✓ in diary") : mk("span"));
      return row;
    });
    const called = ex.windows.filter((w) => w.called).length;
    let tab = "diary", showAll = false, lastVisible = -1;

    function setFoot() {
      foot.replaceChildren();
      if (tab === "diary") {
        foot.append(`${ex.log.length} rows from ${called} of ${ex.windows.length} windows sent to the VLM. `);
        const a = mk("a", null, showAll ? "Follow the video" : "Show all rows");
        a.href = "#player";
        a.addEventListener("click", (e) => { e.preventDefault(); showAll = !showAll; lastVisible = -1; sync(); setFoot(); });
        foot.appendChild(a);
      } else {
        foot.textContent = `${ex.found} of ${ex.true} annotated actions matched a diary row under strict scoring ` +
          "(the exact EPIC verb and noun class within ±2 s). Many misses are near misses, such as \"place\" vs. \"put down\".";
      }
    }
    function sync() {
      const t = video.currentTime || 0;
      head.style.left = `calc(${Math.min(1, t / LEN) * 100}% - 1px)`;
      if (tab !== "diary") return;
      let visible = 0;
      diary.forEach((r, i) => {
        const on = showAll || video.ended || r.show <= t + 0.01;
        diaryEls[i].classList.toggle("future", !on);
        if (on) visible = i + 1;
      });
      if (visible !== lastVisible) {
        diaryEls.forEach((e, i) => e.classList.toggle("new", !showAll && i < visible && diary[i].show === diary[visible - 1]?.show));
        if (!showAll && visible) diaryEls[visible - 1].scrollIntoView({ block: "nearest" });
        lastVisible = visible;
      }
      if (!visible && !rowsBox.querySelector(".hint")) {
        rowsBox.prepend(mk("div", "row info hint", "Press play: each window's rows appear when it finishes."));
      }
      rowsBox.querySelector(".hint")?.classList.toggle("future", visible > 0);
    }
    function setTab(name) {
      tab = name;
      document.querySelectorAll("#player [role=tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
      rowsBox.replaceChildren(...(name === "diary" ? diaryEls : truthEls));
      rowsBox.scrollTop = 0;
      lastVisible = -1;
      setFoot();
      sync();
    }
    document.querySelectorAll("#player [role=tab]").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));

    let raf = 0;
    const loop = () => { sync(); raf = video.paused ? 0 : requestAnimationFrame(loop); };
    video.addEventListener("play", () => { if (!raf) raf = requestAnimationFrame(loop); });
    ["seeked", "pause", "ended", "timeupdate"].forEach((ev) => video.addEventListener(ev, sync));
    setTab("diary");
  }

  // ── 2. questions about the morning ──
  const qlist = $("qlist"), answer = $("answer");
  if (qlist && answer && D.questions) {
    const yesno = D.questions.map((q) => ({ ...q, kind: "yesno" }));
    const when = (D.when || []).map((q) => ({ ...q, kind: "when" }));
    const sets = {
      all: yesno, yes: yesno.filter((q) => q.expect), no: yesno.filter((q) => !q.expect), when,
    };
    const ok = (q, yes) => yes === q.expect;
    const m = yesno.filter((q) => ok(q, q.mnemo_yes)).length, d = yesno.filter((q) => ok(q, q.direct_yes)).length;
    let current = null;

    function verdict(good) {
      return mk("span", "verdict " + (good ? "ok" : "bad"), good ? "✓ correct" : "✗ wrong");
    }
    function who(label, text, v) {
      const w = mk("div", "who");
      const wl = mk("div", "wl");
      wl.append(mk("span", null, label));
      if (v) wl.append(v);
      w.append(wl, mk("p", null, text));
      return w;
    }
    function render(q) {
      current = q;
      answer.replaceChildren();
      const eb = mk("div", "eyebrow", q.kind === "when" ? "Asked for a time" : q.expect ? "This happened" : "This never happened");
      answer.append(eb, mk("h3", null, q.q));
      if (q.kind === "when") {
        answer.append(who("Mnemo, from its diary", q.answer, verdict(q.correct)));
        answer.append(who("Direct VLM", "Not comparable: it sees frames without timestamps, so it cannot give a clock time.", null));
        const s = mk("div", "score");
        const a = mk("div"); a.append(mk("b", null, `${when.filter((x) => x.correct).length} / ${when.length}`), "right clock time, Mnemo");
        s.append(a);
        answer.append(s);
      } else {
        answer.append(who("Mnemo, from its diary", q.mnemo, verdict(ok(q, q.mnemo_yes))));
        answer.append(who("Direct VLM, shown the whole morning", q.direct, verdict(ok(q, q.direct_yes))));
        const s = mk("div", "score");
        const a = mk("div"); a.append(mk("b", null, `${m} / ${yesno.length}`), "correct, Mnemo");
        const b = mk("div"); b.append(mk("b", null, `${d} / ${yesno.length}`), "correct, direct VLM");
        s.append(a, b);
        answer.append(s);
      }
      qlist.querySelectorAll("button").forEach((b) => b.setAttribute("aria-current", String(b._q === q)));
    }
    function fill(name) {
      qlist.replaceChildren();
      sets[name].forEach((q) => {
        const li = mk("li"), b = mk("button");
        b._q = q;
        b.append(mk("span", null, q.q), mk("span", "k", q.kind === "when" ? "when" : q.expect ? "happened" : "never"));
        b.addEventListener("click", () => render(q));
        li.appendChild(b);
        qlist.appendChild(li);
      });
      render(sets[name][0]);
    }
    document.querySelectorAll("#ask .chip").forEach((c) => c.addEventListener("click", () => {
      document.querySelectorAll("#ask .chip").forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      fill(c.dataset.f);
    }));
    fill("all");
  }

  // ── 3. search the morning diary ──
  const input = $("q"), srows = $("srows");
  if (input && srows && D.morning) {
    const log = D.morning.log;
    $("n-rows").textContent = String(log.length);
    const lower = log.map((r) => [r.verb, r.object, r.place, r.where].join(" ").toLowerCase());

    function highlight(str, q) {
      const frag = document.createDocumentFragment();
      if (!q) { frag.append(str); return frag; }
      const s = str.toLowerCase();
      let i = 0, j;
      while ((j = s.indexOf(q, i)) !== -1) {
        frag.append(str.slice(i, j), mk("mark", null, str.slice(j, j + q.length)));
        i = j + q.length;
      }
      frag.append(str.slice(i));
      return frag;
    }
    function run() {
      const q = input.value.trim().toLowerCase();
      const hits = [];
      lower.forEach((s, i) => { if (!q || s.includes(q)) hits.push(i); });
      srows.replaceChildren();
      srows.appendChild(mk("div", "row info", q ? `${hits.length} of ${log.length} rows match "${input.value.trim()}"` : `${log.length} rows, 09:00 to 11:23`));
      hits.slice(0, 300).forEach((i) => {
        const r = log[i], row = mk("div", "row");
        const what = mk("span");
        what.append(highlight(`${r.verb} ${r.object}`.trim(), q));
        if (r.state) what.append(" ", mk("span", "b st", "state"));
        const where = [r.place, r.where && r.where !== r.place ? "→ " + r.where : ""].filter(Boolean).join(" ");
        const p = mk("span", "p");
        p.append(highlight(where, q));
        row.append(mk("span", "t", r.start), what, p);
        srows.appendChild(row);
      });
      if (hits.length > 300) srows.appendChild(mk("div", "row info", `… ${hits.length - 300} more. Narrow the search.`));
    }
    input.addEventListener("input", run);
    run();
  }
})();
