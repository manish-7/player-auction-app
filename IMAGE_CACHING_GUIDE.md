# Image Caching System

## Overview
The image caching system preloads and caches player images to improve performance and user experience.

## Features

### 1. **Automatic Preloading**
- Images are preloaded when Excel file is uploaded
- Sample data images are also preloaded
- Progress indicator shows loading status

### 2. **Smart Caching**
- Images are converted to blob URLs for better caching
- Cached images load instantly
- Memory management with cleanup

### 3. **Performance Benefits**
- **Instant Loading**: Cached images appear immediately
- **Reduced Network Requests**: Images loaded once, used everywhere
- **Better UX**: No loading delays during auction

## How It Works

### When Excel is Uploaded:
1. **Validation**: Excel data is validated
2. **Image Discovery**: Extract image URLs from player data
3. **Preloading**: All images are loaded in background
4. **Progress**: Real-time progress indicator
5. **Caching**: Images stored in memory cache

### During Auction:
1. **Instant Display**: Images load from cache immediately
2. **Fallback**: If not cached, loads normally with spinner
3. **Error Handling**: Graceful fallback to placeholder

## Usage Examples

### Excel File Format:
| Player Name | Role | Base Price | Rating | Image URL |
|-------------|------|------------|--------|-----------|
| Virat Kohli | Batsman | 200 | 95 | https://drive.google.com/uc?export=view&id=FILE_ID |

### Google Drive Image URLs:
```
Original: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
Convert to: https://drive.google.com/uc?export=view&id=FILE_ID
```

## Performance Improvements

### Before Caching:
- Images load individually during auction
- 2-5 second delays per image
- Network requests during critical auction moments

### After Caching:
- All images preloaded during setup
- Instant display during auction
- Smooth, professional experience

## Technical Details

### Cache Service:
- Singleton pattern for global access
- Blob URL creation for better caching
- Promise-based loading with timeout
- Memory cleanup to prevent leaks

### Integration Points:
- PlayerInventory: Preloads on Excel upload
- PlayerImage: Uses cached images first
- Automatic fallback for uncached images
