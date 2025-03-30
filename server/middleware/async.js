/**
 * 异步错误处理中间件
 * 用于包装异步控制器函数，避免重复try-catch代码
 * @param {Function} fn - 控制器函数
 * @returns {Function} Express中间件函数
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 