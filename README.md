# 热点聚合新闻小程序

本项目是一个基于 React 的多平台热点新闻聚合前端，支持通过 [@wopal/mcp-server-hotnews](https://github.com/wopal-cn/mcp-hotnews-server) MCP 服务实时获取知乎、微博、百度等主流平台的热点内容。

## 功能特性
- 聚合展示知乎、微博、百度等9大平台热点新闻
- 支持按平台筛选、查看详情
- 实时数据，全部来源于 MCP 热点服务
- 适配 Cursor 编辑器环境，支持自动降级为 mock 数据
- 支持 MIT 协议自由使用和二次开发

## 依赖与数据来源
- 本项目依赖 [@wopal/mcp-server-hotnews](https://github.com/wopal-cn/mcp-hotnews-server) MCP 服务，需在 Cursor 编辑器环境下运行或本地启动 MCP 服务
- 数据均聚合自各大公开平台，未存储或处理用户隐私信息
- MCP 服务 MIT 协议，详见其 [LICENSE](https://github.com/wopal-cn/mcp-hotnews-server/blob/main/LICENSE)

## 快速开始
1. 安装依赖
   ```bash
   npm install
   # 或 yarn install
   ```
2. 启动 MCP 服务（推荐在 Cursor 编辑器中自动启动）
   - 参考 [@wopal/mcp-server-hotnews 文档](https://github.com/wopal-cn/mcp-hotnews-server)
3. 启动前端项目
   ```bash
   npm start
   # 或 yarn start
   ```
4. 在 Cursor 编辑器或支持 MCP 的环境下访问 [http://localhost:3000](http://localhost:3000)

## 免责声明
- 本项目仅聚合公开数据，数据归原平台所有
- 如需商用请遵守各平台相关规定
- 本项目及 MCP 服务均采用 MIT 协议，详见 LICENSE 文件

## License

本项目采用 MIT 协议，详见 LICENSE 文件。

---

> 本项目部分功能和数据依赖于 [@wopal/mcp-server-hotnews](https://github.com/wopal-cn/mcp-hotnews-server)。
