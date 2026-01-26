/**
 * POST TEMPLATE
 *
 * To add a new blog post:
 *
 * 1. Copy this file and rename it to your-post-slug.jsx
 *    (the filename becomes the post ID/URL slug)
 *
 * 2. Fill in the metadata for both languages (en and fr)
 *
 * 3. Write your content in JSX for both languages
 *
 * 4. Register your post in src/posts/index.js:
 *    - Add import: import * as yourPostSlug from "./your-post-slug.jsx";
 *    - Add to postModules object: "your-post-slug": yourPostSlug,
 *
 * TIPS:
 * - Use <h2> for section headings (auto-generates table of contents)
 * - Use <p className="highlight"> for callout boxes
 * - Use <code> for inline code
 * - Use <pre><code>{`...`}</code></pre> for code blocks
 * - Use <strong> for bold and <em> for italic
 */

export const metadata = {
  en: {
    date: "January 1, 2026", // Format: "Month Day, Year"
    readTime: "5", // Estimated reading time in minutes
    title: "Your Post Title",
    subtitle: "A brief description that appears on the post card.",
  },
  fr: {
    date: "1 Janvier 2026", // Format: "Day Month Year"
    readTime: "5",
    title: "Titre de votre article",
    subtitle: "Une brève description qui apparaît sur la carte de l'article.",
  },
};

export const content = {
  en: (
    <>
      <p>Your introduction paragraph goes here.</p>

      <h2>First Section</h2>
      <p>
        Content for the first section. You can use <strong>bold</strong> and{" "}
        <em>italic</em> text.
      </p>

      <p className="highlight">
        This is a highlighted callout box for important information.
      </p>

      <h2>Code Example</h2>
      <p>
        Here's how to include code. Inline: <code>const x = 42;</code>
      </p>

      <pre>
        <code>
          {`// Code block example
function hello() {
  console.log("Hello, world!");
}`}
        </code>
      </pre>

      <h2>Lists</h2>
      <ul>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
      </ul>

      <p>
        Links work like this:{" "}
        <a
          href="https://example.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Example Link
        </a>
      </p>
    </>
  ),
  fr: (
    <>
      <p>Votre paragraphe d'introduction ici.</p>

      <h2>Première section</h2>
      <p>
        Contenu de la première section. Vous pouvez utiliser du texte en{" "}
        <strong>gras</strong> et en <em>italique</em>.
      </p>

      <p className="highlight">
        Ceci est une boîte de mise en évidence pour les informations
        importantes.
      </p>

      <h2>Exemple de code</h2>
      <p>
        Voici comment inclure du code. En ligne : <code>const x = 42;</code>
      </p>

      <pre>
        <code>
          {`// Exemple de bloc de code
function hello() {
  console.log("Bonjour le monde !");
}`}
        </code>
      </pre>

      <h2>Listes</h2>
      <ul>
        <li>Premier élément</li>
        <li>Deuxième élément</li>
        <li>Troisième élément</li>
      </ul>

      <p>
        Les liens fonctionnent comme ceci :{" "}
        <a
          href="https://example.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Lien exemple
        </a>
      </p>
    </>
  ),
};
