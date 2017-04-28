'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decrypt = exports.encrypt = undefined;

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var encryptOpt = {
  algorithm: 'aes-256-ctr',
  passwd: _os2.default.hostname()
};

var encrypt = function encrypt(text) {
  var cipher = _crypto2.default.createCipher(encryptOpt.algorithm, encryptOpt.passwd);
  var crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

var decrypt = function decrypt(text) {
  var decipher = _crypto2.default.createDecipher(encryptOpt.algorithm, encryptOpt.passwd);
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

exports.encrypt = encrypt;
exports.decrypt = decrypt;