/**
 * 环境配置文件
 * 用于管理不同版本的功能开关和配置
 */

// 当前环境类型
const ENV_TYPE = {
  DEVELOPMENT: 'development',    // 开发环境
  AUDIT: 'audit',               // 审核版本（功能受限）
  PRODUCTION: 'production',     // 生产版本（完整功能）
  WEBVIEW_ONLY: 'webview_only'  // 纯webview版本（完全无抓取）
};

// 当前环境（发布前手动修改此配置）
const CURRENT_ENV = ENV_TYPE.WEBVIEW_ONLY;

// 环境配置
const ENV_CONFIG = {
  [ENV_TYPE.DEVELOPMENT]: {
    // 开发环境配置
    mcpBaseUrl: 'http://localhost:9000',
    enableProxy: true,
    enableDirectWebview: true,
    enablePlatformJump: true,
    showDebugInfo: true,
    requestTimeout: 15000,
    features: {
      richText: true,
      proxyWebview: true,
      directWebview: true,
      platformJump: true,
      contentCopy: true,
      errorDetails: true
    }
  },
  
  [ENV_TYPE.AUDIT]: {
    // 审核版本配置（功能受限）
    mcpBaseUrl: 'https://1367911501-h3462r582a.ap-beijing.tencentscf.com',
    enableProxy: false,           // 关闭代理功能
    enableDirectWebview: false,   // 关闭直接webview
    enablePlatformJump: false,    // 关闭平台跳转
    showDebugInfo: false,
    requestTimeout: 20000,        // 增加到20秒，云函数冷启动需要更长时间
    features: {
      richText: true,             // 只保留富文本模式
      proxyWebview: false,
      directWebview: false,
      platformJump: false,
      contentCopy: true,
      errorDetails: false         // 隐藏详细错误信息
    }
  },
  
  [ENV_TYPE.PRODUCTION]: {
    // 生产版本配置（完整功能）
    mcpBaseUrl: 'https://1367911501-h3462r582a.ap-beijing.tencentscf.com',
    enableProxy: true,
    enableDirectWebview: true,
    enablePlatformJump: true,
    showDebugInfo: false,
    requestTimeout: 15000,
    features: {
      richText: true,
      proxyWebview: true,
      directWebview: true,
      platformJump: true,
      contentCopy: true,
      errorDetails: false
    }
  },

  [ENV_TYPE.WEBVIEW_ONLY]: {
    // 纯webview版本配置（仅webview展示，不爬取内容）
    mcpBaseUrl: 'https://1367911501-h3462r582a.ap-beijing.tencentscf.com',
    enableProxy: false,           // 关闭所有代理功能
    enableDirectWebview: true,    // 仅保留直接webview
    enablePlatformJump: true,     // 保留平台跳转功能
    showDebugInfo: false,
    requestTimeout: 15000,        // 恢复请求超时，需要获取热点列表
    webviewOnly: true,            // 标识这是纯webview模式
    features: {
      richText: false,            // 关闭富文本模式
      proxyWebview: false,        // 关闭代理webview模式
      directWebview: true,        // 仅保留直接webview模式
      platformJump: true,         // 保留平台跳转
      contentCopy: true,          // 保留复制链接功能
      errorDetails: false,        // 隐藏错误详情
      hotList: true,              // 启用热点列表功能
      contentCrawl: false         // 新增：关闭内容爬取功能
    }
  }
};

// 获取当前环境配置
function getCurrentConfig() {
  return ENV_CONFIG[CURRENT_ENV];
}

// 检查功能是否启用
function isFeatureEnabled(featureName) {
  const config = getCurrentConfig();
  return config.features[featureName] || false;
}

// 获取当前环境类型
function getCurrentEnv() {
  return CURRENT_ENV;
}

// 是否为审核版本
function isAuditVersion() {
  return CURRENT_ENV === ENV_TYPE.AUDIT;
}

// 是否为生产版本
function isProductionVersion() {
  return CURRENT_ENV === ENV_TYPE.PRODUCTION;
}

// 是否为开发版本
function isDevelopmentVersion() {
  return CURRENT_ENV === ENV_TYPE.DEVELOPMENT;
}

// 是否为纯webview版本
function isWebviewOnlyVersion() {
  return CURRENT_ENV === ENV_TYPE.WEBVIEW_ONLY;
}

module.exports = {
  ENV_TYPE,
  getCurrentConfig,
  isFeatureEnabled,
  getCurrentEnv,
  isAuditVersion,
  isProductionVersion,
  isDevelopmentVersion,
  isWebviewOnlyVersion
};