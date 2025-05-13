// index.js
var app = getApp()

Page({
  data: {
    sites: [],
    hotItemsBySite: {},
    isLoading: false,
    lastUpdated: null,
    selectedSite: null,
    groupedHotItems: {},
    itemsPerSite: null
  },

  onLoad: function() {
    this.loadData()
  },

  onShow: function() {
    // 每次显示页面时检查设置是否改变
    var currentItemsPerSite = app.globalData.settings.itemsPerSite
    if (this.data.itemsPerSite !== currentItemsPerSite) {
      this.setData({ itemsPerSite: currentItemsPerSite })
      this.loadData()
    }
  },

  onPullDownRefresh: function() {
    this.refreshData()
  },

  loadData: function() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })
    var that = this
    
    app.getAllHotItems(app.globalData.settings.itemsPerSite)
      .then(function(result) {
        // 处理站点数据，添加图标
        var sites = result.sites.map(function(site) {
          return {
            id: site.id,
            name: site.name,
            mcpId: site.mcpId,
            icon: that.getSiteIcon(site.id)
          }
        })

        // 如果没有选中的站点，默认选中第一个站点
        var selectedSite = that.data.selectedSite
        if (!selectedSite && sites.length > 0) {
          selectedSite = sites[0]
        }

        that.setData({
          sites: sites,
          hotItemsBySite: result.hotItemsBySite,
          lastUpdated: result.lastUpdated,
          itemsPerSite: app.globalData.settings.itemsPerSite,
          groupedHotItems: result.hotItemsBySite,
          selectedSite: selectedSite
        })
      })
      .catch(function(error) {
        console.error('加载数据失败:', error)
        wx.showToast({
          title: '加载数据失败',
          icon: 'none'
        })
      })
      .finally(function() {
        that.setData({ isLoading: false })
      })
  },

  refreshData: function() {
    this.setData({ isLoading: true })
    const that = this
    
    app.refreshData()
      .then(function(result) {
        // 处理站点数据，添加图标
        const sites = result.sites.map(function(site) {
          return {
            id: site.id,
            name: site.name,
            mcpId: site.mcpId,
            icon: that.getSiteIcon(site.id)
          }
        })

        that.setData({
          sites: sites,
          hotItemsBySite: result.hotItemsBySite,
          lastUpdated: result.lastUpdated,
          groupedHotItems: result.hotItemsBySite // 直接使用 hotItemsBySite，因为它已经是按站点分组的
        })
      })
      .catch(function(error) {
        console.error('刷新数据失败:', error)
        wx.showToast({
          title: '刷新失败',
          icon: 'none'
        })
      })
      .finally(function() {
        that.setData({ isLoading: false })
        wx.stopPullDownRefresh()
      })
  },

  // 获取站点图标
  getSiteIcon: function(siteId) {
    const iconMap = {
      'zhihu': '知',
      'weibo': '微',
      'baidu': '百',
      'bilibili': 'B',
      'douyin': '抖',
      'hupu': '虎',
      'douban': '豆',
      '36kr': '氪',
      'itnews': 'IT'
    }
    return iconMap[siteId] || siteId.charAt(0).toUpperCase()
  },

  handleSiteSelect: function(e) {
    const site = e.currentTarget.dataset.site
    this.setData({ selectedSite: site })
  },

  handleItemClick: function(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '跳转到原文',
      content: '即将跳转到原文链接，是否继续？',
      success: function(res) {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/detail/detail?id=' + item.id + '&url=' + encodeURIComponent(item.url)
          })
        }
      }
    })
  },

  formatTime: function(date) {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return minutes + '分钟前'
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return hours + '小时前'
    
    const days = Math.floor(hours / 24)
    if (days < 30) return days + '天前'
    
    return d.getFullYear() + '-' + 
           String(d.getMonth() + 1).padStart(2, '0') + '-' + 
           String(d.getDate()).padStart(2, '0')
  }
}) 