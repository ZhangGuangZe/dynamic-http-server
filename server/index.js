const Server = require('./lib/interceptor/server');
const Router = require('./lib/interceptor/middleware/router');
const param = require('./aspect/param');
const cookie = require('./aspect/cookie');

const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mime = require('mime');
const zlib = require('zlib');

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbFile = path.resolve(__dirname, '../database/todolist.db');
let db = null;

const app = new Server();
const router = new Router();

/* app.use(async ({ res }, next) => {
  res.setHeader('Content-Type', 'text/html');
  res.body = '<h1>Hello world</h1>';
  await next();
}); */

/* app.use(router.all('/test/:course/:lecture', async ({ route, res }, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.body = route;
  await next();
})); */

app.use(async ({ req }, next) => {
  console.log(`${req.method} ${req.url}`);
  await next();
});

app.use(param);

app.use(cookie);

app.use(async (ctx, next) => {
  if (!db) { // 创建数据库连接
    db = await open({
      filename: dbFile,
      driver: sqlite3.cached.Database
    });
  }
  ctx.database = db;
  await next();
});

app.use(async ({ cookies, res }, next) => {
  let id = cookies.interceptor_js;
  if (!id) {
    id = Math.random().toString(36).slice(2);
  }
  res.setHeader('Set-Cookie', `interceptor_js=${id}; Path=/; Max-Age=${7 * 86400}`); // 设置cookie的有效时长一周
  await next();
});


/* const users = {};

app.use(router.get('/', async ({ cookies, res }, next) => {
  res.setHeader('Content-Type', 'text/html;charset=utf-8');
  let id = cookies.interceptor_js;
  if (id) {
    users[id] = users[id] || 1;
    users[id]++;
    res.body = `<h1>你好，欢迎第${users[id]}次访问本站</h1>`;
  } else {
    id = Math.random().toString(36).slice(2); // 生成唯一 ID 让服务器识别用户身份
    
    // Max-Age 设置 cookie 过期时间
    // Path 设置允许发送 cookie 的路径
    // HttpOnly 是否允许 document.cookie 获取 cookie
    // Domain 是否允许 cookie 在当前域名及子域名都有效
    // SameSite 限制第三方 cookie，防止 CSRF 攻击
    
    res.setHeader('Set-Cookie', `interceptor_js=${id}; Path=/; Max-Age=86400; HttpOnly=true; SameSite=Strict`);
    users[id] = 1;
    res.body = '<h1>你好，新用户</h1>';
  }
  await next();
})); */

app.use(router.get('/list', async (ctx, next) => {
  const { database, res } = ctx;
  const { checkLogin } = require('./model/user');
  const userInfo = await checkLogin(ctx);
  res.setHeader('Content-Type', 'application/json');
  if (userInfo) {
    const { getList } = require('./model/todolist');
    const result = await getList(database, userInfo);
    res.body = { data: result };
  } else {
    res.body = { err: 'not login' };
  }
  await next();
}));

app.use(router.post('/add', async (ctx, next) => {
  const { database, params, res } = ctx;
  const { checkLogin } = require('./model/user');
  const userInfo = await checkLogin(ctx);
  res.setHeader('Content-Type', 'application/json');
  if (userInfo) {
    const { addTask } = require('./model/todolist');
    const result = await addTask(database, userInfo, params);
    res.body = result;
  } else {
    res.body = { err: 'not login' };
  }
  await next();
}));

app.use(router.post('/update', async ({ database, params, res }, next) => {
  res.setHeader('Content-Type', 'application/json');
  const { updateTask } = require('./model/todolist');
  const result = await updateTask(database, params);
  res.body = result;
  await next();
}));

app.use(router.delete('/delete', async ({ database, params, res }, next) => {
  res.setHeader('Content-Type', 'application/json');
  const { deleteTask } = require('./model/todolist');
  const result = await deleteTask(database, params);
  res.body = result;
  await next();
}));

app.use(router.post('/login', async (ctx, next) => {
  const { database, params, res } = ctx;
  res.setHeader('Content-Type', 'application/json');
  const { login } = require('./model/user');
  const result = await login(database, ctx, params);
  res.statusCode = 302;
  if (!result) {
    res.setHeader('Location', '/login.html');
  } else {
    res.setHeader('Location', '/index.html');
  }
  await next();
}));

/* app.use(router.get('/coronavirus/index', async ({ res }, next) => {
  const { getCoronavirusKeyIndex } = require('./lib/module/mock');
  const index = getCoronavirusKeyIndex();

  const filePath = path.resolve(__dirname, './view/coronavirus_index.html');
  const tpl = fs.readFileSync(filePath, { encoding: 'utf-8' }); // 获取模板文件
  // 编译模板
  const template = handlebars.compile(tpl);
  // 将数据和模板结合
  const result = template({ data: index });

  res.setHeader('Content-Type', 'text/html');
  res.body = result;
  await next();
}));

app.use(router.get('/coronavirus/:date', async ({ params, route, res }, next) => {
  const { getCoronavirusByDate } = require('./lib/module/mock');
  const data = getCoronavirusByDate(route.date);

  if (params.type === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.body = {data};
  } else {
    const filePath = path.resolve(__dirname, './view/coronavirus_date.html');
    const tpl = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const template = handlebars.compile(tpl);
    const result = template({ data });
  
    res.setHeader('Content-Type', 'text/html');
    res.body = result;
  }
  await next();
})); */

app.use(router.get('.*', async ({ req, res }, next) => {
  let filePath = path.resolve(__dirname, path.join('../www', url.fileURLToPath(`file:/${req.url}`)));
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (fs.existsSync(filePath)) {
      const { ext } = path.parse(filePath);
      const stats = fs.statSync(filePath);
      const timeStamp = req.headers['if-modified-since'];
      res.statusCode = 200;
      if (timeStamp && Number(timeStamp) === stats.mtimeMs) {
        res.statusCode = 304;
      }
      const mimeType = mime.getType(ext);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'max-age=86400');
      res.setHeader('Last-Modified', stats.mtimeMs);
      const acceptEncoding = req.headers['accept-encoding'];
      const compress = acceptEncoding && /^(text|application)\//.test(mimeType);
      let compressionEncoding;
      if (compress) {
        acceptEncoding.split(/\s*,\s*/).some((encoding) => {
          if (encoding === 'gzip') {
            res.setHeader('Content-Encoding', 'gzip');
            compressionEncoding = encoding;
            return true;
          }
          if (encoding === 'deflate') {
            res.setHeader('Content-Encoding', 'deflate');
            compressionEncoding = encoding;
            return true;
          }
          if (encoding === 'br') {
            res.setHeader('Content-Encoding', 'br');
            compressionEncoding = encoding;
            return true;
          }
          return false;
        });
      }
      if (res.statusCode === 200) {
        const fileStream = fs.createReadStream(filePath);
        if (compress && compressionEncoding) {
          let comp;
          if (compressionEncoding === 'gzip') {
            comp = zlib.createGzip();
          } else if (compressionEncoding === 'deflate') {
            comp = zlib.createDeflate();
          } else {
            comp = zlib.createBrotliCompress();
          }
          res.body = fileStream.pipe(comp);
        } else {
          res.body = fileStream;
        }
      }
    }
  } else {
    res.setHeader('Content-Type', 'text/html');
    res.body = '<h1>Not Found</h1>';
    res.statusCode = 404;
  }

  app.use(router.all('.*', async ({ req, res }, next) => {
    res.setHeader('Content-Type', 'text/html');
    res.body = '<h1>Not Found</h1>';
    res.statusCode = 404;
    await next();
  }));

  await next();
}));

app.listen({
  port: 8081,
  host: '0.0.0.0'
})