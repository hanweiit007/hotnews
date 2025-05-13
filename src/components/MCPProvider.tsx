import React, { useState, useEffect, ReactNode } from 'react';
import { Box, Spinner, Text, VStack, Center, Button, Code, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Tabs, TabList, TabPanels, Tab, TabPanel, Alert, AlertIcon } from '@chakra-ui/react';
import initMcpCheck from '../utils/mcpInitializer';
import mcpDependencyChecker from '../utils/mcpDependencyChecker';

interface MCPProviderProps {
  children: ReactNode;
}

/**
 * MCP Provider 组件，确保应用在 MCP 服务初始化后才渲染
 */
const MCPProvider: React.FC<MCPProviderProps> = ({ children }) => {
  const [isMCPReady, setIsMCPReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [mcpDebugInfo, setMcpDebugInfo] = useState<any>(null);
  const [manualMcpTest, setManualMcpTest] = useState<any>(null);

  useEffect(() => {
    const checkMcpService = async () => {
      try {
        // 检查 MCP 服务状态
        await initMcpCheck();
        
        // 收集MCP调试信息
        const mcpExists = typeof (window as any).mcp !== 'undefined';
        let mcpInfo = {
          exists: mcpExists,
          methods: mcpExists ? Object.keys((window as any).mcp || {}) : [],
          hasGetHotNews: mcpExists && typeof (window as any).mcp?.get_hot_news === 'function',
        };
        setMcpDebugInfo(mcpInfo);
        
        // 检查 MCP 是否可用
        if (mcpInfo.exists && mcpInfo.hasGetHotNews) {
          console.log('MCP 服务已就绪');
          setIsMCPReady(true);
        } else {
          // 延迟再次尝试
          if (retryCount < 3) {
            console.log(`MCP 服务未就绪，重试中... (${retryCount + 1}/3)`);
            setTimeout(() => setRetryCount(prev => prev + 1), 1000);
          } else {
            console.error('MCP 服务初始化失败');
            setError('无法连接到 MCP 服务。请确保本地 MCP 服务已正确配置并运行。');
          }
        }
      } catch (err) {
        console.error('MCP 检查错误', err);
        setMcpDebugInfo({ error: err instanceof Error ? err.message : String(err) });
        setError(`MCP 服务检查失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    };

    checkMcpService();
  }, [retryCount]);

  // 手动测试MCP服务
  const testMcpService = async () => {
    try {
      if (typeof (window as any).mcp?.get_hot_news === 'function') {
        setManualMcpTest({ status: 'testing' });
        const result = await (window as any).mcp.get_hot_news([1]); // 测试获取知乎热搜
        setManualMcpTest({ 
          status: 'success', 
          result: result,
          timestamp: new Date().toISOString()
        });
        // 如果成功获取数据，将应用标记为就绪
        if (result && Array.isArray(result) && result.length > 0) {
          setIsMCPReady(true);
          setError(null);
        }
      } else {
        setManualMcpTest({ 
          status: 'error', 
          message: 'MCP服务不可用或get_hot_news方法不存在' 
        });
      }
    } catch (err) {
      setManualMcpTest({ 
        status: 'error', 
        message: err instanceof Error ? err.message : String(err)
      });
    }
  };

  // 如果初始化时发生错误
  if (error) {
    return (
      <Center h="100vh" p={4}>
        <VStack spacing={4} maxW="800px" w="100%">
          <Text color="red.500" fontSize="xl" fontWeight="bold">MCP 服务不可用</Text>
          <Text>{error}</Text>
          
          <VStack align="start" spacing={2} bg="gray.50" p={4} borderRadius="md" w="100%">
            <Text fontSize="md" fontWeight="bold">请确保：</Text>
            <Text>1. 本地 MCP 服务正在运行</Text>
            <Text>2. .cursor/hotnews-mcp.json 配置正确</Text>
            <Text>3. 本地服务端口 3001 可访问</Text>
          </VStack>
          
          <Button colorScheme="blue" onClick={testMcpService}>
            测试 MCP 服务
          </Button>
          
          {manualMcpTest && (
            <Box w="100%" mt={4} p={4} bg="gray.50" borderRadius="md">
              <Text fontWeight="bold">手动测试结果：</Text>
              <Code p={2} mt={2} w="100%" overflowX="auto" display="block">
                {JSON.stringify(manualMcpTest, null, 2)}
              </Code>
            </Box>
          )}
          
          <Tabs w="100%" variant="enclosed">
            <TabList>
              <Tab>调试信息</Tab>
              <Tab>故障排除指南</Tab>
              <Tab>命令行指南</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Code p={2} w="100%" overflowX="auto" display="block" whiteSpace="pre-wrap">
                  {JSON.stringify(mcpDebugInfo, null, 2)}
                </Code>
              </TabPanel>
              <TabPanel>
                <Code p={2} w="100%" overflowX="auto" display="block" whiteSpace="pre-wrap">
                  {mcpDependencyChecker.getMcpTroubleshootingGuide().join('\n')}
                </Code>
              </TabPanel>
              <TabPanel>
                <Code p={2} w="100%" overflowX="auto" display="block" whiteSpace="pre-wrap">
                  {mcpDependencyChecker.getMcpCommandGuide()}
                </Code>
              </TabPanel>
            </TabPanels>
          </Tabs>
          
          <Button onClick={() => window.location.reload()}>刷新页面</Button>
          <Button variant="outline" colorScheme="blue" onClick={() => {
            setIsMCPReady(true);
            setError(null);
          }}>
            强制继续（可能无法获取数据）
          </Button>
        </VStack>
      </Center>
    );
  }

  // 如果 MCP 还未就绪，显示加载界面
  if (!isMCPReady) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>正在连接 MCP 服务...</Text>
          <Text fontSize="sm">正在尝试第 {retryCount + 1} 次连接</Text>
          
          <Button mt={4} colorScheme="blue" onClick={testMcpService}>
            手动测试 MCP 服务
          </Button>
          
          {manualMcpTest && (
            <Box w="350px" mt={4} p={4} bg="gray.50" borderRadius="md">
              <Text fontWeight="bold">测试结果：</Text>
              <Code p={2} mt={2} w="100%" overflowX="auto" display="block">
                {JSON.stringify(manualMcpTest, null, 2)}
              </Code>
            </Box>
          )}
          
          <Button size="sm" variant="link" onClick={() => {
            setIsMCPReady(true);
          }}>
            强制继续
          </Button>
        </VStack>
      </Center>
    );
  }

  // MCP 已就绪，渲染子组件
  return <>{children}</>;
};

export default MCPProvider; 