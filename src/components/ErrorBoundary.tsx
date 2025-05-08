import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Heading, Text, Button, Center, VStack } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 你同样可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 你可以自定义降级 UI 并渲染
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Center h="100vh" w="100%">
          <VStack spacing={4} p={8} maxW="md" bg="white" borderRadius="md" boxShadow="md">
            <Heading size="md" color="red.500">出错了!</Heading>
            <Text>{this.state.error?.message || '应用加载时发生错误'}</Text>
            <Button
              colorScheme="blue"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </Button>
          </VStack>
        </Center>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 