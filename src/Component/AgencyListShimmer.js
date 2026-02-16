import { StyleSheet, View } from 'react-native';
import React from 'react';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const AgencyListShimmer = () => {
    return (
        <View style={styles.container}>
            {[...Array(5)].map((_, index) => (
                <View key={index} style={styles.card}>
                    {/* Agency Name */}
                    <View style={styles.row}>
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.icon}
                        />
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.lineLarge}
                        />
                    </View>

                    {/* Mobile */}
                    <View style={styles.row}>
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.icon}
                        />
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.lineMedium}
                        />
                    </View>

                    {/* Username */}
                    <View style={styles.row}>
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.icon}
                        />
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.lineMedium}
                        />
                    </View>

                    {/* Password */}
                    <View style={styles.row}>
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.icon}
                        />
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.lineSmall}
                        />
                    </View>
                </View>
            ))}
        </View>
    );
};

export default AgencyListShimmer;

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        padding: 12,
        marginBottom: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'black',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    icon: {
        height: 18,
        width: 18,
        borderRadius: 9,
        marginRight: 10,
    },
    lineLarge: {
        height: 16,
        width: '70%',
        borderRadius: 4,
    },
    lineMedium: {
        height: 16,
        width: '50%',
        borderRadius: 4,
    },
    lineSmall: {
        height: 16,
        width: '35%',
        borderRadius: 4,
    },
});
