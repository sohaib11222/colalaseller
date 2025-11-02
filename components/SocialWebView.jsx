import React from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ThemedText from './ThemedText';

const SocialWebView = ({ route, navigation }) => {
    const { url, title } = route.params || {};

    if (!url) {
        return (
            <SafeAreaView style={styles.container}>
                <ThemedText>No URL provided</ThemedText>
            </SafeAreaView>
        );
    }

    // Ensure URL has protocol
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') 
        ? url 
        : `https://${url}`;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#101318" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>
                    {title || 'Social Link'}
                </ThemedText>
                <View style={styles.placeholder} />
            </View>

            <WebView
                source={{ uri: fullUrl }}
                startInLoadingState
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#E53E3E" />
                    </View>
                )}
                style={styles.webview}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ECEEF2',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#101318',
    },
    placeholder: {
        width: 32,
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});

export default SocialWebView;

