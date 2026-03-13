import { StyleSheet, View } from 'react-native';
import React from 'react';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const AgencyListShimmer = () => {
    return (
        <View style={{ paddingHorizontal: 8, paddingTop: 10 }}>
            {[...Array(5)].map((_, index) => (
                <View key={index} style={styles.card}>

                    {/* Header Row */}
                    <View style={styles.headerRow}>

                        {/* Left Section */}
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <ShimmerPlaceHolder
                                LinearGradient={LinearGradient}
                                style={styles.businessIcon}
                            />

                            <View style={{ flex: 1 }}>
                                <ShimmerPlaceHolder
                                    LinearGradient={LinearGradient}
                                    style={styles.title}
                                />
                                <ShimmerPlaceHolder
                                    LinearGradient={LinearGradient}
                                    style={styles.date}
                                />
                            </View>
                        </View>

                        {/* Toggle Placeholder */}
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.toggle}
                        />
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Mobile Row */}
                    <View style={styles.detailRow}>
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.smallIcon}
                        />
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.lineMedium}
                        />
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.arrowBtn}
                        />
                    </View>

                    {/* Username Row */}
                    <View style={styles.detailRow}>
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.smallIcon}
                        />
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.lineMedium}
                        />
                    </View>

                    {/* Password Row */}
                    <View style={styles.detailRow}>
                        <ShimmerPlaceHolder
                            LinearGradient={LinearGradient}
                            style={styles.smallIcon}
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

    card: {
        backgroundColor: '#fff',
        marginVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        elevation: 4,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    businessIcon: {
        height: 45,
        width: 45,
        borderRadius: 10,
        marginRight: 10,
    },

    title: {
        height: 16,
        width: '80%',
        borderRadius: 4,
        marginBottom: 6,
    },

    date: {
        height: 12,
        width: '50%',
        borderRadius: 4,
    },

    toggle: {
        height: 24,
        width: 45,
        borderRadius: 12,
        marginLeft: 10,
    },

    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },

    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        justifyContent: 'space-between',
    },

    smallIcon: {
        height: 16,
        width: 16,
        borderRadius: 8,
        marginRight: 10,
    },

    lineMedium: {
        flex: 1,
        height: 14,
        borderRadius: 4,
        marginRight: 10,
    },

    lineSmall: {
        flex: 1,
        height: 14,
        borderRadius: 4,
    },

    arrowBtn: {
        height: 28,
        width: 28,
        borderRadius: 14,
    },

});