var app = getApp();

Page({
  data: {
    settings: {
      itemsPerSite: 10,
      showSummary: true,
      showTime: true,
      showHot: true,
      theme: 'light',
      refreshInterval: 5
    },
    refreshIntervalOptions: [5, 10, 15, 30, 60],
    itemsPerSiteOptions: [5, 10, 15, 20, 30],
    itemsPerSiteLabels: ['5条', '10条', '15条', '20条', '30条'],
    tempItemsPerSite: null // 用于存储拖动时的临时值
  },

  onLoad: function() {
    var that = this;
    // 从全局数据加载设置
    var globalSettings = app.globalData.settings || {};
    var settings = {
      itemsPerSite: globalSettings.itemsPerSite || 10,
      showSummary: globalSettings.showSummary !== false,
      showTime: globalSettings.showTime !== false,
      showHot: globalSettings.showHot !== false,
      theme: globalSettings.theme || 'light',
      refreshInterval: globalSettings.refreshInterval || 5
    };
    that.setData({ 
      settings: settings,
      tempItemsPerSite: settings.itemsPerSite
    });
  },

  onShow: function() {
    // 每次显示页面时重新加载设置
    var that = this;
    var globalSettings = app.globalData.settings || {};
    that.setData({
      'settings.itemsPerSite': globalSettings.itemsPerSite || 10,
      'settings.showSummary': globalSettings.showSummary !== false,
      'settings.showTime': globalSettings.showTime !== false,
      'settings.showHot': globalSettings.showHot !== false,
      'settings.theme': globalSettings.theme || 'light',
      'settings.refreshInterval': globalSettings.refreshInterval || 5,
      tempItemsPerSite: globalSettings.itemsPerSite || 10
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
    app.saveSettings(that.data.settings);
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
            itemsPerSite: 10,
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
  }
}); 