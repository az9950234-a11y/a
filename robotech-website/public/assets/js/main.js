/* Robotech CNC — progressive enhancements (site works without JS) */
(function () {
  var doc = document.documentElement;
  var body = document.body;

  // Mobile navigation
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) {
        body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  // Sub-menu (service areas)
  document.querySelectorAll('.nav__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var li = btn.parentElement;
      var open = li.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.has-sub.is-open').forEach(function (li) {
      if (!li.contains(e.target)) {
        li.classList.remove('is-open');
        li.querySelector('.nav__btn').setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Header shadow on scroll
  var hdr = document.querySelector('.hdr');
  var onScroll = function () { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Quote form → WhatsApp message
  document.querySelectorAll('form.qform').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lines = [form.getAttribute('data-intro')];
      form.querySelectorAll('[data-label]').forEach(function (el) {
        var v = (el.value || '').trim();
        if (v) lines.push(el.getAttribute('data-label') + ': ' + v);
      });
      var url = 'https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(lines.join('\n'));
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { method: 'whatsapp_form' });
      var w = window.open(url, '_blank', 'noopener');
      if (!w) window.location.href = url;
    });
  });

  // Track WhatsApp / call clicks (only if GA4 is configured)
  document.addEventListener('click', function (e) {
    if (typeof window.gtag !== 'function') return;
    var a = e.target.closest && e.target.closest('a[href^="https://wa.me"], a[href^="tel:"]');
    if (a) window.gtag('event', 'contact_click', { method: a.href.indexOf('tel:') === 0 ? 'phone' : 'whatsapp' });
  });

  // Animated counters
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var counters = document.querySelectorAll('[data-count]');
  if (!reduce && 'IntersectionObserver' in window && counters.length) {
    var format = function (el, n) {
      var tpl = el.getAttribute('data-fmt');
      var target = el.getAttribute('data-count');
      var s = n.toLocaleString('en-US');
      el.textContent = tpl.replace(Number(target).toLocaleString('en-US'), s).replace(target, s);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var target = parseInt(el.getAttribute('data-count'), 10);
        var start = null;
        var step = function (ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1400, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          format(el, Math.round(target * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { io.observe(el); });
  }

  doc.classList.add('js');
})();
