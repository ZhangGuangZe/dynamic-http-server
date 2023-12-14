const url = require('url');
const path = require('path');

/**
 * 检查路径与路由规则是否匹配
 * @param {*} rule 路由规则
 * @param {*} pathname 路径名
 */
function check(rule, pathname) {
  rule = rule.replace(/\\/g, '/'); // Windows 系统需要将规则中的 \ 替换为 /
  /*
    解析规则，比如：/test/:course/:lecture
    paraMatched = ['/test/:course/:lecture', ':course', ':lecture']
  */
  const paraMatched = rule.match(/:[^/]+/g); // 匹配动态路由
  const ruleExp = new RegExp(`^${rule.replace(/:[^/]+/g, '([^/]+)')}$`);

  /*
    解析真正的路径，比如：/test/123/abc
    ruleMatched = ['/test/123/abs', '123', 'abs']
  */
  const ruleMatched = pathname.match(ruleExp);
  /*
   将规则和路径拼接为对象：
   ret = {course: 123, lecture: abc}
 */
  if (ruleMatched) {
    const ret = {};
    if (paraMatched) {
      for (let i = 0; i < paraMatched.length; i++) {
        ret[paraMatched[i].slice(1)] = ruleMatched[i + 1];
      }
    }
    return ret;
  }
  return null;
}

/**
 * 将切面添加到拦截器中
 * @param {*} method 请求方法
 * @param {*} rule 路由规则
 * @param {*} aspect 拦截函数
 */
function route(method, rule, aspect) {
  return async (ctx, next) => {
    const req = ctx.req;
    if (!ctx.url) ctx.url = url.parse(`http://${req.headers.host}${req.url}`);
    const checked = check(rule, ctx.url.pathname);
    // 如果命中规则，则返回解析后的规则对象，并将其写入 ctx.route 对象中，然后调用拦截函数
    if (!ctx.route && (method === '*' || req.method === method) && !!checked) {
      ctx.route = checked;
      await aspect(ctx, next);
    } else { // 如果没有命中规则，则跳过当前拦截切面，执行下一个拦截切面
      await next();
    }
  };
}

class Router {
  constructor(base = '') {
    this.baseURL = base;
  }

  get(rule, aspect) {
    return route('GET', path.join(this.baseURL, rule), aspect);
  }

  post(rule, aspect) {
    return route('POST', path.join(this.baseURL, rule), aspect);
  }

  put(rule, aspect) {
    return route('PUT', path.join(this.baseURL, rule), aspect);
  }

  delete(rule, aspect) {
    return route('DELETE', path.join(this.baseURL, rule), aspect);
  }

  all(rule, aspect) {
    return route('*', path.join(this.baseURL, rule), aspect);
  }
}

module.exports = Router;