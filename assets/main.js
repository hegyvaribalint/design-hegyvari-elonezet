/* Süti-sáv (Consent Mode v2), mobilmenü, ajánlatkérő űrlap, mérési események a dataLayer-be.
   Események: click_phone, click_email, click_route, click_app, click_webshop, form_submit,
   és bármi data-esemeny="..." attribútummal. */
(function () {
  'use strict';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function applyConsent(value) {
    var s = value === 'accepted' ? 'granted' : 'denied';
    gtag('consent', 'update', { ad_storage: s, ad_user_data: s, ad_personalization: s, analytics_storage: s });
    window.dataLayer.push({ event: 'consent_update', consent: value });
  }

  var bar = document.getElementById('cookie');
  var saved = null;
  try { saved = localStorage.getItem('cookie_consent'); } catch (e) {}
  if (bar && !saved) bar.hidden = false;
  if (bar) {
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      var v = b.getAttribute('data-consent');
      try { localStorage.setItem('cookie_consent', v); } catch (err) {}
      applyConsent(v);
      bar.hidden = true;
    });
  }

  // Süti-beállítások újranyitása (pl. láblécben: <button data-cookie-settings>)
  document.addEventListener('click', function (e) {
    if (bar && e.target.closest('[data-cookie-settings]')) bar.hidden = false;
  });

  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('fomenu');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a, button');
    if (!a) return;
    var ev = a.getAttribute('data-esemeny');
    var href = a.getAttribute('href') || '';
    if (!ev) {
      if (href.indexOf('tel:') === 0) ev = 'click_phone';
      else if (href.indexOf('mailto:') === 0) ev = 'click_email';
      else if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/.test(href)) ev = 'click_route';
      else if (/apps\.apple\.com|play\.google\.com/.test(href)) ev = 'click_app';
      else if (/webshop\.hegyvari\.com/.test(href)) ev = 'click_webshop';
    }
    if (ev) window.dataLayer.push({ event: ev, link_url: href, link_text: (a.textContent || '').trim().slice(0, 80) });
  });

  // Mobilmenü: linkre kattintva bezárul
  if (nav) nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && nav.classList.contains('open')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  });

  // Ha az oldalon nincs ajánlatkérő űrlap (pl. jogi oldalak), a #ajanlatkeres linkek a főoldal űrlapjára vigyenek
  if (!document.getElementById('ajanlatkeres')) {
    document.querySelectorAll('a[href="#ajanlatkeres"]').forEach(function (a) { a.setAttribute('href', '/#ajanlatkeres'); });
  }

  // Ajánlatkérő űrlap: időcsapda + fetch; siker esetén a /koszonom/ oldalra (ott mérhető a konverzió)
  var t0 = Date.now();
  document.querySelectorAll('form[data-urlap]').forEach(function (form) {
    var msg = form.querySelector('.urlap-uzenet');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.querySelector('[name="csapda_ido"]').value = String(Date.now() - t0);
      form.querySelector('[name="oldal"]').value = location.pathname;
      var gomb = form.querySelector('button[type="submit"]');
      gomb.disabled = true;
      msg.className = 'urlap-uzenet';
      msg.textContent = 'Küldés folyamatban…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'fetch', 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) {
            window.dataLayer.push({ event: 'form_submit', form_name: form.getAttribute('data-urlap'), page_path: location.pathname });
            location.href = '/koszonom/';
          } else {
            msg.className = 'urlap-uzenet hiba';
            msg.textContent = d.message || 'Hiba történt, kérlek próbáld újra.';
            gomb.disabled = false;
          }
        })
        .catch(function () {
          msg.className = 'urlap-uzenet hiba';
          msg.textContent = 'Az üzenet most nem ment el. Írj nekünk e-mailt, vagy hívj minket telefonon.';
          gomb.disabled = false;
        });
    });
  });
})();
