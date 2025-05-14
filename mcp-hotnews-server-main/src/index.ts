#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { getHotItems } from "./hot-news";
import { SITE_CONFIGS } from "./config";

// Define interfaces for type safety
interface HotNewsItem {
  index: number;
  title: string;
  url: string;
  hot?: string | number;
}

class HotNewsServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "mcp-server/hotnewslist",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_hot_news",
          description: "Get hot trending lists from various platforms",
          inputSchema: {
            type: "object",
            properties: {
              sources: {
                type: "array",
                description: "List of site IDs to fetch hot news from",
                items: {
                  type: "string",
                  enum: Object.keys(SITE_CONFIGS),
                },
              },
            },
            required: ["sources"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "get_hot_news") {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`,
        );
      }

      try {
        const sources = request.params.arguments?.sources as string[];
        if (!Array.isArray(sources) || sources.length === 0) {
          throw new Error("Please provide valid source IDs");
        }

        // Fetch multiple hot lists
        const results = await Promise.all(
          sources.map(async (siteId) => {
            try {
              const items = await getHotItems(siteId, 50);
              const siteConfig = SITE_CONFIGS[siteId];
              
              const newsList = items.map(
                (item: HotNewsItem) =>
                  `${item.index}. [${item.title}](${item.url}) ${
                    item.hot ? `<small>Heat: ${item.hot}</small>` : ""
                  }`,
              );

              return `
### ${siteConfig.name}
> Last updated: ${new Date().toISOString()}
${newsList.join("\n")}
`;
            } catch (error) {
              return `Failed to fetch ${siteConfig.name}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`;
            }
          }),
        );

        return {
          content: [
            {
              type: "text",
              text: results.join("\n\n"),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.start(transport);
  }
}

// Start the server
const server = new HotNewsServer();
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
}); 