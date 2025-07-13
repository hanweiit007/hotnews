const siteConfig = require('./config/siteConfig');

App({
  globalData: {
    sites: [],
    allHotItems: [],
    isLoading: false,
    lastUpdated: null,
    // mcpBaseUrl: 'http://localhost:9000', // 本地开发环境地址
    // mcpBaseUrl: 'http://49.232.145.233:3001', // pm2部署地址
    mcpBaseUrl: 'https://1367911501-h3462r582a.ap-beijing.tencentscf.com', // 腾讯云函数
    settings: {
      itemsPerSite: 50,
      pinnedSites: [],
      siteOrder: []
    },
    userInfo: null,
    StatusBar: null,
    Custom: null,
    CustomBar: null,
    retryCount: 0, // 添加重试计数
    maxRetries: 3  // 最大重试次数
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
    const site = siteConfig.sites.find(s => s.id === siteId);
    return site ? site.name : '未知站点';
  },

  // 新增：获取文章内容
  getArticleContent: function(url) {
    const that = this;
    return new Promise(function(resolve, reject) {
      console.log('app.js getArticleContent调用，URL:', url);
      
      // 简单验证URL格式
      if (!url || typeof url !== 'string') {
        console.error('URL验证失败:', url);
        reject(new Error('无效的文章链接'));
        return;
      }
      
      // 使用正则表达式验证URL格式，兼容小程序环境
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(url)) {
        console.error('URL格式无效:', url);
        reject(new Error('URL格式无效'));
        return;
      }

      console.log('开始发送请求到:', `${that.globalData.mcpBaseUrl}/api/article-content`);
      console.log('请求数据:', { url: url });

      wx.request({
        url: `${that.globalData.mcpBaseUrl}/api/article-content`,
        method: 'POST',
        timeout: 30000, // 增加到30秒超时，因为某些文章解析需要较长时间
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          url: url
        },
        success: function(res) {
          console.log('文章内容接口响应:', res);
          if (res.statusCode === 200 && res.data) {
            // 更宽松的数据验证 - 只要有title或content中的任意一个即可
            const title = res.data.title || '无标题';
            const content = res.data.content || '<p>暂无内容</p>';
            const summary = res.data.summary || '';
            
            console.log('解析后的数据:', {
              title: title,
              contentLength: content.length,
              summary: summary
            });
            
            // 只要content不为空字符串就认为是有效数据
            if (content && content.trim().length > 0) {
              resolve({
                title: title,
                content: content,
                summary: summary
              });
            } else {
              console.error('内容为空，拒绝数据');
              reject(new Error('文章内容为空'));
            }
          } else {
            console.error('文章内容接口错误:', res.statusCode, res.data);
            reject(new Error(`服务器返回错误: ${res.statusCode}`));
          }
        },
        fail: function(error) {
          console.error('获取文章内容网络失败:', error);
          // 提供更友好的错误信息
          if (error.errMsg && error.errMsg.includes('timeout')) {
            reject(new Error('请求超时，请检查网络连接'));
          } else if (error.errMsg && error.errMsg.includes('fail')) {
            reject(new Error('网络连接失败，请检查网络设置'));
          } else {
            reject(new Error('获取文章内容失败，请稍后重试'));
          }
        }
      });
    });
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
        siteOrder: settings.siteOrder || [],
        autoRefresh: settings.autoRefresh !== false, // 添加自动刷新默认值
        refreshInterval: settings.refreshInterval || 5 // 添加刷新间隔默认值
      }
    }

    // 初始化数据
    this.initData();
    
    // 如果启用了自动刷新，启动定时器
    if (this.globalData.settings.autoRefresh) {
      this.startAutoRefresh();
    }
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
        that.globalData.retryCount = 0; // 重置重试计数
      })
      .catch(function(error) {
        console.error('初始化数据失败:', error);
        // 显示错误提示
        wx.showToast({
          title: '数据加载失败，请检查网络连接',
          icon: 'none',
          duration: 2000
        });
        // 有限重试
        if (that.globalData.retryCount < that.globalData.maxRetries) {
          that.globalData.retryCount++;
          setTimeout(function() {
            that.initData();
          }, 3000);
        } else {
          console.error('达到最大重试次数，停止重试');
          wx.showToast({
            title: '网络连接失败，请稍后手动刷新',
            icon: 'none',
            duration: 3000
          });
        }
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
  getAllHotItems: function(limit = 10) {
    const that = this;
    return new Promise(function(resolve, reject) {
      // 分批获取数据，知乎单独一批因为响应很慢
      const zhihuBatch = [that.siteMcpIdMap.zhihu]; // 知乎单独处理
      const batch1 = [
        that.siteMcpIdMap.weibo,    // 微博
        that.siteMcpIdMap.baidu,    // 百度
        that.siteMcpIdMap.bilibili, // B站
      ];
      const batch2 = [
        that.siteMcpIdMap.douyin,   // 抖音
        that.siteMcpIdMap.hupu,     // 虎扑
        that.siteMcpIdMap.douban,   // 豆瓣
      ];
      const batch3 = [
        that.siteMcpIdMap['36kr'],  // 36氪
        that.siteMcpIdMap.itnews    // IT新闻
      ];
      
      console.log('分批请求数据，知乎单独批次:', zhihuBatch, 'batch1:', batch1, 'batch2:', batch2, 'batch3:', batch3);
      
      // 并行请求所有批次
      Promise.all([
        that.getBatchHotItems(zhihuBatch, limit, 30000), // 知乎给30秒超时
        that.getBatchHotItems(batch1, limit),
        that.getBatchHotItems(batch2, limit),
        that.getBatchHotItems(batch3, limit)
      ]).then(results => {
        // 合并结果
        const allData = [];
        results.forEach(batchData => {
          if (Array.isArray(batchData)) {
            allData.push(...batchData);
          }
        });
        
        console.log('合并后的数据:', allData.length, '个数据源');
        
        // 适配数据结构
        const siteKeys = [
          'zhihu', 'weibo', 'baidu', 'bilibili', 'douyin', 'hupu', 'douban', '36kr', 'itnews'
        ];
        const sites = allData.map((item, idx) => ({
          id: siteKeys[idx],
          name: item.name,
          mcpId: item.mcpId || idx + 1
        }));
        const hotItemsBySite = {};
        allData.forEach((item, idx) => {
          const siteId = siteKeys[idx];
          hotItemsBySite[siteId] = item.data || [];
        });

        // 生成推荐数据
        const recommendedItems = that.generateRecommendedItems(hotItemsBySite);
        hotItemsBySite.recommended = recommendedItems;
        
        resolve({
          sites,
          hotItemsBySite,
          lastUpdated: new Date().toISOString()
        });
        
      }).catch(error => {
        console.error('分批请求失败:', error);
        reject(error);
      });
    });
  },

  // 新增：获取批次数据
  getBatchHotItems: function(siteIds, limit = 10, timeout = 15000) {
    const that = this;
    return new Promise(function(resolve, reject) {
      console.log('请求批次数据:', siteIds, '超时时间:', timeout + 'ms');
      
      wx.request({
        url: `${that.globalData.mcpBaseUrl}/api/hotnews`,
        method: 'POST',
        timeout: timeout, // 使用传入的超时时间
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          sources: siteIds,
          limit: limit || 50
        },
        success: function(res) {
          console.log('批次数据响应:', {
            sources: siteIds,
            statusCode: res.statusCode,
            dataLength: res.data ? res.data.length : 0
          });
          
          if (res.statusCode === 200 && Array.isArray(res.data)) {
            resolve(res.data);
          } else {
            console.error('批次数据异常:', res.statusCode, res.data);
            resolve([]); // 返回空数组而不是失败，允许其他批次继续
          }
        },
        fail: function(error) {
          console.error('批次请求失败:', error, '数据源:', siteIds);
          resolve([]); // 返回空数组而不是失败，允许其他批次继续
        }
      });
    });
  },

  // 新增：生成推荐数据
  generateRecommendedItems: function(hotItemsBySite) {
    const allItems = [];
    
    // 从所有站点收集热点数据
    Object.keys(hotItemsBySite).forEach(siteId => {
      if (hotItemsBySite[siteId] && Array.isArray(hotItemsBySite[siteId])) {
        hotItemsBySite[siteId].forEach((item, index) => {
          allItems.push({
            ...item,
            originalSite: siteId,
            originalRank: index + 1,
            score: this.calculateItemScore(item, index, siteId)
          });
        });
      }
    });
  
  // 按分数排序并取前20个
  return allItems
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  },

  // 新增：计算推荐分数
  calculateItemScore: function(item, rank, siteId) {
    let score = 0;
    
    // 根据排名给分（排名越高分数越高）
    score += Math.max(0, 50 - rank);
    
    // 根据站点权重给分
    const siteWeights = {
      'zhihu': 1.2,
      'weibo': 1.1,
      'baidu': 1.0,
      'bilibili': 0.9,
      'douyin': 0.8,
      'hupu': 0.7,
      'douban': 0.6,
      '36kr': 0.8,
      'itnews': 0.7
    };
    score *= (siteWeights[siteId] || 1.0);
    
    // 根据热度给分（如果有的话）
    if (item.hot && typeof item.hot === 'string') {
      const hotNum = parseInt(item.hot.replace(/[^\d]/g, '')) || 0;
      score += Math.log10(hotNum + 1) * 5;
    }
    
    return score;
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
        timeout: 20000, // 增加到20秒超时，获取多个数据源需要较长时间
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
    return new Promise(function(resolve, reject) {
      that.globalData.isLoading = true;
      
      that.getAllHotItems()
        .then(function(allHotItems) {
          that.globalData.allHotItems = allHotItems;
          that.globalData.lastUpdated = new Date();
          resolve(allHotItems);
        })
        .catch(function(error) {
          console.error('刷新数据失败:', error);
          wx.showToast({
            title: '数据刷新失败，请检查网络连接',
            icon: 'none',
            duration: 2000
          });
          reject(error);
        })
        .finally(function() {
          that.globalData.isLoading = false;
        });
    });
  },
  
  // 添加自动刷新功能
  startAutoRefresh: function() {
    const that = this;
    const interval = that.globalData.settings.refreshInterval || 5;
    // 清除已有定时器
    that.stopAutoRefresh();
    // 设置新定时器
    that.refreshTimer = setInterval(() => {
      if (!that.globalData.isLoading) {
        that.refreshData();
      }
    }, interval * 60 * 1000);
  },
  
  stopAutoRefresh: function() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },
});