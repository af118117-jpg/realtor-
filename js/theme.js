/**
 * Site-wide Light/Dark theme system. Shared by the public site and the
 * admin panel — loaded as a normal (non-async, non-defer) <script> as the
 * FIRST thing in <head>, before any stylesheet link, so the synchronous
 * bootstrap IIFE below sets `data-theme` on <html> before the browser has
 * anything to paint. That ordering is what prevents a flash of the wrong
 * theme; do not move this file's <script> tag after the stylesheet links
 * or add `defer`/`async` to it.
 *
 * Persistence: localStorage key "rs-theme", value "light" | "dark".
 * No stored value yet → falls back to the OS/browser's prefers-color-scheme.
 * Storage is same-origin, so the public site and /admin (same origin, same
 * path tree) already share one preference automatically.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "rs-theme";

  function getStoredTheme() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function systemTheme() {
    try {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    } catch (e) {
      return "dark";
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  // ---- Runs immediately, before <body> exists. Sets the attribute pre-paint. ----
  var initialTheme = getStoredTheme() || systemTheme();
  applyTheme(initialTheme);
  // Marks "scripts are running" before first paint. CSS gates JS-driven
  // presentation (scroll reveal) on this class so a script failure degrades to
  // fully visible content rather than blank sections.
  document.documentElement.classList.add("js");

  function setTheme(theme, persist) {
    applyTheme(theme);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {
        // Storage unavailable (private mode, quota) — theme still applies for this load.
      }
    }
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function toggle() {
    var next = currentTheme() === "light" ? "dark" : "light";
    setTheme(next, true);
    syncToggleButtons();
    return next;
  }

  function syncToggleButtons() {
    var isLight = currentTheme() === "light";
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(isLight));
      btn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    });
  }

  // Live-follow the OS setting only while the visitor hasn't made an explicit
  // choice on this site — once they pick one, it sticks until they change it.
  try {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function (e) {
      if (getStoredTheme()) return;
      setTheme(e.matches ? "light" : "dark", false);
      syncToggleButtons();
    });
  } catch (e) {
    // Older browsers without addEventListener on MediaQueryList — system-preference
    // live sync just doesn't apply; localStorage-based toggling still works fine.
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncToggleButtons();
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", toggle);
    });
  });

  window.RSTheme = { toggle: toggle, getTheme: currentTheme, setTheme: function (t) { setTheme(t, true); syncToggleButtons(); } };
})();
