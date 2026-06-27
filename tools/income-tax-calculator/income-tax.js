(function () {
  "use strict";

  var PERSONAL_ALLOWANCE = 12570;
  var PA_TAPER_START = 100000;
  var BASIC_LIMIT = 50270;
  var HIGHER_LIMIT = 125140;

  var BASIC_RATE = 0.20;
  var HIGHER_RATE = 0.40;
  var ADDITIONAL_RATE = 0.45;

  var NI_PRIMARY_THRESHOLD = 12570;
  var NI_UPPER_LIMIT = 50270;
  var NI_MAIN_RATE = 0.08;
  var NI_UPPER_RATE = 0.02;

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    salary: $("salary"),
    salaryRange: $("salary-range"),
    pension: $("pension"),
    takehomeMonthly: $("r-takehome-monthly"),
    takehomeYearly: $("r-takehome-yearly"),
    effectiveBanner: $("r-effective-banner"),
    tGrossM: $("t-gross-m"),       tGrossY: $("t-gross-y"),
    pensionRow: $("row-pension"),
    tPensionM: $("t-pension-m"),   tPensionY: $("t-pension-y"),
    tAllowanceM: $("t-allowance-m"), tAllowanceY: $("t-allowance-y"),
    tTaxM: $("t-tax-m"),           tTaxY: $("t-tax-y"),
    niRow: $("row-ni"),
    tNiM: $("t-ni-m"),             tNiY: $("t-ni-y"),
    tTakehomeM: $("t-takehome-m"), tTakehomeY: $("t-takehome-y"),
    tEffective: $("t-effective"),
    bandRows: $("band-rows"),
    barTake: $("bar-take"),
    barTax: $("bar-tax"),
    barNi: $("bar-ni"),
    banner: $("sticky-banner"),
    pinBtn: $("pin-btn")
  };

  var state = { includeNI: true };

  var gbp = new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP", maximumFractionDigits: 0
  });
  var gbp2 = new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  function val(el) {
    var n = parseFloat(el.value);
    return isFinite(n) ? n : 0;
  }

  function fmtY(v) { return gbp.format(v); }
  function fmtM(v) { return gbp2.format(v / 12); }

  function allowanceFor(taxable) {
    if (taxable <= PA_TAPER_START) return PERSONAL_ALLOWANCE;
    var reduction = Math.floor((taxable - PA_TAPER_START) / 2);
    return Math.max(0, PERSONAL_ALLOWANCE - reduction);
  }

  function incomeTax(taxable) {
    var pa = allowanceFor(taxable);
    var bands = [];
    var tax = 0;

    var basicAmount = Math.max(0, Math.min(taxable, BASIC_LIMIT) - pa);
    var higherAmount = Math.max(0, Math.min(taxable, HIGHER_LIMIT) - Math.max(pa, BASIC_LIMIT));
    var additionalAmount = Math.max(0, taxable - Math.max(pa, HIGHER_LIMIT));

    if (basicAmount > 0) {
      tax += basicAmount * BASIC_RATE;
      bands.push({ name: "Basic rate (20%)", amount: basicAmount, tax: basicAmount * BASIC_RATE });
    }
    if (higherAmount > 0) {
      tax += higherAmount * HIGHER_RATE;
      bands.push({ name: "Higher rate (40%)", amount: higherAmount, tax: higherAmount * HIGHER_RATE });
    }
    if (additionalAmount > 0) {
      tax += additionalAmount * ADDITIONAL_RATE;
      bands.push({ name: "Additional rate (45%)", amount: additionalAmount, tax: additionalAmount * ADDITIONAL_RATE });
    }
    return { tax: tax, bands: bands, allowance: pa };
  }

  function nationalInsurance(gross) {
    if (gross <= NI_PRIMARY_THRESHOLD) return 0;
    var main = Math.max(0, Math.min(gross, NI_UPPER_LIMIT) - NI_PRIMARY_THRESHOLD) * NI_MAIN_RATE;
    var upper = Math.max(0, gross - NI_UPPER_LIMIT) * NI_UPPER_RATE;
    return main + upper;
  }

  function calculate() {
    var gross = Math.max(0, val(els.salary));
    var pensionPct = Math.min(Math.max(0, val(els.pension)), 100);
    var pension = gross * pensionPct / 100;
    var taxable = Math.max(0, gross - pension);

    var taxResult = incomeTax(taxable);
    var tax = taxResult.tax;
    var ni = state.includeNI ? nationalInsurance(taxable) : 0;
    var takeHome = gross - pension - tax - ni;
    var effective = gross > 0 ? ((tax + ni) / gross) * 100 : 0;

    // Sticky banner — monthly headline, yearly in small
    els.takehomeMonthly.textContent = fmtM(takeHome);
    els.takehomeYearly.textContent = fmtY(takeHome);
    els.effectiveBanner.textContent = effective.toFixed(1) + "%";

    // Table — month and year side by side
    els.tGrossM.textContent = fmtM(gross);
    els.tGrossY.textContent = fmtY(gross);
    els.tAllowanceM.textContent = fmtM(taxResult.allowance);
    els.tAllowanceY.textContent = fmtY(taxResult.allowance);
    els.tTaxM.textContent = "−" + fmtM(tax);
    els.tTaxY.textContent = "−" + fmtY(tax);
    els.tTakehomeM.textContent = fmtM(takeHome);
    els.tTakehomeY.textContent = fmtY(takeHome);
    els.tEffective.textContent = effective.toFixed(1) + "%";

    if (pension > 0) {
      els.pensionRow.style.display = "";
      els.tPensionM.textContent = "−" + fmtM(pension);
      els.tPensionY.textContent = "−" + fmtY(pension);
    } else {
      els.pensionRow.style.display = "none";
    }

    if (state.includeNI) {
      els.niRow.style.display = "";
      els.tNiM.textContent = "−" + fmtM(ni);
      els.tNiY.textContent = "−" + fmtY(ni);
    } else {
      els.niRow.style.display = "none";
    }

    // Breakdown bar
    function pct(x) { return gross > 0 ? (x / gross) * 100 : 0; }
    els.barTake.style.width = pct(takeHome + pension) + "%";
    els.barTax.style.width = pct(tax) + "%";
    els.barNi.style.width = pct(ni) + "%";

    renderBands(taxResult.bands, tax);
  }

  function renderBands(bands, totalTax) {
    if (!bands.length) {
      els.bandRows.innerHTML =
        '<div class="result-row"><span class="k">No Income Tax due</span>' +
        '<span class="v">' + fmtY(0) + "</span></div>";
      return;
    }
    var html = "";
    bands.forEach(function (b) {
      html +=
        '<div class="result-row"><span class="k">' + b.name +
        ' <small>on ' + fmtY(b.amount) + "</small></span>" +
        '<span class="v">' + fmtY(b.tax) + "</span></div>";
    });
    html +=
      '<div class="result-row result-row--total"><span class="k">Total Income Tax</span>' +
      '<span class="v">' + fmtY(totalTax) + "</span></div>";
    els.bandRows.innerHTML = html;
  }

  els.salary.addEventListener("input", function () {
    els.salaryRange.value = els.salary.value;
    calculate();
  });
  els.salaryRange.addEventListener("input", function () {
    els.salary.value = els.salaryRange.value;
    calculate();
  });
  els.pension.addEventListener("input", calculate);

  function wireToggle(id, attr, onPick) {
    var group = document.getElementById(id);
    group.addEventListener("click", function (e) {
      var btn = e.target.closest("button[" + attr + "]");
      if (!btn) return;
      group.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      onPick(btn.getAttribute(attr));
      calculate();
    });
  }
  wireToggle("ni-toggle", "data-ni", function (v) { state.includeNI = v === "yes"; });

  // Sticky pin toggle
  els.pinBtn.addEventListener("click", function () {
    var pinned = els.banner.classList.toggle("is-sticky");
    els.pinBtn.setAttribute("aria-pressed", String(pinned));
    if (!pinned) els.banner.classList.remove("is-stuck");
  });

  var sentinel = document.createElement("div");
  sentinel.style.height = "1px";
  sentinel.setAttribute("aria-hidden", "true");
  els.banner.parentNode.insertBefore(sentinel, els.banner);
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (els.banner.classList.contains("is-sticky")) {
        els.banner.classList.toggle("is-stuck", !e.isIntersecting);
      }
    });
  }, { threshold: 0 });
  observer.observe(sentinel);

  calculate();
})();
