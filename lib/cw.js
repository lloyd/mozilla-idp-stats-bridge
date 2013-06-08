const
awssum = require('awssum'),
amazon = require('awssum-amazon');
CloudWatch = require('awssum-amazon-cloudwatch').CloudWatch,
jsel = require('JSONSelect'),
config = require('./config'),
async = require('async'),
_ = require('underscore'),
dns = require('dns');

exports.list = function(arr, cb) {
  var all = [];
  config.get('regions').forEach(function(region) {
    arr.forEach(function(x) {
      all.push(_.extend({}, x, { region: region }));
    });
  });

  async.map(all, getOneMetric, function(err, data) {
    if (err) return cb(err);
    // now let's query for healthy hosts

    var endTime = new Date();
    async.map(config.get('regions'), checkRegionHealth, function(err, health) {
      if (err) return cb(err);

      // create the synthetic health regions metric
      data.push({
        name: config.get('statsNamespace') + '.healthyRegions',
        value: _.filter(health, function(x) { return x !== 'pass' }).length,
        measure_time: (endTime.getTime() / 1000).toFixed(0),
        period: 60
      });

      cb(null, data);
    });

    function checkRegionHealth(region, callback) {
      var domain = 'mozidp-' + region + '-health.allizomaws.com';
      console.log(domain);
      dns.resolveTxt(domain, callback);
    }
  });
  function getOneMetric(cur, callback) {
    var cw = new CloudWatch({
      'accessKeyId'     : config.get("aws.id"),
      'secretAccessKey' : config.get("aws.secret"),
      'region': cur.region
    });

    var endTime = new Date();
    cw.GetMetricStatistics({
      Namespace: cur.Namespace,
      MetricName: cur.MetricName,
      StartTime: (new Date(endTime - 60 * 1000)).toISOString('8601'),
      EndTime: endTime.toISOString('8601'),
      Period: 60,
      Statistics: [ cur.type ],
      Dimensions: cur.Dimensions
    }, function(err, data) {
      var val = 0, obj;
      if (!!(obj = jsel.match('.?', [ cur.type ], data)[0])) {
        val = parseFloat(obj);
      }
      callback(err, {
        name: config.get('statsNamespace') + '.' + cur.region + '.' + jsel.match('.Label', data)[0],
        value: val,
        measure_time: (endTime.getTime() / 1000).toFixed(0),
        period: 60
      });
    });
  }
};

