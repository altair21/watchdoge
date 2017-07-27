import nodemailer from 'nodemailer';

import { decrypt } from './crypt';

const SubjectMode = {
  running: '[RUNNING]',
  finish: '[FINISHED]',
  failed: '[FAILED]',
};

const OutputType = {
  stderr: 'stderr',
  stdout: 'stdout',
};

const ordinalNumber = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const timestamp = () => (new Date()).getTime();

const hr = () => '=================================================<br>';

const timestampDuration = (st, et) => {
  const seconds = parseFloat(((et - st) / 1000).toFixed(0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString()}H:${m.toString()}M:${s.toString()}S`;
};

const startTime = timestamp();

const genSubject = mode => `${mode} watchdoge notice`;

const genContent = (command, output, index, type, isEnd, exception) => {
  const durationP = `<p>Total execute time: ${timestampDuration(startTime, timestamp())}</p>`;
  let res = `<strong>This is an auto send message by watchdoge </strong><br>${hr()}`;
  res += `<p>Your command: <pre>${command}</pre></p>${hr()}`;
  if (exception) {
    res += '<p><strong><font color="red">There has an exception when running command: </font></strong>';
    res += `<pre><font color='red'>${exception}</font></pre></p>${hr()}`;
    res += durationP;
    return res;
  }
  if (isEnd) {
    if (output && typeof output === 'object') {
      res += '<p>Command has executed finished, entire output: <pre>';
      output.forEach((out) => {
        if (out.type === OutputType.stderr) {
          res += `<font color='red'>${out.message}</font><br>`;
        } else {
          res += `${out.message}<br>`;
        }
      });
      res += '</pre>';
    } else {
      res += '<p>Command has executed finished!';
    }
    res += `</p>${hr()}`;
    res += durationP;
    return res;
  }
  res += `<p>This is <strong>${ordinalNumber(index)}</strong> output`;
  if (type === OutputType.stdout) {
    res += '(stdout)';
    res += `<pre>${output}</pre>`;
  } else if (type === OutputType.stderr) {
    res += '<font color="red">(stderr)</font>';
    res += `<pre><font color='red'>${output}</font></pre>`;
  } else {
    res += '<font color="blue">(UNKNOWN)</font>';
    res += `<pre>${output}</pre>`;
  }
  res += `</p>${hr()}`;
  res += durationP;
  return res;
};

const sendEmailQueue = [];
let sending = false;
const doSendEmail = (config, subject, content) => {
  // default is qq mailbox
  let host = 'smtp.qq.com';
  let port = 465;
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

  const transporter = nodemailer.createTransport({
    transport: 'SMTP',
    host,
    secureConnection: true,
    secure: true,
    port,
    requiresAuth: true,
    auth: {
      user: config.email,
      pass: decrypt(config.password),
    },
  });

  const mailOption = {
    from: `"watchdoge"<${config.email}>`,
    to: config.email,
    subject,
    html: content,
  };

  transporter.sendMail(mailOption, (err) => {
    if (err) {
      console.log('Send mail get error: ', err);
    }
    if (sendEmailQueue.length > 0) {
      const obj = sendEmailQueue.shift();
      doSendEmail(obj.config, obj.subject, obj.content);
    } else {
      sending = false;
    }
  });
};
const sendEmail = (config, subject, content) => {
  sendEmailQueue.push({ config, subject, content });
  if (!sending) {
    sending = true;
    const obj = sendEmailQueue.shift();
    doSendEmail(obj.config, obj.subject, obj.content);
  }
};

export { SubjectMode, OutputType, genSubject, genContent, sendEmail };
