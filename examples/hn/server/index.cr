require "http/server"

server = HTTP::Server.new(8080) do |context|
  response = context.response
  response.content_type = "text/html"
end

server.listen
