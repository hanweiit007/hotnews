import { SiteId } from '../types';

// 网站ID与MCP ID的映射关系
export const siteMcpIdMap: Record<SiteId, number> = {
  'zhihu': 1,    // 知乎热榜
  '36kr': 2,     // 36氪热榜
  'baidu': 3,    // 百度热点
  'bilibili': 4, // B站热榜
  'weibo': 5,    // 微博热搜
  'douyin': 6,   // 抖音热点
  'hupu': 7,     // 虎扑热榜
  'douban': 8,   // 豆瓣热榜
  'itnews': 9,   // IT新闻
};

// 网站数据结构映射
export const siteDataMap = {
  // 知乎数据结构映射
  zhihu: {
    titleField: 'title', 
    urlField: 'url',
    hotField: 'hot',
    summaryField: 'excerpt',
    answerCountField: 'answerCount',
  },
  // 后续可以添加其他网站的数据结构映射
};

export default {
  siteMcpIdMap,
  siteDataMap,
}; 