# frozen_string_literal: true

# Opt-in only: uses the app's credentials and drops only its own random tables.
require 'minitest/autorun'
require 'securerandom'
require_relative '../lib/database'

class RemoteTest < Minitest::Test
  def setup
    @db = Daylight::Database.connect
    @table = :"sequel_test_#{SecureRandom.hex(8)}"
    @db.create_table(@table) do
      primary_key :id
      String :title, null: false, unique: true
      TrueClass :completed, null: false, default: false
      String :notes
    end
    @created = true
    @tasks = @db[@table]
  end

  def teardown
    @db.drop_table(@table) if @created
    refute @db.table_exists?(@table) if @created
  ensure
    @db&.disconnect
  end

  def test_hosted_crud_bindings_types_and_returning
    assert_empty @tasks.all
    id = @tasks.call(:insert, {title: 'Published gem 🌱'}, title: :$title)
    row = @tasks.where(id: :$id).call(:first, id: id)
    assert_equal 'Published gem 🌱', row[:title]
    assert_equal false, row[:completed]
    assert_nil row[:notes]
    updated = @tasks.where(id: id).returning.update(completed: true, notes: 'Verified')
    assert_equal true, updated.first[:completed]
    assert_equal 'Verified', updated.first[:notes]
    assert_raises(Sequel::UniqueConstraintViolation) { @tasks.insert(title: 'Published gem 🌱') }
    @db.disconnect
    assert_equal true, @tasks.where(id: id).get(:completed)
    assert_equal [{id: id}], @tasks.where(id: id).returning(:id).delete
    assert_empty @tasks.all
  end

  def test_hosted_transactions_and_savepoints
    @db.transaction do
      @tasks.insert(title: 'Kept')
      @db.transaction(savepoint: true) do
        @tasks.insert(title: 'Discarded savepoint')
        raise Sequel::Rollback
      end
    end
    @db.transaction do
      @tasks.insert(title: 'Discarded transaction')
      raise Sequel::Rollback
    end
    @db.disconnect
    assert_equal ['Kept'], @tasks.select_map(:title)
  end
end
