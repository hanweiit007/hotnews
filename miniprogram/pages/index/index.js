// index.js
var app = getApp()
const util = require('../../utils/util.js') // 导入工具函数
const siteConfig = require('../../config/siteConfig');

Page({
  data: {
    sites: [],
    isLoading: false,
    // 删除此行: hasData: false, // 添加数据状态标记
    lastUpdated: null,
    selectedSite: null,
    groupedHotItems: {},
    recommendedItemsPerSite: 3,
    siteItemsPerSite: 10,
    collapsedSites: {}, 
    isAllCollapsed: false 
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    // 如果没有数据，重新加载
    if (!this.data.sites || this.data.sites.length === 0) {
      this.loadData();
    }
  },

  onPullDownRefresh: function() {
    this.refreshData();
  },

  loadData: function() {
    if (this.data.isLoading) return

    this.setData({
      isLoading: true
      // 删除此行: hasData: false,
      // 删除此行: groupedHotItems: {}
    })
    var that = this
    
    // 删除以下代码块
    // 清空之前的数据，确保骨架屏能正确显示
    // this.setData({
    //   groupedHotItems: {}
    // })
    
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
          };
        });

        // 推荐始终固定在第一个
        if (!sites.length || sites[0].id !== 'recommended') {
          sites.unshift({
            id: 'recommended',
            name: '推荐',
            icon: '🔥',
            pinned: true
          })
        }

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

        // 确保热点数据正确格式化
        // 在loadData方法的成功回调中添加默认值处理
        var groupedHotItems = {};
        // 修改此行，确保即使result.hotItemsBySite为空也能正确初始化
        if (result.hotItemsBySite) {
          Object.keys(result.hotItemsBySite).forEach(function(siteId) {
            groupedHotItems[siteId] = result.hotItemsBySite[siteId].map(function(item, index) {
              return {
                ...item,
                rank: index + 1
              };
            });
          });
        } else {
          // 添加空数据处理
          sites.forEach(site => {
            if (site.id !== 'recommended') {
              groupedHotItems[site.id] = [];
            }
          });
        }

        // 删除这行代码 - 这会清空推荐数据
        // if (groupedHotItems) {
        //   groupedHotItems.recommended = [];
        // }

        var selectedSite = that.data.selectedSite || sites[0];

        // 更新全局数据
        app.globalData.sites = sites
        app.globalData.hotItemsBySite = result.hotItemsBySite
        app.globalData.lastUpdated = result.lastUpdated

        that.setData({
          sites: sites,
          recommendedSite: sites[0],
          otherSites: sites.slice(1),
          hotItemsBySite: result.hotItemsBySite || {},
          lastUpdated: result.lastUpdated || new Date().toISOString(),
          groupedHotItems: groupedHotItems,
          selectedSite: selectedSite,
          recommendedItemsPerSite: settings.recommendedItemsPerSite || 3,
          siteItemsPerSite: settings.siteItemsPerSite || 10
        });

        // 计算滚动位置
        that.updateScrollPosition();
      }).catch(function(error) {
        console.error('加载数据失败:', error);
        wx.showToast({
          title: '加载数据失败',
          icon: 'none',
          duration: 2000
        });
        // 删除此行: that.setData({ hasData: true });
      }).finally(function() {
        that.setData({ isLoading: false
          // 删除此行: , hasData: true 
        });
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
        wx.stopPullDownRefresh();
      })
  },

  // 获取站点图标
  getSiteIcon: function(siteId) {
    const site = siteConfig.sites.find(s => s.id === siteId);
    return site ? site.icon : '?';
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

  // 删除或重命名原handleItemClick函数
  // 原webview使用的
  // handleItemClick: function(e) {
  //   var item = e.currentTarget.dataset.item;
  //   // 直接跳转到web-view页面
  //   wx.navigateTo({
  //     url: '/pages/webview/webview?url=' + encodeURIComponent(item.url) + '&title=' + encodeURIComponent(item.title)
  //   });
  // },

  // rich-text使用的
  onItemClick: function(e) {
    const item = e.currentTarget.dataset.item;
    if (item) {
      // 替换为跳转到文章内容页面，传递url参数
      wx.navigateTo({
        url: `/pages/article/article?url=${encodeURIComponent(item.url)}`
      });
    }
  },

  formatTime: function(date) {
    return util.formatTime(date); // 使用工具函数
  },

  // 切换站点折叠状态
  toggleSiteCollapse: function(e) {
    const siteId = e.currentTarget.dataset.siteId;
    // 一定要新建对象，避免引用问题
    const collapsedSites = { ...this.data.collapsedSites };
    collapsedSites[siteId] = !collapsedSites[siteId];
    this.setData({ collapsedSites });
  },

  // 切换所有站点折叠状态
  toggleAllSites: function() {
    const isCollapse = !this.data.isAllCollapsed;
    const collapsedSites = {};
    // 只折叠9个实际站点，不包含推荐
    this.data.sites.forEach(site => {
      if (site.id !== 'recommended' && this.data.groupedHotItems[site.id]) {
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
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    this.toggleAllSites();
  },
})