/**
 * Post: PostgreSQL NULLS NOT DISTINCT
 *
 * To add a new post, copy this file and update:
 * 1. The filename (used as the post ID)
 * 2. The metadata object (date, readTime, title, subtitle for each language)
 * 3. The content object (JSX content for each language)
 */

export const metadata = {
  en: {
    date: "January 26, 2026",
    readTime: "2",
    title: "Quick feedback: ON CONFLICT DO UPDATE with nullable columns",
    subtitle: "Warning: By default, PostgreSQL considers that NULL ≠ NULL.",
  },
  fr: {
    date: "26 Janvier 2026",
    readTime: "2",
    title:
      "Petit retour d'expérience : ON CONFLICT DO UPDATE avec des colonnes nullable",
    subtitle: "Attention : Par défaut, PostgreSQL considère que NULL ≠ NULL.",
  },
};

export const content = {
  en: (
    <>
      <p>
        I just stumbled upon a slightly tricky case. (an hour spent searching
        what was happening) My <code>ON CONFLICT DO UPDATE</code> was not
        detecting duplicates even though I had a uniqueness constraint.
      </p>

      <h2>The Thing</h2>
      <p>
        By default, PostgreSQL considers that <code>NULL ≠ NULL</code>. So, two
        rows with <code>(value, NULL)</code> are not seen as duplicates.
      </p>

      <h2>The Solution</h2>
      <p>
        Add <code>NULLS NOT DISTINCT</code> to the unique index:
      </p>

      <pre>
        <code>
          {`CREATE UNIQUE INDEX idx_product_unique
ON products (isin, provider_product_reference)
NULLS NOT DISTINCT;`}
        </code>
      </pre>

      <p>
        This way, PostgreSQL treats NULLs as equal for uniqueness verification,
        and upserts work as expected.
      </p>

      <p className="highlight">
        Note: Available since PostgreSQL 15{" "}
        <a
          href="https://www.postgresql.org/about/featurematrix/detail/unique-nulls-not-distinct/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Unique Nulls Not Distinct
        </a>
      </p>
    </>
  ),
  fr: (
    <>
      <p>
        Je viens de tomber sur un cas un peu piégeux. (une heure à chercher what
        was happening) Mon <code>ON CONFLICT DO UPDATE</code> ne détectait pas
        les doublons alors que j'avais bien une contrainte d'unicité.
      </p>

      <h2>Le truc</h2>
      <p>
        Par défaut, PostgreSQL considère que <code>NULL ≠ NULL</code>. Du coup,
        deux lignes avec <code>(valeur, NULL)</code> ne sont pas vues comme des
        doublons.
      </p>

      <h2>La solution</h2>
      <p>
        Ajouter <code>NULLS NOT DISTINCT</code> à l'index unique :
      </p>

      <pre>
        <code>
          {`CREATE UNIQUE INDEX idx_product_unique
ON products (isin, provider_product_reference)
NULLS NOT DISTINCT;`}
        </code>
      </pre>

      <p>
        Comme ça, PostgreSQL traite les NULL comme égaux pour la vérification
        d'unicité, et les upserts fonctionnent comme attendu.
      </p>

      <p className="highlight">
        À noter : Dispo depuis PostgreSQL 15{" "}
        <a
          href="https://www.postgresql.org/about/featurematrix/detail/unique-nulls-not-distinct/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Unique Nulls Not Distinct
        </a>
      </p>
    </>
  ),
};
