# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-platform hot news aggregation system that provides real-time trending topics from 9 major Chinese social platforms. The project consists of:

1. **React Web Frontend** (`/src/`) - Main user-facing application
2. **WeChat Mini-Program** (`/miniprogram/`) - Native WeChat implementation  
3. **MCP Server Backend** (`/mcp-hotnews-server-main/`) - Model Context Protocol server providing data

## Architecture

The system uses a **MCP-first architecture** with HTTP fallback:
- Primary interface through Model Context Protocol for AI integration
- Automatic fallback to HTTP API when MCP unavailable
- Real-time data from external APIs (api.vvhan.com) with 5-minute caching
- No traditional database - fetches live data from 9 platforms

### Data Sources
- 知乎热榜 (Zhihu), 36氪热榜 (36Kr), 百度热点 (Baidu)
- B站热榜 (Bilibili), 微博热搜 (Weibo), 抖音热点 (Douyin)
- 虎扑热榜 (Hupu), 豆瓣热榜 (Douban), IT新闻 (IT News)

## Development Commands

### Frontend (React)
```bash
npm start          # Start development server (port 3000)
npm build          # Build production bundle
npm test           # Run test suite
```

### MCP Server (Backend)
```bash
cd mcp-hotnews-server-main
npm run build      # Compile TypeScript
npm run watch      # Development with auto-reload
npm run start:http # Start HTTP server (port 3001)
npm run start:pm2  # Production with PM2
npm run logs:pm2   # View PM2 logs
```

### Mini-Program
- Use WeChat Developer Tools
- Import `/miniprogram/` directory
- Configure `project.config.json` for development

## Key Directory Structure

```
/src/
├── components/     # Reusable UI components (Header, HotItemCard, StatusBar)
├── pages/         # Route components (HomePage, SitePage, ItemDetailPage)
├── services/      # MCP/API communication layer
├── config/        # Site configuration and MCP ID mappings
├── context/       # React context for theme/global state
└── utils/         # MCP initialization and dependency checking

/miniprogram/
├── pages/         # WeChat mini-program pages
├── assets/        # Static resources
└── project.config.json # WeChat dev tools config

/mcp-hotnews-server-main/src/
├── index.ts       # Main MCP server implementation
├── http-server.ts # HTTP API wrapper
└── config.ts      # Platform endpoints configuration
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Chakra UI, React Router, Framer Motion
- **Backend**: Node.js, Express, MCP SDK (@modelcontextprotocol/sdk)
- **Deployment**: PM2, Docker, Tencent Cloud
- **Development**: Create React App, WeChat Developer Tools

## MCP Integration

- MCP server configured in `.cursor/hotnews-mcp.json`
- Automatic MCP availability detection in frontend
- Graceful degradation to mock data when services offline
- Platform data accessed via MCP protocol: `get_hot_list`, `get_site_hot_list`

## Deployment Configuration

### Production (PM2)
- Port 3001 configured for Tencent Cloud
- Cluster mode with max CPU cores
- Auto-restart enabled
- Configuration in `ecosystem.config.cjs`

### Docker Support
- Multi-stage build with Node.js 22-alpine
- Production-optimized image available

## Development Workflow

1. **MCP Development**: Start MCP server first for data access
2. **Frontend Development**: Run React dev server with hot reload
3. **Cross-platform**: Test both web and mini-program interfaces
4. **Error Handling**: System gracefully handles API failures with mock data

## Important Configuration Files

- `/src/config/siteConfig.ts` - Platform to MCP ID mappings
- `.cursor/hotnews-mcp.json` - MCP server configuration for Cursor
- `miniprogram/app.json` - Mini-program structure and permissions
- `ecosystem.config.cjs` - PM2 production deployment
- `Dockerfile` - Container deployment configuration

## Security Considerations

- No user data storage or processing
- Public API aggregation only
- MIT license for open source usage
- Rate limiting implemented in MCP server