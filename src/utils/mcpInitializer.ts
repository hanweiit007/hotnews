// MCP 初始化工具，用于在应用启动时手动设置 MCP 服务
import { siteMcpIdMap } from '../config/siteConfig';
import { SiteId } from '../types';

// 定义 MCP 客户端的类型
interface McpClient {
  get_hot_news: (siteIds: number[]) => Promise<any>;
}

// 创建和注册 MCP 客户端
export const initMcpCheck = async (): Promise<void> => {
  return new Promise<void>((resolve) => {
    console.log('开始初始化 MCP 客户端...');
    
    // 创建一个隐藏的 iframe 来加载 MCP 客户端
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'http://localhost:3001/mcp-client';
    
    // 添加错误处理
    iframe.onerror = (error) => {
      console.error('MCP 客户端 iframe 加载失败:', error);
      tryCreateMockMcpClient();
      resolve();
    };
    
    // 添加加载完成处理
    iframe.onload = () => {
      console.log('MCP 客户端 iframe 加载完成');
    };
    
    document.body.appendChild(iframe);
    console.log('已创建 MCP 客户端 iframe');

    // 监听 MCP 就绪消息
    const handleMessage = (event: MessageEvent) => {
      console.log('收到消息:', event.data);
      if (event.data.type === 'MCP_READY') {
        console.log('MCP 客户端已就绪');
        window.removeEventListener('message', handleMessage);
        
        // 验证 MCP 客户端是否正确注入
        const mcp = (window as any).mcp;
        if (typeof mcp === 'undefined' || typeof mcp.get_hot_news !== 'function') {
          console.error('MCP 客户端未正确注入，尝试创建备用客户端');
          tryCreateMockMcpClient();
        } else {
          console.log('MCP 客户端已成功注入');
          // 测试 MCP 客户端
          testMcpClient(mcp);
        }
        
        resolve();
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('已添加消息监听器');

    // 设置超时
    setTimeout(() => {
      console.warn('MCP 客户端加载超时，尝试创建备用客户端');
      tryCreateMockMcpClient();
      resolve();
    }, 5000);
  });
};

// 测试 MCP 客户端
const testMcpClient = async (mcp: McpClient) => {
  try {
    console.log('测试 MCP 客户端...');
    const testSiteIds = [1, 2, 3]; // 使用一些测试站点 ID
    const result = await mcp.get_hot_news(testSiteIds);
    console.log('MCP 客户端测试结果:', result);
  } catch (error) {
    console.error('MCP 客户端测试失败:', error);
  }
};

// 尝试创建基本的MCP客户端，作为Cursor MCP服务的模拟备份
const tryCreateMockMcpClient = () => {
  console.log('创建基本的测试 MCP 客户端');
  
  try {
    // 创建一个简单的MCP客户端模拟
    const mockMcpClient: McpClient = {
      // 模拟获取热点新闻的方法
      get_hot_news: async (siteIds: number[]) => {
        console.log('测试MCP客户端: 获取热点', siteIds);
        
        try {
          // 尝试调用本地 MCP 服务
          const response = await fetch('http://localhost:3001/api/hotnews', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ siteIds }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('本地 MCP 服务返回数据:', data);
          return data;
        } catch (error) {
          console.error('调用本地 MCP 服务失败:', error);
          
          // 如果本地服务调用失败，返回模拟数据
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
                excerpt: `这是一条测试热点数据，表示MCP服务未正确配置。请确保本地MCP服务正在运行。`,
                answerCount: Math.floor(Math.random() * 100),
              }))
            };
          });
        }
      }
    };

    // 将模拟客户端注入到 window 对象
    (window as any).mcp = mockMcpClient;
    console.log('MCP 模拟客户端已注入');
    
    // 测试模拟客户端
    testMcpClient(mockMcpClient);
  } catch (error) {
    console.error('创建 MCP 模拟客户端失败:', error);
  }
};

export default initMcpCheck; 