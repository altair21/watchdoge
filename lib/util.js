'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.homedir = undefined;

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var homedir = function homedir() {
  if (typeof _os2.default.homedir === 'function') {
    return _os2.default.homedir();
  }

  var env = process.env;
  var home = env.HOME;
  var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

  if (process.platform === 'win32') {
    return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
  }

  if (process.platform === 'darwin') {
    return home || (user ? '/Users/' + user : null);
  }

  if (process.platform === 'linux') {
    return home || (process.getuid() === 0 ? '/root' : user ? '/home/' + user : null);
  }

  return home || null;
};

exports.homedir = homedir;