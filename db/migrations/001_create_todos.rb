# frozen_string_literal: true

Sequel.migration do
  change do
    create_table(:daylight_todos) do
      String :id, primary_key: true, size: 36
      String :title, null: false, size: 240
      String :notes, text: true, null: false, default: ''
      String :list, null: false, default: 'personal'
      String :priority, null: false, default: 'normal'
      String :due_date
      TrueClass :completed, null: false, default: false
      String :created_at, null: false
      String :updated_at, null: false
      check(Sequel[:list] => %w[personal work life])
      check(Sequel[:priority] => %w[normal high])
      index [:completed, :created_at]
      index :list
    end
  end
end
