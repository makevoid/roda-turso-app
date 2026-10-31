# frozen_string_literal: true

require 'minitest/autorun'
require 'rack/test'
require_relative '../app'

class ApiTest < Minitest::Test
  include Rack::Test::Methods

  def setup
    # Same published adapter and migrations as hosted production; never touches Turso.
    @db = Sequel.connect(adapter: :libsql)
    Daylight::Database.migrate(@db)
    @app = Daylight::App.build(db: @db).freeze.app
  end

  def teardown
    @db.disconnect
  end

  def app = @app
  def body = JSON.parse(last_response.body)

  def write(method, path, payload)
    public_send(method, path, JSON.generate(payload), 'CONTENT_TYPE' => 'application/json')
  end

  def create_todo(**attributes)
    write(:post, '/api/todos', {title: 'Build something useful'}.merge(attributes))
    assert_equal 201, last_response.status, last_response.body
    body.fetch('todo')
  end

  def test_health_and_empty_list
    get '/api/health'
    assert_equal 200, last_response.status
    assert_equal({'status' => 'ok'}, body)
    get '/api/todos'
    assert_equal({'todos' => []}, body)
    assert_equal 'no-store', last_response.headers['cache-control']
    assert_includes last_response.headers['content-type'], 'application/json'
  end

  def test_complete_crud_lifecycle
    todo = create_todo(title: '  A little progress 🌱  ', list: 'work', priority: 'high', due_date: '2026-11-01')
    id = todo.fetch('id')
    assert_equal 'A little progress 🌱', todo['title']
    assert_equal false, todo['completed']
    assert_match(/\A[\da-f-]{36}\z/, id)
    get "/api/todos/#{id}"
    assert_equal todo, body.fetch('todo')
    write(:patch, "/api/todos/#{id}", {completed: true, notes: 'All done', due_date: nil})
    assert_equal 200, last_response.status, last_response.body
    assert_equal true, body.dig('todo', 'completed')
    assert_equal 'All done', body.dig('todo', 'notes')
    assert_nil body.dig('todo', 'due_date')
    assert_equal todo['created_at'], body.dig('todo', 'created_at')
    get '/api/todos'
    assert_equal 1, body['todos'].length
    assert_equal true, body['todos'].first['completed']
    delete "/api/todos/#{id}"
    assert_equal({'deleted' => true}, body)
    get "/api/todos/#{id}"
    assert_equal 404, last_response.status
  end

  def test_completed_tasks_sort_after_active_tasks_and_can_reopen
    first = create_todo(title: 'First')
    second = create_todo(title: 'Second')
    write(:patch, "/api/todos/#{second['id']}", completed: true)
    get '/api/todos'
    assert_equal [first['id'], second['id']], body['todos'].map { |todo| todo['id'] }
    write(:patch, "/api/todos/#{second['id']}", completed: false)
    assert_equal false, body.dig('todo', 'completed')
  end

  def test_invalid_create_payloads_do_not_write
    [nil, [], 'task', {}, {title: ''}, {title: '   '}, {title: 2}, {title: 'x' * 241},
     {title: "bad\0text"}, {title: 'Task', notes: nil}, {title: 'Task', notes: 'x' * 4001},
     {title: 'Task', list: 'unknown'}, {title: 'Task', priority: 'urgent'},
     {title: 'Task', completed: 'false'}, {title: 'Task', completed: 1},
     {title: 'Task', due_date: '2026-02-30'}, {title: 'Task', due_date: 'tomorrow'},
     {title: 'Task', id: 'chosen-id'}].each do |payload|
      write(:post, '/api/todos', payload)
      assert_equal 422, last_response.status, payload.inspect
      assert body['error']
    end
    assert_equal 0, @db[:daylight_todos].count
  end

  def test_invalid_update_preserves_original
    todo = create_todo
    [{title: ''}, {}, {created_at: 'yesterday'}, {completed: nil}].each do |payload|
      write(:patch, "/api/todos/#{todo['id']}", payload)
      assert_equal 422, last_response.status
    end
    get "/api/todos/#{todo['id']}"
    assert_equal todo, body['todo']
  end

  def test_unknown_ids_and_routes_are_json_404s
    get '/api/todos/missing'
    assert_equal 404, last_response.status
    write(:patch, '/api/todos/missing', title: 'Valid')
    assert_equal 404, last_response.status
    delete '/api/todos/missing'
    assert_equal 404, last_response.status
    get '/'
    assert_equal 404, last_response.status
    assert_equal({'error' => 'Route not found.'}, body)
  end

  def test_json_media_type_body_limit_and_malformed_input
    post '/api/todos', '{', 'CONTENT_TYPE' => 'application/json'
    assert_equal 400, last_response.status
    post '/api/todos', '{}', 'CONTENT_TYPE' => 'text/plain'
    assert_equal 415, last_response.status
    post '/api/todos', ' ' * 16_385, 'CONTENT_TYPE' => 'application/json'
    assert_equal 413, last_response.status
  end

  def test_foreign_origin_is_rejected_and_vite_origin_is_allowed
    header 'Origin', 'https://untrusted.example'
    write(:post, '/api/todos', title: 'Rejected')
    assert_equal 403, last_response.status
    assert_equal 0, @db[:daylight_todos].count
    header 'Origin', 'http://127.0.0.1:5173'
    create_todo
  end

  def test_sql_characters_are_data
    title = "Robert'); DROP TABLE daylight_todos;--"
    todo = create_todo(title: title, notes: '<script>alert(1)</script>')
    get "/api/todos/#{todo['id']}"
    assert_equal title, body.dig('todo', 'title')
    assert_equal 1, @db[:daylight_todos].count
  end

  def test_database_errors_are_sanitized
    @db.drop_table(:daylight_todos)
    get '/api/todos'
    assert_equal 503, last_response.status
    refute_includes last_response.body, 'daylight_todos'
    refute_includes last_response.body, 'SELECT'
  end

  def test_migration_is_idempotent
    todo = create_todo
    Daylight::Database.migrate(@db)
    get "/api/todos/#{todo['id']}"
    assert_equal todo, body['todo']
  end
end
