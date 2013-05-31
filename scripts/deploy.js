#!/usr/bin/env node

var path = require('path'),
child_process = require('child_process');

/*
 * A thin wrapper around awsbox that expects certain env
 * vars and invokes awsbox for ya to deploy a VM.
 */

var cmd = path.join(__dirname, '..', 'node_modules', '.bin', 'awsbox');
cmd = path.relative(process.env['PWD'], cmd);

if (process.argv.length > 1 &&
    process.argv[2] === 'create' ||
    process.argv[2] === 'deploy')
{
  var options = {};

  if (process.argv.length > 3) options.n = process.argv[3];

  // pass through/override with user provided vars
  for (var i = 3; i < process.argv.length; i++) {
    var k = process.argv[i];
    if (i + 1 < process.argv.length && k.length === 2 && k[0] === '-') {
      options[k[1]] = process.argv[++i];
    }
  }

  // upload config.json
  options.x = './config.json';

  // disable ssl
  cmd += " create --ssl=disable";

  Object.keys(options).forEach(function(opt) {
    cmd += " -" + opt;
    cmd += typeof options[opt] === 'string' ? " " + options[opt] : "";
  });
} else {
  cmd += " " + process.argv.slice(2).join(' ');
}

console.log("awsbox cmd: " + cmd);
var cp = child_process.exec(cmd, function(err) {
  if (err) process.exit(err.code);
  else process.exit(0);
});
cp.stdout.pipe(process.stdout);
cp.stderr.pipe(process.stderr);
