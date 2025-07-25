const siteConfig = require('./config/siteConfig');
const envConfig = require('./config/environment');
const errorHandlerModule = require('./utils/errorHandler');
const errorHandler = errorHandlerModule.errorHandler;
const ERROR_TYPES = errorHandlerModule.ERROR_TYPES;
const ERROR_LEVELS = errorHandlerModule.ERROR_LEVELS;

App({
  globalData: {
    sites: [],
    allHotItems: [],
    isLoading: false,
    lastUpdated: null,
    // 动态获取环境配置
    mcpBaseUrl: envConfig.getCurrentConfig().mcpBaseUrl,
    envConfig: envConfig.getCurrentConfig(), // 添加环境配置到全局数据
    settings: {
      itemsPerSite: 50,
      pinnedSites: [],
      siteOrder: [],
      // 根据环境设置默认显示模式
      displayMode: envConfig.isAuditVersion() ? 'rich-text' : 'rich-text'
    },
    userInfo: null,
    StatusBar: null,
    Custom: null,
    CustomBar: null,
    retryCount: 0, // 添加重试计数
    maxRetries: 3,  // 最大重试次数
    errorHandler: errorHandler // 添加错误处理器到全局
  },

  onLaunch: function() {
    console.log('App Launch');
    
    // 获取设备信息
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.StatusBar = systemInfo.statusBarHeight;
      this.globalData.Custom = systemInfo.platform === 'ios' ? systemInfo.statusBarHeight + 50 : systemInfo.statusBarHeight + 48;
      this.globalData.CustomBar = systemInfo.platform === 'ios' ? systemInfo.statusBarHeight + 88 : systemInfo.statusBarHeight + 68;
      
      console.log('系统信息:', systemInfo);
    } catch (e) {
      errorHandler.handleSystemError(e, 'App.onLaunch');
    }
    
    // 检测网络状态
    this.checkNetworkStatus();
    
    // 加载本地设置
    try {
      this.loadSettings();
    } catch (e) {
      errorHandler.handleSystemError(e, 'App.loadSettings');
    }
    
    // 获取当前环境信息
    console.log('当前环境:', envConfig.getCurrentEnv());
    console.log('是否审核版本:', envConfig.isAuditVersion());
    console.log('是否webview-only模式:', envConfig.isWebviewOnlyVersion());
    console.log('MCP服务器地址:', this.globalData.mcpBaseUrl);
    
    // 启动服务器健康检查
    this.startServerHealthCheck();
  },

  // 检测网络状态
  checkNetworkStatus: function() {
    try {
      wx.getNetworkType({
        success: (res) => {
          this.globalData.networkType = res.networkType;
          console.log('网络类型:', res.networkType);
          console.log('是否联网:', res.isConnected);
        },
        fail: (err) => {
          console.error('获取网络状态失败:', err);
        }
      });
      
      // 监听网络状态变化
      wx.onNetworkStatusChange((res) => {
        this.globalData.networkType = res.networkType;
        console.log('网络状态变化:', {
          isConnected: res.isConnected,
          networkType: res.networkType
        });
      });
    } catch (e) {
      errorHandler.handleSystemError(e, 'App.network');
    }
  },

  // 定期检查服务器状态并尝试恢复
  startServerHealthCheck: function() {
    const that = this;
    const checkInterval = 30000; // 30秒检查一次
    
    this.healthCheckTimer = setInterval(() => {
      // 只在使用Mock数据时才进行健康检查
      const currentData = that.globalData.allHotItems;
      if (currentData && currentData.length > 0 && 
          currentData[0].data && currentData[0].data[0] && 
          currentData[0].data[0].isMockItem) {
        
        console.log('检测到Mock数据，尝试恢复服务连接...');
        
        that.checkMcpServerHealth()
          .then((isHealthy) => {
            if (isHealthy) {
              console.log('服务器已恢复，重新获取数据');
              wx.showToast({
                title: '网络已恢复',
                icon: 'success',
                duration: 2000
              });
              
              // 重新获取数据
              that.getAllHotItems()
                .then((newData) => {
                  that.globalData.allHotItems = newData;
                  that.globalData.lastUpdated = new Date();
                  
                  // 通知页面刷新数据
                  that.broadcastDataUpdate();
                })
                .catch((error) => {
                  console.error('恢复数据获取失败:', error);
                });
            }
          })
          .catch((error) => {
            console.error('健康检查失败:', error);
          });
      }
    }, checkInterval);
  },

  // 广播数据更新事件
  broadcastDataUpdate: function() {
    // 可以通过事件系统通知所有页面数据已更新
    console.log('广播数据更新事件');
  },

  // 停止健康检查
  stopServerHealthCheck: function() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  },

  onShow: function() {
    console.log('App Show');
  },

  onHide: function() {
    console.log('App Hide');
  },

  onError: function(msg) {
    // 过滤掉微信小程序系统级错误，这些错误不影响应用功能
    if (msg && typeof msg === 'string') {
      if (msg.includes('wxfile://ad/interstitialAdExtInfo.txt') ||
          msg.includes('wxfile://usr/miniprogramLog/log2') ||
          msg.includes('no such file or directory')) {
        // 静默处理系统级错误，不显示给用户
        return;
      }
    }
    
    console.error('App Error:', msg);
    errorHandler.handleError(msg, ERROR_TYPES.SYSTEM, ERROR_LEVELS.CRITICAL, {
      source: 'App.onError'
    });
  },

  onUnhandledRejection: function(res) {
    console.error('Unhandled Promise Rejection:', res);
    errorHandler.handleError(res.reason, ERROR_TYPES.SYSTEM, ERROR_LEVELS.ERROR, {
      source: 'App.onUnhandledRejection',
      promise: res.promise
    });
  },

  onPageNotFound: function(res) {
    console.error('Page Not Found:', res);
    errorHandler.handleError('页面不存在', ERROR_TYPES.SYSTEM, ERROR_LEVELS.WARNING, {
      source: 'App.onPageNotFound',
      path: res.path,
      query: res.query,
      isEntryPage: res.isEntryPage
    });
    
    // 页面不存在时的处理
    wx.switchTab({
      url: '/pages/index/index'
    });
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
  getArticleContent: function(url, mode = 'rich-text') {
    // webview-only模式下，检查是否禁用内容抓取
    if (envConfig.isWebviewOnlyVersion() && !envConfig.isFeatureEnabled('contentCrawl')) {
      console.log('webview-only模式下内容抓取已禁用');
      return Promise.reject(new Error('当前模式不支持内容抓取，请使用webview模式查看'));
    }
    
    const that = this;
    return new Promise(function(resolve, reject) {
      console.log('app.js getArticleContent调用，URL:', url, '模式:', mode);
      
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
      console.log('请求数据:', { url: url, mode: mode });

      wx.request({
        url: `${that.globalData.mcpBaseUrl}/api/article-content`,
        method: 'POST',
        timeout: 15000, // 增加到15秒超时
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          url: url,
          mode: mode
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
            let errorMsg = `服务器返回错误: ${res.statusCode}`;
            if (res.data && res.data.error) {
              errorMsg = res.data.error;
            }
            reject(new Error(errorMsg));
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

  // 加载设置
  loadSettings: function() {
    try {
      const settings = wx.getStorageSync('settings');
      if (settings) {
        // 检查数据类型，如果已经是对象则直接使用，如果是字符串则解析
        if (typeof settings === 'object') {
          this.globalData.settings = { ...this.globalData.settings, ...settings };
        } else if (typeof settings === 'string') {
          this.globalData.settings = { ...this.globalData.settings, ...JSON.parse(settings) };
        }
        console.log('设置加载成功:', this.globalData.settings);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
      // 出错时使用默认设置
      this.globalData.settings = {
        itemsPerSite: 50,
        pinnedSites: [],
        siteOrder: [],
        displayMode: envConfig.isAuditVersion() ? 'rich-text' : 'rich-text',
        recommendedItemsPerSite: 3,
        siteItemsPerSite: 10,
        autoRefresh: true,
        darkMode: false
      };
    }
  },

  // 保存设置
  saveSettings: function(settings) {
    try {
      // 合并现有设置和新设置
      var currentSettings = this.globalData.settings || {}
      var newSettings = {
        ...currentSettings,
        ...settings,
        // 确保这些字段始终存在
        recommendedItemsPerSite: settings.recommendedItemsPerSite || currentSettings.recommendedItemsPerSite || 3,
        siteItemsPerSite: settings.siteItemsPerSite || currentSettings.siteItemsPerSite || 10,
        autoRefresh: settings.autoRefresh !== undefined ? settings.autoRefresh : (currentSettings.autoRefresh !== undefined ? currentSettings.autoRefresh : true),
        darkMode: settings.darkMode !== undefined ? settings.darkMode : (currentSettings.darkMode !== undefined ? currentSettings.darkMode : false)
      }
      
      this.globalData.settings = newSettings
      // 直接存储对象，微信小程序会自动序列化
      wx.setStorageSync('settings', newSettings)
      console.log('设置保存成功:', newSettings);
    } catch (error) {
      console.error('保存设置失败:', error);
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
        that.globalData.retryCount = 0; // 重置重试计数
        
        // 检查是否使用了Mock数据
        if (allHotItems.length > 0 && allHotItems[0].data && allHotItems[0].data[0] && allHotItems[0].data[0].isMockItem) {
          console.log('当前使用Mock数据，网络可能存在问题');
          // 可以在这里添加用户提示
          wx.showToast({
            title: '网络异常，显示离线数据',
            icon: 'none',
            duration: 3000
          });
        }
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

  // 检查MCP服务器健康状态
  checkMcpServerHealth: function() {
    const that = this;
    return new Promise((resolve, reject) => {
      console.log('检查MCP服务器健康状态...');
      wx.request({
        url: `${that.globalData.mcpBaseUrl}/health`,
        method: 'GET',
        timeout: 5000, // 健康检查使用较短超时
        success: function(res) {
          console.log('MCP服务器健康检查响应:', res);
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        fail: function(error) {
          console.error('MCP服务器健康检查失败:', error);
          resolve(false);
        }
      });
    });
  },

  // 获取Mock数据 - 当MCP服务不可用时使用
  getMockHotItems: function() {
    console.log('使用Mock数据');
    const mockSites = [];
    const siteConfigs = [
      { id: 'zhihu', name: '知乎热榜', icon: '💡' },
      { id: 'weibo', name: '微博热搜', icon: '🔥' },
      { id: 'baidu', name: '百度热点', icon: '🔍' },
      { id: 'bilibili', name: 'B站热榜', icon: '📺' },
      { id: 'douyin', name: '抖音热点', icon: '🎵' }
    ];
    
    siteConfigs.forEach(site => {
      mockSites.push({
        id: site.id,
        name: site.name,
        icon: site.icon,
        data: [
          { 
            title: '网络连接异常，正在尝试重新连接...', 
            url: '#', 
            hot: 0, 
            time: new Date().toISOString(),
            isMockItem: true
          }
        ]
      });
    });
    
    return mockSites;
  },

  // 获取所有热点数据
  getAllHotItems: function(limit, retryCount) {
    limit = limit || 10;
    retryCount = retryCount || 0;
    const that = this;
    return new Promise(function(resolve, reject) {
      const query = `limit=${limit}`;
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
      
      console.log('开始获取热点数据，MCP服务器地址:', that.globalData.mcpBaseUrl);
      console.log('请求参数:', { sources: siteIds, limit: limit, retryCount: retryCount });
      
      // 调用本地MCP服务器获取热点数据
      wx.request({
        url: `${that.globalData.mcpBaseUrl}/api/hotnews`,
        method: 'POST',
        timeout: that.globalData.envConfig.requestTimeout || 15000, // 使用环境配置的超时时间
        header: {
          'Content-Type': 'application/json',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9'
        },
        data: {
          sources: siteIds,
          limit: limit || 50 // 使用传入的限制参数
        },
        success: function(res) {
          console.log('热点数据接口响应:', res);
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
          } else {
            reject(new Error('获取热点数据失败'));
          }
        },
        fail: function(error) {
          console.error('调用MCP服务器失败:', error);
          console.error('请求详情:', {
            url: `${that.globalData.mcpBaseUrl}/api/hotnews`,
            timeout: that.globalData.envConfig.requestTimeout || 15000,
            network: that.globalData.networkType || 'unknown',
            environment: that.globalData.envConfig.getCurrentEnv?.() || envConfig.getCurrentEnv()
          });
          
          // 更详细的错误信息
          if (error.errMsg) {
            console.error('错误类型:', error.errMsg);
            if (error.errMsg.includes('timeout') || error.errMsg.includes('time out')) {
              console.error('网络超时，可能原因：1.网络连接不稳定 2.服务器响应慢 3.防火墙阻拦');
            } else if (error.errMsg.includes('fail:')) {
              console.error('请求失败，错误详情:', error.errMsg);
            }
          }
          
          // 添加重试逻辑
          if (retryCount < 3) {
            const retryDelay = Math.pow(2, retryCount) * 1000; // 指数退避策略
            console.log(`将在${retryDelay}ms后重试，重试次数:${retryCount+1}`);
            setTimeout(() => {
              that.getAllHotItems(limit, retryCount+1).then(resolve).catch(reject);
            }, retryDelay);
          } else {
            console.error('达到最大重试次数，使用Mock数据替代');
            // 使用Mock数据而不是完全失败
            const mockData = that.getMockHotItems();
            resolve(mockData);
          }
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
        timeout: 10000, // 添加10秒超时
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