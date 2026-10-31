bind "tcp://127.0.0.1:#{ENV.fetch('API_PORT', '9292')}"
threads 0, 4
workers 0
environment ENV.fetch('RACK_ENV', 'development')
