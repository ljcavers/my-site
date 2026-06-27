/* Shared dark/light theme toggle for Basic Tools.
   The initial theme is applied by a tiny inline script in each page's <head>
   (see partials in the HTML) to avoid a flash of the wrong theme. This file
   only wires up the toggle button and keeps it in sync with OS changes. */
(function () {
  "use strict";

  var STORAGE_KEY = "basic-tools-theme";
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function currentTheme() {
    return root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
    var btn = document.querySelector(".theme-toggle");
    if (btn) btn.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
  }

  function init() {
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        apply(currentTheme() === "dark" ? "light" : "dark");
      });
      btn.setAttribute("aria-label",
        "Switch to " + (currentTheme() === "dark" ? "light" : "dark") + " mode");
    }

    var nav = document.getElementById("tool-nav");
    if (nav) {
      nav.addEventListener("change", function () {
        if (nav.value) window.location.href = nav.value;
      });
    }

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      if (!stored()) root.setAttribute("data-theme", e.matches ? "dark" : "light");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
