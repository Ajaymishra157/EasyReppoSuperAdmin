import React from 'react';
import { View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const AreaShimmer = () => {
    return (
        <>
            {[...Array(15)].map((_, index) => (
                <View
                    key={index}
                    style={{
                        flexDirection: 'row',
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#ddd',
                        backgroundColor: 'white',
                    }}
                >
                    {/* Index */}
                    <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 20, height: 14, borderRadius: 4 }}
                        />
                    </View>

                    {/* Area Name */}
                    <View style={{ width: '30%', justifyContent: 'center', alignItems: 'center' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '80%', height: 14, borderRadius: 4 }}
                        />
                    </View>

                    {/* Address */}
                    <View style={{ width: '30%', justifyContent: 'center', alignItems: 'flex-start' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '90%', height: 14, borderRadius: 4 }}
                        />
                    </View>

                    {/* Status */}
                    <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 50, height: 14, borderRadius: 4 }}
                        />
                    </View>

                    {/* Dots Icon */}
                    <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 18, height: 18, borderRadius: 9 }}
                        />
                    </View>
                </View>
            ))}
        </>
    );
};

export default AreaShimmer;
