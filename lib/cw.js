const
awssum = require('awssum'),
amazon = require('awssum-amazon');
CloudWatch = require('awssum-amazon-cloudwatch').CloudWatch,
jsel = require('JSONSelect'),
config = require('./config');

var cw = new CloudWatch({
  'accessKeyId'     : config.get("aws.id"),
  'secretAccessKey' : config.get("aws.secret"),
  'region'          : amazon.US_EAST_1
});

exports.list = function(arr, cb, _data) {
  arr = arr.slice(0);
  _data = _data || [];
  if (!arr.length) return cb(null, _data);

  var cur = arr.shift();
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
    _data.push({
      name: jsel.match('.Label', data)[0],
      value: val,
      measure_time: (endTime.getTime() / 1000).toFixed(0),
      period: 60
    });

    exports.list(arr, cb, _data);
  });
};

