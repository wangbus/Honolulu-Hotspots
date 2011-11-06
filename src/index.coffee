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

httpServer.listen(3000)
util.log("Listening on port: 3000")

