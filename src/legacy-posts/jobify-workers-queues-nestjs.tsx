export const metadata = {
  en: {
    date: "February 12, 2024",
    readTime: "16",
    title:
      "Jobify over BullMQ: a production pattern for jobs, workers, and queues (with NestJS)",
    subtitle:
      "From plain NestJS queue wiring to typed runners, sequential processing, and safer exports.",
  },
  fr: {
    date: "12 Fevrier 2024",
    readTime: "16",
    title:
      "Jobify au-dessus de BullMQ : un pattern production pour jobs, workers et queues (avec NestJS)",
    subtitle:
      "De l'integration NestJS classique aux runners types, au sequentiel, et aux exports robustes.",
  },
};

export const content = {
  en: (
    <>
      <p>
        If you are already running <code>@nestjs/bullmq</code>, congratulations,
        you've survived the initial boss fight. But you can keep the exact same
        runtime stack and still gain infinitely stronger job contracts. The key
        idea is to stop writing boilerplate and add a thin, ruthless{" "}
        <code>jobify</code> layer that standardizes enqueue, processor
        registration, timeouts, retries, tracing, and sequencing. No more silent
        failures at 4 AM.
      </p>

      <p className="highlight">Series: Async Workloads at Scale (Part 2/3)</p>
      <p>
        This post is the architecture layer between the two other posts in this
        series:
      </p>
      <ul>
        <li>
          Part 1 -{" "}
          <a href="?post=nodejs-stream-backpressure-history-export">
            Node.js backpressure, streams, and S3 multipart exports
          </a>
        </li>
        <li>
          Part 2 (current) - Jobify over BullMQ for worker/queue contracts.
        </li>
        <li>
          Part 3 -{" "}
          <a href="?post=idempotency-debounce-jobify-bullmq">
            idempotency and debounce strategies (reschedule vs time-frame)
          </a>
        </li>
      </ul>

      <p className="highlight">
        NestJS is the framework integration point. Jobify is the execution
        contract.
      </p>

      <h2>Baseline NestJS integration (where most teams start)</h2>
      <pre>
        <code className="language-typescript">
          {`import { Injectable } from "@nestjs/common";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Queue, Job } from "bullmq";

@Injectable()
export class ExportsService {
  constructor(@InjectQueue("exports") private readonly queue: Queue) {}

  async enqueueExport(payload: ExportPayload) {
    return this.queue.add("activity-export", payload, {
      priority: 2,
      removeOnComplete: true,
      removeOnFail: true,
    });
  }
}

@Processor("exports")
export class ExportsProcessor extends WorkerHost {
  async process(job: Job<ExportPayload>) {
    if (job.name === "activity-export") {
      await this.runActivityExport(job.data);
    }
  }
}`}
        </code>
      </pre>

      <p>
        This works. It's the "Hello World" of queues. But as your job count
        grows, you usually end up with a sprawling mess: duplicated queue
        options, wildly weak typing between the producer and consumer, and
        ad-hoc behavior for idempotency, debounce, and sequential execution.
        Basically, it's a structural time bomb.
      </p>

      <h2>What the jobify layer adds</h2>
      <p>
        The <code>make-jobify.ts</code> pattern creates a single contract:
        <strong>
          {" "}
          register once on workers, call a typed runner everywhere.
        </strong>
      </p>

      <ul>
        <li>
          <strong>Named function guard:</strong> unnamed work is rejected to
          keep stable processor keys.
        </li>
        <li>
          <strong>Worker-only registration:</strong> processors are added only
          when <code>isWorker</code> is true and not already present.
        </li>
        <li>
          <strong>Dynamic priority:</strong> static, sync function, or async
          function priority are all supported.
        </li>
        <li>
          <strong>Debounce contract:</strong> requires
          <code>delayInMs</code>, <code>makeJobId</code>, and
          <code>name</code>, plus marker checks to prevent misconfiguration.
        </li>
      </ul>

      <pre>
        <code className="language-typescript">
          {`const runExport = jobify(exportApprovals, {
  priority: JobPriority.low,
  timeoutInMinutes: 180,
  onError: onExportError,
  makeJobId: (params) => "approvals-" + params.environmentId + "-" + params.from + "-" + params.to,
});

await runExport({ userId, projectId, environmentId, from, to });`}
        </code>
      </pre>

      <h2>Queue behavior centralized in one place (For your own sanity)</h2>
      <p>
        In <code>queue-service.ts</code>, enqueue behavior is explicit and
        reusable:
      </p>
      <ul>
        <li>
          <strong>trace propagation:</strong> span parameters are embedded at
          job creation.
        </li>
        <li>
          <strong>debounce reschedule:</strong> delayed jobs can be found by
          <code>jobId</code> and <code>changeDelay</code> in place.
        </li>
        <li>
          <strong>repeat safety:</strong> old repeatable configs are removed to
          avoid duplicated schedules after redeploy.
        </li>
        <li>
          <strong>queue hygiene:</strong> <code>removeOnComplete</code> and
          <code>removeOnFail</code> are defaulted to prevent storage drift.
        </li>
      </ul>

      <h2>Worker execution model is wrapped, not ad-hoc</h2>
      <p>
        <code>worker-service.ts</code> applies wrappers in strict order:
        monitoring -&gt; onError -&gt; timeout -&gt; work.
      </p>

      <pre>
        <code className="language-typescript">
          {`const timeoutWrap = timeoutAfterMinutes(jobFunction, timeoutInMinutes || DEFAULT_TIMEOUT);
const onErrorWrap = WorkerService.onErrorWrap(job, timeoutWrap, options);
const monitoringWrap = workerMonitoringService.monitoringWrap({
  name,
  job,
  work: onErrorWrap,
  service: options.service,
});

await monitoringWrap();`}
        </code>
      </pre>

      <p>
        That gives consistent timeout semantics, predictable error hooks, and
        uniform monitoring labels without every team rewriting the same glue.
      </p>

      <h2>Sequential execution with make-jobify-sequential</h2>
      <p>
        <code>make-jobify-sequential.ts</code> solves a common distributed
        problem: some actions must be serialized for the same logical entity,
        while still allowing concurrency across different entities.
      </p>

      <ul>
        <li>
          <strong>Key model:</strong>
          <code>sequentialKey</code> defines the lane,
          <code>processingKey</code> identifies the action type,
          <code>identifier</code> scopes to one entity.
        </li>
        <li>
          <strong>Redis list queue:</strong> args are pushed with
          <code>RPUSH</code>, consumed with <code>LRANGE/LPOP</code>.
        </li>
        <li>
          <strong>Safety:</strong> dequeue happens in <code>finally</code>, so
          failed processors do not block the lane forever.
        </li>
        <li>
          <strong>Chaining:</strong> <code>onComplete</code> triggers the next
          queued processing for the same lane/id.
        </li>
      </ul>

      <pre>
        <code className="language-typescript">
          {`const registerSequential = makeJobifySequential({
  jobify,
  jobsRedisClient,
  logger,
  datadogService,
});

const runSyncUser = registerSequential({
  sequentialKey: "user-sync",
  processingKey: "sync-profile",
  getSequentialId: (userId) => String(userId),
  priority: JobPriority.normal,
  processor: async (userId) => {
    await syncUserProfile(userId);
  },
});`}
        </code>
      </pre>

      <h2>Concrete export case: action approvals</h2>
      <p>
        <code>action-approvals-exporter.ts</code> shows the full path: queue
        kickoff, streamed export, signed link, and user notification.
      </p>

      <ul>
        <li>
          queued with <code>JobPriority.low</code> and explicit timeout from
          env.
        </li>
        <li>trace disabled for heavy long-running exports.</li>
        <li>
          stream pipeline:
          <code>
            Readable.from(iterator) -&gt; Transform -&gt; csv-stringify -&gt; S3
            multipart writable
          </code>
          .
        </li>
        <li>
          success and failure email flows are attached directly via
          <code>onError</code> and completion logic.
        </li>
      </ul>

      <h2>Complex Cloud Orchestration Case: Forest Admin's Hosted Agent</h2>
      <p>
        For our Fully Hosted Cloud version, we rely on heavily orchestrated jobs
        to prevent the main API from grinding to a halt. When a user changes
        their schema or deletes an environment, we need to spin up jobs that
        handle complex teardowns or data synchronization across thousands of
        projects.
      </p>

      <ul>
        <li>
          <strong>Debounced synchronization:</strong> When an API Map changes,
          we debounce the redeploy job (
          <code>debouncedSynchronizeAgentData</code>) because users often save
          changes in bursts. We don't want 10 simultaneous Lambda redeploys for
          a single environment.
        </li>
        <li>
          <strong>Queued deletion:</strong> Deleting a Cloud environment
          involves trashing AWS S3 objects, pulling down NAT Gateway configs,
          and updating our centralized Postgres. We shove this into a{" "}
          <code>cloudDeleteService.queuedDeleteAgent()</code> job. If AWS
          rate-limits us, BullMQ retries the deletion later without leaving
          dangling infrastructure (and burning AWS NAT tax).
        </li>
        <li>
          <strong>Job Priority:</strong> We strictly route these orchestration
          events: user-facing syncs get higher priority than background cleanup
          jobs.
        </li>
      </ul>

      <h2>How NestJS benefits from this pattern</h2>
      <p>
        Keep Nest decorators and modules. Add a small internal package that
        exposes <code>jobify</code>, <code>queueService</code>, and
        <code>workerService</code> adapters.
      </p>

      <pre>
        <code className="language-typescript">
          {`@Injectable()
export class JobifyFactory {
  constructor(
    private readonly queueService: QueueService,
    private readonly workerService: WorkerService,
    @Inject(IS_WORKER) private readonly isWorker: boolean,
  ) {}

  create<T extends (...args: any[]) => Promise<any>>(work: T, options: JobOptions<T>) {
    return makeJobify({
      queueService: this.queueService,
      workerService: this.workerService,
      isWorker: this.isWorker,
      logConfig: (k, v) => logger.info({ key: k, value: v }),
      assertPresent,
    })(work, options);
  }
}`}
        </code>
      </pre>

      <h2>Migration strategy that avoids service disruption</h2>
      <ol>
        <li>Wrap one existing heavy export with jobify.</li>
        <li>Move queue options from callsites to JobOptions defaults.</li>
        <li>
          Add deterministic <code>makeJobId</code> for idempotency and debounce.
        </li>
        <li>
          Introduce sequential lanes only where write-order is a hard
          requirement.
        </li>
        <li>
          Roll out dashboards for queue depth, active count, failures, and job
          duration percentile before broad adoption.
        </li>
      </ol>

      <h2>Design Rules (Break these and you will suffer)</h2>
      <ul>
        <li>
          <strong>Do not expose BullMQ Job objects</strong> to business code by
          default; pass typed args instead. Otherwise your domain logic becomes
          tightly coupled to BullMQ's internals, and you'll weep during the next
          major version bump.
        </li>
        <li>
          <strong>Always enforce timeout defaults</strong>; shutdown behavior
          depends on bounded job execution.
        </li>
        <li>
          <strong>Keep producer and consumer contracts in one place</strong>
          (jobify callsite), not spread across modules.
        </li>
        <li>
          <strong>Treat sequential lanes as scarce resources</strong>; only use
          them where correctness requires serialization.
        </li>
      </ul>

      <p>
        The strongest outcome of this approach is not only throughput. It is
        operational determinism: same queue semantics, same monitoring contract,
        same error surface, across every background workflow.
      </p>

      <h2>Series navigation</h2>
      <ul>
        <li>
          Want the stream/export reliability context first? Read{" "}
          <a href="?post=nodejs-stream-backpressure-history-export">Part 1</a>.
        </li>
        <li>
          Want debounce/idempotency hardening patterns next? Read{" "}
          <a href="?post=idempotency-debounce-jobify-bullmq">Part 3</a>.
        </li>
      </ul>
    </>
  ),
  fr: (
    <>
      <p>
        Si vous utilisez déjà <code>@nestjs/bullmq</code>, félicitations, vous
        avez survécu au premier boss. Bonne nouvelle : vous pouvez garder la
        même stack et ajouter un contrat d'exécution des jobs infiniment plus
        robuste. L'idée est d'arrêter de copier-coller du boilerplate et
        d'introduire une fine couche <code>jobify</code> qui standardise
        l'enqueue, l'enregistrement des processors, les timeouts, les retries,
        le tracing et l'exécution séquentielle. Fini les jobs "silencieusement
        morts" à 4h mat.
      </p>

      <p className="highlight">Serie: Async Workloads at Scale (Partie 2/3)</p>
      <p>
        Ce post est la couche d'architecture entre les deux autres articles de
        la serie :
      </p>
      <ul>
        <li>
          Partie 1 -{" "}
          <a href="?post=nodejs-stream-backpressure-history-export">
            backpressure Node.js, streams et exports S3 multipart
          </a>
        </li>
        <li>
          Partie 2 (courante) - Jobify sur BullMQ pour les contrats
          worker/queue.
        </li>
        <li>
          Partie 3 -{" "}
          <a href="?post=idempotency-debounce-jobify-bullmq">
            strategies idempotence/debounce (reschedule vs time-frame)
          </a>
        </li>
      </ul>

      <p className="highlight">
        NestJS est le point d'integration framework. Jobify est le contrat
        d'execution.
      </p>

      <h2>Integration NestJS classique (point de depart)</h2>
      <pre>
        <code className="language-typescript">
          {`@Injectable()
export class ExportsService {
  constructor(@InjectQueue("exports") private readonly queue: Queue) {}

  async enqueueExport(payload: ExportPayload) {
    return this.queue.add("activity-export", payload, {
      priority: 2,
      removeOnComplete: true,
      removeOnFail: true,
    });
  }
}`}
        </code>
      </pre>

      <p>
        Ce modèle "Hello World" fonctionne bien au début. Mais avec la
        croissance du nombre de jobs, vous accumulez très vite un plat de
        spaghettis : du code dupliqué partout, des contrats faibles entre le
        producer et le consumer, et des stratégies improvisées pour
        l'idempotence ou le debounce. Bref, une bombe à retardement
        architecturale.
      </p>

      <h2>Ce que la couche jobify apporte</h2>
      <ul>
        <li>
          <strong>Fonction nommee obligatoire :</strong> cle processor stable.
        </li>
        <li>
          <strong>Registration seulement cote worker :</strong> evite les
          doublons de handlers.
        </li>
        <li>
          <strong>Priorite dynamique :</strong> valeur statique, fonction sync
          ou async.
        </li>
        <li>
          <strong>Contrat debounce strict :</strong>
          <code>delayInMs</code> + <code>makeJobId</code> + <code>name</code>.
        </li>
      </ul>

      <h2>Queue centralisee dans queue-service.ts</h2>
      <ul>
        <li>propagation de trace au moment du enqueue;</li>
        <li>
          reschedule des jobs delayed via <code>changeDelay</code>;
        </li>
        <li>nettoyage des repeatables pour eviter les doubles schedules;</li>
        <li>
          hygiene par defaut avec <code>removeOnComplete/removeOnFail</code>.
        </li>
      </ul>

      <h2>Execution worker standardisee dans worker-service.ts</h2>
      <p>
        Ordre des wrappers: monitoring -&gt; onError -&gt; timeout -&gt; work.
      </p>
      <p>
        Ce point est critique: meme comportement de timeout, meme policy
        d'erreur, memes metriques, quel que soit le job.
      </p>

      <h2>Execution sequentielle avec make-jobify-sequential</h2>
      <ul>
        <li>
          <strong>sequentialKey</strong> definit la lane;
        </li>
        <li>
          <strong>processingKey</strong> definit le type d'action;
        </li>
        <li>
          <strong>identifier</strong> scope une entite.
        </li>
      </ul>

      <p>
        Les arguments sont stockes dans Redis (liste), traites dans l'ordre, et
        depiles en <code>finally</code> pour eviter le blocage de lane en cas
        d'echec.
      </p>

      <h2>Cas concret: action-approvals-exporter.ts</h2>
      <ul>
        <li>job queue avec priorite low et timeout explicite;</li>
        <li>pipeline stream vers CSV puis upload S3 multipart;</li>
        <li>URL signee en sortie (TTL 24h);</li>
        <li>emails success/error branches directement branchees.</li>
      </ul>

      <h2>
        Cas d'Orchestration Cloud Complexe : L'Agent Hébergé de Forest Admin
      </h2>
      <p>
        Pour notre version Cloud entièrement hébergée, nous reposons sur des
        jobs lourdement orchestrés pour éviter que l'API principale ne
        s'effondre. Lorsqu'un utilisateur modifie son schéma ou supprime un
        environnement, nous lançons des jobs asynchrones gérant des destructions
        complexes d'infrastructure (S3, configs NAT) ou de la synchronisation de
        données à travers des milliers de projets.
      </p>

      <ul>
        <li>
          <strong>Synchronisation avec Debounce :</strong> Lorsqu'une API Map
          change (modèle de données), nous passons le job de redéploiement au
          filtre anti-rebond (<code>debouncedSynchronizeAgentData</code>). Les
          utilisateurs sauvegardent souvent en rafale, et nous voulons éviter de
          lancer 10 déploiements de Lambda AWS en parallèle pour un seul
          environnement.
        </li>
        <li>
          <strong>Suppression en file d'attente :</strong> Supprimer un
          environnement Cloud implique d'effacer des objets AWS S3 et de mettre
          à jour le système central. On envoie tout ça dans un{" "}
          <code>cloudDeleteService.queuedDeleteAgent()</code>. Si AWS nous
          rate-limit, BullMQ retentera la suppression plus tard, sans laisser de
          l'infrastructure fantôme traîner (et sans enflammer nos factures NAT).
        </li>
        <li>
          <strong>Priorité des Jobs :</strong> Nous routons strictement ces
          événements : une synchronisation bloquante pour l'utilisateur a une
          priorité absolue par rapport à un job de nettoyage de fond.
        </li>
      </ul>

      <h2>Comment appliquer le pattern dans NestJS</h2>
      <p>
        Gardez les modules NestJS, ajoutez un package interne qui expose
        <code>jobify</code>, <code>queueService</code>,
        <code>workerService</code> et optionnellement
        <code>jobifySequential</code>.
      </p>

      <h2>Strategie de migration</h2>
      <ol>
        <li>Commencer par un export lourd.</li>
        <li>Centraliser les options queue dans JobOptions.</li>
        <li>Ajouter des jobId deterministes pour idempotence/debounce.</li>
        <li>N'activer le sequentiel que la ou l'ordre est obligatoire.</li>
        <li>Mesurer queue depth, failures et p95/p99 avant generalisation.</li>
      </ol>

      <h2>Règles de design de survie (À graver dans le marbre)</h2>
      <ul>
        <li>
          ne pas exposer les objets BullMQ Job à la logique métier par defaut.
          Sinon, votre cœur pur sera corrompu par les entrailles de BullMQ, et
          la prochaine version majeure vous fera pleurer de sang.
        </li>
        <li>imposer des timeouts par defaut pour garantir les shutdowns;</li>
        <li>garder le contrat producer/consumer au meme endroit;</li>
        <li>traiter les lanes sequentielles comme une ressource rare.</li>
      </ul>

      <p>
        Le principal gain n'est pas seulement le debit. C'est la determinisme
        operationnelle sur l'ensemble des workflows asynchrones.
      </p>

      <h2>Navigation dans la serie</h2>
      <ul>
        <li>
          Besoin du contexte stream/export en amont ? Lire{" "}
          <a href="?post=nodejs-stream-backpressure-history-export">Partie 1</a>
          .
        </li>
        <li>
          Besoin des patterns idempotence/debounce ensuite ? Lire{" "}
          <a href="?post=idempotency-debounce-jobify-bullmq">Partie 3</a>.
        </li>
      </ul>
    </>
  ),
};
