/* Pure Racing FX — réglages communs du site (pages intégrées dans Odoo).
   Le numéro de version est lu sur la dernière release GitHub à l'ouverture de la page :
   rien à changer à chaque publication. La valeur ci-dessous ne sert que si GitHub ne répond pas. */
window.PRFX = {
  version: '0.14.70',
  releases: 'https://api.github.com/repos/Oz911/PureRacingFFBLabWeb/releases/latest',
  status: 'Version bêta',
  // Adresse fixe : redirection Odoo /telecharger → dernière release GitHub (rien à changer à chaque version).
  download: 'https://pureracing-fx.odoo.com/telecharger',
  support: 'https://pureracing-fx.odoo.com/r/abg',
  odoo: 'https://pureracing-fx.odoo.com',
  // Adresse de chaque page du site Odoo (ce qui suit pureracing-fx.odoo.com).
  // Si une page Odoo change d'adresse, il suffit de corriger la ligne ici.
  pages: {
    accueil: '/',
    spotter: '/spotter',
    training: '/training',
    telemetrie: '/telemetrie',
    ingenieur: '/ingenieur',
    engine: '/engine-bass-shaker',
    motion: '/motion',
    'ffb-analyzer': '/ffb-analyzer',
    dash: '/dashboard',
  },
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
      var k = a.getAttribute('data-page'), path = P.pages[k] || k;
      a.setAttribute('href', /^https?:/.test(path) ? path : P.odoo + path);
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
  // Dernière version publiée (release GitHub « latest », tag vX.Y.Z).
  function latest() {
    if (!window.fetch) return;
    fetch(P.releases, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var v = j && j.tag_name ? String(j.tag_name).replace(/^v/i, '') : '';
        if (!/^\d+\.\d+\.\d+$/.test(v)) return;
        P.version = v;
        document.querySelectorAll('[data-prfx="version"]').forEach(function (el) { el.textContent = v; });
      })
      .catch(function () {});
  }
  document.addEventListener('DOMContentLoaded', function () {
    fill(); post(); latest();
    if (window.ResizeObserver) new ResizeObserver(post).observe(document.body);
    window.addEventListener('load', post);
  });
})();

// Zoom des captures : clic sur une image = agrandie par-dessus la page ; clic, Échap ou ✕ pour fermer.
// Dans Odoo, la page est un cadre aussi haut qu'elle : la zone visible à l'écran est retrouvée
// avec IntersectionObserver (qui mesure par rapport à la fenêtre du navigateur, même dans un cadre),
// et l'image est replacée dedans quand on fait défiler.
(function () {
  var ov = null, img = null, io = null, last = null;
  function place(r) {
    if (!img || !r || r.height < 40) return;
    var pad = Math.min(40, r.width * .04), maxW = r.width - 2 * pad, maxH = r.height - 2 * pad;
    var nw = img.naturalWidth || 1456, nh = img.naturalHeight || 819;
    var k = Math.min(maxW / nw, maxH / nh, 1.6), w = nw * k, h = nh * k;
    img.style.width = w + 'px'; img.style.height = h + 'px';
    img.style.left = (r.left + (r.width - w) / 2 + window.scrollX) + 'px';
    img.style.top = (r.top + (r.height - h) / 2 + window.scrollY) + 'px';
    var x = ov.querySelector('.lb-x'); x.style.top = (r.top + window.scrollY + 12) + 'px'; x.style.left = (r.right + window.scrollX - 56) + 'px';
  }
  function close() { if (!ov) return; if (io) io.disconnect(); ov.remove(); ov = img = io = null; document.removeEventListener('keydown', key); }
  function key(e) { if (e.key === 'Escape') close(); }
  function open(src, alt, y) {
    close();
    ov = document.createElement('div'); ov.className = 'lb';
    ov.style.height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) + 'px';
    ov.innerHTML = '<button class="lb-x" type="button" aria-label="Fermer">✕</button>';
    img = new Image(); img.className = 'lb-img'; img.alt = alt || ''; img.src = src; ov.appendChild(img);
    ov.addEventListener('click', close); document.addEventListener('keydown', key);
    document.body.appendChild(ov);
    // Première position autour du clic, le temps que la zone visible soit mesurée.
    var vh = Math.min(window.innerHeight, (screen.availHeight || 900) * .9);
    last = { left: 0, top: Math.max(0, y - window.scrollY - vh / 2), width: document.documentElement.clientWidth, height: vh };
    last.right = last.left + last.width;
    var go = function () { place(last); };
    if (img.complete) go(); else img.onload = go;
    if ('IntersectionObserver' in window) {
      var th = []; for (var i = 0; i <= 100; i++) th.push(i / 100);
      io = new IntersectionObserver(function (en) { var r = en[0].intersectionRect; if (r.height > 40) { last = r; place(r); } }, { threshold: th });
      io.observe(ov);
      // Si on fait défiler et que l'image sort de l'écran, on referme (la zone visible ne
      // change pas de taille au défilement, IntersectionObserver ne le signale qu'ainsi).
      var seen = false, io2 = new IntersectionObserver(function (en) {
        var k = en[0].intersectionRatio; if (k > .9) seen = true; else if (seen && k < .75) close();
      }, { threshold: th });
      var obs = io; io = { disconnect: function () { obs.disconnect(); io2.disconnect(); } };
      setTimeout(function () { if (img) io2.observe(img); }, 350);
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || t.tagName !== 'IMG' || !t.closest('.cap')) return;
    e.preventDefault(); open(t.currentSrc || t.src, t.alt, e.pageY);
  });
})();
