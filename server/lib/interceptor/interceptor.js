class Interceptor {
  constructor() {
    this.aspects = []; // 拦截切面
  }

  /**
   * 注册拦截切面
   * @param functor 切面
   */
  use(functor) {
    this.aspects.push(functor);
    return this;
  }

  /**
   * 执行拦截切面
   * @param context 切面上下文
   */
  async run(context) {
    const aspects = this.aspects;

    const proc = aspects.reduceRight((a, b) => {
      return async () => {
        await b(context, a);
      };
    }, () => Promise.resolve());

    try {
      await proc();
    } catch (e) {
      console.error(e);
    }

    return context;
  }
}

module.exports = Interceptor;