# frozen_string_literal: true

require 'date'
require 'time'
require 'securerandom'

module Daylight
  class ValidationError < StandardError; end

  class Todos
    FIELDS = %w[title notes list priority due_date completed].freeze

    def initialize(db)
      @dataset = db[:daylight_todos]
    end

    def all
      @dataset.order(:completed, Sequel.desc(:created_at), :id).all
    end

    def find(id)
      @dataset.where(id: id).first
    end

    def create(input)
      values = validate(input, create: true)
      now = Time.now.utc.iso8601(6)
      row = {id: SecureRandom.uuid, title: '', notes: '', list: 'personal', priority: 'normal',
             due_date: nil, completed: false, created_at: now, updated_at: now}.merge(values)
      @dataset.insert(row)
      row
    end

    def update(id, input)
      values = validate(input).merge(updated_at: Time.now.utc.iso8601(6))
      # RETURNING avoids a second query and keeps the response tied to this write.
      @dataset.where(id: id).returning.update(values).first
    end

    def delete(id)
      @dataset.where(id: id).delete.positive?
    end

    private

    def validate(input, create: false)
      raise ValidationError, 'Expected a JSON object.' unless input.is_a?(Hash)
      raise ValidationError, 'Unknown task fields.' unless (input.keys - FIELDS).empty?
      raise ValidationError, 'No changes supplied.' if !create && input.empty?
      values = input.transform_keys(&:to_sym)
      if create || values.key?(:title)
        title = values[:title]
        raise ValidationError, 'Add a task title (1–240 characters).' unless title.is_a?(String) && (1..240).cover?(title.strip.length)
        values[:title] = title.strip
      end
      if values.key?(:notes) && (!values[:notes].is_a?(String) || values[:notes].length > 4000)
        raise ValidationError, 'Notes must be text, up to 4,000 characters.'
      end
      raise ValidationError, 'Choose a valid list.' if values.key?(:list) && !%w[personal work life].include?(values[:list])
      raise ValidationError, 'Choose a valid priority.' if values.key?(:priority) && !%w[normal high].include?(values[:priority])
      if values.key?(:completed) && ![true, false].include?(values[:completed])
        raise ValidationError, 'Completed must be true or false.'
      end
      if values.key?(:due_date) && !values[:due_date].nil?
        date = values[:due_date]
        begin
          raise ArgumentError unless date.is_a?(String) && /\A\d{4}-\d{2}-\d{2}\z/.match?(date)
          Date.iso8601(date)
        rescue ArgumentError
          raise ValidationError, 'Use a valid due date in YYYY-MM-DD format.'
        end
      end
      if values.values.any? { |value| value.is_a?(String) && (!value.valid_encoding? || value.include?("\0")) }
        raise ValidationError, 'Text must be valid UTF-8 without NUL bytes.'
      end
      values
    end
  end
end
