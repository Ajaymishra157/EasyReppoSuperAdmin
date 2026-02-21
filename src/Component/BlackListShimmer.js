import React from 'react';
import { View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../CommonFiles/Colors';

const BlackListShimmer = () => {
    return (
        <>
            {/* 🔎 Search Bar Shimmer */}
            <View
                style={{
                    backgroundColor: '#fff',
                    margin: 10,
                    borderRadius: 12,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: colors.Brown,
                }}>

                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={{
                        width: '70%',
                        height: 18,
                        borderRadius: 8,
                    }}
                />
            </View>

            {/* 👤 Staff Cards Shimmer */}
            {[...Array(6)].map((_, index) => (
                <View
                    key={index}
                    style={{
                        backgroundColor: '#fff',
                        marginHorizontal: 15,
                        marginVertical: 8,
                        padding: 14,
                        borderRadius: 14,
                        elevation: 4,
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 6,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}>

                    {/* Left Content */}
                    <View style={{ flex: 1, gap: 8 }}>

                        {/* Name */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{
                                width: '60%',
                                height: 16,
                                borderRadius: 6,
                            }}
                        />

                        {/* Mobile Row */}
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 55, height: 12, borderRadius: 4 }}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 90, height: 12, borderRadius: 4 }}
                            />
                        </View>

                        {/* Remark line 1 */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{
                                width: '90%',
                                height: 12,
                                borderRadius: 4,
                            }}
                        />

                        {/* Remark line 2 */}
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{
                                width: '70%',
                                height: 12,
                                borderRadius: 4,
                            }}
                        />

                    </View>

                    {/* Right dots */}
                    <View style={{ paddingTop: 4 }}>
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

export default BlackListShimmer;