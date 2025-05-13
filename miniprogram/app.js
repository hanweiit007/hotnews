App({
  globalData: {
    sites: [],
    allHotItems: [],
    isLoading: false,
    lastUpdated: null,
    mcpBaseUrl: 'http://localhost:3001', // MCP 服务的基础 URL
    settings: {
      itemsPerSite: 10 // 默认每个站点显示10条
    }
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
    // 从本地存储加载设置
    this.loadSettings();
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
    try {
      this.globalData.settings = settings;
      wx.setStorageSync('settings', JSON.stringify(settings));
      // 重新加载数据以应用新设置
      this.refreshData();
    } catch (error) {
      console.error('保存设置失败:', error);
      wx.showToast({
        title: '保存设置失败',
        icon: 'none'
      });
    }
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
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
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
  getAllHotItems: function(itemsPerSite) {
    const that = this;
    itemsPerSite = itemsPerSite || this.globalData.settings.itemsPerSite;
    
    console.log('开始获取热点数据，itemsPerSite:', itemsPerSite);
    console.log('MCP服务地址:', that.globalData.mcpBaseUrl);
    
    return new Promise(function(resolve, reject) {
      const siteIds = Object.values(that.siteMcpIdMap);
      console.log('请求的站点IDs:', siteIds);
      
      wx.request({
        url: that.globalData.mcpBaseUrl + '/api/hotnews',
        method: 'POST',
        data: {
          siteIds: siteIds
        },
        header: {
          'content-type': 'application/json'
        },
        success: function(res) {
          console.log('请求成功，状态码:', res.statusCode);
          console.log('原始响应数据:', JSON.stringify(res.data, null, 2));
          
          if (res.statusCode === 200 && res.data) {
            const sites = [];
            const hotItemsBySite = {};

            // 检查响应数据的结构
            if (typeof res.data === 'object') {
              // 处理每个站点的数据
              Object.keys(res.data).forEach(function(siteId) {
                console.log('处理站点数据:', siteId, '数据类型:', typeof res.data[siteId]);
                
                // 找到对应的站点信息
                const siteInfo = Object.entries(that.siteMcpIdMap).find(function([_, id]) {
                  return id === parseInt(siteId);
                });
                
                if (siteInfo) {
                  const siteKey = siteInfo[0];
                  const siteName = that.getSiteName(siteKey);
                  console.log('找到站点信息:', siteKey, siteName);
                  
                  sites.push({
                    id: siteKey,
                    name: siteName,
                    mcpId: parseInt(siteId)
                  });

                  // 处理热点数据
                  let itemsArray = [];
                  const siteData = res.data[siteId];
                  
                  if (Array.isArray(siteData)) {
                    itemsArray = siteData;
                  } else if (typeof siteData === 'object') {
                    if (Array.isArray(siteData.items)) {
                      itemsArray = siteData.items;
                    } else if (Array.isArray(siteData.data)) {
                      itemsArray = siteData.data;
                    } else if (Array.isArray(siteData.list)) {
                      itemsArray = siteData.list;
                    } else {
                      itemsArray = Object.values(siteData).filter(function(item) {
                        return typeof item === 'object' && item !== null;
                      });
                    }
                  }
                  
                  console.log('站点', siteKey, '热点数据:', itemsArray);
                  console.log('站点热点数量:', itemsArray.length);
                  
                  // 只取指定数量的热点
                  hotItemsBySite[siteKey] = itemsArray.slice(0, itemsPerSite).map(function(item, index) {
                    const processedItem = {
                      id: item.id || (siteKey + '-' + (index + 1)),
                      title: item.title || item.name || item.text || '',
                      url: item.url || item.link || item.href || '',
                      rank: item.rank || item.index || (index + 1),
                      hot: item.hot || item.heat || item.count || 0,
                      publishTime: item.time || item.date || item.publishTime || new Date().toISOString(),
                      sourceId: siteKey,
                      siteName: siteName,
                      summary: item.excerpt || item.content || item.desc || item.summary || ''
                    };
                    
                    processedItem.rank = parseInt(processedItem.rank) || (index + 1);
                    processedItem.hot = parseInt(processedItem.hot) || 0;
                    
                    return processedItem;
                  });
                } else {
                  console.warn('未找到站点信息:', siteId);
                }
              });
            } else {
              console.warn('响应数据格式不正确:', typeof res.data);
            }

            console.log('处理完成，站点数量:', sites.length);
            console.log('热点数据:', JSON.stringify(hotItemsBySite, null, 2));

            that.globalData.sites = sites;
            that.globalData.hotItemsBySite = hotItemsBySite;
            that.globalData.lastUpdated = new Date().toLocaleString();

            resolve({
              sites: sites,
              hotItemsBySite: hotItemsBySite,
              lastUpdated: that.globalData.lastUpdated
            });
          } else {
            console.warn('响应数据无效，使用模拟数据');
            resolve(that.getMockHotItems());
          }
        },
        fail: function(error) {
          console.error('请求失败:', error);
          console.warn('使用模拟数据');
          resolve(that.getMockHotItems());
        }
      });
    });
  },

  // 获取模拟数据
  getMockHotItems: function() {
    const sites = [];
    const hotItemsBySite = {};
    const siteIds = Object.keys(this.siteMcpIdMap);
    
    // 为每个站点生成模拟数据
    for (const siteId of siteIds) {
      const siteName = this.getSiteName(siteId);
      sites.push({
        id: siteId,
        name: siteName,
        mcpId: this.siteMcpIdMap[siteId]
      });

      hotItemsBySite[siteId] = Array.from({ length: this.globalData.settings.itemsPerSite }, function(_, i) {
        return {
          id: siteId + '-' + (i + 1),
          title: siteName + '热点 ' + (i + 1),
          url: 'https://example.com/' + siteId + '/' + (i + 1),
          rank: i + 1,
          hot: Math.floor(Math.random() * 1000000),
          publishTime: new Date().toISOString(),
          sourceId: siteId,
          siteName: siteName,
          summary: '这是' + siteName + '的第' + (i + 1) + '条热点新闻的摘要内容...'
        };
      });
    }

    return {
      sites: sites,
      hotItemsBySite: hotItemsBySite,
      lastUpdated: new Date().toLocaleString()
    };
  },

  // 刷新数据
  refreshData: function() {
    const that = this;
    return new Promise(function(resolve, reject) {
      that.getAllHotItems(that.globalData.settings.itemsPerSite)
        .then(function(result) {
          resolve(result);
        })
        .catch(function(error) {
          console.error('刷新数据失败:', error);
          reject(error);
        });
    });
  }
}); 