import express, { RequestHandler, ErrorRequestHandler } from 'express'
import { getHotItems } from './hot-news'
import { SITE_CONFIGS } from './config'

const app = express()
const port = process.env.PORT || 3001

// 添加 CORS 中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// 添加错误处理中间件
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
}

// 添加请求日志中间件
const requestLogger: RequestHandler = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
}

app.use(requestLogger)

const handleHotNews: RequestHandler = async (req, res, next) => {
  try {
    const { site, limit = 50 } = req.query
    console.log('收到请求:', { site, limit })

    // 如果没有指定站点，返回所有站点的数据
    if (!site) {
      const allHotItems = {}
      for (const siteId of Object.keys(SITE_CONFIGS)) {
        try {
          const items = await getHotItems(siteId, Number(limit))
          allHotItems[siteId] = items
        } catch (error) {
          console.error(`获取站点 ${siteId} 数据失败:`, error)
          allHotItems[siteId] = []
        }
      }
      res.json(allHotItems)
      return
    }

    const siteConfig = SITE_CONFIGS[site as string]
    if (!siteConfig) {
      res.status(400).json({ error: 'Invalid site' })
      return
    }

    const hotItems = await getHotItems(site as string, Number(limit))
    res.json({ [site]: hotItems })
  } catch (error) {
    next(error)
  }
}

app.get('/api/hot-news', handleHotNews)

// 添加 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// 添加错误处理中间件
app.use(errorHandler)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
}) 