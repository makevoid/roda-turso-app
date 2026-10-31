# frozen_string_literal: true

require 'rake/testtask'

desc 'Start the Roda API and Vite frontend together (Ctrl-C stops both)'
task :dev do
  exec RbConfig.ruby, File.expand_path('bin/dev', __dir__)
end

desc 'Install the vendored adapter, Ruby gems, and frontend packages'
task :setup do
  exec RbConfig.ruby, File.expand_path('bin/setup', __dir__)
end

desc 'Migrate the configured Turso database'
task :migrate do
  require_relative 'lib/database'
  db = Daylight::Database.connect
  begin
    Daylight::Database.migrate(db)
    puts 'Daylight migrations applied.'
  ensure
    db.disconnect
  end
end

Rake::TestTask.new(:test) do |t|
  t.libs << 'test'
  t.pattern = 'test/**/*_test.rb'
end

desc 'Run vendored adapter regression tests'
task :adapter_test do
  ruby '-Ivendor/libsql-sequel/lib', '-e', 'Dir["vendor/libsql-sequel/test/*_test.rb"].sort.each { |file| require_relative file }'
end

desc 'Verify live hosted CRUD and transactions using disposable test tables'
task :turso_test do
  require_relative 'lib/database'
  env = {
    'LIBSQL_TEST_URL' => ENV.fetch('TURSO_DATABASE_URL', Daylight::Database::DEFAULT_URL),
    'LIBSQL_TEST_AUTH_TOKEN' => ENV['TURSO_AUTH_TOKEN'] || File.read(File.expand_path(ENV.fetch('TURSO_TOKEN_FILE', '~/.turso-db1-token'))).strip
  }
  # Never use Rake's sh(env, ...) here: it prints the environment, including tokens.
  abort 'Hosted adapter tests failed.' unless system(env, RbConfig.ruby, '-Ivendor/libsql-sequel/lib', 'vendor/libsql-sequel/test/remote.rb')
end

desc 'Build the Vite frontend'
task :build do
  sh 'npm', '--prefix', 'frontend', 'run', 'build'
end

task default: :test
