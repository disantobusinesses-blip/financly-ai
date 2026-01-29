/**
 * iOS-specific utility functions for enhanced mobile experience
 */

/**
 * Trigger haptic feedback on supported devices
 * @param type - Type of haptic feedback
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator === 'undefined') return;
  
  // Standard Vibration API
  if ('vibrate' in navigator) {
    const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30;
    navigator.vibrate(duration);
  }
  
  // Future: Can add iOS Haptic Feedback API when available via native bridge
};

/**
 * Check if the device is an iOS device
 */
export const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for iPad, iPhone, iPod
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
};

/**
 * Check if the device supports Face ID or Touch ID
 * Note: This is a placeholder for future WebAuthn integration
 */
export const supportsBiometrics = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if WebAuthn is available (can be used for Face ID/Touch ID)
  return 'PublicKeyCredential' in window;
};

/**
 * Request biometric authentication
 * Note: This is a placeholder for future implementation
 */
export const requestBiometricAuth = async (): Promise<boolean> => {
  if (!supportsBiometrics()) {
    console.warn('Biometric authentication not supported on this device');
    return false;
  }
  
  // Placeholder for future WebAuthn implementation
  // This would integrate with Face ID/Touch ID on iOS
  console.log('Biometric authentication would be triggered here');
  return false;
};

/**
 * Get the current iOS system theme
 */
export const getIOSSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return darkModeQuery.matches ? 'dark' : 'light';
};

/**
 * Listen for iOS system theme changes
 */
export const listenForThemeChanges = (callback: (theme: 'light' | 'dark') => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  darkModeQuery.addEventListener('change', handler);
  
  return () => {
    darkModeQuery.removeEventListener('change', handler);
  };
};

/**
 * Add swipe gesture support to an element
 */
export const addSwipeGesture = (
  element: HTMLElement,
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) => {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleGesture();
  };

  const handleGesture = () => {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Check if horizontal swipe is more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        triggerHaptic('light');
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        triggerHaptic('light');
        onSwipeLeft();
      }
    }
  };

  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchend', handleTouchEnd);

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

/**
 * Check if running in standalone mode (added to home screen)
 */
export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone === true
  );
};
