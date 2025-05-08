import React, { useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Flex,
  Container,
  Spinner,
  Center,
  Divider,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { useApp } from '../context/AppContext';
import { HotItem } from '../types';

const HomePage: React.FC = () => {
  const { sites, allHotItems, isLoading, lastUpdated, refreshData } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial data load handled by AppContext
  }, []);

  const handleItemClick = (item: HotItem) => {
    // 导航到详情页
    navigate(`/item/${item.id}`);
  };

  const handleSiteHeaderClick = (siteId: string) => {
    // 导航到站点页
    navigate(`/site/${siteId}`);
  };

  // 按源站点分组项目
  const itemsBySource = allHotItems.reduce<Record<string, HotItem[]>>((acc, item) => {
    if (!acc[item.sourceId]) {
      acc[item.sourceId] = [];
    }
    acc[item.sourceId].push(item);
    return acc;
  }, {});

  const handleRefresh = () => {
    refreshData();
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box as="header" py={3} px={4} bg="red.500" color="white">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="md">热搜聚合</Heading>
          <Text cursor="pointer" onClick={handleRefresh}>
            刷新
          </Text>
        </Flex>
      </Box>

      {/* Site Tabs */}
      <Box py={2} bg="white" borderBottomWidth="1px" borderColor="gray.200">
        <Flex
          overflowX="auto"
          py={1}
          px={2}
          css={{
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {sites.map((site) => (
            <Box
              key={site.id}
              px={4}
              py={2}
              mx={1}
              borderRadius="md"
              cursor="pointer"
              minWidth="72px"
              textAlign="center"
              onClick={() => handleSiteHeaderClick(site.id)}
            >
              <Flex direction="column" alignItems="center">
                <Flex
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  w="30px"
                  h="30px"
                  justifyContent="center"
                  alignItems="center"
                  mb={1}
                >
                  {site.icon}
                </Flex>
                <Text fontSize="xs">{site.name.zh}</Text>
              </Flex>
            </Box>
          ))}
        </Flex>
      </Box>

      {/* Main Content */}
      <Container maxW="container.md" py={4} pb="60px">
        {isLoading && allHotItems.length === 0 ? (
          <Center py={10}>
            <Spinner size="lg" color="red.500" />
          </Center>
        ) : (
          <VStack align="stretch" mt={6}>
            {sites.map((site) => {
              const siteItems = itemsBySource[site.id] || [];
              if (siteItems.length === 0) return null;

              return (
                <Box key={site.id}>
                  <Heading
                    size="md"
                    mb={3}
                    cursor="pointer"
                    onClick={() => handleSiteHeaderClick(site.id)}
                    display="flex"
                    alignItems="center"
                  >
                    {site.name.zh}
                    <Text fontSize="sm" color="gray.500" ml={2}>
                      查看更多 &gt;
                    </Text>
                  </Heading>

                  {siteItems.map((item) => (
                    <Box
                      key={item.id}
                      p={3}
                      borderRadius="md"
                      boxShadow="sm"
                      bg="white"
                      borderWidth="1px"
                      borderColor="gray.100"
                      cursor="pointer"
                      onClick={() => handleItemClick(item)}
                      _hover={{ transform: 'scale(1.01)', boxShadow: 'md' }}
                      transition="all 0.2s"
                      mb={2}
                    >
                      <Text fontWeight="bold" mb={1} isTruncated>
                        {item.title}
                      </Text>
                      <Flex justifyContent="space-between">
                        <Text fontSize="xs" color="gray.500">
                          {item.source}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          热度: {item.heatIndex > 10000 
                            ? `${(item.heatIndex / 10000).toFixed(1)}万` 
                            : item.heatIndex}
                        </Text>
                      </Flex>
                    </Box>
                  ))}

                  <Divider mt={4} />
                </Box>
              );
            })}
          </VStack>
        )}
      </Container>

      {/* Status Bar */}
      <Box
        as="footer"
        py={2}
        px={4}
        borderTopWidth="1px"
        borderColor="gray.200"
        bg="white"
        position="fixed"
        bottom={0}
        width="100%"
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontSize="xs" color="gray.500">
            上次更新:{' '}
            {lastUpdated
              ? `${lastUpdated.getHours().toString().padStart(2, '0')}:${lastUpdated
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}`
              : '--:--'}
          </Text>
          <Text fontSize="xs" color="gray.500" cursor="pointer">
            设置
          </Text>
        </Flex>
      </Box>
    </Box>
  );
};

export default HomePage; 