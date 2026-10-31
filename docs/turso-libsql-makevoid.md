# makevoid: Turso and the private libsql-sequel adapter

## Database and credentials

- Database: `turso://db1-makevoid.aws-eu-central-1.turso.io`
- Normalized transport URL: `https://db1-makevoid.aws-eu-central-1.turso.io`
- Default token file: `/Users/makevoid/.turso-db1-token` (`~/.turso-db1-token` in code).
- `TURSO_AUTH_TOKEN` overrides the file. The token exists only in the Ruby server's connection options and child environment for explicitly invoked live tests.
- Token contents are never copied into this repository, embedded in URLs, passed as command-line arguments, or sent to Vite.

The native library performs authenticated HTTPS connections. No local replica or embedded replication is used by this app. The token file was restricted to mode 0600 during setup.

## Vendored source

Upstream: [makevoid/libsql-sequel](https://github.com/makevoid/libsql-sequel), private.

Base revision: `69189e07ccaeb4ebbedbc456ec94924a05a969ef`.

`vendor/libsql-sequel/` is deliberately Git-ignored at your request. Bundler uses `path: 'vendor/libsql-sequel'`; the actual adapter remains local and editable. `bin/vendor` clones this exact upstream revision over SSH and applies `patches/libsql-sequel-turso.patch` when the directory does not yet exist. Existing vendor changes are preserved.

## Hosted URL improvement

The upstream adapter already supports remote SQL, authentication, transactions, bindings, and result conversion. The supplied database URL exposed a small configuration gap: it recognized `libsql://`, `https://`, and `http://`, but not `turso://`.

The tracked patch:

1. Recognizes `turso://` in `database:` and `url:` options, so it cannot accidentally become a local filename.
2. Validates the original URL and rejects embedded credentials, query strings, and fragments.
3. Normalizes `turso://` to `https://` before passing the URL to the pinned native driver.
4. Registers the `turso` Sequel scheme as an alias for the existing adapter, supporting `Sequel.connect('turso://...', auth_token: ...)`.
5. Adds regression tests for direct URLs, explicit options, replica configuration, and sensitive URL rejection, plus a README note.

Turso documents this scheme-to-HTTPS mapping in its [SQL over HTTP reference](https://docs.turso.tech/sdk/http/reference). The application still uses the native adapter; it does not implement a separate HTTP client or bypass Sequel.

```ruby
require 'libsql-sequel'

db = Sequel.connect(
  adapter: :libsql,
  database: 'turso://db1-makevoid.aws-eu-central-1.turso.io',
  auth_token: File.read(File.expand_path('~/.turso-db1-token')).strip
)
```

## Future upstream PR

No upstream branch, PR, push, or change to `/Users/makevoid/apps/libsql-sequel` was made for this app. To prepare that PR later, apply the patch on a branch based on the recorded revision:

```sh
git apply /path/to/roda-turso-app/patches/libsql-sequel-turso.patch
```

Run the upstream checks in that checkout and include the hosted verification results. Review/rebase the patch if upstream has changed. The patch contains only adapter configuration, scheme registration, tests, and README documentation; application code is outside it.

## Driver version exception

Keep `turso_libsql = 0.2.0`. The upstream adapter explicitly excludes 0.2.1 because its bundled native library logs connection credentials and SQL. Its regression suite checks the bundled binary for the known debug marker. All application gems and npm packages were updated to the latest stable releases available during this implementation; this exact native pin is the documented exception.

## Verification boundary

`rake turso_test` successfully exercised the real hosted endpoint using the supplied token: create/read/update/delete, named bindings, Unicode/blobs, unique constraints, transaction commit/rollback/savepoints, `RETURNING`, schema introspection, prepared model operations, and reconnect persistence. Temporary randomly named tables were dropped afterward.

These checks validate the hosted remote mode used here. They do not validate embedded replication, alternate platforms, credential expiry/rotation, or production load behavior.
