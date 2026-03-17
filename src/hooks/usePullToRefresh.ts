import { useState, useRef } from "react";

export function usePullToRefresh(isAlertsOpen: boolean = false, onRefresh?: () => Promise<void>) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop <= 0 && !isAlertsOpen) {
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isRefreshing) return;
    
    const target = e.currentTarget as HTMLElement;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startY.current;
    const diffX = currentX - startX.current;
    
    if (Math.abs(diffX) > Math.abs(diffY)) return;
    
    if (target.scrollTop <= 0 && diffY > 0) {
      if (e.cancelable) e.preventDefault();
      setPullY(Math.pow(diffY, 0.8));
    } else if (diffY < 0) {
      setIsDragging(false);
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    setIsDragging(false);
    if (pullY > 80) {
      setIsRefreshing(true);
      setPullY(80);
      if (navigator.vibrate) navigator.vibrate(20);
      
      if (onRefresh) {
        try {
          await onRefresh();
        } catch (e) {}
        setIsRefreshing(false);
        setPullY(0);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } else {
      setPullY(0);
    }
  };

  return {
    pullY,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
