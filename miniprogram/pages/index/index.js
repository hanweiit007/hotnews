// index.js
var app = getApp()
const util = require('../../utils/util.js') // 导入工具函数
const siteConfig = require('../../config/siteConfig');

Page({
  data: {
    sites: [],
    isLoading: false,
    lastUpdated: null,
    lastUpdatedFormatted: '',
    selectedSite: null,
    groupedHotItems: {},
    recommendedItemsPerSite: 3,
    siteItemsPerSite: 10,
    collapsedSites: {}, 
    isAllCollapsed: false,
    currentTime: new Date().toLocaleString(),
    recommendedSite: null,
    otherSites: [],
    scrollLeft: 0,
    loadingPromise: null // 添加请求状态追踪
  },

  onLoad: function() {
    console.log('Index onLoad');
    this.setData({
      currentTime: new Date().toLocaleString()
    });
    this.loadData();
  },

  onShow: function() {
    console.log('Index onShow');
    this.setData({
      currentTime: new Date().toLocaleString()
    });
    // 如果没有数据，重新加载
    if (!this.data.sites || this.data.sites.length === 0) {
      this.loadData();
    }
  },

  onReady: function() {
    console.log('Index onReady');
  },

  onPullDownRefresh: function() {
    console.log('Index onPullDownRefresh');
    this.refreshData();
  },

  onReachBottom: function() {
    console.log('Index onReachBottom');
  },

  onUnload: function() {
    console.log('Index onUnload');
  },

  onError: function(error) {
    // 过滤掉微信小程序系统级错误
    if (error && typeof error === 'string') {
      if (error.includes('wxfile://') || error.includes('no such file or directory')) {
        // 静默处理系统级错误
        return;
      }
    }
    console.error('Index onError:', error);
  },

  loadData: function() {
    console.log('开始加载数据...');
    if (this.data.isLoading) {
      console.log('正在加载中，跳过重复请求');
      return;
    }

    this.setData({
      isLoading: true
    });
    
    var that = this;
    
    // 获取当前设置
    var settings = app.globalData.settings || {};
    var itemsPerSite = settings.siteItemsPerSite || 10;
    
    console.log('调用app.getAllHotItems，参数:', itemsPerSite);
    console.log('当前环境配置:', app.globalData.envConfig);
    console.log('MCP服务器地址:', app.globalData.mcpBaseUrl);
    
    app.getAllHotItems(itemsPerSite)
      .then(function(result) {
        console.log('获取数据成功:', result);
        
        if (!result || !result.sites || !Array.isArray(result.sites)) {
          console.error('数据格式错误:', result);
          throw new Error('数据格式错误');
        }

        // 处理站点数据，添加图标和排序
        var sites = result.sites.map(function(site) {
          return {
            id: site.id,
            name: site.name,
            mcpId: site.mcpId,
            icon: that.getSiteIcon(site.id),
            pinned: (settings.pinnedSites || []).indexOf(site.id) !== -1
          };
        });

        // 推荐始终固定在第一个
        if (!sites.length || sites[0].id !== 'recommended') {
          sites.unshift({
            id: 'recommended',
            name: '推荐',
            icon: '🔥',
            pinned: true
          });
        }

        // 根据置顶状态和配置顺序排序
        sites.sort(function(a, b) {
          if (a.pinned !== b.pinned) return b.pinned - a.pinned;
          var siteOrder = settings.siteOrder || [];
          var orderA = siteOrder.indexOf(a.id);
          var orderB = siteOrder.indexOf(b.id);
          if (orderA === -1) orderA = 999;
          if (orderB === -1) orderB = 999;
          return orderA - orderB;
        });

        // 确保热点数据正确格式化
        var groupedHotItems = {};
        if (result.hotItemsBySite) {
          Object.keys(result.hotItemsBySite).forEach(function(siteId) {
            groupedHotItems[siteId] = result.hotItemsBySite[siteId].map(function(item, index) {
              return Object.assign({}, item, {
                rank: index + 1,
                title: that.cleanTitle(item.title, siteId)
              });
            });
          });
        } else {
          // 添加空数据处理
          sites.forEach(function(site) {
            if (site.id !== 'recommended') {
              groupedHotItems[site.id] = [];
            }
          });
        }

        var selectedSite = that.data.selectedSite || sites[0];

        // 更新全局数据
        app.globalData.sites = sites;
        app.globalData.hotItemsBySite = result.hotItemsBySite;
        app.globalData.lastUpdated = result.lastUpdated;

        console.log('准备设置页面数据:', {
          sitesLength: sites.length,
          selectedSite: selectedSite,
          groupedHotItemsKeys: Object.keys(groupedHotItems)
        });

        that.setData({
          sites: sites,
          recommendedSite: sites[0],
          otherSites: sites.slice(1),
          hotItemsBySite: result.hotItemsBySite || {},
          lastUpdated: result.lastUpdated || new Date().toISOString(),
          lastUpdatedFormatted: that.formatTime(result.lastUpdated || new Date().toISOString()),
          groupedHotItems: groupedHotItems,
          selectedSite: selectedSite,
          recommendedItemsPerSite: settings.recommendedItemsPerSite || 3,
          siteItemsPerSite: settings.siteItemsPerSite || 10
        });

        console.log('页面数据设置完成');
        
        // 计算滚动位置
        that.updateScrollPosition();
      }).catch(function(error) {
        console.error('加载数据失败:', error);
        
        // 显示具体错误信息
        var errorMessage = '加载数据失败';
        if (error.message) {
          errorMessage += ': ' + error.message;
        }
        
        wx.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        });
        
        // 设置空数据，避免白屏
        that.setData({
          sites: [{
            id: 'recommended',
            name: '推荐',
            icon: '🔥',
            pinned: true
          }],
          recommendedSite: {
            id: 'recommended',
            name: '推荐',
            icon: '🔥',
            pinned: true
          },
          otherSites: [],
          hotItemsBySite: {},
          groupedHotItems: {},
          selectedSite: {
            id: 'recommended',
            name: '推荐',
            icon: '🔥',
            pinned: true
          },
          lastUpdatedFormatted: '加载失败'
        });
      }).finally(function() {
        console.log('数据加载完成，设置loading为false');
        that.setData({ 
          isLoading: false 
        });
      });
  },

  refreshData: function() {
    var that = this
    that.setData({ isLoading: true })
    
    app.refreshData()
      .then(function(result) {
        that.loadData()
      })
      .catch(function(error) {
        console.error('刷新数据失败:', error)
        wx.showToast({
          title: '刷新失败',
          icon: 'none'
        })
      })
      .finally(function() {
        wx.stopPullDownRefresh();
        // 更新格式化时间
        that.setData({
          lastUpdatedFormatted: that.formatTime(that.data.lastUpdated)
        });
      })
  },

  // 获取站点图标
  getSiteIcon: function(siteId) {
    const site = siteConfig.sites.find(s => s.id === siteId);
    return site ? site.icon : '?';
  },

  // 处理站点选择
  handleSiteSelect: function(e) {
    const site = e.currentTarget.dataset.site;
    console.log('选择站点:', site);
    
    this.setData({
      selectedSite: site
    });
    
    this.updateScrollPosition();
  },

  // 更新滚动位置
  updateScrollPosition: function() {
    const selectedSite = this.data.selectedSite;
    if (!selectedSite || selectedSite.id === 'recommended') {
      this.setData({ scrollLeft: 0 });
      return;
    }
    
    const otherSites = this.data.otherSites;
    const index = otherSites.findIndex(site => site.id === selectedSite.id);
    
    if (index !== -1) {
      const scrollLeft = index * 120; // 每个tab大约120rpx宽
      this.setData({ scrollLeft: scrollLeft });
    }
  },

  // 处理热点点击
  handleItemClick: function(e) {
    const item = e.currentTarget.dataset.item;
    console.log('点击热点:', item);
    
    if (!item.url) {
      wx.showToast({
        title: '暂无链接',
        icon: 'none'
      });
      return;
    }
    
    // 获取当前设置
    const settings = app.globalData.settings || {};
    const displayMode = settings.displayMode || 'rich-text';
    
    // 跳转到文章页面
    wx.navigateTo({
      url: `/pages/article/article?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.title)}&mode=${displayMode}`
    });
  },

  // 切换站点收起状态
  toggleSiteCollapse: function(e) {
    const siteId = e.currentTarget.dataset.siteId;
    const collapsedSites = this.data.collapsedSites;
    
    collapsedSites[siteId] = !collapsedSites[siteId];
    
    this.setData({
      collapsedSites: collapsedSites
    });
  },

  // 切换全部收起状态
  toggleAllCollapse: function() {
    const isAllCollapsed = this.data.isAllCollapsed;
    const collapsedSites = {};
    
    if (!isAllCollapsed) {
      // 收起所有
      this.data.sites.forEach(site => {
        if (site.id !== 'recommended') {
          collapsedSites[site.id] = true;
        }
      });
    }
    
    this.setData({
      isAllCollapsed: !isAllCollapsed,
      collapsedSites: collapsedSites
    });
  },

  // 打开导航排序
  openNavSort: function() {
    wx.navigateTo({
      url: '/pages/settings/navsort'
    });
  },

  // 清理标题中的冗余信息
  cleanTitle: function(title, siteId) {
    if (!title) return '';
    
    // 获取站点配置
    var siteConfig = require('../../config/siteConfig');
    var site = siteConfig.sites.find(function(s) { return s.id === siteId; });
    var siteName = site ? site.name : '';
    
    // 清理规则
    var cleanedTitle = title
      // 去除站点名称
      .replace(new RegExp(siteName + '[-_\\s]*', 'gi'), '')
      // 去除常见的冗余信息
      .replace(/【.*?】/g, '')                          // 去除方括号内容
      .replace(/\[.*?\]/g, '')                        // 去除方括号内容
      .replace(/（.*?）/g, '')                        // 去除圆括号内容
      .replace(/\(.*?\)/g, '')                        // 去除圆括号内容
      .replace(/^\s*\d+\.?\s*/, '')                   // 去除开头的数字序号
      .replace(/\s*-\s*\w+$/, '')                     // 去除结尾的站点信息
      .replace(/\s*_\s*\w+$/, '')                     // 去除结尾的站点信息
      .replace(/\s*\|\s*\w+$/, '')                    // 去除结尾的站点信息
      .replace(/^\s*•\s*/, '')                        // 去除开头的点
      .replace(/^\s*◦\s*/, '')                        // 去除开头的圆点
      .replace(/^\s*\*\s*/, '')                       // 去除开头的星号
      .replace(/^\s*▪\s*/, '')                        // 去除开头的方块
      .replace(/\s{2,}/g, ' ')                        // 合并多个空格
      .trim();
    
    // 如果清理后为空，返回原标题
    if (!cleanedTitle) {
      return title;
    }
    
    return cleanedTitle;
  },

  // 格式化时间
  formatTime: function(time) {
    if (!time) return '';
    
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) { // 1天内
      return Math.floor(diff / 3600000) + '小时前';
    } else {
      return date.toLocaleDateString();
    }
  }
});