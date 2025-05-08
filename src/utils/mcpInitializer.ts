// MCP 初始化工具，用于在应用启动时手动设置 MCP 服务
import { siteMcpIdMap } from '../config/siteConfig';
import { SiteId } from '../types';

// 创建和注册 MCP 客户端
export const initMcpCheck = async (): Promise<void> => {
  return new Promise<void>((resolve) => {
    // 等待一段时间检查 MCP 客户端
    setTimeout(() => {
      const mcpExists = typeof (window as any).mcp !== 'undefined';
      const mcpHasGetHotNews = mcpExists && typeof (window as any).mcp?.get_hot_news === 'function';
      
      console.log('MCP 状态检查:', {
        mcpExists,
        mcpHasGetHotNews,
      });
      
      if (!mcpExists) {
        console.warn('MCP 客户端不存在，尝试创建测试客户端');
        tryCreateMockMcpClient();
      } else if (!mcpHasGetHotNews) {
        console.error('警告: MCP 客户端存在但缺少 get_hot_news 方法');
      } else {
        console.log('MCP 服务正常运行');
      }
      
      resolve();
    }, 1000);
  });
};

// 尝试创建基本的MCP客户端，作为Cursor MCP服务的模拟备份
const tryCreateMockMcpClient = () => {
  console.log('创建基本的测试 MCP 客户端');
  
  // 检查是否在Cursor环境中
  const isCursor = !!(window as any).__CURSOR_VERSION__;
  console.log('是否在Cursor环境中:', isCursor);
  
  try {
    // 创建一个简单的MCP客户端模拟
    const mockMcpClient = {
      // 模拟获取热点新闻的方法
      get_hot_news: async (siteIds: number[]) => {
        console.log('测试MCP客户端: 获取热点', siteIds);
        
        // 为每个请求的站点ID创建一个模拟响应
        return siteIds.map(siteId => {
          // 查找对应的站点名称
          const siteEntry = Object.entries(siteMcpIdMap)
            .find(([_, id]) => id === siteId);
          const siteName = siteEntry ? siteEntry[0] : '未知站点';
          
          return {
            items: Array(10).fill(0).map((_, index) => ({
              id: `test-${siteId}-${index}`,
              title: `测试热点 ${index + 1} (站点: ${siteName})`,
              url: `https://example.com/${siteName}/${index}`,
              hot: 10000 - index * 1000,
              time: new Date().toISOString(),
              excerpt: `这是一条测试热点数据，表示MCP服务未正确配置。请确保Cursor编辑器正在运行并已启动MCP服务。`,
              answerCount: Math.floor(Math.random() * 100),
            }))
          };
        });
      }
    };
    
    // 检查window.mcp是否已存在
    if (typeof (window as any).mcp === 'undefined') {
      (window as any).mcp = mockMcpClient;
      console.log('测试 MCP 客户端创建成功');
    }
  } catch (err) {
    console.error('创建测试 MCP 客户端失败:', err);
  }
};

export default initMcpCheck; 