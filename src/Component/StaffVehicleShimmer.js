import React from 'react';
import { View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../CommonFiles/Colors';

const StaffVehicleShimmer = () => {
    return (
        <View style={{ paddingTop: 5 }}>

            {/* 🔎 Search Bar Shimmer */}


            {/* 👤 Card Shimmers */}
            {[...Array(6)].map((_, index) => (
                <View
                    key={index}
                    style={{
                        backgroundColor: '#fff',
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderRadius: 6,
                        marginVertical: 7,
                        marginHorizontal: 15,
                        borderWidth: 1,
                        borderColor: '#ddd',
                        position: 'relative'
                    }}
                >

                    {/* INDEX */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{
                            width: 40,
                            height: 10,
                            borderRadius: 4,
                            marginBottom: 6
                        }}
                    />

                    {/* Staff Name */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{
                            width: '70%',
                            height: 14,
                            borderRadius: 4,
                            marginTop: 6
                        }}
                    />

                    {/* Registration No */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{
                            width: '60%',
                            height: 12,
                            borderRadius: 4,
                            marginTop: 8
                        }}
                    />

                    {/* Vehicle Name */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{
                            width: '65%',
                            height: 12,
                            borderRadius: 4,
                            marginTop: 8
                        }}
                    />

                    {/* Entry Date */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{
                            width: '55%',
                            height: 12,
                            borderRadius: 4,
                            marginTop: 8
                        }}
                    />

                    {/* Info Icon */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{
                            position: 'absolute',
                            right: 10,
                            top: 10,
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                        }}
                    />

                </View>
            ))}
        </View>
    );
};

export default StaffVehicleShimmer;