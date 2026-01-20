import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./i18n/config";
import "./index.css";

const POST_CONTENTS = {
  "agent-battle-2026": (
    <>
      <p>
        It’s 2026, and the "AI coding assistant" is no longer a novelty—it’s the
        oxygen in the room. I’ve spent the last few weeks trialing the big
        three: <strong>Antigravity</strong>, <strong>Cursor</strong>, and{" "}
        <strong>Claude Code</strong> (both the CLI and the IDE integration). The
        verdict? They are all incredible. Seriously. If you told me three years
        ago I’d have tools this capable, I would have laughed.
      </p>

      <p>
        But "incredible" doesn't help me decide where to put my subscription
        money. The real question is:{" "}
        <em>How do they actually impact our work?</em>
      </p>

      <h2>The Value Proposition: Quantifying the Unquantifiable</h2>
      <p>
        We’re past the point of "this one writes better boilterplate." Now we’re
        in the realm of agentic behavior. Quantifying the value of these tools
        is tricky. Is it lines of code per hour? Bugs prevented? Or is it
        something softer, like "mental energy conserved"?
      </p>

      <p>
        To me, the differentiator is how they handle <strong>context</strong>{" "}
        and <strong>intent</strong>. Antigravity feels like it’s
        pair-programming with a senior engineer who knows the whole codebase.
        Cursor is the speed demon, predicting my next move before I even make
        it. Claude Code offers this deep, thoughtful analysis that feels like a
        code review from a patient mentor.
      </p>

      <p className="highlight">
        The profound shift isn't in typing faster; it's in thinking bigger.
      </p>

      <h2>The Long-Term Angle: Google's Hardware Moat</h2>
      <p>
        Here’s an angle I can’t shake: <strong>Infrastructure</strong>. We often
        look at the software layer, but the models running these agents are
        hungry. They need compute. Massive, specialized, localized compute.
      </p>

      <p>
        This is where I think Google has a tremendous, almost unfair advantage.
        They own the hardware (TPUs) and the datacenters. They control the atoms
        that move the bits. In the long run, as models get larger and context
        windows effectively become infinite, the cost of inference will be the
        defining factor.
      </p>

      <p>
        If Google can run a model 10x larger for 10% of the cost because they
        own the vertical stack, does that make them the inevitable winner?
        Maybe. Does it mean we should ignore the others? Absolutely not.
        Innovation often comes from constraints, and the competition is fierce.
      </p>

      <h2>Excited for 2026</h2>
      <p>
        One thing is sure: I’ve tried all three, and the results are
        mind-blowing. We are standing at the precipice of a new era in software
        engineering. I am genuinely excited to see what the rest of 2026 brings.
        If the models improve this much in another year, we won't just be
        writing code; we'll be conducting symphonies of logic.
      </p>
    </>
  ),
  "coros-apex-4": (
    <>
      <p>
        I’ve always been a bit of a "running minimalist," or at least I liked to
        tell myself that. There’s a certain zen in running "naked"—no watch, no
        music, just the sound of your own heavy breathing and the occasional
        judgment from a passing squirrel. But then I signed up for a 100k UTMB
        trail race.
      </p>

      <p>
        Suddenly, "feeling the pace" felt a lot like "getting lost in the Alps
        at 3 AM." I needed data. I needed battery. And most importantly, I
        needed a watch that didn't die before I finished my morning coffee.
      </p>

      <p>
        For years, my <strong>Apple Watch SE (1st Gen)</strong> was my faithful
        companion. It told me when I had emails (stressful), it tracked my steps
        to the fridge (impressive), and it looked sleek at the office. But as my
        training ramped up to 4 trails a week, the "low battery" chime became
        the soundtrack of my life. Entering a 15-hour race with a watch that
        gets nervous after 4 hours of GPS is like bringing a spoon to a knife
        fight. A very shiny, expensive spoon.
      </p>

      <h2>Enter the COROS APEX 4</h2>
      <p>
        Switching to the <strong>COROS APEX 4</strong> felt like moving from a
        luxury sedan to a rugged mountain jeep. It’s built with a titanium bezel
        and sapphire glass, which is great because I tend to "interact" with
        rocks more often than I’d like to admit. But the real game-changer? The
        battery.
      </p>

      <p className="highlight">
        The APEX 4 doesn't just have a battery; it has a philosophy.
      </p>

      <p>
        In its new <em>Endurance</em> mode (which optimizes GNSS selection),
        this thing can outlast my willpower. For my 100k prep, I’ll be out there
        for 13 to 15 hours. The Apple Watch would have retired, moved to
        Florida, and started playing bridge by hour six. The COROS? It’ll still
        be asking me if I want to go for another lap.
      </p>

      <h2>Data that Actually Helps (Not Just High Scores)</h2>
      <p>
        One thing I’ve had to accept: data helps you stay uninjured. The COROS
        ecosystem provides 6-month training plans that evolve at your own pace.
        As a Staff Engineer, I appreciate a good algorithm, and watching my{" "}
        <em>Training Load</em> and <em>VFC (Heart Rate Variability)</em> has
        kept me from nuking my legs when I should be resting.
      </p>

      <p>
        It also added a speaker and a microphone, which is funny because now the
        watch can technically tell me to "slow down" out loud. It’s like having
        a very calm, very persistent coach living on my wrist.
      </p>

      <h2>The "Smart" vs. "Sport" Divide</h2>
      <p>
        Is the Apple Watch "better"? It depends on what you value. If you want
        to pay for groceries with your wrist and reply to texts while doing 800m
        repeats (why?), stay with Apple. But if you’re staring down 100km of
        vertical gain and you want a tool that treats your training with the
        same seriousness as your IDE treats a production bug, the APEX 4 is in a
        different league.
      </p>

      <p>
        The charger? I think I left it in a drawer somewhere. I haven't needed
        it in two weeks. And for a runner preparing for the biggest race of
        their life, that peace of mind is worth every gram of titanium.
      </p>
    </>
  ),
  "ai-force-multiplier": (
    <>
      <p>
        As a runner, I know that the terrain dictates the pace. On a technical
        single-track, your focus narrows to the immediate root or rock. On a
        flat asphalt stretch, you find rhythm. In software engineering, the
        terrain just shifted overnight. AI isn't just a new tool; it's a new
        topography.
      </p>

      <p>
        For a Staff Engineer, the value proposition has long been about{" "}
        <strong>judgment</strong> over raw output speed. But when raw output
        speed becomes effectively infinite through LLMs, the premium on judgment
        doubles. I’ve spent the last few months integrating AI into every facet
        of my workflow—from drafting RFCs to deep-dive refactors—and the shift
        is profound.
      </p>

      <h2>From Execution to Orchestration</h2>
      <p>
        The most visible change is where my time goes. In the "Before Times," a
        significant chunk of my mental energy was spent on the{" "}
        <em>mechanics</em> of coding: syntax, boilerplate, API lookups. Now, I
        spend about 20% of my time executing and 80%{" "}
        <strong>orchestrating</strong>.
      </p>

      <p className="highlight">
        Think of AI as a junior engineer with 100x speed but zero context.
      </p>

      <p>
        I use AI for "exploratory drafting." If I’m considering a new
        architecture for our event-driven systems, I’ll ask the model to
        scaffold three different approaches. It’s not about using the code it
        generates directly; it’s about using it to{" "}
        <strong>collapse the search space</strong> of possibilities. I can "see"
        three different futures in seconds, then apply my years of maintaining
        production systems to pick the one that won't bite us in 18 months.
      </p>

      <h2>The Erosion of Fundamentals?</h2>
      <p>
        There is a valid fear that relying on AI will erode our foundational
        skills. If you don't learn how to debug a stack trace because the AI
        fixes it for you, are you still an engineer?
      </p>

      <p>
        I believe we are seeing a shift in what "fundamentals" means. Coding is
        becoming less about memorizing the standard library and more about{" "}
        <strong>intent-clarity</strong> and <strong>verification</strong>. If
        you can't describe the problem precisely, the AI will confidently
        hallucinate an answer. The new fundamental is the ability to audit AI
        output with the same skepticism you'd bring to a PR from a stranger.
      </p>

      <h2>Practical Principles for the AI Era</h2>
      <p>
        How do we adapt without losing our edge? Here are my personal
        guardrails:
      </p>
      <ul>
        <li>
          <code className="highlight">Verify, then Trust:</code> Never commit
          code you haven't read line-by-line. If you can't explain why a line is
          there, you're not done.
        </li>
        <li>
          <code className="highlight">Prompt for Rationale:</code> Ask the AI{" "}
          <em>why</em> it chose a specific pattern. It forces the model (and
          you) to think through trade-offs.
        </li>
        <li>
          <code className="highlight">Maintain the "Mental Model":</code> Use AI
          to build, but keep the architecture in your head. The day you stop
          understanding how your system fits together is the day you start being
          replaced.
        </li>
      </ul>

      <p>
        Running a mountain trail requires both agility and endurance. You need
        the speed to clear the technical sections, but the lung capacity to
        finish the 50k. AI gives us the speed, but we still need to provide the
        endurance—the long-term vision and the human judgment that keeps the
        system running mile after mile.
      </p>
    </>
  ),
  "joining-rockfi": (
    <>
      <p>
        I am thrilled to announce my arrival at <strong>RockFi</strong> to
        strengthen the tech team! It marks a significant new step in my career,
        and I couldn't be more excited about the challenges ahead.
      </p>

      <h2>A Look Back</h2>
      <p>
        My career began in the startup world at <strong>Polymagine</strong>,
        where I dedicated myself to R&D for additive manufacturing and augmented
        reality visualization. I then moved to <strong>Michelin</strong>,
        contributing to IT projects serving industrial production.
      </p>

      <p>
        In 2021, I joined <strong>Forest Admin</strong>, where I spent four
        years evolving from Full Stack Engineer to Staff Engineer and leading a
        tech team as Engineering Manager. During this time, I played a key role
        in structuring and growing the team, helping it double in size to reach
        over 20 engineers.
      </p>

      <h2>The Mission at RockFi</h2>
      <p>
        At RockFi, my focus will be on the{" "}
        <strong>interconnection with key partners</strong>. The goal is to
        centralize client data and enable real-time visualization of asset
        portfolios. It's a technical challenge that sits right at the
        intersection of complex data integration and user-centric product value.
      </p>

      <p className="highlight">
        "I have the ambition to help structure a technical team capable of
        responding to the challenges demanded by the revolution of 'The new
        private management'."
      </p>

      <p>
        RockFi is tackling "The new private wealth management," and building the
        robust technical foundation to support that vision is exactly where I
        want to be. 🚀
      </p>
    </>
  ),
};

const POST_CONTENTS_FR = {
  "agent-battle-2026": (
    <>
      <p>
        Nous sommes en 2026, et l'assistant de code IA n'est plus une nouveauté,
        c'est l'oxygène de la pièce. J'ai passé les dernières semaines à tester
        les trois grands : <strong>Antigravity</strong>, <strong>Cursor</strong>{" "}
        et <strong>Claude Code</strong> (à la fois le CLI et l'intégration IDE).
        Le verdict ? Ils sont tous incroyables. Sérieusement. Si vous m'aviez
        dit il y a trois ans que j'aurais des outils aussi performants, j'aurais
        ri.
      </p>

      <p>
        Mais "incroyable" ne m'aide pas à décider où placer mon argent
        d'abonnement. La vraie question est :{" "}
        <em>Comment impactent-ils réellement notre travail ?</em>
      </p>

      <h2>La proposition de valeur : Quantifier l'inquantifiable</h2>
      <p>
        Nous avons dépassé le stade du "celui-ci écrit mieux le code répétitif".
        Nous sommes maintenant dans le domaine du comportement agentique.
        Quantifier la valeur de ces outils est délicat. S'agit-il de lignes de
        code par heure ? De bugs évités ? Ou est-ce quelque chose de plus
        immatériel, comme "l'économie d'énergie mentale" ?
      </p>

      <p>
        Pour moi, le facteur de différenciation réside dans la manière dont ils
        gèrent le <strong>contexte</strong> et <strong>l'intention</strong>.
        Antigravity donne l'impression de faire de la programmation en binôme
        avec un ingénieur senior qui connaît toute la base de code. Cursor est
        le démon de la vitesse, prédisant mon prochain mouvement avant même que
        je ne le fasse. Claude Code offre cette analyse profonde et réfléchie
        qui ressemble à une revue de code d'un mentor patient.
      </p>

      <p className="highlight">
        Le changement profond n'est pas d'écrire plus vite, mais de penser plus
        grand.
      </p>

      <h2>L'angle à long terme : La douve matérielle de Google</h2>
      <p>
        Voici un aspect dont je ne peux me défaire :{" "}
        <strong>L'infrastructure</strong>. Nous regardons souvent la couche
        logicielle, mais les modèles qui font tourner ces agents sont affamés.
        Ils ont besoin de calcul. Un calcul massif, spécialisé et localisé.
      </p>

      <p>
        C'est là que je pense que Google a un avantage considérable, presque
        injuste. Ils possèdent le matériel (TPU) et les centres de données. Ils
        contrôlent les atomes qui déplacent les bits. À long terme, alors que
        les modèles s'agrandissent et que les fenêtres de contexte deviennent
        effectivement infinies, le coût de l'inférence sera le facteur
        déterminant.
      </p>

      <p>
        Si Google peut faire tourner un modèle 10 fois plus grand pour 10 % du
        coût parce qu'ils possèdent la pile verticale, cela les rend-ils
        inévitables gagnants ? Peut-être. Cela signifie-t-il que nous devrions
        ignorer les autres ? Absolument pas. L'innovation vient souvent des
        contraintes, et la concurrence est féroce.
      </p>

      <h2>Enthousiaste pour 2026</h2>
      <p>
        Une chose est sûre : j'ai essayé les trois, et les résultats sont
        époustouflants. Nous sommes au bord d'une nouvelle ère dans l'ingénierie
        logicielle. Je suis sincèrement impatient de voir ce que la suite de
        2026 nous réserve. Si les modèles s'améliorent autant en une seule
        année, nous ne ferons plus qu'écrire du code ; nous dirigerons des
        symphonies de logique.
      </p>
    </>
  ),
  "coros-apex-4": (
    <>
      <p>
        J'ai toujours été un peu un "minimaliste de la course", du moins
        j'aimais me le dire. Il y a un certain zen à courir "nu" — sans montre,
        sans musique, juste le son de sa propre respiration lourde et le
        jugement occasionnel d'un écureuil qui passe. Mais ensuite, je me suis
        inscrit à une course de trail UTMB de 100 km.
      </p>

      <p>
        Soudainement, "sentir l'allure" ressemblait beaucoup à "se perdre dans
        les Alpes à 3 heures du matin". J'avais besoin de données. J'avais
        besoin de batterie. Et surtout, j'avais besoin d'une montre qui ne
        s'éteigne pas avant que j'aie fini mon café du matin.
      </p>

      <p>
        Pendant des années, mon <strong>Apple Watch SE (1ère Gén)</strong> a été
        ma fidèle compagne. Elle me disait quand je recevais des e-mails
        (stressant), elle suivait mes pas jusqu'au frigo (impressionnant) et
        elle était élégante au bureau. Mais alors que mon entraînement passait à
        4 sorties trail par semaine, le carillon "batterie faible" est devenu la
        bande-son de ma vie. S'engager dans une course de 15 heures avec une
        montre qui devient nerveuse après 4 heures de GPS, c'est comme apporter
        une cuillère à un combat au couteau. Une cuillère très brillante et
        chère.
      </p>

      <h2>Entrez la COROS APEX 4</h2>
      <p>
        Passer à la <strong>COROS APEX 4</strong>, c'était comme passer d'une
        berline de luxe à une jeep de montagne robuste. Elle est construite avec
        une lunette en titane et un verre saphir, ce qui est génial car j'ai
        tendance à "interagir" avec les rochers plus souvent que je ne voudrais
        l'admettre. Mais le vrai changement radical ? La batterie.
      </p>

      <p className="highlight">
        L'APEX 4 n'a pas seulement une batterie ; elle a une philosophie.
      </p>

      <p>
        Dans son nouveau mode <em>Endurance</em> (qui optimise la sélection
        GNSS), cette chose peut survivre à ma volonté. Pour ma préparation de
        100 km, je serai dehors pendant 13 à 15 heures. L'Apple Watch aurait
        pris sa retraite, déménagé en Floride et commencé à jouer au bridge à la
        sixième heure. La COROS ? Elle me demandera toujours si je veux faire un
        autre tour.
      </p>

      <h2>Des données qui aident vraiment (pas seulement des scores élevés)</h2>
      <p>
        Une chose que j'ai dû accepter : les données vous aident à ne pas vous
        blesser. L'écosystème COROS propose des plans d'entraînement sur 6 mois
        qui évoluent à votre rythme. En tant que Staff Engineer, j'apprécie un
        bon algorithme, et surveiller ma <em>Charge d'entraînement</em> et ma{" "}
        <em>VFC (Variabilité de la Fréquence Cardiaque)</em> m'a empêché de
        détruire mes jambes quand je devrais me reposer.
      </p>

      <p>
        Elle a également ajouté un haut-parleur et un microphone, ce qui est
        amusant car maintenant la montre peut techniquement me dire de
        "ralentir" à voix haute. C'est comme avoir un coach très calme et très
        persistant qui vit sur mon poignet.
      </p>

      <h2>La fracture "Connectée" vs "Sportive"</h2>
      <p>
        L'Apple Watch est-elle "meilleure" ? Cela dépend de ce que vous
        valorisez. Si vous voulez payer vos courses avec votre poignet et
        répondre à des SMS tout en faisant des répétitions de 800m (pourquoi ?),
        restez chez Apple. Mais si vous affrontez 100 km de dénivelé positif et
        que vous voulez un outil qui traite votre entraînement avec le même
        sérieux que votre IDE traite un bug de production, l'APEX 4 est dans une
        autre catégorie.
      </p>

      <p>
        Le chargeur ? Je crois que je l'ai laissé dans un tiroir quelque part.
        Je n'en ai pas eu besoin en deux semaines. Et pour un coureur préparant
        la plus grande course de sa vie, cette tranquillité d'esprit vaut chaque
        gramme de titane.
      </p>
    </>
  ),
  "ai-force-multiplier": (
    <>
      <p>
        En tant que coureur, je sais que le terrain dicte l'allure. Sur un
        sentier technique, votre attention se réduit à la racine ou au rocher
        immédiat. Sur une ligne droite de bitume plat, on trouve son rythme. En
        ingénierie logicielle, le terrain vient de basculer du jour au
        lendemain. L'IA n'est pas seulement un nouvel outil ; c'est une nouvelle
        topographie.
      </p>

      <p>
        Pour un Staff Engineer, la proposition de valeur a longtemps été le{" "}
        <strong>jugement</strong> plutôt que la vitesse de production brute.
        Mais quand la vitesse de production brute devient effectivement infinie
        grâce aux LLM, la prime au jugement double. J'ai passé les derniers mois
        à intégrer l'IA dans toutes les facettes de mon flux de travail — de la
        rédaction de RFC aux refontes en profondeur — et le changement est
        profond.
      </p>

      <h2>De l'exécution à l'orchestration</h2>
      <p>
        Le changement le plus visible est l'endroit où va mon temps. Dans le
        "monde d'avant", une part importante de mon énergie mentale était
        consacrée à la <em>mécanique</em> du codage : syntaxe, boilerplate,
        recherches dans l'API. Aujourd'hui, je passe environ 20 % de mon temps à
        exécuter et 80 % à <strong>orchestrer</strong>.
      </p>

      <p className="highlight">
        Pensez à l'IA comme à un ingénieur junior avec une vitesse 100x mais
        zéro contexte.
      </p>

      <p>
        J'utilise l'IA pour le "brouillon exploratoire". Si j'envisage une
        nouvelle architecture pour nos systèmes basés sur les événements, je
        demanderai au modèle d'échafauder trois approches différentes. Il ne
        s'agit pas d'utiliser directement le code qu'il génère ; il s'agit de
        l'utiliser pour <strong>réduire l'espace de recherche</strong> des
        possibilités. Je peux "voir" trois futurs différents en quelques
        secondes, puis appliquer mes années d'expérience en maintenance de
        systèmes de production pour choisir celui qui ne nous posera pas de
        problème dans 18 mois.
      </p>

      <h2>L'érosion des fondamentaux ?</h2>
      <p>
        Il existe une crainte légitime que le fait de s'appuyer sur l'IA n'érode
        nos compétences fondamentales. Si vous n'apprenez pas à déboguer une
        trace de pile parce que l'IA le fait pour vous, êtes-vous toujours
        ingénieur ?
      </p>

      <p>
        Je crois que nous assistons à un changement de ce que signifient les
        "fondamentaux". Le code devient moins une question de mémorisation de la
        bibliothèque standard et plus une question de{" "}
        <strong>clarté d'intention</strong> et de <strong>vérification</strong>.
        Si vous ne pouvez pas décrire le problème précisément, l'IA hallucinera
        une réponse avec assurance. Le nouveau fondamental est la capacité
        d'auditer la sortie d'une IA avec le même scepticisme que celui qu'on
        apporterait à une PR d'un inconnu.
      </p>

      <h2>Principes pratiques pour l'ère de l'IA</h2>
      <p>
        Comment s'adapter sans perdre notre avantage ? Voici mes garde-fous
        personnels :
      </p>
      <ul>
        <li>
          <code className="highlight">Vérifier, puis faire confiance :</code> Ne
          committez jamais de code que vous n'avez pas lu ligne par ligne. Si
          vous ne pouvez pas expliquer pourquoi une ligne est là, vous n'avez
          pas fini.
        </li>
        <li>
          <code className="highlight">Demander le raisonnement :</code> Demandez
          à l'IA <em>pourquoi</em> elle a choisi un modèle spécifique. Cela
          force le modèle (et vous) à réfléchir aux compromis.
        </li>
        <li>
          <code className="highlight">Maintenir le "modèle mental" :</code>{" "}
          Utilisez l'IA pour construire, mais gardez l'architecture dans votre
          tête. Le jour où vous cessez de comprendre comment votre système
          s'imbrique est le jour où vous commencez à être remplacé.
        </li>
      </ul>

      <p>
        Parcourir un sentier de montagne exige à la fois agilité et endurance.
        Il faut la vitesse pour franchir les sections techniques, mais la
        capacité pulmonaire pour finir le 50 km. L'IA nous donne la vitesse,
        mais nous devons toujours fournir l'endurance — la vision à long terme
        et le jugement humain qui permettent au système de fonctionner kilomètre
        après kilomètre.
      </p>
    </>
  ),
  "joining-rockfi": (
    <>
      <p>
        Je suis ravi d'annoncer mon arrivée chez <strong>RockFi</strong> pour
        renforcer l'équipe technique ! Cela marque une nouvelle étape importante
        dans ma carrière et je ne pourrais pas être plus enthousiaste face aux
        défis qui m'attendent.
      </p>

      <h2>Un regard en arrière</h2>
      <p>
        Ma carrière a débuté dans le monde des startups chez{" "}
        <strong>Polymagine</strong>, où je me suis consacré à la R&D pour la
        fabrication additive et la visualisation en réalité augmentée. J'ai
        ensuite rejoint <strong>Michelin</strong>, contribuant à des projets
        informatiques au service de la production industrielle.
      </p>

      <p>
        En 2021, j'ai rejoint <strong>Forest Admin</strong>, où j'ai passé
        quatre ans, évoluant de Full Stack Engineer à Staff Engineer et
        dirigeant une équipe technique en tant qu'Engineering Manager. Pendant
        cette période, j'ai joué un rôle clé dans la structuration et la
        croissance de l'équipe, l'aidant à doubler de taille pour atteindre plus
        de 20 ingénieurs.
      </p>

      <h2>La mission chez RockFi</h2>
      <p>
        Chez RockFi, ma priorité sera l'
        <strong>interconnexion avec les partenaires clés</strong>. L'objectif
        est de centraliser les données clients et de permettre une visualisation
        en temps réel des portefeuilles d'actifs. C'est un défi technique qui se
        situe exactement à l'intersection de l'intégration de données complexes
        et de la valeur produit centrée sur l'utilisateur.
      </p>

      <p className="highlight">
        "J'ai l'ambition d'aider à structurer une équipe technique capable de
        répondre aux défis exigés par la révolution de 'La nouvelle gestion
        privée'."
      </p>

      <p>
        RockFi s'attaque à "La nouvelle gestion de patrimoine privée", et
        construire les fondations techniques robustes pour soutenir cette vision
        est exactement là où je veux être. 🚀
      </p>
    </>
  ),
};

function App() {
  const [scrollY, setScrollY] = useState(0);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [theme, setTheme] = useState("dark");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const getStyle = (speed, offset = 0) => ({
    transform: `translateY(${scrollY * speed + offset}px)`,
  });

  const posts = t("posts", { returnObjects: true });
  const currentPostMetadata = posts.find((p) => p.id === currentPostId);

  const contentMap = i18n.language === "fr" ? POST_CONTENTS_FR : POST_CONTENTS;
  const currentPost = currentPostMetadata
    ? {
        ...currentPostMetadata,
        content: contentMap[currentPostId],
      }
    : null;

  return (
    <div className="app">
      <div className="circuit-overlay"></div>

      <section className="parallax-container">
        <div
          className="parallax-layer layer-mountain-1"
          style={getStyle(0.2)}
        ></div>
        <div
          className="parallax-layer layer-mountain-2"
          style={getStyle(0.4)}
        ></div>
        <div
          className="parallax-layer layer-mountain-3"
          style={getStyle(0.8, 50)}
        ></div>

        <div className="hero-content">
          <div className="theme-switcher-container">
            <button
              className={`theme-btn ${theme === "dark" ? "active" : ""}`}
              onClick={() => handleThemeChange("dark")}
            >
              {t("ui.darkTheme")}
            </button>
            <span className="theme-separator">|</span>
            <button
              className={`theme-btn ${theme === "light" ? "active" : ""}`}
              onClick={() => handleThemeChange("light")}
            >
              {t("ui.lightTheme")}
            </button>
          </div>
          <div className="lang-switcher-container">
            <button
              className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
              onClick={() => i18n.changeLanguage("en")}
            >
              EN
            </button>
            <span className="lang-separator">|</span>
            <button
              className={`lang-btn ${i18n.language === "fr" ? "active" : ""}`}
              onClick={() => i18n.changeLanguage("fr")}
            >
              FR
            </button>
          </div>
          <h1
            className="hero-title"
            onClick={() => {
              setCurrentPostId(null);
              window.scrollTo(0, 0);
            }}
            style={{ cursor: "pointer" }}
          >
            {t("header.title")}
          </h1>
          <p className="hero-subtitle">{t("header.subtitle")}</p>
        </div>
      </section>

      <main className="blog-content">
        <div className="container">
          {!currentPost ? (
            <div className="post-list">
              <h2 style={{ marginTop: 0, marginBottom: "3rem" }}>
                {t("ui.latestPosts")}
              </h2>
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="post-card"
                  onClick={() => {
                    setCurrentPostId(post.id);
                    window.scrollTo(0, window.innerHeight * 0.8);
                  }}
                >
                  <div className="meta">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>
                      {t("ui.readTime", { count: parseInt(post.readTime) })}
                    </span>
                  </div>
                  <h3>{post.title}</h3>
                  <p style={{ color: "var(--text-secondary)" }}>
                    {post.subtitle}
                  </p>
                  <div
                    className="trail-line"
                    style={{ width: "50px", margin: "1rem 0" }}
                  ></div>
                </div>
              ))}
            </div>
          ) : (
            <article>
              <button
                className="back-btn"
                onClick={() => setCurrentPostId(null)}
              >
                ← {t("ui.backToHome")}
              </button>
              <div className="meta">
                <span>{currentPost.date}</span>
                <span>•</span>
                <span>
                  {t("ui.readTime", { count: parseInt(currentPost.readTime) })}
                </span>
              </div>

              <h1
                style={{
                  fontSize: "3.5rem",
                  marginBottom: "2rem",
                  lineHeight: "1.1",
                }}
              >
                {currentPost.title}
              </h1>

              <div className="trail-line"></div>

              {currentPost.content}

              <div className="trail-line" style={{ marginTop: "4rem" }}></div>
              <button
                className="back-btn"
                onClick={() => {
                  setCurrentPostId(null);
                  window.scrollTo(0, 0);
                }}
              >
                ← {t("ui.backToHome")}
              </button>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
