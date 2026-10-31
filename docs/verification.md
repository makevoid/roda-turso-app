# Verification — October 31, 2026

Environment: Apple Silicon macOS, Ruby 4.0.5, Bundler 4.0.20, Node 24.11.1, npm 11.19.1.

## Published 0.3.1 update checks

Updated `libsql-sequel` from 0.3.0 to 0.3.1 with
`bundle update libsql-sequel --conservative`. The lockfile records the new
release checksum; all other gem versions remain unchanged, including
`turso_libsql = 0.2.0`.

| Check | Result |
| --- | --- |
| `bundle exec rake test` | 14 tests, 99 assertions, no failures/errors/skips; includes adapter compatibility checks |
| `bundle exec rake turso_test` | 2 hosted tests, 15 assertions, no failures/errors/skips; temporary tables removed and removal verified |

The frontend build and manual browser checks were not repeated for this dependency update.

## Published 0.3.0 migration checks

This earlier migration pinned `libsql-sequel = 0.3.0` from RubyGems. The RubyGems API
confirmed the author (Francesco Canessa), version, and SHA-256 recorded in the
lockfile. Runtime inspection confirmed that all loaded adapter files come from
the installed `libsql-sequel-0.3.0` gem, with none loaded from `vendor/`.

| Check | Result |
| --- | --- |
| `./bin/setup` | Published Ruby dependencies and locked npm packages installed successfully |
| `bundle exec rake test` | 14 tests, 99 assertions, no failures/errors/skips |
| `bundle exec rake adapter_test` | 3 compatibility tests, 10 assertions, no failures/errors/skips; also included in `rake test` |
| `bundle exec rake turso_test` | 2 hosted tests, 15 assertions, no failures/errors/skips |
| `bundle exec rake build` | Successful Vite production build |
| Gitleaks working-directory and all-local-ref scans | No leaks found; findings redacted |

The local tests cover the existing API, published Turso scheme support, rejection
of credentials in URLs, and task persistence across file-database connections.
The opt-in hosted tests use the app's connection helper and real Turso token.
They verify CRUD, bindings, Unicode, boolean/null values, unique constraints,
`RETURNING`, transactions/savepoints, and reconnect persistence. Teardown dropped
each randomly named test table and confirmed its removal. Existing todo data was
not modified.

The release does not package the upstream development tests. The old vendor-only
test commands were replaced with app-owned checks, and the obsolete bootstrap
and local patch were removed. Manual browser and server-lifecycle checks below
are the earlier implementation record; they were not repeated for this change.

## Original implementation checks (vendored adapter)

| Check | Result |
| --- | --- |
| `bundle exec rake test` | 11 Rack::Test cases, 89 assertions, no failures/errors |
| `bundle exec rake adapter_test` | 42 native adapter tests, 207 assertions, no failures/errors |
| `bundle exec rake turso_test` | 5 hosted tests, 24 assertions, no failures/errors |
| `bundle exec rake build` / `npm --prefix frontend run build` | Successful Vite production build |
| `bundle outdated --strict` | Bundle up to date within dependency constraints |
| `npm outdated` | No outdated direct npm packages |
| `npm audit --omit=dev` | No vulnerabilities reported |
| Fresh `bin/vendor` in an isolated scratch directory | Private clone, revision checkout, and tracked patch applied successfully; result matched the working vendored source |

The API suite covers CRUD, actual libSQL persistence, completion/reopening, ordering, validation and boundaries, unknown routes/IDs, invalid JSON, media type, payload limit, origin rejection, SQL-like input, sanitized database failures, and idempotent migrations. Each test uses its own native in-memory database.

Hosted adapter tests used the supplied db1 token without printing it. They created random temporary tables and removed them in teardown. They exercised authenticated remote CRUD, bindings, Unicode/blobs, constraints, schema inspection, transaction commit/rollback/savepoints, returning writes, prepared model operations, and reconnect persistence.

## Manual browser verification

Used native Chrome controls through computer use; the browser-extension access host was unavailable. No React/Vite automated test suite was added.

- Inspected the desktop empty state and overall visual layout.
- Created a task using the quick-entry field against the real hosted database.
- Edited its title, notes, list, importance, and due date through the dialog; saved successfully.
- Completed it, opened the Completed view, and verified completion persisted after a full reload.
- Switched Chrome's device toolbar to iPhone 16 (393 × 852) and inspected the responsive layout, horizontal navigation, search, and mobile new-task action.
- Created a second task through the mobile dialog and saw it in the saved list.
- Entered a mobile search query and confirmed the matching task remained visible.
- Fixed component CSS precedence found during visual review by putting custom styles in Tailwind's component layer.
- Removed only the two QA-created rows through the API and verified they were absent afterward. The browser was not used to confirm permanent deletion.

During normal interaction, the console showed warnings from the existing MetaMask extension, plus React's development-tools informational message; no application JavaScript exceptions were observed. The later deliberate server shutdown produced expected connection-reset/refused messages; reloading after restart restored the app. This was Chrome device emulation, not a physical iPhone/Safari test.

## Development lifecycle

Port 5173 was occupied by an existing process and was left untouched. Testing used `FRONTEND_PORT=5174 bundle exec rake dev` with API port 9292. The Vite proxy successfully returned `/api/health` from the live database.

An initial shutdown exposed a macOS process-group probe returning EPERM after termination. The supervisor now reaps its own child PIDs instead of probing group existence with signal 0. After the fix, Ctrl-C exited successfully and both ports 5174 and 9292 could immediately be rebound. Both apps were then restarted for local review.

## Limits

No production deployment, authentication, physical-device testing, embedded replica verification, or load test was performed. Mutation failures have UI rollback/error handling, but offline/ambiguous-write scenarios have not been manually exercised in this browser run. See architecture notes for last-write-wins and retry limitations.
