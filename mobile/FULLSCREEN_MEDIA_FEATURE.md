# Full-Screen Media Viewer Feature

## Overview

This feature allows users to view images and videos in full-screen mode when they tap on media content in posts. The implementation provides an immersive viewing experience with intuitive controls.

## Features

### Image Viewing
- **Full-screen display** with black background for optimal viewing
- **Tap to show/hide controls** with auto-hide after 3 seconds
- **Contain resize mode** to fit images properly on screen
- **Download and share buttons** in bottom controls overlay
- **Username display** in top header
- **Close button** with X icon

### Video Viewing  
- **Full-screen video playback** with native controls
- **Unmuted playback** (different from autoplay behavior)
- **Looped playback** for continuous viewing
- **Tap to show/hide controls** with auto-hide functionality
- **Native video controls** when visible
- **Picture-in-picture disabled** for focused viewing

### User Experience
- **Smooth fade animation** when opening/closing
- **Status bar hidden** for immersive experience
- **Safe area handling** for different device types
- **Intuitive tap gestures** for control interaction

## Technical Implementation

### Components Created
- `FullScreenMediaModal.tsx` - Main modal component for full-screen viewing

### Components Modified
- `PostCard.tsx` - Added tap handlers and modal integration
- Added separate handlers for image and video taps
- Integrated FullScreenMediaModal component

### Key Features
1. **Smart Tap Handling**
   - Images: Direct full-screen on tap
   - Videos: Unmute if autoplaying, otherwise full-screen

2. **Control Management**
   - Auto-hide controls after 3 seconds
   - Show controls on tap
   - Different control sets for images vs videos

3. **Video Player Integration**
   - Separate video player instance for full-screen
   - Unmuted playback with looping
   - Native controls integration

## Usage

### For Users
1. **View Image Full-Screen**: Tap any image in a post
2. **View Video Full-Screen**: Tap a video that's not currently autoplaying
3. **Control Visibility**: Tap anywhere on the media to show/hide controls
4. **Close Viewer**: Tap the X button in the top-left corner

### For Developers
The modal is automatically integrated into PostCard components:

```typescript
// The modal is included in each PostCard
<FullScreenMediaModal
  visible={isFullScreenVisible}
  onClose={() => setIsFullScreenVisible(false)}
  mediaType={post.mediaType === "image" ? "image" : "video"}
  mediaUri={post.image || post.video}
  userName={post.user.username}
/>
```

## Integration with Video Autoplay

The full-screen feature works seamlessly with the video autoplay system:
- **Autoplaying videos**: Tap to unmute and show controls (stays in feed)
- **Non-autoplaying videos**: Tap to open full-screen viewer
- **Full-screen videos**: Independent player instance with different settings

## Future Enhancements

Potential improvements:
- **Pinch-to-zoom** for images
- **Pan gestures** for navigation
- **Swipe to close** gesture
- **Image download functionality**
- **Share functionality**
- **Multiple image gallery support**
- **Video quality selection**
- **Playback speed controls**

## Files Modified/Created

### New Files
- `mobile/components/FullScreenMediaModal.tsx`
- `mobile/FULLSCREEN_MEDIA_FEATURE.md`

### Modified Files
- `mobile/components/PostCard.tsx`
  - Added `handleImageTap` and updated `handleVideoTap`
  - Added `isFullScreenVisible` state
  - Integrated FullScreenMediaModal component
  - Added tap handlers to image and video TouchableOpacity components

## Dependencies

No additional dependencies required - uses existing:
- `expo-video` for video playback
- `react-native` core components
- `@expo/vector-icons` for UI icons