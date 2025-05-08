/**
 * MCP依赖检查器 - 用于验证MCP服务所需的依赖是否已安装
 */

// 检查Cursor环境
export const checkCursorEnvironment = (): boolean => {
  // 检查是否在Cursor编辑器中运行
  const isCursor = !!(window as any).__CURSOR_VERSION__;
  
  if (!isCursor) {
    console.warn('应用不在Cursor编辑器环境中运行，MCP服务可能不可用');
  } else {
    console.log('检测到Cursor环境，版本:', (window as any).__CURSOR_VERSION__);
  }
  
  return isCursor;
};

// 生成帮助信息
export const getMcpTroubleshootingGuide = (): string[] => {
  return [
    '# MCP 服务故障排除指南',
    '',
    '## 1. 确认Cursor编辑器正在运行',
    '- MCP服务依赖于Cursor编辑器提供的API',
    '- 确保在Cursor编辑器预览中打开本应用',
    '',
    '## 2. 检查MCP配置',
    '- 确认项目根目录下存在 `.cursor/hotnews-mcp.json` 文件',
    '- 文件内容应该包含正确的MCP服务配置',
    '',
    '## 3. 安装MCP服务器依赖',
    '- 运行以下命令安装MCP服务器: `npm install -g @wopal/mcp-server-hotnews`',
    '- 或者使用临时方式运行: `npx -y @wopal/mcp-server-hotnews --use-real-api`',
    '',
    '## 4. 重启应用',
    '- 在安装依赖后重新启动Cursor编辑器',
    '- 刷新应用预览页面',
    '',
    '## 5. 检查网络连接',
    '- MCP服务需要网络连接来获取真实数据',
    '- 确保你的网络能够访问知乎、微博等网站',
  ];
};

// 生成命令行指南
export const getMcpCommandGuide = (): string => {
  return `
# 在终端中尝试运行以下命令来安装和测试MCP服务:

## 全局安装MCP服务
npm install -g @wopal/mcp-server-hotnews

## 或者直接运行(不安装)
npx -y @wopal/mcp-server-hotnews --use-real-api

## 检查Cursor配置
cd ${window.location.pathname.split('/').slice(0, -1).join('/')}
cat .cursor/hotnews-mcp.json
  `;
};

// 导出工具函数
export default {
  checkCursorEnvironment,
  getMcpTroubleshootingGuide,
  getMcpCommandGuide,
}; 