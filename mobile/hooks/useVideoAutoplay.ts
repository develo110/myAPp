import { useCallback, useState, useEffect } from 'react';
import { useVideoAutoplaySettings } from './useVideoAutoplaySettings';

interface VideoItem {
  id: string;
  player: any;
  isVisible: boolean;
  visibilityPercentage: number;
}

export const useVideoAutoplay = () => {
  const { shouldAutoplay } = useVideoAutoplaySettings();
  const [videos, setVideos] = useState<Map<string, VideoItem>>(new Map());
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  // Register a video for autoplay management
  const registerVideo = useCallback((id: string, player: any) => {
    setVideos(prev => {
      const newVideos = new Map(prev);
      newVideos.set(id, {
        id,
        player,
        isVisible: false,
        visibilityPercentage: 0,
      });
      return newVideos;
    });

    return () => {
      // Cleanup function
      setVideos(prev => {
        const newVideos = new Map(prev);
        newVideos.delete(id);
        return newVideos;
      });
    };
  }, []);

  // Update video visibility (to be called from PostCard when it enters/exits viewport)
  const updateVideoVisibility = useCallback((id: string, isVisible: boolean, visibilityPercentage: number = 0) => {
    setVideos(prev => {
      const newVideos = new Map(prev);
      const video = newVideos.get(id);
      if (video) {
        newVideos.set(id, {
          ...video,
          isVisible,
          visibilityPercentage,
        });
      }
      return newVideos;
    });
  }, []);

  // Unregister a video
  const unregisterVideo = useCallback((id: string) => {
    setVideos(prev => {
      const newVideos = new Map(prev);
      const video = newVideos.get(id);
      if (video && video.player) {
        video.player.pause();
      }
      newVideos.delete(id);
      return newVideos;
    });

    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
    }
  }, [currentlyPlaying]);

  // Determine which video should be playing
  useEffect(() => {
    if (!shouldAutoplay) {
      // Pause all videos if autoplay is disabled
      const videoArray = Array.from(videos.values());
      videoArray.forEach((video: VideoItem) => {
        if (video.player) {
          video.player.pause();
        }
      });
      setCurrentlyPlaying(null);
      return;
    }

    // Find the most visible video
    let mostVisibleVideo: VideoItem | null = null;
    let highestVisibility = 0;

    const videoArray = Array.from(videos.values());
    videoArray.forEach((video: VideoItem) => {
      if (video.isVisible && video.visibilityPercentage > highestVisibility) {
        mostVisibleVideo = video as VideoItem;
        highestVisibility = video.visibilityPercentage;
      }
    });

    const newPlayingId = mostVisibleVideo ? (mostVisibleVideo as VideoItem).id : null;

    if (newPlayingId !== currentlyPlaying) {
      // Pause currently playing video
      if (currentlyPlaying) {
        const currentVideo = videos.get(currentlyPlaying);
        if (currentVideo && (currentVideo as VideoItem).player) {
          (currentVideo as VideoItem).player.pause();
        }
      }

      // Play new video
      if (newPlayingId && mostVisibleVideo && (mostVisibleVideo as VideoItem).player) {
        (mostVisibleVideo as VideoItem).player.muted = true; // Always start muted
        (mostVisibleVideo as VideoItem).player.play();
      }

      setCurrentlyPlaying(newPlayingId);
    }
  }, [videos, shouldAutoplay, currentlyPlaying]);

  const isVideoPlaying = useCallback((id: string) => {
    return currentlyPlaying === id;
  }, [currentlyPlaying]);

  const pauseVideo = useCallback((id: string) => {
    const video = videos.get(id);
    if (video && video.player) {
      video.player.pause();
    }
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
    }
  }, [videos, currentlyPlaying]);

  const playVideo = useCallback((id: string, unmuted = false) => {
    const video = videos.get(id);
    if (video && video.player) {
      video.player.muted = !unmuted;
      video.player.play();
      setCurrentlyPlaying(id);
    }
  }, [videos]);

  return {
    registerVideo,
    unregisterVideo,
    updateVideoVisibility,
    isVideoPlaying,
    pauseVideo,
    playVideo,
    shouldAutoplay,
    currentlyPlaying,
  };
};