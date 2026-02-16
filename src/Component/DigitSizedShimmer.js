// DigitSizedShimmer.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

const DigitSizedShimmer = () => {
    return (
        <ShimmerPlaceholder
            style={styles.shimmer}
            shimmerStyle={styles.shimmer}
            autoRun={true}
        />
    );
};

const styles = StyleSheet.create({
    shimmer: {
        width: 24,      // Enough for 2 digits
        height: 20,
        borderRadius: 4,
    },
});

export default DigitSizedShimmer;
