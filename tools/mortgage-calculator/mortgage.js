(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    price: $("price"),
    deposit: $("deposit"),
    rate: $("rate"),
    rateRange: $("rate-range"),
    term: $("term"),
    termRange: $("term-range"),
    depositHint: $("deposit-hint"),
    monthly: $("r-monthly"),
    monthlySub: $("r-monthly-sub"),
    loan: $("r-loan"),
    interest: $("r-interest"),
    total: $("r-total"),
    ltv: $("r-ltv"),
    barPrincipal: $("bar-principal"),
    barInterest: $("bar-interest"),
    banner: $("sticky-banner"),
    pinBtn: $("pin-btn")
  };

  var gbp0 = new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP", maximumFractionDigits: 0
  });
  var gbp2 = new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  var num0 = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

  function val(el) {
    var n = parseFloat(el.value);
    return isFinite(n) ? n : 0;
  }

  function calculate() {
    var price = Math.max(0, val(els.price));
    var deposit = Math.min(Math.max(0, val(els.deposit)), price);
    var principal = price - deposit;
    var annualRate = Math.max(0, val(els.rate));
    var years = Math.max(0, val(els.term));
    var months = Math.round(years * 12);

    var monthly, totalRepaid, totalInterest;
    if (principal <= 0 || months <= 0) {
      monthly = totalRepaid = totalInterest = 0;
    } else if (annualRate === 0) {
      monthly = principal / months;
      totalRepaid = principal;
      totalInterest = 0;
    } else {
      var r = annualRate / 100 / 12;
      monthly = principal * r / (1 - Math.pow(1 + r, -months));
      totalRepaid = monthly * months;
      totalInterest = totalRepaid - principal;
    }

    els.monthly.textContent = gbp2.format(monthly);
    els.monthlySub.textContent = gbp0.format(totalRepaid) + " total · " + gbp0.format(totalInterest) + " interest";
    els.loan.textContent = gbp0.format(principal);
    els.interest.textContent = gbp0.format(totalInterest);
    els.total.textContent = gbp0.format(totalRepaid);

    var ltv = price > 0 ? (principal / price) * 100 : 0;
    els.ltv.textContent = ltv.toFixed(1) + "%";

    var depPct = price > 0 ? (deposit / price) * 100 : 0;
    els.depositHint.textContent =
      num0.format(depPct) + "% deposit · borrowing " + gbp0.format(principal);

    var pPct = totalRepaid > 0 ? (principal / totalRepaid) * 100 : 100;
    els.barPrincipal.style.width = pPct + "%";
    els.barInterest.style.width = (100 - pPct) + "%";
  }

  function pair(input, range) {
    input.addEventListener("input", function () {
      range.value = input.value;
      calculate();
    });
    range.addEventListener("input", function () {
      input.value = range.value;
      calculate();
    });
  }
  pair(els.rate, els.rateRange);
  pair(els.term, els.termRange);

  [els.price, els.deposit].forEach(function (el) {
    el.addEventListener("input", calculate);
  });

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
