import os from 'os';
import crypto from 'crypto';

const encryptOpt = {
  algorithm: 'aes-256-ctr',
  passwd: os.hostname(),
};

const encrypt = (text) => {
  const cipher = crypto.createCipher(encryptOpt.algorithm, encryptOpt.passwd);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

const decrypt = (text) => {
  const decipher = crypto.createDecipher(encryptOpt.algorithm, encryptOpt.passwd);
  let dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

export { encrypt, decrypt };
