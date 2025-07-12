// 站点配置文件
module.exports = {
  // 站点ID与MCP ID的映射关系
  siteMcpIdMap: {
    'zhihu': 1,    // 知乎热榜
    '36kr': 2,     // 36氪热榜
    'baidu': 3,    // 百度热点
    'bilibili': 4, // B站热榜
    'weibo': 5,    // 微博热搜
    'douyin': 6,   // 抖音热点
    'hupu': 7,     // 虎扑热榜
    'douban': 8,   // 豆瓣热榜
    'itnews': 9    // IT新闻
  },

  // 站点基本信息
  sites: [
    {
      id: 'zhihu',
      name: '知乎',
      icon: '知',
      url: 'https://www.zhihu.com/hot',
      weight: 1.2
    },
    {
      id: 'weibo',
      name: '微博',
      icon: '微',
      url: 'https://s.weibo.com/top/summary',
      weight: 1.1
    },
    {
      id: 'baidu',
      name: '百度',
      icon: '百',
      url: 'https://top.baidu.com/board?tab=realtime',
      weight: 1.0
    },
    {
      id: 'bilibili',
      name: 'B站',
      icon: 'B',
      url: 'https://www.bilibili.com/v/popular/rank/all',
      weight: 0.9
    },
    {
      id: 'douyin',
      name: '抖音',
      icon: '抖',
      url: 'https://www.douyin.com/hot',
      weight: 0.8
    },
    {
      id: 'hupu',
      name: '虎扑',
      icon: '虎',
      url: 'https://bbs.hupu.com/all-gambia',
      weight: 0.7
    },
    {
      id: 'douban',
      name: '豆瓣',
      icon: '豆',
      url: 'https://www.douban.com/group/explore',
      weight: 0.6
    },
    {
      id: '36kr',
      name: '36氪',
      icon: '氪',
      url: 'https://36kr.com/information/technology',
      weight: 0.8
    },
    {
      id: 'itnews',
      name: 'IT新闻',
      icon: 'IT',
      url: 'https://www.ithome.com/',
      weight: 0.7
    }
  ]
};