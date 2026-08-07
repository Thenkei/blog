# Direction artistique — Cartographie des systèmes

## Statut du document

Ce document est la référence de direction artistique du blog. Il définit ce qui doit rester stable lorsque de nouveaux articles, diagrammes, thèmes ou composants sont ajoutés.

Les règles visuelles sont des invariants de marque. Les dimensions, composants et chemins de fichiers décrivent l’implémentation actuelle et peuvent évoluer tant que ces invariants sont préservés.

## Idée directrice

La direction artistique représente le blog comme une **cartographie de systèmes sous contraintes**.

Elle relie quatre dimensions du parcours de Morgan :

- les mathématiques, par les graphes, les trajectoires et les profils ;
- le trail, par les courbes topographiques, les traces et les checkpoints ;
- la robotique et l’embarqué, par les circuits, les signaux et les frontières physiques ;
- le NLP et l’IA, par les flux de décision, les boucles de validation et les zones de contrôle.

Ces références ne doivent pas être utilisées comme des décorations indépendantes. Chaque visuel doit montrer un système : un flux, une contrainte, une frontière, une progression ou une décision.

La signature recherchée est immédiatement reconnaissable :

> Une carte technique vivante, précise comme un schéma d’ingénierie et sensible comme une trace de trail.

## Positionnement visuel

Le blog doit produire trois impressions simultanées :

1. **Précision** — les diagrammes ont une logique et peuvent être lus.
2. **Énergie** — les lignes progressent, traversent des étapes et convergent vers un objectif.
3. **Profondeur** — les surfaces, grilles et couches suggèrent un environnement plus large que la seule page.

Le résultat ne doit être ni une documentation d’entreprise générique, ni une interface cyberpunk chargée, ni un magazine outdoor littéral. La personnalité vient de la combinaison constante entre terrain, systèmes et mouvement.

## Grammaire graphique

### 1. Courbes topographiques

Les courbes de niveau donnent une structure commune aux quatre thèmes. Elles expriment le contexte, la complexité et le relief du problème.

Règles :

- utiliser des lignes fines, peu contrastées et non interactives ;
- éviter qu’elles concurrencent le contenu principal ;
- les employer en fond de hero, dans les cartes sans schéma dédié et dans certaines surfaces éditoriales ;
- conserver une densité régulière plutôt qu’un motif naturaliste détaillé.

### 2. Traces et flux

Une ligne principale représente le chemin utile à la compréhension : parcours, requête, signal, décision ou durée.

Règles :

- une direction principale par diagramme ;
- un début et une fin identifiables ;
- des flèches seulement lorsqu’elles apportent une information de sens ;
- des embranchements réservés aux erreurs, alternatives ou escalades réelles.

### 3. Nœuds

Les nœuds représentent les états ou acteurs importants. Ils utilisent des formes simples, majoritairement rectangulaires et arrondies.

La couleur d’un nœud a une signification :

- couleur principale : étape normale du système ;
- couleur secondaire : sortie correcte ou objectif atteint ;
- `hot` : checkpoint, frontière ou décision humaine ;
- `danger` : arrêt, échec ou escalade.

### 4. Checkpoints

Les checkpoints relient le langage du trail à celui de l’ingénierie. Ils matérialisent une preuve, un contrôle, un jalon temporel ou un point de validation.

Un checkpoint ne doit jamais être purement décoratif. Sa présence signifie qu’une condition peut être vérifiée à cet endroit.

### 5. Frontières

Les cadres en pointillés représentent une limite de responsabilité ou de privilège : réseau client, runtime borné, fenêtre de course, périmètre d’exécution.

Une frontière doit être nommée. Elle indique explicitement ce qui est dedans, dehors ou contrôlé.

## Système typographique

Trois familles ont des rôles distincts :

| Police | Rôle | Usage |
| --- | --- | --- |
| `Space Grotesk` | Impact et structure | Titres, nœuds, grandes affirmations |
| `Manrope` | Lecture longue | Paragraphes, descriptions, navigation éditoriale |
| `IBM Plex Mono` | Mesure et instrumentation | Métadonnées, légendes, labels, tags, checkpoints |

Règles :

- ne pas utiliser la monospace pour de longs paragraphes ;
- ne pas remplacer les labels techniques par une typographie décorative ;
- garder des titres denses et francs, avec peu d’effets ;
- utiliser la hiérarchie typographique avant d’ajouter des cadres ou des couleurs.

## Les quatre thèmes

Les thèmes changent l’atmosphère, pas la structure ni la sémantique du blog.

| Thème | Atmosphère | Accent principal | Rôle narratif |
| --- | --- | --- | --- |
| `light` | Carte claire, précise et aérée | Bleu / vert | Lecture analytique, lumière diurne |
| `dark` | Console nocturne sobre | Cyan / menthe | Systèmes, code, concentration |
| `mountain` | Terrain profond et minéral | Menthe / sable | Endurance, progression, environnement |
| `rocket` | Espace technique et énergique | Cyan / violet / corail | Exploration, projection, expérimentation |

Invariants entre les thèmes :

- même structure de page ;
- mêmes diagrammes et mêmes informations ;
- mêmes significations pour checkpoint, succès et danger ;
- contraste suffisant pour les textes et les lignes essentielles ;
- aucun contenu exclusivement transmis par la couleur.

Les couleurs des diagrammes proviennent uniquement des tokens suivants :

```css
--visual-line
--visual-line-secondary
--visual-ink
--visual-muted
--visual-grid
--visual-surface
--visual-surface-strong
--visual-hot
--visual-danger
```

Un diagramme ne doit pas introduire sa propre palette en dur, sauf nécessité sémantique validée et déclinée dans les quatre thèmes.

## Le composant visuel éditorial

Le système est centralisé dans `src/shared/components/PostVisual.tsx`.

Tous les visuels utilisent un `viewBox` commun de `900 × 480`. Cela permet de réutiliser la même géométrie dans trois contextes sans maintenir trois illustrations différentes.

### Variante `card`

Objectif : identifier rapidement l’article dans une liste.

- hauteur desktop actuelle : `176px` ;
- cadrage `xMidYMid slice` ;
- détails secondaires supprimés lorsque nécessaire ;
- SVG décoratif avec `aria-hidden="true"` ;
- aucun texte indispensable uniquement présent dans cette version.

### Variante `header`

Objectif : équilibrer le titre de l’article et donner immédiatement sa structure conceptuelle.

- composition à droite du titre sur desktop ;
- empilement sous le titre sur mobile ;
- géométrie complète mais légende masquée ;
- SVG décoratif avec `aria-hidden="true"` car le titre et l’article portent déjà le sens.

### Variante `inline`

Objectif : être une figure éditoriale autonome dans le raisonnement de l’article.

- ratio actuel `15 / 8` ;
- rendu dans un élément `figure` avec `figcaption` ;
- SVG exposé comme image accessible ;
- `title`, `desc` et légende localisés ;
- insertion au moment exact où l’article introduit le système représenté.

La hiérarchie est donc : **reconnaître sur la carte, comprendre dans le header, lire dans l’article**.

## Diagrammes pilotes

### Boucle IA bornée

Identifiant : `bounded-ai-loop`

Lecture principale :

```text
Intention → Exécution IA → Preuve → Gate humain → Action
                              └→ Contrôle échoué → STOP / ESCALADE
```

La frontière en pointillés représente un runtime borné à moindre privilège. L’action est placée après la validation humaine. La branche d’échec sort explicitement de la trajectoire normale.

Ce schéma encode une position éditoriale : l’IA accélère la proposition et la preuve, mais ne supprime pas la responsabilité humaine.

### Canal SSE sortant

Identifiant : `sse-outbound-channel`

Lecture principale :

```text
Réseau client → HTTPS sortant → Pare-feu → Control plane
Agent client  ← Flux SSE + événements ←──────────────┘
Déconnexion → Backoff + jitter → Reconnexion
```

Le pare-feu est une frontière physique et opérationnelle. La connexion est initiée par le client. Le heartbeat matérialise la santé du canal ; le chemin inférieur décrit le comportement de récupération.

### Profil d’endurance trail

Identifiant : `trail-endurance-profile`

Le profil de terrain occupe la partie supérieure. L’échelle temporelle met ensuite en regard :

- la limite d’environ quatre heures de GPS de la montre généraliste décrite dans l’article ;
- la fenêtre cible de treize à quinze heures ;
- la couverture complète de cette fenêtre par l’outil sport.

Le schéma ne compare pas des listes de fonctionnalités. Il montre l’écart entre une contrainte opérationnelle et la capacité nécessaire pour atteindre l’objectif.

## Fallback topographique

Un article sans `visualId` reçoit automatiquement un motif topographique calculé à partir de son slug.

Propriétés :

- déterministe : un même slug produit toujours le même motif ;
- distinctif : deux slugs différents produisent des parcours différents ;
- sans ressource raster ;
- cohérent avec les tokens du thème actif ;
- décoratif dans les cartes et les headers.

Le fallback garantit la cohérence de la liste complète sans imposer la création immédiate de vingt et un diagrammes dédiés.

## Composition des pages

### Header global

Desktop : identité à gauche, navigation au centre, apparence et langue à droite.

Mobile :

1. identité et actions sur la première ligne ;
2. navigation sur la seconde ligne.

Le sélecteur d’apparence est un bouton ouvrant un menu de quatre choix. Il doit rester navigable au clavier, se fermer avec `Escape` ou un clic extérieur et conserver le choix pendant la navigation.

Tous les liens sont construits depuis la locale active. Une page française ne doit jamais introduire silencieusement un lien `/en`.

### Hero d’accueil

- `light` et `dark` : hero atmosphérique contenu dans `clamp(420px, 68vh, 680px)` ;
- mobile : `clamp(360px, 58vh, 520px)` ;
- `mountain` et `rocket` : expérience parallax de `140vh` sur desktop et `120vh` sur mobile ;
- grille topographique commune aux quatre thèmes.

Le titre reste le point focal. Les scènes Montagne et Rocket enrichissent l’atmosphère sans créer une identité concurrente.

### Découverte et cartes

La recherche reste visible en permanence. Sur mobile, tag et tri sont placés dans un panneau repliable.

Une carte affiche :

1. le bandeau cartographique ;
2. date et temps de lecture ;
3. titre et sous-titre ;
4. trois tags maximum, puis un compteur ;
5. l’appel à lire l’article.

Le champ `summary` reste indexé par la recherche, mais n’est pas affiché comme un second résumé dans la carte.

### Header d’article

Desktop : composition en deux colonnes, avec titre et métadonnées à gauche, cartographie à droite.

Mobile : titre, métadonnées puis cartographie. Le visuel ne doit jamais passer avant le titre.

### Figures éditoriales

Toutes les figures utilisent un cadre, une surface et une légende cohérents. Les anciens SVG ne sont pas redessinés automatiquement, mais ils doivent être intégrés dans le même système de cadre lorsqu’ils sont modifiés.

## Mouvement

Le mouvement doit expliquer une progression ou une profondeur. Il ne doit pas retarder l’accès au contenu.

Règles :

- transitions courtes pour menus, cartes et états de focus ;
- parallax réservé aux thèmes Montagne et Rocket ;
- aucune animation indispensable à la compréhension d’un diagramme ;
- respect systématique de `prefers-reduced-motion` ;
- état statique complet et lisible lorsque le mouvement est réduit.

## Accessibilité et localisation

### Accessibilité

- les versions `card` et `header` sont décoratives ;
- la version `inline` possède un `title`, un `desc` et une légende ;
- une branche ou un état ne doit pas être identifiable uniquement par sa couleur ;
- les labels essentiels doivent rester lisibles à `390px` de large ;
- les menus, filtres, cartes et changements de langue restent utilisables au clavier ;
- les focus visibles utilisent les tokens du thème.

### Localisation

Le texte d’un diagramme n’est pas dupliqué dans les fichiers MDX. `PostVisual` contient les versions française et anglaise de ses titres, descriptions, légendes et labels.

`ArticleDiagram` déduit automatiquement la locale active. Les versions FR et EN d’un même article doivent insérer le diagramme au même emplacement sémantique.

## Ajouter un visuel à un article

### Utiliser un diagramme existant

Ajouter l’identifiant au frontmatter :

```yaml
visualId: "bounded-ai-loop"
```

Puis insérer la figure dans les versions française et anglaise :

```mdx
<ArticleDiagram visualId="bounded-ai-loop" />
```

Le même visuel sera automatiquement utilisé dans la carte et le header.

### Conserver le fallback

Ne pas ajouter `visualId`. La carte topographique du slug sera utilisée automatiquement. Il ne faut pas déclarer un identifiant générique artificiel.

### Créer un nouveau diagramme

1. Ajouter l’identifiant dans `postVisualIds`.
2. Ajouter les textes FR et EN dans `VISUAL_COPY`.
3. Construire le SVG dans le `viewBox` commun `900 × 480`.
4. Prévoir une version compacte via la prop `compact`.
5. Utiliser uniquement les tokens `--visual-*`.
6. Vérifier les variantes `card`, `header` et `inline`.
7. Ajouter les tests de schéma, localisation et accessibilité.
8. Vérifier visuellement les quatre thèmes à `1440 × 900` et `390 × 844`.

## Critères de qualité d’un nouveau diagramme

Un diagramme peut être ajouté si toutes les réponses suivantes sont positives :

- Représente-t-il une idée centrale de l’article ?
- Peut-on identifier son flux principal en moins de trois secondes ?
- Les contraintes et frontières importantes sont-elles explicites ?
- Chaque couleur a-t-elle une fonction stable ?
- La version compacte reste-t-elle reconnaissable ?
- La légende ajoute-t-elle du sens sans répéter le titre ?
- Le diagramme est-il compréhensible en français et en anglais ?
- Reste-t-il lisible dans les quatre thèmes et sur mobile ?
- Son état accessible transmet-il la même information que son état visuel ?

Si le diagramme ne fait qu’illustrer le sujet sans structurer une idée, le fallback topographique est préférable.

## À faire et à éviter

### À faire

- montrer des relations, des limites et des preuves ;
- conserver une direction de lecture nette ;
- répéter les primitives de marque ;
- privilégier les SVG natifs, versionnables et accessibles ;
- utiliser les thèmes comme quatre atmosphères d’un même système ;
- réduire le détail dans les cartes plutôt que réduire arbitrairement tout le SVG.

### À éviter

- ajouter une illustration sans relation avec le raisonnement ;
- utiliser des photos génériques de code, de montagne ou de robotique ;
- multiplier les palettes et styles de traits par article ;
- surcharger un diagramme avec tout le contenu de l’article ;
- utiliser une animation pour compenser une hiérarchie peu claire ;
- encoder succès, danger ou progression uniquement par couleur ;
- créer des textes de diagramme différents entre le header et la figure inline.

## Cartographie de l’implémentation

| Responsabilité | Fichier principal |
| --- | --- |
| Diagrammes, fallback et localisation | `src/shared/components/PostVisual.tsx` |
| Identifiants et types | `src/features/posts/content/types.ts` |
| Validation frontmatter | `src/features/posts/content/schema.ts` |
| Tokens des quatre thèmes | `src/styles/tokens.css` |
| Styles des diagrammes et cartes | `src/styles/components.css` |
| Composition globale et articles | `src/styles/layout.css` |
| Adaptation mobile | `src/styles/responsive.css` |
| Hero et grille topographique | `src/shared/components/ParallaxHero.tsx`, `src/styles/base.css` |
| Menu Apparence | `src/shared/components/ThemeSwitcher.tsx` |

## Invariant final

Toute évolution doit renforcer cette lecture : le blog observe des systèmes complexes, rend leurs contraintes visibles et trace un chemin praticable à travers eux.

La DA est réussie lorsque, avant même de lire le titre, une page semble appartenir au même univers : lignes de terrain, flux précis, checkpoints explicites et énergie contenue.
