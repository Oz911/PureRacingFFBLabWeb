/* =====================================================================
   Pure Racing FX — FFB Lab : barre de navigation commune.
   Parcours en 4 étapes + outils (calculateur seul, notice).

   Utilisation : <nav id="ffbnav" data-page="mon-reglage"></nav>
                 <script src="ffb-nav.js"></script>
   data-page : mon-reglage | mesure | comparer | piste | calculateur | notice

   Les étapes faites (vert) et en cours (rouge) se lisent dans la fiche
   « Mon réglage » (localStorage ffbLabProfile) et dans la validation
   sur piste (ffbTrackAssistant).
   Liens : pages Odoo du site, ou pages locales dans le plugin Pure Racing FX
   (pages servies sous /lab/).
   ===================================================================== */
(function () {
  'use strict';
  var nav = document.getElementById('ffbnav');
  if (!nav) return;
  var page = nav.getAttribute('data-page') || '';
  var local = location.pathname.indexOf('/lab/') === 0;
  var url = function (site, file) { return local ? '/lab/' + file : 'https://pureracing-fx.odoo.com/' + site; };
  var get = function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };

  var P = get('ffbLabProfile') || {}, T = get('ffbTrackAssistant') || {};
  var e = P.equip || {}, c = P.cur || {};
  var m = P.measure || (P.manual && (P.manual.level != null || P.manual.car != null) ? P.manual : null);
  var done = {
    1: !!(e.baseNm && c.D != null),
    2: !!m,
    3: !!(P.applied && P.applied.at),
    4: !!(T.ans && Object.keys(T.ans).length >= 8 && Object.keys(T.ans).every(function (k) { return ['ok'].indexOf(T.ans[k]) >= 0; }))
  };
  var STEPS = [
    [1, 'Mon réglage', 'mon-reglage-ffb', 'mon-reglage-ffb.html', 'mon-reglage'],
    [2, 'Mesure', 'mon-reglage-ffb', 'mon-reglage-ffb.html#mesure', 'mesure'],
    [3, 'Comparer', 'comparateur-ffb', 'comparateur-ffb.html#mine', 'comparer'],
    [4, 'Valider sur piste', 'test-piste-ffb', 'test-piste-ffb.html', 'piste']
  ];
  var TOOLS = [['Calculateur', 'ffb-calculateur', 'calculateur-ffb.html', 'calculateur'], ['Notice', 'notice-ffb', 'notice-ffb.html', 'notice']];
  // Étape suggérée : la première non faite
  var next = 1; for (var i = 1; i <= 4; i++) { if (!done[i]) { next = i; break; } if (i === 4) next = 4; }

  var css = '.ffbnav{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;justify-content:space-between;margin:0 0 22px;font-family:Barlow,"IBM Plex Sans",Arial,sans-serif}' +
    '.ffbnav .steps,.ffbnav .tools{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '.ffbnav a{display:flex;align-items:center;gap:8px;padding:8px 13px;border-radius:9px;background:#15274b;border:1px solid #ffffff1f;color:#fff;text-decoration:none;font-weight:600;font-size:14px;line-height:1.2}' +
    '.ffbnav a:hover{border-color:#fd1424}.ffbnav .steps a b{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#2a3f68;font-size:12px}' +
    '.ffbnav .steps a.done b{background:#2fd47a;color:#06210f}.ffbnav .steps a.cur{background:#fd1424;border-color:#fd1424}.ffbnav .steps a.cur b{background:#fff;color:#fd1424}' +
    '.ffbnav .steps a.next:not(.cur){border-color:#fd1424}.ffbnav .sep{width:14px;height:2px;background:#2a3f68;border-radius:1px}' +
    '.ffbnav .tools span{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#98a4c2;font-weight:700;margin-right:2px}' +
    '.ffbnav .tools a{background:transparent;padding:6px 11px}.ffbnav .tools a.cur{border-color:#fd1424}' +
    '@media(max-width:640px){.ffbnav .sep{display:none}.ffbnav a{padding:7px 10px;font-size:13px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  nav.className = 'ffbnav';
  nav.setAttribute('aria-label', 'Parcours FFB Lab');
  var h = '<div class="steps">';
  STEPS.forEach(function (s, idx) {
    var cls = [done[s[0]] ? 'done' : '', page === s[4] ? 'cur' : '', s[0] === next ? 'next' : ''].join(' ').trim();
    if (idx) h += '<i class="sep" aria-hidden="true"></i>';
    h += '<a href="' + url(s[2], s[3]) + '" target="_top" class="' + cls + '"' + (page === s[4] ? ' aria-current="step"' : '') + '><b>' + (done[s[0]] && page !== s[4] ? '✓' : s[0]) + '</b>' + s[1] + '</a>';
  });
  h += '</div><div class="tools"><span>Outils</span>';
  TOOLS.forEach(function (t) { h += '<a href="' + url(t[1], t[2]) + '" target="_top"' + (page === t[3] ? ' class="cur" aria-current="page"' : '') + '>' + t[0] + '</a>'; });
  nav.innerHTML = h + '</div>';
})();
