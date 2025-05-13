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
  onShareAppMessage() {

  },

  loadSiteData: function() {
    if (this.data.isLoading) return;

    var that = this;
    that.setData({ isLoading: true });

    app.getAllHotItems()
      .then(function(result) {
        var siteId = that.data.site.id;
        var siteItems = result.hotItemsBySite[siteId] || [];
        
        // 计算站点统计信息
        var stats = that.calculateSiteStats(siteItems);
        
        // 只显示第一页数据
        var currentItems = siteItems.slice(0, that.data.itemsPerPage);
        
        that.setData({
          hotItems: currentItems,
          lastUpdated: result.lastUpdated,
          siteStats: stats,
          showAllItems: siteItems.length <= that.data.itemsPerPage,
          currentPage: 1
        });
      })
      .catch(function(error) {
        console.error('加载站点数据失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      })
      .finally(function() {
        that.setData({ isLoading: false });
        wx.stopPullDownRefresh();
      });
  },

  refreshData: function() {
    this.loadSiteData();
  },

  loadMoreItems: function() {
    var that = this;
    that.setData({ isLoading: true });

    app.getAllHotItems()
      .then(function(result) {
        var siteId = that.data.site.id;
        var allItems = result.hotItemsBySite[siteId] || [];
        var nextPage = that.data.currentPage + 1;
        var startIndex = (nextPage - 1) * that.data.itemsPerPage;
        var endIndex = startIndex + that.data.itemsPerPage;
        var newItems = allItems.slice(startIndex, endIndex);

        if (newItems.length > 0) {
          that.setData({
            hotItems: that.data.hotItems.concat(newItems),
            currentPage: nextPage,
            showAllItems: endIndex >= allItems.length
          });
        } else {
          that.setData({ showAllItems: true });
        }
      })
      .catch(function(error) {
        console.error('加载更多数据失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      })
      .finally(function() {
        that.setData({ isLoading: false });
      });
  },

  calculateSiteStats: function(items) {
    if (!items || items.length === 0) {
      return {
        totalItems: 0,
        avgHotValue: 0,
        updateFrequency: 0
      };
    }

    // 计算平均热度
    var totalHot = items.reduce(function(sum, item) {
      return sum + (parseInt(item.hot) || 0);
    }, 0);
    var avgHot = Math.round(totalHot / items.length);

    // 计算更新频率（基于最近更新时间）
    var now = new Date();
    var latestUpdate = new Date(items[0].publishTime);
    var hoursDiff = (now - latestUpdate) / (1000 * 60 * 60);
    var updateFreq = hoursDiff < 1 ? '1小时内' : 
                    hoursDiff < 24 ? Math.round(hoursDiff) + '小时' :
                    Math.round(hoursDiff / 24) + '天';

    return {
      totalItems: items.length,
      avgHotValue: avgHot,
      updateFrequency: updateFreq
    };
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
  }
})