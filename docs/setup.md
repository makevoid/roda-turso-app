# Setup and development

## Requirements

- Ruby 3.3+; verified with Ruby 4.0.5 on Apple Silicon macOS.
- Node.js 22.12+ (or Node 20.19+); verified with Node 24.11.1 and npm 11.19.1.
- GitHub SSH access to `makevoid/libsql-sequel`, which is private.
- A valid Turso database token in `~/.turso-db1-token` (plain token, with optional trailing newline).

The pinned native driver ships Apple Silicon macOS and glibc Linux x86_64/aarch64 libraries. Other platforms need a separately reviewed native build.

## Install

```sh
./bin/setup
```

Setup restores the ignored vendor directory before Bundler runs, installs the locked gems, and runs `npm ci` in `frontend/`. Existing vendor directories are preserved to avoid overwriting adapter work. The token is not copied into the project. Use `chmod 600 ~/.turso-db1-token` to keep it readable only by your user.

## Start both apps

```sh
bundle exec rake dev
```

| Service | Address |
| --- | --- |
| Vite / React | `http://127.0.0.1:5173` |
| Roda API | `http://127.0.0.1:9292/api/health` |

`rake dev` works too when Rake is installed on your active Ruby path. The supervisor starts each server in its own process group, forwards shutdown to both groups, and stops the other server if one exits. It refuses occupied ports instead of terminating their owners. Ctrl-C or TERM shuts down the pair; a five-second grace period precedes forced cleanup of only the child process groups it started.

```sh
FRONTEND_PORT=5174 API_PORT=9293 bundle exec rake dev
```

Vite's `/api` proxy follows `API_PORT`; allowed browser origins follow `FRONTEND_PORT`. Use the printed frontend URL. Puma runs in one process with four threads, avoiding forked native database handles.

## Configuration

| Variable | Default / purpose |
| --- | --- |
| `TURSO_DATABASE_URL` | `turso://db1-makevoid.aws-eu-central-1.turso.io` |
| `TURSO_AUTH_TOKEN` | Optional token; takes precedence over the file |
| `TURSO_TOKEN_FILE` | `~/.turso-db1-token`; expanded on the server |
| `API_PORT` | `9292` |
| `FRONTEND_PORT` | `5173`, used by `rake dev` |
| `APP_ORIGIN` | Comma-separated browser origins allowed to mutate tasks; automatically set by `rake dev` |

No dotenv loader is installed. Environment variables must be exported by your shell/process manager. Never use `VITE_` variables for credentials: Vite includes those in browser code.

Migrations run before the API starts. They create only `daylight_todos` and `daylight_schema_info`. To apply them separately: `bundle exec rake migrate`.

## Commands

```sh
bundle exec rake -T
bundle exec rake test
bundle exec rake adapter_test
bundle exec rake turso_test
bundle exec rake build
```

API tests use fresh in-memory libSQL databases and never read your token. The explicitly invoked `turso_test` task uses your hosted database, creates random `sequel_test_*` tables, and drops them in test teardown. It never clears your todo table.

The frontend has no automated test suite, as requested. Check it manually in a browser; see the verification record.

## Dependencies

The lockfiles record the latest stable application gems and npm packages resolved on October 31, 2026. Notable versions: Roda 3.109.0, Sequel 5.109.0, Puma 8.0.2, Rack 3.2.8, Rack::Test 2.3.0, Minitest 6.0.6, Vite 8.3.5, React 19.3.1, Tailwind CSS 4.3.3, and Lucide React 1.66.0.

`turso_libsql` intentionally remains at **0.2.0**, the private adapter's existing exact pin. Version 0.2.1 contains native credential debug logging. `minitest-mock` and `logger` are test dependencies required by the upstream adapter suite on Minitest 6 / Ruby 4.

The indirect dependency `prism` resolves to 1.9.0 because the latest Minitest requires `prism ~> 1.5`; Prism 2.x is not compatible with that requirement. `bundle outdated --strict` reports the bundle up to date.

## Production build boundary

`bundle exec rake build` writes `frontend/dist/`. Serve those static files separately and proxy `/api` to Puma under the same public origin. Add authentication before exposing this shared todo database. Configure `APP_ORIGIN` explicitly. `vite preview` is a static preview, not the development `/api` proxy or a production server. No hosting or deployment is configured in this repository.
