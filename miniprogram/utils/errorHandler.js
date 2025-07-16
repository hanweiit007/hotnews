/**
 * 错误处理工具函数
 * 用于统一处理小程序中的各种错误
 */

// 错误类型枚举
var ERROR_TYPES = {
  NETWORK: 'network',
  API: 'api',
  SYSTEM: 'system',
  USER: 'user',
  UNKNOWN: 'unknown'
};

// 错误等级枚举
var ERROR_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * 错误处理器构造函数
 */
function ErrorHandler() {
  this.errorQueue = [];
  this.maxQueueSize = 50;
}

/**
 * 处理错误
 * @param {Error|string} error - 错误对象或错误消息
 * @param {string} type - 错误类型
 * @param {string} level - 错误等级
 * @param {object} context - 错误上下文
 */
ErrorHandler.prototype.handleError = function(error, type, level, context) {
  type = type || ERROR_TYPES.UNKNOWN;
  level = level || ERROR_LEVELS.ERROR;
  context = context || {};
  
  var errorInfo = {
    message: typeof error === 'string' ? error : (error.message || '未知错误'),
    stack: error.stack || '',
    type: type,
    level: level,
    context: context,
    timestamp: new Date().toISOString(),
    page: getCurrentPages().length > 0 ? getCurrentPages()[getCurrentPages().length - 1].route : 'unknown'
  };

  // 添加到错误队列
  this.addToQueue(errorInfo);

  // 根据错误等级处理
  switch (level) {
    case ERROR_LEVELS.INFO:
      console.info('Error Info:', errorInfo);
      break;
    case ERROR_LEVELS.WARNING:
      console.warn('Error Warning:', errorInfo);
      break;
    case ERROR_LEVELS.ERROR:
      console.error('Error:', errorInfo);
      break;
    case ERROR_LEVELS.CRITICAL:
      console.error('Critical Error:', errorInfo);
      this.showCriticalError(errorInfo);
      break;
  }
};

/**
 * 添加错误到队列
 * @param {object} errorInfo - 错误信息
 */
ErrorHandler.prototype.addToQueue = function(errorInfo) {
  this.errorQueue.push(errorInfo);
  if (this.errorQueue.length > this.maxQueueSize) {
    this.errorQueue.shift();
  }
};

/**
 * 显示严重错误
 * @param {object} errorInfo - 错误信息
 */
ErrorHandler.prototype.showCriticalError = function(errorInfo) {
  wx.showModal({
    title: '系统错误',
    content: '应用遇到严重错误，请重启小程序',
    showCancel: false,
    success: function(res) {
      if (res.confirm) {
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }
    }
  });
};

/**
 * 处理网络错误
 * @param {object} error - 错误对象
 * @param {string} url - 请求URL
 * @param {object} options - 请求选项
 */
ErrorHandler.prototype.handleNetworkError = function(error, url, options) {
  options = options || {};
  var context = {
    url: url,
    method: options.method || 'GET',
    statusCode: error.statusCode || 0,
    errMsg: error.errMsg || ''
  };

  this.handleError(error, ERROR_TYPES.NETWORK, ERROR_LEVELS.ERROR, context);
};

/**
 * 处理API错误
 * @param {object} error - 错误对象
 * @param {string} apiName - API名称
 * @param {object} params - 请求参数
 */
ErrorHandler.prototype.handleApiError = function(error, apiName, params) {
  params = params || {};
  var context = {
    apiName: apiName,
    params: params,
    statusCode: error.statusCode || 0
  };

  this.handleError(error, ERROR_TYPES.API, ERROR_LEVELS.WARNING, context);
};

/**
 * 处理系统错误
 * @param {object} error - 错误对象
 * @param {string} component - 组件名称
 */
ErrorHandler.prototype.handleSystemError = function(error, component) {
  var context = {
    component: component
  };
  
  try {
    context.system = wx.getSystemInfoSync();
  } catch (e) {
    context.system = 'unable to get system info';
  }

  this.handleError(error, ERROR_TYPES.SYSTEM, ERROR_LEVELS.ERROR, context);
};

/**
 * 获取错误队列
 * @returns {array} 错误队列
 */
ErrorHandler.prototype.getErrorQueue = function() {
  return this.errorQueue;
};

/**
 * 清空错误队列
 */
ErrorHandler.prototype.clearErrorQueue = function() {
  this.errorQueue = [];
};

/**
 * 错误上报（可选实现）
 * @param {object} errorInfo - 错误信息
 */
ErrorHandler.prototype.reportError = function(errorInfo) {
  // 在这里实现错误上报逻辑
  // 例如上报到服务器或第三方错误监控服务
  console.log('报告错误:', errorInfo);
};

// 创建全局错误处理器实例
var errorHandler = new ErrorHandler();

/**
 * 工具函数：安全执行函数
 * @param {function} fn - 要执行的函数
 * @param {object} context - 执行上下文
 * @param {string} errorMessage - 错误消息
 */
function safeExecute(fn, context, errorMessage) {
  context = context || {};
  errorMessage = errorMessage || '函数执行失败';
  
  try {
    return fn();
  } catch (error) {
    errorHandler.handleError(error, ERROR_TYPES.SYSTEM, ERROR_LEVELS.ERROR, {
      context: context,
      errorMessage: errorMessage
    });
    return null;
  }
}

/**
 * 工具函数：安全的异步执行
 * @param {function} fn - 要执行的异步函数
 * @param {object} context - 执行上下文
 * @param {string} errorMessage - 错误消息
 */
function safeAsyncExecute(fn, context, errorMessage) {
  context = context || {};
  errorMessage = errorMessage || '异步函数执行失败';
  
  return new Promise(function(resolve, reject) {
    try {
      Promise.resolve(fn()).then(resolve).catch(function(error) {
        errorHandler.handleError(error, ERROR_TYPES.SYSTEM, ERROR_LEVELS.ERROR, {
          context: context,
          errorMessage: errorMessage
        });
        resolve(null);
      });
    } catch (error) {
      errorHandler.handleError(error, ERROR_TYPES.SYSTEM, ERROR_LEVELS.ERROR, {
        context: context,
        errorMessage: errorMessage
      });
      resolve(null);
    }
  });
}

// 重写console.error以捕获更多错误
var originalConsoleError = console.error;
console.error = function() {
  var args = Array.prototype.slice.call(arguments);
  
  // 调用原始的console.error
  originalConsoleError.apply(console, args);
  
  // 处理错误
  if (args.length > 0) {
    var errorMessage = args.join(' ');
    errorHandler.handleError(errorMessage, ERROR_TYPES.SYSTEM, ERROR_LEVELS.ERROR, {
      consoleError: true,
      args: args
    });
  }
};

module.exports = {
  errorHandler: errorHandler,
  ERROR_TYPES: ERROR_TYPES,
  ERROR_LEVELS: ERROR_LEVELS,
  safeExecute: safeExecute,
  safeAsyncExecute: safeAsyncExecute
};