import { HotItem, Site, SiteId } from '../types';
import { siteMcpIdMap } from '../config/siteConfig';
import { data } from 'react-router-dom';

// 从MCP获取热搜数据
export const fetchHotNews = async (siteIds: number[]): Promise<any> => {
  try {
    // 添加调试信息
    console.log('开始尝试获取热点数据，请求站点IDs:', siteIds);
    
    // 检查 MCP 客户端是否存在
    const mcp = (window as any).mcp;
    console.log('MCP服务状态检查 - window.mcp存在:', typeof mcp !== 'undefined');
    
    if (typeof mcp === 'undefined' || typeof mcp.get_hot_news !== 'function') {
      console.error('MCP服务不可用，请确保MCP服务正确配置和运行');
      console.error('当前window.mcp对象:', mcp);
      throw new Error('MCP service is not available');
    }
    
    // 使用 MCP 客户端获取数据
    console.log('使用 MCP 服务获取数据...');
    const response = await mcp.get_hot_news(siteIds);
    console.log('MCP 返回数据:', response);
    
    // 检查返回的数据结构
    if (!response || !Array.isArray(response)) {
      console.error('MCP返回数据格式不正确:', response);
      throw new Error('Invalid response from MCP service');
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching hot news:', error);
    throw error;
  }
};

// 将MCP返回的数据转换为应用内部的HotItem格式
const convertToHotItem = (item: any, siteId: SiteId): HotItem => {
  // 添加调试信息
  console.log('Converting item for site:', siteId, item);
  
  // 生成唯一ID
  const generateUniqueId = (item: any, siteId: SiteId): string => {
    const baseId = item.id || item.title || item.url;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${siteId}-${baseId}-${timestamp}-${random}`;
  };
  
  // 根据不同网站有不同的转换逻辑
  switch (siteId) {
    case 'zhihu':
      return {
        id: generateUniqueId(item, siteId),
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
        id: generateUniqueId(item, siteId),
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
        id: generateUniqueId(item, siteId),
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
        id: generateUniqueId(item, siteId),
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

// 添加缓存对象
const dataCache: Record<string, {
  data: any[];
  timestamp: number;
}> = {};

// 缓存过期时间（5分钟）
const CACHE_EXPIRY = 5 * 60 * 1000;

// 获取所有网站的热点
export const getAllHotItems = async (limitPerSite: number = 10): Promise<HotItem[]> => {
  try {
    console.log('开始获取所有网站的热点数据...');
    
    // 获取所有平台的数据
    const siteIds = [
      siteMcpIdMap.zhihu,    // 知乎
      siteMcpIdMap.weibo,    // 微博
      siteMcpIdMap.baidu,    // 百度
      siteMcpIdMap.bilibili, // B站
      siteMcpIdMap.douyin,   // 抖音
      siteMcpIdMap.hupu,     // 虎扑
      siteMcpIdMap.douban,   // 豆瓣
      siteMcpIdMap['36kr'],  // 36氪
      siteMcpIdMap.itnews    // IT新闻
    ];
    
    console.log('请求的站点IDs:', siteIds);
    const response = await fetchHotNews(siteIds);
    console.log('获取到的原始数据:', response);
    
    const allItems: HotItem[] = [];
    
    // 处理每个站点的数据
    response.forEach((siteResponse: any, index: number) => {
      if (siteResponse?.data) {
        const siteId = Object.keys(siteMcpIdMap).find(
          key => siteMcpIdMap[key as SiteId] === siteIds[index]
        ) as SiteId;
        
        console.log(`处理${siteDisplayNames[siteId]}数据...`);
        const siteItems = siteResponse.data
          .slice(0, limitPerSite)
          .map((item: any) => convertToHotItem(item, siteId));
        console.log(`${siteDisplayNames[siteId]}数据转换结果:`, siteItems);
        allItems.push(...siteItems);
      }
    });
    
    console.log('所有站点数据获取完成，总数:', allItems.length);
    return allItems;
  } catch (error) {
    console.error('获取热点数据失败:', error);
    throw error;
  }
};

// 获取特定网站的热点
export const getSiteHotItems = async (siteId: SiteId, limit: number = 10): Promise<HotItem[]> => {
  try {
    console.log(`开始获取站点 ${siteId} 的热点数据...`);
    
    // 检查站点ID是否有效
    if (!siteMcpIdMap[siteId]) {
      console.error(`未知的站点ID: ${siteId}`);
      return [];
    }
    
    // 获取特定站点的MCP ID
    const mcpId = siteMcpIdMap[siteId];
    console.log(`站点 ${siteId} 的MCP ID:`, mcpId);
    
    // 检查缓存
    const cacheKey = `site_${siteId}`;
    const cachedData = dataCache[cacheKey];
    const now = Date.now();
    
    let items: any[] = [];
    
    // 如果缓存存在且未过期，使用缓存数据
    if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRY) {
      console.log('使用缓存数据');
      items = cachedData.data;
    } else {
      // 缓存不存在或已过期，重新获取数据
      console.log('缓存不存在或已过期，重新获取数据');
      const response = await fetchHotNews([mcpId]);
      
      if (!response || !response[0] || !response[0].data) {
        console.error(`未能获取站点 ${siteId} 的数据`);
        return [];
      }
      
      items = response[0].data || [];
      
      // 更新缓存
      dataCache[cacheKey] = {
        data: items,
        timestamp: now
      };
    }
    
    // 只取前limit个
    const limitedItems = items.slice(0, limit);
    
    // 转换为HotItem格式
    const convertedItems = limitedItems.map((item: any) => convertToHotItem(item, siteId));
    console.log(`站点 ${siteId} 的转换后项目数:`, convertedItems.length);
    
    return convertedItems;
  } catch (error) {
    console.error(`Error getting hot items for site ${siteId}:`, error);
    return [];
  }
};

// 获取特定热点的详情
export const getHotItemDetails = async (itemId: string): Promise<HotItem | null> => {
  try {
    console.log(`开始获取热点 ${itemId} 的详情...`);
    
    // 解析itemId，格式为: {siteId}-{id}
    const [siteId, id] = itemId.split('-');
    console.log('解析的站点ID和项目ID:', { siteId, id });
    
    // 确保siteId有效
    if (!siteId || !Object.keys(siteMcpIdMap).includes(siteId as SiteId)) {
      console.error(`无效的站点ID: ${siteId}`);
      return null;
    }
    
    // 获取特定站点的MCP ID
    const mcpId = siteMcpIdMap[siteId as SiteId];
    
    // 检查缓存
    const cacheKey = `site_${siteId}`;
    const cachedData = dataCache[cacheKey];
    const now = Date.now();
    
    let items: any[] = [];
    
    // 如果缓存存在且未过期，使用缓存数据
    if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRY) {
      console.log('使用缓存数据获取详情');
      items = cachedData.data;
    } else {
      // 缓存不存在或已过期，重新获取数据
      console.log('缓存不存在或已过期，重新获取数据');
      const response = await fetchHotNews([mcpId]);
      
      if (!response || !response[0] || !response[0].data) {
        console.error(`未能获取站点 ${siteId} 的数据`);
        return null;
      }
      
      items = response[0].data || [];
      
      // 更新缓存
      dataCache[cacheKey] = {
        data: items,
        timestamp: now
      };
    }
    
    // 查找对应ID的项目
    const item = items.find((item: any) => {
      // 尝试多种可能的ID匹配方式
      const possibleIds = [
        `${siteId}-${item.id}`,
        `${siteId}-${item.title}`,
        `${siteId}-${item.index}`,
        `${siteId}-${item.url}`
      ];
      return possibleIds.includes(itemId);
    });
    
    if (item) {
      // 转换为基础HotItem格式
      const convertedItem = convertToHotItem(item, siteId as SiteId);
      
      // 添加更多详情信息
      const enhancedItem: HotItem = {
        ...convertedItem,
        metadata: {
          ...convertedItem.metadata,
          // 添加原始数据中的其他字段
          rawData: {
            index: item.index,
            hot: item.hot,
            updateTime: item.update_time,
            // 如果有其他有用的字段，也可以添加到这里
          }
        }
      };
      
      console.log('转换后的项目详情:', enhancedItem);
      return enhancedItem;
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
    icon: '知',
    url: 'https://www.zhihu.com/hot',
  },
  {
    id: 'weibo',
    name: {
      en: 'Weibo',
      zh: '微博',
    },
    icon: '微',
    url: 'https://s.weibo.com/top/summary',
  },
  {
    id: 'baidu',
    name: {
      en: 'Baidu',
      zh: '百度',
    },
    icon: '百',
    url: 'https://top.baidu.com/board?tab=realtime',
  },
  {
    id: 'bilibili',
    name: {
      en: 'Bilibili',
      zh: 'B站',
    },
    icon: 'B',
    url: 'https://www.bilibili.com/v/popular/rank/all',
  },
  {
    id: 'douyin',
    name: {
      en: 'Douyin',
      zh: '抖音',
    },
    icon: '抖',
    url: 'https://www.douyin.com/hot',
  },
  {
    id: 'hupu',
    name: {
      en: 'Hupu',
      zh: '虎扑',
    },
    icon: '虎',
    url: 'https://bbs.hupu.com/all-gambia',
  },
  {
    id: 'douban',
    name: {
      en: 'Douban',
      zh: '豆瓣',
    },
    icon: '豆',
    url: 'https://www.douban.com/group/explore',
  },
  {
    id: '36kr',
    name: {
      en: '36Kr',
      zh: '36氪',
    },
    icon: '氪',
    url: 'https://36kr.com/information/technology',
  },
  {
    id: 'itnews',
    name: {
      en: 'IT News',
      zh: 'IT新闻',
    },
    icon: 'IT',
    url: 'https://www.ithome.com/',
  }
];

export { sites };

const apiService = {
  getSites: () => Promise.resolve(sites),
  getAllHotItems,
  getSiteHotItems,
  getHotItemDetails,
};

export default apiService; 