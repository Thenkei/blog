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
        I just burned an embarrassing hour of my precious life on a seemingly
        "impossible" bug. My <code>ON CONFLICT DO UPDATE</code> was silently
        failing to detect duplicates, even though I had a supposedly rock-solid
        uniqueness constraint in place.
      </p>

      <h2>The Plot Twist</h2>
      <p>
        Here's the kicker: by default, PostgreSQL philosophically believes that{" "}
        <code>NULL ≠ NULL</code>. That's right. It sees two rows shaped like{" "}
        <code>(value, NULL)</code> and says, "Looks like two completely
        different things to me, boss!" Ergo, not duplicates.
      </p>

      <h2>The Magic Spell</h2>
      <p>
        To fix this without tearing your hair out, you just need to add the
        magic words <code>NULLS NOT DISTINCT</code> to your unique index:
      </p>

      <pre>
        <code>
          {`CREATE UNIQUE INDEX idx_product_unique
ON products (isin, provider_product_reference)
NULLS NOT DISTINCT;`}
        </code>
      </pre>

      <p>
        With this little tweak, PostgreSQL finally learns that two nulls are, in
        fact, the same flavor of empty. Uniqueness verification is suddenly sane
        again, and your upserts will actually work as intended!
      </p>

      <p className="highlight">
        Pro tip: This lifesaver has been available since PostgreSQL 15. Check
        out the docs on{" "}
        <a
          href="https://www.postgresql.org/about/featurematrix/detail/unique-nulls-not-distinct/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Unique Nulls Not Distinct
        </a>
        .
      </p>
    </>
  ),
  fr: (
    <>
      <p>
        Je viens de brûler une honteuse heure de ma précieuse existence sur un
        cas "impossible". Mon <code>ON CONFLICT DO UPDATE</code> passait
        royalement à côté de doublons évidents alors que j'avais bétonné ma
        table avec une contrainte d'unicité.
      </p>

      <h2>Le Dénouement</h2>
      <p>
        Le piège est là : par défaut, la philosophie de PostgreSQL c'est que{" "}
        <code>NULL ≠ NULL</code>. C'est à dire que si vous lui présentez deux
        lignes <code>(valeur, NULL)</code>, il va vous soutenir mordicus que ce
        n'est pas la même chose. Exit la notion de doublons !
      </p>

      <h2>La Formule Magique</h2>
      <p>
        Pour éviter de vous arracher les cheveux, il suffit d'ajouter
        l'incantation magique <code>NULLS NOT DISTINCT</code> à l'index unique :
      </p>

      <pre>
        <code>
          {`CREATE UNIQUE INDEX idx_product_unique
ON products (isin, provider_product_reference)
NULLS NOT DISTINCT;`}
        </code>
      </pre>

      <p>
        Et hop, PostgreSQL accepte enfin qu'un vide ait la même saveur qu'un
        autre vide lors de la vérification d'unicité. Résultat : vos upserts
        re-fonctionnent de nouveau comme par magie.
      </p>

      <p className="highlight">
        Pro tip : ce petit sauveur de vie est dispo depuis PostgreSQL 15. Jetez
        un œil aux docs :{" "}
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
