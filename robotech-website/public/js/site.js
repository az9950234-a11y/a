(function () {
  var b = document.querySelector('.burger'), n = document.querySelector('.nav');
  if (b && n) b.addEventListener('click', function () {
    var o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o);
  });

  // Quote form -> WhatsApp (no backend needed)
  var f = document.getElementById('quote');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var ar = document.documentElement.lang === 'ar', d = new FormData(f), L = ar
      ? ['طلب عرض سعر', 'الاسم', 'الجوال', 'المدينة', 'المكينة', 'التفاصيل']
      : ['Quote request', 'Name', 'Phone', 'City', 'Machine', 'Details'];
    var msg = L[0] + ' – robotechcnc.com\n' +
      L[1] + ': ' + (d.get('name') || '') + '\n' + L[2] + ': ' + (d.get('phone') || '') + '\n' +
      L[3] + ': ' + (d.get('city') || '') + '\n' + L[4] + ': ' + (d.get('machine') || '') + '\n' +
      L[5] + ': ' + (d.get('message') || '');
    window.open('https://wa.me/' + f.dataset.wa + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    if (window.gtag) gtag('event', 'generate_lead', { method: 'whatsapp_form' });
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="https://wa.me"],a[href^="tel:"]');
    if (a && window.gtag) gtag('event', 'contact_click', { link: a.href.split('?')[0] });
  });
})();
