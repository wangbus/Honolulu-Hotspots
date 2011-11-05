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
  httpServer.use(express.bodyParser());
  httpServer.get('/', function(req, res) {
    return res.send("root");
  });
  httpServer.listen(3000);
  util.log("Listening on port: 3000");
}).call(this);
