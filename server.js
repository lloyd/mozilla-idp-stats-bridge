// A little bridge server that pulls metrics from cloudwatch and
// pushes them into librato so we can render dashboards, for the
// Mozilla IdP

const
cw = require('./lib/cw'),
librato = require('librato-metrics'),
config = require('./lib/config'),
util = require('util');

var what;

exports.what = what = [
  {
    Namespace: config.get('statsNamespace'),
    MetricName: 'mozillaidp.healthcheck.ok',
    type: 'Sum'
  },
  {
    Namespace: config.get('statsNamespace'),
    MetricName: 'mozillaidp.healthcheck.error',
    type: 'Sum'
  },
  {
    Namespace: config.get('statsNamespace'),
    MetricName: 'mozillaidp.ldap.auth.success',
    type: 'Sum'
  },
  {
    Namespace: config.get('statsNamespace'),
    MetricName: 'mozillaidp.ldap.auth.wrong_password',
    type: 'Sum'
  },
  {
    Namespace: config.get('statsNamespace'),
    MetricName: 'mozillaidp.ldap.auth.unknown_email',
    type: 'Sum'
  },
  {
    Namespace: config.get('statsNamespace'),
    MetricName: 'mozillaidp.auth.attempt',
    Description: "Auth screen presentation",
    type: 'Sum'
  },
  {
    Namespace: config.get('statsNamespace'),
    MetricName: 'mozillaidp.auth.success',
    Description: "Auth successes",
    type: 'Sum'
  },
  {
    Namespace: config.get('statsNamespace'),
    MetricName: 'mozillaidp.auth.throttle',
    Description: "Auth failures due to throttling",
    type: 'Sum'
  },
  {
    Namespace: config.get('statsNamespace'),
    MetricName: 'mozillaidp.provision.attempt',
    Description: "Provisioning Attempts",
    type: 'Sum'
  },
  {
    Namespace: config.get('statsNamespace'),
    Description: "total LDAP time in ms",
    MetricName: 'mozillaidp.ldap.timing.total',
    type: 'Average'
  }
];

// only run the server if we're invoked from the command line.
if (require.main === module) {
  var lastReport = null;

  // report every minute
  setInterval(function() {
    // list all metrics we want
    cw.list(what, function(err, r) {
      if (err) return console.error('error:', err);
      else console.log("debug", JSON.stringify(r));
      var client = librato.createClient({
        email: config.get('librato.user'),
        token: config.get('librato.token')
      }).post('/metrics', { gauges: r }, function(e, r) {
        if (e) console.error("error pushing to librato", e);
        else console.log("debug", "pushed to librato");
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
}
