/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const convict = require('convict'),
      fs = require('fs'),
      path = require('path');

var conf = module.exports = convict({
  aws: {
    secret: {
      doc: 'AWS Secret',
      format: String,
      default: "",
      env: 'AWS_SECRET'
    },
    id: {
      doc: 'AWS ID',
      format: String,
      default: "",
      env: 'AWS_ID'
    }
  },
  librato: {
    user: {
      doc: 'librato user name (email)',
      format: String,
      default: "",
      env: 'LIBRATO_USER'
    },
    token: {
      doc: 'librato api token',
      format: String,
      default: "",
      env: 'LIBRATO_TOKEN'
    }
  },
  statsNamespace: {
    doc: 'The cloudwatch namespace under which mozilla IdP application stats are reported',
    format: String,
    default: "MozIDP"
  },
  regions: {
    doc: 'Regions to report data for',
    format: Array,
    default: [ "us-east-1", "us-west-1", "us-west-2", "eu-west-1" ]
  },
  dnsHealthFormat: {
    doc: 'The structure of DNS names for querying region health via DNS TXT record',
    format: String,
    default: 'mozidp-%s-health.allizomaws.com'
  }
});

var dev_config_path = path.join(__dirname, '..', 'config.json');

if (! process.env.CONFIG_FILES &&
    fs.existsSync(dev_config_path)) {
  process.env.CONFIG_FILES = dev_config_path;
}

// handle configuration files.  you can specify a CSV list of configuration
// files to process, which will be overlayed in order, in the CONFIG_FILES
// environment variable
if (process.env.CONFIG_FILES) {
  var files = process.env.CONFIG_FILES.split(',');
  files.forEach(function(file) {
    var c = JSON.parse(fs.readFileSync(file, 'utf8'));
    conf.load(c);
  });
}
