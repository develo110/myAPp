# ImagePicker Deprecation Fix

## Issue
The app was showing a warning about deprecated `ImagePicker.MediaTypeOptions` usage:
```
WARN [expo-image-picker] `ImagePicker.MediaTypeOptions` have been deprecated. Use `ImagePicker.MediaType` or an array of `ImagePicker.MediaType` instead
```

## Solution
Updated all instances of the deprecated `ImagePicker.MediaTypeOptions` to use the new array syntax.

## Files Changed

### 1. `mobile/hooks/useImageUpload.ts`
**Before:**
```typescript
mediaTypes: ImagePicker.MediaTypeOptions.Images,
```

**After:**
```typescript
mediaTypes: ["images"],
```

### 2. `mobile/components/MessageInput.tsx`
**Before:**
```typescript
mediaTypes: ImagePicker.MediaTypeOptions.Images,
mediaTypes: ImagePicker.MediaTypeOptions.Videos,
```

**After:**
```typescript
mediaTypes: ["images"],
mediaTypes: ["videos"],
```

## New API Usage
The new expo-image-picker API uses an array of strings instead of the deprecated enum:

- `ImagePicker.MediaTypeOptions.Images` → `["images"]`
- `ImagePicker.MediaTypeOptions.Videos` → `["videos"]`
- `ImagePicker.MediaTypeOptions.All` → `["images", "videos"]`

## Files Already Using Correct API
The following files were already using the correct array syntax:
- `mobile/hooks/useCreatePost.ts` - Already using `mediaTypes: ["images"]` and `mediaTypes: ["videos"]`

## Result
- ✅ All deprecation warnings resolved
- ✅ No breaking changes to functionality
- ✅ Code is now future-proof with the latest expo-image-picker API
- ✅ All TypeScript diagnostics pass

## Testing
All image and video picker functionality should work exactly as before:
- Profile/banner image uploads
- Post creation with media
- Message attachments (images and videos)
- Camera capture functionality