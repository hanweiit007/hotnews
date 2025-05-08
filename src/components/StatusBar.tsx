import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Button,
  IconButton,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';

interface StatusBarProps {
  lastUpdated: Date | null;
  onSettingsClick?: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ lastUpdated, onSettingsClick }) => {
  // Format the last updated time
  const formattedTime = lastUpdated 
    ? `${lastUpdated.getHours().toString().padStart(2, '0')}:${lastUpdated.getMinutes().toString().padStart(2, '0')}`
    : '--:--';
  
  return (
    <Box 
      as="footer" 
      py={2} 
      px={4} 
      borderTopWidth="1px" 
      borderColor="gray.200"
      bg="white"
      position="sticky"
      bottom={0}
      zIndex={10}
    >
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize="xs" color="gray.500">
          上次更新: {formattedTime}
        </Text>
        
        <Button 
          size="sm" 
          variant="ghost" 
          colorScheme="gray"
          onClick={onSettingsClick}
          fontSize="xs"
        >
          <SettingsIcon mr={2} />
          设置
        </Button>
      </Flex>
    </Box>
  );
};

export default StatusBar; 