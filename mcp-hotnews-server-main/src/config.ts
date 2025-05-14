interface SiteConfig {
  apiUrl: string
  name: string
}

export const SITE_CONFIGS: Record<string, SiteConfig> = {
  'zhihu': {
    apiUrl: 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50',
    name: '知乎热榜'
  },
  'weibo': {
    apiUrl: 'https://weibo.com/ajax/side/hotSearch',
    name: '微博热搜'
  },
  'baidu': {
    apiUrl: 'https://top.baidu.com/api/board?tab=realtime',
    name: '百度热点'
  },
  'bilibili': {
    apiUrl: 'https://api.bilibili.com/x/web-interface/popular?ps=50',
    name: 'B站热榜'
  },
  'douyin': {
    apiUrl: 'https://www.douyin.com/aweme/v1/web/hot/search/list/',
    name: '抖音热点'
  },
  'hupu': {
    apiUrl: 'https://bbs.hupu.com/api/hot',
    name: '虎扑热榜'
  },
  'douban': {
    apiUrl: 'https://www.douban.com/group/explore',
    name: '豆瓣热榜'
  },
  '36kr': {
    apiUrl: 'https://36kr.com/api/newsflash',
    name: '36氪热榜'
  },
  'itnews': {
    apiUrl: 'https://www.ithome.com/json/newsflash/newsflash.json',
    name: 'IT新闻'
  }
} 