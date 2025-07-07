var app = getApp();
const COLS = 3; // 宫格列数
Page({
  data: {
    mySites: [], // 我的站点
    allSites: [], // 全部站点
    isEdit: false
  },
  onLoad() {
    const allSitesRaw = (app.globalData.sites || []).filter(s => s.id !== 'recommended');
    const order = app.globalData.settings.siteOrder || [];
    const mySites = order.map(id => allSitesRaw.find(s => s.id === id)).filter(Boolean);
    const allSites = allSitesRaw.filter(s => order.indexOf(s.id) === -1);
    this.setData({ mySites, allSites });
  },
  toggleEdit() {
    if (this.data.isEdit && this.data.mySites.length === 0) {
      wx.showToast({
        title: '我的站点不能为空',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    this.setData({ isEdit: !this.data.isEdit });
    if (!this.data.isEdit) {
      // 保存排序
      const order = this.data.mySites.map(s => s.id);
      app.globalData.settings.siteOrder = order;
      app.saveSettings(app.globalData.settings);
      const pages = getCurrentPages();
      const indexPage = pages.find(page => page.route === 'pages/index/index');
      if (indexPage && typeof indexPage.loadData === 'function') {
        indexPage.loadData();
      }
      wx.navigateBack();
    }
  },
  removeFromMySites(e) {
    const id = e.currentTarget.dataset.id;
    let mySites = this.data.mySites.slice();
    let allSites = this.data.allSites.slice();
    const idx = mySites.findIndex(s => s.id === id);
    if (idx !== -1) {
      const [site] = mySites.splice(idx, 1);
      allSites.unshift(site);
      this.setData({ mySites, allSites });
    }
  },
  addToMySites(e) {
    const id = e.currentTarget.dataset.id;
    let mySites = this.data.mySites.slice();
    let allSites = this.data.allSites.slice();
    const idx = allSites.findIndex(s => s.id === id);
    if (idx !== -1) {
      const [site] = allSites.splice(idx, 1);
      mySites.push(site);
      this.setData({ mySites, allSites });
    }
  }
}); 