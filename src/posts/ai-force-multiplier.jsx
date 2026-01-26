export const metadata = {
  en: {
    date: "January 10, 2026",
    readTime: "8",
    title: "The Force Multiplier: AI as the New Engineering Substrate",
    subtitle: "From execution to orchestration.",
  },
  fr: {
    date: "10 Janvier 2026",
    readTime: "8",
    title: "Le multiplicateur de force : L'IA comme nouveau substrat de l'ingénierie",
    subtitle: "De l'exécution à l'orchestration.",
  },
};

export const content = {
  en: (
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
        doubles. I've spent the last few months integrating AI into every facet
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
        I use AI for "exploratory drafting." If I'm considering a new
        architecture for our event-driven systems, I'll ask the model to
        scaffold three different approaches. It's not about using the code it
        generates directly; it's about using it to{" "}
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
  fr: (
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
};
