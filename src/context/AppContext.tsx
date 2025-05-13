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
    console.log('Starting to load initial data...');
    setIsLoading(true);
    try {
      // 获取站点数据
      console.log('Fetching sites...');
      const sitesData = await apiService.getSites();
      console.log('Sites fetched:', sitesData);
      setSites(sitesData);

      // 获取热点数据，添加重试逻辑
      let retryCount = 0;
      const maxRetries = 3;
      let hotItemsData: HotItem[] = [];

      while (retryCount < maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} to fetch hot items...`);
          hotItemsData = await apiService.getAllHotItems();
          console.log('Hot items fetched successfully:', hotItemsData);
          
          // 验证数据
          if (Array.isArray(hotItemsData) && hotItemsData.length > 0) {
            console.log(`Setting ${hotItemsData.length} hot items to state`);
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
            console.log(`Waiting ${retryCount * 1000}ms before retry...`);
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
    console.log('Refreshing data...');
    setIsLoading(true);
    try {
      const [sitesData, hotItemsData] = await Promise.all([
        apiService.getSites(),
        apiService.getAllHotItems()
      ]);
      
      console.log('Refresh results:', {
        sitesCount: sitesData.length,
        hotItemsCount: hotItemsData.length
      });

      // 验证数据
      if (Array.isArray(hotItemsData) && hotItemsData.length > 0) {
        setSites(sitesData);
        setAllHotItems(hotItemsData);
        setLastUpdated(new Date());
      } else {
        console.error('Invalid or empty hot items data received');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSiteHotItems = async (siteId: SiteId, limit: number = 10): Promise<HotItem[]> => {
    console.log(`Fetching hot items for site ${siteId}...`);
    try {
      const items = await apiService.getSiteHotItems(siteId, limit);
      console.log(`Fetched ${items.length} items for site ${siteId}`);
      return items;
    } catch (error) {
      console.error(`Error fetching hot items for site ${siteId}:`, error);
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