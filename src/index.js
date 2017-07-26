#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

import { encrypt } from './crypt';
import { homedir } from './util';
import { SubjectMode, OutputType, genSubject, genContent, sendEmail } from './mailer';

const configurationPath = path.join(homedir(), '.watchdogerc');
const configKeywords = ['email', 'password', 'mode', 'service', 'host', 'port'];

const notiMode = {
  all: 'ALL',
  end: 'END',
  error: 'ERROR',
};

const readConfig = () => {
  if (fs.existsSync(configurationPath)) {
    const data = fs.readFileSync(configurationPath, 'utf8');
    return JSON.parse(data);
  }
  return undefined;
};

const getConfig = (key) => {
  const obj = readConfig() || {};
  const res = obj[key] || '';
  console.log(res);
};

const configure = (key, value) => {
  const obj = readConfig() || {};
  if (key === 'password') {
    obj[key] = encrypt(value);
  } else if (key === 'mode') {
    obj[key] = `${value}`.toLocaleUpperCase();
  } else {
    obj[key] = value;
  }
  fs.writeFileSync(configurationPath, JSON.stringify(obj));
};

const isKeyword = key => configKeywords.indexOf(key) !== -1;

const printInfo = {
  configUsage: (() => {
    console.log('Usage: watchdoge config [key] [value]');
    console.log('Available key:', configKeywords.join(', '));
  }),
  usage: (() => {
    console.log('Usage: watchdoge [command]');
  }),
  needConfig: (() => {
    console.log('Please config your email and password before watchdoge run.');
  }),
};

const main = () => {
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
      if (process.argv.length > 5
      || !isKeyword(process.argv[3])) {
        printInfo.configUsage();
        return 1;
      }
      configure(process.argv[3], process.argv[4]);
      return 0;
    }

    if (!fs.existsSync(configurationPath)) {
      printInfo.needConfig();
      return 1;
    }
    const config = readConfig() || {};

    if (!config.email || !config.password) {
      printInfo.needConfig();
      return 1;
    }

    const command = process.argv.slice(2).join(' ');
    const outputs = [];
    let index = 1;

    const child = exec(command, { maxBuffer: 30 * 1024 * 1024 });

    const onData = (buffer, type) => {
      const output = buffer.toString().slice(0, buffer.toString().length - 1);
      if (config.mode === notiMode.all) {
        sendEmail(config, genSubject(SubjectMode.running), genContent(command, output, index++, type, false));
      } else if (config.mode === notiMode.error && type === OutputType.stderr) {
        sendEmail(config, genSubject(SubjectMode.running), genContent(command, output, index++, type, false));
      }
      outputs.push({ type, message: output });
      console.log(output);
    };

    const onEnd = (type) => {
      if (config.mode === notiMode.all) {
        sendEmail(config, genSubject(SubjectMode.finish), genContent(command, null, null, type, true));
      } else {  // mode =='end' or other string
        sendEmail(config, genSubject(SubjectMode.finish), genContent(command, outputs, null, type, true));
      }
    };

    child.stdout.on('data', (buffer) => {
      onData(buffer, OutputType.stdout);
    });
    child.stdout.on('end', () => {
      onEnd(OutputType.stdout);
    });
    child.stderr.on('data', (buffer) => {
      onData(buffer, OutputType.stderr);
    });
    return 0;
  } catch (e) {
    console.log('Catch an exception: \n', e);
    const config = readConfig() || {};
    const command = process.argv.slice(2).join(' ');
    sendEmail(config, genSubject(SubjectMode.failed), genContent(command, null, null, null, null, e.toString()));
    return 1;
  }
};

main();

export { main };
