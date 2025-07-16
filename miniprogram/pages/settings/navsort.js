var app = getApp();
Page({
  data: {
    mySites: [], // 我的站点
    allSites: [], // 全部站点
    isEdit: false // 是否处于编辑模式
  },
  
  onLoad() {
    console.log('排序页面加载');
    this.loadSiteData();
  },
  
  // 加载站点数据
  loadSiteData() {
    const allSitesRaw = (app.globalData.sites || []).filter(s => s.id !== 'recommended');
    const order = app.globalData.settings.siteOrder || [];
    
    // 按照用户设置的顺序排列我的站点
    const mySites = order.map(id => allSitesRaw.find(s => s.id === id)).filter(Boolean);
    
    // 剩余的站点放到全部站点中
    const allSites = allSitesRaw.filter(s => order.indexOf(s.id) === -1);
    
    console.log('我的站点:', mySites);
    console.log('全部站点:', allSites);
    
    this.setData({ 
      mySites, 
      allSites 
    });
  },
  
  // 切换编辑模式
  toggleEdit() {
    // 如果要退出编辑模式，检查是否有站点
    if (this.data.isEdit && this.data.mySites.length === 0) {
      wx.showModal({
        title: '温馨提示',
        content: '至少需要保留一个站点才能保存设置',
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#ff6b6b'
      });
      return;
    }
    
    const newEditState = !this.data.isEdit;
    this.setData({ isEdit: newEditState });
    
    // 如果退出编辑模式，保存设置
    if (!newEditState) {
      this.saveSettings();
    }
    
    // 提供触觉反馈
    wx.vibrateShort();
  },
  
  // 保存设置
  saveSettings() {
    const order = this.data.mySites.map(s => s.id);
    app.globalData.settings.siteOrder = order;
    app.saveSettings(app.globalData.settings);
    
    // 通知首页更新数据
    const pages = getCurrentPages();
    const indexPage = pages.find(page => page.route === 'pages/index/index');
    if (indexPage && typeof indexPage.loadData === 'function') {
      indexPage.loadData();
    }
    
    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1500
    });
    
    // 延迟返回，让用户看到保存成功的提示
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },
  
  // 从我的站点中移除
  removeFromMySites(e) {
    const id = e.currentTarget.dataset.id;
    let mySites = this.data.mySites.slice();
    let allSites = this.data.allSites.slice();
    
    const idx = mySites.findIndex(s => s.id === id);
    if (idx !== -1) {
      const [site] = mySites.splice(idx, 1);
      allSites.unshift(site); // 添加到全部站点的开头
      
      this.setData({ mySites, allSites });
      
      // 触觉反馈
      wx.vibrateShort();
      
      // 如果移除后没有站点了，给出提示
      if (mySites.length === 0) {
        wx.showToast({
          title: '请至少保留一个站点',
          icon: 'none',
          duration: 2000
        });
      }
    }
  },
  
  // 添加到我的站点
  addToMySites(e) {
    const id = e.currentTarget.dataset.id;
    let mySites = this.data.mySites.slice();
    let allSites = this.data.allSites.slice();
    
    const idx = allSites.findIndex(s => s.id === id);
    if (idx !== -1) {
      const [site] = allSites.splice(idx, 1);
      mySites.push(site); // 添加到我的站点的末尾
      
      this.setData({ mySites, allSites });
      
      // 触觉反馈
      wx.vibrateShort();
      
      wx.showToast({
        title: `已添加 ${site.name}`,
        icon: 'success',
        duration: 1500
      });
    }
  },
  
  // 页面分享
  onShareAppMessage() {
    return {
      title: '热浪聚合 - 站点排序',
      desc: '自定义你的热点源优先级',
      path: '/pages/settings/navsort'
    };
  }
}); 