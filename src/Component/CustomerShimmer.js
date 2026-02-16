import React from 'react';
import { View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const CustomerShimmer = () => {
    // A loop to create 5 shimmer rows — you can change the number
    const shimmerRows = Array.from({ length: 11 }).map((_, index) => (
        <View
            key={index}
            style={{
                flexDirection: 'row',
                padding: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#ddd',
                alignItems: 'center',
            }}
        >
            {/* Index Placeholder */}
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{ width: '7%', height: 14, borderRadius: 4 }}
            />

            {/* Customer Name */}
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{ width: '30%', height: 14, borderRadius: 4, marginLeft: 8 }}
            />

            {/* RC Number and Status */}
            <View style={{ marginLeft: 8 }}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={{ width: '28%', height: 14, borderRadius: 4 }}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={{ width: 50, height: 16, borderRadius: 5, marginTop: 5 }}
                />
            </View>
            {/* Date */}


            {/* Entry Date */}
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{ width: 30, height: 14, borderRadius: 4, marginLeft: 8 }}
            />

            {/* Action Icon */}
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{ width: 20, height: 20, borderRadius: 10, marginLeft: 8 }}
            />
        </View>
    ));

    return <>{shimmerRows}</>;
};

export default CustomerShimmer;
