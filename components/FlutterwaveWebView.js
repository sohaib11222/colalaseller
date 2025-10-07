import React from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../contexts/AuthContext';
import { walletTopUp } from '../utils/queries/general';

const FlutterwaveWebView = ({ route, navigation }) => {
    const { amount, order_id, isTopUp = false } = route.params;
    const { token } = useAuth();

    const handleWebViewMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.event === 'success') {
                console.log('✅ Payment Success:', data.data);

                // Extract tx_ref or id from data (depends on how Flutterwave returns it)
                const tx_id = data.data?.id || data.data?.tx_ref || 'unknown';

                try {
                    let responseData;
                    if (isTopUp) {
                        // For top-up, use the wallet/top-up endpoint with fixed amount of 1000
                        responseData = await walletTopUp(1000, token);
                        console.log('✅ Top-up confirmation response:', responseData);
                        Alert.alert('Success', 'Wallet topped up successfully!');
                    } else {
                        // For regular payment - you might need to implement this endpoint
                        Alert.alert('Success', 'Payment confirmed!');
                        //navigate back to home screen
                        navigation.navigate('MainNavigator', { screen: 'Home' });
                    }
                } catch (error) {
                    console.warn('⚠️ Server responded with error:', error);
                    Alert.alert('Error', error.message || 'Something went wrong.');
                }

                navigation.goBack();

            } else if (data.event === 'failed') {
                Alert.alert('Payment Failed');
                navigation.goBack();
            } else if (data.event === 'closed') {
                navigation.goBack();
            }

        } catch (err) {
            console.error('❌ Error handling WebView message:', err);
            Alert.alert('Error', 'An unexpected error occurred.');
            navigation.goBack();
        }
    };

    const flutterwaveUrl = `https://hmstech.xyz/flutterwave-payment.html?amount=${amount}&order_id=${order_id}`;

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: flutterwaveUrl }}
                onMessage={handleWebViewMessage}
                startInLoadingState
                renderLoading={() => <ActivityIndicator size="large" color="#992C55" />}
            />
        </View>
    );
};

export default FlutterwaveWebView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 50,
    },
});
