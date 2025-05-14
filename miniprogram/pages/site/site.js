// pages/site/site.js
var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    site: null,
    hotItems: [],
    isLoading: false,
    lastUpdated: null,
    showAllItems: false,
    itemsPerPage: 20,
    currentPage: 1,
    siteStats: {
      totalItems: 0,
      avgHotValue: 0,
      updateFrequency: 0
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    // 获取传入的站点ID
    var siteId = options.siteId;
    if (siteId) {
      // 从全局数据中查找站点信息
      var site = app.globalData.sites.find(function(s) {
        return s.id === siteId;
      });
      if (site) {
        that.setData({ site: site });
        that.loadSiteData();
      } else {
        wx.showToast({
          title: '站点不存在',
          icon: 'none'
        });
        setTimeout(function() {
          wx.navigateBack();
        }, 1500);
      }
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 每次显示页面时刷新数据
    if (this.data.site) {
      this.loadSiteData();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.refreshData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    // 加载更多数据
    if (!this.data.showAllItems && !this.data.isLoading) {
      this.loadMoreItems();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    var site = this.data.site;
    return {
      title: site.name + '热点榜单',
      path: '/pages/site/site?siteId=' + site.id
    };
  },

  loadSiteData: function() {
    if (this.data.isLoading) return;

    var that = this;
    that.setData({ isLoading: true });

    // 从全局数据获取热点数据
    var hotItems = app.globalData.hotItemsBySite[that.data.site.id] || [];
    console.log('加载站点数据:', that.data.site.id, hotItems);

    var currentPage = that.data.currentPage;
    var itemsPerPage = that.data.itemsPerPage;
    var displayItems = hotItems.slice(0, currentPage * itemsPerPage);

    // 计算站点统计信息
    var totalItems = hotItems.length;
    var avgHotValue = 0;
    if (totalItems > 0) {
      var totalHot = hotItems.reduce(function(sum, item) {
        return sum + (parseInt(item.hot) || 0);
      }, 0);
      avgHotValue = Math.floor(totalHot / totalItems);
    }

    // 计算更新频率（假设每5分钟更新一次）
    var updateFrequency = '5分钟';

    that.setData({
      hotItems: displayItems,
      showAllItems: displayItems.length >= totalItems,
      lastUpdated: app.globalData.lastUpdated,
      isLoading: false,
      siteStats: {
        totalItems: totalItems,
        avgHotValue: avgHotValue,
        updateFrequency: updateFrequency
      }
    }, function() {
      console.log('站点数据更新完成:', that.data.hotItems);
    });

    wx.stopPullDownRefresh();
  },

  refreshData: function() {
    var that = this;
    that.setData({ isLoading: true });

    // 重新加载全局数据
    app.initData()
      .then(function() {
        that.loadSiteData();
      })
      .catch(function(error) {
        console.error('刷新数据失败:', error);
        wx.showToast({
          title: '刷新失败',
          icon: 'none'
        });
        that.setData({ isLoading: false });
        wx.stopPullDownRefresh();
      });
  },

  loadMoreItems: function() {
    var that = this;
    var currentPage = that.data.currentPage + 1;
    that.setData({ currentPage: currentPage });
    that.loadSiteData();
  },

  handleItemClick: function(e) {
    var item = e.currentTarget.dataset.item;
    // 直接跳转到web-view页面
    wx.navigateTo({
      url: '/pages/webview/webview?url=' + encodeURIComponent(item.url) + '&title=' + encodeURIComponent(item.title)
    });
  },

  formatTime: function(date) {
    if (!date) return '';
    var d = new Date(date);
    var now = new Date();
    var diff = now - d;
    var minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return minutes + '分钟前';
    
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + '小时前';
    
    var days = Math.floor(hours / 24);
    if (days < 30) return days + '天前';
    
    return d.getFullYear() + '-' + 
           String(d.getMonth() + 1).padStart(2, '0') + '-' + 
           String(d.getDate()).padStart(2, '0');
  },

  // 分享站点
  shareSite: function() {
    var site = this.data.site;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
})