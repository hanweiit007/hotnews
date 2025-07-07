/**
 * MCP依赖检查器 - 用于验证MCP服务所需的依赖是否已安装
 */

// 检查MCP服务是否可用
export const checkMcpService = (): boolean => {
  const mcpExists = typeof (window as any).mcp !== 'undefined';
  const mcpHasGetHotNews = mcpExists && typeof (window as any).mcp?.get_hot_news === 'function';
  
  if (!mcpExists || !mcpHasGetHotNews) {
    console.warn('MCP服务不可用，请确保本地MCP服务正在运行');
  }
  
  return mcpExists && mcpHasGetHotNews;
};

// 生成帮助信息
export const getMcpTroubleshootingGuide = (): string[] => {
  return [
    '# MCP 服务故障排除指南',
    '',
    '## 1. 确认本地MCP服务正在运行',
    '- 确保在项目目录下运行 `npm run watch`',
    '- 检查本地服务是否在 http://localhost:3001 上运行',
    '',
    '## 2. 检查MCP配置',
    '- 确认项目根目录下存在 `.cursor/hotnews-mcp.json` 文件',
    '- 文件内容应该包含正确的MCP服务配置',
    '',
    '## 3. 检查网络连接',
    '- 确保本地MCP服务可以访问',
    '- 检查是否有防火墙阻止本地服务访问',
    '',
    '## 4. 重启服务',
    '- 停止并重新启动本地MCP服务',
    '- 刷新应用页面',
  ];
};

// 生成命令行指南
export const getMcpCommandGuide = (): string => {
  return `
# 在终端中尝试运行以下命令来启动本地MCP服务:

## 启动本地MCP服务
cd /Users/hanwei/Documents/cursor/mcp-hotnews-server-main
npm run watch

## 检查服务状态
curl http://localhost:3001/api/hotnews -X POST -H "Content-Type: application/json" -d '{"siteIds":[1]}'
  `;
};

// 导出工具函数
export default {
  checkMcpService,
  getMcpTroubleshootingGuide,
  getMcpCommandGuide,
}; 