App({
  globalData: {
    sites: [],
    allHotItems: [],
    isLoading: false,
    lastUpdated: null,
    mcpBaseUrl: 'http://localhost:3001', // 本地开发环境地址
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
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        // env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        // 此处请填入环境 ID, 环境 ID 可打开云控制台查看
        // 如不填则使用默认环境（第一个创建的环境）
        env: 'hotnews-xxxxx', // 请将此处替换为你的云开发环境ID
        traceUser: true, // 是否将用户访问记录到用户管理中，在控制台中可见
      })
    }

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
  getAllHotItems: function(limit) {
    var that = this
    return new Promise(function(resolve, reject) {
      console.log('开始获取热点数据，URL:', that.globalData.mcpBaseUrl + '/api/hotnews')
      
      // 获取所有站点的 ID
      const siteIds = Object.values(that.siteMcpIdMap)
      console.log('请求的站点IDs:', siteIds)
      
      wx.request({
        url: that.globalData.mcpBaseUrl + '/api/hotnews',
        method: 'POST',
        data: {
          siteIds: siteIds
        },
        success: function(res) {
          console.log('MCP 服务响应:', res)
          
          if (res.statusCode === 200 && res.data) {
            // 确保返回的数据结构正确
            const result = {
              sites: [],
              hotItemsBySite: {},
              lastUpdated: new Date().toISOString()
            }

            // 处理每个站点的数据
            Object.keys(that.siteMcpIdMap).forEach(function(siteId, index) {
              const siteName = that.getSiteName(siteId)
              const mcpId = that.siteMcpIdMap[siteId]
              result.sites.push({
                id: siteId,
                name: siteName,
                mcpId: mcpId
              })

              // 使用数组索引获取对应站点的数据
              const siteData = res.data[index]
              console.log(`站点 ${siteId} (MCP ID: ${mcpId}) 的数据:`, siteData)
              
              if (siteData && Array.isArray(siteData.data)) {
                // 为每个热点项添加排名和必要的字段
                const itemsWithRank = siteData.data.map((item, index) => {
                  // 根据不同站点处理数据
                  let processedItem = {
                    id: item.id || `item_${index}`,
                    title: item.title || '',
                    url: item.url || '',
                    hot: item.hot || '0',
                    publishTime: item.time || new Date().toISOString(),
                    summary: item.summary || '',
                    rank: index + 1
                  }

                  // 根据站点类型添加特定字段
                  switch (siteId) {
                    case 'zhihu':
                      processedItem.summary = item.excerpt || ''
                      break
                    case 'weibo':
                      processedItem.summary = item.content || ''
                      break
                    case 'baidu':
                      processedItem.summary = item.desc || ''
                      break
                  }

                  return processedItem
                })
                result.hotItemsBySite[siteId] = itemsWithRank.slice(0, limit)
                console.log(`站点 ${siteId} 的热点数据:`, result.hotItemsBySite[siteId])
              } else {
                result.hotItemsBySite[siteId] = []
                console.log(`站点 ${siteId} 没有数据`)
              }
            })

            console.log('处理后的数据:', result)
            resolve(result)
          } else {
            console.error('MCP 服务响应错误:', res)
            reject(new Error('请求失败或数据格式错误'))
          }
        },
        fail: function(error) {
          console.error('MCP 服务请求失败:', error)
          reject(error)
        }
      })
    })
  },

  // 刷新数据
  refreshData: function() {
    console.log('刷新数据，itemsPerSite:', this.globalData.settings.itemsPerSite)
    return this.getAllHotItems(this.globalData.settings.itemsPerSite)
  }
}); 