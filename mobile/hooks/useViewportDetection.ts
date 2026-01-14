import { useEffect, useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';

interface ViewportDetectionOptions {
  threshold?: number; // Percentage of element that must be visible (0-1)
  rootMargin?: number; // Additional margin around the root
}

export const useViewportDetection = (
  onVisibilityChange: (isVisible: boolean, visibilityRatio: number) => void,
  options: ViewportDetectionOptions = {}
) => {
  const { threshold = 0.5, rootMargin = 0 } = options;
  const elementRef = useRef<View>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // For React Native, we'll use a simpler approach with onLayout and scroll events
    // This is a basic implementation - in a production app, you might want to use
    // a more sophisticated solution like react-native-intersection-observer

    let timeoutId: NodeJS.Timeout;

    const checkVisibility = () => {
      if (!element) return;

      element.measureInWindow((x, y, width, height) => {
        // Get screen dimensions
        const screenHeight = require('react-native').Dimensions.get('window').height;
        const screenWidth = require('react-native').Dimensions.get('window').width;

        // Calculate visibility
        const elementTop = y;
        const elementBottom = y + height;
        const elementLeft = x;
        const elementRight = x + width;

        // Check if element is within viewport bounds
        const isInVerticalBounds = elementBottom > rootMargin && elementTop < screenHeight - rootMargin;
        const isInHorizontalBounds = elementRight > rootMargin && elementLeft < screenWidth - rootMargin;

        if (isInVerticalBounds && isInHorizontalBounds) {
          // Calculate how much of the element is visible
          const visibleTop = Math.max(elementTop, rootMargin);
          const visibleBottom = Math.min(elementBottom, screenHeight - rootMargin);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          const visibilityRatio = visibleHeight / height;

          const newIsVisible = visibilityRatio >= threshold;
          
          if (newIsVisible !== isVisible) {
            setIsVisible(newIsVisible);
            onVisibilityChange(newIsVisible, visibilityRatio);
          }
        } else if (isVisible) {
          setIsVisible(false);
          onVisibilityChange(false, 0);
        }
      });
    };

    // Initial check
    timeoutId = setTimeout(checkVisibility, 100);

    // Set up periodic checks (not ideal, but works for basic implementation)
    const intervalId = setInterval(checkVisibility, 500);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [threshold, rootMargin, isVisible, onVisibilityChange]);

  return elementRef;
};