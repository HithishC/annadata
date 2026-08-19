import { useState, useEffect } from 'react';
import { AppState } from 'react-native';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('https://www.google.com', {
          method: 'HEAD',
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    checkConnection();

    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return isOnline;
}