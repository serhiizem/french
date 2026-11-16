/* Shared exercise engine for every topic page.
   The topic page defines, before loading this file:
     TOPIC = { num: "02", name: "Conditionnel présent" }
     VOCAB = [ { g: "Group" } | { fr, en, eg? } ]
     EX    = [ { id, title, instr, type: "mc"|"blanks"|"sentence"|"free", items: [...] } ]
   Item shapes:
     mc:       { src, text: "… ___ …", opts: [..], c: indexOfCorrect, why? }
     blanks:   { src, text: "… [] … [] …", ans: [[accepted…], [accepted…]], why? }
     sentence: { src, lead: "Oui," | "", ans: [accepted full answers…], why? }
     free:     { src }  (not graded: included in "Copier" so Claude can correct it)
*/
(function () {
  const KEY = "fr" + TOPIC.num + "-v1";
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { store = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };

  const norm = s => (s || "").toLowerCase().replace(/[’`´]/g, "'").replace(/\s+/g, " ").replace(/\s*'\s*/g, "'").trim();
  const sentNorm = s => norm(s).replace(/[.!?,;…]+/g, " ").replace(/^(oui|non)\s+/, "").replace(/\s+/g, " ").trim();
  const strip = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const $ = s => document.querySelector(s);
  const graded = EX.filter(s => s.type !== "free");
  const TOTAL = graded.reduce((n, s) => n + s.items.length, 0);
  const INPUT_ATTRS = 'autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"';

  function grade(val, accepted, f) {
    const v = f(val);
    if (!v) return "empty";
    if (accepted.some(a => f(a) === v)) return "ok";
    if (accepted.some(a => strip(f(a)) === strip(v))) return "near";
    return "bad";
  }

  /* ---------- Exercise shell ---------- */
  $("#exos").innerHTML = `
    <div class="score">
      <div class="big" id="scoreBig">0/${TOTAL}</div>
      <div style="display:grid; gap:6px; min-width:0;">
        <div class="bar"><i id="scoreBar"></i></div>
        <div class="instr" id="scoreTxt"></div>
      </div>
      <div class="row">
        <button class="btn primary" id="checkAll">Tout vérifier</button>
        <button class="btn" id="copyErr">Copier pour Claude</button>
        <button class="btn ghost" id="resetAll">Effacer tout</button>
      </div>
    </div>
    <div id="resetConfirm" class="warn" hidden>
      <div class="row" style="justify-content:space-between;"><span>Erase all your answers?</span>
      <span class="row"><button class="btn" id="resetYes">Oui, effacer</button><button class="btn ghost" id="resetNo">Annuler</button></span></div>
    </div>
    <textarea id="copyBox" class="copybox" readonly hidden></textarea>
    <div id="exList" style="display:grid; gap:28px;"></div>`;
  document.body.insertAdjacentHTML("beforeend", '<div class="toast" id="toast" hidden></div>');

  /* ---------- Tabs ---------- */
  function show(view) {
    if (!["regle", "vocab", "exos"].includes(view)) view = "regle";
    document.querySelectorAll("section.view").forEach(s => s.hidden = s.id !== view);
    document.querySelectorAll("nav.tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.view === view));
    try { localStorage.setItem(KEY + "-tab", view); } catch (e) {}
  }
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => show(b.dataset.view));
  document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { show(b.dataset.go); window.scrollTo(0, 0); });

  /* ---------- Vocab ---------- */
  const vlist = $("#vlist");
  vlist.innerHTML = VOCAB.map(v => v.g ? `<div class="vgroup">${esc(v.g)}</div>` :
    `<div class="vrow"><div class="fr">${esc(v.fr)}</div><div class="en">${esc(v.en)}</div>${v.eg ? `<div class="eg">${esc(v.eg)}</div>` : ""}</div>`).join("");
  vlist.addEventListener("click", e => { const r = e.target.closest(".vrow"); if (r) r.classList.toggle("show"); });
  $("#hideEn").onchange = e => { vlist.classList.toggle("hide-en", e.target.checked); vlist.querySelectorAll(".vrow").forEach(r => r.classList.remove("show")); };

  /* ---------- Render exercises ---------- */
  const fillTemplate = (text, answers) => { let i = 0; return esc(text).replace(/\[\]/g, () => `<b>${esc(answers[i++] || "")}</b>`); };
  const withStop = s => /[.!?…]$/.test(s.trim()) ? s : s + ".";

  function itemBody(sec, it, id) {
    if (sec.type === "mc") {
      return `<div class="line">${esc(it.text)}</div><div class="mc" data-id="${id}">${it.opts.map((o, k) =>
        `<button type="button" data-k="${k}" aria-pressed="${store[id] === k}">${String.fromCharCode(97 + k)}) ${esc(o)}</button>`).join("")}</div>`;
    }
    if (sec.type === "blanks") {
      let n = 0;
      const line = esc(it.text).replace(/\[\]/g, () => {
        const bid = `${id}-${n}`, w = Math.max(3, it.ans[n][0].length + 1.5); n++;
        return `<input class="blank" id="in-${bid}" data-b="${bid}" style="width:${w}ch" ${INPUT_ATTRS} value="${esc(store[bid] || "")}">`;
      });
      return `<div class="line">${line}</div>`;
    }
    if (sec.type === "sentence") {
      return `<div class="line">${it.lead ? esc(it.lead) + " " : ""}<input class="blank wide" id="in-${id}-0" data-b="${id}-0" ${INPUT_ATTRS} value="${esc(store[id + "-0"] || "")}"></div>`;
    }
    return `<textarea class="free" id="in-${id}-0" data-b="${id}-0" rows="3" spellcheck="false" placeholder="Écris ici…">${esc(store[id + "-0"] || "")}</textarea>`;
  }

  function render() {
    $("#exList").innerHTML = EX.map(sec => {
      const items = sec.items.map((it, i) => {
        const id = `${sec.id}${i + 1}`;
        return `<div class="item" id="it-${id}"><span class="num">${i + 1}</span><div class="src">${it.src}</div>${itemBody(sec, it, id)}<div class="fb" hidden></div></div>`;
      }).join("");
      const badge = sec.type === "free" ? "for Claude" : `${sec.items.length} items`;
      const btn = sec.type === "free" ? "" : `<div class="row"><button class="btn primary" data-check="${sec.id}">Vérifier ${sec.id}</button></div>`;
      return `<div class="exsec" id="sec-${sec.id}">
        <div class="exhead"><h2><span class="L">${sec.id}</span>${esc(sec.title)}</h2><span class="badge" id="badge-${sec.id}">${badge}</span></div>
        <p class="instr">${esc(sec.instr)}</p>
        <div class="items">${items}</div>${btn}
      </div>`;
    }).join("");
  }
  render();

  const list = $("#exList");
  list.addEventListener("input", e => {
    const b = e.target.dataset.b; if (!b) return;
    store[b] = e.target.value; e.target.classList.remove("ok", "bad", "near"); save();
  });
  list.addEventListener("keydown", e => {
    if (e.key !== "Enter" || !e.target.matches("input.blank")) return;
    e.preventDefault();
    const all = [...document.querySelectorAll("input.blank")], nx = all[all.indexOf(e.target) + 1];
    if (nx) nx.focus(); else e.target.blur();
  });
  list.addEventListener("click", e => {
    const opt = e.target.closest(".mc button");
    if (opt) {
      const box = opt.parentElement;
      store[box.dataset.id] = +opt.dataset.k; save();
      box.querySelectorAll("button").forEach(b => { b.setAttribute("aria-pressed", b === opt); b.classList.remove("ok", "bad"); });
      return;
    }
    const c = e.target.closest("[data-check]");
    if (c) { checkSection(c.dataset.check); updateScore(); }
  });

  /* ---------- Checking ---------- */
  const results = {};
  function checkSection(sid) {
    const sec = EX.find(s => s.id === sid);
    if (sec.type === "free") return;
    let ok = 0;
    sec.items.forEach((it, i) => {
      const id = `${sid}${i + 1}`, el = $(`#it-${id}`), fb = el.querySelector(".fb");
      let state, mine, correct;
      if (sec.type === "mc") {
        const pick = store[id];
        state = pick == null ? "empty" : pick === it.c ? "ok" : "bad";
        mine = pick == null ? "" : it.opts[pick];
        correct = esc(it.text).replace("___", `<b>${esc(it.opts[it.c])}</b>`);
        el.querySelectorAll(".mc button").forEach(b => {
          b.classList.remove("ok", "bad");
          if (+b.dataset.k === it.c && state !== "empty") b.classList.add("ok");
          else if (+b.dataset.k === pick) b.classList.add("bad");
        });
      } else if (sec.type === "blanks") {
        const states = it.ans.map((acc, n) => {
          const inp = $(`#in-${id}-${n}`), st = grade(inp.value, acc, norm);
          inp.classList.remove("ok", "bad", "near"); inp.classList.add(st === "empty" ? "bad" : st);
          return st;
        });
        state = states.every(s => s === "ok") ? "ok"
          : states.every(s => s === "empty") ? "empty"
          : states.every(s => s === "ok" || s === "near") ? "near" : "bad";
        mine = it.ans.map((_, n) => $(`#in-${id}-${n}`).value.trim() || "…").join(" / ");
        correct = fillTemplate(it.text, it.ans.map(a => a[0]));
      } else {
        const inp = $(`#in-${id}-0`);
        state = grade(inp.value, it.ans, sentNorm);
        inp.classList.remove("ok", "bad", "near"); inp.classList.add(state === "empty" ? "bad" : state);
        mine = inp.value.trim();
        correct = `${it.lead ? esc(it.lead) + " " : ""}<b>${esc(withStop(it.ans[0]))}</b>`;
      }
      if (state === "ok") ok++;
      results[id] = { state, mine, correct: correct.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"') };
      const why = it.why ? esc(it.why) : "";
      fb.hidden = false;
      fb.className = "fb " + (state === "ok" ? "ok" : state === "near" ? "near" : "bad");
      fb.innerHTML =
        state === "ok" ? `<span class="pen">Très bien !</span>` :
        state === "near" ? `<span class="pen">Presque ! Check the accents.</span><span class="ans">${correct}</span>` :
        state === "empty" ? `<span class="pen">Pas de réponse.</span><span class="ans">${correct}</span>${why ? `<span class="instr">${why}</span>` : ""}` :
        `<span class="ans">${correct}</span>${why ? `<span class="pen">${why}</span>` : ""}`;
    });
    const badge = $(`#badge-${sid}`);
    badge.textContent = `${ok}/${sec.items.length}`;
    badge.classList.toggle("full", ok === sec.items.length);
  }

  function updateScore() {
    const checked = Object.values(results), ok = checked.filter(r => r.state === "ok").length;
    $("#scoreBig").textContent = `${ok}/${TOTAL}`;
    $("#scoreBar").style.width = (100 * ok / TOTAL) + "%";
    $("#scoreTxt").textContent = checked.length === 0 ? `Tap "Vérifier" under each exercise, or check everything at once.`
      : ok === TOTAL ? "Parfait ! Everything is correct."
      : `${checked.length} of ${TOTAL} checked · ${checked.length - ok} to review.`;
  }
  updateScore();

  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); }

  const checkAll = () => { graded.forEach(s => checkSection(s.id)); updateScore(); };
  $("#checkAll").onclick = () => { checkAll(); toast("Tout est vérifié"); };

  $("#copyErr").onclick = () => {
    checkAll();
    const errs = Object.entries(results).filter(([, r]) => r.state !== "ok")
      .map(([id, r]) => `${id}: I wrote "${r.mine || "—"}" · correct: ${r.correct}`);
    const free = EX.filter(s => s.type === "free").flatMap(s => s.items.map((it, i) => {
      const v = (store[`${s.id}${i + 1}-0`] || "").trim();
      return v ? `${s.id}${i + 1} (${it.src.replace(/<[^>]+>/g, "")}): ${v}` : "";
    })).filter(Boolean);
    let text = `Topic ${TOPIC.num} (${TOPIC.name}): ${TOTAL - errs.length}/${TOTAL}.`;
    text += errs.length ? `\nMy mistakes:\n${errs.join("\n")}` : " No mistakes.";
    if (free.length) text += `\n\nPlease correct my free writing:\n${free.join("\n")}`;
    const box = $("#copyBox"); box.value = text;
    const fallback = () => { box.hidden = false; box.focus(); box.select(); toast("Select the text below and copy it"); };
    try {
      navigator.clipboard.writeText(text).then(() => { box.hidden = true; toast("Copied. Paste it to Claude."); }, fallback);
    } catch (e) { fallback(); }
  };

  $("#resetAll").onclick = () => { $("#resetConfirm").hidden = false; };
  $("#resetNo").onclick = () => { $("#resetConfirm").hidden = true; };
  $("#resetYes").onclick = () => {
    store = {}; save(); for (const k in results) delete results[k];
    render(); updateScore();
    EX.forEach(s => { if (s.type !== "free") { const b = $(`#badge-${s.id}`); b.textContent = `${s.items.length} items`; b.classList.remove("full"); } });
    $("#resetConfirm").hidden = true; $("#copyBox").hidden = true; toast("Answers erased");
  };

  let startTab = "regle"; try { startTab = localStorage.getItem(KEY + "-tab") || "regle"; } catch (e) {}
  show(startTab);
})();
