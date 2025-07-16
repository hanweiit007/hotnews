const app = getApp();
const envConfig = require('../../config/environment');

Page({
  data: {
    title: '',
    content: '',
    loading: true,
    error: false,
    url: '',
    summary: '',
    platformInfo: null,  // 新增：平台信息
    displayMode: 'rich-text', // 新增：当前显示模式
    proxyUrl: '',  // 新增：代理URL（用于webview模式）
    showWebview: false, // 新增：是否显示webview
    showProxyContent: false, // 新增：是否显示代理内容模态框
    proxyHtmlContent: '', // 新增：代理HTML内容
    showModeIndicator: envConfig.isDevelopmentVersion() // 新增：是否显示模式指示器
  },

  onLoad: function(options) {
    console.log('article页面接收到的options:', options);
    
    // 获取用户设置的显示模式
    const displayMode = app.globalData.settings?.displayMode || 'rich-text';
    console.log('当前显示模式:', displayMode);
    
    if (options.url) {
      // URL解码
      const decodedUrl = decodeURIComponent(options.url);
      console.log('原始URL:', options.url);
      console.log('解码后URL:', decodedUrl);
      
      // 识别平台信息
      const platformInfo = this.identifyPlatform(decodedUrl);
      
      this.setData({
        url: decodedUrl,  // 存储解码后的文章URL
        platformInfo: platformInfo,
        displayMode: displayMode
      });
      
      // 根据显示模式选择加载方式
      this.loadContentByMode(displayMode, decodedUrl);
    } else {
      console.error('未收到URL参数');
      this.setData({
        error: true,
        loading: false
      });
    }
  },

  // 新增：根据显示模式加载内容
  loadContentByMode: function(mode, url) {
    console.log('根据显示模式加载内容:', mode, url);
    
    // 检查功能是否启用
    if (mode === 'proxy-webview' && !envConfig.isFeatureEnabled('proxyWebview')) {
      console.warn('代理模式已禁用，降级为富文本模式');
      mode = 'rich-text';
    }
    
    if (mode === 'direct-webview' && !envConfig.isFeatureEnabled('directWebview')) {
      console.warn('直接webview模式已禁用，降级为富文本模式');
      mode = 'rich-text';
    }
    
    switch(mode) {
      case 'rich-text':
        this.loadArticleContent();
        break;
      case 'proxy-webview':
        this.loadProxyWebview(url);
        break;
      case 'direct-webview':
        this.loadDirectWebview(url);
        break;
      default:
        console.warn('未知的显示模式:', mode);
        this.loadArticleContent(); // 默认使用rich-text模式
    }
  },

  // 新增：加载代理webview
  loadProxyWebview: function(url) {
    const that = this;
    
    console.log('使用代理webview模式，原始URL:', url);
    
    // 构建代理URL（使用GET方式）
    const proxyUrl = `${app.globalData.mcpBaseUrl}/api/article-html?url=${encodeURIComponent(url)}`;
    
    console.log('代理URL:', proxyUrl);
    console.log('MCP Base URL:', app.globalData.mcpBaseUrl);
    
    this.setData({
      proxyUrl: proxyUrl,
      loading: false,
      showWebview: false  // 代理模式不使用webview状态
    });
    
    console.log('页面数据设置完成:', {
      proxyUrl: that.data.proxyUrl,
      displayMode: that.data.displayMode,
      loading: that.data.loading
    });
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '网页内容（代理）'
    });
    
    // 立即开始加载代理内容
    this.loadProxyContent();
  },

  // 新增：加载直接webview
  loadDirectWebview: function(url) {
    console.log('使用直接webview模式');
    
    this.setData({
      proxyUrl: url,
      loading: false,
      showWebview: false  // 直接模式也不使用showWebview状态
    });
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '网页内容'
    });
  },

  // 新增：webview事件处理
  onWebviewLoad: function(e) {
    console.log('Webview加载完成:', e);
  },

  onWebviewError: function(e) {
    console.error('Webview加载错误:', e);
    wx.showToast({
      title: 'Webview加载失败',
      icon: 'none',
      duration: 3000
    });
  },

  onWebviewMessage: function(e) {
    console.log('Webview消息:', e);
  },

  // 新增：测试代理URL
  testProxyUrl: function() {
    const url = this.data.proxyUrl;
    console.log('测试代理URL:', url);
    
    wx.request({
      url: url,
      method: 'GET',
      success: function(res) {
        console.log('代理URL测试成功:', res);
        if (res.statusCode === 200) {
          wx.showModal({
            title: '代理URL可访问',
            content: `状态码: ${res.statusCode}\n内容长度: ${res.data.length}字符`,
            showCancel: false
          });
        } else {
          wx.showModal({
            title: '代理URL异常',
            content: `状态码: ${res.statusCode}`,
            showCancel: false
          });
        }
      },
      fail: function(error) {
        console.error('代理URL测试失败:', error);
        wx.showModal({
          title: '代理URL无法访问',
          content: `错误: ${error.errMsg}`,
          showCancel: false
        });
      }
    });
  },

  // 新增：测试简单webview
  testSimpleWebview: function() {
    console.log('测试简单webview - 开始');
    
    const newUrl = 'https://www.baidu.com';
    console.log('准备设置新URL:', newUrl);
    
    this.setData({
      proxyUrl: newUrl
    }, () => {
      console.log('setData回调执行，当前proxyUrl:', this.data.proxyUrl);
    });
    
    console.log('setData调用完成');
    
    wx.showToast({
      title: '已切换到百度',
      icon: 'none',
      duration: 2000
    });
    
    console.log('测试简单webview - 结束');
  },

  // 新增：测试按钮点击
  testButtonClick: function() {
    console.log('测试按钮被点击了！');
    wx.showModal({
      title: '按钮测试',
      content: '按钮点击功能正常',
      showCancel: false
    });
  },

  // 新增：加载代理内容（作为webview的备用方案）
  loadProxyContent: function() {
    const that = this;
    const url = this.data.proxyUrl;
    
    console.log('开始加载代理内容:', url);
    
    // 如果已经显示了，就不要重复显示loading
    if (!this.data.showProxyContent) {
      wx.showLoading({
        title: '加载代理内容...',
        mask: true
      });
    }
    
    wx.request({
      url: url,
      method: 'GET',
      timeout: 15000,
      success: function(res) {
        console.log('代理内容加载成功，状态码:', res.statusCode);
        console.log('内容长度:', res.data.length);
        wx.hideLoading();
        
        if (res.statusCode === 200) {
          console.log('代理HTML加载成功，原始长度:', res.data.length);
          
          // 处理HTML内容以适配rich-text组件
          let htmlContent = res.data;
          if (typeof htmlContent === 'string') {
            try {
              // 提取body内容
              let bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
              if (bodyMatch) {
                htmlContent = bodyMatch[1];
                console.log('成功提取body内容');
              } else {
                // 移除html文档结构标签
                htmlContent = htmlContent
                  .replace(/<!DOCTYPE[^>]*>/i, '')
                  .replace(/<html[^>]*>/i, '')
                  .replace(/<\/html>/i, '')
                  .replace(/<head[^>]*>[\s\S]*?<\/head>/i, '');
                console.log('移除文档结构标签');
              }
              
              // 清理不兼容的标签
              htmlContent = htmlContent
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<!--[\s\S]*?-->/g, '')
                .replace(/<meta[^>]*>/gi, '')
                .replace(/<link[^>]*>/gi, '')
                .trim();
              
              // 限制内容长度
              if (htmlContent.length > 50000) {
                htmlContent = htmlContent.substring(0, 50000) + '<p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">内容过长已截取，完整内容请访问原网页</p>';
                console.log('内容已截取至50000字符');
              }
              
              console.log('HTML处理完成，最终长度:', htmlContent.length);
              
            } catch (e) {
              console.error('HTML处理失败:', e);
              htmlContent = '<div style="padding: 20px; text-align: center; color: #666;"><h3>内容处理失败</h3><p>无法解析网页内容，请尝试其他显示模式</p></div>';
            }
          } else {
            console.log('HTML内容类型错误:', typeof htmlContent);
            htmlContent = '<div style="padding: 20px; text-align: center; color: #666;"><h3>内容格式错误</h3><p>服务器返回格式不正确</p></div>';
          }
          
          that.setData({
            proxyHtmlContent: htmlContent,
            showProxyContent: true
          });
          
          // 设置页面标题
          wx.setNavigationBarTitle({
            title: '网页内容（代理模式）'
          });
          
          wx.showToast({
            title: '代理内容加载成功',
            icon: 'success',
            duration: 2000
          });
        } else {
          wx.showModal({
            title: '代理服务器错误',
            content: `HTTP状态码: ${res.statusCode}`,
            showCancel: false
          });
        }
      },
      fail: function(error) {
        console.error('代理内容加载失败:', error);
        wx.hideLoading();
        
        let errorMsg = '网络请求失败';
        if (error.errMsg.includes('timeout')) {
          errorMsg = '请求超时，请检查网络连接';
        } else if (error.errMsg.includes('fail')) {
          errorMsg = '无法连接到代理服务器';
        }
        
        wx.showModal({
          title: '代理内容加载失败',
          content: errorMsg,
          confirmText: '重试',
          cancelText: '取消',
          success: function(modalRes) {
            if (modalRes.confirm) {
              // 用户选择重试
              that.loadProxyContent();
            }
          }
        });
      }
    });
  },

  // 新增：关闭代理内容
  closeProxyContent: function() {
    this.setData({
      showProxyContent: false
    });
  },

  // 新增：识别平台信息
  identifyPlatform: function(url) {
    try {
      // 简单的URL解析，兼容小程序环境
      if (url.includes('bilibili.com') || url.includes('b23.tv')) {
        return {
          name: 'B站',
          icon: '📹',
          color: '#fb7299',
          jumpText: '在B站App打开',
          urlScheme: this.getBilibiliUrlScheme(url), // 添加URL Scheme支持
          appId: '', // B站小程序ID，如果有的话
          canJump: true
        };
      } else if (url.includes('zhihu.com')) {
        return {
          name: '知乎',
          icon: '💡',
          color: '#0084ff',
          jumpText: '在知乎App打开',
          urlScheme: this.getZhihuUrlScheme(url), // 添加URL Scheme支持
          appId: '',
          canJump: true
        };
      } else if (url.includes('36kr.com')) {
        return {
          name: '36氪',
          icon: '💼',
          color: '#36b5ff',
          jumpText: '在36氪打开',
          urlScheme: '', // 36氪可能没有URL Scheme
          appId: '',
          canJump: true
        };
      } else if (url.includes('weibo.com')) {
        return {
          name: '微博',
          icon: '📢',
          color: '#ff6b6b',
          jumpText: '在微博App打开',
          urlScheme: this.getWeiboUrlScheme(url), // 添加URL Scheme支持
          appId: '',
          canJump: true
        };
      }
      
      return null; // 不支持的平台
    } catch (error) {
      console.error('平台识别失败:', error);
      return null;
    }
  },

  // 新增：获取B站URL Scheme
  getBilibiliUrlScheme: function(url) {
    try {
      // B站URL Scheme格式：bilibili://video/{bvid} 或 bilibili://
      if (url.includes('b23.tv')) {
        // 短链接直接使用原URL，让B站App处理重定向
        return `bilibili://browser?url=${encodeURIComponent(url)}`;
      } else if (url.includes('/video/')) {
        // 提取BV号
        const bvMatch = url.match(/\/video\/(BV[a-zA-Z0-9]+)/);
        if (bvMatch) {
          return `bilibili://video/${bvMatch[1]}`;
        }
      }
      // 其他情况使用浏览器方式打开
      return `bilibili://browser?url=${encodeURIComponent(url)}`;
    } catch (error) {
      console.error('生成B站URL Scheme失败:', error);
      return '';
    }
  },

  // 新增：获取知乎URL Scheme  
  getZhihuUrlScheme: function(url) {
    try {
      // 知乎URL Scheme格式：zhihu://
      return `zhihu://browser?url=${encodeURIComponent(url)}`;
    } catch (error) {
      console.error('生成知乎URL Scheme失败:', error);
      return '';
    }
  },

  // 新增：获取微博URL Scheme
  getWeiboUrlScheme: function(url) {
    try {
      // 微博URL Scheme格式：sinaweibo://
      return `sinaweibo://browser?url=${encodeURIComponent(url)}`;
    } catch (error) {
      console.error('生成微博URL Scheme失败:', error);
      return '';
    }
  },

  loadArticleContent: function() {
    const that = this;
    
    console.log('开始加载文章内容，当前URL:', this.data.url);
    
    // 设置加载状态
    this.setData({
      loading: true,
      error: false
    });
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    app.getArticleContent(this.data.url)
      .then(function(result) {
        console.log('成功获取文章内容:', result);
        console.log('准备设置页面数据...');
        
        that.setData({
          title: result.title,
          content: result.content,
          summary: result.summary,
          loading: false,
          error: false  // 重要：重置错误状态
        });
        
        console.log('页面数据设置完成，当前状态:', {
          loading: that.data.loading,
          error: that.data.error,
          hasTitle: !!that.data.title,
          hasContent: !!that.data.content
        });
        
        // 设置页面标题
        wx.setNavigationBarTitle({
          title: result.title || '文章详情'
        });
      })
      .catch(function(error) {
        console.error('加载文章内容失败:', error);
        that.setData({
          error: true,
          loading: false
        });
        
        // 显示具体错误信息
        let errorMsg = '加载失败';
        if (error && error.message) {
          errorMsg = error.message;
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        });
      })
      .finally(function() {
        // 确保隐藏loading
        wx.hideLoading();
        // 确保更新loading状态
        that.setData({
          loading: false
        });
      });
  },

  // 新增：跳转到原平台
  jumpToPlatform: function() {
    const that = this;
    const url = this.data.url;
    const platformInfo = this.data.platformInfo;
    
    if (!url) {
      wx.showToast({
        title: '链接无效',
        icon: 'none'
      });
      return;
    }
    
    console.log('准备跳转到平台:', platformInfo);
    
    // 优先尝试使用URL Scheme打开App
    if (platformInfo && platformInfo.urlScheme) {
      console.log('尝试使用URL Scheme打开App:', platformInfo.urlScheme);
      
      wx.showModal({
        title: `打开${platformInfo.name}App`,
        content: `检测到您可能安装了${platformInfo.name}App，是否直接在App中打开？`,
        confirmText: '打开App',
        cancelText: '浏览器打开',
        success: function(res) {
          if (res.confirm) {
            // 用户选择打开App
            that.openWithUrlScheme(platformInfo.urlScheme);
          } else {
            // 用户选择浏览器打开
            that.openInBrowser();
          }
        }
      });
    } else if (platformInfo && platformInfo.appId) {
      // 尝试跳转到对应的小程序（如果有appId）
      wx.navigateToMiniProgram({
        appId: platformInfo.appId,
        success: function(res) {
          console.log('成功跳转到小程序:', res);
        },
        fail: function(error) {
          console.log('跳转小程序失败，使用浏览器打开:', error);
          that.openInBrowser();
        }
      });
    } else {
      // 直接在浏览器中打开
      this.openInBrowser();
    }
  },

  // 新增：使用URL Scheme打开App
  openWithUrlScheme: function(urlScheme) {
    const that = this;
    const url = this.data.url;
    const platformInfo = this.data.platformInfo;
    
    console.log('正在使用URL Scheme打开App:', urlScheme);
    
    // 在微信小程序中，可以尝试使用web-view或者business域名跳转
    // 但由于限制，我们提供多种打开方式供用户选择
    wx.showActionSheet({
      itemList: [
        `在${platformInfo.name}App中打开`,
        '复制链接到剪贴板',
        '在浏览器中打开'
      ],
      itemColor: '#000000',
      success: function(res) {
        switch(res.tapIndex) {
          case 0:
            // 尝试打开App - 复制URL Scheme
            that.copyUrlSchemeWithInstructions(urlScheme, platformInfo.name);
            break;
          case 1:
            // 复制原链接
            that.copyOriginalLink();
            break;
          case 2:
            // 浏览器打开
            that.openInBrowser();
            break;
        }
      },
      fail: function() {
        // 用户取消，降级到浏览器打开
        that.openInBrowser();
      }
    });
  },

  // 新增：复制URL Scheme并提供说明
  copyUrlSchemeWithInstructions: function(urlScheme, appName) {
    const that = this;
    
    wx.setClipboardData({
      data: urlScheme,
      success: function() {
        wx.showModal({
          title: `打开${appName}App`,
          content: `已复制${appName}专用链接！\n\n步骤：\n1. 打开手机浏览器（Safari/Chrome等）\n2. 粘贴链接到地址栏\n3. 访问链接会自动跳转到${appName}App\n\n如果没有安装App，请选择"复制原链接"。`,
          confirmText: '复制原链接',
          cancelText: '知道了',
          success: function(modalRes) {
            if (modalRes.confirm) {
              that.copyOriginalLink();
            }
          }
        });
      },
      fail: function() {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 新增：复制原始链接
  copyOriginalLink: function() {
    const url = this.data.url;
    
    wx.setClipboardData({
      data: url,
      success: function() {
        wx.showToast({
          title: '原链接已复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail: function() {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 新增：在浏览器中打开
  openInBrowser: function() {
    const url = this.data.url;
    const platformInfo = this.data.platformInfo;
    
    wx.showModal({
      title: `打开${platformInfo ? platformInfo.name : '原网站'}`,
      content: '将在浏览器中打开原链接，您可以享受完整的功能体验',
      confirmText: '确定打开',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          // 复制链接到剪贴板，提示用户在浏览器中打开
          wx.setClipboardData({
            data: url,
            success: function() {
              wx.showModal({
                title: '链接已复制',
                content: '链接已复制到剪贴板，请在浏览器中粘贴打开',
                showCancel: false,
                confirmText: '知道了'
              });
            },
            fail: function() {
              wx.showToast({
                title: '复制失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 复制链接
  copyLink: function() {
    const that = this;
    wx.setClipboardData({
      data: that.data.url,
      success: function() {
        wx.showToast({
          title: '链接已复制',
          icon: 'success',
          duration: 2000
        });
      }
    });
  },

  // 重新加载
  reload: function() {
    this.setData({
      loading: true,
      error: false
    });
    this.loadArticleContent();
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: this.data.title,
      desc: this.data.summary,
      path: `/pages/article/article?url=${encodeURIComponent(this.data.url)}`
    };
  }
});
