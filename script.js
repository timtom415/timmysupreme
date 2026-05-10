(function () {
  "use strict";

  /** Pacific (SF) and Eastern (BOS); labels match your request — zones handle DST correctly. */
  var TZ_SF = "America/Los_Angeles";
  var TZ_BOS = "America/New_York";

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatTimestamp(date, timeZone, cityLabel) {
    var formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    var parts = formatter.formatToParts(date);
    var map = {};
    var i;
    var p;

    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      if (p.type !== "literal") {
        map[p.type] = p.value;
      }
    }

    var month = pad2(parseInt(map.month, 10));
    var day = pad2(parseInt(map.day, 10));
    var year = map.year;
    var hourDisplay = parseInt(map.hour, 10);
    if (isNaN(hourDisplay)) {
      hourDisplay = 12;
    }
    var minutes = pad2(parseInt(map.minute, 10));
    var ampm = (map.dayPeriod || "am").toLowerCase();

    return (
      month +
      "/" +
      day +
      "/" +
      year +
      " " +
      hourDisplay +
      ":" +
      minutes +
      ampm +
      " " +
      cityLabel
    );
  }

  function updateClocks() {
    var sfEl = document.getElementById("live-timestamp-sf");
    var bosEl = document.getElementById("live-timestamp-bos");
    var now = new Date();
    if (sfEl) {
      sfEl.textContent = formatTimestamp(now, TZ_SF, "SF");
    }
    if (bosEl) {
      bosEl.textContent = formatTimestamp(now, TZ_BOS, "BOS");
    }
  }

  function initClock() {
    updateClocks();
    setInterval(updateClocks, 1000);
  }

  function smoothScrollToHash(hash, behavior) {
    if (!hash || hash === "#") return;
    var id = hash.slice(1);
    var target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: behavior, block: "start" });
  }

  function initNavScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      if (anchor.classList.contains("logo-link")) return;

      anchor.addEventListener("click", function (e) {
        var href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        var targetEl = document.getElementById(href.slice(1));
        if (!targetEl) return;
        e.preventDefault();
        var reduced = prefersReducedMotion();
        smoothScrollToHash(href, reduced ? "auto" : "smooth");
        if (href === "#home") {
          history.replaceState(null, "", href);
        } else {
          history.pushState(null, "", href);
        }
        requestAnimationFrame(function () {
          updateActiveSection();
        });
      });
    });

    document.querySelectorAll(".logo-link").forEach(function (logo) {
      logo.addEventListener("click", function (e) {
        e.preventDefault();
        smoothScrollToHash("#home", prefersReducedMotion() ? "auto" : "smooth");
        history.replaceState(null, "", "#home");
        requestAnimationFrame(function () {
          updateActiveSection();
        });
      });
    });
  }

  function getActiveSectionId() {
    var yScroll = window.scrollY || document.documentElement.scrollTop;

    var sections = Array.prototype.slice.call(
      document.querySelectorAll("main.page .section[id]")
    );
    if (sections.length === 0) return "home";

    var markerLine = window.innerHeight * 0.42;
    var matchId = null;
    var i;

    for (i = 0; i < sections.length; i++) {
      var rect = sections[i].getBoundingClientRect();
      if (markerLine >= rect.top && markerLine <= rect.bottom) {
        matchId = sections[i].id;
        break;
      }
    }

    if (!matchId) {
      var bestId = sections[0].id;
      var bestDist = Infinity;
      var midPx = markerLine;

      for (i = 0; i < sections.length; i++) {
        var r = sections[i].getBoundingClientRect();
        var visible =
          Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
        if (visible <= 0) continue;

        var center = (r.top + r.bottom) / 2;
        var d = Math.abs(center - midPx);
        if (d < bestDist) {
          bestDist = d;
          bestId = sections[i].id;
        }
      }

      matchId = bestId;
    }

    if (matchId === "home" || yScroll < 48) {
      return "home";
    }

    return matchId || "home";
  }

  function updateActiveSection() {
    var id = getActiveSectionId();
    var navLinks = document.querySelectorAll(".site-nav .nav-link");
    navLinks.forEach(function (link) {
      var href = link.getAttribute("href");
      var sid = href && href.charAt(0) === "#" ? href.slice(1) : "";
      if (id === "home") {
        link.classList.remove("is-active");
        return;
      }
      link.classList.toggle("is-active", sid === id);
    });
  }

  var scrollTick = false;

  function scheduleActiveUpdate() {
    if (!scrollTick) {
      scrollTick = true;
      window.requestAnimationFrame(function () {
        updateActiveSection();
        scrollTick = false;
      });
    }
  }

  function initSectionSpy() {
    updateActiveSection();
    window.addEventListener("scroll", scheduleActiveUpdate, { passive: true });
    window.addEventListener("resize", scheduleActiveUpdate);
  }

  function initHashOnLoad() {
    var hash = window.location.hash;
    if (!hash || hash === "#") return;
    requestAnimationFrame(function () {
      smoothScrollToHash(hash, prefersReducedMotion() ? "auto" : "smooth");
      requestAnimationFrame(function () {
        updateActiveSection();
      });
    });
  }

  function boot() {
    initClock();
    initNavScroll();
    initSectionSpy();
    initHashOnLoad();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
