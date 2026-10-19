import {
    Animated,
    Easing,
    FlatList,
    Image,
    Keyboard,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import colors from '../CommonFiles/Colors'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ENDPOINTS } from '../CommonFiles/Constant';

const BROWN = colors.Brown || '#8B4513';

/* ---------------- SHIMMER (no extra library) ---------------- */
const ShimmerBlock = ({ anim, width, height, radius = 8, style }) => {
    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [-250, 250],
    });
    return (
        <View
            style={[
                { width, height, borderRadius: radius, backgroundColor: '#E9E5E1', overflow: 'hidden' },
                style,
            ]}
        >
            <Animated.View
                style={{
                    ...StyleSheet.absoluteFillObject,
                    width: 120,
                    backgroundColor: 'rgba(255,255,255,0.55)',
                    transform: [{ translateX }, { skewX: '-20deg' }],
                }}
            />
        </View>
    );
};

const SkeletonList = () => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(anim, {
                toValue: 1,
                duration: 1100,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [anim]);

    return (
        <View style={{ padding: 14 }}>
            <ShimmerBlock anim={anim} width={120} height={12} style={{ marginBottom: 14 }} />
            {[...Array(7)].map((_, i) => (
                <View key={i} style={styles.card}>
                    <ShimmerBlock anim={anim} width={48} height={48} radius={14} />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <ShimmerBlock anim={anim} width={'75%'} height={14} />
                        <ShimmerBlock anim={anim} width={'35%'} height={10} style={{ marginTop: 10 }} />
                    </View>
                    <ShimmerBlock anim={anim} width={28} height={28} radius={14} />
                </View>
            ))}
        </View>
    );
};

/* ---------------- MAIN SCREEN ---------------- */
const SubAdminAgencyWise = () => {
    const navigation = useNavigation();
    const [agencies, setAgencies] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [focused, setFocused] = useState(false);
    const Agency = require('../assets/images/company.png');

    const fetchAgencyList = async () => {
        try {
            const response = await fetch(ENDPOINTS.Agency_List, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const result = await response.json();
            console.log('Agency List API Response:', result);

            if (result.code === 200 && Array.isArray(result.payload)) {
                setAgencies(result.payload);
            } else {
                setAgencies([]);
            }
        } catch (error) {
            console.error('Error fetching agency list:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAgencyList();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAgencyList();
        setRefreshing(false);
    };

    // Search filter (agency name)
    const filteredAgencies = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return agencies;
        return agencies.filter((a) => (a.agency_name || '').toLowerCase().includes(q));
    }, [agencies, search]);

    const getInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : '?');

    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => {
                Keyboard.dismiss();
                navigation.navigate('SubAdminSearchHistory', {
                    agencyId: item.agency_id,
                    agencyName: item.agency_name,
                });
            }}
        >
            {/* Avatar */}
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitial(item.agency_name)}</Text>
            </View>

            {/* Name */}
            <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.agencyName} numberOfLines={2}>
                    {item.agency_name || '--'}
                </Text>
                {/* <View style={styles.tagRow}>
                    <Ionicons name="business-outline" size={12} color="#9CA3AF" />
                    <Text style={styles.tagText}>Agency #{index + 1}</Text>
                </View> */}
            </View>

            {/* Arrow */}
            <View style={styles.arrowWrap}>
                <Ionicons name="chevron-forward" size={18} color={BROWN} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F6F4F2' }}>
            <StatusBar backgroundColor={BROWN} barStyle="light-content" />


            {/* ---------- HEADER ---------- */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" color="white" size={22} />
                    </TouchableOpacity>

                    {/* Center Title */}
                    <View style={styles.headerTitleCenter} pointerEvents="none">
                        <Text style={styles.headerTitle}>Agency List</Text>
                        <Text style={styles.headerSub}>
                            {loading
                                ? 'Loading agencies...'
                                : `${agencies.length} agencies available`}
                        </Text>
                    </View>
                </View>

                {/* ---------- SEARCH BAR ---------- */}
                <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
                    <Ionicons
                        name="search"
                        size={20}
                        color={focused ? BROWN : '#9CA3AF'}
                    />

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search agency name"
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        returnKeyType="search"
                        autoCorrect={false}
                    />

                    {search.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearch('')}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name="close-circle"
                                size={20}
                                color="#9CA3AF"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>


            {/* ---------- BODY ---------- */}
            {loading && !refreshing ? (
                <SkeletonList />
            ) : (
                <FlatList
                    keyboardShouldPersistTaps="handled"
                    data={filteredAgencies}
                    keyExtractor={(item, index) => (item.agency_id ? String(item.agency_id) : String(index))}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 14, paddingBottom: 30, flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[BROWN]}
                            tintColor={BROWN}
                        />
                    }
                    // ListHeaderComponent={
                    //     filteredAgencies.length > 0 ? (
                    //         <View style={styles.countRow}>
                    //             <Text style={styles.countText}>
                    //                 {search.trim()
                    //                     ? `${filteredAgencies.length} result${filteredAgencies.length > 1 ? 's' : ''} found`
                    //                     : `Total Agencies: ${agencies.length}`}
                    //             </Text>
                    //         </View>
                    //     ) : null
                    // }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <View style={styles.emptyIconBox}>
                                {search.trim() ? (
                                    <Ionicons name="search-outline" size={38} color={BROWN} />
                                ) : (
                                    <Image source={Agency} style={{ width: 50, height: 50 }} />
                                )}
                            </View>
                            <Text style={styles.emptyTitle}>
                                {search.trim() ? 'No matching agency' : 'No Agency Yet'}
                            </Text>
                            <Text style={styles.emptySub}>
                                {search.trim()
                                    ? 'Try a different name or clear the search.'
                                    : 'Pull down to refresh the list.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default SubAdminAgencyWise;

const styles = StyleSheet.create({

    header: {
        backgroundColor: BROWN,
        paddingTop: 12,
        paddingBottom: 18,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
    },

    headerTop: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        position: 'relative',
    },

    backBtn: {
        position: 'absolute',
        left: 0,
        top: 4,
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },

    headerTitleCenter: {
        position: 'absolute',
        left: 48,
        right: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        textAlign: 'center',
    },

    headerSub: {
        color: 'rgba(255,255,255,0.78)',
        fontSize: 11,
        fontFamily: 'Inter-Regular',
        marginTop: 3,
        textAlign: 'center',
    },

    /* Search */

    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: '#F0E7E0',
    },

    searchBoxFocused: {
        borderColor: '#D7B69C',
    },

    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#111827',
        fontFamily: 'Inter-Regular',
        paddingVertical: 0,
    },

    /* Count */
    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginLeft: 2,
    },
    countText: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'Inter-Medium',
    },

    /* Card */
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EFEAE6',
        shadowColor: '#4B2E14',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F6ECE4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        color: BROWN,
        fontFamily: 'Inter-Bold',
    },
    agencyName: {
        fontSize: 14,
        color: '#1F2937',
        fontFamily: 'Inter-Bold',
        textTransform: 'capitalize',
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    tagText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontFamily: 'Inter-Regular',
        marginLeft: 4,
    },
    arrowWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F6ECE4',
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Empty */
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 120,
        paddingHorizontal: 30,
    },
    emptyIconBox: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#F6ECE4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'Inter-Bold',
    },
    emptySub: {
        marginTop: 6,
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
});