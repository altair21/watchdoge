#!/usr/bin/env node

(function () {
  var exec = require('child_process').exec;
  var fs = require('fs');
  var os = require('os');
  var path = require('path');
  var crypto = require('crypto');
  var nodemailer = require('nodemailer');

  var configurationPath = path.join(os.homedir(), '.watchdogerc');
  var configKeywords = ['email', 'password', 'mode', 'service', 'host', 'port'];
  var cryptoAlgorithm = 'aes-256-ctr', cryptoPass = os.hostname();

  var notiMode = {
    all: 'all',
    end: 'end',
  };

  function encrypt(text) {
    var cipher = crypto.createCipher(cryptoAlgorithm, cryptoPass);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }
  
  function decrypt(text) {
    var decipher = crypto.createDecipher(cryptoAlgorithm, cryptoPass);
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }

  var subjectMode = {
    running: '[RUNNING] ',
    finish: '[FINISHED] ',
    failed: '[FAILED] ',
  };

  function timestamp() {
    return (new Date()).getTime();
  }
  var startTime = timestamp();

  function timestampDuration(st, et) {
    var seconds = parseFloat(((et - st) / 1000).toFixed(0));
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    return h.toString() + 'H:' + m.toString() + 'M:' + s.toString() + 'S';
  }

  function ordinalNumber(n) {
    var s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function readConfig() {
    var buffer = fs.readFileSync(configurationPath, 'utf8');
    return JSON.parse(buffer.toString());
  }

  function getConfig(key) {
    if (fs.existsSync(configurationPath)) {
      var obj = readConfig();
      var res = obj[key] || '';
      console.log(res);
    } else {
      console.log('');
    }
    return;
  }

  function configure(key, value) {
    var obj;
    if (fs.existsSync(configurationPath)) {
      obj = readConfig()
    } else {
      obj = {};
    }
    if (key === 'password') {
      obj[key] = encrypt(value);
    } else {
      obj[key] = value;
    }
    fs.writeFileSync(configurationPath, JSON.stringify(obj));
  }

  function genSubject(mode) {
    return mode + "watchdoge notice";
  }

  function genContent(command, output, index, type, isEnd, exception) {
    var durationP = "<p>Total execute time: " + timestampDuration(startTime, timestamp()) + "</p>";
    var res = "<strong>This is a auto send message by watchdoge </strong><hr>";
    res += "<p>Your command: <pre>" + command + "</pre></p><hr>";
    if (exception) {
      res += "<p><strong><font color='red'>There has an exception when running command: </font></strong>";
      res += "<pre><font color='red'>" + exception + "</font></pre></p><hr>";
      res += durationP;
      return res;
    }
    if (isEnd) {
      if (output && typeof output === 'object') {
        res += "<p>Command has executed finished, entire output: <pre>";
        output.forEach(function (out, idx) {
          if (out.type === 'stderr') {
            res += "<font color='red'>" + out.message + "</font><br>";
          } else {
            res += out.message + "<br>";
          }
        });
        res += "</pre>";
      } else {
        res += "<p>Command has executed finished!";
      }
      res += "</p><hr>";
      res += durationP;
      return res;
    }
    res += "<p>This is " + ordinalNumber(index) + " output";
    if (type === 'stdout') {
      res += "(stdout)"
      res += "<pre>" + output + "</pre>";
    } else if (type === 'stderr') {
      res += "<font color='red'>(stderr)</font>";
      res += "<pre><font color='red'>" + output + "</font></pre>";
    } else {
      res += "<font color='blue'>(UNKNOWN)</font>";
      res += "<pre>" + output + "</pre>";
    }
    res += "</p><hr>";
    res += durationP;
    return res;
  }

  var sendEmailQueue = [];
  var sending = false;
  function sendEmail(config, subject, content) {
    function doSendEmail(config, subject, content) {
      var host = 'smtp.qq.com', port = 465;
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
      var transporter = nodemailer.createTransport({
        transport: 'SMTP',
        host: host,
        secureConnection: true,
        secure: true,
        port: port,
        requiresAuth: true,
        auth: {
          user: config.email,
          pass: decrypt(config.password),
        }
      });

      var mailOption = {
        from: '"watchdoge" <' + config.email + '>',
        to: config.email,
        subject: subject,
        html: content,
      };

      transporter.sendMail(mailOption, function (err, info) {
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
    }

    sendEmailQueue.push({ config: config, subject: subject, content: content });
    if (!sending) {
      sending = true;
      var obj = sendEmailQueue.shift();
      doSendEmail(obj.config, obj.subject, obj.content);
    }
  }

  function isKeyword(key) {
    if (configKeywords.indexOf(key) !== -1) return true;
    return false;
  }

  function printConfigUsage() {
    console.log('Usage: watchdoge config [key] [value]');
    console.log('Available key:', configKeywords.join(', '));
  }

  function printUsage() {
    console.log('Usage: watchdoge [command]');
  }

  function printNeedConfig() {
    console.log('Please config your email and password before watchdoge run.');
  }  

  try {
    var config = readConfig()
    if (process.argv.length < 3) {
      printUsage();
      process.exit(1);
    }
    if (process.argv[2] === 'config') {
      if (process.argv.length === 4) {
        getConfig(process.argv[3]);
        process.exit(0);
      }
      if (process.argv.length > 5
      || !isKeyword(process.argv[3])) {
        printConfigUsage();
        process.exit(1);
      }
      configure(process.argv[3], process.argv[4]);
      process.exit(0);
    }

    if (!fs.existsSync(configurationPath)) {
      printNeedConfig();
      process.exit(1);
    }
    
    if (!config.email || !config.password) {
      printNeedConfig();
      process.exit(1);
    }

    var command = process.argv.slice(2).join(' ');
    var outputs = [];
    var index = 1;

    var child = exec(command, { maxBuffer: 10 * 1024 * 1024 });

    function onData(buffer, type) {
      var output = buffer.toString().slice(0, buffer.toString().length - 1);
      if (config.mode === notiMode.all) {
        sendEmail(config, genSubject(subjectMode.running), genContent(command, output, index++, type, false));
      } else if (config.mode === 'err' && type === 'stderr') {
        sendEmail(config, genSubject(subjectMode.running), genContent(command, output, index++, type, false));
      }
      outputs.push({ type: type, message: output });
      console.log(output);
    }

    function onEnd(type) {
      if (config.mode === notiMode.all) {
        sendEmail(config, genSubject(subjectMode.finish), genContent(command, null, null, type, true));
      } else {  // mode =='end' or other string
        sendEmail(config, genSubject(subjectMode.finish), genContent(command, outputs, null, type, true));
      }
    }

    child.stdout.on('data', function (buffer) {
      onData(buffer, 'stdout');
    });
    child.stdout.on('end', function () {
      onEnd('stdout');
    });
    child.stderr.on('data', function (buffer) {
      onData(buffer, 'stderr');
    });
  } catch (e) {
    sendEmail(config, genSubject(subjectMode.failed), genContent(command, null, null, null, null, e.toString()));
    console.log('Catch an exception: \n', e);
    process.exit(1);
  } 

})();
