import React, { useEffect, useState } from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Heading, 
  Button, 
  Flex,
  Badge,
  Spinner,
  Center,
  Link,
  Icon,
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
import { FiExternalLink, FiShare2 } from 'react-icons/fi';
import { ExternalLinkIcon, AttachmentIcon } from '@chakra-ui/icons';

import Header from '../components/Header';
import { useApp } from '../context/AppContext';
import { HotItem } from '../types';

const ItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const { getHotItemDetails, sites } = useApp();
  const [item, setItem] = useState<HotItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  
  useEffect(() => {
    if (itemId) {
      loadItemData();
    }
  }, [itemId]);
  
  const loadItemData = async () => {
    if (!itemId) return;
    
    setIsLoading(true);
    try {
      const itemData = await getHotItemDetails(itemId);
      setItem(itemData);
    } catch (error) {
      console.error('Failed to load item data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenOriginal = () => {
    if (!item) return;
    
    if (item.sourceId === 'zhihu') {
      setIsConfirmOpen(true);
    } else {
      window.open(item.url, '_blank');
    }
  };
  
  const handleConfirmOpen = () => {
    if (item) {
      window.open(item.url, '_blank');
      setIsConfirmOpen(false);
    }
  };
  
  const handleShare = () => {
    if (navigator.share && item) {
      navigator.share({
        title: item.title,
        text: item.summary || item.title,
        url: window.location.href,
      }).catch(error => console.log('分享失败:', error));
    }
  };
  
  // Format heat index with proper units
  const formatHeatIndex = (index: number): string => {
    if (index >= 10000) {
      return `${(index / 10000).toFixed(1)}万`;
    } else if (index >= 1000) {
      return `${(index / 1000).toFixed(1)}千`;
    }
    return index.toString();
  };
  
  // Get site information
  const site = item ? sites.find(s => s.id === item.sourceId) : null;
  
  // Get site-specific content display
  const getContentDisplay = () => {
    if (!item) return null;
    
    switch (item.sourceId) {
      case 'zhihu':
        return (
          <Box>
            <Text fontSize="md" mb={4}>
              该问题已有 {item.metadata?.answerCount || 0} 个回答
            </Text>
            <Text fontSize="md" color="gray.600">
              热度: {formatHeatIndex(item.heatIndex)}
            </Text>
          </Box>
        );
        
      case '36kr':
      case 'itnews':
        return (
          <Box>
            <Text fontSize="md" mb={4} lineHeight="1.6">
              {item.summary || '暂无摘要内容'}
            </Text>
            <Text fontSize="sm" color="gray.500">
              来源: {item.metadata?.source || item.source}
            </Text>
          </Box>
        );
        
      case 'bilibili':
        return (
          <Box>
            <Text fontSize="md" mb={2}>
              UP主: {item.metadata?.uploader || '未知'}
            </Text>
            <Flex fontSize="sm" color="gray.600" mb={4}>
              <Text mr={4}>播放: {formatHeatIndex(item.metadata?.playCount || 0)}</Text>
              <Text>弹幕: {formatHeatIndex(item.metadata?.danmakuCount || 0)}</Text>
            </Flex>
          </Box>
        );
        
      default:
        return (
          <Box>
            <Text fontSize="md" color="gray.600" mb={4}>
              {item.summary || '点击下方按钮查看原文内容'}
            </Text>
          </Box>
        );
    }
  };
  
  if (isLoading) {
    return (
      <Box minH="100vh" bg="background.light">
        <Header showBack title="热点详情" />
        <Center py={10}>
          <Spinner size="lg" color="primary.main" />
        </Center>
      </Box>
    );
  }
  
  if (!item) {
    return (
      <Box minH="100vh" bg="background.light">
        <Header showBack title="内容不存在" />
        <Center py={10}>
          <Text>未找到指定内容</Text>
        </Center>
      </Box>
    );
  }
  
  return (
    <Box minH="100vh" bg="background.light">
      {/* Header */}
      <Header 
        showBack 
        title="热点详情" 
      />
      
      {/* Content */}
      <Box px={4} py={6} bg="white" mb={4}>
        <VStack align="stretch" mt={4}>
          <Flex alignItems="center" mb={2}>
            <Badge 
              colorScheme="red" 
              variant="solid" 
              borderRadius="full" 
              px={2}
              py={0.5}
              mr={2}
            >
              {site?.name.zh || item.source}
            </Badge>
            <Text fontSize="xs" color="gray.500">
              {new Date(item.publishTime).toLocaleString('zh-CN')}
            </Text>
          </Flex>
          
          <Heading size="lg" lineHeight="1.4">
            {item.title}
          </Heading>
          
          <Box mt={4}>
            {getContentDisplay()}
          </Box>
        </VStack>
      </Box>
      
      {/* Actions */}
      <Flex px={4} mb={4} justifyContent="space-between">
        <Button 
          colorScheme="blue" 
          variant="solid"
          onClick={handleOpenOriginal}
          flex={1}
          mr={2}
        >
          <ExternalLinkIcon mr={2} />
          查看原文
        </Button>
        
        <Button
          colorScheme="gray"
          variant="outline"
          onClick={handleShare}
        >
          <AttachmentIcon mr={2} />
          分享
        </Button>
      </Flex>
      
      {/* Related Items (Optional) */}
      {/* Additional content can be added here */}
      
      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>跳转到知乎</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>即将跳转到知乎查看原文，是否继续？</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsConfirmOpen(false)}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleConfirmOpen}>
              确认跳转
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ItemDetailPage; 