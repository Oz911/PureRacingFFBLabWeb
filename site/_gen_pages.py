# Génère les pages des modules du site Pure Racing FX (même modèle que training.html).
import html, sys
OUT = sys.argv[1]
# À augmenter quand site.css ou site.js changent : les navigateurs gardent l'ancien fichier 10 min.
VERSION = '12'

HEAD = '''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} · Pit Box · Pure Racing FX</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:ital,wght@0,600;0,700;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="site.css?v={V}">
</head>
<body>
'''
MIC = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>'
TONES = ['tone-steel', 'tone-navy', 'tone-black', 'tone-navy']

def hero(p):
    chips = ''.join(f'<span class="{"red" if i == 0 and p.get("chip_red", True) else ""}">{c}</span>' for i, c in enumerate(p['chips']))
    return f'''<!-- ================= EN-TÊTE DU MODULE ================= -->
<header class="mhero">
  <div class="bg" style="background-image:url(img/{p['img']})"></div>
  <div class="veil"></div>
  <div class="wrap">
    <div class="crumbs"><a data-page="accueil">Pit Box</a> › <b>Module {p['num']}</b> · {p['name']}</div>
    <h1>Pure Racing <span>{p['title']}</span></h1>
    <div class="sub">{p['sub']}</div>
    <p class="lead">{p['lead']}</p>
    <div class="chips">{chips}</div>
  </div>
</header>
'''

def feature(f, i):
    tone = f.get('tone', TONES[i % len(TONES)])
    rev = ' rev' if i % 2 else ''
    body = ''.join(f'<p>{x}</p>' for x in f.get('paras', []))
    if f.get('bullets'):
        body += '<ul>' + ''.join(f'<li><span>{b}</span></li>' for b in f['bullets']) + '</ul>'
    if f.get('radio'):
        right = '<div class="radio">' + ''.join(f'<div class="bubble">{MIC}<p>« {q} »<small>{s}</small></p></div>' for q, s in f['radio']) + '</div>'
    else:
        note = f'<p class="capnote">{f["note"]}</p>' if f.get('note') else ''
        right = f'<div><div class="cap"><img src="captures/{f["cap"]}" alt="{html.escape(f["alt"])}" loading="lazy"></div>{note}</div>'
    idattr = f' id="{f["id"]}"' if f.get('id') else ''
    return f'''<section class="{tone}"{idattr}>
  <div class="wrap feat{rev}">
    <div class="txt">
      <div class="kicker">{f['kicker']}</div>
      <h2>{f['h2']}</h2>
      {body}
    </div>
    {right}
  </div>
</section>
'''

def boxes(b, tone):
    rows = ''
    for grp in b['groups']:
        rows += '<div class="grid3">' + ''.join(
            f'<div class="box">{"<span class=k>" + k + "</span>" if k else ""}<b>{t}</b><p>{d}</p></div>' for k, t, d in grp) + '</div>'
    return f'''<section class="{tone}">
  <div class="wrap">
    <div class="kicker">{b['kicker']}</div>
    <h2>{b['h2']}</h2>
    {'<p class="lead">' + b['lead'] + '</p>' if b.get('lead') else ''}
    {rows}
  </div>
</section>
'''

def table(rows, tone):
    tr = ''.join(f'<tr><td>{a}</td><td>{b}</td></tr>' for a, b in rows)
    return f'''<!-- ================= BON À SAVOIR ================= -->
<section class="{tone}">
  <div class="wrap">
    <div class="kicker">Bon à savoir</div>
    <h2>Avant <span>de commencer</span></h2>
    <div class="tbl">
      <table class="ref">
        <thead><tr><th>Point</th><th>Ce qu'il faut savoir</th></tr></thead>
        <tbody>{tr}</tbody>
      </table>
    </div>
  </div>
</section>
'''

def gallery(g, tone):
    cards = ''
    for d in g['items']:
        cards += f'''<article class="dcard" id="{d['slug']}">
      <div class="dimg"><img src="img/dash/{d['img']}" alt="Dashboard {html.escape(d['name'])}" width="480" height="270" loading="lazy"></div>
      <div class="dbody">
        <div class="dk">{d['kicker']}</div>
        <h3>{d['name']}</h3>
        <p>{d['desc']}</p>
        <a class="btn red" href="{d['url']}" target="_top" rel="noopener">Télécharger</a>
      </div>
    </article>
'''
    return f'''<!-- ================= GALERIE ================= -->
<section class="{tone}" id="galerie">
  <div class="wrap">
    <div class="kicker">{g['kicker']}</div>
    <h2>{g['h2']}</h2>
    {'<p class="lead">' + g['lead'] + '</p>' if g.get('lead') else ''}
    <div class="dgrid">
    {cards}</div>
  </div>
</section>
'''

def nxt(n):
    return f'''<!-- ================= SUITE ================= -->
<section class="tone-navy">
  <div class="wrap">
    <div class="next">
      <div>
        <div class="t">{n['t']}</div>
        <p>{n['p']}</p>
      </div>
      <div class="links">
        <a class="btn" data-page="{n['page']}">{n['label']} →</a>
        <a class="btn red" data-prfx="download" target="_top" href="#">Télécharger Pit Box</a>
      </div>
    </div>
  </div>
</section>
'''

def page(p):
    s = HEAD.replace('{V}', VERSION).format(name=p['name'], desc=html.escape(p['desc'])) + hero(p)
    for i, f in enumerate(p['features']):
        s += feature(f, i)
    n = len(p['features'])
    if p.get('gallery'):
        s += gallery(p['gallery'], TONES[n % len(TONES)]); n += 1
    if p.get('boxes'):
        s += boxes(p['boxes'], TONES[n % len(TONES)]); n += 1
    s += table(p['table'], 'tone-steel' if TONES[(n - 1) % len(TONES)] != 'tone-steel' else 'tone-black')
    s += nxt(p['next']) + '\n<script src="site.js?v=' + VERSION + '"></script>\n</body>\n</html>\n'
    open(f"{OUT}/{p['file']}", 'w', encoding='utf-8').write(s)

PAGES = [
# ------------------------------------------------------------------ SPOTTER
dict(file='spotter.html', num='01', name='Spotter', title='Spotter', img='spotter.jpg',
  desc="Spotter, module de Pit Box : ta radio d'équipe en français, annonces en piste, questions à la voix et commandes des modules.",
  sub="Ta radio <span>d'équipe</span>",
  lead="Un spotter et un ingénieur dans ton casque, en français. Il t'annonce les voitures autour de toi, les drapeaux, les stands et la météo, répond à tes questions et pilote Pit Box à la voix, sans que tu lâches le volant.",
  chips=['Le Mans Ultimate', 'En français', 'Commandes à la voix', 'Un bouton du volant'],
  features=[
    dict(kicker='En piste', h2='Il voit <span>ce que tu ne vois pas</span>', cap='spotter.jpg', alt='Page Spotter : micro, bouton du volant, voix et annonces',
      paras=["Tu choisis ce qu'il annonce, une case par sujet. Les alertes passent toujours en premier ; les informations attendent un moment calme."],
      bullets=["<b>Spotter</b> : voiture à gauche, à droite, trois de front, puis « dégagé ».",
               "<b>Drapeaux</b>, <b>tour invalidé</b> et <b>pénalités</b>.",
               "<b>Stands</b> : arrêt demandé, entrée des stands à 100 m et à 50 m, limiteur, fin de limitation et ligne de retour en piste.",
               "<b>Pneus</b> (températures, crevaison), <b>carburant bas</b> et <b>météo</b> : pluie qui arrive, piste qui sèche.",
               "<b>Début de séance</b> : le circuit, les températures et le temps, comme à la radio."],
      note="Toutes les annonces se règlent dans le module : volume, voix, sujets."),
    dict(kicker='À la voix', h2='Pose <span>tes questions</span>', tone='tone-black',
      paras=["Un appui sur le bouton du volant, et tu parles. Ton ingénieur te répond tout de suite, sans que tu quittes la piste des yeux."],
      bullets=["<b>Carburant ou énergie</b>, <b>écarts</b> devant et derrière, <b>position</b>.",
               "<b>Pneus</b>, <b>météo</b>, <b>dernier et meilleur tour</b>, <b>temps ou tours restants</b>.",
               "<b>« Répète »</b>, <b>mode silencieux</b>, <b>reprends les annonces</b>.",
               "Et un peu de vie dans le casque : « Comment je m'en sors ? », « Motive-moi »…"],
      radio=[("Carburant : 42 litres, environ 6 tours et demi.", "Question : « carburant »"), ("Devant, à 1 seconde 2.", "Question : « écart devant »"), ("Entrée des stands dans cent mètres.", "Annonce : stands")]),
    dict(kicker='Le pilote aux commandes', h2='Pit Box <span>à la voix</span>', cap='accueil.jpg', alt="Accueil de Pit Box : les modules et la bascule jeu / Pit Box",
      paras=["Le Spotter est la pièce centrale de Pit Box : il relie ta voix à tous les modules."],
      bullets=["<b>« Active Motion »</b>, <b>« coupe Engine »</b> : les modules s'allument et s'éteignent à la voix.",
               "<b>Repères</b> : dis « survirage » ou « blocage » en roulant, le repère se pose sur la carte du circuit pour l'Ingénieur.",
               "<b>Conseils de Training</b> : après chaque tour, le virage où tu perds le plus de temps.",
               "<b>Bascule jeu ↔ Pit Box</b> sur un bouton du volant."],
      note="L'accueil de Pit Box : chaque module s'active d'un clic, ou à la voix."),
  ],
  table=[("Jeu", "Le Mans Ultimate : le Spotter lit la position de toutes les voitures, les drapeaux et la météo en direct."),
         ("Micro", "N'importe quel micro ou casque reconnu par Windows. La jauge du module montre s'il t'entend bien."),
         ("Bouton du volant", "Un appui pour parler. Le même bouton peut aussi servir à la bascule jeu / Pit Box."),
         ("Voix", "Une voix enregistrée pour les annonces courantes, et une voix de synthèse pour le reste."),
         ("Langue", "Français, pour les annonces comme pour les questions.")],
  next=dict(t='Ensuite : <span>Training</span>', p="Tes tours comparés à une référence, virage par virage, avec un conseil à la radio.", page='training', label='02 · Training')),

# ------------------------------------------------------------------ TÉLÉMÉTRIE
dict(file='telemetrie.html', num='03', name='Télémétrie', title='Télémétrie', img='engineer.jpg',
  desc="Télémétrie, module de Pit Box : tes séances MoTeC analysées et comparées, pilotage, freinage, pneus, suspensions, châssis et trajectoires.",
  sub='Comprendre <span>ton chrono</span>',
  lead="Télémétrie lit tes enregistrements MoTeC, trouve le meilleur tour de chaque séance et compare deux tours point par point. Sept pages d'analyse, une carte du circuit, et tout ce qu'il faut pour savoir où et pourquoi tu perds du temps.",
  chips=['MoTeC (.ld)', 'Le Mans Ultimate', '7 pages d\'analyse', 'Sur ta tablette'],
  features=[
    dict(kicker='Deux tours face à face', h2='Session A, <span>session B</span>', cap='telemetrie.jpg', alt="Télémétrie : les modules d'analyse",
      paras=["Choisis une séance A, et une séance B pour comparer : ton meilleur tour d'aujourd'hui contre celui d'hier, ou contre celui d'un équipier."],
      bullets=["<b>Pilotage / moteur</b> : vitesse, régime, rapports, accélérateur, frein, direction.",
               "<b>Chronos / comparaison</b> : le temps gagné ou perdu tout au long du tour.",
               "<b>Freinage / adhérence</b>, <b>pneumatiques</b>, <b>suspensions</b>, <b>châssis / dynamique</b>.",
               "<b>Carte / trajectoires</b> : les deux lignes superposées, virage par virage."]),
    dict(kicker='Les courbes', h2='Point <span>par point</span>', cap='telemetrie-courbes.jpg', alt='Comparaison des tours : vitesse, accélérateur, frein, régime et rapport',
      paras=["Les courbes des deux tours se superposent sur la distance, avec la carte à côté : un clic sur une courbe montre l'endroit sur le circuit."],
      bullets=["<b>Vitesse, accélérateur, frein, régime, rapport</b> sur le même axe.",
               "<b>Zoom</b> sur un virage, ou le tour entier.",
               "Les mesures clés en tête : meilleur tour, vitesse maxi, régime maxi, longueur du tour."]),
    dict(kicker='Sous le capot', h2='Pneus, <span>suspensions, freins</span>', cap='tele-freinage.jpg', alt='Zones de freinage : point de freinage, vitesses, pression maxi, blocages',
      bullets=["<b>Zones de freinage</b> : point de freinage, vitesse d'entrée et mini, pression maxi, relâché, blocages.",
               "<b>Pneus</b> : températures intérieur, centre, extérieur et pressions, roue par roue.",
               "<b>Suspensions</b> : débattements et vitesses d'amortisseur.",
               "<b>Châssis</b> : hauteurs de caisse selon la vitesse, roulis, tangage, diagramme G-G."]),
    dict(kicker='La carte', h2='Ta ligne <span>sur le circuit</span>', cap='tele-carte.jpg', alt='Carte du circuit avec vitesses mini et repères',
      paras=["La carte montre ta trajectoire en couleur (freinage, entre-deux, plein gaz), les vitesses mini de chaque virage et les repères que tu as posés à la voix avec le Spotter."]),
  ],
  table=[("Fichiers", "Les enregistrements MoTeC (.ld, avec leur .ldx) de ton jeu. Active l'export de télémétrie dans le jeu, puis ajoute son dossier dans Sessions."),
         ("Jeux", "Le Mans Ultimate en priorité ; les autres jeux qui exportent au format MoTeC."),
         ("Place sur le disque", "Une croix à côté de chaque séance supprime les vieux enregistrements, qui pèsent lourd."),
         ("Tablette", "Toutes les pages s'ouvrent aussi sur une tablette ou un téléphone du même Wi-Fi.")],
  next=dict(t="Ensuite : <span>l'ingénieur</span>", p="De la télémétrie au setup : un diagnostic et des réglages à essayer.", page='ingenieur', label='04 · Ingénieur')),

# ------------------------------------------------------------------ INGÉNIEUR
dict(file='ingenieur.html', num='04', name='Ingénieur', title='Ingénieur', img='ingenieur.jpg',
  desc="Ingénieur, module de Pit Box : réglage de setup à partir de ta télémétrie et de ton ressenti, préparation du week-end et stratégie carburant.",
  sub='Réglage <span>de setup</span>',
  lead="L'Ingénieur part de ta télémétrie et de ce que tu ressens au volant pour poser un diagnostic et proposer des réglages chiffrés. Un changement à la fois : tu essaies, tu compares, tu gardes ou tu annules.",
  chips=['Le Mans Ultimate', 'Diagnostic du setup', 'Préparation du week-end', 'Stratégie carburant'],
  features=[
    dict(kicker='Préparation du week-end', h2='Un setup <span>de base</span>', cap='ingenieur.jpg', alt="Ingénieur : préparation du week-end, contexte de la séance et profil du circuit",
      paras=["Choisis la séance à préparer (qualification ou course) et les conditions : l'Ingénieur lit le profil du circuit dans ta télémétrie et propose une base."],
      bullets=["<b>Profil du circuit</b> : part du tour à fond, plus longue pleine charge, vitesse de pointe, freinages forts, virages lents, moyens et rapides.",
               "<b>Points du diagnostic</b> : pneus trop froids, roue qui bloque au freinage, suspensions, rapports…",
               "<b>Réglages de base proposés</b>, avec le pourquoi et la priorité de chacun.",
               "<b>Ordre de travail</b> : par quoi commencer, dans l'ordre d'un vrai ingénieur."]),
    dict(kicker='Le diagnostic', h2='Ton setup, <span>lu à la loupe</span>', cap='inge-setup.jpg', alt='Setup et diagnostic : aéro, hauteurs, amortisseurs, pneus, freins, différentiel',
      paras=["Tout le setup de la séance en un coup d'œil (aéro, hauteurs et ressorts, amortisseurs, pneus et géométrie, freins, différentiel et électronique), face aux points relevés dans la télémétrie."]),
    dict(kicker='Stratégie', h2='Le carburant <span>au litre près</span>', cap='inge-strategie.jpg', alt='Stratégie de course : consommation mesurée et carburant à mettre',
      paras=["La consommation est mesurée sur tes tours, pas estimée : l'Ingénieur en déduit le carburant à mettre pour la course ou la qualification, avec la réserve que tu choisis."]),
  ],
  boxes=dict(kicker='En piste', h2='Mise au point, <span>un pas à la fois</span>',
    lead="Entre deux relais, l'Ingénieur compare la séance d'avant et celle d'après : tu sais si le changement a payé.",
    groups=[[('01', 'Tu ressens', "Survirage en entrée, arrière qui décroche, blocage : dis-le à la radio, le repère se pose sur la carte."),
             ('02', 'Il propose', "Un seul changement chiffré, celui qui répond le mieux à ce que tu ressens et à ce que montre la télémétrie."),
             ('03', 'Tu compares', "Un relais, puis la comparaison avant / après : tu gardes ou tu annules.")]]),
  table=[("Données", "Une séance analysée dans Télémétrie : l'Ingénieur reprend la même séance, rien à recharger."),
         ("Jeu", "Pensé pour Le Mans Ultimate : le setup est lu dans les fichiers de la séance."),
         ("Conseils", "Des pistes de réglage à essayer en piste, pas une vérité absolue : ton ressenti a toujours le dernier mot."),
         ("Radio", "Avec le Spotter, ton ingénieur te parle aussi en piste : encouragements et conseils.")],
  next=dict(t='Ensuite : <span>Engine</span>', p="Côté matériel : des profils moteur pour tes bass shakers.", page='engine', label='05 · Engine')),

# ------------------------------------------------------------------ ENGINE
dict(file='engine.html', num='05', name='Engine', title='Engine', img='engine.jpg',
  desc="Engine, module de Pit Box : profils moteur pour les bass shakers SimHub (ShakeIt), adaptés à chaque voiture.",
  sub='Profils <span>haptiques</span>',
  lead="Engine crée des profils moteur pour les bass shakers de SimHub, adaptés à chaque voiture : l'architecture du moteur, ses régimes, ses couches de vibrations. Il reconnaît la voiture et charge son profil tout seul.",
  chips=['Bass shakers', 'SimHub ShakeIt', 'Détection de la voiture', 'Réglage sur tablette'],
  features=[
    dict(kicker='Le profil moteur', h2='Chaque voiture <span>a sa voix</span>', cap='engine-spectre.jpg', alt='Engine : voiture détectée, spectre de fréquences et couches du moteur',
      paras=["Engine part de la voiture détectée (catégorie, cylindres, architecture, régime mini et maxi) et construit les couches de vibrations du moteur."],
      bullets=["<b>Couches</b> : vilebrequin, ralenti, battement, couple, bas, moyens et hauts régimes, régime maxi, limiteur.",
               "<b>Spectre de fréquences</b> : les couches superposées, pour voir comment elles se répartissent.",
               "<b>Gain, fréquences et activation</b> réglables couche par couche.",
               "<b>Générer et exporter</b> : le profil part directement dans ShakeIt Bass Shakers."]),
    dict(kicker='En roulant', h2='Réglé <span>depuis ta tablette</span>', cap='engine.jpg', alt="Page Engine dans Pit Box",
      paras=["Les couches se règlent aussi depuis une tablette ou un téléphone du même Wi-Fi, pendant que tu roules : tu sens le résultat tout de suite."],
      bullets=["<b>Templates LMU</b> prêts à l'emploi.", "<b>Propriétés « Road »</b> pour les effets de route.", "Les profils de chaque voiture sont gardés et rechargés automatiquement."]),
  ],
  table=[("Matériel", "Un ou plusieurs bass shakers (transducteurs) branchés sur une carte son, gérés par SimHub ShakeIt."),
         ("Jeux", "Le Mans Ultimate en priorité (templates) ; les jeux reconnus par SimHub."),
         ("Sortie audio", "Le spectre peut écouter la sortie réelle de tes shakers pour vérifier le rendu.")],
  next=dict(t='Ensuite : <span>Motion</span>', p="Les mouvements de ta voiture sur ton moniteur, ou sur ta plateforme.", page='motion', label='06 · Motion')),

# ------------------------------------------------------------------ MOTION
dict(file='motion.html', num='06', name='Motion', title='Motion', img='motion.jpg',
  desc="Motion, module de Pit Box : les mouvements de ta voiture sur ton moniteur ou ta plateforme, 6 axes envoyés à OpenTrack.",
  sub='Vue <span>dynamique</span>',
  lead="Motion transforme la télémétrie en mouvements sur 6 axes, envoyés à OpenTrack : la vue s'incline dans les virages, plonge au freinage, suit le relief. Sur un châssis dynamique, la plateforme bouge avec la voiture.",
  chips=['6 axes', 'OpenTrack', 'Châssis fixe ou dynamique', 'Réglage sur tablette'],
  features=[
    dict(kicker='Châssis fixe', h2='Ta vue <span>prend vie</span>', cap='motion.jpg', alt='Motion en châssis fixe : couples Sway + Roll et Surge + Pitch',
      paras=["Sur un cockpit fixe, Motion anime la caméra du jeu : tu sens les appuis, les freinages et le relief à l'écran, comme un mouvement de tête naturel."],
      bullets=["<b>Six axes</b> : Sway, Heave, Surge, Yaw, Pitch, Roll, chacun avec son interrupteur.",
               "<b>Réglés par couples</b> : Sway + Roll dans les virages, Surge + Pitch au freinage.",
               "<b>Gain, amplitude, deadzone, smoothing</b> : chaque axe se règle finement.",
               "<b>Limites de sécurité</b> sur chaque axe."]),
    dict(kicker='Châssis dynamique', h2='Ta plateforme <span>suit la voiture</span>', cap='motion-dynamique.jpg', alt='Motion en châssis dynamique : tuiles de coordination Roll vers X et Pitch vers Z',
      paras=["Sur une plateforme à vérins, les tuiles de coordination tiennent l'inclinaison qui dure : le banking de Daytona, un dévers, une montée."],
      bullets=["<b>Roll → X</b> et <b>Pitch → Z</b>, avec gains d'entrée et de sortie.",
               "<b>Inverser</b> sur chaque axe : le sens se règle dans Pit Box.",
               "<b>Préréglages par jeu et par châssis</b> : la liste ne montre que ceux de ton matériel, rappelés automatiquement."]),
  ],
  boxes=dict(kicker='Au quotidien', h2='Sans <span>prise de tête</span>',
    groups=[[('', 'OpenTrack lancé tout seul', "Pit Box démarre OpenTrack ; sa détection des jeux lance le suivi avec le jeu."),
             ('', 'Préréglages en couleur', "Le préréglage chargé est en vert ; le bouton Enregistrer passe au rouge dès qu'un réglage change."),
             ('', 'Réglage en roulant', "Tous les axes se règlent depuis une tablette, avec une visualisation en direct de ce qui part vers OpenTrack.")]]),
  table=[("Logiciel", "OpenTrack (gratuit), configuré une fois : entrée UDP sur le port 4242, sortie freetrack. La prise en main du module guide pas à pas."),
         ("Jeux", "Ceux qui acceptent un suivi de tête (TrackIR / freetrack) : Le Mans Ultimate, et d'autres. Pas Assetto Corsa, qui a son propre mouvement avec CSP."),
         ("Sens des axes", "Seul Z s'inverse dans OpenTrack ; les autres avec « Inverser » dans Pit Box.")],
  next=dict(t='Ensuite : <span>FFB Analyzer</span>', p="Ton force feedback mesuré : écrêtage, marge et couple.", page='ffb-analyzer', label='07 · FFB Analyzer')),

# ------------------------------------------------------------------ FFB ANALYZER
dict(file='ffb-analyzer.html', num='07', name='FFB Analyzer', title='FFB Analyzer', img='ffb.jpg',
  desc="FFB Analyzer, module de Pit Box : ton force feedback mesuré tour par tour, écrêtage, marge et couple de la voiture.",
  sub='Force feedback <span>mesuré</span>',
  lead="FFB Analyzer mesure le signal de force feedback pendant que tu roules : la part du tour passée en écrêtage, la marge qui te reste, le couple de la voiture. Tu sais si ton réglage sature, et de combien.",
  chips=['Le Mans Ultimate', 'rFactor 2', 'Assetto Corsa', 'Verdict à chaque tour'],
  features=[
    dict(kicker='En direct', h2='Ton FFB, <span>tour par tour</span>', cap='ffb.jpg', alt='FFB Analyzer : signal en direct, écrêtage, niveau de référence et tours de la session',
      paras=["Le signal des 10 dernières secondes, et pour chaque tour un verdict clair."],
      bullets=["<b>Écrêtage du tour</b> : la part du temps passée au-dessus du seuil, en roulant.",
               "<b>Niveau de référence</b> : les appuis forts réels, sans les pointes isolées des vibreurs.",
               "<b>Couple voiture</b> (LMU, rFactor 2) : le couple de colonne, ramené à une valeur comparable d'une voiture à l'autre.",
               "<b>Verdict</b> : correct, à surveiller, écrêtage excessif ou marge excessive."]),
  ],
  boxes=dict(kicker='Le verdict', h2='Trois seuils, <span>pas de jargon</span>',
    groups=[[('', 'Moins de 0,5 %', "Correct : ton FFB garde ses détails."),
             ('', 'De 0,5 à 2 %', "À surveiller : le signal sature par moments."),
             ('', 'Plus de 2 %', "Écrêtage excessif : baisse la force dans le jeu.")]]),
  table=[("Ce qui est mesuré", "Le signal FFB que le jeu publie, pas le couple produit par ta base : l'écrêtage de son pilote n'est pas vu."),
         ("Jeux", "Le Mans Ultimate, rFactor 2, Assetto Corsa (et les jeux qui publient leur FFB dans SimHub)."),
         ("Sessions", "Chaque séance est enregistrée : tu compares tes réglages d'un jour à l'autre."),
         ("Tablette", "Une page de suivi en direct s'ouvre sur une tablette ou un téléphone du même Wi-Fi.")],
  next=dict(t='Ensuite : <span>Dash</span>', p="Des tableaux de bord SimHub pour tous les styles de pilotage.", page='dash', label='08 · Dash')),

# ------------------------------------------------------------------ DASH
dict(file='dash.html', num='08', name='Dash', title='Dash', img='dash.jpg',
  desc="Dash, module de Pit Box : une collection de tableaux de bord SimHub, modernes ou classiques.",
  sub='Tableaux <span>de bord</span>',
  lead="Une collection de tableaux de bord pour SimHub, du plus épuré au plus complet, avec des designs modernes ou classiques. Un clic sur un modèle, et tu le télécharges.",
  chips=['SimHub', 'Modernes et classiques', 'Drapeaux et rivaux', 'Téléchargement direct'],
  features=[
    dict(kicker='La galerie', h2='Choisis <span>ton style</span>', cap='dash.jpg', alt='Galerie Dash : PRD01, ST800, PRD Rallye et autres modèles',
      paras=["Dans Pit Box, les modèles sont rangés par style : tous, modernes ou classiques. Chaque carte mène au téléchargement, plus bas sur cette page."],
      bullets=["<b>PRD01, PRD02</b> : complets, inspirés des écrans de course.",
               "<b>ST800, Analog Dash</b> : instruments classiques à aiguilles.",
               "<b>PRD Rallye, PRD RS01</b> : l'essentiel, lisible d'un coup d'œil.",
               "<b>Drapeaux et rivaux</b> : selon le modèle, les drapeaux et les écarts avec les voitures autour de toi."]),
  ],
  gallery=dict(kicker='Les dashboards', h2='Télécharge <span>ton modèle</span>',
    lead="Six modèles, gratuits. Télécharge le fichier .simhubdash, puis double-clique dessus : SimHub l'installe.",
    items=[
      dict(slug='prd01', name='PRD01', kicker='Modern · GT', img='prd01.png', url='https://pureracing-fx.odoo.com/web/content/1723?unique=76448d17c0d5100cb995ca558174c2e2afaffe02&download=true',
           desc="Inspiré du tableau de bord SPC d'iRacing, enrichi de nombreuses fonctions : G-mètre, données de télémétrie, classement et bien d'autres."),
      dict(slug='st800', name='ST800', kicker='Classic · Open Wheel', img='st800.png', url='https://pureracing-fx.odoo.com/web/content/1724?unique=b0700aaa3c8d2d7c6a71441eabea7dd0e2633340&download=true',
           desc="Un dashboard à aiguille inspiré des célèbres instruments STACK, présents à bord de nombreuses monoplaces."),
      dict(slug='prd-rallye', name='PRD Rallye', kicker='Modern · Rallye', img='prd-rallye.png', url='https://pureracing-fx.odoo.com/web/content/1762?unique=b4d7cca768661a3a81eb3205634bf27a9e2b7b36&download=true',
           desc="Un design simple avec les informations essentielles pour affronter les spéciales de rallye."),
      dict(slug='prd02', name='PRD02', kicker='Modern · GT', img='prd02.png', url='https://pureracing-fx.odoo.com/web/content/1727?unique=a87b8ee58e9f9fdbef29fd1a7c8cb44e4c961eb5&download=true',
           desc="Un dashboard numérique sur un seul écran, avec toutes les informations essentielles."),
      dict(slug='analog-dash', name='Analog Dash', kicker='Classic · GT', img='analog-dash.png', url='https://pureracing-fx.odoo.com/web/content/1788?unique=5df26209cfd6faa81cbde75966e9f55eb908a9b6&download=true',
           desc="Un dashboard analogique avec toute une panoplie d'instruments à aiguilles."),
      dict(slug='prd-rs01', name='PRD RS01', kicker='Modern · GT', img='prd-rs01.png', url='https://pureracing-fx.odoo.com/web/content/1726?unique=c94affe3b9be0ad82ece835b69dd6513fbe464bb&download=true',
           desc="L'esprit de l'instrumentation d'origine de la Renault Sport RS01, avec un affichage numérique lisible d'un coup d'œil."),
    ]),
  table=[("Installation", "Télécharge le modèle, puis double-clique dessus : SimHub l'ajoute à tes tableaux de bord."),
         ("Écrans", "Un écran de PC, un écran secondaire, une tablette ou un écran de volant reconnu par SimHub."),
         ("Assetto Corsa", "Les autres voitures ne sont connues que si les applications Python sont activées dans le jeu.")],
  next=dict(t='Retour <span>à Pit Box</span>', p="Les huit modules, la vidéo et l'installation.", page='accueil', label='Accueil')),
]

for p in PAGES:
    page(p)
print('ok', len(PAGES))
