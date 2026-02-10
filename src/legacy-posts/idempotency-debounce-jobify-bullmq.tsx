export const metadata = {
  en: {
    date: "February 19, 2024",
    readTime: "13",
    title:
      "Idempotency and Debounce in BullMQ: hardening jobs with a jobify contract",
    subtitle:
      "reschedule vs time-frame, deterministic job IDs, and failure modes in production workers.",
  },
  fr: {
    date: "19 Fevrier 2024",
    readTime: "13",
    title:
      "Idempotence et debounce dans BullMQ : durcir les jobs avec un contrat jobify",
    subtitle:
      "reschedule vs time-frame, job IDs deterministes, et modes de panne cote workers.",
  },
};

export const content = {
  en: (
    <>
      <p>
        After we stabilized streaming exports, the next bottleneck was not
        throughput. It was queue noise: repeated triggers for the same entity,
        duplicate jobs, and inconsistent retry behavior under bursts.
      </p>

      <p>
        This is where idempotency and debounce became first-class concerns. We
        kept BullMQ, but added a strict <code>jobify</code> contract around job
        creation and worker execution.
      </p>

      <p className="highlight">Series: Async Workloads at Scale (Part 3/3)</p>
      <p>
        This post closes a 3-part series:
      </p>
      <ul>
        <li>
          Part 1 -{" "}
          <a href="?post=nodejs-stream-backpressure-history-export">
            Node.js backpressure, streaming, and multipart exports
          </a>
        </li>
        <li>
          Part 2 -{" "}
          <a href="?post=jobify-workers-queues-nestjs">
            Jobify + BullMQ + workers + queues in a NestJS architecture
          </a>
        </li>
        <li>
          Part 3 (current) - Idempotency and debounce strategy design.
        </li>
      </ul>

      <p className="highlight">
        Idempotency answers "can this be triggered multiple times safely?"
        Debounce answers "when should we actually execute under trigger storms?"
      </p>

      <h2>Start from NestJS, then harden</h2>
      <p>
        In a typical NestJS setup, jobs are added directly through
        <code>@InjectQueue</code>. Good for bootstrap speed, weak for
        consistency once job count grows.
      </p>

      <pre>
        <code className="language-typescript">
          {`await queue.add("sync-agent", { environmentId }, {
  priority: 2,
  removeOnComplete: true,
  removeOnFail: true,
});`}
        </code>
      </pre>

      <p>
        The issue is not BullMQ itself. The issue is option drift and missing
        invariants at callsites.
      </p>

      <h2>What make-jobify.ts enforces</h2>
      <p>
        <code>make-jobify.ts</code> centralizes job semantics: named processors,
        timeout/priority config, optional dynamic priority, and guarded debounce
        configuration.
      </p>

      <ul>
        <li>
          debounce requires <code>delayInMs</code>, <code>makeJobId</code>, and
          <code>name</code>.
        </li>
        <li>
          worker registration only happens on worker instances and only once per
          processor key.
        </li>
        <li>
          every runner call goes through the same queue API and monitoring
          hooks.
        </li>
      </ul>

      <h2>Two debounce modes, two semantics</h2>

      <h2>1) time-frame</h2>
      <p>
        Used in <code>action-approvers-notifier-service.ts</code> and
        <code>self-hosted-agent-config-change-service.ts</code>. The system
        groups frequent triggers with the same deterministic lock key over a
        fixed delay window.
      </p>

      <pre>
        <code className="language-typescript">
          {`const debouncedNotify = jobify(queuedNotifyApproversForAction, {
  debounce: "time-frame",
  name: "debouncedNotifyApproversForAction",
  delayInMs: 60_000,
  makeJobId: ({ environmentId, roleIdsAllowedToApprove }) =>
    environmentId + "-" + roleIdsAllowedToApprove.join("-"),
});`}
        </code>
      </pre>

      <p>
        Operationally: within the delay window, repeated triggers with the same
        key collapse to one queued unit of work.
      </p>

      <h2>2) reschedule</h2>
      <p>
        Used in <code>cloud-synchronize-data-service.ts</code>. If a delayed job
        already exists, delay is pushed forward instead of enqueuing another job.
      </p>

      <pre>
        <code className="language-typescript">
          {`const debouncedSynchronize = jobify(queueSynchronizeAgentData, {
  debounce: "reschedule",
  name: "debouncedSynchronizeAgentData",
  delayInMs: 7_000,
  makeJobId: (environmentId) => "debounced-synchronize-agent-data-" + environmentId,
});`}
        </code>
      </pre>

      <p>
        In <code>queue-service.ts</code>, this maps to: find job by
        <code>jobId</code>, if state is delayed then <code>changeDelay</code>,
        return existing id.
      </p>

      <h2>Critical nuance: payload freshness</h2>
      <p>
        Both debounce modes can keep the original queued payload if a job already
        exists for the same key. If later triggers contain semantically
        different arguments, you may execute stale data.
      </p>

      <p className="highlight">
        Rule: include every behavior-changing argument in makeJobId, or move
        mutable state lookup inside the processor.
      </p>

      <h2>Idempotency patterns that survived production</h2>
      <ul>
        <li>
          <strong>Deterministic key shape:</strong>
          <code>{`<job-name>:<tenant>:<entity>:<time-range>:<mode>`}</code>
        </li>
        <li>
          <strong>Avoid unstable fields:</strong> timestamps and random UUIDs in
          <code>makeJobId</code> usually destroy dedupe value.
        </li>
        <li>
          <strong>Canonicalization:</strong> sort arrays before joining
          identifiers (for example role IDs).
        </li>
        <li>
          <strong>Scope isolation:</strong> always include tenant/environment to
          prevent cross-tenant collisions.
        </li>
      </ul>

      <h2>Failure modes and guardrails</h2>
      <table>
        <thead>
          <tr>
            <th>Failure mode</th>
            <th>Root cause</th>
            <th>Guardrail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Duplicate expensive jobs</td>
            <td>Missing or unstable jobId</td>
            <td>Deterministic makeJobId + contract tests</td>
          </tr>
          <tr>
            <td>Stale execution payload</td>
            <td>Debounced job reused old data</td>
            <td>Encode args in key or fetch latest state in processor</td>
          </tr>
          <tr>
            <td>Silent queue growth</td>
            <td>No removeOnComplete/removeOnFail defaults</td>
            <td>Centralize addJob options in queue service</td>
          </tr>
          <tr>
            <td>Hanging worker shutdown</td>
            <td>No timeout policy</td>
            <td>Worker wrapper with default timeout enforcement</td>
          </tr>
        </tbody>
      </table>

      <h2>Where sequential jobify fits</h2>
      <p>
        <code>make-jobify-sequential.ts</code> is not debounce. It is per-entity
        ordering. Use it when writes for the same logical entity must never run
        concurrently.
      </p>

      <ul>
        <li>
          debounce reduces noise before execution;
        </li>
        <li>
          sequential ensures processing order during execution.
        </li>
      </ul>

      <h2>Observability signals to add on day one</h2>
      <ul>
        <li>
          enqueue attempts vs accepted jobs (dedupe ratio),
        </li>
        <li>
          delay extension count for rescheduled jobs,
        </li>
        <li>
          job duration p50/p95/p99 per processor,
        </li>
        <li>
          queue depth split by waiting/delayed/active/failed.
        </li>
      </ul>

      <h2>Decision guide: time-frame or reschedule?</h2>
      <ul>
        <li>
          <strong>time-frame:</strong> execute once per window for bursty events
          where exact latest trigger time is not critical.
        </li>
        <li>
          <strong>reschedule:</strong> execute after quiet period, where the work
          should happen only when changes stop arriving.
        </li>
      </ul>

      <p>
        The key outcome is predictable asynchronous behavior: fewer duplicate
        jobs, bounded queue pressure, and a stable worker runtime under trigger
        storms.
      </p>

      <h2>Series navigation</h2>
      <ul>
        <li>
          Need stream-level reliability first? Go to{" "}
          <a href="?post=nodejs-stream-backpressure-history-export">Part 1</a>.
        </li>
        <li>
          Need a production queue/worker contract next? Go to{" "}
          <a href="?post=jobify-workers-queues-nestjs">Part 2</a>.
        </li>
      </ul>
    </>
  ),
  fr: (
    <>
      <p>
        Apres la stabilisation des exports stream, le prochain probleme n'etait
        pas le debit mais le bruit en queue: triggers repetes pour la meme
        entite, doublons de jobs et comportements de retry non homoges.
      </p>

      <p>
        C'est la que idempotence et debounce deviennent des sujets de premier
        plan. BullMQ reste en place, mais avec un contrat
        <code>jobify</code> autour de la creation et de l'execution des jobs.
      </p>

      <p className="highlight">Serie: Async Workloads at Scale (Partie 3/3)</p>
      <p>
        Ce post clot une serie en 3 parties :
      </p>
      <ul>
        <li>
          Partie 1 -{" "}
          <a href="?post=nodejs-stream-backpressure-history-export">
            backpressure Node.js, streaming et exports multipart
          </a>
        </li>
        <li>
          Partie 2 -{" "}
          <a href="?post=jobify-workers-queues-nestjs">
            Jobify + BullMQ + workers + queues dans une architecture NestJS
          </a>
        </li>
        <li>
          Partie 3 (courante) - conception idempotence et debounce.
        </li>
      </ul>

      <p className="highlight">
        Idempotence: execution sure meme avec triggers multiples. Debounce:
        choisir quand executer sous tempete d'evenements.
      </p>

      <h2>Point de depart NestJS, puis durcissement</h2>
      <p>
        Le pattern classique NestJS via <code>@InjectQueue</code> est rapide a
        mettre en place, mais fragile quand le nombre de jobs augmente.
      </p>

      <pre>
        <code className="language-typescript">
          {`await queue.add("sync-agent", { environmentId }, {
  priority: 2,
  removeOnComplete: true,
  removeOnFail: true,
});`}
        </code>
      </pre>

      <h2>Ce que make-jobify.ts impose</h2>
      <ul>
        <li>
          debounce impose <code>delayInMs</code>, <code>makeJobId</code> et
          <code>name</code>.
        </li>
        <li>
          registration des processors uniquement sur les instances worker.
        </li>
        <li>
          un seul chemin d'enqueue et de monitoring pour tous les jobs.
        </li>
      </ul>

      <h2>Deux modes debounce, deux comportements</h2>

      <h2>1) time-frame</h2>
      <p>
        Utilise notamment dans
        <code>action-approvers-notifier-service.ts</code> et
        <code>self-hosted-agent-config-change-service.ts</code>. Les triggers
        frequents sur la meme cle sont regroupes dans une fenetre de temps fixe.
      </p>

      <h2>2) reschedule</h2>
      <p>
        Utilise dans <code>cloud-synchronize-data-service.ts</code>. Si un job
        delayed existe deja, on prolonge son delai via
        <code>changeDelay</code> au lieu d'ajouter un nouveau job.
      </p>

      <h2>Nuance critique: fraicheur du payload</h2>
      <p>
        Les deux modes peuvent conserver le payload initial quand un job existe
        deja pour la meme cle. Si les nouveaux triggers portent des arguments
        differents, vous pouvez executer des donnees obsoletes.
      </p>

      <p className="highlight">
        Regle: inclure tous les arguments qui changent le comportement dans
        makeJobId, ou relire l'etat le plus recent dans le processor.
      </p>

      <h2>Patterns d'idempotence robustes</h2>
      <ul>
        <li>
          schema de cle deterministe
          <code>{`<job-name>:<tenant>:<entity>:<time-range>:<mode>`}</code>;
        </li>
        <li>
          eviter timestamps aleatoires et UUIDs dans makeJobId;
        </li>
        <li>
          trier/canonicaliser les listes avant composition de cle;
        </li>
        <li>
          toujours inclure le scope tenant/environment.
        </li>
      </ul>

      <h2>Modes de panne et garde-fous</h2>
      <table>
        <thead>
          <tr>
            <th>Mode de panne</th>
            <th>Cause</th>
            <th>Garde-fou</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Doublons de jobs couteux</td>
            <td>jobId absent ou instable</td>
            <td>makeJobId deterministe + tests de contrat</td>
          </tr>
          <tr>
            <td>Payload obsoletes</td>
            <td>job debounce avec anciennes donnees</td>
            <td>cle plus fine ou lecture d'etat recente au runtime</td>
          </tr>
          <tr>
            <td>Croissance silencieuse de queue</td>
            <td>absence de removeOnComplete/removeOnFail</td>
            <td>centraliser addJob dans QueueService</td>
          </tr>
          <tr>
            <td>Shutdown worker bloque</td>
            <td>pas de policy de timeout</td>
            <td>wrapper worker avec timeout par defaut</td>
          </tr>
        </tbody>
      </table>

      <h2>Ou placer make-jobify-sequential</h2>
      <p>
        Ce n'est pas du debounce. C'est de l'ordre strict par entite quand la
        concurrence est interdite pour la meme lane logique.
      </p>

      <h2>Guide de choix</h2>
      <ul>
        <li>
          <strong>time-frame:</strong> une execution par fenetre en cas de burst.
        </li>
        <li>
          <strong>reschedule:</strong> execution apres une periode de calme.
        </li>
      </ul>

      <p>
        Le resultat attendu est un runtime asynchrone plus deterministe: moins
        de doublons, pression queue bornee, et workers stables sous charge.
      </p>

      <h2>Navigation dans la serie</h2>
      <ul>
        <li>
          Besoin de fiabilite stream en premier ? Lire{" "}
          <a href="?post=nodejs-stream-backpressure-history-export">Partie 1</a>.
        </li>
        <li>
          Besoin du contrat queue/worker ensuite ? Lire{" "}
          <a href="?post=jobify-workers-queues-nestjs">Partie 2</a>.
        </li>
      </ul>
    </>
  ),
};
