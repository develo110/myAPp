import React, { createContext, useContext, ReactNode } from 'react';
import { useVideoAutoplay } from '../hooks/useVideoAutoplay';

interface VideoAutoplayContextType {
  registerVideo: (id: string, player: any) => () => void;
  unregisterVideo: (id: string) => void;
  updateVideoVisibility: (id: string, isVisible: boolean, visibilityPercentage?: number) => void;
  isVideoPlaying: (id: string) => boolean;
  pauseVideo: (id: string) => void;
  playVideo: (id: string, unmuted?: boolean) => void;
  shouldAutoplay: boolean;
  currentlyPlaying: string | null;
}

const VideoAutoplayContext = createContext<VideoAutoplayContextType | undefined>(undefined);

export const VideoAutoplayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const autoplayHook = useVideoAutoplay();

  return (
    <VideoAutoplayContext.Provider value={autoplayHook}>
      {children}
    </VideoAutoplayContext.Provider>
  );
};

export const useVideoAutoplayContext = () => {
  const context = useContext(VideoAutoplayContext);
  if (context === undefined) {
    throw new Error('useVideoAutoplayContext must be used within a VideoAutoplayProvider');
  }
  return context;
};