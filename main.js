/* StackEleven landing — reveal, count-up, mobile nav */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Opt into the reveal animation only now that JS is running; without this the
  // page renders fully visible even if the observer never fires.
  document.documentElement.classList.add("js");

  /* ---- Mobile nav ---- */
  var toggle = document.querySelector(".nav-toggle");
  var mobile = document.getElementById("mobile-nav");
  if (toggle && mobile) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      mobile.hidden = open;
    });
    mobile.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        mobile.hidden = true;
      });
    });
  }

  /* ---- Count-up ---- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    if (reduce) { el.textContent = prefix + target.toFixed(decimals) + suffix; return; }
    var dur = 1500, start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  }

  /* ---- Intersection reveal + trigger counters ---- */
  var counted = new WeakSet();
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        e.target.querySelectorAll("[data-count]").forEach(function (c) {
          if (!counted.has(c)) { counted.add(c); countUp(c); }
        });
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

    // counters that live outside .reveal blocks (trust bar)
    var trust = document.querySelector(".trustbar");
    if (trust) {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.querySelectorAll("[data-count]").forEach(function (c) {
            if (!counted.has(c)) { counted.add(c); countUp(c); }
          });
          io2.unobserve(e.target);
        });
      }, { threshold: 0.4 });
      io2.observe(trust);
    }
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll("[data-count]").forEach(function (c) { counted.add(c); countUp(c); });
  }

  /* ---- Safety net: never leave content hidden if the observer never fires ---- */
  function revealAll() {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll("[data-count]").forEach(function (c) {
      if (!counted.has(c)) { counted.add(c); countUp(c); }
    });
  }
  window.addEventListener("load", function () { setTimeout(revealAll, 1600); });

  /* ---- Carousel ---- */
  (function () {
    var root = document.querySelector(".carousel");
    if (!root) return;
    var track = root.querySelector(".carousel-track");
    var slides = [].slice.call(root.querySelectorAll(".slide"));
    var dotsWrap = root.querySelector(".car-dots");
    var prev = root.querySelector(".car-prev");
    var next = root.querySelector(".car-next");
    var i = 0, timer = null, DELAY = 3500;

    var dots = slides.map(function (s, n) {
      var b = document.createElement("button");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Show work " + (n + 1) + " of " + slides.length);
      b.addEventListener("click", function () { go(n); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle("is-active", k === i);
        s.setAttribute("aria-hidden", k === i ? "false" : "true");
      });
      dots.forEach(function (d, k) { d.setAttribute("aria-selected", k === i ? "true" : "false"); });
    }
    function start() { if (timer) return; timer = setInterval(function () { go(i + 1); }, DELAY); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    next.addEventListener("click", function () { go(i + 1); restart(); });
    prev.addEventListener("click", function () { go(i - 1); restart(); });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    // touch swipe
    var x0 = null;
    track.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    track.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
      x0 = null; start();
    }, { passive: true });

    go(0);
    start();
  })();

  /* ---- Header shadow on scroll ---- */
  var header = document.querySelector(".site-header");
  var last = 0;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if ((y > 8) !== (last > 8)) {
      header.style.boxShadow = y > 8 ? "0 10px 30px -18px rgba(0,0,0,.6)" : "none";
    }
    last = y;
  }, { passive: true });
})();
