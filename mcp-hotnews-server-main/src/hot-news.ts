import axios from 'axios'
import { SITE_CONFIGS } from './config'

interface HotItem {
  id: string
  title: string
  url: string
  rank: number
  hot?: number
  publishTime: string
  summary?: string
}

export async function getHotItems(site: string, limit: number): Promise<HotItem[]> {
  const config = SITE_CONFIGS[site]
  if (!config) {
    throw new Error(`Invalid site: ${site}`)
  }

  try {
    console.log(`获取站点 ${site} 的热门数据，URL: ${config.apiUrl}`)
    const response = await axios.get(config.apiUrl)
    console.log(`站点 ${site} 响应数据:`, response.data)

    let items: any[] = []
    if (Array.isArray(response.data)) {
      items = response.data
    } else if (response.data.items) {
      items = response.data.items
    } else if (response.data.data) {
      items = response.data.data
    } else if (response.data.list) {
      items = response.data.list
    }

    return items.slice(0, limit).map((item, index) => ({
      id: item.id || `${site}-${index + 1}`,
      title: item.title || item.name || item.text || '',
      url: item.url || item.link || item.href || '',
      rank: item.rank || item.index || (index + 1),
      hot: item.hot || item.heat || item.count || 0,
      publishTime: item.time || item.date || item.publishTime || new Date().toISOString(),
      summary: item.excerpt || item.content || item.desc || item.summary || ''
    }))
  } catch (error) {
    console.error(`获取站点 ${site} 数据失败:`, error)
    throw error
  }
} 