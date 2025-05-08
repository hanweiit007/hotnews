// MCP 类型声明，用于调用 Cursor 的 MCP 服务
interface MCPWindow extends Window {
  mcp?: {
    get_hot_news: (siteIds: number[]) => Promise<any[]>;
  }
}

declare global {
  interface Window extends MCPWindow {}
}

export {}; 