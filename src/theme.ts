import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    primary: {
      main: '#E53E3E', // 主要红色
      accent: '#2C5282', // 辅助深蓝色
    },
    background: {
      light: '#F7FAFC', // 主背景浅灰
      card: '#FFFFFF', // 卡片背景白色
      dark: '#1A202C', // 夜间模式背景深灰
    },
    text: {
      primary: '#1A202C', // 主要文字深灰
      secondary: '#4A5568', // 次要文字中灰
      hint: '#718096', // 提示文字浅灰
    },
    heat: {
      high: '#F56565', // 热度高红色
      medium: '#ED8936', // 热度中橙色
      low: '#4299E1', // 热度低蓝色
    },
  },
  fonts: {
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    heading: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '22px',
  },
  components: {
    Card: {
      baseStyle: {
        borderRadius: '12px',
        boxShadow: 'md',
        bg: 'background.card',
      },
    },
    Button: {
      variants: {
        primary: {
          bg: 'primary.main',
          color: 'white',
          borderRadius: '8px',
          _hover: {
            bg: 'red.600',
          },
        },
        secondary: {
          bg: 'transparent',
          color: 'primary.main',
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: '8px',
          _hover: {
            bg: 'red.50',
          },
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'background.light',
        color: 'text.primary',
      },
    },
  },
});

export default theme; 