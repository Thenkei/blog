# What Trustworthy Data Costs — release preparation

The five bilingual articles have been edited for scheduled publication, with their own painted cutaway covers. No deployment, commit or push was performed during this preparation.

## Publication calendar

| Date (UTC publication rule) | Article slug |
| --- | --- |
| 2026-10-26 | data-platform-ingestion-drift |
| 2026-10-29 | data-platform-reverse-etl-freshness |
| 2026-11-02 | data-platform-tests-as-contracts |
| 2026-11-05 | data-platform-terraform-access-and-flows |
| 2026-11-09 | data-platform-retrospective |

Both locales retain the same dates and series order. `draft: true` is removed. Production discovery, routes, RSS and sitemap remain date-gated; development previews include scheduled posts. The existing daily Pages workflow rebuilds the public feeds after midnight UTC. Calendar dates are preserved at the author's request.

## Author-confirmed material

- Provider data errors have been detected and investigated; identifying incident details are omitted.
- Tables contain millions of rows synchronized across the systems.
- Approximately 3,000 **distinct assets** execute over a day; this is not a count of materialization events.
- The longest processes currently take about an hour, less than before; no previous duration, improvement percentage or universal SLA is claimed.
- Warnings fire frequently, sometimes for new cases not yet represented by the model. No weekly review process is asserted.
- Reverse ETL serves analytical results in applications, including portfolio performance and market/client matching.

## Technical review

The local `data-tech` configuration uses dbt Core 1.11, Dagster 1.12.14, `dbt build`, `indirect_selection: buildable`, scheduled SLA tiers and reactive chains. This is repository evidence, not a live deployment audit. The posts distinguish illustrative publication patterns from deployed implementation.

Corrections cover batch deduplication versus target merge ordering; full-refresh destination modes; extraction timestamps versus source coverage; invalid/future freshness dates; NULL and zero reconciliation cases; dbt selection/freshness boundaries; empty volume baselines; Time Travel object identity; same-run versus reactive blocking checks; future grants and existing privileges; sensitive state/plan artifacts; `prevent_destroy` removal; and plan exit codes versus drift.

Each article includes primary technical references. Humor is brief and tied to operational experience. Provider incidents are not embellished into invented anecdotes.

## Validation and delivery scope

`npm run check` passed: lint, typecheck, 23 test files / 487 tests and production build. Independent checks passed for ten locale files and five release dates, internal links, eight Python/Bash excerpts and twelve TypeScript freshness edge cases. RSS and sitemap were verified before the series, on the first release date and on the last; current-date artifacts were restored. The local Dagster 1.12.14 runtime exposes the blocking-check automation API used in the example. SQL snippets and Terraform resources are illustrative: they were not applied against real services.

Before committing, account for the existing pending merge and its staged changes. Release edits are limited to the ten series MDX files, the cover mapping/test and 25 optimized image variants, plus the artwork/release notes. Preserve the pre-existing merge changes. Public RSS/sitemap must be generated for the real build date; do not commit a future-date preview feed. Use the feature branch and existing PR #39 for delivery.

[Artwork direction and final prompts](../artwork/what-trustworthy-data-costs.md)
