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
        If you are already running <code>@nestjs/bullmq</code>, you can keep the
        same runtime stack and still gain stronger job contracts. The key idea
        is to add a thin <code>jobify</code> layer that standardizes enqueue,
        processor registration, timeouts, retries, tracing, and sequencing.
      </p>

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
        This works, but as job count grows you usually get duplicated queue
        options, weak typing between producer/consumer, and ad-hoc behavior for
        idempotency, debounce, and sequential execution.
      </p>

      <h2>What the jobify layer adds</h2>
      <p>
        The <code>make-jobify.ts</code> pattern creates a single contract:
        <strong> register once on workers, call a typed runner everywhere.</strong>
      </p>

      <ul>
        <li>
          <strong>Named function guard:</strong> unnamed work is rejected to keep
          stable processor keys.
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

      <h2>Queue behavior centralized in one place</h2>
      <p>
        In <code>queue-service.ts</code>, enqueue behavior is explicit and
        reusable:
      </p>
      <ul>
        <li>
          <strong>trace propagation:</strong> span parameters are embedded at job
          creation.
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
          queued with <code>JobPriority.low</code> and explicit timeout from env.
        </li>
        <li>
          trace disabled for heavy long-running exports.
        </li>
        <li>
          stream pipeline:
          <code>Readable.from(iterator) -&gt; Transform -&gt; csv-stringify -&gt; S3 multipart writable</code>.
        </li>
        <li>
          success and failure email flows are attached directly via
          <code>onError</code> and completion logic.
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

      <h2>Design rules worth keeping</h2>
      <ul>
        <li>
          <strong>Do not expose BullMQ Job objects</strong> to business code by
          default; pass typed args instead.
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
    </>
  ),
  fr: (
    <>
      <p>
        Si vous utilisez deja <code>@nestjs/bullmq</code>, vous pouvez garder la
        meme stack runtime et ajouter un meilleur contrat d'execution des jobs.
        L'idee est d'introduire une couche <code>jobify</code> qui standardise
        enqueue, registration des processors, timeouts, retries, tracing et
        execution sequentielle.
      </p>

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
        Ce modele fonctionne, mais avec la croissance du nombre de jobs vous
        accumulez vite du code duplique, des contrats faibles entre producer et
        consumer, et des strategies non unifiees pour idempotence/debounce.
      </p>

      <h2>Ce que la couche jobify apporte</h2>
      <ul>
        <li>
          <strong>Fonction nommee obligatoire :</strong> cle processor stable.
        </li>
        <li>
          <strong>Registration seulement cote worker :</strong> evite les doublons
          de handlers.
        </li>
        <li>
          <strong>Priorite dynamique :</strong> valeur statique, fonction sync ou
          async.
        </li>
        <li>
          <strong>Contrat debounce strict :</strong>
          <code>delayInMs</code> + <code>makeJobId</code> + <code>name</code>.
        </li>
      </ul>

      <h2>Queue centralisee dans queue-service.ts</h2>
      <ul>
        <li>
          propagation de trace au moment du enqueue;
        </li>
        <li>
          reschedule des jobs delayed via <code>changeDelay</code>;
        </li>
        <li>
          nettoyage des repeatables pour eviter les doubles schedules;
        </li>
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

      <h2>Regles de design a conserver</h2>
      <ul>
        <li>
          ne pas exposer les objets BullMQ Job a la logique metier par defaut;
        </li>
        <li>
          imposer des timeouts par defaut pour garantir les shutdowns;
        </li>
        <li>
          garder le contrat producer/consumer au meme endroit;
        </li>
        <li>
          traiter les lanes sequentielles comme une ressource rare.
        </li>
      </ul>

      <p>
        Le principal gain n'est pas seulement le debit. C'est la determinisme
        operationnelle sur l'ensemble des workflows asynchrones.
      </p>
    </>
  ),
};
