/**
 * 自定义错误响应类
 * 用于API返回统一格式的错误信息
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse; 