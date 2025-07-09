App({
  globalData: {
    sites: [],
    allHotItems: [],
    isLoading: false,
    lastUpdated: null,
    // mcpBaseUrl: 'http://localhost:9000', // 本地开发环境地址
    // mcpBaseUrl: 'http://49.232.145.233:3001 ', // pm2部署地址
    mcpBaseUrl: 'https://1367911501-h3462r582a.ap-beijing.tencentscf.com', // 腾讯云函数
    settings: {
      itemsPerSite: 50,
      pinnedSites: [],
      siteOrder: []
    },
    userInfo: null,
    StatusBar: null,
    Custom: null,
    CustomBar: null
  },

  // 网站ID与MCP ID的映射关系
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

  // 站点名称映射
  siteNameMap: {
    'zhihu': '知乎',
    'weibo': '微博',
    'baidu': '百度',
    'bilibili': 'B站',
    'douyin': '抖音',
    'hupu': '虎扑',
    'douban': '豆瓣',
    '36kr': '36氪',
    'itnews': 'IT新闻'
  },

  // 获取站点名称
  getSiteName: function(siteId) {
    return this.siteNameMap[siteId] || siteId;
  },

  onLaunch: function() {
    // 获取系统信息
    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight
        let capsule = wx.getMenuButtonBoundingClientRect()
        if (capsule) {
          this.globalData.Custom = capsule
          this.globalData.CustomBar = capsule.bottom + capsule.top - e.statusBarHeight
        } else {
          this.globalData.CustomBar = e.statusBarHeight + 50
        }
      }
    })

    // 从本地存储加载设置
    var settings = wx.getStorageSync('settings')
    if (settings) {
      // 确保所有必要的设置字段都存在
      this.globalData.settings = {
        itemsPerSite: settings.itemsPerSite || 50,
        pinnedSites: settings.pinnedSites || [],
        siteOrder: settings.siteOrder || []
      }
    }

    // 初始化数据
    this.initData();
  },

  // 加载设置
  loadSettings: function() {
    try {
      const settings = wx.getStorageSync('settings');
      if (settings) {
        this.globalData.settings = JSON.parse(settings);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },

  // 保存设置
  saveSettings: function(settings) {
    // 合并现有设置和新设置
    var currentSettings = this.globalData.settings || {}
    var newSettings = {
      ...currentSettings,
      ...settings,
      // 确保这些字段始终存在
      recommendedItemsPerSite: settings.recommendedItemsPerSite || 3,
      siteItemsPerSite: settings.siteItemsPerSite || 10,
      autoRefresh: settings.autoRefresh !== undefined ? settings.autoRefresh : true,
      darkMode: settings.darkMode !== undefined ? settings.darkMode : false
    }
    
    this.globalData.settings = newSettings
    wx.setStorageSync('settings', newSettings)
  },

  initData: function() {
    const that = this;
    this.globalData.isLoading = true;
    
    // 获取所有站点数据
    this.getSites()
      .then(function(sites) {
        that.globalData.sites = sites;
        // 获取所有热点数据
        return that.getAllHotItems();
      })
      .then(function(allHotItems) {
        that.globalData.allHotItems = allHotItems;
        that.globalData.lastUpdated = new Date();
      })
      .catch(function(error) {
        console.error('初始化数据失败:', error);
        // 显示错误提示
        wx.showToast({
          title: '数据加载失败，请检查网络连接',
          icon: 'none',
          duration: 2000
        });
        // 3秒后自动重试
        setTimeout(function() {
          that.initData();
        }, 3000);
      })
      .finally(function() {
        that.globalData.isLoading = false;
      });
  },

  // 获取所有站点
  getSites: function() {
    const that = this;
    return new Promise(function(resolve) {
      // 这里可以调用云函数或API获取站点数据
      resolve([
        {
          id: 'zhihu',
          name: '知乎',
          icon: '知',
          url: 'https://www.zhihu.com/hot'
        },
        {
          id: 'weibo',
          name: '微博',
          icon: '微',
          url: 'https://s.weibo.com/top/summary'
        },
        {
          id: 'baidu',
          name: '百度',
          icon: '百',
          url: 'https://top.baidu.com/board?tab=realtime'
        },
        {
          id: 'bilibili',
          name: 'B站',
          icon: 'B',
          url: 'https://www.bilibili.com/v/popular/rank/all'
        },
        {
          id: 'douyin',
          name: '抖音',
          icon: '抖',
          url: 'https://www.douyin.com/hot'
        },
        {
          id: 'hupu',
          name: '虎扑',
          icon: '虎',
          url: 'https://bbs.hupu.com/all-gambia'
        },
        {
          id: 'douban',
          name: '豆瓣',
          icon: '豆',
          url: 'https://www.douban.com/group/explore'
        },
        {
          id: '36kr',
          name: '36氪',
          icon: '氪',
          url: 'https://36kr.com/information/technology'
        },
        {
          id: 'itnews',
          name: 'IT新闻',
          icon: 'IT',
          url: 'https://www.ithome.com/'
        }
      ]);
    });
  },

  // 获取所有热点数据
  getAllHotItems: function() {
    const that = this;
    return new Promise(function(resolve, reject) {
      // 获取所有站点的MCP ID
      const siteIds = [
        that.siteMcpIdMap.zhihu,    // 知乎
        that.siteMcpIdMap.weibo,    // 微博
        that.siteMcpIdMap.baidu,    // 百度
        that.siteMcpIdMap.bilibili, // B站
        that.siteMcpIdMap.douyin,   // 抖音
        that.siteMcpIdMap.hupu,     // 虎扑
        that.siteMcpIdMap.douban,   // 豆瓣
        that.siteMcpIdMap['36kr'],  // 36氪
        that.siteMcpIdMap.itnews    // IT新闻
      ];
      
      // 调用本地MCP服务器获取热点数据
      wx.request({
        url: `${that.globalData.mcpBaseUrl}/api/hotnews`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          sources: siteIds
        },
        success: function(res) {
          if (res.statusCode === 200 && Array.isArray(res.data)) {
            // 适配数据结构
            const siteKeys = [
              'zhihu', 'weibo', 'baidu', 'bilibili', 'douyin', 'hupu', 'douban', '36kr', 'itnews'
            ];
            const sites = res.data.map((item, idx) => ({
              id: siteKeys[idx],
              name: item.name,
              mcpId: siteIds[idx]
            }));
            const hotItemsBySite = {};
            res.data.forEach((item, idx) => {
              const siteId = siteKeys[idx];
              hotItemsBySite[siteId] = item.data;
            });
            resolve({
              sites,
              hotItemsBySite,
              lastUpdated: new Date().toISOString()
            });
          } else {
            reject(new Error('获取热点数据失败'));
          }
        },
        fail: function(error) {
          console.error('调用MCP服务器失败:', error);
          reject(error);
        }
      });
    });
  },

  getSiteHotItems: function(siteId, limit = 10) {
    const that = this;
    return new Promise(function(resolve, reject) {
      // 获取站点的MCP ID
      const mcpId = that.siteMcpIdMap[siteId];
      if (!mcpId) {
        reject(new Error(`未知的站点ID: ${siteId}`));
        return;
      }
      
      // 调用本地MCP服务器获取特定站点的热点数据
      wx.request({
        url: `${that.globalData.mcpBaseUrl}/api/hotnews`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          sources: [mcpId],
          limit: limit
        },
        success: function(res) {
          if (res.statusCode === 200 && res.data && res.data.length > 0) {
            const siteData = res.data[0];
            if (siteData && siteData.data) {
              resolve(siteData.data);
            } else {
              resolve([]);
            }
          } else {
            resolve([]);
          }
        },
        fail: function(error) {
          console.error('获取站点数据失败:', error);
          reject(error);
        }
      });
    });
  },

  // 刷新数据
  refreshData: function() {
    const that = this;
    that.globalData.isLoading = true;
    
    // 获取所有热点数据
    that.getAllHotItems()
      .then(function(allHotItems) {
        that.globalData.allHotItems = allHotItems;
        that.globalData.lastUpdated = new Date();
      })
      .catch(function(error) {
        console.error('刷新数据失败:', error);
        // 显示错误提示
        wx.showToast({
          title: '数据刷新失败，请检查网络连接',
          icon: 'none',
          duration: 2000
        });
      })
      .finally(function() {
        that.globalData.isLoading = false;
      });
  }
}); 