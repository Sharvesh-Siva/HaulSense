import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Tier 1: Global Map Bootstrap Defense for Google Maps Platform Demo Key Quota
(window as any).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    args.some(
      (a) =>
        typeof a === 'string' &&
        (a.includes('OverQuotaMapError') || a.includes('QuotaExceededError'))
    )
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
  origConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(<App />);

