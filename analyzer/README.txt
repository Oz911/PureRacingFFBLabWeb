PURE RACING FX — FFB ANALYZER · PAGE DE DÉMONSTRATION
=====================================================

Cette page est la page web du plugin SimHub Pure FFB Analyzer, en mode démonstration.
Le fichier demo.js remplace l'API du plugin par un simulateur qui tourne dans le navigateur,
avec les mêmes règles de calcul que le plugin (seuil 98 %, niveau de référence = 99,5e centile, verdict par part d'écrêtage, tours avec incident exclus).

Scénario : Spa en LMU, trois tours. 1 : tête-à-queue, tour exclu. 2 : force en jeu à 72 %, écrêtage excessif
et conseil de baisse. 3 : force baissée à 56 %, réglage correct. La session recommence ensuite.

Fichiers : index.html, app.js (identique au plugin), demo.js (simulateur), data.js (profils de référence).
Aucune donnée n'est mesurée ni envoyée. Pour retirer la démo dans le plugin, il suffit de ne pas charger demo.js.
