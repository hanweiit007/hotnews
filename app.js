App({
  globalData: {
    sites: [],
    allHotItems: [],
    isLoading: false,
    lastUpdated: null
  },

  onLaunch() {
    // 初始化数据
    this.initData();
  },

  async initData() {
    try {
      this.globalData.isLoading = true;
      // 获取所有站点数据
      const sites = await this.getSites();
      this.globalData.sites = sites;
      
      // 获取所有热点数据
      const allHotItems = await this.getAllHotItems();
      this.globalData.allHotItems = allHotItems;
      
      this.globalData.lastUpdated = new Date();
    } catch (error) {
      console.error('初始化数据失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    } finally {
      this.globalData.isLoading = false;
    }
  },

  // 获取所有站点
  async getSites() {
    // 这里可以调用云函数或API获取站点数据
    return [
      {
        id: 'zhihu',
        name: { zh: '知乎', en: 'Zhihu' },
        icon: '知',
        url: 'https://www.zhihu.com/hot'
      },
      {
        id: 'weibo',
        name: { zh: '微博', en: 'Weibo' },
        icon: '微',
        url: 'https://s.weibo.com/top/summary'
      },
      {
        id: 'baidu',
        name: { zh: '百度', en: 'Baidu' },
        icon: '百',
        url: 'https://top.baidu.com/board?tab=realtime'
      },
      {
        id: 'bilibili',
        name: { zh: 'B站', en: 'Bilibili' },
        icon: 'B',
        url: 'https://www.bilibili.com/v/popular/rank/all'
      },
      {
        id: 'douyin',
        name: { zh: '抖音', en: 'Douyin' },
        icon: '抖',
        url: 'https://www.douyin.com/hot'
      },
      {
        id: 'hupu',
        name: { zh: '虎扑', en: 'Hupu' },
        icon: '虎',
        url: 'https://bbs.hupu.com/all-gambia'
      },
      {
        id: 'douban',
        name: { zh: '豆瓣', en: 'Douban' },
        icon: '豆',
        url: 'https://www.douban.com/group/explore'
      },
      {
        id: '36kr',
        name: { zh: '36氪', en: '36Kr' },
        icon: '氪',
        url: 'https://36kr.com/information/technology'
      },
      {
        id: 'itnews',
        name: { zh: 'IT新闻', en: 'IT News' },
        icon: 'IT',
        url: 'https://www.ithome.com/'
      }
    ];
  },

  // 获取所有热点
  async getAllHotItems() {
    try {
      // 这里调用云函数获取热点数据
      const { result } = await wx.cloud.callFunction({
        name: 'getHotNews',
        data: {
          siteIds: ['zhihu', 'weibo', 'baidu', 'bilibili', 'douyin', 'hupu', 'douban', '36kr', 'itnews']
        }
      });
      return result.data || [];
    } catch (error) {
      console.error('获取热点数据失败:', error);
      return [];
    }
  },

  // 刷新数据
  async refreshData() {
    await this.initData();
  }
}); 