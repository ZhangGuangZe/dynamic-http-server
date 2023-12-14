const url = require('url');
const querystring = require('querystring');

/**
 * 解析 URL 请求参数
 * @param {*} ctx 上下文
 * @param {*} next 
 */
module.exports = async (ctx, next) => {
  const { req } = ctx;
  // 解析 GET 的 query 参数
  const { query } = url.parse(`http://${req.headers.host}${req.url}`);
  ctx.params = querystring.parse(query);

  // 解析 POST 请求参数
  if (req.method === 'POST') {
    const headers = req.headers;
    // 读取 POST 的 body 数据
    const body = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => {
        data += chunk.toString(); // 将 buffer 转换成 string
      });
      req.on('end', () => {
        resolve(data);
      });
    });
    ctx.params = ctx.params || {};
    const contentType = headers['content-type'];
    if (contentType === 'application/x-www-form-urlencoded') {
      Object.assign(ctx.params, querystring.parse(body));
    } else if (contentType === 'application/x-www-form-urlencoded') {
      Object.assign(ctx.params, JSON.parse(body));
    }
  }

  await next();
};