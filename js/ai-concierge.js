/**
 * AI Concierge — a scripted, rule-based chat assistant.
 * Honesty note: this is NOT a live LLM integration (no backend/API key exists in a
 * frontend-only build). It simulates a concierge via a small decision tree + keyword
 * matching, and its own first message discloses that it's automated. Every path ends
 * by hydrating a WhatsApp message so a real human (the agent) closes the loop.
 *
 * To upgrade later: swap `respondTo()` for a real API call to your LLM backend and
 * keep the same render/append functions.
 */

(function () {
  "use strict";
  const launcher = document.querySelector(".concierge-launcher");
  const panel = document.querySelector(".concierge-panel");
  if (!launcher || !panel) return;

  const body = panel.querySelector(".concierge-body");
  const form = panel.querySelector(".concierge-input-form");
  const input = panel.querySelector(".concierge-input input");
  const closeBtn = panel.querySelector(".concierge-close");

  const state = { stage: "greet", intent: null, answers: {} };

  function open() {
    panel.classList.add("open");
    launcher.setAttribute("aria-expanded", "true");
    input?.focus();
    if (!body.dataset.started) { body.dataset.started = "1"; greet(); }
  }
  function close() { panel.classList.remove("open"); launcher.setAttribute("aria-expanded", "false"); }
  launcher.addEventListener("click", () => (panel.classList.contains("open") ? close() : open()));
  closeBtn?.addEventListener("click", close);

  // Progressive enhancement: nav/hero links to /ai-assistant open the panel in place
  // when JS is available, and fall through to the real route when it is not.
  document.querySelectorAll("[data-open-assistant]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); open(); });
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("open")) close(); });

  function appendMessage(text, from) {
    const el = document.createElement("div");
    el.className = `concierge-msg ${from}`;
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function appendTyping() {
    const el = document.createElement("div");
    el.className = "concierge-typing";
    el.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function botSay(text, delay = 550) {
    return new Promise((resolve) => {
      const typing = appendTyping();
      setTimeout(() => {
        typing.remove();
        appendMessage(text, "bot");
        resolve();
      }, delay);
    });
  }

  function setQuickReplies(options) {
    let wrap = panel.querySelector(".concierge-quick-replies");
    if (wrap) wrap.remove();
    if (!options || !options.length) return;
    wrap = document.createElement("div");
    wrap.className = "concierge-quick-replies";
    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "concierge-chip";
      btn.type = "button";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => {
        appendMessage(opt.label, "user");
        wrap.remove();
        handleChoice(opt.value);
      });
      wrap.appendChild(btn);
    });
    body.after(wrap);
  }

  async function greet() {
    await botSay(
      // Disclosure is mandatory and must not be softened. See docs/AI_AGENT_SPEC.md §2.
      `Hello, I'm the ${REALTOR_CONFIG.siteName} assistant — an automated assistant, not a live person. Answers come from a set list of common questions. I can help you explore buying, selling, or renting, and connect you with the team directly whenever you're ready.`
    );
    await botSay("What can I help you with today?", 350);
    setQuickReplies([
      { label: "I want to buy a property", value: "buy" },
      { label: "I want to sell my property", value: "sell" },
      { label: "I want to rent", value: "rent" },
      { label: "Talk to someone directly", value: "human" },
    ]);
  }

  async function handleChoice(value) {
    if (value === "human") {
      await botSay(`Of course — here's the fastest way to reach the team directly.`);
      renderWhatsAppHandoff(`Hello, I'd like to speak with you directly about a property.`);
      return;
    }
    state.intent = value;
    const labels = { buy: "buying", sell: "selling", rent: "renting" };
    await botSay(`Great — let's talk about ${labels[value]}. Which area are you most interested in?`);
    setQuickReplies([
      ...REALTOR_CONFIG.serviceAreas.map((a) => ({ label: a, value: a })),
      { label: "Somewhere else", value: "other" },
    ]);
    state.stage = "area";
  }

  async function handleArea(value) {
    state.answers.area = value === "other" ? "an area not listed" : value;
    await botSay("Understood. What's your approximate budget range?");
    const budgetOptions = state.intent === "rent"
      ? [
          { label: "Under ₨150,000/mo", value: "Under ₨150,000/month" },
          { label: "₨150,000 – 350,000/mo", value: "₨150,000–350,000/month" },
          { label: "Above ₨350,000/mo", value: "Above ₨350,000/month" },
        ]
      // TODO: confirm these budget bands with the client — they should reflect
      // actual inventory in Bahria Town Rawalpindi / DHA Islamabad, not assumed ranges.
      : [
          { label: "Under ₨3 Crore", value: "Under ₨3 Crore" },
          { label: "₨3 – 7 Crore", value: "₨3–7 Crore" },
          { label: "Above ₨7 Crore", value: "Above ₨7 Crore" },
        ];
    setQuickReplies(budgetOptions);
    state.stage = "budget";
  }

  async function handleBudget(value) {
    state.answers.budget = value;
    await botSay("Last thing — what's your timeline?");
    setQuickReplies([
      { label: "Immediately", value: "Immediately" },
      { label: "Within 3 months", value: "Within 3 months" },
      { label: "Just exploring", value: "Just exploring for now" },
    ]);
    state.stage = "timeline";
  }

  async function handleTimeline(value) {
    state.answers.timeline = value;
    const labels = { buy: "buy", sell: "sell", rent: "rent" };
    const summary = `Hello, I'd like to ${labels[state.intent]} a property.\n• Area: ${state.answers.area}\n• Budget: ${state.answers.budget}\n• Timeline: ${state.answers.timeline}\n\nCould you help me with the next steps?`;
    await botSay("Perfect — I've put that together for you. Here's how to send it:");
    renderWhatsAppHandoff(summary);
    state.stage = "done";
  }

  function renderWhatsAppHandoff(message) {
    let wrap = panel.querySelector(".concierge-quick-replies");
    if (wrap) wrap.remove();
    wrap = document.createElement("div");
    wrap.className = "concierge-quick-replies";
    wrap.style.padding = "0 1.2rem 1rem";
    const waHref = buildWhatsAppLink(message);
    wrap.innerHTML = waHref
      ? `<a class="btn btn-primary btn-sm btn-block" target="_blank" rel="noopener noreferrer" href="${waHref}">
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.5 3.5A11 11 0 0 0 3.6 17L2 22l5.2-1.6A11 11 0 1 0 20.5 3.5zM12 20a9 9 0 0 1-4.6-1.3l-.3-.2-3 .9.9-2.9-.2-.3A9 9 0 1 1 12 20z"/></svg>
      Continue on WhatsApp
    </a>`
      // WhatsApp not configured yet — offer the confirmed phone lines instead.
      : `<a class="btn btn-primary btn-sm btn-block" href="${telHref(REALTOR_CONFIG.phone)}">Call ${REALTOR_CONFIG.phone}</a>
         <a class="btn btn-outline btn-sm btn-block" style="margin-top:.5rem" href="${telHref(REALTOR_CONFIG.phoneSecondary)}">Call ${REALTOR_CONFIG.phoneSecondary}</a>`;
    body.after(wrap);
  }

  function handleChoiceRouter(value) {
    if (state.stage === "area") return handleArea(value);
    if (state.stage === "budget") return handleBudget(value);
    if (state.stage === "timeline") return handleTimeline(value);
    return handleChoice(value);
  }

  // Re-bind quick reply dispatch through a single router so stage transitions work.
  const originalSetQuickReplies = setQuickReplies;
  setQuickReplies = function (options) {
    let wrap = panel.querySelector(".concierge-quick-replies");
    if (wrap) wrap.remove();
    if (!options || !options.length) return;
    wrap = document.createElement("div");
    wrap.className = "concierge-quick-replies";
    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "concierge-chip";
      btn.type = "button";
      btn.textContent = opt.label;
      btn.addEventListener("click", () => {
        appendMessage(opt.label, "user");
        wrap.remove();
        handleChoiceRouter(opt.value);
      });
      wrap.appendChild(btn);
    });
    body.after(wrap);
  };

  /* ---------- Free-text keyword FAQ fallback ----------
   * Every reply here is a factual claim about the business. Answers that have
   * not been confirmed by the client are deliberately NOT answered — the
   * assistant hands off instead of guessing. See docs/AI_AGENT_SPEC.md §3.
   * TODO: populate hours / fees / valuation / financing once client-confirmed.
   */
  const FAQ = [
    // Confirmed: service areas were supplied by the client on 2026-09-07.
    { keys: ["area", "location", "where"], reply: `We cover ${REALTOR_CONFIG.serviceAreas.join(" and ")}. For anywhere else, it's best to ask the team directly.` },
    // Confirmed: both numbers were supplied by the client.
    { keys: ["contact", "phone", "number", "call", "reach"], reply: `You can call ${REALTOR_CONFIG.phone} or ${REALTOR_CONFIG.phoneSecondary}.` },
    // Confirmed: the client's own copy states site visits are offered.
    { keys: ["visit", "viewing", "see the", "tour"], reply: "Yes — site visits can be arranged. The quickest way is to call the team and tell them which property you'd like to see." },
  ];

  // Single fallback path for anything unrecognised. It never invents an answer.
  function fallback(text) {
    return botSay(
      "I don't have an answer for that one — I only cover a few common questions. The team can help you properly:"
    ).then(() => renderWhatsAppHandoff(text ? `Hello, ${text}` : "Hello, I have a question about a property."));
  }

  function respondTo(text) {
    const lower = text.toLowerCase();
    const match = FAQ.find((f) => f.keys.some((k) => lower.includes(k)));
    if (match) return botSay(match.reply);
    return fallback(text);
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    appendMessage(val, "user");
    input.value = "";
    respondTo(val);
  });
})();
