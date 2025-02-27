// Re-export the JSX runtime for development
export * from './jsx-runtime';

// Export jsxDEV for development mode
import { jsx } from './jsx-runtime';
export const jsxDEV = jsx; 