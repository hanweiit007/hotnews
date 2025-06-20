import React, { useEffect, useState } from 'react';
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Grid,
  GridItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { useApp } from '../context/AppContext';
import { HotItem } from '../types';

const HomePage: React.FC = () => {
  const { sites, allHotItems, isLoading, lastUpdated, refreshData } = useApp();
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HotItem | null>(null);

  useEffect(() => {
    // Initial data load handled by AppContext
  }, [sites, allHotItems, isLoading, lastUpdated]);

  // 按源站点分组项目
  const itemsBySource = allHotItems.reduce<Record<string, HotItem[]>>((acc, item) => {
    if (!acc[item.sourceId]) {
      acc[item.sourceId] = [];
    }
    acc[item.sourceId].push(item);
    return acc;
  }, {});

  const handleItemClick = (item: HotItem) => {
    setSelectedItem(item);
    setIsConfirmOpen(true);
  };

  const handleConfirmOpen = () => {
    if (selectedItem) {
      window.open(selectedItem.url, '_blank');
      setIsConfirmOpen(false);
      setSelectedItem(null);
    }
  };

  const handleSiteClick = (siteId: string) => {
    navigate(`/site/${siteId}`);
  };

  const handleRefresh = () => {
    refreshData();
  };

  // 渲染单个热点项目
  const renderHotItem = (item: HotItem, index: number) => (
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
      mb={3}
    >
      <Flex direction="column" gap={1.5}>
        {/* 标题和排名 */}
        <Flex alignItems="flex-start" gap={2}>
          <Badge 
            colorScheme="red" 
            borderRadius="full" 
            px={2}
            py={0.5}
            fontSize="xs"
            minW="20px"
            textAlign="center"
            flexShrink={0}
            mt={0.5}
          >
            {index + 1}
          </Badge>
          <Text 
            fontWeight="medium" 
            fontSize="sm"
            lineHeight="1.5"
            flex="1"
            wordBreak="break-all"
            whiteSpace="normal"
          >
            {item.title}
          </Text>
        </Flex>

        {/* 摘要（如果有） */}
        {item.summary && (
          <Text 
            fontSize="xs" 
            color="gray.600"
            noOfLines={2}
            pl="28px"
          >
            {item.summary}
          </Text>
        )}

        {/* 底部信息 */}
        <Flex 
          justifyContent="space-between" 
          alignItems="center"
          pl="28px"
          fontSize="xs"
          color="gray.500"
          flexWrap="wrap"
          gap={1}
        >
          <Text>{item.source}</Text>
          <Flex gap={2} alignItems="center" flexWrap="wrap">
            <Text>
              热度: {item.heatIndex > 10000 
                ? `${(item.heatIndex / 10000).toFixed(1)}万` 
                : item.heatIndex}
            </Text>
            <Text>
              {new Date(item.publishTime).toLocaleString('zh-CN', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );

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

      {/* Site Grid */}
      <Box py={4} px={4} bg="white" borderBottomWidth="1px" borderColor="gray.200">
        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          {sites.map((site) => (
            <GridItem
              key={site.id}
              cursor="pointer"
              onClick={() => handleSiteClick(site.id)}
            >
              <Flex
                direction="column"
                alignItems="center"
                p={3}
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
                _hover={{
                  bg: 'gray.50',
                  transform: 'scale(1.02)',
                  transition: 'all 0.2s',
                }}
              >
                <Flex
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  w="40px"
                  h="40px"
                  justifyContent="center"
                  alignItems="center"
                  mb={2}
                >
                  {site.icon}
                </Flex>
                <Text fontWeight="medium">{site.name.zh}</Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {itemsBySource[site.id]?.length || 0} 条热点
                </Text>
              </Flex>
            </GridItem>
          ))}
        </Grid>
      </Box>

      {/* Main Content */}
      <Container maxW="container.md" py={4} pb="60px" px={3}>
        {isLoading && allHotItems.length === 0 ? (
          <Center py={10}>
            <Spinner size="lg" color="red.500" />
          </Center>
        ) : (
          <Accordion allowMultiple defaultIndex={[0]}>
            {sites.map((site) => {
              const siteItems = itemsBySource[site.id] || [];
              return (
                <AccordionItem key={site.id} border="none">
                  <h2>
                    <AccordionButton 
                      py={3}
                      _hover={{ bg: 'gray.50' }}
                      borderRadius="md"
                    >
                      <Box flex="1" textAlign="left">
                        <Flex alignItems="center">
                          <Flex
                            bg="red.500"
                            color="white"
                            borderRadius="full"
                            w="28px"
                            h="28px"
                            justifyContent="center"
                            alignItems="center"
                            mr={2}
                          >
                            {site.icon}
                          </Flex>
                          <Text fontWeight="bold" fontSize="sm">{site.name.zh}</Text>
                          <Badge ml={2} colorScheme="red" fontSize="xs">
                            {siteItems.length}
                          </Badge>
                        </Flex>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={2} px={0}>
                    <VStack align="stretch" spacing={2}>
                      {siteItems.slice(0, 10).map((item, index) => 
                        renderHotItem(item, index)
                      )}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
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

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>跳转到原文</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>即将跳转到原文链接，是否继续？</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsConfirmOpen(false)}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleConfirmOpen}>
              确认
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HomePage; 