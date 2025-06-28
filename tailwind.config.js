/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      
      // Mobile-first breakpoints
      screens: {
        'xs': '320px',    // Small devices
        'sm': '480px',    // Medium devices  
        'md': '768px',    // Large devices
        'lg': '1024px',   // Extra large devices
        'xl': '1280px',   // Extra extra large
        '2xl': '1536px',  // Ultra wide
        
        // Custom breakpoints for specific use cases
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
        
        // Orientation-based breakpoints
        'landscape': {'raw': '(orientation: landscape)'},
        'portrait': {'raw': '(orientation: portrait)'},
        
        // Height-based breakpoints for mobile optimization
        'short': {'raw': '(max-height: 600px)'},
        'tall': {'raw': '(min-height: 800px)'},
      },
      
      // Enhanced spacing scale for mobile
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      
      // Mobile-optimized colors
      colors: {
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Touch feedback colors
        touch: {
          light: 'rgba(59, 130, 246, 0.1)',
          medium: 'rgba(59, 130, 246, 0.2)',
          dark: 'rgba(59, 130, 246, 0.3)',
        }
      },
      
      // Mobile-optimized typography
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.025em' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.05em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.05em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.075em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.075em' }],
        
        // Mobile-specific sizes
        'mobile-xs': ['0.75rem', { lineHeight: '1.5' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.5' }],
        'mobile-base': ['1rem', { lineHeight: '1.6' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.6' }],
        'mobile-xl': ['1.25rem', { lineHeight: '1.5' }],
        'mobile-2xl': ['1.5rem', { lineHeight: '1.4' }],
      },
      
      // Enhanced container sizes
      maxWidth: {
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
        'full': '100%',
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
        'screen-xl': '1280px',
        'screen-2xl': '1536px',
      },
      
      // Mobile-optimized animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'slide-left': 'slideLeft 0.2s ease-out',
        'slide-right': 'slideRight 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'loading': 'loading 1.5s infinite',
      },
      
      // Custom keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        loading: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      
      // Mobile-optimized shadows
      boxShadow: {
        'mobile': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'mobile-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'mobile-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'touch': '0 2px 8px rgba(59, 130, 246, 0.15)',
      },
      
      // Mobile-optimized border radius
      borderRadius: {
        'mobile': '0.375rem',
        'mobile-md': '0.5rem',
        'mobile-lg': '0.75rem',
        'mobile-xl': '1rem',
      },
      
      // Z-index scale for layering
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },
      
      // Mobile-optimized transitions
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '350': '350ms',
      },
      
      // Touch-friendly minimum sizes
      minHeight: {
        'touch': '44px',
        'button': '44px',
        'input': '44px',
      },
      
      minWidth: {
        'touch': '44px',
        'button': '44px',
      },
    },
  },
  plugins: [
    // Custom plugin for mobile utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Touch-friendly utilities
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        
        // Safe area utilities
        '.safe-area-inset': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
        },
        
        // GPU acceleration
        '.gpu-accelerated': {
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
        },
        
        // Mobile scroll optimization
        '.scroll-smooth-mobile': {
          '-webkit-overflow-scrolling': 'touch',
          scrollBehavior: 'smooth',
        },
        
        // Text optimization for mobile
        '.text-optimize-mobile': {
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
          textRendering: 'optimizeLegibility',
        },
        
        // Prevent zoom on input focus (iOS)
        '.no-zoom': {
          fontSize: '16px',
        },
        
        // Better tap highlights
        '.tap-highlight-none': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        
        '.tap-highlight-blue': {
          '-webkit-tap-highlight-color': 'rgba(59, 130, 246, 0.1)',
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
}