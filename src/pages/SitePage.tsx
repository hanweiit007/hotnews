import React, { useEffect, useState } from 'react';
import { 
  Box, 
  VStack, 
  HStack,
  Text,
  Spinner,
  Center,
  Switch,
  Grid,
  GridItem,
  Button,
  Select as ChakraSelect,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { AttachmentIcon } from '@chakra-ui/icons';

import Header from '../components/Header';
import HotItemCard from '../components/HotItemCard';
import { useApp } from '../context/AppContext';
import { HotItem, SiteId } from '../types';

const SitePage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const { getSiteHotItems, sites, isLoading } = useApp();
  const [hotItems, setHotItems] = useState<HotItem[]>([]);
  const [sortBy, setSortBy] = useState<'heat' | 'time'>('heat');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HotItem | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  
  const site = sites.find(s => s.id === siteId);
  
  useEffect(() => {
    if (siteId) {
      loadSiteData();
    }
  }, [siteId]);
  
  const loadSiteData = async () => {
    if (!siteId) return;
    
    try {
      const items = await getSiteHotItems(siteId as SiteId, 10);
      setHotItems(items);
    } catch (error) {
      console.error('Failed to load site data:', error);
      toast({
        title: '加载失败',
        description: '无法获取热点数据，请稍后再试',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
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
  
  const handleShare = () => {
    if (navigator.share && site) {
      navigator.share({
        title: `${site.name.zh} 热点排行`,
        text: `查看 ${site.name.zh} 最新热点排行`,
        url: window.location.href,
      }).catch((error: any) => {
        console.error('分享失败:', error);
      });
    } else {
      // 可以弹窗提示"当前浏览器不支持分享"
      alert('当前浏览器不支持原生分享功能');
    }
  };
  
  const sortedItems = [...hotItems].sort((a, b) => {
    if (sortBy === 'heat') {
      return b.heatIndex - a.heatIndex;
    } else {
      return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime();
    }
  });
  
  if (!site) {
    return (
      <Box minH="100vh" bg="background.light">
        <Header showBack title="网站不存在" />
        <Center py={10}>
          <Text>未找到指定网站</Text>
        </Center>
      </Box>
    );
  }
  
  return (
    <Box minH="100vh" bg="background.light">
      {/* Header */}
      <Header 
        showBack 
        title={site.name.zh} 
        showRefresh={false}
      />
      
      {/* Sort Controls */}
      <HStack 
        p={4} 
        bg="white" 
        borderBottomWidth="1px" 
        borderColor="gray.200"
      >
        <Grid templateColumns="auto 1fr auto" alignItems="center" width="100%">
          <GridItem>
            <Text fontSize="sm" mr={2}>排序方式:</Text>
          </GridItem>
          <GridItem>
            <ChakraSelect 
              id="sort-by" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'heat' | 'time')}
              size="sm"
              maxW="100px"
            >
              <option value="heat">热度</option>
              <option value="time">时间</option>
            </ChakraSelect>
          </GridItem>
          <GridItem ml="auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
            >
              <AttachmentIcon color="gray.500" boxSize={5} />
            </Button>
          </GridItem>
        </Grid>
      </HStack>
      
      {/* Hot Items List */}
      <Box px={4} py={4} pb="60px">
        {isLoading && hotItems.length === 0 ? (
          <Center py={10}>
            <Spinner size="lg" color="primary.main" />
          </Center>
        ) : (
          <VStack align="stretch" mt={3}>
            {sortedItems.map((item, index) => (
              <HotItemCard 
                key={item.id} 
                item={{...item, rank: index + 1}}
                onClick={() => handleItemClick(item)}
                showSource={false}
                showRank={true}
              />
            ))}
            
            {sortedItems.length === 0 && (
              <Center py={10}>
                <Text color="gray.500">暂无热点数据</Text>
              </Center>
            )}
          </VStack>
        )}
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

export default SitePage; 