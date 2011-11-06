(function() {
  var config, express, fs, httpServer, sys, util;
  sys = require('sys');
  util = require('util');
  express = require('express');
  config = false;
  if (process.env.HH_CONFIG) {
    util.log("Using ENV config");
    config = JSON.parse(process.env.HH_CONFIG);
  } else {
    util.log("Using filesystem config");
    fs = require('fs');
    config = JSON.parse(fs.readFileSync('config.json'));
  }
  if (!config) {
    throw "Unable to load config via env and fs.";
  }
  httpServer = express.createServer();
  httpServer.configure(function() {
    httpServer.use(express.cookieParser());
    return httpServer.use(express.bodyParser());
  });
  httpServer.configure('development', function() {
    httpServer.use('/public', express.static(__dirname + '/public'));
    return httpServer.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  httpServer.configure('production', function() {
    httpServer.use('/public', express.static(__dirname + '/public'), {
      maxAge: 31557600000
    });
    return httpServer.use(express.errorHandler());
  });
  httpServer.set('view engine', 'ejs');
  httpServer.get('/', function(req, res) {
    return res.render('index', {
      layout: false
    });
  });
  httpServer.listen(3000);
  util.log("Listening on port: 3000");
}).call(this);
