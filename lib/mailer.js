'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendEmail = exports.genContent = exports.genSubject = exports.OutputType = exports.SubjectMode = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _nodemailer = require('nodemailer');

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _crypt = require('./crypt');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SubjectMode = {
  running: '[RUNNING]',
  finish: '[FINISHED]',
  failed: '[FAILED]'
};

var OutputType = {
  stderr: 'stderr',
  stdout: 'stdout'
};

var ordinalNumber = function ordinalNumber(n) {
  var s = ['th', 'st', 'nd', 'rd'];
  var v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

var timestamp = function timestamp() {
  return new Date().getTime();
};

var hr = function hr() {
  return '=================================================<br>';
};

var timestampDuration = function timestampDuration(st, et) {
  var seconds = parseFloat(((et - st) / 1000).toFixed(0));
  var h = Math.floor(seconds / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = seconds % 60;
  return h.toString() + 'H:' + m.toString() + 'M:' + s.toString() + 'S';
};

var startTime = timestamp();

var genSubject = function genSubject(mode) {
  return mode + ' watchdoge notice';
};

var genContent = function genContent(command, output, index, type, isEnd, exception) {
  var durationP = '<p>Total execute time: ' + timestampDuration(startTime, timestamp()) + '</p>';
  var res = '<strong>This is an auto send message by watchdoge </strong><br>' + hr();
  res += '<p>Your command: <pre>' + command + '</pre></p>' + hr();
  if (exception) {
    res += '<p><strong><font color="red">There has an exception when running command: </font></strong>';
    res += '<pre><font color=\'red\'>' + exception + '</font></pre></p>' + hr();
    res += durationP;
    return res;
  }
  if (isEnd) {
    if (output && (typeof output === 'undefined' ? 'undefined' : _typeof(output)) === 'object') {
      res += '<p>Command has executed finished, entire output: <pre>';
      output.forEach(function (out) {
        if (out.type === OutputType.stderr) {
          res += '<font color=\'red\'>' + out.message + '</font><br>';
        } else {
          res += out.message + '<br>';
        }
      });
      res += '</pre>';
    } else {
      res += '<p>Command has executed finished!';
    }
    res += '</p>' + hr();
    res += durationP;
    return res;
  }
  res += '<p>This is <strong>' + ordinalNumber(index) + '</strong> output';
  if (type === OutputType.stdout) {
    res += '(stdout)';
    res += '<pre>' + output + '</pre>';
  } else if (type === OutputType.stderr) {
    res += '<font color="red">(stderr)</font>';
    res += '<pre><font color=\'red\'>' + output + '</font></pre>';
  } else {
    res += '<font color="blue">(UNKNOWN)</font>';
    res += '<pre>' + output + '</pre>';
  }
  res += '</p>' + hr();
  res += durationP;
  return res;
};

var sendEmailQueue = [];
var sending = false;
var doSendEmail = function doSendEmail(config, subject, content) {
  // default is qq mailbox
  var host = 'smtp.qq.com';
  var port = 465;
  if (config.service === '163') {
    host = 'smtp.163.com';
  } else if (config.service === 'none') {
    if (!config.host || !config.port) {
      console.log('Please configure host and port if you don\'t use preset service.');
      process.exit(1);
    }
    host = config.host;
    port = config.port;
  }

  var transporter = _nodemailer2.default.createTransport({
    transport: 'SMTP',
    host: host,
    secureConnection: true,
    secure: true,
    port: port,
    requiresAuth: true,
    auth: {
      user: config.email,
      pass: (0, _crypt.decrypt)(config.password)
    }
  });

  var mailOption = {
    from: '"watchdoge"<' + config.email + '>',
    to: config.email,
    subject: subject,
    html: content
  };

  transporter.sendMail(mailOption, function (err) {
    if (err) {
      console.log('Send mail get error: ', err);
    }
    if (sendEmailQueue.length > 0) {
      var obj = sendEmailQueue.shift();
      doSendEmail(obj.config, obj.subject, obj.content);
    } else {
      sending = false;
    }
  });
};
var sendEmail = function sendEmail(config, subject, content) {
  sendEmailQueue.push({ config: config, subject: subject, content: content });
  if (!sending) {
    sending = true;
    var obj = sendEmailQueue.shift();
    doSendEmail(obj.config, obj.subject, obj.content);
  }
};

exports.SubjectMode = SubjectMode;
exports.OutputType = OutputType;
exports.genSubject = genSubject;
exports.genContent = genContent;
exports.sendEmail = sendEmail;