require 'bundler/setup'
require_relative 'app'

db = Daylight::Database.connect
Daylight::Database.migrate(db)
at_exit { db.disconnect }
run Daylight::App.build(db: db).freeze.app
