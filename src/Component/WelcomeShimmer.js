import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const WelcomeShimmer = () => {
    return (
        <View style={styles.container}>
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={styles.welcomeText}
            />
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={styles.nameText}
            />
        </View>
    );
};

export default WelcomeShimmer;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
        height: 30,
    },
    welcomeText: {
        width: 70,
        height: 18,
        borderRadius: 4,
    },
    nameText: {
        width: 100,
        height: 18,
        borderRadius: 4,
        marginLeft: 10,
    },
});
