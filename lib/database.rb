# frozen_string_literal: true

require 'libsql-sequel'
require 'sequel/extensions/migration'

module Daylight
  module Database
    DEFAULT_URL = 'turso://db1-makevoid.aws-eu-central-1.turso.io'
    MIGRATIONS = File.expand_path('../db/migrations', __dir__)

    def self.connect
      url = ENV.fetch('TURSO_DATABASE_URL', DEFAULT_URL)
      token = ENV['TURSO_AUTH_TOKEN']
      token ||= File.read(File.expand_path(ENV.fetch('TURSO_TOKEN_FILE', '~/.turso-db1-token'))).strip
      raise 'Turso token is empty' if token.strip.empty?

      Sequel.connect(adapter: :libsql, database: url, auth_token: token.strip,
                     max_connections: 4, pool_timeout: 10)
    end

    def self.migrate(db)
      Sequel::Migrator.run(db, MIGRATIONS, table: :daylight_schema_info)
    end
  end
end
