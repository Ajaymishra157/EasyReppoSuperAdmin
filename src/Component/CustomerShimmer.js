
import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const CustomerShimmer = () => {
    const shimmerRows = Array.from({ length: 10 }, (_, index) => (
        <View key={index} style={styles.row}>
            {/* Index */}
            <View style={styles.indexColumn}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.index}
                />
            </View>

            {/* Customer Name */}
            <View style={styles.nameColumn}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.name}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.nameSub}
                />
            </View>

            {/* RC Number + Status */}
            <View style={styles.rcColumn}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.rcNumber}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.status}
                />
            </View>

            {/* Date */}
            <View style={styles.dateColumn}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.date}
                />
            </View>

            {/* Action */}
            <View style={styles.actionColumn}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.action}
                />
            </View>
        </View>
    ));

    return (
        <View style={styles.container}>
            {/* Table Heading Skeleton */}
            <View style={styles.header}>
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.headerSmall}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.headerName}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.headerRC}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.headerDate}
                />
                <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.headerAction}
                />
            </View>

            {/* Customer Rows */}
            {shimmerRows}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 8,
        marginTop: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ECECF4',
        overflow: 'hidden',
        elevation: 1,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 14,
        backgroundColor: '#F5F5FC',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8F0',
    },

    headerSmall: {
        width: '7%',
        height: 9,
        borderRadius: 4,
    },
    headerName: {
        width: '25%',
        height: 9,
        borderRadius: 4,
        marginLeft: 5,
    },
    headerRC: {
        width: '25%',
        height: 9,
        borderRadius: 4,
        marginLeft: 5,
    },
    headerDate: {
        width: '23%',
        height: 9,
        borderRadius: 4,
        marginLeft: 5,
    },
    headerAction: {
        width: 15,
        height: 9,
        borderRadius: 4,
        marginLeft: 5,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 70,
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F5',
        backgroundColor: '#FFFFFF',
    },

    indexColumn: {
        width: '7%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    index: {
        width: 14,
        height: 13,
        borderRadius: 4,
    },

    nameColumn: {
        width: '25%',
        marginLeft: 5,
        justifyContent: 'center',
        gap: 7,
    },
    name: {
        width: '95%',
        height: 12,
        borderRadius: 4,
    },
    nameSub: {
        width: '65%',
        height: 8,
        borderRadius: 4,
    },

    rcColumn: {
        width: '25%',
        marginLeft: 5,
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 7,
    },
    rcNumber: {
        width: '90%',
        height: 12,
        borderRadius: 4,
    },
    status: {
        width: 43,
        height: 17,
        borderRadius: 5,
    },

    dateColumn: {
        width: '23%',
        marginLeft: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    date: {
        width: '95%',
        height: 11,
        borderRadius: 4,
    },

    actionColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    action: {
        width: 23,
        height: 23,
        borderRadius: 12,
    },
});

export default CustomerShimmer;
