sys = require 'sys'
util = require 'util'
express = require 'express'

# fs or env cfg
config = false
if process.env.HH_CONFIG
  util.log "Using ENV config"
  config = JSON.parse process.env.HH_CONFIG
else
  util.log "Using filesystem config"
  fs = require 'fs'
  config = JSON.parse fs.readFileSync('config.json')

throw "Unable to load config via env and fs." unless config

if (process.env.NODE_ENV == 'production')
  config = config.production
  util.log(">> #{process.env.NODE_ENV} configuration loaded.") 
else
  config = config.development
  util.log(">> development configuration loaded.") 

# foursquare cfg
foursquareConfig = {
  "secrets" : {
    "clientId" : config.keys.foursquare.clientId,
    "clientSecret" : config.keys.foursquare.clientSecret,
    "redirectUrl" : 'http://' + config.http.host + ':' + config.http.port + '/foursquare/callback'
  }
}

Foursquare = require('node-foursquare')(foursquareConfig)
foursquareAccessToken = undefined

# server cfg 
httpServer = express.createServer()
httpServer.configure () ->
  httpServer.use(express.cookieParser())
  httpServer.use(express.bodyParser())

httpServer.configure 'development', () ->
  httpServer.use('/public', express.static(__dirname + '/public'))
  httpServer.use(express.errorHandler({ dumpExceptions: true, showStack: true }))

httpServer.configure 'production', () ->
  httpServer.use('/public', express.static(__dirname + '/public'), { maxAge: 31557600000 })
  httpServer.use(express.errorHandler())

httpServer.set('view engine', 'ejs')
httpServer.get '/', (req, res) ->
  res.render 'index', { layout: false }

httpServer.get '/venues/:searchQuery', (req, res) ->
  res.redirect(Foursquare.getAuthClientRedirectUrl()) unless foursquareAccessToken
  util.log(">> searchQuery: #{req.params.searchQuery}")

  Foursquare.Venues.search(
    21.3069444, -157.8583333,
    { query: req.params.searchQuery, limit: 50 },
    foursquareAccessToken,
    (error, searchResult) ->
      venues = searchResult.venues
      for venue in venues
        util.log(venue.name)
      res.send venues
  )
  # res.end();
  #res.send req.params.searchQuery 

httpServer.get '/foursquare/callback', (req, res) ->
  Foursquare.getAccessToken({ code: req.query.code }, (err, accessToken) ->
    util.log("access token code: #{req.query.code}")
    foursquareAccessToken = accessToken
    res.redirect '/'
  ) unless foursquareAccessToken

port = config.http.port
httpServer.listen(port)
util.log("Listening on port: #{port}")

