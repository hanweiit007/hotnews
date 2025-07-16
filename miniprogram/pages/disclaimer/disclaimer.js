Page({
  data: {
    version: '1.0.0',
    updateDate: '2024-12-13'
  },

  onLoad: function() {
    // 页面加载逻辑
  },

  // 复制邮箱地址
  copyEmail: function() {
    wx.setClipboardData({
      data: 'support@hotnews.com',
      success: function() {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        });
      }
    });
  },

  // 返回首页
  goHome: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '热点新闻 - 多平台热点聚合',
      path: '/pages/disclaimer/disclaimer'
    };
  }
});