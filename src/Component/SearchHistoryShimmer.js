import React from 'react';
import { View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../CommonFiles/Colors';

// Label + value ka ek shimmer cell (jaise "RegNo : MH12AB1234")
const ShimmerCell = ({ width = '50%', labelWidth = 38, valueWidth = '45%' }) => (
    <View style={{ width, flexDirection: 'row', alignItems: 'center' }}>
        <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={{ width: labelWidth, height: 12, borderRadius: 4 }}
        />
        <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={{ width: valueWidth, height: 12, borderRadius: 4, marginLeft: 8 }}
        />
    </View>
);

const SearchHistoryShimmer = () => {
    const shimmerRows = Array.from({ length: 6 }).map((_, index) => (
        <View
            key={index}
            style={{
                marginTop: 10,
                backgroundColor: '#fff',
                padding: 5,
                marginBottom: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.Brown,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 3,
            }}
        >
            {/* Row 1: #index | Staff Name | Info button */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                }}
            >
                <View style={{ width: '10%' }}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{ width: 28, height: 14, borderRadius: 4 }}
                    />
                </View>

                <View style={{ width: '80%', justifyContent: 'center', alignItems: 'center' }}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{ width: '55%', height: 14, borderRadius: 4 }}
                    />
                </View>

                <View style={{ width: '10%' }}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{ width: 30, height: 30, borderRadius: 15 }}
                    />
                </View>
            </View>

            {/* Row 2: RegNo | Date */}
            <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                <ShimmerCell labelWidth={38} valueWidth="50%" />
                <ShimmerCell labelWidth={30} valueWidth="55%" />
            </View>

            {/* Row 3: Agg No | Agency */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                <ShimmerCell labelWidth={40} valueWidth="50%" />
                <ShimmerCell labelWidth={40} valueWidth="50%" />
            </View>

            {/* Row 4: Location */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                <ShimmerCell width="80%" labelWidth={50} valueWidth="65%" />
            </View>
        </View>
    ));

    return <>{shimmerRows}</>;
};

export default SearchHistoryShimmer;