#!/usr/bin/env node
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.main = undefined;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _child_process = require('child_process');

var _crypt = require('./crypt');

var _util = require('./util');

var _mailer = require('./mailer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var configurationPath = _path2.default.join((0, _util.homedir)(), '.watchdogerc');
var configKeywords = ['email', 'password', 'mode', 'service', 'host', 'port'];

var notiMode = {
  all: 'ALL',
  end: 'END',
  error: 'ERROR'
};

var readConfig = function readConfig() {
  if (_fs2.default.existsSync(configurationPath)) {
    var data = _fs2.default.readFileSync(configurationPath, 'utf8');
    return JSON.parse(data);
  }
  return undefined;
};

var getConfig = function getConfig(key) {
  var obj = readConfig() || {};
  var res = obj[key] || '';
  console.log(res);
};

var configure = function configure(key, value) {
  var obj = readConfig() || {};
  if (key === 'password') {
    obj[key] = (0, _crypt.encrypt)(value);
  } else if (key === 'mode') {
    obj[key] = ('' + value).toLocaleUpperCase();
  } else {
    obj[key] = value;
  }
  _fs2.default.writeFileSync(configurationPath, JSON.stringify(obj));
};

var isKeyword = function isKeyword(key) {
  return configKeywords.indexOf(key) !== -1;
};

var printInfo = {
  configUsage: function configUsage() {
    console.log('Usage: watchdoge config [key] [value]');
    console.log('Available key:', configKeywords.join(', '));
  },
  usage: function usage() {
    console.log('Usage: watchdoge [command]');
  },
  needConfig: function needConfig() {
    console.log('Please config your email and password before watchdoge run.');
  }
};

var main = function main() {
  try {
    if (process.argv.length < 3) {
      printInfo.usage();
      return 1;
    }
    if (process.argv[2] === 'config') {
      if (process.argv.length === 4) {
        getConfig(process.argv[3]);
        return 0;
      }
      if (process.argv.length > 5 || !isKeyword(process.argv[3])) {
        printInfo.configUsage();
        return 1;
      }
      configure(process.argv[3], process.argv[4]);
      return 0;
    }

    if (!_fs2.default.existsSync(configurationPath)) {
      printInfo.needConfig();
      return 1;
    }
    var config = readConfig() || {};

    if (!config.email || !config.password) {
      printInfo.needConfig();
      return 1;
    }

    var command = process.argv.slice(2).join(' ');
    var outputs = [];
    var index = 1;

    var child = (0, _child_process.exec)(command, { maxBuffer: 30 * 1024 * 1024 });

    var onData = function onData(buffer, type) {
      var output = buffer.toString().slice(0, buffer.toString().length - 1);
      if (config.mode === notiMode.all) {
        (0, _mailer.sendEmail)(config, (0, _mailer.genSubject)(_mailer.SubjectMode.running), (0, _mailer.genContent)(command, output, index++, type, false));
      } else if (config.mode === notiMode.error && type === _mailer.OutputType.stderr) {
        (0, _mailer.sendEmail)(config, (0, _mailer.genSubject)(_mailer.SubjectMode.running), (0, _mailer.genContent)(command, output, index++, type, false));
      }
      outputs.push({ type: type, message: output });
      console.log(output);
    };

    var onEnd = function onEnd(type) {
      if (config.mode === notiMode.all) {
        (0, _mailer.sendEmail)(config, (0, _mailer.genSubject)(_mailer.SubjectMode.finish), (0, _mailer.genContent)(command, null, null, type, true));
      } else {
        // mode =='end' or other string
        (0, _mailer.sendEmail)(config, (0, _mailer.genSubject)(_mailer.SubjectMode.finish), (0, _mailer.genContent)(command, outputs, null, type, true));
      }
    };

    child.stdout.on('data', function (buffer) {
      onData(buffer, _mailer.OutputType.stdout);
    });
    child.stdout.on('end', function () {
      onEnd(_mailer.OutputType.stdout);
    });
    child.stderr.on('data', function (buffer) {
      onData(buffer, _mailer.OutputType.stderr);
    });
    return 0;
  } catch (e) {
    console.log('Catch an exception: \n', e);
    var _config = readConfig() || {};
    var _command = process.argv.slice(2).join(' ');
    (0, _mailer.sendEmail)(_config, (0, _mailer.genSubject)(_mailer.SubjectMode.failed), (0, _mailer.genContent)(_command, null, null, null, null, e.toString()));
    return 1;
  }
};

main();

exports.main = main;