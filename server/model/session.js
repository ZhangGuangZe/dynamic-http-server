const sessionKey = 'interceptor_js';

/**
 * 根据 Cookie id 获取用户 Session
 * @param {*} database 
 * @param {*} ctx 
 * @param {*} name 
 * @returns 
 */
async function getSession(database, ctx, name) {
  const key = ctx.cookies[sessionKey];
  if (key) {
    const now = Date.now();
    const session = await database.get('SELECT * FROM session WHERE key = ? AND name = ? AND expires > ?', key, name, now);
    if (session) {
      return JSON.parse(session.value);
    }
  }
  return null;
}

/**
 * 设置 Session
 * @param {*} database 
 * @param {*} ctx 
 * @param {*} name 
 * @param {*} data 
 * @returns 
 */
async function setSession(database, ctx, name, data) {
  try {
    const key = ctx.cookies[sessionKey];
    if (key) {
      let result = await database.get('SELECT id FROM session WHERE key = ? AND name = ?', key, name);
      if (!result) {
        result = await database.run(
          `INSERT INTO session(key, name, value, created, expires) VALUES (?, ?, ?, ?, ?)`,
          key,
          name,
          JSON.stringify(data),
          Date.now(), Date.now() + 7 * 86400 * 1000
        );
      } else {
        result = await database.run(
          'UPDATE session SET value = ?, created = ?, expires = ? WHERE key = ? AND name = ?',
          JSON.stringify(data),
          Date.now(),
          Date.now() + 7 * 86400 * 1000,
          key,
          name
        );
      }
      return { err: '', result };
    }
    throw new Error('invalid cookie');
  } catch (e) {
    return { err: e.message };
  }
}

module.exports = {
  getSession,
  setSession
}