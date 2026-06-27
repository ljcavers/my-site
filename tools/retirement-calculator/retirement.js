(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    age: $("age"),
    pot: $("pot"),
    contribution: $("contribution"),
    returnRate: $("return-rate"),
    returnRange: $("return-range"),
    growthRate: $("growth-rate"),
    retireAge: $("retire-age"),
    retireRange: $("retire-range"),
    retireYears: $("retire-years"),
    drawdown: $("drawdown"),
    incomeMonthly: $("r-income-monthly"),
    incomeYearly: $("r-income-yearly"),
    potBanner: $("r-pot-banner"),
    tIncomeM: $("t-income-m"),
    tIncomeY: $("t-income-y"),
    rPot: $("r-pot"),
    rContrib: $("r-contrib"),
    rGrowth: $("r-growth"),
    rDuration: $("r-duration"),
    banner: $("sticky-banner"),
    pinBtn: $("pin-btn")
  };

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

  function calculate() {
    var currentAge = Math.max(16, Math.round(val(els.age)));
    var currentPot = Math.max(0, val(els.pot));
    var monthlyContrib = Math.max(0, val(els.contribution));
    var annualReturn = Math.max(0, val(els.returnRate)) / 100;
    var annualGrowth = Math.max(0, val(els.growthRate)) / 100;
    var retireAge = Math.max(currentAge, Math.round(val(els.retireAge)));
    var retireYears = Math.max(0, Math.round(val(els.retireYears)));
    var drawdownRate = Math.max(0, val(els.drawdown)) / 100;

    var yearsToRetire = retireAge - currentAge;
    var monthlyReturn = annualReturn > 0 ? Math.pow(1 + annualReturn, 1 / 12) - 1 : 0;

    var pot = currentPot;
    var totalContrib = currentPot;
    var monthly = monthlyContrib;
    for (var y = 0; y < yearsToRetire; y++) {
      for (var m = 0; m < 12; m++) {
        pot = pot * (1 + monthlyReturn) + monthly;
      }
      totalContrib += monthly * 12;
      monthly *= (1 + annualGrowth);
    }

    var growth = pot - totalContrib;
    var annualIncome = pot * drawdownRate;

    var duration;
    if (pot <= 0) {
      duration = 0;
    } else if (drawdownRate <= 0) {
      duration = Infinity;
    } else {
      duration = 0;
      var remaining = pot;
      while (remaining > 0 && duration < 100) {
        remaining = remaining * (1 + annualReturn) - annualIncome;
        duration++;
      }
      if (remaining > 0) duration = Infinity;
    }

    els.incomeMonthly.textContent = gbp2.format(annualIncome / 12);
    els.incomeYearly.textContent = gbp.format(annualIncome);
    els.potBanner.textContent = gbp.format(pot);

    els.tIncomeM.textContent = gbp2.format(annualIncome / 12);
    els.tIncomeY.textContent = gbp.format(annualIncome);

    els.rPot.textContent = gbp.format(pot);
    els.rContrib.textContent = gbp.format(totalContrib);
    els.rGrowth.textContent = gbp.format(growth);

    var durationText;
    if (duration === Infinity || duration >= 100) {
      durationText = "Indefinitely";
    } else {
      durationText = duration + " / " + retireYears + " years";
    }
    els.rDuration.textContent = durationText;
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
  pair(els.returnRate, els.returnRange);
  pair(els.retireAge, els.retireRange);

  [els.age, els.pot, els.contribution, els.growthRate, els.retireYears, els.drawdown].forEach(function (el) {
    el.addEventListener("input", calculate);
  });

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
