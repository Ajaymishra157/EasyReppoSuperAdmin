import { StyleSheet, View } from 'react-native';
import React from 'react';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const Shimmer = ({ style }) => (
    <ShimmerPlaceHolder LinearGradient={LinearGradient} style={style} />
);

const AgencyListShimmer = () => {
    return (
        <View style={{ padding: 10 }}>
            {[...Array(5)].map((_, index) => (
                <View key={index} style={styles.card}>

                    {/* Header Row */}
                    <View style={styles.headerRow}>

                        {/* Left Section */}
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Shimmer style={styles.businessIcon} />

                            <View style={{ flex: 1 }}>
                                {/* Name (count) */}
                                <Shimmer style={styles.title} />
                                {/* Created date */}
                                <Shimmer style={styles.date} />
                                {/* Admin badge */}
                                <Shimmer style={styles.badge} />
                            </View>
                        </View>

                        {/* Toggle */}
                        <Shimmer style={styles.toggle} />
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Mobile Row + arrow */}
                    <View style={styles.detailRow}>
                        <Shimmer style={styles.smallIcon} />
                        <Shimmer style={styles.lineMedium} />
                        <Shimmer style={styles.arrowBtn} />
                    </View>

                    {/* Username Row */}
                    <View style={styles.detailRow}>
                        <Shimmer style={styles.smallIcon} />
                        <Shimmer style={styles.lineMedium} />
                    </View>

                    {/* Password Row + eye */}
                    <View style={[styles.detailRow, { marginBottom: 0 }]}>
                        <Shimmer style={styles.smallIcon} />
                        <Shimmer style={styles.lineMedium} />
                        <Shimmer style={styles.eyeIcon} />
                    </View>

                </View>
            ))}
        </View>
    );
};

export default AgencyListShimmer;

const styles = StyleSheet.create({
    // Same spacing as the real card
    card: {
        backgroundColor: '#fff',
        marginVertical: 8,
        marginHorizontal: 5,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
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
        width: '75%',
        borderRadius: 4,
        marginBottom: 6,
    },

    date: {
        height: 12,
        width: '55%',
        borderRadius: 4,
    },

    badge: {
        height: 18,
        width: 80,
        borderRadius: 10,
        marginTop: 7,
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
        marginVertical: 10,
    },

    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
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

    arrowBtn: {
        height: 28,
        width: 28,
        borderRadius: 14,
        marginRight: 3,
    },

    eyeIcon: {
        height: 20,
        width: 22,
        borderRadius: 6,
        marginRight: 5,
    },
});