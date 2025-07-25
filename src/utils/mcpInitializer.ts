// MCP 初始化工具，用于在应用启动时手动设置 MCP 服务
import { siteMcpIdMap } from '../config/siteConfig';
import { SiteId } from '../types';

// 定义 MCP 客户端的类型
interface McpClient {
  get_hot_news: (siteIds: number[]) => Promise<any>;
}

// 测试 MCP 服务是否可用
const testMcpService = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3001/api/sources', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.warn('MCP服务不可用:', error);
    return false;
  }
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

// 创建真实的MCP客户端
const createRealMcpClient = () => {
  (window as any).mcp = {
    get_hot_news: async (siteIds: number[]) => {
      try {
        const response = await fetch('http://localhost:3001/api/hotnews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'http://localhost:3000/'
          },
          body: JSON.stringify({ sources: siteIds }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('MCP客户端错误:', error);
        throw error;
      }
    }
  };
};

// 创建基本的测试MCP客户端（用于开发环境）
const createMockMcpClient = () => {
  (window as any).mcp = {
    get_hot_news: async (siteIds: number[]) => {
      try {
        const response = await fetch('http://localhost:3001/api/hotnews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sources: siteIds }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Mock MCP客户端错误:', error);
        throw error;
      }
    }
  };
};

// 初始化MCP客户端
const initMcpClient = async (): Promise<void> => {
  try {
    // 检查MCP服务是否可用
    const isServiceAvailable = await testMcpService();
    
    if (isServiceAvailable) {
      console.log('MCP服务可用，创建真实客户端');
      createRealMcpClient();
    } else {
      console.warn('MCP服务不可用，使用模拟客户端');
      createMockMcpClient();
    }
  } catch (error) {
    console.warn('无法初始化MCP客户端，使用模拟客户端:', error);
    createMockMcpClient();
  }
};

export default initMcpClient;