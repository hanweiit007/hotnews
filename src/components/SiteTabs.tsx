import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  useColorMode, 
  Image, 
  Center
} from '@chakra-ui/react';
import { Site } from '../types';
import { useNavigate } from 'react-router-dom';

interface SiteTabsProps {
  sites: Site[];
  activeSiteId?: string | null;
}

const SiteTabs: React.FC<SiteTabsProps> = ({ sites, activeSiteId }) => {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  
  const bgColor = colorMode === 'light' ? 'white' : 'gray.800';
  const borderColor = colorMode === 'light' ? 'gray.200' : 'gray.700';
  
  const handleSiteClick = (siteId: string) => {
    navigate(`/site/${siteId}`);
  };
  
  return (
    <Box 
      py={2} 
      bg={bgColor} 
      borderBottomWidth="1px" 
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex 
        overflowX="auto" 
        py={1} 
        px={2}
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          '-ms-overflow-style': 'none',
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
            bg={site.id === activeSiteId ? 'primary.main' : 'transparent'}
            color={site.id === activeSiteId ? 'white' : 'gray.600'}
            onClick={() => handleSiteClick(site.id)}
            transition="all 0.2s"
            _hover={{
              bg: site.id === activeSiteId ? 'primary.main' : 'gray.100',
            }}
            minWidth="72px"
            textAlign="center"
          >
            <Center flexDirection="column">
              <Center
                bg={site.id === activeSiteId ? 'white' : 'primary.main'}
                color={site.id === activeSiteId ? 'primary.main' : 'white'}
                borderRadius="full"
                width="30px"
                height="30px"
                fontSize="xs"
                fontWeight="bold"
                mb={1}
              >
                {site.icon}
              </Center>
              <Text fontSize="xs" fontWeight="medium">
                {site.name.zh}
              </Text>
            </Center>
          </Box>
        ))}
      </Flex>
    </Box>
  );
};

export default SiteTabs; 