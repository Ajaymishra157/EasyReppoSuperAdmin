import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
    ActivityIndicator,
    Modal,
    TextInput,
    Image,
    Keyboard,
    Platform,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import StaffShimmer from '../Component/StaffShimmer';
import Toast from 'react-native-toast-message';
import { ENDPOINTS } from '../CommonFiles/Constant';


// ─── Component ────────────────────────────────────────────────────────────────
const AllStaffList = () => {
    const Staff = require('../assets/images/team.png');
    const navigation = useNavigation();

    // ── State ──────────────────────────────────────────────────────────────────
    const [StaffList, setStaffList] = useState([]);
    const [originalStaffData, setOriginalStaffData] = useState([]);
    const [StaffLoading, setStaffLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [AllCount, setAllCount] = useState('');
    const [AdminCount, setAdminCount] = useState('');
    const [FieldCount, setFieldCount] = useState('');

    const [selectedTab, setSelectedTab] = useState('');
    const [text, setText] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Pagination
    const [data, setData] = useState([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Image preview modal
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const tabs = [
        { key: '', label: 'Total', count: AllCount, bgColor: '#7c3aed' },
        { key: 'admin', label: 'Admin', count: AdminCount, bgColor: '#0ea5e9' },
        { key: 'field', label: 'Field', count: FieldCount, bgColor: '#22c55e' },
    ];

    // ── Keyboard height ────────────────────────────────────────────────────────
    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    // ── Fetch from API ────────────────────────────────────────────────────────
    const fetchData = useCallback(async (filterKey = '') => {
        setStaffLoading(true);
        try {
            // NOTE: tab filter (filterKey) is NOT sent to API intentionally.
            // Uncomment & add params here when tabs go live.
            const response = await fetch(ENDPOINTS.All_Staff_List, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filter: filterKey, }),
            });

            const json = await response.json();

            if (json?.status && Array.isArray(json?.payload)) {
                const allStaff = json.payload;



                setAllCount(json?.count_all || '0');
                setAdminCount(json?.count_admin || '0');
                setFieldCount(json?.count_field || '0');



                setStaffList(allStaff);
                setOriginalStaffData(allStaff);
            } else {
                setStaffList([]);
                setOriginalStaffData([]);
                Toast.show({ type: 'error', text1: json?.message || 'Failed to load staff.' });
            }
        } catch (error) {
            console.error('AllStaffList API error:', error);
            setStaffList([]);
            setOriginalStaffData([]);
            Toast.show({ type: 'error', text1: 'Network error. Please try again.' });
        } finally {
            setCurrentPage(1);
            setStaffLoading(false);
        }
    }, []);

    // ── Initial load ──────────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            if (isInitialLoad) {
                fetchData(selectedTab);
                setIsInitialLoad(false);
            }
        }, [isInitialLoad, selectedTab, fetchData])
    );

    // ── Sync paginated data when StaffList changes ─────────────────────────────
    useEffect(() => {
        setData(StaffList.slice(0, 20));
    }, [StaffList]);

    // ── Pagination ─────────────────────────────────────────────────────────────
    const loadMoreItems = () => {
        if (isLoadingMore || data.length >= StaffList.length) return;
        setIsLoadingMore(true);
        setTimeout(() => {
            const nextPage = currentPage + 1;
            const nextData = StaffList.slice(currentPage * 20, nextPage * 20);
            if (nextData.length === 0) { setIsLoadingMore(false); return; }
            setData(prev => [...prev, ...nextData]);
            setCurrentPage(nextPage);
            setIsLoadingMore(false);
        }, 100);
    };

    // ── Tab press ──────────────────────────────────────────────────────────────
    const handleTabPress = (tabKey) => {
        setSelectedTab(tabKey);
        setText('');
        setCurrentPage(1);
        setStaffList([]);
        setData([]);
        fetchData(tabKey);
    };

    // ── Search — name + mobile + agency_name ──────────────────────────────────
    const handleTextChange = (inputText) => {
        setText(inputText);
        if (inputText === '') {
            setStaffList(originalStaffData);
        } else {
            const lc = inputText.toLowerCase();
            setStaffList(
                originalStaffData.filter(
                    item =>
                        item.staff_name?.toLowerCase().includes(lc) ||
                        item.staff_mobile?.toLowerCase().includes(lc) ||
                        item.agency_name?.toLowerCase().includes(lc)
                )
            );
        }
    };

    // ── Refresh ───────────────────────────────────────────────────────────────
    const onRefresh = async () => {
        setRefreshing(true);
        setText('');
        await fetchData(selectedTab);
        setRefreshing(false);
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getInitials = (name) => {
        if (!name) return '';
        const words = name.trim().split(' ');
        if (words.length === 1) return words[0][0].toUpperCase();
        return (words[0][0] + words[1][0]).toUpperCase();
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return '#e2feee';
            case 'deactive': return '#fee2e2';
            case 'pending': return '#f1c40f';
            default: return '#e5e7eb';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '--';
        const date = new Date(dateString);
        if (isNaN(date)) return '--';
        const day = ('0' + date.getDate()).slice(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        return `${day}-${month}-${date.getFullYear()}`;
    };

    // ── Navigation helper ─────────────────────────────────────────────────────
    const handleReturnFromInfoScreen = useCallback(() => {
        if (text.trim() !== '') {
            const lc = text.toLowerCase();
            const filtered = originalStaffData.filter(
                item =>
                    item.staff_name?.toLowerCase().includes(lc) ||
                    item.staff_mobile?.toLowerCase().includes(lc) ||
                    item.agency_name?.toLowerCase().includes(lc)
            );
            setStaffList(filtered);
            setCurrentPage(1);
            setData(filtered.slice(0, 20));
        } else {
            setTimeout(() => fetchData(selectedTab), 100);
        }
    }, [selectedTab, text, originalStaffData, fetchData]);

    const navigateToInfo = (item) => {
        const isEasyReppo = item.rent_agency_id === '0';
        if (isEasyReppo) {
            navigation.navigate('informationScreen', {
                userData: item,
                setStaffList,
                onGoBack: handleReturnFromInfoScreen,
                currentTab: selectedTab,
            });
        } else {
            navigation.navigate('SubAdminInformation', {
                agencyId: item.rent_agency_id,
                userData: item,
                setStaffList,
                onGoBack: handleReturnFromInfoScreen,
                currentTab: selectedTab,
            });
        }
    };

    // ── Render item ───────────────────────────────────────────────────────────
    const renderItem = ({ item }) => {
        const isEasyReppo = item.rent_agency_id === '0';

        const staffTypeLabel =
            item.staff_type === 'Normal Staff'
                ? 'Field Staff'
                : item.staff_type === 'normal'
                    ? 'Field Staff'
                    : item.staff_type || '----';

        return (
            <TouchableOpacity
                key={item.staff_id}
                style={{
                    flexDirection: 'row',
                    backgroundColor: '#ffffff',
                    padding: 10,
                    marginHorizontal: 13,
                    marginVertical: 7,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: '#ddd',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                }}
                onPress={() => navigateToInfo(item)}
                activeOpacity={1}
            >
                {/* STATUS BADGE */}
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: getStatusColor(item.staff_status),
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderBottomLeftRadius: 5,
                        borderTopRightRadius: 5,
                        zIndex: 2,
                    }}
                >
                    <Text style={{ color: 'black', fontSize: 10, fontWeight: 'bold' }}>
                        {item.staff_status || '--'}
                        {item.account_status ? ` - ${item.account_status}` : ''}
                    </Text>
                </View>

                {/* IMAGE + INFO */}
                <View style={{ flexDirection: 'row', width: '50%' }}>
                    {/* AVATAR */}
                    <View style={{ width: '30%', justifyContent: 'center', alignItems: 'flex-start' }}>
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedImage(
                                    item.staff_image
                                        ? { uri: encodeURI(item.staff_image) }
                                        : { name: item.staff_name }
                                );
                                setModalVisible(true);
                            }}
                            activeOpacity={0.8}
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                overflow: 'hidden',
                                borderWidth: 1,
                                borderColor: '#ccc',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: !item.staff_image ? '#ccc' : 'transparent',
                            }}
                        >
                            {item.staff_image ? (
                                <Image
                                    source={{ uri: encodeURI(item.staff_image) }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                    {getInitials(item.staff_name)}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* TEXT INFO */}
                    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 5, paddingBottom: 10 }}>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{
                                fontSize: 12,
                                color: '#000',
                                fontFamily: 'Inter-Bold',
                                textTransform: 'uppercase',
                            }}
                        >
                            {item.staff_name || '----'}
                        </Text>

                        <Text style={{ fontSize: 12, color: '#374151', fontFamily: 'Inter-Regular', marginTop: 2 }}>
                            {item.staff_mobile || '----'}
                        </Text>

                        {/* Staff type */}
                        <Text style={{ fontSize: 11, color: '#374151', fontFamily: 'Inter-Regular', marginTop: 2 }}>
                            {staffTypeLabel}
                        </Text>

                        {/* Agency name — separate line, truncated, smaller */}

                    </View>
                    {item.agency_name ? (
                        <Text

                            style={{
                                position: 'absolute',
                                top: 56,
                                left: 55,
                                fontSize: 10,
                                color: colors.Brown,
                                fontFamily: 'Inter-Bold',
                                marginTop: 1,

                            }}
                        >
                            {item.agency_name || '---'}
                        </Text>
                    ) : null}
                </View>

                {/* SCHEDULE */}
                <View
                    style={{
                        position: 'absolute',
                        top: 35,
                        left: '52%',
                        width: '46%',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ fontSize: 11, color: '#000', fontFamily: 'Inter-Regular', textAlign: 'center' }}>
                        {item.schedule_staff_start_date && item.schedule_staff_end_date
                            ? `${formatDate(item.schedule_staff_start_date)} - ${formatDate(item.schedule_staff_end_date)}`
                            : 'Not Available'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const hasStaff = originalStaffData.length > 0;

    // ── UI ────────────────────────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>

            {/* ── Header ── */}
            <View
                style={{
                    backgroundColor: colors.Brown,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <TouchableOpacity
                    style={{
                        width: '15%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        left: 6,
                        top: 5,
                        height: 50,
                    }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>

                <Text
                    style={{
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Bold',
                    }}
                >
                    All Staff List
                </Text>
            </View>

            {/* ── Search bar (only when data exists or loading) ── */}
            {(StaffLoading || hasStaff) && (
                <View style={{ width: '100%', paddingHorizontal: 10 }}>
                    <View
                        style={{
                            width: '100%',
                            borderWidth: 1,
                            borderColor: colors.Brown,
                            marginTop: 5,
                            marginBottom: 5,
                            borderRadius: 8,
                            height: 50,
                            backgroundColor: 'white',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <View style={{ width: 30, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                            <MaterialIcons name="search" size={24} color="black" />
                        </View>
                        <TextInput
                            style={{
                                flex: 1,
                                fontSize: 16,
                                fontFamily: 'Inter-Regular',
                                color: 'black',
                                height: 50,
                            }}
                            placeholder="Search Staff Name / Mobile / Agency"
                            placeholderTextColor="grey"
                            value={text}
                            onChangeText={handleTextChange}
                        />
                        {text ? (
                            <TouchableOpacity
                                onPress={() => { setText(''); setStaffList(originalStaffData); }}
                                style={{ marginRight: 7, height: 40, justifyContent: 'center', alignItems: 'center' }}
                            >
                                <Entypo name="cross" size={20} color="black" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            )}

            {/* ── Tab bar (commented — uncomment when ready) ── */}
            {(StaffLoading || hasStaff) && (
                <ScrollView
                    horizontal
                    keyboardShouldPersistTaps="handled"
                    showsHorizontalScrollIndicator={false}
                    style={{
                        paddingVertical: 5,
                        flexGrow: 0,
                    }}
                    contentContainerStyle={{
                        paddingHorizontal: 10,
                        alignItems: 'center',
                        backgroundColor: 'white',
                        paddingBottom: 5,
                        paddingTop: 10,
                    }}
                >
                    {tabs.map((tab) => {
                        const isSelected = selectedTab === tab.key;

                        return (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => handleTabPress(tab.key)}
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: isSelected
                                        ? tab.bgColor
                                        : `${tab.bgColor}22`,
                                    paddingVertical: 10,
                                    paddingHorizontal: 18,
                                    borderRadius: 10,
                                    marginRight: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: 82,
                                    borderWidth: 1,
                                    borderColor: isSelected
                                        ? tab.bgColor
                                        : `${tab.bgColor}55`,
                                }}
                            >
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        color: isSelected ? 'white' : '#222',
                                        fontFamily: 'Inter-Bold',
                                        fontSize: 12,
                                    }}
                                >
                                    {tab.label}
                                </Text>

                                <Text
                                    style={{
                                        color: isSelected ? 'white' : '#444',
                                        fontFamily: 'Inter-Bold',
                                        fontSize: 11,
                                        marginTop: 2,
                                    }}
                                >
                                    {tab.count || 0}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* ── List ── */}
            <FlatList
                keyboardShouldPersistTaps="handled"
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.staff_id.toString()}
                onEndReached={loadMoreItems}
                onEndReachedThreshold={0.5}
                removeClippedSubviews={true}
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={{ padding: 10, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={colors.Brown} />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    StaffLoading ? (
                        <View style={{ padding: 10 }}>
                            {[...Array(7)].map((_, index) => (
                                <StaffShimmer key={index} />
                            ))}
                        </View>
                    ) : (
                        <View style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={Staff} style={{ width: 70, height: 70 }} />
                            <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                                No Staff Found
                            </Text>
                        </View>
                    )
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.Brown, colors.Brown]}
                    />
                }
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: keyboardHeight + 30,
                    backgroundColor: 'white',
                }}
            />

            {/* ── Image preview modal ── */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                    }}
                    onPress={() => setModalVisible(false)}
                    activeOpacity={1}
                >
                    <View
                        style={{
                            width: '80%',
                            height: '40%',
                            backgroundColor: 'white',
                            borderRadius: 150,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={(e) => e.stopPropagation()}
                    >
                        {selectedImage ? (
                            selectedImage.uri ? (
                                <Image
                                    source={selectedImage}
                                    style={{ width: '100%', height: '100%', borderRadius: 150, resizeMode: 'cover' }}
                                />
                            ) : (
                                <View
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 150,
                                        backgroundColor: '#ccc',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 40, fontWeight: 'bold' }}>
                                        {getInitials(selectedImage.name)}
                                    </Text>
                                </View>
                            )
                        ) : null}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default AllStaffList;