import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  IconButton, 
  Input, 
  InputGroup, 
  InputRightElement,
  useTheme
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon, SettingsIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showRefresh?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title = '热搜聚合',
  showBack = false,
  showRefresh = true,
  showSearch = false,
  showSettings = true,
  onRefresh,
  onSearch,
  onSettingsClick,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate(-1);
  };
  
  return (
    <Box 
      as="header" 
      py={3} 
      px={4} 
      bg="primary.main" 
      color="white"
      position="sticky"
      top={0}
      zIndex={20}
    >
      <Flex justifyContent="space-between" alignItems="center">
        <Flex alignItems="center">
          {showBack && (
            <IconButton
              icon={<Box as="span" fontSize="xl">{'←'}</Box>}
              variant="ghost"
              color="white"
              aria-label="Back"
              mr={2}
              onClick={handleBack}
              _hover={{ bg: 'rgba(255,255,255,0.2)' }}
            />
          )}
          <Text fontSize="xl" fontWeight="bold">
            {title}
          </Text>
        </Flex>
        
        <Flex>
          {showSearch && (
            <InputGroup size="sm" maxW="160px" mr={2}>
              <Input 
                placeholder="搜索..." 
                bg="rgba(255,255,255,0.2)" 
                border="none"
                color="white"
                _placeholder={{ color: 'rgba(255,255,255,0.7)' }}
                onChange={(e) => onSearch && onSearch(e.target.value)}
              />
              <InputRightElement>
                <SearchIcon color="white" />
              </InputRightElement>
            </InputGroup>
          )}
          
          {showRefresh && (
            <IconButton
              icon={<RepeatIcon />}
              variant="ghost"
              color="white"
              aria-label="Refresh"
              mr={2}
              onClick={onRefresh}
              _hover={{ bg: 'rgba(255,255,255,0.2)' }}
            />
          )}
          
          {showSettings && (
            <IconButton
              icon={<SettingsIcon />}
              variant="ghost"
              color="white"
              aria-label="Settings"
              onClick={onSettingsClick}
              _hover={{ bg: 'rgba(255,255,255,0.2)' }}
            />
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header; 