# makevoid: Turso and libsql-sequel 0.3.0

## Published dependency

The app installs [libsql-sequel 0.3.0 from RubyGems](https://rubygems.org/gems/libsql-sequel/versions/0.3.0), authored by Francesco Canessa. Upstream is [makevoid/libsql-sequel](https://github.com/makevoid/libsql-sequel).

```ruby
gem 'libsql-sequel', '= 0.3.0'
```

`Gemfile.lock` records the RubyGems source and release SHA-256:
`25881cad8f9a47c3836b6f30ca172492b87f4f83bc87debd42b28195f4e632e3`.
The app no longer uses a Bundler path dependency, private clone, or local adapter patch. Existing ignored `vendor/libsql-sequel/` directories are left untouched but are not loaded by setup, runtime, or tests. The previous bootstrap script and patch have been removed.

## Database and credentials

- Database: `turso://db1-makevoid.aws-eu-central-1.turso.io`
- Normalized transport URL: `https://db1-makevoid.aws-eu-central-1.turso.io`
- Default token file: `~/.turso-db1-token`, outside the app; keep its mode at `0600`.
- `TURSO_AUTH_TOKEN` overrides the file. The app and opt-in hosted test read credentials through `Daylight::Database.connect`.
- Never copy token contents into the repository, URLs, command-line arguments, or Vite variables.

The published adapter recognizes `turso://` in connection options and direct Sequel URLs, normalizes it to HTTPS, and rejects embedded credentials, query strings, and fragments. These features previously required a local patch; they are included in 0.3.0.

```ruby
require 'libsql-sequel'

db = Sequel.connect(
  adapter: :libsql,
  database: 'turso://db1-makevoid.aws-eu-central-1.turso.io',
  auth_token: File.read(File.expand_path('~/.turso-db1-token')).strip
)
```

The native library performs authenticated HTTPS connections. This app does not use local replication.

## Native driver pin

The release requires `turso_libsql = 0.2.0`. Its published README documents credential and SQL debug logging in 0.2.1; keep the release's native dependency constraint intact.

## Verification boundary

`bundle exec rake test` covers the app API and published-adapter compatibility using isolated local databases. `bundle exec rake adapter_test` selects only the compatibility tests. The published gem does not ship its upstream test suite, so these tasks use app-owned tests without loading the old vendor directory.

`bundle exec rake turso_test` runs `test/remote.rb` against the configured hosted database using the same connection helper as the app. It checks CRUD, Unicode, bindings, boolean/null values, unique constraints, `RETURNING`, transaction commit/rollback/savepoints, and persistence after reconnecting. It drops only the random tables it created and verifies their removal.

See [the verification record](verification.md) for completed checks. These tests do not validate embedded replication, alternate platforms, credential expiry/rotation, or production load behavior.
