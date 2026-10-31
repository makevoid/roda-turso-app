# frozen_string_literal: true

require 'rake/testtask'

desc 'Start the Roda API and Vite frontend together (Ctrl-C stops both)'
task :dev do
  exec RbConfig.ruby, File.expand_path('bin/dev', __dir__)
end

desc 'Install published Ruby gems and frontend packages'
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

desc 'Run application compatibility checks against the published adapter'
Rake::TestTask.new(:adapter_test) do |t|
  t.pattern = 'test/adapter_test.rb'
end

desc 'Verify live hosted CRUD and transactions using disposable test tables'
task :turso_test do
  # The test reads credentials through the app's connection helper, never argv.
  abort 'Hosted adapter tests failed.' unless system(RbConfig.ruby, 'test/remote.rb')
end

desc 'Build the Vite frontend'
task :build do
  sh 'npm', '--prefix', 'frontend', 'run', 'build'
end

task default: :test
