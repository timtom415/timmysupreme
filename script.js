(function () {
  "use strict";

  var CITY = "NYC";

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatTimestamp(date) {
    var month = pad2(date.getMonth() + 1);
    var day = pad2(date.getDate());
    var year = date.getFullYear();
    var h24 = date.getHours();
    var h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    var minutes = pad2(date.getMinutes());
    var ampm = h24 < 12 ? "am" : "pm";
    return (
      month +
      "/" +
      day +
      "/" +
      year +
      " " +
      h12 +
      ":" +
      minutes +
      ampm +
      " " +
      CITY
    );
  }

  function updateTimestamp() {
    var el = document.getElementById("live-timestamp");
    if (!el) return;
    el.textContent = formatTimestamp(new Date());
  }

  function initClock() {
    updateTimestamp();
    setInterval(updateTimestamp, 1000);
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
        var visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
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
