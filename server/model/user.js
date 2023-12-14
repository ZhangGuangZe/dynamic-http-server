const crypto = require('crypto');
const { setSession } = require('./session');
const sessionName = 'userInfo';

/**
 * 用户登录
 * @param {*} database 
 * @param {*} userInfo
 * @returns 
 */
async function login(database, ctx, { username, password }) {
  const userInfo = await database.get('SELECT * FROM user WHERE username = ?', username);
  const salt = 'xypte';
  const hash = crypto.createHash('sha256').update(`${salt}${password}`, 'utf8').digest().toString('hex');

  if (userInfo && hash === userInfo.password) {
    const data = { id: userInfo.id, username: userInfo.username };
    setSession(database, ctx, sessionName, data);
    return data;
  }
  return null;
}

async function checkLogin(ctx) {
  const { getSession } = require('./session');
  const userInfo = await getSession(ctx.database, ctx, 'userInfo');
  ctx.userInfo = userInfo;
  return ctx.userInfo;
}

module.exports = {
  login,
  checkLogin
}