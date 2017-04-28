import os from 'os';

const homedir = () => {
  if (typeof os.homedir === 'function') {
    return os.homedir();
  }

  const env = process.env;
  const home = env.HOME;
  const user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

  if (process.platform === 'win32') {
    return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
  }

  if (process.platform === 'darwin') {
    return home || (user ? `/Users/${user}` : null);
  }

  if (process.platform === 'linux') {
    return home || (process.getuid() === 0 ? '/root' : (user ? `/home/${user}` : null));
  }

  return home || null;
};

export { homedir };
