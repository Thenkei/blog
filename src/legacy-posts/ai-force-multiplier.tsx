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
    title:
      "Le multiplicateur de force : L'IA comme nouveau substrat de l'ingénierie",
    subtitle: "De l'exécution à l'orchestration.",
  },
};

export const content = {
  en: (
    <>
      <p>
        As a runner, I know that the terrain dictates the pace. On a technical
        single-track, your focus narrows to the immediate root or rock trying to
        break your ankle. On a flat asphalt stretch, you find rhythm. In
        software engineering, the terrain just shifted overnight—and the ground
        is currently made of pure caffeine. AI isn't just a new tool; it's a
        completely new topography.
      </p>

      <p>
        For a Staff Engineer, the core value proposition has long been about{" "}
        <strong>judgment</strong> over raw typing speed. But when your raw
        output speed becomes effectively infinite thanks to LLMs, the premium on
        judgment doesn't just double—it goes parabolic. I've spent the last few
        months integrating AI into every single facet of my workflow (from
        drafting RFCs to deep-dive refactors), and frankly, the shift is
        staggering.
      </p>

      <h2>From Code Monkey to Conductor</h2>
      <p>
        The most visible change is where my time actually goes. In the "Before
        Times," a significant chunk of my mental energy was burned on the{" "}
        <em>mechanics</em>: wrestling with syntax, wiring boilerplate, or
        searching Stack Overflow for that one Webpack config flag. Now, I spend
        about 20% of my time executing and 80% <strong>orchestrating</strong>.
      </p>

      <p className="highlight">
        Think of AI as an incredibly eager junior engineer who types at 100x
        speed, has read every repo on Earth, but possesses absolutely zero
        business context.
      </p>

      <p>
        I use AI heavily for "exploratory drafting." If I'm considering a new
        event-driven architecture, I'll ask the model to scaffold three totally
        different approaches. I'm not copying and pasting that code into
        production (please don't do this); I use it to{" "}
        <strong>collapse the search space</strong>. I can "see" three different
        parallel universes in seconds, and then apply my agonizing years of
        production trauma to pick the one that won't wake me up at 3 AM in 18
        months.
      </p>

      <h2>Are We Losing Our Edge?</h2>
      <p>
        There is a very valid fear that relying on AI will erode our
        foundational skills. If you don't learn how to untangle a cryptic stack
        trace because the machine fixes it for you in two seconds, are you still
        an engineer?
      </p>

      <p>
        I believe the definition of "fundamentals" is just shifting. Software
        engineering is becoming less about memorizing the standard library and
        far more about <strong>intent-clarity</strong> and{" "}
        <strong>verification</strong>. If you can't precisely articulate the
        problem, the AI will confidently hallucinate a beautiful,
        perfectly-typed disaster. The real new fundamental is auditing an AI's
        output with the exact same ruthless skepticism you'd bring to a PR from
        a stranger on the internet.
      </p>

      <h2>Survival Rules for the AI Era</h2>
      <p>
        How do we adapt without becoming obsolete? Here are my personal
        guardrails:
      </p>
      <ul>
        <li>
          <code className="highlight">Verify, Then Trust:</code> Never commit
          code you haven't read line-by-line. If you can't explain why a line is
          there, delete it.
        </li>
        <li>
          <code className="highlight">Interrogate the Machine:</code> Ask the AI{" "}
          <em>why</em> it chose a specific pattern. Forcing the model to justify
          its trade-offs often reveals its blind spots (and yours).
        </li>
        <li>
          <code className="highlight">Protect Your Mental Model:</code> Use AI
          to write the bricks, but you must remain the architect. The day you
          stop understanding how the pieces of your system fit together is the
          day you become replaceable.
        </li>
      </ul>

      <p>
        Running an ultra-trail requires both explosive agility and grueling
        endurance. You need the speed to clear the technical sections, but the
        lung capacity to survive the 50k. AI gives us the explosive speed, but
        we still have to bring the endurance—the long-term vision, the battle
        scars, and the human judgment that keeps a system running smoothly mile
        after mile.
      </p>
    </>
  ),
  fr: (
    <>
      <p>
        En tant que coureur, je sais que le terrain dicte toujours l'allure. Sur
        un sentier technique, on se focalise exclusivement sur la racine qui
        essaie de nous tordre la cheville. Sur un bitume bien plat, on trouve
        tranquillement son rythme. En ingénierie logicielle, le terrain vient de
        muter du jour au lendemain—et le sol est désormais composé à 100% de
        caféine. L'IA n'est pas un simple outil ; c'est une nouvelle tectonique
        des plaques.
      </p>

      <p>
        Pour un Staff Engineer, la valeur ajoutée a toujours reposé sur le{" "}
        <strong>jugement</strong> plutôt que sur la vitesse de frappe. Mais
        quand la vitesse de production brute devient infinie grâce aux LLMs, la
        prime au jugement crève complètement le plafond. J'ai passé ces derniers
        mois à injecter de l'IA dans la moindre petite parcelle de mon
        workflow—du simple brouillon de RFC jusqu'au gros refacto qui tache—et
        très franchement, le changement donne le vertige.
      </p>

      <h2>Du Pisseur de Code au Chef d'Orchestre</h2>
      <p>
        Le changement le plus visible, c'est la façon dont je dépense mon temps.
        Dans le "monde d'avant", une part absurde de mon énergie mentale se
        consumait sur la <em>mécanique</em> : se battre avec la syntaxe, le
        boilerplate interminable, ou chercher ce foutu flag dans la doc.
        Aujourd'hui, je passe environ 20 % de mon temps à exécuter et 80 % à{" "}
        <strong>orchestrer</strong>.
      </p>

      <p className="highlight">
        Considérez l'IA comme un ingénieur junior incroyablement fougueux, qui
        tape à la vitesse de l'éclair, a lu tout GitHub, mais n'a absolument
        aucun contexte métier.
      </p>

      <p>
        J'utilise massivement l'IA pour du "brouillon exploratoire". Si
        j'envisage une nouvelle architecture pour nos systèmes événementiels, je
        vais lui demander d'échafauder trois approches radicalement différentes.
        Mon but n'est pas d'utiliser ce code en prod (pitié, ne faites pas ça);
        c'est de <strong>compresser l'espace des possibles</strong>. Je peux
        "voir" trois univers parallèles en quelques secondes, puis utiliser mes
        propres traumatismes de production passés pour choisir la solution qui
        ne m'obligera pas à me lever à 3h du matin dans 18 mois.
      </p>

      <h2>La fin du vrai savoir-faire ?</h2>
      <p>
        C'est une crainte totalement légitime. Si vous ne savez plus désosser
        une stack trace barbare parce la machine la résout pour vous en trois
        secondes, êtes-vous toujours un ingénieur ?
      </p>

      <p>
        Je pense que c'est la définition même des "fondamentaux" qui pivote.
        Écrire du code relève de moins en moins de la mémorisation du
        dictionnaire, et de plus en plus de la{" "}
        <strong>clarté d'intention</strong> et de la{" "}
        <strong>vérification paranoïaque</strong>. Si vous formulez mal votre
        problème, l'IA pondra fièrement un désastre magnifiquement typé. Le vrai
        super-pouvoir aujourd'hui, c'est la capacité d'auditer l'IA avec le même
        niveau de scepticisme que s'il s'agissait de la Pull Request d'un sombre
        inconnu sur internet.
      </p>

      <h2>Règles de survie dans l'ère de l'IA</h2>
      <p>
        Comment s'adapter sans devenir obsolète ? Voici mes garde-fous
        personnels :
      </p>
      <ul>
        <li>
          <code className="highlight">Vérifiez, puis faites confiance :</code>{" "}
          Ne poussez JAMAIS du code que vous n'avez pas lu ligne par ligne. Si
          vous ne savez pas justifier une ligne, supprimez-la.
        </li>
        <li>
          <code className="highlight">Interrogez la machine :</code> Demandez à
          l'IA <em>pourquoi</em> elle a choisi un pattern précis. La forcer à
          peser le pour et le contre met très souvent en lumière ses angles
          morts (et les vôtres).
        </li>
        <li>
          <code className="highlight">Protégez votre "modèle mental" :</code>{" "}
          Utilisez l'IA pour couler le béton, mais vous restez l'architecte. Le
          jour où vous ne comprenez plus comment les briques de votre propre
          système s'emboîtent, vous devenez virtuellement remplaçable.
        </li>
      </ul>

      <p>
        Courir un ultra-trail demande une explosivité ponctuelle et une
        endurance à toute épreuve. Il faut de la vitesse pour avaler les
        portions techniques, mais de sacrés poumons pour survivre aux 50 km.
        L'IA nous offre la vitesse, mais nous devons toujours apporter le coffre
        — la vision lointaine, les cicatrices du terrain, et ce bon vieux
        jugement humain qui permet au système de ronronner kilomètre après
        kilomètre.
      </p>
    </>
  ),
};
