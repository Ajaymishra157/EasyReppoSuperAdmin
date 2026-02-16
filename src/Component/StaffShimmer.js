import React from 'react';
import { View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const StaffShimmer = () => {
    return (
        <View style={{
            flexDirection: 'row',
            backgroundColor: '#fff',
            padding: 10,
            marginBottom: 7,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#ddd',
            alignItems: 'center',
        }}>
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                }}
            />
            <View style={{ marginLeft: 15, flex: 1 }}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={{
                        height: 12,
                        borderRadius: 4,
                        marginBottom: 8,
                    }}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={{
                        height: 12,
                        borderRadius: 4,
                        marginBottom: 8,
                        width: '60%',
                    }}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={{
                        height: 12,
                        borderRadius: 4,
                        marginBottom: 8,
                        width: '40%',
                    }}
                />
            </View>
        </View>
    );
};

export default StaffShimmer;
