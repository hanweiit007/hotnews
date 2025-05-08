import { HotItem, Site, SiteId } from '../types';
import { siteMcpIdMap } from '../config/siteConfig';

// 从MCP获取热搜数据
export const fetchHotNews = async (siteIds: number[]): Promise<any> => {
  try {
    // 添加调试信息
    console.log('开始尝试获取热点数据，请求站点IDs:', siteIds);
    // @ts-ignore - 忽略类型检查，因为 mcp 是在运行时添加到 window 对象的
    console.log('MCP服务状态检查 - window.mcp存在:', typeof window.mcp !== 'undefined');
    
    // 添加延迟，确保 MCP 客户端有时间初始化
    // 延迟 500ms 后再尝试使用 MCP 服务 (增加延迟时间)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 再次检查MCP服务状态
    // @ts-ignore - 忽略类型检查
    console.log('延迟后MCP服务状态:', typeof window.mcp !== 'undefined');
    // @ts-ignore - 忽略类型检查
    if (typeof window.mcp !== 'undefined') {
      // @ts-ignore - 忽略类型检查
      console.log('可用的MCP方法:', Object.keys(window.mcp));
    }
    
    // 首先检查 window.mcp 是否存在
    // @ts-ignore - 忽略 window.mcp 类型检查
    if (typeof window.mcp === 'undefined' || typeof window.mcp?.get_hot_news !== 'function') {
      console.error('MCP服务不可用，请确保MCP服务正确配置和运行');
      // @ts-ignore - 忽略类型检查
      console.error('当前window.mcp对象:', window.mcp);
      throw new Error('MCP service is not available');
    }
    
    // 使用 window.mcp 调用 MCP 服务
    console.log('使用 MCP 服务获取数据...');
    // @ts-ignore - 使用 window.mcp 调用 MCP 服务
    const response = await window.mcp.get_hot_news(siteIds);
    console.log('MCP 返回数据:', response);
    
    // 检查返回的数据结构
    if (!response || !Array.isArray(response) || response.length === 0) {
      console.error('MCP返回数据格式不正确:', response);
      throw new Error('Invalid response from MCP service');
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching hot news:', error);
    throw error; // 将错误向上传播，不再使用模拟数据
  }
};

// 将MCP返回的数据转换为应用内部的HotItem格式
const convertToHotItem = (item: any, siteId: SiteId): HotItem => {
  // 根据不同网站有不同的转换逻辑
  switch (siteId) {
    case 'zhihu':
      return {
        id: `zhihu-${item.id || Date.now()}`,
        title: item.title || '',
        url: item.url || '',
        source: '知乎热榜',
        sourceId: 'zhihu',
        heatIndex: item.hot || 0,
        publishTime: item.time || new Date().toISOString(),
        summary: item.excerpt || '',
        metadata: {
          answerCount: item.answerCount || 0,
        }
      };
    case 'weibo':
      return {
        id: `weibo-${item.id || Date.now()}`,
        title: item.title || '',
        url: item.url || '',
        source: '微博热搜',
        sourceId: 'weibo',
        heatIndex: item.hot || 0,
        publishTime: item.time || new Date().toISOString(),
        summary: item.content || '',
        metadata: {
          type: item.type || 'hot',
          searchIndex: item.searchIndex || 0
        }
      };
    case 'baidu':
      return {
        id: `baidu-${item.id || Date.now()}`,
        title: item.title || '',
        url: item.url || '',
        source: '百度热点',
        sourceId: 'baidu',
        heatIndex: item.hot || 0,
        publishTime: item.time || new Date().toISOString(),
        summary: item.desc || '',
      };
    // 其他网站的转换逻辑可以后续添加
    default:
      return {
        id: `${siteId}-${item.id || Date.now()}`,
        title: item.title || '',
        url: item.url || '',
        source: item.source || siteDisplayNames[siteId as SiteId] || siteId,
        sourceId: siteId,
        heatIndex: item.hot || 0,
        publishTime: item.time || new Date().toISOString(),
      };
  }
};

// 网站显示名称映射
const siteDisplayNames: Record<SiteId, string> = {
  'zhihu': '知乎热榜',
  'weibo': '微博热搜',
  'baidu': '百度热点',
  '36kr': '36氪热榜',
  'bilibili': 'B站热榜',
  'douyin': '抖音热点',
  'hupu': '虎扑热榜',
  'douban': '豆瓣热榜',
  'itnews': 'IT新闻'
};

// 获取所有网站的热点
export const getAllHotItems = async (limitPerSite: number = 3): Promise<HotItem[]> => {
  try {
    // 获取多个平台的数据，这里我们添加了知乎(1)、微博(5)和百度(3)
    const response = await fetchHotNews([
      siteMcpIdMap.zhihu,  // 知乎
      siteMcpIdMap.weibo,  // 微博
      siteMcpIdMap.baidu   // 百度
    ]);
    
    const allItems: HotItem[] = [];
    
    // 处理知乎数据
    if (response[0]?.items) {
      const zhihuItems = response[0].items.slice(0, limitPerSite)
        .map((item: any) => convertToHotItem(item, 'zhihu'));
      allItems.push(...zhihuItems);
    }
    
    // 处理微博数据
    if (response[1]?.items) {
      const weiboItems = response[1].items.slice(0, limitPerSite)
        .map((item: any) => convertToHotItem(item, 'weibo'));
      allItems.push(...weiboItems);
    }
    
    // 处理百度数据
    if (response[2]?.items) {
      const baiduItems = response[2].items.slice(0, limitPerSite)
        .map((item: any) => convertToHotItem(item, 'baidu'));
      allItems.push(...baiduItems);
    }
    
    return allItems;
  } catch (error) {
    console.error('Error getting all hot items:', error);
    return [];
  }
};

// 获取特定网站的热点
export const getSiteHotItems = async (siteId: SiteId, limit: number = 10): Promise<HotItem[]> => {
  try {
    // 检查站点ID是否有效
    if (!siteMcpIdMap[siteId]) {
      console.error(`未知的站点ID: ${siteId}`);
      return [];
    }
    
    // 获取特定站点的MCP ID
    const mcpId = siteMcpIdMap[siteId];
    
    // 调用MCP服务获取数据
    const response = await fetchHotNews([mcpId]);
    
    // 检查返回数据
    if (!response || !response[0] || !response[0].items) {
      console.error(`未能获取站点 ${siteId} 的数据`);
      return [];
    }
    
    // 获取特定站点的数据
    const items = response[0].items || [];
    
    // 只取前limit个
    const limitedItems = items.slice(0, limit);
    
    // 转换为HotItem格式
    return limitedItems.map((item: any) => convertToHotItem(item, siteId));
  } catch (error) {
    console.error(`Error getting hot items for site ${siteId}:`, error);
    return [];
  }
};

// 获取特定热点的详情
export const getHotItemDetails = async (itemId: string): Promise<HotItem | null> => {
  try {
    // 解析itemId，格式为: {siteId}-{id}
    const [siteId, id] = itemId.split('-');
    
    // 确保siteId有效
    if (!siteId || !Object.keys(siteMcpIdMap).includes(siteId as SiteId)) {
      console.error(`无效的站点ID: ${siteId}`);
      return null;
    }
    
    // 获取特定站点的MCP ID
    const mcpId = siteMcpIdMap[siteId as SiteId];
    
    // 为了获取详情，需要重新获取全部数据
    const response = await fetchHotNews([mcpId]);
    
    // 检查返回数据
    if (!response || !response[0] || !response[0].items) {
      console.error(`未能获取站点 ${siteId} 的数据`);
      return null;
    }
    
    // 获取站点数据
    const items = response[0].items || [];
    
    // 查找对应ID的项目
    const item = items.find((item: any) => `${siteId}-${item.id}` === itemId);
    
    if (item) {
      return convertToHotItem(item, siteId as SiteId);
    }
    
    console.error(`未找到ID为 ${itemId} 的项目`);
    return null;
  } catch (error) {
    console.error(`Error getting details for item ${itemId}:`, error);
    return null;
  }
};

// 不再从mockData导出sites
const sites: Site[] = [
  {
    id: 'zhihu',
    name: {
      en: 'Zhihu',
      zh: '知乎',
    },
    icon: '/icons/zhihu.png', 
    url: 'https://www.zhihu.com/hot',
  },
  {
    id: 'weibo',
    name: {
      en: 'Weibo',
      zh: '微博',
    },
    icon: '/icons/weibo.png',
    url: 'https://s.weibo.com/top/summary',
  },
  {
    id: 'baidu',
    name: {
      en: 'Baidu',
      zh: '百度',
    },
    icon: '/icons/baidu.png',
    url: 'https://top.baidu.com/board?tab=realtime',
  }
  // 其他平台可以根据需要添加
];

export { sites };

const apiService = {
  getSites: () => Promise.resolve(sites),
  getAllHotItems,
  getSiteHotItems,
  getHotItemDetails,
};

export default apiService; 