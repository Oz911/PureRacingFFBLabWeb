/* Pure Racing FX — réglages communs du site (pages intégrées dans Odoo).
   À mettre à jour à chaque publication de Pit Box : version et lien de l'installateur. */
window.PRFX = {
  version: '0.14.64',
  status: 'Version bêta',
  // Fichier joint sur Odoo (change quand l'installateur est remplacé).
  download: 'https://pureracing-fx.odoo.com/web/content/2142?unique=79b82d7ecd007142174c31782c018e940ed7b212&download=true',
  support: 'https://pureracing-fx.odoo.com/r/abg',
  odoo: 'https://pureracing-fx.odoo.com',
};

(function () {
  var P = window.PRFX;
  function fill() {
    document.querySelectorAll('[data-prfx]').forEach(function (el) {
      var k = el.getAttribute('data-prfx');
      if (k === 'version') el.textContent = P.version;
      else if (k === 'status') el.textContent = P.status;
      else if (P[k]) el.setAttribute('href', P[k]);
    });
    // Liens vers les pages Odoo : ouverts dans la fenêtre du site, pas dans le cadre.
    document.querySelectorAll('a[data-page]').forEach(function (a) {
      a.setAttribute('href', P.odoo + a.getAttribute('data-page'));
      a.setAttribute('target', '_top');
    });
  }
  // Hauteur envoyée à la page Odoo, qui ajuste le cadre (pas de double barre de défilement).
  var last = 0;
  function post() {
    var h = Math.ceil(document.documentElement.scrollHeight);
    if (Math.abs(h - last) < 2) return;
    last = h;
    try { parent.postMessage({ prfxHeight: h, page: location.pathname }, '*'); } catch (e) {}
  }
  // Ancres (« Découvrir les modules ») : dans Odoo, le cadre a toute sa hauteur et c'est la
  // page Odoo qui défile ; on lui demande d'aller à la bonne hauteur.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    var t = document.getElementById(a.getAttribute('href').slice(1));
    if (!t) return;
    e.preventDefault();
    var y = t.getBoundingClientRect().top + window.scrollY;
    if (window.parent !== window) { try { parent.postMessage({ prfxScroll: y }, '*'); } catch (err) {} }
    else t.scrollIntoView({ behavior: 'smooth' });
  });
  document.addEventListener('DOMContentLoaded', function () {
    fill(); post();
    if (window.ResizeObserver) new ResizeObserver(post).observe(document.body);
    window.addEventListener('load', post);
  });
})();
