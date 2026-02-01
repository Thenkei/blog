/**
 * Posts Registry
 *
 * HOW TO ADD A NEW POST:
 * 1. Create a new file in this directory: src/posts/my-post-slug.jsx
 * 2. Export `metadata` and `content` objects (see existing posts for examples)
 * 3. Import and add to the `postModules` object below
 *
 * The filename becomes the post ID (slug).
 * Posts are displayed in the order they appear in this array.
 */

import * as postgresqlUniqueNulls from "./postgresql-unique-nulls.jsx";
import * as agentBattle2026 from "./agent-battle-2026.jsx";
import * as corosApex4 from "./coros-apex-4.jsx";
import * as aiForceMultiplier from "./ai-force-multiplier.jsx";
import * as joiningRockfi from "./joining-rockfi.jsx";
import * as nexusTsVision from "./nexus-ts-vision.jsx";

// Post modules mapped by their ID (filename without extension)
// ORDER MATTERS: Posts are displayed in this order (newest first)
const postModules = {
  "nexus-ts-vision": nexusTsVision,
  "postgresql-unique-nulls": postgresqlUniqueNulls,
  "agent-battle-2026": agentBattle2026,
  "coros-apex-4": corosApex4,
  "ai-force-multiplier": aiForceMultiplier,
  "joining-rockfi": joiningRockfi,
};

/**
 * Get all posts for a given language
 * @param {string} lang - Language code ('en' or 'fr')
 * @returns {Array} Array of post objects with id, metadata, and content
 */
export function getPosts(lang = "en") {
  return Object.entries(postModules).map(([id, module]) => ({
    id,
    ...module.metadata[lang],
    content: module.content[lang],
  }));
}

/**
 * Get a single post by ID
 * @param {string} id - Post ID (filename without extension)
 * @param {string} lang - Language code ('en' or 'fr')
 * @returns {Object|null} Post object or null if not found
 */
export function getPost(id, lang = "en") {
  const module = postModules[id];
  if (!module) return null;

  return {
    id,
    ...module.metadata[lang],
    content: module.content[lang],
  };
}

/**
 * Get post content by ID and language
 * @param {string} id - Post ID
 * @param {string} lang - Language code
 * @returns {JSX.Element|null} Post content or null
 */
export function getPostContent(id, lang = "en") {
  const module = postModules[id];
  return module?.content[lang] ?? null;
}

// Export post IDs for reference
export const postIds = Object.keys(postModules);
