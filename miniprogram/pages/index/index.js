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
    recommendedItemsPerSite: 3,
    siteItemsPerSite: 10,
    scrollLeft: 0,
    collapsedSites: {}, // 存储每个站点的折叠状态
    isAllCollapsed: false // 存储全部折叠状态
  },

  onLoad: function() {
    this.loadData()
  },

  onShow: function() {
    // 每次显示页面时检查设置是否改变
    var settings = app.globalData.settings || {}
    var currentRecommendedItems = settings.recommendedItemsPerSite || 3
    var currentSiteItems = settings.siteItemsPerSite || 10
    
    if (this.data.recommendedItemsPerSite !== currentRecommendedItems || 
        this.data.siteItemsPerSite !== currentSiteItems) {
      this.setData({ 
        recommendedItemsPerSite: currentRecommendedItems,
        siteItemsPerSite: currentSiteItems
      })
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
    
    // 获取当前设置
    var settings = app.globalData.settings || {}
    var itemsPerSite = settings.siteItemsPerSite || 10
    
    app.getAllHotItems(itemsPerSite)
      .then(function(result) {
        if (!result || !result.sites || !Array.isArray(result.sites)) {
          throw new Error('数据格式错误')
        }

        // 处理站点数据，添加图标和排序
        var sites = result.sites.map(function(site) {
          return {
            id: site.id,
            name: site.name,
            mcpId: site.mcpId,
            icon: that.getSiteIcon(site.id),
            pinned: (settings.pinnedSites || []).indexOf(site.id) !== -1
          }
        })

        // 添加推荐选项
        sites.unshift({
          id: 'recommended',
          name: '推荐',
          icon: '🔥',
          pinned: true
        })

        // 根据置顶状态和配置顺序排序
        sites.sort(function(a, b) {
          if (a.pinned !== b.pinned) return b.pinned - a.pinned
          var siteOrder = settings.siteOrder || []
          var orderA = siteOrder.indexOf(a.id)
          var orderB = siteOrder.indexOf(b.id)
          if (orderA === -1) orderA = 999
          if (orderB === -1) orderB = 999
          return orderA - orderB
        })

        // 如果没有选中的站点，默认选中推荐
        var selectedSite = that.data.selectedSite
        if (!selectedSite) {
          selectedSite = sites[0] // 推荐选项
        }

        // 更新全局数据
        app.globalData.sites = sites
        app.globalData.hotItemsBySite = result.hotItemsBySite
        app.globalData.lastUpdated = result.lastUpdated

        // 确保热点数据正确格式化
        var groupedHotItems = {}
        if (result.hotItemsBySite) {
          Object.keys(result.hotItemsBySite).forEach(function(siteId) {
            groupedHotItems[siteId] = result.hotItemsBySite[siteId].map(function(item, index) {
              return {
                ...item,
                rank: index + 1
              }
            })
          })
        }

        that.setData({
          sites: sites,
          hotItemsBySite: result.hotItemsBySite || {},
          lastUpdated: result.lastUpdated || new Date().toISOString(),
          groupedHotItems: groupedHotItems,
          selectedSite: selectedSite,
          recommendedItemsPerSite: settings.recommendedItemsPerSite || 3,
          siteItemsPerSite: settings.siteItemsPerSite || 10
        })

        // 计算滚动位置
        that.updateScrollPosition()
      })
      .catch(function(error) {
        console.error('加载数据失败:', error)
        wx.showToast({
          title: '加载数据失败',
          icon: 'none',
          duration: 2000
        })
      })
      .finally(function() {
        that.setData({ isLoading: false })
      })
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
        that.setData({ isLoading: false })
        wx.stopPullDownRefresh()
      })
  },

  // 获取站点图标
  getSiteIcon: function(siteId) {
    var iconMap = {
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

  // 处理站点选择
  handleSiteSelect: function(e) {
    var site = e.currentTarget.dataset.site;
    this.setData({ selectedSite: site });
  },

  // 更新滚动位置
  updateScrollPosition: function() {
    var that = this
    var query = wx.createSelectorQuery()
    query.select('.nav-items').boundingClientRect()
    query.select('.nav-item.active').boundingClientRect()
    query.exec(function(res) {
      if (res[0] && res[1]) {
        var containerWidth = res[0].width
        var itemLeft = res[1].left
        var itemWidth = res[1].width
        var scrollLeft = itemLeft - (containerWidth - itemWidth) / 2
        that.setData({ scrollLeft: scrollLeft })
      }
    })
  },

  // 阻止事件冒泡
  stopPropagation: function() {},

  // 切换站点置顶状态
  togglePinSite: function(e) {
    var site = e.currentTarget.dataset.site
    var sites = this.data.sites
    var index = sites.findIndex(function(s) { return s.id === site.id })
    if (index !== -1) {
      sites[index].pinned = !sites[index].pinned
      this.setData({ sites: sites })
      
      // 更新全局设置
      var pinnedSites = app.globalData.settings.pinnedSites || []
      if (sites[index].pinned) {
        if (pinnedSites.indexOf(site.id) === -1) {
          pinnedSites.push(site.id)
        }
      } else {
        var pinIndex = pinnedSites.indexOf(site.id)
        if (pinIndex !== -1) {
          pinnedSites.splice(pinIndex, 1)
        }
      }
      app.globalData.settings.pinnedSites = pinnedSites
      app.saveSettings()
      
      // 重新排序
      this.loadData()
    }
  },

  handleItemClick: function(e) {
    var item = e.currentTarget.dataset.item;
    // 直接跳转到web-view页面
    wx.navigateTo({
      url: '/pages/webview/webview?url=' + encodeURIComponent(item.url) + '&title=' + encodeURIComponent(item.title)
    });
  },

  formatTime: function(date) {
    if (!date) return ''
    var d = new Date(date)
    var now = new Date()
    var diff = now - d
    var minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return minutes + '分钟前'
    
    var hours = Math.floor(minutes / 60)
    if (hours < 24) return hours + '小时前'
    
    var days = Math.floor(hours / 24)
    if (days < 30) return days + '天前'
    
    return d.getFullYear() + '-' + 
           String(d.getMonth() + 1).padStart(2, '0') + '-' + 
           String(d.getDate()).padStart(2, '0')
  },

  // 切换站点折叠状态
  toggleSiteCollapse: function(e) {
    const siteId = e.currentTarget.dataset.siteId;
    const collapsedSites = this.data.collapsedSites;
    collapsedSites[siteId] = !collapsedSites[siteId];
    this.setData({ collapsedSites });
  },

  // 切换所有站点折叠状态
  toggleAllSites: function() {
    const isCollapse = !this.data.isAllCollapsed;
    const collapsedSites = {};
    this.data.sites.forEach(site => {
      if (site.id !== 'recommended') {
        collapsedSites[site.id] = isCollapse;
      }
    });
    this.setData({ 
      collapsedSites,
      isAllCollapsed: isCollapse
    });
  },

  openNavSort: function() {
    wx.navigateTo({ url: '/pages/settings/navsort' });
  },

  onAllSitesBtnTap: function(e) {
    e.stopPropagation();
    this.toggleAllSites();
  },
}) 