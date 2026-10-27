# Pure Racing FX — FFB Lab | Pack Odoo V1

## Contenu
- `index.html` : page d'accueil FFB Lab
- `calculateur-ffb.html` : calculateur
- `comparateur-ffb.html` : comparateur
- `test-piste-ffb.html` : validation sur piste
- `notice-ffb.html` : notice technique autonome
- `notice-ffb-odoo.html` : même notice en bloc à coller dans la page Odoo /notice-ffb (styles isolés sous `.prfx-notice`)
- `analyzer/` : FFB Analyzer V2, maquette du plugin SimHub de visualisation et d'enregistrement du clipping (remplace l'ancien overlay ; données live synthétiques)
- `ffb-model.js` : hypothèses de calibration communes (comparateur = source, calculateur = réutilisation). À publier avec les HTML.
- `codes-integration-odoo.md` : extraits iframe à coller dans Odoo

## Publication conseillée
1. Tester `index.html` localement. Les liens internes entre les modules sont relatifs : conserver les HTML au même niveau et le dossier `analyzer/` tel quel.
2. Créer un dépôt **public** GitHub Pages distinct du plugin C# (par exemple `PureRacingFFBLabWeb`).
3. Importer les cinq fichiers HTML à la racine du dépôt et activer GitHub Pages dans Settings > Pages > Deploy from a branch (main, /root).
4. Vérifier l'URL réelle de GitHub Pages avant de la copier dans les iframes. Si l'iframe est bloquée par une politique d'intégration, utiliser un lien ouvrant l'outil dans un nouvel onglet.
5. Dans Odoo Online, créer les pages `/ffb-lab`, `/ffb-calculateur`, `/ffb-comparateur`, `/ffb-validation`, `/ffb-analyzer`, `/notice-ffb`. Ajouter un bloc d'intégration HTML si l'éditeur le permet et y coller le code iframe correspondant.
6. Publier d'abord une page de test non référencée, puis tester sur mobile et ordinateur.

## Remarques
- Odoo Online ne permet pas de déployer librement un module serveur personnalisé. Les outils restent des pages HTML statiques hébergées ailleurs.
- L'iframe affiche le contenu distant, elle ne le copie pas dans Odoo.
- Octobre 2026 : formules relues. Le calculateur règle LMU avec STC = couple délivré par la base et reprend la fenêtre de force du comparateur via `ffb-model.js` (source unique des hypothèses). Ne pas présenter les valeurs estimées comme des mesures réelles.
- Aucun serveur SimHub n'est inclus : l'Analyzer en ligne n'est qu'une maquette tant que le plugin n'est pas raccordé.
- L'hébergement GitHub Pages ne doit pas contenir de données privées ou de clés secrètes.
