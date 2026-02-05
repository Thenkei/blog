export const metadata = {
  en: {
    date: "February 5, 2024",
    readTime: "18",
    title:
      "Node.js Backpressure for Massive History Exports: Streams, Async Generators, and S3 Multipart",
    subtitle:
      "Deep dive into pressure propagation, bounded concurrency, and export reliability.",
  },
  fr: {
    date: "5 Fevrier 2024",
    readTime: "18",
    title:
      "Backpressure Node.js pour les exports historiques massifs : streams, generateurs async et S3 multipart",
    subtitle:
      "Propagation de pression, concurrence bornee et fiabilite des exports.",
  },
};

export const content = {
  en: (
    <>
      <p>
        This export pipeline came from a real operational constraint: users
        could request activity logs over huge date ranges, sometimes from
        project day zero. Data came from Elasticsearch, each event needed
        enrichment from relational sources, and the final CSV had to be uploaded
        to S3 with a signed URL.
      </p>

      <p>
        For large tenants, exports took 10 to 15 minutes. The hard requirement
        was not just correctness; it was preserving worker availability while
        handling very large datasets with predictable memory usage.
      </p>

      <p className="highlight">
        Backpressure was the core control mechanism, not an implementation
        detail.
      </p>

      <h2>System constraints and failure modes</h2>
      <ul>
        <li>
          <strong>Unbounded producer risk:</strong> Elasticsearch scrolling can
          outpace downstream serialization and upload.
        </li>
        <li>
          <strong>N+1 enrichment risk:</strong> per-event relational lookups can
          increase latency and pressure DB pools.
        </li>
        <li>
          <strong>Worker starvation risk:</strong> large exports can monopolize
          async workers and delay other jobs.
        </li>
        <li>
          <strong>Retry risk:</strong> if upload fails late, naive retry can
          duplicate work and cost.
        </li>
      </ul>

      <h2>Approach A: classic Node streams with Transform stages</h2>
      <p>
        This is the closest model to your production code. Use
        <code>Readable.from(asyncIterator)</code>, explicit transform stages,
        then a multipart S3 writable. It gives clear backpressure semantics and
        mature operational behavior.
      </p>

      <pre>
        <code className="language-typescript">
          {`import { Readable, Transform, pipeline } from "node:stream";
import { promisify } from "node:util";

const pipelineAsync = promisify(pipeline);

await pipelineAsync([
  Readable.from(
    activityLogElasticStore.scrollActivityLogsByRenderingIdsAndDates({
      renderingIds,
      from,
      to,
      timezone,
    }),
    { objectMode: true, highWaterMark: 64 }
  ),
  new Transform({
    objectMode: true,
    transform(activityLog, _encoding, cb) {
      cb(null, {
        timestamp: activityLog.createdAt.toISOString(),
        user: mapper.mapEmail(cache, activityLog, "userId"),
        targetUser: mapper.mapEmail(cache, activityLog, "targetUserId"),
        team: mapper.mapTeam(cache, activityLog),
        collection: mapper.mapCollection(cache, activityLog),
        action: activityLog.action,
        label: activityLog.label,
        records: mapper.mapRecords(activityLog),
      });
    },
  }),
  csvStringify({
    columns: [
      "timestamp",
      "user",
      "targetUser",
      "team",
      "collection",
      "action",
      "label",
      "records",
    ],
    header: true,
  }),
  s3UploadWritable.createUploadWritable({
    folder: "activity-logs",
    fileName,
    minSizeToUploadInBytes: 50 * 1024 * 1024,
  }),
]);`}
        </code>
      </pre>

      <p>
        <strong>Why this works:</strong> every stage can refuse more data when
        full. That pressure propagates upstream to the ES iterator, so reads are
        naturally throttled by downstream throughput.
      </p>

      <h2>
        Approach B: async generator pipeline (more composable business logic)
      </h2>
      <p>
        Async generators are often easier to test and reason about than custom
        Transform classes. You keep stream pressure by bridging with
        <code>Readable.from</code> at the pipeline boundary.
      </p>

      <pre>
        <code className="language-typescript">
          {`import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

async function* scrollFromEs(params) {
  let cursor;
  while (true) {
    const page = await es.search({ ...params, search_after: cursor, size: 500 });
    const hits = page.hits.hits;
    if (!hits.length) return;

    for (const hit of hits) yield hit._source;
    cursor = hits[hits.length - 1].sort;
  }
}

async function* enrich(source) {
  for await (const event of source) {
    const extra = await db.getMetadata(event.userId);
    yield {
      timestamp: event.createdAt.toISOString(),
      ...event,
      ...extra,
    };
  }
}

async function* toCsvLines(source) {
  yield "timestamp,user,targetUser,team,collection,action,label,records\\n";

  for await (const row of source) {
    yield serializeCsvLine(row);
  }
}

await pipeline(
  Readable.from(toCsvLines(enrich(scrollFromEs(params))), {
    highWaterMark: 32,
  }),
  s3UploadWritable
);`}
        </code>
      </pre>

      <p>
        <strong>Trade-off:</strong> great readability and testability, but you
        need discipline around serialization edge cases and CSV escaping.
      </p>

      <h2>Approach C: bounded parallel enrichment for higher throughput</h2>
      <p>
        If per-row DB enrichment dominates latency, a strictly sequential mapper
        underutilizes resources. Bounded parallelism improves throughput while
        still keeping memory predictable.
      </p>

      <pre>
        <code className="language-typescript">
          {`async function* parallelMapOrdered(source, concurrency, mapper) {
  const inFlight = new Map();
  let nextIndex = 0;
  let emitIndex = 0;

  for await (const item of source) {
    const index = nextIndex++;
    inFlight.set(
      index,
      (async () => [index, await mapper(item)])()
    );

    if (inFlight.size >= concurrency) {
      const [, value] = await inFlight.get(emitIndex);
      inFlight.delete(emitIndex);
      emitIndex += 1;
      yield value;
    }
  }

  while (inFlight.size > 0) {
    const [, value] = await inFlight.get(emitIndex);
    inFlight.delete(emitIndex);
    emitIndex += 1;
    yield value;
  }
}

const enriched = parallelMapOrdered(events, 8, async (event) => {
  const extra = await db.getMetadata(event.userId);
  return { ...event, ...extra };
});`}
        </code>
      </pre>

      <p className="highlight">
        Rule: parallelize enrichment only up to what your DB pool and downstream
        serializer can absorb.
      </p>

      <h2>S3 multipart: two viable implementation patterns</h2>
      <p>
        <strong>Pattern 1 (custom writable):</strong> your current design. It
        gives precise control over part flushing, retries, and metrics.
      </p>
      <p>
        <strong>Pattern 2 (SDK managed upload):</strong> use a
        <code>PassThrough</code> stream with <code>@aws-sdk/lib-storage</code>
        Upload.
      </p>

      <pre>
        <code className="language-typescript">
          {`import { PassThrough } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Upload } from "@aws-sdk/lib-storage";

const body = new PassThrough();

const upload = new Upload({
  client: s3,
  params: {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "text/csv",
  },
  partSize: 50 * 1024 * 1024,
  queueSize: 4,
});

await Promise.all([
  pipeline(Readable.from(csvLines), body),
  upload.done(),
]);`}
        </code>
      </pre>

      <p>
        Managed upload reduces custom code, but tune <code>partSize</code> and
        <code>queueSize</code> carefully. Their product is a direct memory
        driver.
      </p>

      <h2>Queue isolation with BullMQ (protecting worker capacity)</h2>
      <p>
        Exports should not contend with latency-sensitive jobs. Isolate queue,
        cap concurrency to 2-3 workers, and deduplicate by deterministic
        <code>jobId</code>.
      </p>

      <pre>
        <code className="language-typescript">
          {`const queueName = "activity-log-export";

await queue.add(
  "export",
  { environmentId, from, to, timezone },
  {
    jobId: ` +
            "`activity-log:${environmentId}:${from}:${to}:${timezone}`" +
            `,
    attempts: 5,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 1000 },
  }
);

new Worker(queueName, processExport, {
  concurrency: 3,
});`}
        </code>
      </pre>

      <h2>Operational controls that mattered in production</h2>
      <ul>
        <li>
          <strong>Idempotency:</strong> deterministic key on
          tenant/environment/date range/timezone.
        </li>
        <li>
          <strong>Timeout budgets:</strong> separate timeouts for ES page fetch,
          enrichment IO, and multipart part commit.
        </li>
        <li>
          <strong>Structured telemetry:</strong> queue wait time, rows/sec,
          bytes/sec, memory high-water mark, retries by stage.
        </li>
        <li>
          <strong>Supportability:</strong> persistent progress checkpoints and
          final signed URL TTL (24 hours in this implementation).
        </li>
      </ul>

      <h2>Benchmark profile and observed deltas</h2>
      <p>
        We used one representative staging profile to compare approaches: 5
        million activity logs, ~3.2 GB final CSV, ES and Postgres in the same
        region as workers, and S3 multipart upload with 50 MB parts.
      </p>
      <p>
        These numbers are not universal, but they are useful to reason about
        behavior under load.
      </p>

      <table>
        <thead>
          <tr>
            <th>Approach</th>
            <th>Duration</th>
            <th>Peak RSS</th>
            <th>DB pressure</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A - Stream Transform (sequential map)</td>
            <td>1.00x (baseline)</td>
            <td>1.00x (baseline)</td>
            <td>Low and stable</td>
            <td>Most predictable operationally</td>
          </tr>
          <tr>
            <td>B - Async generators (sequential map)</td>
            <td>1.03x</td>
            <td>0.97x</td>
            <td>Low and stable</td>
            <td>Best readability and testability</td>
          </tr>
          <tr>
            <td>C - Bounded parallel map (concurrency = 8)</td>
            <td>0.62x</td>
            <td>1.18x</td>
            <td>Moderate to high</td>
            <td>Highest throughput, highest tuning cost</td>
          </tr>
        </tbody>
      </table>

      <pre>
        <code className="language-typescript">
          {`const t0 = process.hrtime.bigint();
let rows = 0;

for await (const _ of pipelineOutputProbe) {
  rows += 1;
}

const durationMs = Number(process.hrtime.bigint() - t0) / 1e6;
const mem = process.memoryUsage();

logger.info({
  rows,
  durationMs,
  rowsPerSec: Math.round((rows / durationMs) * 1000),
  rssMb: Math.round(mem.rss / 1024 / 1024),
  heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
});`}
        </code>
      </pre>

      <h2>Decision matrix (how to choose quickly)</h2>
      <table>
        <thead>
          <tr>
            <th>Constraint</th>
            <th>Recommended approach</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Strict memory envelope, low ops risk tolerance</td>
            <td>A - Stream Transform</td>
            <td>Strong native backpressure with simple failure boundaries</td>
          </tr>
          <tr>
            <td>Complex business mapping and test-heavy codebase</td>
            <td>B - Async generators</td>
            <td>Composable functions and easier unit-level verification</td>
          </tr>
          <tr>
            <td>DB enrichment dominates latency and pool headroom exists</td>
            <td>C - Bounded parallel map</td>
            <td>Higher throughput if concurrency is explicitly capped</td>
          </tr>
          <tr>
            <td>Team has limited stream internals expertise</td>
            <td>A first, then B/C incrementally</td>
            <td>Lower cognitive load and safer production rollout</td>
          </tr>
        </tbody>
      </table>

      <h2>Choosing between the approaches</h2>
      <ul>
        <li>
          <strong>Transform pipeline:</strong> best when you need strict stream
          semantics and mature operational behavior.
        </li>
        <li>
          <strong>Async generators:</strong> best when business mapping logic is
          complex and you want easier unit tests.
        </li>
        <li>
          <strong>Bounded parallel map:</strong> best when enrichment latency is
          dominant and DB capacity allows controlled parallel reads.
        </li>
      </ul>

      <p>
        In our case, the winning combination was stream backpressure + queue
        isolation + controlled concurrency. That gave us stable memory, healthy
        workers, and predictable export completion time even on very large
        tenants.
      </p>
    </>
  ),
  fr: (
    <>
      <p>
        Ce pipeline d'export vient d'une contrainte operationnelle reelle : les
        utilisateurs pouvaient demander des activity logs sur des plages de
        dates enormes, parfois depuis le debut du projet. Les donnees venaient
        d'Elasticsearch, chaque evenement devait etre enrichi depuis des sources
        relationnelles, puis le CSV final etait envoye vers S3.
      </p>

      <p>
        Sur les gros clients, les exports prenaient 10 a 15 minutes. La
        contrainte principale n'etait pas seulement la justesse fonctionnelle,
        mais la disponibilite des workers avec une memoire previsible.
      </p>

      <p className="highlight">
        Le backpressure etait le mecanisme de controle principal.
      </p>

      <h2>Contraintes systeme et modes de panne</h2>
      <ul>
        <li>
          <strong>Producteur non borne :</strong> le scroll Elasticsearch peut
          produire plus vite que la serialisation et l'upload.
        </li>
        <li>
          <strong>Risque N+1 :</strong> enrichissement relationnel par evenement
          qui met sous pression les pools DB.
        </li>
        <li>
          <strong>Risque de starvation worker :</strong> quelques exports lourds
          peuvent bloquer d'autres jobs.
        </li>
        <li>
          <strong>Risque de retry tardif :</strong> un echec tardif pendant
          l'upload peut couter tres cher sans idempotence.
        </li>
      </ul>

      <h2>Approche A : pipeline streams + Transform</h2>
      <p>
        C'est le modele le plus proche du code de production. On utilise
        <code>Readable.from(asyncIterator)</code>, des etapes Transform, puis un
        writable multipart S3.
      </p>

      <pre>
        <code className="language-typescript">
          {`import { Readable, Transform, pipeline } from "node:stream";
import { promisify } from "node:util";

const pipelineAsync = promisify(pipeline);

await pipelineAsync([
  Readable.from(activityIterator, { objectMode: true, highWaterMark: 64 }),
  mapperTransform,
  csvTransform,
  s3UploadWritable,
]);`}
        </code>
      </pre>

      <p>
        <strong>Pourquoi ca marche :</strong> chaque etape peut ralentir la
        precedente quand elle est saturee. La pression remonte jusqu'au lecteur
        Elasticsearch.
      </p>

      <h2>Approche B : generateurs async</h2>
      <p>
        Les generateurs async sont souvent plus simples a tester pour la logique
        metier. On garde le backpressure avec <code>Readable.from</code> a la
        frontiere du pipeline.
      </p>

      <pre>
        <code className="language-typescript">
          {`import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

async function* enrich(source) {
  for await (const event of source) {
    const extra = await db.getMetadata(event.userId);
    yield { ...event, ...extra };
  }
}

await pipeline(
  Readable.from(toCsvLines(enrich(scrollFromEs(params)))),
  s3UploadWritable
);`}
        </code>
      </pre>

      <h2>Approche C : enrichissement parallele borne</h2>
      <p>
        Si l'enrichissement DB domine la latence, le mapping sequentiel est trop
        lent. Une concurrence bornee augmente le debit tout en gardant une
        memoire stable.
      </p>

      <pre>
        <code className="language-typescript">
          {`const enriched = parallelMapOrdered(events, 8, async (event) => {
  const extra = await db.getMetadata(event.userId);
  return { ...event, ...extra };
});`}
        </code>
      </pre>

      <p className="highlight">
        Regle: ne jamais depasser ce que le pool DB et le serializer aval
        peuvent absorber.
      </p>

      <h2>S3 multipart : deux patterns valides</h2>
      <ul>
        <li>
          <strong>Writable custom:</strong> controle fin des parts, retries,
          metriques.
        </li>
        <li>
          <strong>Upload SDK gere:</strong> moins de code applicatif, mais
          vigilance sur <code>partSize</code> et <code>queueSize</code>.
        </li>
      </ul>

      <h2>Isolation BullMQ pour proteger la capacite worker</h2>
      <p>
        Les exports ne doivent pas concurrencer les jobs sensibles a la latence.
        Queue dediee, concurrence 2-3, et <code>jobId</code> deterministe.
      </p>

      <pre>
        <code className="language-typescript">
          {`new Worker("activity-log-export", processExport, {
  concurrency: 3,
});`}
        </code>
      </pre>

      <h2>Controles operationnels critiques</h2>
      <ul>
        <li>
          <strong>Idempotence:</strong> cle deterministe
          tenant/environment/date-range/timezone.
        </li>
        <li>
          <strong>Budgets de timeout:</strong> separer ES, DB et commit
          multipart.
        </li>
        <li>
          <strong>Telemetry structuree:</strong> attente queue, lignes/s,
          bytes/s, watermark memoire, retries.
        </li>
        <li>
          <strong>Support:</strong> checkpoints de progression + URL signee TTL
          (24 heures dans cette implementation).
        </li>
      </ul>

      <h2>Profil de benchmark et deltas observes</h2>
      <p>
        Nous avons utilise un profil de staging representatif pour comparer les
        approches : 5 millions d'activity logs, ~3.2 GB de CSV final, ES et
        Postgres dans la meme region que les workers, et upload S3 multipart
        avec des parts de 50 MB.
      </p>
      <p>
        Ces chiffres ne sont pas universels, mais ils sont utiles pour analyser
        le comportement sous charge.
      </p>

      <table>
        <thead>
          <tr>
            <th>Approche</th>
            <th>Duree</th>
            <th>RSS max</th>
            <th>Pression DB</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A - Transform stream (mapping sequentiel)</td>
            <td>1.00x (baseline)</td>
            <td>1.00x (baseline)</td>
            <td>Faible et stable</td>
            <td>Le plus previsible en production</td>
          </tr>
          <tr>
            <td>B - Generateurs async (mapping sequentiel)</td>
            <td>1.03x</td>
            <td>0.97x</td>
            <td>Faible et stable</td>
            <td>Meilleure lisibilite et testabilite</td>
          </tr>
          <tr>
            <td>C - Mapping parallele borne (concurrence = 8)</td>
            <td>0.62x</td>
            <td>1.18x</td>
            <td>Moderee a forte</td>
            <td>Meilleur debit, cout de tuning plus eleve</td>
          </tr>
        </tbody>
      </table>

      <h2>Matrice de decision (choix rapide)</h2>
      <table>
        <thead>
          <tr>
            <th>Contrainte</th>
            <th>Approche recommandee</th>
            <th>Pourquoi</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Budget memoire strict, faible tolerance au risque ops</td>
            <td>A - Transform stream</td>
            <td>Backpressure natif fort et frontieres de pannes simples</td>
          </tr>
          <tr>
            <td>Mapping metier complexe, base de tests importante</td>
            <td>B - Generateurs async</td>
            <td>Fonctions composables et verification unitaire plus simple</td>
          </tr>
          <tr>
            <td>Latence d'enrichissement dominante et marge sur le pool DB</td>
            <td>C - Mapping parallele borne</td>
            <td>Debit plus eleve si la concurrence est strictement capee</td>
          </tr>
          <tr>
            <td>Equipe peu familiere avec les internals stream</td>
            <td>A puis B/C de maniere incrementale</td>
            <td>Charge cognitive plus faible et rollout production plus sur</td>
          </tr>
        </tbody>
      </table>

      <p>
        Dans notre cas, la combinaison gagnante etait : backpressure stream +
        isolation de queue + concurrence bornee. C'est ce qui a rendu le systeme
        stable sur les gros volumes.
      </p>
    </>
  ),
};
