#!/usr/bin/env node

var
server = require('../server.js'),
cw = require('../lib/cw');

cw.list(server.what, function(err, r) {
  if (err) return console.error('error:', err);
  console.log(JSON.stringify(r, null, "  "));
});


