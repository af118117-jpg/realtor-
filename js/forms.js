/**
 * Lead-capture forms (contact, valuation request, viewing request).
 *
 * Every submission does two things:
 *   1. Records the enquiry on the server (POST /api/v1/public/leads), so it
 *      lands in the admin panel's Leads list no matter what the visitor does
 *      next. This is what makes an enquiry survive a closed WhatsApp tab.
 *   2. Opens the pre-filled WhatsApp message, which is still the primary way
 *      the client actually talks to people.
 *
 * Anti-spam (docs/SECURITY_PLAN.md, docs/LEAD_GENERATION.md): a hidden
 * honeypot field plus the time the form was rendered. Both are checked
 * server-side and a failing submission is silently discarded — no CAPTCHA.
 */

(function () {
  "use strict";

  const RENDERED_AT = Date.now();

  function buildMessageFromForm(form, intro) {
    const data = new FormData(form);
    const lines = [intro];
    form.querySelectorAll("[name]").forEach((field) => {
      if (field.name === "company") return; // honeypot — never part of the message
      const label = field.getAttribute("data-label") || field.name;
      const value = data.get(field.name);
      if (value) lines.push(`• ${label}: ${value}`);
    });
    return lines.join("\n");
  }

  /** Adds the honeypot field, hidden from real visitors but not from bots. */
  function addHoneypot(form) {
    if (form.querySelector("[name='company']")) return;
    const wrap = document.createElement("div");
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden";
    wrap.innerHTML = '<label>Company (leave blank)<input type="text" name="company" tabindex="-1" autocomplete="off"></label>';
    form.appendChild(wrap);
  }

  /** Best-effort server capture. Never blocks the WhatsApp handoff: if the
   * API is unreachable the visitor's message still goes through.
   * Resolves true only when the server confirmed it stored the enquiry, so the
   * UI never tells a visitor their enquiry was received when it was not. */
  async function recordLead(form) {
    if (typeof RS_API_BASE === "undefined" || !RS_API_BASE) return false;
    const data = new FormData(form);
    const get = (name) => String(data.get(name) || "").trim();

    const name = get("name");
    const phone = get("phone");
    if (!name || !phone) return false; // nothing worth storing without a way to reply

    try {
      const res = await fetch(RS_API_BASE + "/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          name,
          phone,
          email: get("email") || undefined,
          message: get("message") || undefined,
          propertyRef: get("propertyRef") || undefined,
          intent: form.getAttribute("data-lead-intent") || undefined,
          budget: get("budget") || undefined,
          timeline: get("timeline") || undefined,
          locality: get("locality") || undefined,
          consent: true,
          company: get("company"),
          renderedAt: RENDERED_AT,
        }),
      });
      return res.ok;
    } catch {
      /* Offline or backend down — the WhatsApp handoff below still works. */
      return false;
    }
  }

  /* ---------- Field-level validation UX ----------
     Native constraint validation still decides what is valid (required, type,
     pattern); this layer only changes WHEN and HOW problems are shown:
     after a field is left, or on submit — never while the visitor types —
     as a message under the field wired up with aria-invalid/aria-describedby. */

  const PHONE_MIN_DIGITS = 10;

  function fieldLabel(field) {
    const label = field.id && field.form?.querySelector(`label[for="${field.id}"]`);
    return (label ? label.textContent : field.getAttribute("data-label") || field.name || "This field")
      .replace("*", "").trim();
  }

  function messageFor(field) {
    const v = field.validity;
    if (v.valueMissing) {
      if (field.name === "name") return "Please enter your full name.";
      if (field.type === "tel" || field.name === "phone") return "Please enter a phone number so we can reply.";
      return `Please fill in ${fieldLabel(field).toLowerCase()}.`;
    }
    if (field.type === "email" && v.typeMismatch) return "That email address doesn't look complete — check for a missing @ or domain.";
    if (v.customError) return field.validationMessage;
    if (!v.valid) return field.validationMessage || "Please check this field.";
    return "";
  }

  function checkPhone(field) {
    if (field.type !== "tel" && field.name !== "phone") return;
    const digits = field.value.replace(/\D/g, "");
    field.setCustomValidity(field.value.trim() && digits.length < PHONE_MIN_DIGITS
      ? "Enter a full phone number (at least 10 digits), e.g. 03XX XXXXXXX."
      : "");
  }

  function showFieldState(field) {
    const wrap = field.closest(".form-field");
    if (!wrap) return true;
    checkPhone(field);
    const msg = messageFor(field);
    let errEl = wrap.querySelector(".field-error");
    if (msg && !errEl) {
      errEl = document.createElement("p");
      errEl.className = "field-error";
      errEl.id = (field.id || field.name) + "-error";
      wrap.appendChild(errEl);
    }
    wrap.classList.toggle("is-error", !!msg);
    if (msg) {
      errEl.textContent = msg;
      errEl.hidden = false;
      field.setAttribute("aria-invalid", "true");
      const ids = new Set((field.getAttribute("aria-describedby") || "").split(" ").filter(Boolean));
      ids.add(errEl.id);
      field.setAttribute("aria-describedby", Array.from(ids).join(" "));
    } else {
      if (errEl) errEl.hidden = true;
      field.removeAttribute("aria-invalid");
    }
    return !msg;
  }

  /** Autofill and mobile-keyboard hints, applied once to every lead form so
   * each page's markup does not have to repeat them. Existing attributes win. */
  function addInputHints(form) {
    const hint = (sel, attrs) => form.querySelectorAll(sel).forEach((el) => {
      Object.keys(attrs).forEach((k) => { if (!el.hasAttribute(k)) el.setAttribute(k, attrs[k]); });
    });
    hint("input[name='name']", { autocomplete: "name", autocapitalize: "words" });
    hint("input[type='tel'], input[name='phone']", { autocomplete: "tel", inputmode: "tel" });
    hint("input[type='email'], input[name='email']", { autocomplete: "email", inputmode: "email", autocapitalize: "off", spellcheck: "false" });
  }

  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  };

  /** The outcome panel. Reuses the existing `.form-error` element (already
   * placed in every form's markup) so no page needs editing. */
  function statusEl(form) {
    let el = form.querySelector(".form-status");
    if (el) return el;
    el = form.querySelector(".form-error") || document.createElement("div");
    el.className = "form-status alert";
    el.removeAttribute("role");
    el.setAttribute("aria-live", "polite");
    el.hidden = true;
    if (!el.parentNode) form.querySelector("button[type='submit']")?.before(el);
    return el;
  }

  function showStatus(form, kind, title, text) {
    const el = statusEl(form);
    el.className = `form-status alert alert-${kind}`;
    el.innerHTML = `${ICONS[kind]}<div><strong></strong><span></span></div>`;
    el.querySelector("strong").textContent = title;
    el.querySelector("span").textContent = text;
    el.hidden = false;
  }

  function phonesText() {
    return [REALTOR_CONFIG.phone, REALTOR_CONFIG.phoneSecondary]
      .filter((p) => p && !String(p).includes("[CONTENT REQUIRED]")).join(" or ");
  }

  document.querySelectorAll("[data-lead-form]").forEach((form) => {
    addHoneypot(form);
    addInputHints(form);
    statusEl(form);
    // Validation messages are ours; suppress the browser's bubble.
    form.setAttribute("novalidate", "");

    const fields = Array.from(form.querySelectorAll(".form-field input, .form-field select, .form-field textarea"));
    fields.forEach((field) => {
      field.addEventListener("blur", () => { if (field.value || field.dataset.touched) { field.dataset.touched = "1"; showFieldState(field); } });
      // Once a field has shown an error, re-check as they type so the message
      // clears the moment the value becomes valid.
      field.addEventListener("input", () => {
        if (field.dataset.touched) showFieldState(field);
        // Starting a new enquiry retires the previous outcome message.
        const st = form.querySelector(".form-status");
        if (st && !st.hidden) st.hidden = true;
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector("button[type='submit']");

      let firstInvalid = null;
      fields.forEach((field) => {
        field.dataset.touched = "1";
        if (!showFieldState(field) && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      submitBtn?.classList.add("is-loading");
      submitBtn?.setAttribute("aria-busy", "true");
      const recorded = await recordLead(form);
      submitBtn?.classList.remove("is-loading");
      submitBtn?.removeAttribute("aria-busy");

      const intro = form.getAttribute("data-lead-form") || `Hello, I'd like to get in touch.`;
      const message = buildMessageFromForm(form, intro);
      const link = buildWhatsAppLink(message);
      const phones = phonesText();

      if (link) window.open(link, "_blank", "noopener");

      if (recorded) {
        showStatus(form, "success", "Enquiry received",
          link ? "Thank you. WhatsApp is opening with your message ready — send it there for the fastest reply."
               : `Thank you — Realtor Shamraiz will get back to you.${phones ? ` For a faster reply, call ${phones}.` : ""}`);
      } else if (link) {
        showStatus(form, "success", "Message ready",
          "WhatsApp is opening with your details filled in. Press send there to reach Realtor Shamraiz.");
      } else {
        // Nothing was stored and there is no messaging channel: say so plainly
        // and keep what they typed, rather than clearing the form on a failure.
        showStatus(form, "warning", "We couldn't send this just now",
          phones ? `Please call ${phones} — your details are still in the form.` : "Please try again in a moment — your details are still in the form.");
        return;
      }

      form.reset();
      fields.forEach((field) => {
        delete field.dataset.touched;
        field.closest(".form-field")?.classList.remove("is-error");
        field.removeAttribute("aria-invalid");
      });
    });
  });

  /* ---------- Mortgage / affordability calculator ---------- */
  const calc = document.querySelector("[data-mortgage-calc]");
  if (calc) {
    const priceInput = calc.querySelector("[name='price']");
    const downInput = calc.querySelector("[name='down']");
    const rateInput = calc.querySelector("[name='rate']");
    const yearsInput = calc.querySelector("[name='years']");
    const priceOut = calc.querySelector("[data-out='price']");
    const downOut = calc.querySelector("[data-out='down']");
    const rateOut = calc.querySelector("[data-out='rate']");
    const yearsOut = calc.querySelector("[data-out='years']");
    const resultOut = calc.querySelector("[data-out='monthly']");

    function recalc() {
      const price = Number(priceInput.value);
      const downPct = Number(downInput.value);
      const rate = Number(rateInput.value) / 100 / 12;
      const years = Number(yearsInput.value);
      const principal = price * (1 - downPct / 100);
      const n = years * 12;
      const monthly = rate === 0 ? principal / n : (principal * rate) / (1 - Math.pow(1 + rate, -n));

      priceOut.textContent = formatPKR(price);
      downOut.textContent = `${downPct}%`;
      rateOut.textContent = `${rateInput.value}%`;
      yearsOut.textContent = `${years} yrs`;
      resultOut.textContent = formatPKR(Math.round(monthly));
    }
    [priceInput, downInput, rateInput, yearsInput].forEach((el) => el?.addEventListener("input", recalc));
    recalc();
  }
})();
