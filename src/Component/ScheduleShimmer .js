import React from 'react';
import { View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const ScheduleShimmer = () => {
    return (
        <>
            {[...Array(10)].map((_, index) => (
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
                    {/* Image Column */}
                    <View style={{ width: '23%', alignItems: 'flex-start' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                            }}
                        />
                    </View>

                    {/* Name + Mobile Column */}
                    <View style={{ width: '32%' }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{
                                width: '90%',
                                height: 12,
                                borderRadius: 4,
                                marginBottom: 6,
                            }}
                        />

                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{
                                width: '70%',
                                height: 12,
                                borderRadius: 4,
                            }}
                        />
                    </View>

                    {/* Total Days Column */}
                    <View
                        style={{
                            width: '35.5%',
                            alignItems: 'flex-end',
                            paddingRight: 12,
                        }}
                    >
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{
                                width: 40,
                                height: 12,
                                borderRadius: 4,
                            }}
                        />
                    </View>

                    {/* Action Column */}
                    <View
                        style={{
                            width: '13.5%',
                            alignItems: 'center',
                        }}
                    >
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{
                                width: 18,
                                height: 18,
                                borderRadius: 9,
                            }}
                        />
                    </View>
                </View>
            ))}
        </>
    );
};

export default ScheduleShimmer;