# Post Sharing to Followers Feature

## Overview
This feature allows users to share posts directly to their followers via private messages. Users can select multiple followers and send posts with an optional message.

## Backend Implementation

### New API Endpoints

1. **POST /api/messages/share-post-to-followers**
   - Shares a post to multiple selected followers
   - Creates individual conversations and messages for each follower
   - Respects messaging permissions and privacy settings
   - Returns success/failure statistics

2. **GET /api/messages/followers-for-sharing**
   - Returns list of followers who can receive messages
   - Filters out blocked users and those with restrictive messaging settings
   - Includes messaging permission status for each follower

### Key Features

- **Permission Checking**: Validates messaging permissions before sharing
- **Bulk Sharing**: Share to up to 20 followers at once
- **Message Requests**: Automatically handles message requests for non-mutual followers
- **Real-time Updates**: Sends socket events for instant notifications
- **Error Handling**: Provides detailed feedback on successful/failed shares

## Frontend Implementation

### Components

1. **PostShareModal** (`mobile/components/PostShareModal.tsx`)
   - Modal interface for selecting followers and composing message
   - Search functionality to find specific followers
   - Multi-select interface with visual feedback
   - Character limit for optional message (280 chars)

2. **PostCard** (Updated)
   - Added share button functionality
   - Integrates with PostShareModal

### Hooks

1. **usePostSharing** (`mobile/hooks/usePostSharing.ts`)
   - Manages API calls for post sharing
   - Handles loading states and error management
   - Provides reusable sharing functionality

## User Experience

### Sharing Flow
1. User taps share button on any post
2. Modal opens showing list of followers who can receive messages
3. User selects one or more followers (up to 20)
4. User can add optional message (up to 280 characters)
5. User taps "Share" to send
6. System provides feedback on successful/failed shares

### Privacy & Permissions
- Only followers who can receive messages are shown
- Respects user messaging settings (everyone, followers, mutual followers, etc.)
- Handles blocked users gracefully
- Shows message request status for non-mutual followers

### Message Display
- Shared posts appear as rich message bubbles in conversations
- Shows original post author, content, and media
- Maintains original post formatting and media

## Technical Details

### Database Schema
- Uses existing Message and Conversation models
- Message type: "post_share"
- References original post via `sharedPost` field

### Real-time Features
- Socket.io events for instant message delivery
- Notification system integration
- Live conversation updates

### Error Handling
- Graceful handling of permission failures
- Detailed error reporting for failed shares
- Fallback messaging for edge cases

## Usage Examples

### Share Post to Followers
```typescript
const { sharePostToFollowers } = usePostSharing();

const result = await sharePostToFollowers(
  postId,
  ['follower1_id', 'follower2_id'],
  'Check out this amazing post!'
);
```

### Load Available Followers
```typescript
const { loadFollowers, followers } = usePostSharing();

const followersList = await loadFollowers();
```

## Security Considerations

- Validates user permissions before sharing
- Prevents spam by limiting to 20 recipients per share
- Respects user privacy settings
- Validates post ownership and existence
- Rate limiting through existing middleware

## Future Enhancements

- Share to groups/conversations
- Share to external platforms
- Share analytics and tracking
- Scheduled sharing
- Share templates/quick messages