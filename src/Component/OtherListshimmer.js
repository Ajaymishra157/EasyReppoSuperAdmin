import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const OtherListshimmer = ({ count = 3 }) => {
    return (
        <View style={{ paddingHorizontal: 8, paddingTop: 10 }}>
            {[...Array(count)].map((_, index) => (
                <View key={index} style={styles.card}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.businessIcon} />
                        <View style={{ flex: 1 }}>
                            <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.title} />
                            <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.date} />
                        </View>
                        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.toggle} />
                    </View>

                    <View style={styles.divider} />

                    {/* Mobile */}
                    <View style={styles.detailRow}>
                        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.smallIcon} />
                        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.lineMedium} />
                    </View>

                    {/* Username */}
                    <View style={styles.detailRow}>
                        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.smallIcon} />
                        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.lineMedium} />
                    </View>
                </View>
            ))}
        </View>
    );
};

export default OtherListshimmer;

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
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    businessIcon: { height: 45, width: 45, borderRadius: 10, marginRight: 10 },
    title: { height: 16, width: '70%', borderRadius: 4, marginBottom: 6 },
    date: { height: 12, width: '50%', borderRadius: 4 },
    toggle: { height: 32, width: 32, borderRadius: 16, marginLeft: 10 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    smallIcon: { height: 14, width: 14, borderRadius: 7, marginRight: 10 },
    lineMedium: { flex: 1, height: 14, borderRadius: 4 },
});