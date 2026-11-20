/*
 * LearnPrompting — app logic.
 * No dependencies, no backend. Everything is stored in this browser only.
 * User content is only ever written with textContent (never innerHTML).
 * Refs #1
 */
(function () {
  "use strict";
  const { SECTIONS, FRAMEWORKS, WORKED_EXAMPLE } = window.PROMPT_DATA;
  const $ = (id) => document.getElementById(id);

  /* ---------------- storage (local to this browser) ---------------- */
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); return true; }
      catch { return false; }
    },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
  };
  const K = { settings: "lp.settings", builder: "lp.builder", prompts: "lp.prompts", chats: "lp.chats", activeChat: "lp.activeChat" };
  const keyStoreName = (p) => "lp.key." + p;

  function el(tag, props, ...children) {
    const e = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children) if (c) e.append(c);
    return e;
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  function flash(node, text, cls) {
    node.textContent = text; node.className = "note " + (cls || "");
    clearTimeout(node._t); node._t = setTimeout(() => { node.textContent = ""; }, 4000);
  }

  /* ================================================================
   * COLOUR THEMES   Refs #7
   * ================================================================ */
  // Same themes and one-tap dots as PSX Dashboard, PK Wealth and CyberWatch
  const THEMES = [
    ["auto", "Auto (follow device)"], ["light", "Light"], ["dark", "Dark"], ["bluegray", "Blue Gray"],
    ["black", "Black"], ["terminal", "Terminal"], ["red", "Red"],
    // CyberWatch's four, with its colours
    ["obsidian", "Obsidian (CyberWatch)"], ["crimson", "Crimson (CyberWatch)"], ["midnight", "Midnight (CyberWatch)"], ["arctic", "Arctic (CyberWatch)"]
  ];
  function applyTheme(id) {
    const ok = THEMES.some(t => t[0] === id) ? id : "auto";
    document.documentElement.setAttribute("data-theme", ok);
    try { localStorage.setItem("lp.theme", ok); } catch { /* ignore */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", getComputedStyle(document.documentElement).getPropertyValue("--panel").trim() || "#1d4ed8");
    $("themeSwitcher").querySelectorAll("[data-t]").forEach(b => {
      const on = b.dataset.t === ok;
      b.classList.toggle("active", on);
      b.setAttribute("aria-checked", String(on));
    });
  }
  (function setupThemes() {
    const row = $("themeSwitcher");
    THEMES.forEach(([id, label]) => {
      if (id === "obsidian") row.append(el("span", { class: "sw-sep", "aria-hidden": "true" }));
      row.append(el("button", { type: "button", class: "sw sw-" + id, role: "radio", "aria-checked": "false",
        "data-t": id, title: label, "aria-label": label + " theme" }));
    });
    row.addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (b) applyTheme(b.dataset.t); });
    applyTheme(document.documentElement.getAttribute("data-theme") || "auto");
    try {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (document.documentElement.getAttribute("data-theme") === "auto") applyTheme("auto");
      });
    } catch { /* older browsers */ }
  })();

  /* ---------------- tabs ---------------- */
  function showTab(name) {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".tab-panel").forEach(p => { p.hidden = p.id !== "tab-" + name; });
    if (name === "library") renderLibrary();
  }
  document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));

  /* ================================================================
   * MODEL SETTINGS
   * ================================================================ */
  const PROVIDERS = {
    openai:    { label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"], tempMax: 2 },
    anthropic: { label: "Claude", models: ["claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-5-5"], tempMax: 1 },
    gemini:    { label: "Gemini", models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"], tempMax: 2 }
  };
  const settings = Object.assign(
    { provider: "openai", models: {}, temp: 0.7, maxTok: 1024, topP: 1, sendTopP: false, system: "" },
    store.get(K.settings, {})
  );
  const saveSettings = () => store.set(K.settings, settings);

  function linkPair(rangeId, numId, keyName) {
    const r = $(rangeId), n = $(numId);
    r.value = n.value = settings[keyName];
    r.addEventListener("input", () => { n.value = r.value; settings[keyName] = +r.value; saveSettings(); });
    n.addEventListener("input", () => { r.value = n.value; settings[keyName] = +n.value; saveSettings(); });
  }
  linkPair("temp", "tempNum", "temp");
  linkPair("maxTok", "maxTokNum", "maxTok");
  linkPair("topP", "topPNum", "topP");
  $("sendTopP").checked = settings.sendTopP;
  $("sendTopP").addEventListener("change", e => { settings.sendTopP = e.target.checked; saveSettings(); });
  $("system").value = settings.system;
  $("system").addEventListener("input", e => { settings.system = e.target.value; saveSettings(); });

  function selectProvider(p) {
    settings.provider = p; saveSettings();
    const cfg = PROVIDERS[p];
    document.querySelectorAll("#providers button").forEach(b => b.classList.toggle("active", b.dataset.p === p));
    const dl = $("modelList"); dl.replaceChildren(...cfg.models.map(m => el("option", { value: m })));
    $("model").value = settings.models[p] || cfg.models[0];
    $("temp").max = $("tempNum").max = cfg.tempMax;
    if (settings.temp > cfg.tempMax) { settings.temp = cfg.tempMax; $("temp").value = $("tempNum").value = cfg.tempMax; saveSettings(); }
    $("tempInfo").textContent = "(0–" + cfg.tempMax + " for " + cfg.label + ")";
    const saved = store.get(keyStoreName(p), "");
    $("apiKey").value = saved || "";
    $("rememberKey").checked = !!saved;
  }
  document.querySelectorAll("#providers button").forEach(b => b.addEventListener("click", () => selectProvider(b.dataset.p)));
  $("model").addEventListener("change", () => { settings.models[settings.provider] = $("model").value.trim(); saveSettings(); });

  $("toggleKey").addEventListener("click", () => {
    const k = $("apiKey"); k.type = k.type === "password" ? "text" : "password";
    $("toggleKey").textContent = k.type === "password" ? "show" : "hide";
  });
  function syncKey() {
    const v = $("apiKey").value.trim();
    if ($("rememberKey").checked && v) store.set(keyStoreName(settings.provider), v);
    else store.del(keyStoreName(settings.provider));
  }
  $("rememberKey").addEventListener("change", syncKey);
  $("apiKey").addEventListener("change", syncKey);

  /* ================================================================
   * PROMPT BUILDER (English + Urdu)   Refs #1, #6
   * ================================================================ */
  const UR = window.PROMPT_DATA_UR;
  const UI_EN = {
    frameworkLabel: "Prompt framework",
    fillExample: "Fill worked example",
    reset: "Reset to presets",
    tip: "Choose a preset in each box, then rewrite it for your situation. Replace every [placeholder]. Open \"Think it through\" for the questions a good prompt answers.",
    yourPrompt: "Your prompt",
    headings: "Section headings",
    runNow: "Run now ▶",
    toChat: "Edit in chat",
    copy: "Copy",
    saveName: "Name this prompt to save it…",
    save: "Save",
    think: "Think it through",
    writeOwn: "✏️ Write my own",
    include: "Include",
    years: "Years:",
    placeholdersLeft: (n, list) => "⚠ " + n + " placeholder" + (n > 1 ? "s" : "") + " still to fill: " + list,
    ready: "✓ No placeholders left. Ready to run.",
    stats: (w, t) => w + " words · ~" + t + " tokens",
    replaced: "Previous text replaced.",
    undo: "Undo",
    exampleLoaded: "Worked example loaded: a security code review. Read each box to see how the parts fit together.",
    resetDone: "Boxes reset to their default presets.",
    copied: "Copied to clipboard.",
    copyBlocked: "Copy blocked by the browser. The text is selected: press Ctrl+C.",
    empty: "The prompt is empty.",
    nothingToSave: "Nothing to save yet.",
    needName: "Give the prompt a name first.",
    saved: "Saved to My library.",
    saveFailed: "Could not save: browser storage is full or blocked."
  };

  // builder.sections[lang][key] = { preset: index | -1 (custom), text, on }
  const builder = Object.assign({ framework: "ropcf", years: 10, headings: true, lang: "en", sections: {} }, store.get(K.builder, {}));
  if (!builder.sections.en && !builder.sections.ur) builder.sections = { en: builder.sections }; // migrate v1 (English only)
  builder.sections.en = builder.sections.en || {};
  builder.sections.ur = builder.sections.ur || {};
  const saveBuilder = () => store.set(K.builder, builder);

  const isUr = () => builder.lang === "ur";
  const SEC = () => (isUr() ? UR.SECTIONS : SECTIONS);
  const T = () => (isUr() ? UR.UI : UI_EN);
  const EXAMPLE = () => (isUr() ? UR.WORKED_EXAMPLE : WORKED_EXAMPLE);
  const states = () => builder.sections[builder.lang];
  const fillYears = (text) => text.replace(/\{years\}/g, String(builder.years || "[x]"));
  const yearsPattern = () => (isUr() ? UR.yearsPattern : /(\d+|\[x\]) years of/);
  const yearsReplace = (y) => (isUr() ? UR.yearsReplace(y) : y + " years of");

  function currentFramework() { return FRAMEWORKS.find(f => f.id === builder.framework) || FRAMEWORKS[0]; }
  const fwName = (fw) => (isUr() ? UR.FRAMEWORK_TEXT[fw.id].name : fw.name);
  const fwAbout = (fw) => (isUr() ? UR.FRAMEWORK_TEXT[fw.id].about : fw.about);
  function secLabel(fw, def) {
    if (isUr()) { const o = UR.FRAMEWORK_TEXT[fw.id].labels; return (o && o[def.key]) || UR.SECTIONS[def.key].label; }
    return def.label || SECTIONS[def.key].label;
  }

  function sectionState(key, def) {
    const all = states();
    if (!all[key]) {
      const pi = def && Number.isInteger(def.preset) ? def.preset : 0;
      all[key] = { preset: pi, text: fillYears(SEC()[key].presets[pi].text), on: !(def && def.optional) };
    }
    return all[key];
  }

  function applyBuilderLanguage() {
    const t = T();
    const panel = $("tab-builder");
    panel.dir = isUr() ? "rtl" : "ltr";
    panel.lang = isUr() ? "ur" : "en";
    panel.classList.toggle("lang-ur", isUr());
    $("fwLabel").textContent = t.frameworkLabel;
    $("fillExample").textContent = t.fillExample;
    $("resetBuilder").textContent = t.reset;
    $("builderTip").textContent = t.tip;
    $("yourPrompt").textContent = t.yourPrompt;
    $("headingsLabel").textContent = t.headings;
    $("runNow").textContent = t.runNow;
    $("toChat").textContent = t.toChat;
    $("copyPrompt").textContent = t.copy;
    $("saveName").placeholder = t.saveName;
    $("savePrompt").textContent = t.save;
    $("lang").value = builder.lang;
  }

  function renderFrameworkSelect() {
    const sel = $("framework");
    sel.replaceChildren(...FRAMEWORKS.map(f => el("option", { value: f.id, text: fwName(f) })));
    sel.value = builder.framework;
  }
  $("framework").addEventListener("change", () => { builder.framework = $("framework").value; saveBuilder(); renderSections(); });
  $("lang").addEventListener("change", () => {
    builder.lang = $("lang").value === "ur" ? "ur" : "en";
    saveBuilder(); applyBuilderLanguage(); renderFrameworkSelect(); renderSections();
  });

  function renderSections() {
    const fw = currentFramework();
    const t = T();
    $("fwAbout").textContent = fwAbout(fw);
    const wrap = $("sections"); wrap.replaceChildren();
    fw.sections.forEach((def, i) => {
      const s = SEC()[def.key];
      const st = sectionState(def.key, def);
      const label = secLabel(fw, def);

      const ta = el("textarea", { rows: 7, spellcheck: "true", "aria-label": label, dir: "auto" });
      ta.value = st.text;
      ta.addEventListener("input", () => { st.text = ta.value; saveBuilder(); assemble(); });

      const sel = el("select", { "aria-label": label });
      s.presets.forEach((p, idx) => sel.append(el("option", { value: idx, text: p.name })));
      sel.append(el("option", { value: -1, text: t.writeOwn }));
      sel.value = st.preset;

      const undoBox = el("div", { class: "undo", hidden: true });
      sel.addEventListener("change", () => {
        const prev = st.text, prevPreset = st.preset;
        st.preset = +sel.value;
        st.text = st.preset >= 0 ? fillYears(s.presets[st.preset].text) : "";
        ta.value = st.text; saveBuilder(); assemble();
        if (prev.trim() && prev !== st.text) {
          const btn = el("button", { type: "button", text: t.undo,
            onclick: () => { st.text = prev; st.preset = prevPreset; ta.value = prev; sel.value = prevPreset; undoBox.hidden = true; saveBuilder(); assemble(); } });
          undoBox.replaceChildren(document.createTextNode(t.replaced + " "), btn);
          undoBox.hidden = false;
          clearTimeout(undoBox._t); undoBox._t = setTimeout(() => { undoBox.hidden = true; }, 10000);
        }
        if (st.preset === -1) ta.focus();
      });

      const controls = el("div", { class: "card-controls" }, sel);
      if (def.key === "persona") {
        const yrs = el("input", { type: "number", min: 0, max: 60, value: builder.years, "aria-label": t.years });
        yrs.addEventListener("input", () => {
          builder.years = yrs.value;
          st.text = st.text.replace(yearsPattern(), yearsReplace(builder.years || "[x]"));
          ta.value = st.text; saveBuilder(); assemble();
        });
        controls.append(el("span", { class: "years" }, document.createTextNode(t.years), yrs));
      } else {
        controls.append(el("span"));
      }

      const guide = el("details", null,
        el("summary", { text: t.think }),
        el("ul", null, ...s.guide.map(q => el("li", { text: q }))));

      const head = el("div", { class: "card-head" },
        el("h3", null, el("span", { class: "num-badge", text: String(i + 1) }), document.createTextNode(label)));
      const card = el("div", { class: "card" + (st.on ? "" : " off") }, head, controls, ta, undoBox, guide);

      if (def.optional) {
        const cb = el("input", { type: "checkbox" }); cb.checked = st.on;
        cb.addEventListener("change", () => { st.on = cb.checked; card.classList.toggle("off", !st.on); saveBuilder(); assemble(); });
        head.append(el("label", { class: "check" }, cb, document.createTextNode(t.include)));
      } else {
        st.on = true;
      }
      wrap.append(card);
    });
    assemble();
  }

  const PLACEHOLDER_RE = /\[(?!REDACTED\])[^\]\n]{1,80}\]/g;

  function assemble() {
    const fw = currentFramework();
    const t = T();
    const parts = [];
    fw.sections.forEach(def => {
      const st = states()[def.key];
      if (!st || !st.on || !st.text.trim()) return;
      parts.push(builder.headings ? "## " + secLabel(fw, def) + "\n" + st.text.trim() : st.text.trim());
    });
    const text = parts.join("\n\n");
    $("assembled").value = text;

    // ignore code fences and Markdown checkboxes "[ ]"
    const scan = text.replace(/```[\s\S]*?```/g, "");
    const uniq = [...new Set((scan.match(PLACEHOLDER_RE) || []).filter(p => p.trim() !== "[ ]" && p !== "[ ]"))];
    const note = $("placeholderNote");
    if (uniq.length) {
      note.className = "note warn";
      note.textContent = t.placeholdersLeft(uniq.length, uniq.slice(0, 8).join(isUr() ? "، " : ", ") + (uniq.length > 8 ? " …" : ""));
    } else if (text) {
      note.className = "note ok"; note.textContent = t.ready;
    } else { note.textContent = ""; }
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    // Urdu script typically costs ~2–3x more tokens per character than English
    const tokens = Math.ceil(text.length / (isUr() ? 1.6 : 4));
    $("promptStats").textContent = t.stats(words, tokens);
    return text;
  }

  $("useHeadings").checked = builder.headings;
  $("useHeadings").addEventListener("change", e => { builder.headings = e.target.checked; saveBuilder(); assemble(); });

  $("fillExample").addEventListener("click", () => {
    currentFramework().sections.forEach(def => {
      const st = sectionState(def.key, def);
      const ex = EXAMPLE()[def.key];
      if (ex) { st.text = ex; st.preset = -1; st.on = true; }
    });
    saveBuilder(); renderSections();
    flash($("builderMsg"), T().exampleLoaded, "ok");
  });
  $("resetBuilder").addEventListener("click", () => {
    currentFramework().sections.forEach(def => { delete states()[def.key]; });
    saveBuilder(); renderSections();
    flash($("builderMsg"), T().resetDone, "ok");
  });

  $("copyPrompt").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(assemble()); flash($("builderMsg"), T().copied, "ok"); }
    catch { $("assembled").select(); flash($("builderMsg"), T().copyBlocked, "warn"); }
  });
  $("toChat").addEventListener("click", () => {
    $("prompt").value = assemble(); showTab("chat"); $("prompt").focus();
  });
  $("runNow").addEventListener("click", () => {
    const text = assemble();
    if (!text.trim()) { flash($("builderMsg"), T().empty, "warn"); return; }
    showTab("chat");
    sendMessage(text);
  });
  $("savePrompt").addEventListener("click", () => {
    const text = assemble();
    const name = $("saveName").value.trim();
    if (!text.trim()) { flash($("builderMsg"), T().nothingToSave, "warn"); return; }
    if (!name) { flash($("builderMsg"), T().needName, "warn"); $("saveName").focus(); return; }
    const prompts = store.get(K.prompts, []);
    prompts.unshift({ id: uid(), name, framework: fwName(currentFramework()), lang: builder.lang, text, created: new Date().toISOString() });
    if (store.set(K.prompts, prompts)) { $("saveName").value = ""; flash($("builderMsg"), T().saved, "ok"); }
    else flash($("builderMsg"), T().saveFailed, "err");
  });

  /* ================================================================
   * PROVIDER API CALLS
   * ================================================================ */
  async function readJson(res) {
    const raw = await res.text();
    try { return JSON.parse(raw); } catch { return { error: { message: raw.slice(0, 300) || res.statusText } }; }
  }

  async function callOpenAI(p) {
    const body = {
      model: p.model,
      messages: [...(p.system ? [{ role: "system", content: p.system }] : []), ...p.messages],
      temperature: p.temperature,
      max_completion_tokens: p.maxTokens
    };
    if (p.topP !== null) body.top_p = p.topP;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + p.key },
      body: JSON.stringify(body)
    });
    const d = await readJson(res);
    if (!res.ok) throw new Error(d.error?.message || res.statusText);
    return { text: d.choices?.[0]?.message?.content ?? "", usage: d.usage ? d.usage.prompt_tokens + " in / " + d.usage.completion_tokens + " out" : "", stop: d.choices?.[0]?.finish_reason };
  }

  async function callAnthropic(p) {
    const body = { model: p.model, max_tokens: p.maxTokens, temperature: p.temperature, messages: p.messages };
    if (p.system) body.system = p.system;
    if (p.topP !== null) body.top_p = p.topP;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": p.key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(body)
    });
    const d = await readJson(res);
    if (!res.ok) throw new Error(d.error?.message || res.statusText);
    return { text: (d.content || []).filter(c => c.type === "text").map(c => c.text).join(""), usage: d.usage ? d.usage.input_tokens + " in / " + d.usage.output_tokens + " out" : "", stop: d.stop_reason };
  }

  async function callGemini(p) {
    const body = {
      contents: p.messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { temperature: p.temperature, maxOutputTokens: p.maxTokens }
    };
    if (p.topP !== null) body.generationConfig.topP = p.topP;
    if (p.system) body.systemInstruction = { parts: [{ text: p.system }] };
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(p.model) + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": p.key },
      body: JSON.stringify(body)
    });
    const d = await readJson(res);
    if (!res.ok) throw new Error(d.error?.message || res.statusText);
    const c = d.candidates?.[0];
    return { text: (c?.content?.parts || []).map(x => x.text || "").join(""), usage: d.usageMetadata ? (d.usageMetadata.promptTokenCount ?? 0) + " in / " + (d.usageMetadata.candidatesTokenCount ?? 0) + " out" : "", stop: c?.finishReason };
  }
  const CALLERS = { openai: callOpenAI, anthropic: callAnthropic, gemini: callGemini };

  /* ================================================================
   * CHATS (saved in this browser)
   * ================================================================ */
  let chats = store.get(K.chats, []);
  let activeId = store.get(K.activeChat, null);
  const saveChats = () => { if (!store.set(K.chats, chats)) console.warn("Chat history could not be saved (storage full or blocked)."); store.set(K.activeChat, activeId); };
  const activeChat = () => chats.find(c => c.id === activeId) || null;

  function newChat() {
    const c = { id: uid(), title: "New chat", created: new Date().toISOString(), messages: [] };
    chats.unshift(c); activeId = c.id; saveChats(); renderChatList(); renderMessages();
    return c;
  }

  function renderChatList() {
    const ul = $("chatList"); ul.replaceChildren();
    chats.forEach(c => {
      const li = el("li", { class: c.id === activeId ? "active" : "" },
        el("button", { type: "button", class: "open", text: c.title, title: c.title, onclick: () => { activeId = c.id; saveChats(); renderChatList(); renderMessages(); } }),
        el("button", { type: "button", class: "del", text: "✕", title: "Delete chat", "aria-label": "Delete chat " + c.title, onclick: () => {
          chats = chats.filter(x => x.id !== c.id);
          if (activeId === c.id) activeId = chats[0]?.id || null;
          saveChats(); renderChatList(); renderMessages();
        } }));
      ul.append(li);
    });
  }

  function msgNode(m) {
    const div = el("div", { class: "msg " + m.role, text: m.content, dir: "auto" });
    if (m.meta || m.role === "assistant") {
      const meta = el("div", { class: "meta" }, el("span", { text: m.meta || "" }));
      if (m.role === "assistant") {
        const b = el("button", { type: "button", text: "Copy" });
        b.addEventListener("click", async () => {
          try { await navigator.clipboard.writeText(m.content); b.textContent = "Copied"; } catch { b.textContent = "Copy failed"; }
          setTimeout(() => { b.textContent = "Copy"; }, 1500);
        });
        meta.append(b);
      }
      div.append(meta);
    }
    return div;
  }

  function renderMessages() {
    const box = $("messages"); box.replaceChildren();
    const c = activeChat();
    if (!c || !c.messages.length) {
      box.append(el("div", { class: "empty", text: "Build a prompt in step 1 and press Run, or type below. Pick a provider and paste your API key on the left first." }));
      return;
    }
    c.messages.forEach(m => box.append(msgNode(m)));
    box.scrollTop = box.scrollHeight;
  }

  function addError(text) {
    const box = $("messages"); box.querySelector(".empty")?.remove();
    box.append(el("div", { class: "msg error", text }));
    box.scrollTop = box.scrollHeight;
  }

  let busy = false;
  async function sendMessage(text) {
    if (busy) return;
    const key = $("apiKey").value.trim();
    const model = $("model").value.trim();
    if (!key) { addError("Please paste an API key in the Model settings panel."); return; }
    if (!model) { addError("Please enter a model ID."); return; }

    const c = activeChat() || newChat();
    const userMsg = { role: "user", content: text };
    c.messages.push(userMsg);
    if (c.title === "New chat") c.title = text.replace(/^#+\s*\S+.*\n?/, "").trim().slice(0, 50) || text.slice(0, 50);
    saveChats(); renderChatList(); renderMessages();

    busy = true; $("send").disabled = true; $("runNow").disabled = true;
    const pending = el("div", { class: "msg assistant", text: "…" });
    $("messages").append(pending);

    const provider = settings.provider;
    const params = {
      key, model,
      system: settings.system.trim(),
      messages: c.messages.filter(m => m.role === "user" || m.role === "assistant").map(m => ({ role: m.role, content: m.content })),
      temperature: +$("tempNum").value,
      maxTokens: parseInt($("maxTokNum").value, 10),
      topP: settings.sendTopP ? +$("topPNum").value : null
    };
    const t0 = performance.now();
    try {
      const r = await CALLERS[provider](params);
      const secs = ((performance.now() - t0) / 1000).toFixed(1);
      c.messages.push({ role: "assistant", content: r.text || "(empty response)",
        meta: [PROVIDERS[provider].label, model, "T=" + params.temperature, r.usage, secs + "s", r.stop].filter(Boolean).join(" · ") });
      saveChats(); renderMessages();
    } catch (err) {
      // take the failed message out of the history and put it back in the composer to retry
      c.messages.pop();
      if (!c.messages.length) c.title = "New chat";
      saveChats(); renderChatList(); renderMessages();
      $("prompt").value = text;
      const msg = err.message === "Failed to fetch"
        ? "Network or CORS error. Check your connection and key. If you opened index.html directly from disk, serve it instead: python3 -m http.server"
        : err.message;
      addError("Error from " + PROVIDERS[provider].label + ": " + msg);
    } finally {
      busy = false; $("send").disabled = false; $("runNow").disabled = false;
    }
  }

  $("composer").addEventListener("submit", e => {
    e.preventDefault();
    const t = $("prompt").value.trim();
    if (!t) return;
    $("prompt").value = "";
    sendMessage(t);
  });
  $("prompt").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("composer").requestSubmit(); }
  });
  $("newChat").addEventListener("click", () => { newChat(); $("prompt").focus(); });

  /* ================================================================
   * LIBRARY: saved prompts, export / import
   * ================================================================ */
  function renderLibrary() {
    const list = $("savedList"); list.replaceChildren();
    const prompts = store.get(K.prompts, []);
    if (!prompts.length) {
      list.append(el("p", { class: "tip", text: "No saved prompts yet. Build one in step 1, give it a name and press Save." }));
      return;
    }
    prompts.forEach(p => {
      const actions = el("div", { class: "actions" },
        el("button", { type: "button", class: "primary", text: "Run", onclick: () => { showTab("chat"); sendMessage(p.text); } }),
        el("button", { type: "button", class: "ghost", text: "Edit in chat", onclick: () => { $("prompt").value = p.text; showTab("chat"); $("prompt").focus(); } }),
        el("button", { type: "button", class: "ghost", text: "Copy", onclick: async (e) => {
          try { await navigator.clipboard.writeText(p.text); e.target.textContent = "Copied"; } catch { e.target.textContent = "Copy failed"; }
          setTimeout(() => { e.target.textContent = "Copy"; }, 1500);
        } }),
        el("button", { type: "button", class: "danger", text: "Delete", onclick: () => {
          store.set(K.prompts, store.get(K.prompts, []).filter(x => x.id !== p.id)); renderLibrary();
        } }));
      list.append(el("div", { class: "saved" },
        el("h3", { text: p.name, dir: "auto" }),
        el("div", { class: "sub", text: (p.framework || "") + " · " + new Date(p.created).toLocaleString() }),
        el("pre", { text: p.text, dir: "auto" }),
        actions));
    });
  }

  $("exportData").addEventListener("click", () => {
    const data = { app: "LearnPrompting", version: 1, exported: new Date().toISOString(),
      prompts: store.get(K.prompts, []), chats: store.get(K.chats, []), builder: store.get(K.builder, {}) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = el("a", { href: URL.createObjectURL(blob), download: "learnprompting-backup-" + new Date().toISOString().slice(0, 10) + ".json" });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    flash($("libMsg"), "Export downloaded. It contains your prompts and chats, but no API keys.", "ok");
  });

  const isStr = (v, max) => typeof v === "string" && v.length <= max;
  $("importData").addEventListener("change", async e => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { flash($("libMsg"), "File too large (max 5 MB).", "err"); return; }
    try {
      const d = JSON.parse(await f.text());
      if (d.app !== "LearnPrompting") throw new Error("Not a LearnPrompting export file.");
      // validate shape and merge (never overwrite), skipping anything malformed
      const prompts = (Array.isArray(d.prompts) ? d.prompts : []).filter(p => p && isStr(p.name, 200) && isStr(p.text, 200000))
        .map(p => ({ id: uid(), name: p.name, framework: isStr(p.framework, 200) ? p.framework : "", text: p.text, created: isStr(p.created, 40) ? p.created : new Date().toISOString() }));
      const importedChats = (Array.isArray(d.chats) ? d.chats : []).filter(c => c && isStr(c.title, 200) && Array.isArray(c.messages))
        .map(c => ({ id: uid(), title: c.title, created: isStr(c.created, 40) ? c.created : new Date().toISOString(),
          messages: c.messages.filter(m => m && (m.role === "user" || m.role === "assistant") && isStr(m.content, 500000))
            .map(m => ({ role: m.role, content: m.content, meta: isStr(m.meta, 500) ? m.meta : "" })) }));
      store.set(K.prompts, [...prompts, ...store.get(K.prompts, [])]);
      chats = [...importedChats, ...chats]; saveChats(); renderChatList();
      renderLibrary();
      flash($("libMsg"), "Imported " + prompts.length + " prompts and " + importedChats.length + " chats.", "ok");
    } catch (err) {
      flash($("libMsg"), "Import failed: " + err.message, "err");
    }
  });

  let clearArmed = false;
  $("clearData").addEventListener("click", () => {
    if (!clearArmed) {
      clearArmed = true; $("clearData").textContent = "Click again to confirm";
      setTimeout(() => { clearArmed = false; $("clearData").textContent = "Delete all saved data"; }, 4000);
      return;
    }
    [K.prompts, K.chats, K.activeChat, K.builder].forEach(store.del);
    Object.keys(PROVIDERS).forEach(p => store.del(keyStoreName(p)));
    chats = []; activeId = null;
    clearArmed = false; $("clearData").textContent = "Delete all saved data";
    renderChatList(); renderMessages(); renderLibrary();
    $("apiKey").value = ""; $("rememberKey").checked = false;
    flash($("libMsg"), "All saved prompts, chats and remembered keys deleted from this browser.", "ok");
  });

  /* ---------------- init ---------------- */
  selectProvider(settings.provider);
  applyBuilderLanguage();
  renderFrameworkSelect();
  renderSections();
  renderChatList();
  renderMessages();
})();
