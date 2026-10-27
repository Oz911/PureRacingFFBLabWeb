PURE RACING FX — FFB ANALYZER · PAGE DE DÉMONSTRATION
=====================================================

Cette page est la page web du plugin SimHub Pure FFB Analyzer, en mode démonstration.
Le fichier demo.js remplace l'API du plugin par un simulateur qui tourne dans le navigateur,
avec les mêmes règles de calcul que le plugin (seuil 98 %, marge = 1 − pic, fenêtre de gain 0,75/pic à 0,90/pic).

Scénario : Spa en LMU, force trop élevée pendant deux tours (écrêtage), puis réduite (marge correcte).
La session recommence après cinq tours.

Fichiers : index.html, app.js (identique au plugin), demo.js (simulateur), data.js (profils de référence).
Aucune donnée n'est mesurée ni envoyée. Pour retirer la démo dans le plugin, il suffit de ne pas charger demo.js.
