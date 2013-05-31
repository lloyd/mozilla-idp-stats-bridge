// A little bridge server that pulls metrics from cloudwatch and
// pushes them into librato so we can render dashboards, for the
// Mozilla IdP

const
cw = require('./lib/cw'),
librato = require('librato-metrics'),
config = require('./lib/config'),
util = require('util');

var what = [
  {
    Namespace: 'MozIDP-staging',
    MetricName: 'mozillaidp.healthcheck.ok',
    type: 'Sum'
  },
  {
    Namespace: 'MozIDP-staging',
    MetricName: 'mozillaidp.healthcheck.error',
    type: 'Sum'
  },
  {
    Namespace: 'MozIDP-staging',
    MetricName: 'mozillaidp.ldap.auth.success',
    type: 'Sum'
  },
  {
    Namespace: 'MozIDP-staging',
    MetricName: 'mozillaidp.ldap.auth.wrong_password',
    type: 'Sum'
  }
];


var client = require('librato-metrics').createClient({
  email: config.get('librato.user'),
  token: config.get('librato.token')
});

var lastReport = null;

// report every minute
setInterval(function() {
  // list all metrics we want
  cw.list(what, function(err, r) {
    if (err) return console.error('error:', err);
    client.post('/metrics', { gauges: r }, function(e, r) {
      lastReport = new Date();
    });
  });
}, 60000);

// start a simple server.
var express = require('express');
var app = express();
app.get('/', function(req, res){
  var body = "haven't reported stats yet...";
  if (lastReport) {
    var body = util.format('last reported stats %ss ago.', ((new Date() - lastReport) / 1000.0).toFixed(1));
  }
  res.send(body, 200);
});

app.listen(process.env.PORT || 3000);
