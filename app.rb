# frozen_string_literal: true

require 'roda'
require 'json'
require_relative 'lib/database'
require_relative 'lib/todos'

module Daylight
  class App < Roda
    plugin :json
    plugin :all_verbs
    plugin :halt
    plugin :error_handler do |error|
      case error
      when ValidationError
        response.status = 422
        {error: error.message}
      when Sequel::DatabaseError, Sequel::PoolTimeout
        warn "Database request failed (#{error.class})"
        response.status = 503
        {error: 'The database is temporarily unavailable. Please try again.'}
      else
        warn "API request failed (#{error.class})"
        response.status = 500
        {error: 'Something went wrong. Please try again.'}
      end
    end

    def self.build(db:)
      Class.new(self) do
        opts[:database] = db
        opts[:todos] = Todos.new(db)
      end
    end

    def json_body
      unless request.env['CONTENT_TYPE'].to_s.split(';').first == 'application/json'
        request.halt(415, {error: 'Use application/json.'})
      end
      raw = request.body.read(16_385)
      request.halt(413, {error: 'Request body is too large.'}) if raw.bytesize > 16_384
      JSON.parse(raw)
    rescue JSON::ParserError
      request.halt(400, {error: 'Invalid JSON.'})
    end

    route do |r|
      response['cache-control'] = 'no-store'
      response['x-content-type-options'] = 'nosniff'
      # Vite proxies /api, so browser requests stay same-origin. Reject foreign
      # browser origins; no CORS or credentials are exposed to the frontend.
      if !%w[GET HEAD].include?(r.request_method) && (origin = r.env['HTTP_ORIGIN'])
        allowed = ENV.fetch('APP_ORIGIN', 'http://127.0.0.1:5173,http://localhost:5173').split(',')
        r.halt(403, {error: 'This origin is not allowed.'}) unless allowed.include?(origin)
      end

      todos = opts[:todos]
      r.on 'api' do
        r.get 'health' do
          opts[:database].get(1)
          {status: 'ok'}
        end

        r.on 'todos' do
          r.is do
            r.get { {todos: todos.all} }
            r.post do
              todo = todos.create(json_body)
              response.status = 201
              {todo: todo}
            end
          end

          r.on String do |id|
            r.is do
              r.get do
                todo = todos.find(id)
                r.halt(404, {error: 'Task not found.'}) unless todo
                {todo: todo}
              end
              r.patch do
                todo = todos.update(id, json_body)
                r.halt(404, {error: 'Task not found.'}) unless todo
                {todo: todo}
              end
              r.delete do
                r.halt(404, {error: 'Task not found.'}) unless todos.delete(id)
                {deleted: true}
              end
            end
          end
        end
      end
      response.status = 404
      {error: 'Route not found.'}
    end
  end
end
