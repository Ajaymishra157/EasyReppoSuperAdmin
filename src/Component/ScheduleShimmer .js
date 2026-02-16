import React from 'react';
import { View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const ScheduleShimmer = () => {
    return (
        <>
            {[...Array(11)].map((_, index) => (
                <View
                    key={index}
                    style={{
                        flexDirection: 'row',
                        backgroundColor: '#fff',
                        padding: 10,
                        marginBottom: 7,
                        borderRadius: 5,
                        borderWidth: 1,
                        borderColor: '#ddd',
                        alignItems: 'center',
                    }}
                >
                    {/* Index Column */}
                    <View style={{ width: '8%', alignItems: 'center' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 20, height: 12, borderRadius: 4 }}
                        />
                    </View>

                    {/* Name Column */}
                    <View style={{ width: '32%', alignItems: 'center' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '90%', height: 12, borderRadius: 4, marginBottom: 6 }}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '70%', height: 12, borderRadius: 4 }}
                        />
                    </View>

                    {/* Date Column */}
                    <View style={{ width: '35%', alignItems: 'center' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '80%', height: 12, borderRadius: 4, marginBottom: 6 }}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '80%', height: 12, borderRadius: 4 }}
                        />
                    </View>

                    {/* Total Days Column */}
                    <View style={{ width: '12.5%', alignItems: 'center' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 20, height: 12, borderRadius: 4 }}
                        />
                    </View>

                    {/* Actions Column */}
                    <View style={{ width: '12.5%', alignItems: 'center' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: 16, height: 16, borderRadius: 8 }}
                        />
                    </View>
                </View>
            ))}
        </>
    );
};

export default ScheduleShimmer;
