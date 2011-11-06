(function() {
  var Foursquare, config, express, foursquareAccessToken, foursquareConfig, fs, httpServer, port, sys, util;
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
  if (process.env.NODE_ENV === 'production') {
    config = config.production;
    util.log(">> " + process.env.NODE_ENV + " configuration loaded.");
  } else {
    config = config.development;
    util.log(">> development configuration loaded.");
  }
  foursquareConfig = {
    "secrets": {
      "clientId": config.keys.foursquare.clientId,
      "clientSecret": config.keys.foursquare.clientSecret,
      "redirectUrl": 'http://' + config.http.host + ':' + config.http.port + '/foursquare/callback'
    }
  };
  Foursquare = require('node-foursquare')(foursquareConfig);
  foursquareAccessToken = void 0;
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
  httpServer.get('/venues/:searchQuery', function(req, res) {
    if (!foursquareAccessToken) {
      res.redirect(Foursquare.getAuthClientRedirectUrl());
    }
    util.log(">> searchQuery: " + req.params.searchQuery);
    return Foursquare.Venues.search(21.3069444, -157.8583333, {
      query: req.params.searchQuery,
      limit: 50
    }, foursquareAccessToken, function(error, searchResult) {
      var venue, venues, _i, _len;
      venues = searchResult.venues;
      for (_i = 0, _len = venues.length; _i < _len; _i++) {
        venue = venues[_i];
        util.log(venue.name);
      }
      return res.send(venues);
    });
  });
  httpServer.get('/foursquare/callback', function(req, res) {
    if (!foursquareAccessToken) {
      return Foursquare.getAccessToken({
        code: req.query.code
      }, function(err, accessToken) {
        util.log("access token code: " + req.query.code);
        foursquareAccessToken = accessToken;
        return res.redirect('/');
      });
    }
  });
  port = config.http.port;
  httpServer.listen(port);
  util.log("Listening on port: " + port);
}).call(this);
