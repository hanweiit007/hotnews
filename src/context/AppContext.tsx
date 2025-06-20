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
      // 获取站点数据
      const sitesData = await apiService.getSites();
      setSites(sitesData);

      // 获取热点数据，添加重试逻辑
      let retryCount = 0;
      const maxRetries = 3;
      let hotItemsData: HotItem[] = [];

      while (retryCount < maxRetries) {
        try {
          hotItemsData = await apiService.getAllHotItems();
          
          // 验证数据
          if (Array.isArray(hotItemsData) && hotItemsData.length > 0) {
            setAllHotItems(hotItemsData);
            setLastUpdated(new Date());
            break;
          } else {
            throw new Error('Invalid or empty hot items data');
          }
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
          } else {
            console.error('All retry attempts failed');
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const [sitesData, hotItemsData] = await Promise.all([
        apiService.getSites(),
        apiService.getAllHotItems()
      ]);
      
      setSites(sitesData);
      setAllHotItems(hotItemsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const getSiteHotItems = async (siteId: SiteId, limit: number = 10): Promise<HotItem[]> => {
    try {
      const items = await apiService.getSiteHotItems(siteId, limit);
      return items;
    } catch (error) {
      console.error(`Error getting hot items for site ${siteId}:`, error);
      return [];
    }
  };

  const getHotItemDetails = async (itemId: string): Promise<HotItem | null> => {
    try {
      return await apiService.getHotItemDetails(itemId);
    } catch (error) {
      console.error(`Error getting details for item ${itemId}:`, error);
      return null;
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value: AppContextType = {
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

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext; 