import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

/**
 * Component to extract thumbnail from video URL
 * Uses expo-av's Video.getThumbnailAsync to extract a frame from the video
 */
const VideoThumbnailExtractor = ({ videoUrl, onThumbnailExtracted, videoId }) => {
  const videoRef = useRef(null);
  const hasTriedExtraction = useRef(false);

  useEffect(() => {
    const extractThumbnail = async () => {
      if (!videoUrl || hasTriedExtraction.current) return;
      
      hasTriedExtraction.current = true;

      try {
        console.log(`Attempting to extract thumbnail for video ${videoId} from ${videoUrl}`);
        
        // Try to extract thumbnail directly using getThumbnailAsync
        // This should work with remote URLs on iOS and Android
        const thumbnail = await Video.getThumbnailAsync(
          videoUrl,
          {
            time: 1000, // Get frame at 1 second
            quality: 0.8,
          }
        );
        
        if (thumbnail?.uri) {
          console.log(`✅ Successfully extracted thumbnail for video ${videoId}: ${thumbnail.uri}`);
          onThumbnailExtracted?.(videoId, thumbnail.uri);
        } else {
          console.log(`⚠️ Thumbnail extraction returned no URI for video ${videoId}`);
        }
      } catch (error) {
        console.log(`❌ Failed to extract thumbnail for video ${videoId}:`, error.message);
        // If direct extraction fails, the video component fallback will try
      }
    };

    // Try direct extraction first
    extractThumbnail();
  }, [videoUrl, videoId]);

  // Also render a hidden video component as fallback
  // Sometimes getThumbnailAsync works better after the video is loaded
  return (
    <View style={styles.hidden}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.hiddenVideo}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls={false}
        shouldPlay={false}
        isLooping={false}
        isMuted={true}
        onLoad={async (loadStatus) => {
          // Once video is loaded, try extracting thumbnail again (as fallback)
          if (loadStatus.status?.isLoaded && !hasTriedExtraction.current) {
            try {
              const thumbnail = await Video.getThumbnailAsync(videoUrl, {
                time: 1000,
                quality: 0.8,
              });
              if (thumbnail?.uri) {
                console.log(`✅ Extracted thumbnail after video load for ${videoId}`);
                onThumbnailExtracted?.(videoId, thumbnail.uri);
                hasTriedExtraction.current = true;
              }
            } catch (err) {
              console.log(`Thumbnail extraction error after video load: ${err.message}`);
            }
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  hiddenVideo: {
    width: 1,
    height: 1,
  },
});

export default VideoThumbnailExtractor;

