import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HotItem, Site, AppSettings, SiteId } from '../types';
import apiService, { sites } from '../services/apiService';

interface AppContextType {
  sites: Site[];
  allHotItems: HotItem[];
  isLoading: boolean;
  lastUpdated: Date | null;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  refreshData: () => Promise<void>;
  getSiteHotItems: (siteId: SiteId, limit?: number) => Promise<HotItem[]>;
  getHotItemDetails: (itemId: string) => Promise<HotItem | null>;
}

const defaultSettings: AppSettings = {
  updateInterval: 15, // 15 minutes
  theme: 'light',
  language: 'zh',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [allHotItems, setAllHotItems] = useState<HotItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    
    // Set up recurring data refresh
    const intervalId = setInterval(() => {
      refreshData();
    }, settings.updateInterval * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [settings.updateInterval]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 获取网站数据
      const sitesData = await apiService.getSites();
      
      // 尝试获取热搜数据
      let hotItemsData: HotItem[] = [];
      try {
        hotItemsData = await apiService.getAllHotItems(3);
      } catch (apiError) {
        console.error('热搜数据获取失败:', apiError);
      }
      
      setSites(sitesData);
      setAllHotItems(hotItemsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // 使用API获取热搜数据
      let hotItemsData: HotItem[] = [];
      try {
        hotItemsData = await apiService.getAllHotItems(3);
      } catch (apiError) {
        console.error('刷新时数据获取失败:', apiError);
      }
      
      if (hotItemsData.length > 0) {
        setAllHotItems(hotItemsData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
    
    return Promise.resolve();
  };

  const getSiteHotItems = async (siteId: SiteId, limit: number = 10): Promise<HotItem[]> => {
    try {
      return await apiService.getSiteHotItems(siteId, limit);
    } catch (error) {
      console.error(`Failed to get hot items for site ${siteId}:`, error);
      return [];
    }
  };

  const getHotItemDetails = async (itemId: string): Promise<HotItem | null> => {
    try {
      return await apiService.getHotItemDetails(itemId);
    } catch (error) {
      console.error(`Failed to get details for item ${itemId}:`, error);
      return null;
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value = {
    sites,
    allHotItems,
    isLoading,
    lastUpdated,
    settings,
    updateSettings,
    refreshData,
    getSiteHotItems,
    getHotItemDetails,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext; 