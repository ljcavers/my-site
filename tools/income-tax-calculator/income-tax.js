/* UK Income Tax + National Insurance calculator — live, no submit button.
   England / Wales / Northern Ireland, 2026/27 tax year (frozen thresholds).
   Scotland uses different Income Tax bands and is intentionally out of scope. */
(function () {
  "use strict";

  // --- 2026/27 constants (England, Wales & NI) ---------------------------
  var PERSONAL_ALLOWANCE = 12570;     // standard 1257L
  var PA_TAPER_START = 100000;        // PA reduced £1 per £2 above this
  var BASIC_LIMIT = 50270;            // 20% up to here (taxable incl. allowance)
  var HIGHER_LIMIT = 125140;          // 40% up to here, 45% above

  var BASIC_RATE = 0.20;
  var HIGHER_RATE = 0.40;
  var ADDITIONAL_RATE = 0.45;

  // Employee Class 1 NI
  var NI_PRIMARY_THRESHOLD = 12570;
  var NI_UPPER_LIMIT = 50270;
  var NI_MAIN_RATE = 0.08;
  var NI_UPPER_RATE = 0.02;

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    salary: $("salary"),
    salaryRange: $("salary-range"),
    pension: $("pension"),
    takehome: $("r-takehome"),
    takehomeRow: $("r-takehome-row"),
    gross: $("r-gross"),
    pensionRow: $("row-pension"),
    pensionVal: $("r-pension"),
    allowance: $("r-allowance"),
    tax: $("r-tax"),
    ni: $("r-ni"),
    niRow: $("row-ni"),
    effective: $("r-effective"),
    periodLabel: $("period-label"),
    bandRows: $("band-rows"),
    barTake: $("bar-take"),
    barTax: $("bar-tax"),
    barNi: $("bar-ni")
  };

  var state = { period: "year", includeNI: true };

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

  // Personal allowance after the £100k taper.
  function allowanceFor(taxable) {
    if (taxable <= PA_TAPER_START) return PERSONAL_ALLOWANCE;
    var reduction = Math.floor((taxable - PA_TAPER_START) / 2);
    return Math.max(0, PERSONAL_ALLOWANCE - reduction);
  }

  // Income Tax on a taxable income, returning total + per-band detail.
  function incomeTax(taxable) {
    var pa = allowanceFor(taxable);
    var bands = [];
    var tax = 0;

    // Basic-rate band sits between the personal allowance and BASIC_LIMIT.
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

  function periodFactor() {
    return state.period === "month" ? 12 : state.period === "week" ? 52 : 1;
  }

  function fmt(annual) {
    var v = annual / periodFactor();
    return state.period === "year" ? gbp.format(v) : gbp2.format(v);
  }

  function calculate() {
    var gross = Math.max(0, val(els.salary));
    var pensionPct = Math.min(Math.max(0, val(els.pension)), 100);
    var pension = gross * pensionPct / 100;
    var taxable = Math.max(0, gross - pension); // pre-tax (salary sacrifice) pension

    var taxResult = incomeTax(taxable);
    var tax = taxResult.tax;
    var ni = state.includeNI ? nationalInsurance(taxable) : 0;
    var takeHome = gross - pension - tax - ni;

    // Labels reflecting the chosen period
    els.periodLabel.textContent =
      "(per " + state.period + ")";

    els.gross.textContent = fmt(gross);
    els.allowance.textContent = fmt(taxResult.allowance);
    els.tax.textContent = "−" + fmt(tax);
    els.takehome.textContent = fmt(takeHome);
    els.takehomeRow.textContent = fmt(takeHome);

    if (pension > 0) {
      els.pensionRow.style.display = "";
      els.pensionVal.textContent = "−" + fmt(pension);
    } else {
      els.pensionRow.style.display = "none";
    }

    if (state.includeNI) {
      els.niRow.style.display = "";
      els.ni.textContent = "−" + fmt(ni);
    } else {
      els.niRow.style.display = "none";
    }

    var effective = gross > 0 ? ((tax + ni) / gross) * 100 : 0;
    els.effective.textContent = effective.toFixed(1) + "%";

    // Breakdown bar (share of gross)
    function pct(x) { return gross > 0 ? (x / gross) * 100 : 0; }
    els.barTake.style.width = pct(takeHome + pension) + "%"; // pension stays "yours"
    els.barTax.style.width = pct(tax) + "%";
    els.barNi.style.width = pct(ni) + "%";

    renderBands(taxResult.bands, tax);
  }

  function renderBands(bands, totalTax) {
    if (!bands.length) {
      els.bandRows.innerHTML =
        '<div class="result-row"><span class="k">No Income Tax due</span>' +
        '<span class="v">' + fmt(0) + "</span></div>";
      return;
    }
    var html = "";
    bands.forEach(function (b) {
      html +=
        '<div class="result-row"><span class="k">' + b.name +
        ' <small>on ' + fmt(b.amount) + "</small></span>" +
        '<span class="v">' + fmt(b.tax) + "</span></div>";
    });
    html +=
      '<div class="result-row result-row--total"><span class="k">Total Income Tax</span>' +
      '<span class="v">' + fmt(totalTax) + "</span></div>";
    els.bandRows.innerHTML = html;
  }

  // --- Wiring -------------------------------------------------------------
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
  wireToggle("period-toggle", "data-period", function (v) { state.period = v; });
  wireToggle("ni-toggle", "data-ni", function (v) { state.includeNI = v === "yes"; });

  calculate();
})();
