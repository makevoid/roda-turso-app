# frozen_string_literal: true

require 'minitest/autorun'
require 'tmpdir'
require_relative '../lib/database'
require_relative '../lib/todos'

class AdapterTest < Minitest::Test
  def test_turso_scheme_works_without_a_local_patch
    db = Sequel.connect('turso://example.invalid', test: false)
    assert_equal :libsql, db.adapter_scheme
    assert_equal :sqlite, db.database_type
  ensure
    db&.disconnect
  end

  def test_credentials_cannot_be_embedded_in_database_urls
    ['turso://user:password@example.invalid',
     'turso://example.invalid?auth_token=test-only',
     'turso://example.invalid#test-only'].each do |url|
      assert_raises(Sequel::Error) do
        Sequel.connect(adapter: :libsql, database: url, test: false)
      end
    end
  end

  def test_app_tasks_persist_across_file_database_connections
    Dir.mktmpdir('daylight-adapter-') do |directory|
      db = Sequel.connect(adapter: :libsql, database: File.join(directory, 'tasks.db'))
      begin
        Daylight::Database.migrate(db)
        tasks = Daylight::Todos.new(db)
        task = tasks.create('title' => 'Published gem 🌱', 'due_date' => '2026-11-01')
        tasks.update(task[:id], 'completed' => true)
        db.disconnect
        persisted = tasks.find(task[:id])
        assert_equal 'Published gem 🌱', persisted[:title]
        assert_equal '2026-11-01', persisted[:due_date]
        assert_equal true, persisted[:completed]
        assert tasks.delete(task[:id])
        assert_nil tasks.find(task[:id])
      ensure
        db.disconnect
      end
    end
  end
end
