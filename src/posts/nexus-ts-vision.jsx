/**
 * Post: Nexus-TS Vision
 */

export const metadata = {
  en: {
    date: "January 31, 2026",
    readTime: "5",
    title: "Nexus-TS: The Universal Headless ORM",
    subtitle: "One API to rule them all.",
  },
  fr: {
    date: "31 Janvier 2026",
    readTime: "5",
    title: "Nexus-TS: The Universal Headless ORM",
    subtitle: "One API to rule them all. (English content)",
  },
};

export const content = {
  en: (
    <>
      <p>
        I love this vision. Uncoupling the powerful "universal data connector"
        pattern from a mandatory SaaS UI is a massive opportunity, especially in
        the TypeScript ecosystem.
      </p>
      <p>
        Here is a vision document for <strong>Nexus-TS</strong>. You can use
        this as a README, a manifesto, or a design spec for collaborators and
        LLMs.
      </p>

      <hr />

      <h2>1. The Vision</h2>
      <p>
        <strong>One API to rule them all.</strong>
      </p>
      <p>
        Nexus-TS is a next-generation, open-source Object Relational Mapper
        (ORM) for TypeScript that abstracts away the underlying data source.
        Whether your data lives in PostgreSQL, MongoDB, a REST API, Stripe, or a
        legacy SOAP service, Nexus-TS provides a single, unified DSL to query,
        mutate, and manage it.
      </p>
      <p>
        Unlike traditional ORMs that map code to a database, Nexus-TS maps code
        to <strong>collections</strong>, agnostic of where that data actually
        resides.
      </p>
      <p>
        <strong>The Philosophy:</strong>
      </p>
      <ul>
        <li>
          <strong>Write Once, Query Anything:</strong> Use the same syntax to
          filter a SQL table as you would to filter a 3rd-party API response.
        </li>
        <li>
          <strong>Headless First:</strong> No mandated SaaS, no "admin panel"
          tax. You own the data pipeline.
        </li>
        <li>
          <strong>Framework Agnostic:</strong> Use it with Express, Fastify,
          NestJS, Next.js, or standalone scripts.
        </li>
      </ul>

      <h2>2. Core Architecture</h2>
      <p>Nexus-TS is built on three pillars:</p>

      <h3>A. The Schema (The Source of Truth)</h3>
      <p>
        A strictly typed definition of your data sources. Unlike Prisma (which
        focuses on DBs), Nexus schemas define <em>Capabilities</em>.
      </p>

      <pre>
        <code>
          {`// Example Concept
import { collection, string, date } from 'nexus-ts';

export const Users = collection('Users', {
  dataSource: 'postgres-main', // Connection key
  fields: {
    id: string(),
    email: string(),
    stripeId: string(),
    createdAt: date(),
  },
  // Relationships across different sources!
  segments: {
    hasStripeSubscription: {
      field: 'stripeId',
      reference: 'Stripe.Customer.id'
    }
  }
});`}
        </code>
      </pre>

      <h3>B. The Query DSL (The "Forest" Legacy)</h3>
      <p>
        A standardized JSON-serializable query language (inspired by MongoDB and
        Forest Admin's internal DSL) that translates abstract intent into
        source-specific commands.
      </p>
      <ul>
        <li>
          <strong>Standardization:</strong> <code>Filter</code>,{" "}
          <code>Sort</code>, <code>Pagination</code>, and{" "}
          <code>Aggregation</code> work the same everywhere.
        </li>
        <li>
          <strong>Translation Layer:</strong> A query for "Last 5 Users"
          transforms into:
          <ul>
            <li>
              <code>SELECT * FROM users ...</code> for SQL.
            </li>
            <li>
              <code>db.users.find(...)</code> for Mongo.
            </li>
            <li>
              <code>GET /users?limit=5</code> for a REST API adapter.
            </li>
          </ul>
        </li>
      </ul>

      <h3>C. The Connector System (The Plugins)</h3>
      <p>A modular system where the community builds adapters.</p>
      <ul>
        <li>
          <strong>Official Connectors:</strong> Postgres, MySQL, SQLite,
          MongoDB.
        </li>
        <li>
          <strong>API Connectors:</strong> Stripe, Salesforce, HubSpot, Shopify.
        </li>
        <li>
          <strong>Generic Connectors:</strong> REST (OpenAPI), GraphQL.
        </li>
      </ul>

      <h2>3. High-Level Roadmap</h2>

      <h3>Phase 1: The Core & SQL (MVP)</h3>
      <ul>
        <li>
          <strong>Objective:</strong> Replicate standard ORM behavior
          (Sequelize/TypeORM equivalent) but with the abstract DSL.
        </li>
        <li>
          <strong>Deliverables:</strong>
          <ul>
            <li>Core Query Engine (The "Brain").</li>
            <li>PostgreSQL Connector.</li>
            <li>Type-safe Schema definition (Zod integration?).</li>
            <li>
              Basic CRUD:{" "}
              <code>
                nexus.collection('users').list({`{ filter: { ... } }`})
              </code>
              .
            </li>
          </ul>
        </li>
      </ul>

      <h3>Phase 2: The API Bridge (The Differentiator)</h3>
      <ul>
        <li>
          <strong>Objective:</strong> Prove the "universal" aspect by connecting
          to a non-database source.
        </li>
        <li>
          <strong>Deliverables:</strong>
          <ul>
            <li>Generic REST Connector (map an endpoint to a Collection).</li>
            <li>Stripe Connector (Proof of Concept).</li>
            <li>
              <strong>Cross-Source Joins:</strong> Ability to "join" a SQL User
              with their Stripe Customer data in code (software-layer join).
            </li>
          </ul>
        </li>
      </ul>

      <h3>Phase 3: The Headless Exposers</h3>
      <ul>
        <li>
          <strong>Objective:</strong> Instant API generation.
        </li>
        <li>
          <strong>Deliverables:</strong>
          <ul>
            <li>
              <code>@nexus-ts/express</code>: Auto-generate REST routes from
              Collections.
            </li>
            <li>
              <code>@nexus-ts/graphql</code>: Auto-generate a GraphQL
              schema/resolvers from Collections.
            </li>
          </ul>
        </li>
      </ul>

      <h3>Phase 4: Smart Caching & Computations</h3>
      <ul>
        <li>
          <strong>Objective:</strong> Performance optimization.
        </li>
        <li>
          <strong>Deliverables:</strong>
          <ul>
            <li>Smart fields (computed in Node.js, not the DB).</li>
            <li>
              Transparent caching layer (Redis integration) for API calls.
            </li>
          </ul>
        </li>
      </ul>

      <h2>4. Technical Stack Proposal</h2>
      <ul>
        <li>
          <strong>Language:</strong> TypeScript (Strict mode).
        </li>
        <li>
          <strong>Runtime:</strong> Node.js (primary), potentially generic
          enough for Edge/Bun/Deno.
        </li>
        <li>
          <strong>Schema Validation:</strong> Zod (for runtime validation of
          connector data).
        </li>
        <li>
          <strong>Query Builder:</strong> Kysely (internal usage for SQL
          generation to avoid reinventing the wheel).
        </li>
      </ul>

      <h2>5. Developer Experience (DX)</h2>
      <p>
        <strong>Usage Example:</strong>
      </p>

      <pre>
        <code>
          {`import { Nexus } from 'nexus-ts';
import { Users } from './collections/users';
import { StripeCustomers } from './collections/stripe';

const nexus = new Nexus({
  connections: {
    pg: process.env.DB_URL,
    stripe: process.env.STRIPE_KEY
  }
});

// A query that feels like magic
const results = await nexus.query(Users)
  .filter({ createdAt: { gt: '2023-01-01' } })
  .include(StripeCustomers) // Cross-service join
  .limit(10)
  .get();`}
        </code>
      </pre>

      <hr />

      <h3>Next Steps to Kickstart</h3>
      <ol>
        <li>
          <strong>Repo Setup:</strong> Initialize a monorepo (Core, Connectors,
          Examples).
        </li>
        <li>
          <strong>DSL Definition:</strong> Draft the interface for the{" "}
          <code>Query</code> object (the JSON structure that represents a
          request).
        </li>
        <li>
          <strong>Prototype:</strong> Build a "Fake" connector that queries a
          JSON file, then swap it for Postgres.
        </li>
      </ol>
    </>
  ),
  fr: (
    <>
      <p>
        I love this vision. Uncoupling the powerful "universal data connector"
        pattern from a mandatory SaaS UI is a massive opportunity, especially in
        the TypeScript ecosystem.
      </p>
      <p>
        Here is a vision document for <strong>Nexus-TS</strong>. You can use
        this as a README, a manifesto, or a design spec for collaborators and
        LLMs.
      </p>

      <hr />

      <h2>1. The Vision</h2>
      <p>
        <strong>One API to rule them all.</strong>
      </p>
      <p>
        Nexus-TS is a next-generation, open-source Object Relational Mapper
        (ORM) for TypeScript that abstracts away the underlying data source.
        Whether your data lives in PostgreSQL, MongoDB, a REST API, Stripe, or a
        legacy SOAP service, Nexus-TS provides a single, unified DSL to query,
        mutate, and manage it.
      </p>
      <p>
        Unlike traditional ORMs that map code to a database, Nexus-TS maps code
        to <strong>collections</strong>, agnostic of where that data actually
        resides.
      </p>
      <p>
        <strong>The Philosophy:</strong>
      </p>
      <ul>
        <li>
          <strong>Write Once, Query Anything:</strong> Use the same syntax to
          filter a SQL table as you would to filter a 3rd-party API response.
        </li>
        <li>
          <strong>Headless First:</strong> No mandated SaaS, no "admin panel"
          tax. You own the data pipeline.
        </li>
        <li>
          <strong>Framework Agnostic:</strong> Use it with Express, Fastify,
          NestJS, Next.js, or standalone scripts.
        </li>
      </ul>

      <h2>2. Core Architecture</h2>
      <p>Nexus-TS is built on three pillars:</p>

      <h3>A. The Schema (The Source of Truth)</h3>
      <p>
        A strictly typed definition of your data sources. Unlike Prisma (which
        focuses on DBs), Nexus schemas define <em>Capabilities</em>.
      </p>

      <pre>
        <code>
          {`// Example Concept
import { collection, string, date } from 'nexus-ts';

export const Users = collection('Users', {
  dataSource: 'postgres-main', // Connection key
  fields: {
    id: string(),
    email: string(),
    stripeId: string(),
    createdAt: date(),
  },
  // Relationships across different sources!
  segments: {
    hasStripeSubscription: {
      field: 'stripeId',
      reference: 'Stripe.Customer.id'
    }
  }
});`}
        </code>
      </pre>

      <h3>B. The Query DSL (The "Forest" Legacy)</h3>
      <p>
        A standardized JSON-serializable query language (inspired by MongoDB and
        Forest Admin's internal DSL) that translates abstract intent into
        source-specific commands.
      </p>
      <ul>
        <li>
          <strong>Standardization:</strong> <code>Filter</code>,{" "}
          <code>Sort</code>, <code>Pagination</code>, and{" "}
          <code>Aggregation</code> work the same everywhere.
        </li>
        <li>
          <strong>Translation Layer:</strong> A query for "Last 5 Users"
          transforms into:
          <ul>
            <li>
              <code>SELECT * FROM users ...</code> for SQL.
            </li>
            <li>
              <code>db.users.find(...)</code> for Mongo.
            </li>
            <li>
              <code>GET /users?limit=5</code> for a REST API adapter.
            </li>
          </ul>
        </li>
      </ul>

      <h3>C. The Connector System (The Plugins)</h3>
      <p>A modular system where the community builds adapters.</p>
      <ul>
        <li>
          <strong>Official Connectors:</strong> Postgres, MySQL, SQLite,
          MongoDB.
        </li>
        <li>
          <strong>API Connectors:</strong> Stripe, Salesforce, HubSpot, Shopify.
        </li>
        <li>
          <strong>Generic Connectors:</strong> REST (OpenAPI), GraphQL.
        </li>
      </ul>

      <h2>3. High-Level Roadmap</h2>

      <h3>Phase 1: The Core & SQL (MVP)</h3>
      <ul>
        <li>
          <strong>Objective:</strong> Replicate standard ORM behavior
          (Sequelize/TypeORM equivalent) but with the abstract DSL.
        </li>
        <li>
          <strong>Deliverables:</strong>
          <ul>
            <li>Core Query Engine (The "Brain").</li>
            <li>PostgreSQL Connector.</li>
            <li>Type-safe Schema definition (Zod integration?).</li>
            <li>
              Basic CRUD:{" "}
              <code>
                nexus.collection('users').list({`{ filter: { ... } }`})
              </code>
              .
            </li>
          </ul>
        </li>
      </ul>

      <h3>Phase 2: The API Bridge (The Differentiator)</h3>
      <ul>
        <li>
          <strong>Objective:</strong> Prove the "universal" aspect by connecting
          to a non-database source.
        </li>
        <li>
          <strong>Deliverables:</strong>
          <ul>
            <li>Generic REST Connector (map an endpoint to a Collection).</li>
            <li>Stripe Connector (Proof of Concept).</li>
            <li>
              <strong>Cross-Source Joins:</strong> Ability to "join" a SQL User
              with their Stripe Customer data in code (software-layer join).
            </li>
          </ul>
        </li>
      </ul>

      <h3>Phase 3: The Headless Exposers</h3>
      <ul>
        <li>
          <strong>Objective:</strong> Instant API generation.
        </li>
        <li>
          <strong>Deliverables:</strong>
          <ul>
            <li>
              <code>@nexus-ts/express</code>: Auto-generate REST routes from
              Collections.
            </li>
            <li>
              <code>@nexus-ts/graphql</code>: Auto-generate a GraphQL
              schema/resolvers from Collections.
            </li>
          </ul>
        </li>
      </ul>

      <h3>Phase 4: Smart Caching & Computations</h3>
      <ul>
        <li>
          <strong>Objective:</strong> Performance optimization.
        </li>
        <li>
          <strong>Deliverables:</strong>
          <ul>
            <li>Smart fields (computed in Node.js, not the DB).</li>
            <li>
              Transparent caching layer (Redis integration) for API calls.
            </li>
          </ul>
        </li>
      </ul>

      <h2>4. Technical Stack Proposal</h2>
      <ul>
        <li>
          <strong>Language:</strong> TypeScript (Strict mode).
        </li>
        <li>
          <strong>Runtime:</strong> Node.js (primary), potentially generic
          enough for Edge/Bun/Deno.
        </li>
        <li>
          <strong>Schema Validation:</strong> Zod (for runtime validation of
          connector data).
        </li>
        <li>
          <strong>Query Builder:</strong> Kysely (internal usage for SQL
          generation to avoid reinventing the wheel).
        </li>
      </ul>

      <h2>5. Developer Experience (DX)</h2>
      <p>
        <strong>Usage Example:</strong>
      </p>

      <pre>
        <code>
          {`import { Nexus } from 'nexus-ts';
import { Users } from './collections/users';
import { StripeCustomers } from './collections/stripe';

const nexus = new Nexus({
  connections: {
    pg: process.env.DB_URL,
    stripe: process.env.STRIPE_KEY
  }
});

// A query that feels like magic
const results = await nexus.query(Users)
  .filter({ createdAt: { gt: '2023-01-01' } })
  .include(StripeCustomers) // Cross-service join
  .limit(10)
  .get();`}
        </code>
      </pre>

      <hr />

      <h3>Next Steps to Kickstart</h3>
      <ol>
        <li>
          <strong>Repo Setup:</strong> Initialize a monorepo (Core, Connectors,
          Examples).
        </li>
        <li>
          <strong>DSL Definition:</strong> Draft the interface for the{" "}
          <code>Query</code> object (the JSON structure that represents a
          request).
        </li>
        <li>
          <strong>Prototype:</strong> Build a "Fake" connector that queries a
          JSON file, then swap it for Postgres.
        </li>
      </ol>
    </>
  ),
};
