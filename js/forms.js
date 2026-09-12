/**
 * Lead-capture forms (contact, valuation request, viewing request).
 * All forms are frontend-only: on submit we validate, build a WhatsApp message
 * from REALTOR_CONFIG.whatsapp, and open wa.me — no server, no data storage.
 */

(function () {
  "use strict";

  function buildMessageFromForm(form, intro) {
    const data = new FormData(form);
    const lines = [intro];
    form.querySelectorAll("[name]").forEach((field) => {
      const label = field.getAttribute("data-label") || field.name;
      const value = data.get(field.name);
      if (value) lines.push(`• ${label}: ${value}`);
    });
    return lines.join("\n");
  }

  document.querySelectorAll("[data-lead-form]").forEach((form) => {
    const errorEl = form.querySelector(".form-error");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const intro = form.getAttribute("data-lead-form") || `Hello, I'd like to get in touch.`;
      const message = buildMessageFromForm(form, intro);
      const link = buildWhatsAppLink(message);
      if (!link) {
        // No WhatsApp number configured yet. Never silently drop a lead —
        // tell the user the working alternative instead.
        if (errorEl) {
          errorEl.textContent = `Online enquiries aren't connected yet. Please call ${REALTOR_CONFIG.phone} or ${REALTOR_CONFIG.phoneSecondary}.`;
        }
        return;
      }
      window.open(link, "_blank", "noopener");
      window.showToast?.("Message ready — continue in WhatsApp to send it.");
      if (errorEl) errorEl.textContent = "";
      form.reset();
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
