import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Badge, 
  useColorMode,
  Link,
  Tooltip
} from '@chakra-ui/react';
import { HotItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface HotItemCardProps {
  item: HotItem;
  onClick?: () => void;
  showSource?: boolean;
  showRank?: boolean;
}

const HotItemCard: React.FC<HotItemCardProps> = ({ 
  item, 
  onClick, 
  showSource = true,
  showRank = false,
}) => {
  const { colorMode } = useColorMode();
  const cardBg = colorMode === 'light' ? 'white' : 'gray.800';
  const textColor = colorMode === 'light' ? 'text.primary' : 'white';
  const secondaryTextColor = colorMode === 'light' ? 'text.secondary' : 'gray.400';
  
  // Format publish time as "X minutes ago"
  const timeAgo = item.publishTime 
    ? formatDistanceToNow(new Date(item.publishTime), { addSuffix: true, locale: zhCN }) 
    : '';
  
  // Function to format heat index with proper units
  const formatHeatIndex = (index: number): string => {
    if (index >= 10000) {
      return `${(index / 10000).toFixed(1)}万`;
    } else if (index >= 1000) {
      return `${(index / 1000).toFixed(1)}千`;
    }
    return index.toString();
  };
  
  // Determine heat level and badge color
  const getHeatLevel = (index: number) => {
    if (index >= 10000) return { color: 'heat.high', label: '热' };
    if (index >= 5000) return { color: 'heat.medium', label: '热门' };
    return { color: 'heat.low', label: '新' };
  };
  
  const heatLevel = getHeatLevel(item.heatIndex);
  
  // Get site-specific metadata display
  const getMetadataDisplay = () => {
    if (!item.metadata) return null;
    
    switch (item.sourceId) {
      case 'zhihu':
        return `${item.metadata.answerCount || 0} 回答`;
      case 'bilibili':
        return `${formatHeatIndex(item.metadata.playCount || 0)} 播放 · ${formatHeatIndex(item.metadata.danmakuCount || 0)} 弹幕`;
      case 'weibo':
        return `${formatHeatIndex(item.metadata.searchIndex || 0)} 热度`;
      default:
        return null;
    }
  };
  
  const metadataDisplay = getMetadataDisplay();
  
  return (
    <Box
      p={3}
      borderRadius="8px"
      boxShadow="sm"
      bg={cardBg}
      borderWidth="1px"
      borderColor="gray.100"
      cursor="pointer"
      onClick={onClick}
      _hover={{ transform: 'scale(1.01)', boxShadow: 'md' }}
      transition="all 0.2s"
      mb={2}
    >
      <Flex align="flex-start">
        {showRank && item.rank && (
          <Box 
            mr={3} 
            fontSize="lg" 
            fontWeight="bold" 
            color={item.rank <= 3 ? 'primary.main' : secondaryTextColor}
          >
            {item.rank}
          </Box>
        )}
        
        <Box flex="1">
          <Flex justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Tooltip label={item.title} placement="top" hasArrow>
              <Text
                fontWeight="bold"
                fontSize="md"
                color={textColor}
                isTruncated
                mb={1}
                maxWidth="90%"
              >
                {item.title}
              </Text>
            </Tooltip>
            <Badge
              colorScheme={heatLevel.color.split('.')[1]}
              variant="solid"
              ml={2}
              fontSize="xs"
              borderRadius="full"
              px={2}
            >
              {heatLevel.label}
            </Badge>
          </Flex>
          
          {item.summary && (
            <Text 
              fontSize="sm" 
              color={secondaryTextColor} 
              mb={2} 
              isTruncated
            >
              {item.summary}
            </Text>
          )}
          
          <Flex justifyContent="space-between" alignItems="center" mt={1}>
            {showSource && (
              <Text fontSize="xs" color={secondaryTextColor}>
                {item.source}
              </Text>
            )}
            
            <Flex alignItems="center">
              {metadataDisplay && (
                <Text fontSize="xs" color={secondaryTextColor} mr={2}>
                  {metadataDisplay}
                </Text>
              )}
              <Text fontSize="xs" color={secondaryTextColor}>
                {timeAgo}
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default HotItemCard; 