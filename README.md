# Daylight

A mobile-friendly todo app with a **Roda JSON API**, **Sequel + Turso**, and a separate **Vite / React / Tailwind CSS** frontend.

```sh
./bin/setup
bundle exec rake dev
```

Open **http://127.0.0.1:5173**. Ctrl-C stops both servers. `rake dev` also works when Rake is available on your Ruby path.

If the frontend port is occupied:

```sh
FRONTEND_PORT=5174 bundle exec rake dev
```

The default database is `turso://db1-makevoid.aws-eu-central-1.turso.io`; the API reads its token from `~/.turso-db1-token`. The browser never receives the token. Bundler installs [libsql-sequel 0.3.1 from RubyGems](https://rubygems.org/gems/libsql-sequel/versions/0.3.1), with native Turso URL support. No private adapter checkout or local patch is required.

Features: quick entry, task details and notes, completion/reopening, deletion, due dates, importance, Personal/Work/Life admin lists, search, sorting, and mobile layouts. No seed tasks are added automatically.

```sh
bundle exec rake test          # API + adapter checks, isolated memory/file DBs
bundle exec rake adapter_test  # app compatibility with the published adapter
bundle exec rake turso_test    # live Turso checks; temporary tables only
bundle exec rake build         # Vite production build
```

- [Setup and development](docs/setup.md)
- [Architecture and API](docs/architecture.md)
- [makevoid's Turso / libsql-sequel integration](docs/turso-libsql-makevoid.md)
- [Verification record](docs/verification.md)

This is a single-user local app. Both servers bind to loopback; there is no login or per-user data isolation. Deploying publicly requires authentication and a same-origin reverse proxy for `/api`. Roda serves JSON only.
