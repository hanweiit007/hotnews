// Site type definition
export interface Site {
  id: string;
  name: {
    en: string;
    zh: string;
  };
  icon: string;
  url: string;
}

// Hot content item from a site
export interface HotItem {
  id: string;
  title: string;
  summary?: string;
  url: string;
  source: string;
  sourceId: string;
  heatIndex: number;
  publishTime: string;
  rank?: number;
  metadata?: {
    [key: string]: any; // Additional site-specific data
  };
}

// For different site-specific metadata
export interface ZhihuMetadata {
  answerCount: number;
}

export interface BilibiliMetadata {
  uploader: string;
  playCount: number;
  danmakuCount: number;
}

export interface WeiboMetadata {
  type: 'new' | 'hot' | 'boiling';
  searchIndex: number;
}

// App settings
export interface AppSettings {
  updateInterval: number; // in minutes
  theme: 'light' | 'dark';
  language: 'en' | 'zh';
}

// Available site IDs
export type SiteId = 
  | 'zhihu'
  | '36kr'
  | 'baidu'
  | 'bilibili'
  | 'weibo'
  | 'douyin'
  | 'hupu'
  | 'douban'
  | 'itnews'; 