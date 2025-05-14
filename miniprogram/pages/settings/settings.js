var app = getApp();

Page({
  data: {
    settings: {
      itemsPerSite: 50,
      pinnedSites: [],
      siteOrder: [],
      showSummary: true,
      showTime: true,
      showHot: true,
      theme: 'light',
      refreshInterval: 5
    },
    refreshIntervalOptions: [5, 10, 15, 30, 60],
    itemsPerSiteOptions: [5, 10, 15, 20, 30],
    itemsPerSiteLabels: ['5条', '10条', '15条', '20条', '30条'],
    tempItemsPerSite: null, // 用于存储拖动时的临时值
    recommendedItemsPerSite: 3,
    siteItemsPerSite: 10,
    autoRefresh: true,
    darkMode: false,
    version: '1.0.0'
  },

  onLoad: function() {
    var that = this;
    // 从全局数据加载设置
    var globalSettings = app.globalData.settings || {};
    var settings = {
      itemsPerSite: globalSettings.itemsPerSite || 50,
      pinnedSites: globalSettings.pinnedSites || [],
      siteOrder: globalSettings.siteOrder || [],
      showSummary: globalSettings.showSummary !== false,
      showTime: globalSettings.showTime !== false,
      showHot: globalSettings.showHot !== false,
      theme: globalSettings.theme || 'light',
      refreshInterval: globalSettings.refreshInterval || 5
    };
    that.setData({ 
      settings: settings,
      tempItemsPerSite: settings.itemsPerSite,
      recommendedItemsPerSite: globalSettings.recommendedItemsPerSite || 3,
      siteItemsPerSite: globalSettings.siteItemsPerSite || 10,
      autoRefresh: globalSettings.autoRefresh !== false,
      darkMode: globalSettings.darkMode || false
    });
  },

  onShow: function() {
    // 每次显示页面时重新加载设置
    var that = this;
    var globalSettings = app.globalData.settings || {};
    that.setData({
      'settings.itemsPerSite': globalSettings.itemsPerSite || 50,
      'settings.pinnedSites': globalSettings.pinnedSites || [],
      'settings.siteOrder': globalSettings.siteOrder || [],
      'settings.showSummary': globalSettings.showSummary !== false,
      'settings.showTime': globalSettings.showTime !== false,
      'settings.showHot': globalSettings.showHot !== false,
      'settings.theme': globalSettings.theme || 'light',
      'settings.refreshInterval': globalSettings.refreshInterval || 5,
      tempItemsPerSite: globalSettings.itemsPerSite || 50,
      recommendedItemsPerSite: globalSettings.recommendedItemsPerSite || 3,
      siteItemsPerSite: globalSettings.siteItemsPerSite || 10,
      autoRefresh: globalSettings.autoRefresh !== false,
      darkMode: globalSettings.darkMode || false
    });
  },

  onItemsPerSiteChanging: function(e) {
    // 拖动时实时更新预览
    var that = this;
    var value = parseInt(e.detail.value);
    var tempValue = that.data.itemsPerSiteOptions[value];
    that.setData({
      tempItemsPerSite: tempValue
    });
  },

  onItemsPerSiteChange: function(e) {
    var that = this;
    var value = parseInt(e.detail.value);
    var settings = that.data.settings;
    settings.itemsPerSite = that.data.itemsPerSiteOptions[value];
    that.setData({ 
      settings: settings,
      tempItemsPerSite: settings.itemsPerSite
    });
    that.saveSettings();
  },

  applyTheme: function(theme) {
    var container = wx.createSelectorQuery().select('.container');
    if (theme === 'dark') {
      container.addClass('dark-theme');
    } else {
      container.removeClass('dark-theme');
    }
  },

  onShowSummaryChange: function(e) {
    var that = this;
    var settings = that.data.settings;
    settings.showSummary = e.detail.value;
    that.setData({ settings: settings });
    that.saveSettings();
  },

  onShowTimeChange: function(e) {
    var that = this;
    var settings = that.data.settings;
    settings.showTime = e.detail.value;
    that.setData({ settings: settings });
    that.saveSettings();
  },

  onShowHotChange: function(e) {
    var that = this;
    var settings = that.data.settings;
    settings.showHot = e.detail.value;
    that.setData({ settings: settings });
    that.saveSettings();
  },

  onThemeChange: function(e) {
    var that = this;
    var settings = that.data.settings;
    settings.theme = e.detail.value;
    that.setData({ settings: settings });
    that.saveSettings();
  },

  onRefreshIntervalChange: function(e) {
    var that = this;
    var value = parseInt(e.detail.value);
    var settings = that.data.settings;
    settings.refreshInterval = that.data.refreshIntervalOptions[value];
    that.setData({ settings: settings });
    that.saveSettings();
  },

  saveSettings: function() {
    var that = this;
    // 合并所有设置
    var settings = {
      ...that.data.settings,
      recommendedItemsPerSite: that.data.recommendedItemsPerSite,
      siteItemsPerSite: that.data.siteItemsPerSite,
      autoRefresh: that.data.autoRefresh,
      darkMode: that.data.darkMode
    };
    
    app.globalData.settings = settings;
    app.saveSettings(settings);
    
    // 通知首页更新设置
    var pages = getCurrentPages();
    var indexPage = pages.find(function(page) {
      return page.route === 'pages/index/index';
    });
    if (indexPage) {
      indexPage.loadData();
    }
    
    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 2000
    });
  },

  resetSettings: function() {
    var that = this;
    wx.showModal({
      title: '确认重置',
      content: '确定要恢复默认设置吗？',
      success: function(res) {
        if (res.confirm) {
          var defaultSettings = {
            itemsPerSite: 50,
            pinnedSites: [],
            siteOrder: [],
            showSummary: true,
            showTime: true,
            showHot: true,
            theme: 'light',
            refreshInterval: 5
          };
          that.setData({ settings: defaultSettings });
          app.saveSettings(defaultSettings);
          wx.showToast({
            title: '已恢复默认设置',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },

  // 更新每站显示数量
  updateItemsPerSite: function(e) {
    var value = parseInt(e.detail.value);
    if (value > 0) {
      this.setData({
        'settings.itemsPerSite': value
      });
      app.globalData.settings.itemsPerSite = value;
      app.saveSettings();
    }
  },

  // 清除缓存
  clearCache: function() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          app.globalData.hotItemsBySite = {};
          app.globalData.lastUpdated = null;
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 关于
  showAbout: function() {
    wx.showModal({
      title: '关于',
      content: '热点新闻小程序 v1.0.0\n\n聚合多个平台的热点新闻，实时更新。',
      showCancel: false
    });
  },

  // 处理推荐模式热点数量变化
  handleRecommendedItemsChange: function(e) {
    var value = e.detail.value
    this.setData({
      recommendedItemsPerSite: value
    })
    this.saveSettings()
  },

  // 处理站点模式热点数量变化
  handleSiteItemsChange: function(e) {
    var value = e.detail.value
    this.setData({
      siteItemsPerSite: value
    })
    this.saveSettings()
  },

  // 处理自动刷新开关变化
  handleAutoRefreshChange: function(e) {
    this.setData({
      autoRefresh: e.detail.value
    })
    this.saveSettings()
  },

  // 处理深色模式开关变化
  handleDarkModeChange: function(e) {
    this.setData({
      darkMode: e.detail.value
    })
    this.saveSettings()
  }
}); 