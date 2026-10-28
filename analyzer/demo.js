/* Pure Racing FX — FFB Analyzer : mode démonstration.
   Remplace l'API du plugin SimHub par un simulateur, avec les mêmes règles de calcul que le plugin
   (seuil 98 %, hystérésis 3 points, événement ≥ 40 ms, niveau de référence = 99,5e centile,
   verdict < 0,5 % correct / 0,5–2 % à surveiller / > 2 % excessif, tours avec incident exclus).
   Scénario en trois tours, puis la session recommence :
     1. tête-à-queue au Raidillon → tour exclu (non comptabilisé)
     2. force en jeu trop haute (72 %) → écrêtage excessif, conseil de baisse
     3. force baissée à 56 %, dans la plage conseillée → réglage correct
   Stabilité en ligne droite (angle du volant) : légère oscillation à Kemmel au tour 2, stable au tour 3.
   Carte : tracé de Spa enregistré par le plugin dans LMU.
   Aucune donnée n'est mesurée. */
(function () {
  'use strict';
  window.PFA_DEMO = true;

  const STC = 10, MEAS_SCALE = 86.2, NM_PER_LOAD = 12.5, HZ = 60, THR = 0.98, REL = 0.95, MIN_EVT = 0.040, LAP_S = 20;   // tour simulé raccourci à 20 s pour une démo courte
  const K = 1.19, COL = 4.4, EQ = 0.9;   // COL : échelle du couple de colonne LMU ; EQ : ramène au couple voiture équivalent (≈ 13 Nm)
                                         // K : charge simulée → signal pour une force en jeu de 100 %
  // Virages de Spa (position sur le tour, largeur, charge) : la charge FFB monte dans les appuis
  const CORNERS = [[.03, .012, .55], [.10, .020, .95], [.17, .015, .70], [.25, .010, .45], [.33, .030, 1.02],
                   [.42, .018, .80], [.50, .025, .90], [.58, .012, .60], [.66, .035, 1.08], [.76, .020, .85],
                   [.86, .015, .75], [.95, .010, .50]];
  // Scénario : force en jeu par tour, incident éventuel (position du tête-à-queue) et temps affiché
  const SCENARIO = [
    { force: 0.52, spinAt: 0.30, time: 158.4, osc: null },   // 1 : tête-à-queue → exclu
    { force: 0.72, spinAt: null, time: 146.8, osc: { pkpk: 1.3, freq: 6, at: 0.205, len: 0.03 } },   // 2 : force trop haute → écrêtage excessif, oscillation à Kemmel
    { force: 0.56, spinAt: null, time: 145.9, osc: null }    // 3 : force baissée dans la plage conseillée → correct, stable
  ];
  // Tracé de Spa (FFB Analyzer, LMU) : coordonnées X / Z du jeu en mètres, 300 points, départ au point 0
  const MAP = { version: 1, track: 'Circuit de Spa-Francorchamps', x: [-232,-241,-250,-260,-269,-278,-288,-297,-306,-314,-317,-313,-301,-285,-266,-248,-231,-213,-196,-179,-163,-148,-132,-115,-97,-80,-63,-47,-31,-15,2,18,33,47,62,78,95,113,131,150,169,187,205,220,234,245,255,263,270,277,285,296,309,323,337,351,365,378,391,404,415,426,437,448,458,468,476,484,491,499,506,514,521,528,535,543,550,558,566,573,581,588,596,604,611,618,626,633,641,648,656,663,671,679,685,692,696,698,696,688,676,665,657,654,657,663,668,670,667,659,647,630,612,593,574,556,537,518,499,481,463,444,424,404,383,366,354,349,354,366,383,403,423,442,457,469,476,478,475,469,461,453,445,437,430,423,417,411,406,401,396,391,387,382,376,371,364,354,341,324,305,283,261,239,216,193,170,149,130,113,98,84,73,63,55,48,41,34,27,20,13,6,-1,-9,-18,-28,-41,-58,-77,-97,-118,-139,-161,-182,-204,-226,-245,-261,-274,-285,-297,-308,-319,-331,-344,-358,-376,-396,-417,-438,-459,-479,-498,-516,-532,-545,-554,-560,-561,-559,-554,-546,-537,-527,-516,-504,-490,-475,-458,-441,-425,-409,-393,-377,-360,-340,-319,-298,-278,-259,-240,-219,-198,-178,-160,-142,-125,-108,-93,-79,-67,-55,-45,-36,-27,-19,-11,-4,1,4,4,2,-2,-8,-16,-25,-35,-45,-56,-65,-74,-83,-90,-97,-103,-108,-113,-117,-120,-123,-126,-128,-127,-122,-111,-97,-86,-83,-88,-98,-109,-122,-135,-148,-161,-174,-187,-199,-211,-222], z: [745,762,780,797,815,832,850,868,885,902,918,931,939,940,935,928,920,912,903,894,885,875,864,852,838,824,809,794,777,760,741,723,706,690,674,657,639,622,606,591,577,563,549,534,516,497,476,453,432,411,391,370,348,327,307,288,269,250,231,213,196,178,158,137,114,92,71,50,29,7,-16,-39,-60,-82,-104,-126,-148,-169,-192,-214,-236,-258,-281,-304,-327,-348,-370,-392,-414,-436,-458,-480,-502,-524,-545,-566,-587,-609,-630,-650,-669,-688,-707,-728,-751,-774,-797,-819,-840,-860,-879,-896,-911,-925,-938,-952,-965,-980,-994,-1008,-1022,-1034,-1046,-1052,-1052,-1044,-1029,-1010,-990,-972,-957,-944,-931,-918,-903,-886,-866,-846,-824,-802,-779,-756,-734,-713,-691,-668,-646,-625,-603,-581,-558,-535,-512,-488,-465,-443,-421,-401,-382,-366,-354,-345,-340,-338,-340,-344,-351,-361,-372,-386,-402,-421,-440,-462,-484,-507,-530,-554,-577,-599,-620,-641,-662,-684,-705,-725,-742,-757,-767,-771,-770,-764,-758,-753,-753,-758,-770,-785,-803,-824,-845,-866,-886,-907,-926,-943,-956,-962,-962,-956,-945,-933,-919,-904,-888,-869,-849,-826,-804,-781,-759,-737,-715,-695,-676,-657,-637,-617,-597,-578,-562,-547,-533,-520,-507,-493,-480,-467,-456,-445,-435,-423,-410,-397,-384,-370,-354,-337,-320,-301,-281,-260,-239,-218,-197,-176,-154,-130,-106,-83,-60,-38,-16,6,27,48,69,91,113,135,156,178,199,222,244,267,290,312,334,355,378,401,422,441,455,466,479,495,515,535,554,574,593,614,634,654,674,692,710,728] };
  const GAINS = SCENARIO.map(x => x.force);

  let t = 0, lapIdx = 0, gainIdx = 0, rate = HZ;
  let hist = [], peakQ = [], laps = [], events = [];
  let inClip = false, clipStart = 0, clipPeak = 0, clipPos = 0;
  let lap = newLap(1), sess = { meas: 0, clip: 0, ev: 0, peak: 0 };
  let seed = 7, lastCarNm = 0, holdLap = false, steer = 0, oscOn = false, lastPos = 0;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function newLap(n) { return { lap: n, meas: 0, clip: 0, ev: 0, peak: 0, vals: [], nm: [], incident: '' }; }

  function load(pos) {
    let v = 0.18;
    for (const [c, w, a] of CORNERS) {
      let d = Math.abs(pos - c); d = Math.min(d, 1 - d);
      v += a * Math.exp(-Math.pow(d / w, 2));
    }
    return v;
  }

  function step() {
    const dt = 1 / HZ; t += dt;
    const pos = (t % LAP_S) / LAP_S;
    const sc = SCENARIO[gainIdx], g = sc.force * K;
    const kerb = (pos > .325 && pos < .34) || (pos > .655 && pos < .67) ? 0.12 * Math.sin(t * 90) : 0;
    let carNm = (load(pos) + 0.04 * Math.sin(t * 23) + 0.025 * (rnd() - .5) + kerb) * NM_PER_LOAD; // couple de colonne simulé
    // Tête-à-queue : pointe de couple au décrochage, puis volant presque inerte, voiture arrêtée quelques secondes
    if (sc.spinAt !== null && pos >= sc.spinAt) {
      const d = pos - sc.spinAt;
      if (d < 0.012) carNm = NM_PER_LOAD * (1.1 - d * 40) * (rnd() > .5 ? 1 : -1);
      else if (d < 0.10) carNm *= 0.06;
      if (!lap.incident) lap.incident = 'tête-à-queue ou arrêt en piste';
    }
    // Angle du volant : corrections lentes du pilote, oscillation éventuelle en ligne droite (Kemmel)
    const o = sc.osc; oscOn = !!o && pos >= o.at && pos < o.at + o.len; lastPos = pos;
    steer = 1.2 * Math.sin(t * 2.1) + 0.5 * Math.sin(t * 0.9) + (oscOn ? o.pkpk / 2 * Math.sin(2 * Math.PI * o.freq * t) : 0);
    let v = carNm / NM_PER_LOAD * g;
    lastCarNm = carNm;
    v = Math.max(0, Math.min(1, v));                       // le jeu sature à 100 %
    const sign = Math.sin(pos * Math.PI * 14) >= 0 ? 1 : -1;
    const f = v * sign, a = v;

    hist.push([t, f]); while (hist.length && t - hist[0][0] > 10) hist.shift();
    peakQ.push([t, a]); while (peakQ.length && t - peakQ[0][0] > 3) peakQ.shift();

    lap.meas += dt; sess.meas += dt; lap.vals.push(a); lap.nm.push(Math.abs(carNm));
    if (a > lap.peak) lap.peak = a; if (a > sess.peak) sess.peak = a;
    if (a >= THR) { lap.clip += dt; sess.clip += dt; }
    if (!inClip && a >= THR) { inClip = true; clipStart = t; clipPeak = a; clipPos = pos; }
    else if (inClip) {
      if (a > clipPeak) clipPeak = a;
      if (a < REL) {
        inClip = false;
        if (t - clipStart >= MIN_EVT) { lap.ev++; sess.ev++; events.push({ lap: lap.lap, duration_ms: (t - clipStart) * 1000, peak: clipPeak, track_pct: clipPos }); }
      }
    }

    // fin de tour
    if (Math.floor(t / LAP_S) > lapIdx) {
      lapIdx++;
      // Après le tour 3, un tour supplémentaire laisse le résultat affiché, puis la session recommence au départ du tour
      if (holdLap) { holdLap = false; reset(); return; }
      const s = lap.vals.slice().sort((x, y) => x - y);
      const p99 = s[Math.min(s.length - 1, Math.ceil(.99 * s.length) - 1)];
      const p995 = s[Math.min(s.length - 1, Math.ceil(.995 * s.length) - 1)];
      const clipPct = lap.clip / lap.meas, margin = 1 - p995;
      // Même verdict que FfbModel.Verdict : écrêtage < 0,5 % correct, 0,5–2 % à surveiller, > 2 % excessif, niveau < 50 % marge excessive
      const status = lap.incident ? 'Excluded' : clipPct > .02 ? 'Clipping' : clipPct >= .005 ? 'Risk' : p995 < .5 ? 'Excessive' : 'Ok';
      const sn = lap.nm.slice().sort((x, y) => x - y), p99nm = sn[Math.min(sn.length - 1, Math.ceil(.99 * sn.length) - 1)];
      laps.push({ p99_nm: p99nm * COL, equiv_nm: p99nm * EQ, lap: lap.lap, time: sc.time, clip_pct: clipPct, events: lap.ev, peak: lap.peak, p99: p99, p995: p995, margin: margin, status: status, incident: lap.incident, force: sc.force, incident_pct: sc.spinAt,
        osc_status: sc.osc ? 'Light' : 'Stable', osc_pkpk: sc.osc ? sc.osc.pkpk : 0, osc_freq: sc.osc ? sc.osc.freq : null, osc_pct: sc.osc ? sc.osc.at : null, straight_s: 24 });
      gainIdx++;
      if (gainIdx >= SCENARIO.length) { holdLap = true; gainIdx = SCENARIO.length - 1; lap = newLap(lap.lap + 1); }
      else lap = newLap(lap.lap + 1);
    }
  }

  function reset() {
    gainIdx = 0; laps = []; events = []; hist = []; peakQ = [];
    lap = newLap(1); sess = { meas: 0, clip: 0, ev: 0, peak: 0 }; inClip = false;
  }

  // Avance rapide au chargement : le tour exclu est déjà dans le tableau, le tour écrêté se termine environ 10 s après l'arrivée,
  // le tour correct 20 s plus tard ; cycle complet d'environ 80 s
  for (let i = 0; i < HZ * LAP_S * 1.5; i++) step();
  setInterval(() => { for (let i = 0; i < 4; i++) step(); }, 4000 / HZ);

  function live() {
    const last = hist.length ? hist[hist.length - 1] : [t, 0];
    const valid = laps.filter(l => l.status !== 'Excluded'), lastLap = valid.length ? valid[valid.length - 1] : null;
    const needs = !!lastLap && lastLap.status !== 'Ok' && lastLap.status !== 'Unknown';
    const pct = x => Math.round(x * 100), force = lastLap ? lastLap.force : SCENARIO[gainIdx].force;
    const stride = Math.max(1, Math.ceil(hist.length / 240));
    const ht = [], hv = [];
    for (let i = 0; i < hist.length; i += stride) {
      let best = i; for (let j = i; j < Math.min(hist.length, i + stride); j++) if (Math.abs(hist[j][1]) > Math.abs(hist[best][1])) best = j;
      ht.push(hist[best][0] - last[0]); hv.push(hist[best][1]);
    }
    return {
      version: '1.0.0', game: 'Le Mans Ultimate · Ferrari 296 LMGT3 · Spa', source_ok: true, source: 'démonstration',
      unit: 'normalized', full_scale: 1, raw: last[1], signal: last[1],
      peak_window: peakQ.reduce((m, x) => Math.max(m, x[1]), 0), clipping: inClip, threshold: THR,
      lap: lap.lap, lap_clip_pct: lap.meas ? lap.clip / lap.meas : 0, lap_clip_events: lap.ev, lap_peak: lap.peak,
      session_clip_pct: sess.meas ? sess.clip / sess.meas : 0, session_clip_events: sess.ev, session_peak: sess.peak,
      gain_lo: needs ? .75 / lastLap.p995 : null, gain_hi: needs ? .90 / lastLap.p995 : null,
      advice: !lastLap ? '' : !needs ? 'Réglage correct : écrêtage sous 0,5 % du tour, niveau de référence ' + Math.round(lastLap.p995 * 100) + ' % (99,5e centile). Aucun ajustement nécessaire.'
        : (lastLap.status === 'Clipping' ? 'Écrêtage excessif' : lastLap.status === 'Risk' ? 'Écrêtage à surveiller' : 'Marge excessive') + ' : pour ramener le niveau de référence (' + pct(lastLap.p995) + ' %) entre 75 et 90 %, régler la force FFB en jeu de ' + pct(force) + ' % à ' + pct(force * .75 / lastLap.p995) + '–' + pct(force * .90 / lastLap.p995) + ' %' + (lastLap.p995 >= THR ? '. Valeur haute : le signal saturé masque le vrai niveau, refaire un tour après réglage.' : '.'),
      lap_incident: lap.incident, excluded_laps: laps.filter(l => l.status === 'Excluded').length, last_valid_lap: lastLap ? lastLap.lap : 0,
      settings_confirmed: true, settings_stc: STC, settings_strength: SCENARIO[gainIdx].force, settings_mult: 1,
      torque_nm: lastCarNm * COL, scale_nm: MEAS_SCALE, settings_scale_nm: STC / SCENARIO[gainIdx].force,
      last_equiv_nm: lastLap ? lastLap.equiv_nm : null, lap_equiv_nm: null,
      recording: true, session_id: 'demo', rate_hz: rate, history: { t: ht, v: hv }, laps: laps.slice(-30), events: events.slice(-15),
      track_pct: lastPos, map_version: 1, has_pos: true, lap_incident_pct: lap.incident ? SCENARIO[gainIdx].spinAt : null,
      has_steer: true, steer_deg: steer, osc_active: oscOn, lap_osc_events: oscOn || (SCENARIO[gainIdx].osc && lastPos > SCENARIO[gainIdx].osc.at) ? 1 : 0,
      lap_osc_pkpk: SCENARIO[gainIdx].osc && lastPos > SCENARIO[gainIdx].osc.at ? SCENARIO[gainIdx].osc.pkpk : 0, lap_osc_status: 'Unknown'
    };
  }

  const SESSIONS = [
    { id: 'demo-3', started: '2026-10-26T21:14:00', game: 'Le Mans Ultimate', car: 'Ferrari 296 LMGT3', track: 'Spa-Francorchamps', complete: true, totals: { laps: 12, clip_pct: .0021, peak: .99 } },
    { id: 'demo-2', started: '2026-10-25T18:40:00', game: 'Assetto Corsa', car: 'Porsche 911 GT3 R', track: 'Nürburgring GP', complete: true, totals: { laps: 9, clip_pct: .0184, peak: 1 } },
    { id: 'demo-1', started: '2026-10-24T20:05:00', game: 'rFactor 2', car: 'BMW M4 GT3', track: 'Monza', complete: true, totals: { laps: 15, clip_pct: 0, peak: .86 } }
  ];

  function csv() {
    const rows = ['temps_s;tour;position_piste_pct;vitesse_kmh;valeur_brute;signal_pct;ecretage;couple_colonne_nm;angle_volant_deg;repere'];
    for (let i = 0; i < 600; i++) {
      const p = i / 600, v = Math.min(1, load(p) * .9);
      rows.push([(i / HZ).toFixed(3).replace('.', ','), 1, (p * 100).toFixed(2).replace('.', ','), '182,0', v.toFixed(4).replace('.', ','), (v * 100).toFixed(2).replace('.', ','), v >= THR ? 1 : 0, (load(p) * NM_PER_LOAD * COL).toFixed(3).replace('.', ','), (1.2 * Math.sin(i / HZ * 2.1)).toFixed(3).replace('.', ','), ''].join(';'));
    }
    return '﻿' + rows.join('\r\n');
  }

  const realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (url, opts) {
    const u = String(url);
    const json = o => Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    if (u.indexOf('api/live') === 0) return json(live());
    if (u.indexOf('api/sessions') === 0) return json(SESSIONS);
    if (u.indexOf('api/map') === 0) return json(MAP);
    return realFetch ? realFetch(url, opts) : Promise.reject(new Error('fetch indisponible'));
  };

  // Liens CSV de l'onglet Sessions : fichier d'exemple généré dans le navigateur
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href*="api/session/csv"]');
    if (!a) return;
    e.preventDefault();
    const url = URL.createObjectURL(new Blob([csv()], { type: 'text/csv;charset=utf-8' }));
    const l = document.createElement('a'); l.href = url; l.download = 'session-demo.csv'; document.body.appendChild(l); l.click(); l.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
