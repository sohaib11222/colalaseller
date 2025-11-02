import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ThemedText from './ThemedText';
import { STATIC_COLORS } from './ThemeProvider';

const VideoPlayerWebView = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { videoUrl, title } = route.params || {};
    const [hasError, setHasError] = useState(false);

    // Extract YouTube video ID - improved to handle all URL formats
    const extractYouTubeId = (url) => {
        if (!url) return null;
        
        // Clean the URL
        let cleanUrl = url.trim();
        
        // Handle various YouTube URL formats
        const patterns = [
            // youtube.com/watch?v=VIDEO_ID
            /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
            // youtu.be/VIDEO_ID
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            // youtube.com/embed/VIDEO_ID
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            // youtube.com/v/VIDEO_ID
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        ];
        
        for (const pattern of patterns) {
            const match = cleanUrl.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    };

    // Normalize video URL - handle relative paths and YouTube URLs
    const normalizeVideoUrl = (url) => {
        if (!url) return null;
        
        // Check if it's a YouTube URL
        const videoId = extractYouTubeId(url);
        if (videoId) {
            // Return YouTube embed URL with proper parameters
            return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&playsinline=1&modestbranding=1&controls=1&showinfo=0&origin=${encodeURIComponent('https://colala.hmstech.xyz')}`;
        }
        
        // Check if it's already a full URL (starts with http:// or https://)
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // It's a relative path, prepend the storage base URL
        const baseUrl = 'http://colala.hmstech.xyz/storage';
        // Remove leading slash if present to avoid double slashes
        const cleanPath = url.startsWith('/') ? url.substring(1) : url;
        return `${baseUrl}/${cleanPath}`;
    };

    const getEmbedUrl = (url) => {
        return normalizeVideoUrl(url);
    };

    if (!videoUrl) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={STATIC_COLORS.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Video Player</ThemedText>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.errorContainer}>
                    <ThemedText style={styles.errorText}>No video URL provided</ThemedText>
                </View>
            </SafeAreaView>
        );
    }

    const embedUrl = getEmbedUrl(videoUrl);
    const isYouTube = extractYouTubeId(videoUrl) !== null;
    const isDirectVideo = embedUrl && !isYouTube && (embedUrl.endsWith('.mp4') || embedUrl.endsWith('.mov') || embedUrl.endsWith('.webm') || embedUrl.includes('/storage/'));

    // Handle WebView errors
    const handleWebViewError = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView error:', nativeEvent);
        setHasError(true);
        
        // If it's a YouTube video and embed fails, offer to open in YouTube app
        if (isYouTube && videoUrl) {
            Alert.alert(
                'Video Playback Error',
                'Unable to play video in app. Would you like to watch it on YouTube?',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
                    { 
                        text: 'Open in YouTube', 
                        onPress: async () => {
                            try {
                                const supported = await Linking.canOpenURL(videoUrl);
                                if (supported) {
                                    await Linking.openURL(videoUrl);
                                }
                                navigation.goBack();
                            } catch (error) {
                                console.error('Error opening YouTube:', error);
                                navigation.goBack();
                            }
                        }
                    }
                ]
            );
        }
    };

    // Handle WebView navigation state changes
    const handleNavigationStateChange = (navState) => {
        // Check if navigation contains error messages
        if (navState.url && navState.url.includes('error') || navState.url.includes('youtube.com/error')) {
            setHasError(true);
        }
    };

    // HTML template for YouTube embed with better error handling
    const htmlContentYouTube = isYouTube ? `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    html, body {
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        background-color: #000;
                    }
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .video-container {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                        max-width: 100%;
                        max-height: 100%;
                    }
                </style>
            </head>
            <body>
                <div class="video-container">
                    <iframe
                        src="${embedUrl}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
                    ></iframe>
                </div>
            </body>
        </html>
    ` : null;

    // HTML template for direct video playback (MP4, etc.)
    const htmlContentDirectVideo = isDirectVideo ? `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    html, body {
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        background-color: #000;
                    }
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .video-container {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    video {
                        width: 100%;
                        height: 100%;
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                    }
                </style>
            </head>
            <body>
                <div class="video-container">
                    <video
                        controls
                        autoplay
                        playsinline
                        src="${embedUrl}"
                        style="width: 100%; height: 100%;"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            </body>
        </html>
    ` : null;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={STATIC_COLORS.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>
                    {title || 'Video Tutorial'}
                </ThemedText>
                <View style={styles.placeholder} />
            </View>

            {!hasError ? (
                isYouTube && htmlContentYouTube ? (
                    <WebView
                        source={{ html: htmlContentYouTube }}
                        startInLoadingState
                        renderLoading={() => (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={STATIC_COLORS.primary} />
                                <ThemedText style={styles.loadingText}>Loading video...</ThemedText>
                            </View>
                        )}
                        style={styles.webview}
                        allowsFullscreenVideo={true}
                        mediaPlaybackRequiresUserAction={false}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        onError={handleWebViewError}
                        onHttpError={handleWebViewError}
                        onNavigationStateChange={handleNavigationStateChange}
                        originWhitelist={['*']}
                        mixedContentMode="always"
                    />
                ) : isDirectVideo && htmlContentDirectVideo ? (
                    <WebView
                        source={{ html: htmlContentDirectVideo }}
                        startInLoadingState
                        renderLoading={() => (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={STATIC_COLORS.primary} />
                                <ThemedText style={styles.loadingText}>Loading video...</ThemedText>
                            </View>
                        )}
                        style={styles.webview}
                        allowsFullscreenVideo={true}
                        mediaPlaybackRequiresUserAction={false}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        onError={handleWebViewError}
                        onHttpError={handleWebViewError}
                        originWhitelist={['*']}
                        mixedContentMode="always"
                    />
                ) : (
                    <WebView
                        source={{ uri: embedUrl }}
                        startInLoadingState
                        renderLoading={() => (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={STATIC_COLORS.primary} />
                                <ThemedText style={styles.loadingText}>Loading video...</ThemedText>
                            </View>
                        )}
                        style={styles.webview}
                        allowsFullscreenVideo={true}
                        mediaPlaybackRequiresUserAction={false}
                        onError={handleWebViewError}
                        onHttpError={handleWebViewError}
                        originWhitelist={['*']}
                    />
                )
            ) : (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={STATIC_COLORS.primary} />
                    <ThemedText style={styles.errorText}>Unable to load video</ThemedText>
                    <ThemedText style={styles.errorSubText}>
                        The video may be restricted or unavailable
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            setHasError(false);
                        }}
                    >
                        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
                    </TouchableOpacity>
                    {isYouTube && videoUrl && (
                        <TouchableOpacity
                            style={[styles.retryButton, styles.youtubeButton]}
                            onPress={async () => {
                                try {
                                    const supported = await Linking.canOpenURL(videoUrl);
                                    if (supported) {
                                        await Linking.openURL(videoUrl);
                                    }
                                } catch (error) {
                                    console.error('Error opening YouTube:', error);
                                }
                            }}
                        >
                            <Ionicons name="logo-youtube" size={20} color="#fff" />
                            <ThemedText style={styles.retryButtonText}>Open in YouTube</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ECEEF2',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: STATIC_COLORS.text,
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 32,
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        marginTop: 12,
        color: '#fff',
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginTop: 16,
    },
    errorSubText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: STATIC_COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    youtubeButton: {
        backgroundColor: '#FF0000',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default VideoPlayerWebView;

