/* =====================================================================
   Pure Racing FX — FFB Lab : modèle de calibration partagé
   Source unique des hypothèses. Le comparateur est l'outil de calibration ;
   le calculateur réutilise ces fonctions au lieu d'avoir sa propre formule.
   ===================================================================== */
(function (root) {
  'use strict';

  /* Hypothèses de calibration (repères communautaires iRacing, non validés pour LMU) */
  const LIMITS = {
    G: { min: 0.30, max: 0.60 },        // sortie spécifique visée : Nm de base par Nm de voiture
    margin: { min: 0.10, max: 0.60 },   // marge avant écrêtage visée
    marginTarget: 0.15,                 // valeur préférée à l'intérieur de la fenêtre
    acPeak: { min: 0.75, max: 0.90 }    // AC : pic de force visé (fraction de la pleine échelle)
  };

  /* C : couple réellement disponible à la base */
  function baseTorque(A, T, B) { return Math.min(A, T) * B; }

  /* E : couple voiture qui donne 100 % du signal.
     LMU : hypothèse « STC = couple disponible » → 1 Nm voiture = 1 Nm base à 100 %. */
  function lmuEq(STC, s, m) { return STC / (s * m); }
  function lmuStrength(STC, m, E) { return STC / (E * m); }

  /* Évaluation d'un réglage connu (C, E, H) */
  function evaluate(C, Eq, H) {
    const G = C / Eq, J = G * H, K = C - J;
    return { C, Eq, G, J, K, L: K / C };
  }
  function evaluatePeak(C, P) {           // AC : pic mesuré P
    const J = P * C, K = C - J;
    return { C, J, K, L: 1 - P, G: NaN };
  }

  /* Fenêtre de E respectant à la fois la sortie spécifique et la marge */
  function windowE(C, H) {
    const M = C / LIMITS.G.max, N = C / LIMITS.G.min;
    const lo = Math.max(M, H / (1 - LIMITS.margin.min));
    const hi = Math.min(N, H / (1 - LIMITS.margin.max));
    return { M, N, lo, hi, ok: lo <= hi };
  }

  /* LMU : recommandation de Force Feedback Strength (fraction, plafonnée à 100 %).
     pick = valeur visant 15 % de marge, ramenée dans la fenêtre du comparateur.
     feasible = false si aucune valeur ≤ 100 % ne respecte la fenêtre :
     la cible ne peut pas être atteinte avec ces hypothèses (à vérifier en télémétrie),
     ce qui n'implique pas automatiquement de modifier le driver. */
  function lmuRecommend(C, STC, m, H) {
    const w = windowE(C, H);
    const sMin = lmuStrength(STC, m, w.hi), sMax = lmuStrength(STC, m, w.lo);
    const target = lmuStrength(STC, m, H / (1 - LIMITS.marginTarget));
    const feasible = w.ok && sMin <= 1;
    let pick;
    if (feasible) pick = Math.min(1, Math.max(sMin, Math.min(sMax, target)));
    else pick = Math.min(1, target);
    const res = evaluate(C, lmuEq(STC, pick, m), H);
    return { window: w, sMin, sMax: Math.min(1, sMax), target, pick, feasible, capped: target > 1, ...res };
  }

  /* AC : fenêtre de gain à partir d'un pic mesuré P au gain g */
  function acGainWindow(g, P) {
    return { lo: g * LIMITS.acPeak.min / P, hi: g * LIMITS.acPeak.max / P };
  }

  /* Verdicts communs */
  function statusG(G) {
    if (!Number.isFinite(G)) return ['neutral', '–'];
    if (G > LIMITS.G.max) return ['bad', 'Force élevée : risque de lutter avec le volant'];
    if (G < LIMITS.G.min) return ['warn', 'Plage dynamique faible : détails peu perceptibles'];
    return ['ok', 'Dans la bonne plage (30-60 %)'];
  }
  function statusL(L) {
    if (!Number.isFinite(L)) return ['neutral', '–'];
    if (L < 0) return ['bad', 'Écrêtage : détails perdus'];
    if (L <= LIMITS.margin.min) return ['risk', 'Risque d\'écrêtage aux limites'];
    if (L > LIMITS.margin.max) return ['warn', 'Marge excessive : résolution réduite'];
    return ['ok', 'Marge correcte'];
  }

  /* Couples de direction max indicatifs (hors vibreurs, relevés dans iRacing) */
  const CARS = [["Formula 3",14,20],["Formula Vee",16,22],["GT3 (iRacing)",8,15],["GT3 / LMGT3 moteur central (mesuré LMU)",12,12.5],["GT3 / LMGT3 moteur avant (mesuré LMU)",14,15],["GT4",12,18],["GTP / LMDh",10,16],["INDY IR-18",30,60],["Mazda MX-5 Cup",18,22],["NASCAR Next Gen Cup",28,35],["Porsche 911 Cup (992)",18,20],["Street Stock",18,25],["V8 Supercars",22,28]];

  root.FFBModel = { LIMITS, CARS, baseTorque, lmuEq, lmuStrength, evaluate, evaluatePeak, windowE, lmuRecommend, acGainWindow, statusG, statusL };
})(typeof window !== 'undefined' ? window : globalThis);
