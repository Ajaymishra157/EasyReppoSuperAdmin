import {
    View, Text, TouchableOpacity, Image, Switch, ActivityIndicator,
    Modal, ScrollView, FlatList, TextInput, BackHandler,
    Linking, Platform
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import { ENDPOINTS, IMAGE_BASE_URL } from '../CommonFiles/Constant';
import MapView, { Marker } from 'react-native-maps';
import SubAdminInformationShimmer from '../Component/SubAdminInformationShimmer';
import Toast from 'react-native-toast-message';
import FastImage from 'react-native-fast-image';

const SubAdminInformation = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userData, agencyId, onGoBack } = route.params || {};
    console.log("userData in SubAdminInfo:", userData);

    // States
    const [staffDetail, setStaffDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [actionModalPosition, setActionModalPosition] = useState({ top: 0, left: 0 });
    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
    const [resetModal, setResetModal] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [selectedStaffName, setSelectedStaffName] = useState(null);
    const [DeviceId, setDeviceId] = useState('');
    const [statusModal, setStatusModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState('1day');
    const [historyDetailModal, setHistoryDetailModal] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);

    // Toggles
    const [isAccountEnabled, setIsAccountEnabled] = useState({});
    const [accountToggleLoading, setAccountToggleLoading] = useState({});

    // History
    const [searchHistory, setSearchHistory] = useState([]);
    const [displayedSearchHistory, setDisplayedSearchHistory] = useState([]);
    const [scheduleHistory, setScheduleHistory] = useState([]);
    const [displayedScheduleHistory, setDisplayedScheduleHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('Search');
    const [searchHistoryLoading, setSearchHistoryLoading] = useState(false);
    const [scheduleHistoryLoading, setScheduleHistoryLoading] = useState(false);
    const [loadingMoreSearch, setLoadingMoreSearch] = useState(false);
    const [loadingMoreSchedule, setLoadingMoreSchedule] = useState(false);
    const [currentSearchPage, setCurrentSearchPage] = useState(1);
    const [currentSchedulePage, setCurrentSchedulePage] = useState(1);
    const itemsPerPage = 20;

    // Placeholder
    const PlaceholderImage = require('../assets/images/user.png');
    const callIcon = require('../assets/images/Call.png');
    const whatsappIcon = require('../assets/images/whatsapp.png');

    // ========== API Calls ==========
    const formatDate = date => {
        console.log('date hai ye formate ka', date);
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Fetch single staff details using rent_agency_id
    const fetchStaffDetail = async () => {

        setIsLoading(true);
        try {
            const response = await fetch(ENDPOINTS.single_staff_detail_new, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: userData.staff_id, rent_agency_id: agencyId }), // using staff_id as rent_agency_id
            });
            const result = await response.json();
            if (result.code === 200 && result.payload) {
                setStaffDetail(result.payload);
                // Initialize toggle state
                setIsAccountEnabled({ [result.payload.staff_id]: result.payload.staff_status === 'Active' });
            } else {
                setStaffDetail([])
                Toast.show({
                    type: 'error',
                    text1: 'Failed to load staff details',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            console.log('fetchStaffDetail error:', error);

        } finally {
            setIsLoading(false);
        }
    };

    // Fetch search history
    const fetchSearchHistory = async () => {
        if (!userData?.staff_id) return;
        setSearchHistoryLoading(true);
        try {
            const response = await fetch(ENDPOINTS.user_vehicle_history_new, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rent_agency_id: agencyId, user_id: userData.staff_id }),
            });
            const result = await response.json();
            if (result.code === 200 && result.payload) {
                setSearchHistory(result.payload);
                setDisplayedSearchHistory(result.payload.slice(0, itemsPerPage));
                setCurrentSearchPage(1);
            } else {
                setSearchHistory([]);
                setDisplayedSearchHistory([]);
            }
        } catch (error) {
            console.log('fetchSearchHistory error:', error);
        } finally {
            setSearchHistoryLoading(false);
        }
    };

    // Fetch schedule history
    const fetchScheduleHistory = async () => {
        if (!userData?.staff_id) return;
        setScheduleHistoryLoading(true);
        try {
            const response = await fetch(ENDPOINTS.staff_schedule_history_new, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rent_agency_id: agencyId, staff_id: userData.staff_id }),
            });
            const result = await response.json();
            if (result.code === 200 && result.payload) {
                setScheduleHistory(result.payload);
                setDisplayedScheduleHistory(result.payload.slice(0, itemsPerPage));
                setCurrentSchedulePage(1);
            } else {
                setScheduleHistory([]);
                setDisplayedScheduleHistory([]);
            }
        } catch (error) {
            console.log('fetchScheduleHistory error:', error);
        } finally {
            setScheduleHistoryLoading(false);
        }
    };
    // Account status toggle
    const StaffAccountStatus = async (staff_id, action) => {
        try {
            const response = await fetch(ENDPOINTS.Staff_Account_Status, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id, action }),
            });
            const result = await response.json();
            if (result.code === 200) {

                Toast.show({
                    type: 'success',
                    text1: 'Account status updated',
                    position: 'bottom',
                    visibilityTime: 2000,
                });
            } else {

                Toast.show({
                    type: 'error',
                    text1: 'Update failed',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                })

                // Rollback
                setIsAccountEnabled(prev => ({ ...prev, [staff_id]: !prev[staff_id] }));
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error updating status',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            })
            setIsAccountEnabled(prev => ({ ...prev, [staff_id]: !prev[staff_id] }));
        } finally {
            setAccountToggleLoading(prev => ({ ...prev, [staff_id]: false }));
        }
    };

    // Add schedule (extend)
    const handleAddSchedule = async (staffId, startDate, endDate) => {
        try {
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = endDate ? formatDate(endDate) : null;
            const response = await fetch(ENDPOINTS.Add_Schedule_new, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rent_agency_id: agencyId, staff_id: staffId, start_date: formattedStartDate, end_date: formattedEndDate }),
            });
            const data = await response.json();
            console.log("staffadd schedule ka list ", data);
            if (data.code === 200) {

                Toast.show({
                    type: 'success',
                    text1: 'Schedule extended',
                    position: 'bottom',
                    visibilityTime: 2000,
                });
                fetchStaffDetail(); // refresh
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to extend',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                })
            }
        } catch (error) {
            console.log('handleAddSchedule error:', error);
        }
    };

    // Delete staff
    const deleteStaff = async () => {
        if (!userData?.staff_id) return;
        try {
            const response = await fetch(ENDPOINTS.Staff_Agency_Delete, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: userData.staff_id }),
            });
            const result = await response.json();
            if (result.code === 200) {

                Toast.show({
                    type: 'success',
                    text1: 'Staff Deleted SuccessFully',
                    position: 'bottom',
                    visibilityTime: 2000,
                });
                setDeleteConfirmModal(false);
                setTimeout(() => {
                    navigation.goBack();
                }, 500);
            } else {

                Toast.show({
                    type: 'error',
                    text1: 'Delete failed',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });

            }
        } catch (error) {
            console.log('deleteStaff error:', error);
        }
    };

    // Reset device ID
    const DeviceIdReset = async () => {
        if (!userData?.staff_id) return;
        try {
            const response = await fetch(ENDPOINTS.reset_Device_Id, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: userData.staff_id }),
            });
            const result = await response.json();
            if (result.code === 200) {

                Toast.show({
                    type: 'success',
                    text1: 'Device ID reset successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
                setResetModal(false);
                fetchStaffDetail(); // refresh to get new device id
            } else {

                Toast.show({
                    type: 'error',
                    text1: 'Reset failed',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            console.log('DeviceIdReset error:', error);

        }
    };

    // ========== Helpers ==========
    const getInitials = (name) => {
        if (!name) return '';
        const words = name.trim().split(' ');
        if (words.length === 1) return words[0][0].toUpperCase();
        return (words[0][0] + words[1][0]).toUpperCase();
    };

    const formatDateDMY = (dateStr) => {
        if (!dateStr) return '----';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '----';

        // Remove extra spaces around colon
        const cleanStr = dateStr.replace(/\s*:\s*/g, ':').trim();

        const [datePart, timePart] = cleanStr.split(' ');
        if (!datePart || !timePart) return dateStr;

        let day, month, year;

        // Check format type
        if (datePart.includes('-')) {
            const parts = datePart.split('-');

            if (parts[0].length === 4) {
                // Format: YYYY-MM-DD
                [year, month, day] = parts;
            } else {
                // Format: DD-MM-YYYY
                [day, month, year] = parts;
            }
        } else {
            return dateStr;
        }

        let [hours, minutes] = timePart.split(':');

        hours = parseInt(hours, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours === 0 ? 12 : hours;

        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year} ${hours
            .toString()
            .padStart(2, '0')}:${minutes.padStart(2, '0')} ${ampm}`;
    };

    const openMap = (location, lat, lng) => {
        let url = '';
        if (lat && lng) {
            url = Platform.select({
                ios: `http://maps.apple.com/?ll=${lat},${lng}`,
                android: `geo:${lat},${lng}?q=${lat},${lng}`
            });
        } else if (location) {
            const encoded = encodeURIComponent(location);
            url = Platform.select({
                ios: `http://maps.apple.com/?q=${encoded}`,
                android: `https://www.google.com/maps/search/?api=1&query=${encoded}`
            });
        } else {

            Toast.show({
                type: 'error',
                text1: 'Location not available',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            })
            return;
        }
        Linking.canOpenURL(url)
            .then(supported => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Toast.show({
                        type: 'error',
                        text1: 'Cannot open map',
                        position: 'bottom',
                        bottomOffset: 60,
                        visibilityTime: 2000,
                    });
                }
            })
            .catch(() => {
                Toast.show({
                    type: 'error',
                    text1: 'Error opening map',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
            });
    };


    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                if (onGoBack) {
                    onGoBack();
                }
                return false;
            }
        );

        return () => backHandler.remove();
    }, [onGoBack]);

    useEffect(() => {
        const unsubscribeBlur = navigation.addListener('blur', () => {
            if (onGoBack) {
                onGoBack();
            }
        });

        return unsubscribeBlur;
    }, [navigation, onGoBack]);

    const handleBack = () => {
        if (onGoBack) {
            onGoBack();
        }
        navigation.goBack();
    };

    // ========== Load more pagination ==========
    const loadMoreSearch = () => {
        if (
            loadingMoreSearch ||
            displayedSearchHistory.length >= searchHistory.length
        ) return;

        setLoadingMoreSearch(true);

        setTimeout(() => {
            const start = displayedSearchHistory.length;
            const end = start + itemsPerPage;

            const newItems = searchHistory.slice(start, end);

            if (newItems.length > 0) {
                setDisplayedSearchHistory(prev => [...prev, ...newItems]);
            }

            setLoadingMoreSearch(false);
        }, 500);
    };

    const loadMoreSchedule = () => {
        if (loadingMoreSchedule || displayedScheduleHistory.length >= scheduleHistory.length) return;
        setLoadingMoreSchedule(true);
        setTimeout(() => {
            const nextPage = currentSchedulePage + 1;
            const start = nextPage * itemsPerPage;
            const end = start + itemsPerPage;
            const newItems = scheduleHistory.slice(start, end);
            setDisplayedScheduleHistory(prev => [...prev, ...newItems]);
            setCurrentSchedulePage(nextPage);
            setLoadingMoreSchedule(false);
        }, 500);
    };

    // ========== Effects ==========
    useFocusEffect(
        useCallback(() => {
            fetchStaffDetail();
        }, [])
    );

    useEffect(() => {
        if (activeTab === 'Search') fetchSearchHistory();
        else fetchScheduleHistory();
    }, [activeTab]);

    // Back handler
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            navigation.goBack();
            return true;
        });
        return () => backHandler.remove();
    }, []);

    // ========== UI Components ==========
    const TabButton = ({ label, tabKey, icon }) => {
        const isActive = activeTab === tabKey;
        return (
            <TouchableOpacity
                onPress={() => setActiveTab(tabKey)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    marginRight: 10,
                    borderRadius: 20,
                    backgroundColor: isActive ? '#2563EB' : '#F3F4F6',
                    borderWidth: isActive ? 0 : 1,
                    borderColor: '#E5E7EB',
                }}
            >
                <Ionicons name={icon} size={18} color={isActive ? '#fff' : '#374151'} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontFamily: 'Inter-Medium', color: isActive ? '#fff' : '#374151' }}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const openActionModal = (event) => {
        const { pageX, pageY } = event.nativeEvent;
        setActionModalPosition({
            top: pageY + 12,
            left: pageX - 220,
        });
        setActionModalVisible(true);
    };

    const handleEdit = () => {
        setActionModalVisible(false);
        navigation.navigate('AddAgencyStaff', {
            staff_id: staffDetail?.staff_id,
            staff_name: staffDetail?.staff_name,
            staff_email: staffDetail?.staff_email,
            staff_mobile: staffDetail?.staff_mobile,
            staff_password: staffDetail?.staff_password,
            staff_address: staffDetail?.staff_address,
            staff_type: staffDetail?.staff_type,
            agencyId: agencyId, // if needed
        });
    };

    const handleDeletePress = () => {
        setActionModalVisible(false);
        setDeleteConfirmModal(true);
    };

    const handleResetPress = () => {
        setActionModalVisible(false);
        setResetModal(true);
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            {/* Header */}
            <View style={{
                backgroundColor: colors.Brown,
                paddingVertical: 15,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <TouchableOpacity
                    style={{ position: 'absolute', left: 10, top: 10 }}
                    onPress={handleBack}>
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter-Bold' }}>
                    User Info
                </Text>
            </View>

            {/* Profile Card */}
            {/* 👇 Yaha se conditional render */}
            {isLoading || !staffDetail ? (
                <SubAdminInformationShimmer />
            ) : (
                <>
                    <View style={{ width: '100%', paddingHorizontal: 10, marginTop: 15 }}>
                        <View style={{
                            flexDirection: 'row',
                            backgroundColor: '#ffffff',
                            borderRadius: 15,
                            padding: 10,
                            alignItems: 'center',
                            elevation: 5,
                            shadowColor: '#000',
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                        }}>
                            <TouchableOpacity onPress={() => setModalVisible(true)}>
                                {staffDetail.staff_image_profile ? (
                                    <Image
                                        source={{ uri: `${IMAGE_BASE_URL}${encodeURI(staffDetail.staff_image_profile)}` }}
                                        style={{ width: 60, height: 60, borderRadius: 60, borderWidth: 3, borderColor: '#fff' }}
                                    />
                                ) : (
                                    <View style={{ width: 60, height: 60, borderRadius: 60, backgroundColor: '#c9c9c9', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' }}>
                                        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>{getInitials(staffDetail.staff_name)}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                                <Text numberOfLines={1} style={{ fontSize: 14, color: '#000', fontFamily: 'Inter-Bold', textTransform: 'uppercase' }}>
                                    {staffDetail.staff_name}
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingVertical: 8, borderRadius: 8 }}>
                                    <Text style={{ fontSize: 13, color: '#374151', fontFamily: 'Inter-Regular' }}>
                                        {staffDetail.staff_mobile}
                                    </Text>
                                    <View style={{ flexDirection: 'row', marginLeft: 'auto', alignItems: 'center', gap: 18 }}>
                                        <TouchableOpacity onPress={() => Linking.openURL(`tel:${staffDetail.staff_mobile}`)}>
                                            <Image source={callIcon} style={{ width: 17, height: 17 }} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${staffDetail.staff_mobile}`)}>
                                            <Image source={whatsappIcon} style={{ width: 20, height: 20 }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={{ width: 100, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' }}>
                                {accountToggleLoading[staffDetail.staff_id] ? (
                                    <ActivityIndicator size="small" color={colors.Brown} />
                                ) : (
                                    <Switch
                                        trackColor={{ false: '#f54949', true: '#1cd181' }}
                                        thumbColor="#fff"
                                        onValueChange={(value) => {
                                            setAccountToggleLoading(prev => ({ ...prev, [staffDetail.staff_id]: true }));
                                            setIsAccountEnabled(prev => ({ ...prev, [staffDetail.staff_id]: value }));
                                            StaffAccountStatus(staffDetail.staff_id, value ? 'On' : 'Off');
                                        }}
                                        value={isAccountEnabled[staffDetail.staff_id] ?? staffDetail.staff_status === 'Active'}
                                    />
                                )}
                                <TouchableOpacity onPress={openActionModal} style={{ padding: 6, borderRadius: 10, backgroundColor: '#f2f2f2' }}>
                                    <Entypo name="dots-three-vertical" size={18} color="#000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                        {/* Details Section */}
                        <View style={{ backgroundColor: '#ffffff', width: '100%', paddingHorizontal: 10, marginTop: 15 }}>
                            <View style={{
                                backgroundColor: '#fff',
                                borderRadius: 15,
                                padding: 15,
                                marginTop: 15,
                                shadowColor: '#000',
                                shadowOpacity: 0.05,
                                shadowOffset: { width: 0, height: 2 },
                                shadowRadius: 4,
                                elevation: 2,
                            }}>
                                {/* Email */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                                    <View style={{ width: 30, alignItems: 'center' }}><Ionicons name="mail-outline" size={26} color="#4A7DFE" /></View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#374151', marginBottom: 2 }}>Email</Text>
                                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: '#4B5563' }}>{staffDetail.staff_email || '----'}</Text>
                                    </View>
                                </View>

                                {/* Reference Name */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                                    <View style={{ width: 30, alignItems: 'center' }}><Ionicons name="person-circle-outline" size={26} color="#2EC4B6" /></View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#374151', marginBottom: 2 }}>Reference Name</Text>
                                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: '#4B5563', textTransform: 'uppercase' }}>{staffDetail.staff_reference || '----'}</Text>
                                    </View>
                                </View>

                                {/* Address */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                                    <View style={{ width: 30, alignItems: 'center' }}><Ionicons name="location-outline" size={26} color="#A259FF" /></View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#374151', marginBottom: 2 }}>Address</Text>
                                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: '#4B5563' }}>{staffDetail.staff_address || '----'}</Text>
                                    </View>
                                </View>

                                {/* Entry Date */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                                    <View style={{ width: 30, alignItems: 'center' }}><Ionicons name="calendar-outline" size={26} color="#F4B400" /></View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#374151', marginBottom: 2 }}>Entry Date</Text>
                                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: '#4B5563' }}>
                                            {staffDetail.staff_entry_date ? formatDateTime(staffDetail.staff_entry_date) : '----'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Account Status with Extend */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                                    <View style={{ width: 30, alignItems: 'center' }}>
                                        {staffDetail.account_status === 'Expired' ? (
                                            <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
                                        ) : (
                                            <Ionicons name="checkmark-circle-outline" size={26} color="#10B981" />
                                        )}
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#374151', marginBottom: 2 }}>Account Status</Text>
                                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: staffDetail.account_status === 'Expired' ? '#DC2626' : '#10B981', textTransform: 'capitalize' }}>
                                            {staffDetail.account_status || '----'}
                                        </Text>
                                    </View>
                                    {staffDetail.account_status === 'Expired' && (
                                        <TouchableOpacity style={{ backgroundColor: '#4A7DFE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }} onPress={() => setStatusModal(true)}>
                                            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Inter-SemiBold' }}>Extend</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* History Tabs */}
                        <View style={{ width: '100%', paddingHorizontal: 12, marginTop: 20 }}>
                            <View style={{
                                backgroundColor: '#fff',
                                borderRadius: 18,
                                paddingVertical: 20,
                                paddingHorizontal: 10,
                                shadowColor: '#000',
                                shadowOpacity: 0.08,
                                shadowOffset: { width: 0, height: 4 },
                                shadowRadius: 8,
                                elevation: 4,
                            }}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <TabButton label="Search History" tabKey="Search" icon="search-outline" />
                                    <TabButton label="Schedule History" tabKey="Schedule" icon="time-outline" />
                                </ScrollView>
                                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 15, marginHorizontal: 10 }} />
                                <View style={{ backgroundColor: '#F9FAFB', paddingVertical: 20, paddingHorizontal: 10, borderRadius: 16, marginHorizontal: 10, borderWidth: 1, borderColor: '#E5E7EB', minHeight: 180 }}>
                                    {/* Search History Tab */}
                                    {activeTab === 'Search' && (
                                        <View>
                                            {searchHistoryLoading ? (
                                                <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                                                    <ActivityIndicator size="large" color={colors.Brown} />
                                                    <Text style={{ marginTop: 10, fontFamily: 'Inter-Regular', color: '#6B7280' }}>Loading search history...</Text>
                                                </View>
                                            ) : searchHistory.length > 0 ? (
                                                <FlatList
                                                    data={displayedSearchHistory}
                                                    keyExtractor={(item, index) => index.toString()}
                                                    showsVerticalScrollIndicator={false}
                                                    onEndReached={loadMoreSearch}
                                                    onEndReachedThreshold={0.5}
                                                    ListFooterComponent={loadingMoreSearch ? <ActivityIndicator size="small" color={colors.Brown} style={{ margin: 10 }} /> : null}
                                                    renderItem={({ item, index }) => (
                                                        <View style={{ marginTop: 8, backgroundColor: '#fff', padding: 12, marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                                                <Text style={{ fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#1F2937' }}>#{index + 1}</Text>
                                                                <View style={{ flexDirection: 'row', gap: 5 }}>
                                                                    <Ionicons name="car-outline" size={18} color="#374151" />
                                                                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: '#374151' }}>{item.vehicle_registration_no || 'N/A'}</Text>
                                                                </View>
                                                                <TouchableOpacity onPress={() => { setSelectedHistory(item); setHistoryDetailModal(true); }} style={{ padding: 6, borderRadius: 50, backgroundColor: '#F3F4F6' }}>
                                                                    <AntDesign name="infocirlceo" size={20} color="black" />
                                                                </TouchableOpacity>
                                                            </View>
                                                            {item.vehicle_chassis_no && (
                                                                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                                                    <Ionicons name="barcode-outline" size={18} color="#6B7280" />
                                                                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, marginLeft: 6, color: '#6B7280' }}>{item.vehicle_chassis_no}</Text>
                                                                </View>
                                                            )}
                                                            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                                                <Ionicons name="time-outline" size={18} color="#6B7280" />
                                                                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, marginLeft: 6, color: '#6B7280' }}>{formatDateTime(item.entry_date)}</Text>
                                                            </View>
                                                            <TouchableOpacity onPress={() => openMap(item.vehicle_location, item.latitude, item.longitude)} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'center' }}>
                                                                <Ionicons name="location-outline" size={18} color="#6B7280" />
                                                                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, marginLeft: 6, flex: 1, color: (item.vehicle_location || (item.latitude && item.longitude)) ? '#2563EB' : '#6B7280', textDecorationLine: (item.vehicle_location || (item.latitude && item.longitude)) ? 'underline' : 'none' }}>
                                                                    {item.vehicle_location || 'Unknown Location'}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                />
                                            ) : (
                                                <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                                                    <Ionicons name="search-outline" size={50} color="#D1D5DB" />
                                                    <Text style={{ marginTop: 15, fontSize: 16, fontFamily: 'Inter-Medium', color: '#6B7280', textAlign: 'center' }}>No search history found</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {/* Schedule History Tab */}
                                    {activeTab === 'Schedule' && (
                                        <View>
                                            {scheduleHistoryLoading ? (
                                                <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                                                    <ActivityIndicator size="large" color={colors.Brown} />
                                                    <Text style={{ marginTop: 10, fontFamily: 'Inter-Regular', color: '#6B7280' }}>Loading schedule history...</Text>
                                                </View>
                                            ) : scheduleHistory.length > 0 ? (
                                                <FlatList
                                                    data={displayedScheduleHistory}
                                                    keyExtractor={(item, index) => index.toString()}
                                                    showsVerticalScrollIndicator={false}
                                                    onEndReached={loadMoreSchedule}
                                                    onEndReachedThreshold={0.5}
                                                    ListFooterComponent={loadingMoreSchedule ? <ActivityIndicator size="small" color={colors.Brown} style={{ margin: 10 }} /> : null}
                                                    renderItem={({ item, index }) => {
                                                        const formatDMY = (dateStr) => dateStr ? formatDateDMY(dateStr) : 'N/A';
                                                        const endDate = item.schedule_staff_end_date ? new Date(item.schedule_staff_end_date) : null;
                                                        const today = new Date();
                                                        const daysBgColor = endDate && today > endDate ? '#f0f0f0' : '#f0f0f0';
                                                        return (
                                                            <View style={{ backgroundColor: 'white', padding: 16, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <View style={{ flex: 1 }}>
                                                                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#374151' }}>
                                                                            {formatDMY(item.schedule_staff_start_date)} — {formatDMY(item.schedule_staff_end_date)}
                                                                        </Text>
                                                                    </View>
                                                                    <View style={{ backgroundColor: daysBgColor, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 }}>
                                                                        <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 13 }}>{item.schedule_staff_total_day || '0'}</Text>
                                                                    </View>
                                                                </View>
                                                                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 }} />
                                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#374151' }}>
                                                                        Payment:{' '}
                                                                        <Text style={{ color: item.schedule_staff_payment_status === 'Paid' ? '#059669' : '#DC2626' }}>
                                                                            {item.schedule_staff_payment_status || 'N/A'}
                                                                        </Text>
                                                                    </Text>
                                                                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#6B7280' }}>
                                                                        Entry On: {formatDMY(item.schedule_staff_entry_date)}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        );
                                                    }}
                                                />
                                            ) : (
                                                <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                                                    <Ionicons name="time-outline" size={50} color="#D1D5DB" />
                                                    <Text style={{ marginTop: 15, fontSize: 16, fontFamily: 'Inter-Medium', color: '#6B7280', textAlign: 'center' }}>No schedule history found</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Image Modal */}
                    <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                        <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }} onPress={() => setModalVisible(false)}>
                            <View style={{ width: '80%', height: '40%', backgroundColor: 'white', borderRadius: 150, justifyContent: 'center', alignItems: 'center' }}>
                                {staffDetail.staff_image_profile ? (
                                    <Image source={{ uri: `${IMAGE_BASE_URL}${encodeURI(staffDetail.staff_image_profile)}` }} style={{ width: '100%', height: '100%', borderRadius: 150, resizeMode: 'cover' }} />
                                ) : (
                                    <View style={{ width: '100%', height: '100%', borderRadius: 150, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ color: '#fff', fontSize: 60, fontWeight: 'bold' }}>{getInitials(staffDetail.staff_name)}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* History Detail Modal */}
                    <Modal visible={historyDetailModal} transparent animationType="slide">
                        <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setHistoryDetailModal(false)}>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '85%', paddingVertical: 5 }}>
                                <TouchableOpacity onPress={() => setHistoryDetailModal(false)} style={{ marginRight: 5, backgroundColor: 'white', borderRadius: 50 }}>
                                    <Entypo name="cross" size={25} color="black" />
                                </TouchableOpacity>
                            </View>
                            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 15, width: '85%', maxHeight: '100%' }}>
                                {selectedHistory && (
                                    <>
                                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e4dedeff', borderWidth: 1, borderColor: 'black' }}>
                                            <Text style={{ fontSize: 16, fontFamily: 'Inter-Medium', color: 'black', textAlign: 'center', textTransform: 'uppercase' }}>Search History Details</Text>
                                        </View>
                                        <ScrollView showsVerticalScrollIndicator={false}>
                                            {[
                                                { label: 'Staff Name', value: selectedHistory.history_staff_name || '-----' },
                                                { label: 'Staff Mobile', value: selectedHistory.history_staff_mobile || '-----' },
                                                { label: 'Vehicle Agreement No', value: selectedHistory.vehicle_agreement_no || '-----' },
                                                { label: 'Vehicle Registration No', value: selectedHistory.vehicle_registration_no || '-----' },
                                                { label: 'Vehicle Chassis No', value: selectedHistory.vehicle_chassis_no || '-----' },
                                                { label: 'Vehicle Engine No', value: selectedHistory.vehicle_engine_no || '-----' },
                                                { label: 'Entry Date', value: selectedHistory.entry_date ? formatDateDMY(selectedHistory.entry_date) : '-----' },
                                            ].map((item, idx) => (
                                                <View key={idx} style={{ width: '100%', flexDirection: 'row' }}>
                                                    <View style={{ width: '40%', borderLeftWidth: 1, borderBottomWidth: 1, borderColor: 'black', padding: 5 }}>
                                                        <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: 'black', textTransform: 'uppercase' }}>{item.label}</Text>
                                                    </View>
                                                    <View style={{ width: '60%', borderLeftWidth: 1, borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'black', padding: 5 }}>
                                                        <Text style={{ fontSize: 12, color: 'black', fontFamily: 'Inter-Bold' }}>{item.value}</Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </ScrollView>
                                        {selectedHistory.vehicle_location && selectedHistory.vehicle_location.toLowerCase() !== 'unknown address' && selectedHistory.latitude && selectedHistory.longitude ? (
                                            <MapView
                                                style={{ width: '100%', height: 200, marginTop: 10 }}
                                                region={{
                                                    latitude: parseFloat(selectedHistory.latitude),
                                                    longitude: parseFloat(selectedHistory.longitude),
                                                    latitudeDelta: 0.005,
                                                    longitudeDelta: 0.005,
                                                }}
                                            >
                                                <Marker coordinate={{ latitude: parseFloat(selectedHistory.latitude), longitude: parseFloat(selectedHistory.longitude) }} title={selectedHistory.vehicle_location} />
                                            </MapView>
                                        ) : (
                                            <Text style={{ fontSize: 14, color: 'red', textAlign: 'center', marginTop: 10 }}>No Location Found</Text>
                                        )}
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Status Modal (Extend) */}
                    <Modal visible={statusModal} transparent animationType="fade" onRequestClose={() => setStatusModal(false)}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }} activeOpacity={1} onPress={() => setStatusModal(false)}>
                            <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 20 }}>
                                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15, color: 'black', fontFamily: 'Inter-Bold' }}>Select Account Duration</Text>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }} onPress={() => setSelectedOption('1day')}>
                                    <View style={{ height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                        {selectedOption === '1day' && <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: '#333' }} />}
                                    </View>
                                    <Text style={{ fontSize: 15, color: 'black', fontFamily: 'Inter-Regular' }}>1 Day (Today → Tomorrow)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }} onPress={() => setSelectedOption('1month')}>
                                    <View style={{ height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                        {selectedOption === '1month' && <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: '#333' }} />}
                                    </View>
                                    <Text style={{ fontSize: 15, color: 'black', fontFamily: 'Inter-Regular' }}>1 Month (Full Month)</Text>
                                </TouchableOpacity>
                                <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                                    <TouchableOpacity onPress={() => setStatusModal(false)} style={{ flex: 1, backgroundColor: '#f2f2f2', padding: 12, borderRadius: 10 }}>
                                        <Text style={{ textAlign: 'center', color: 'red', fontWeight: '600' }}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        const today = new Date();
                                        let startDate = '', endDate = '';
                                        if (selectedOption === '1day') {
                                            let tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
                                            startDate = today.toISOString().split('T')[0];
                                            endDate = tomorrow.toISOString().split('T')[0];
                                        } else if (selectedOption === '1month') {
                                            startDate = today.toISOString().split('T')[0];
                                            let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                                            if (nextMonth.getDate() !== today.getDate()) {
                                                nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                                            }
                                            endDate = nextMonth.toISOString().split('T')[0];
                                        }
                                        handleAddSchedule(staffDetail.staff_id, startDate, endDate);
                                        setStatusModal(false);
                                    }} style={{ flex: 1, backgroundColor: colors.Brown, padding: 12, borderRadius: 10 }}>
                                        <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '600' }}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Action Modal (three dots) */}
                    <Modal visible={actionModalVisible} transparent animationType="fade" onRequestClose={() => setActionModalVisible(false)}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} activeOpacity={1} onPress={() => setActionModalVisible(false)}>
                            <View style={{ position: 'absolute', top: actionModalPosition.top, left: actionModalPosition.left, backgroundColor: 'white', padding: 15, borderRadius: 12, width: 220, elevation: 8 }}>
                                <Text style={{ fontSize: 17, fontFamily: 'Inter-SemiBold', marginBottom: 12, color: 'black' }}>Select Action</Text>

                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 10,
                                        borderBottomWidth: 1,
                                        borderColor: '#eee',
                                        gap: 12,
                                    }}
                                    onPress={() => {
                                        navigation.navigate('RentStaffFinanceList', {
                                            staff_id: userData.staff_id, // ✅ Passing staff_id
                                            staff_name: userData.staff_name,
                                        });
                                        setActionModalVisible(false);
                                    }}
                                >
                                    <Feather name="settings" size={20} color="#ffb347" />
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter-Regular',
                                            color: 'black',
                                        }}
                                    >
                                        Manage Finance
                                    </Text>
                                </TouchableOpacity>

                                {userData.staff_type != 'normal' && (
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 10,
                                            borderBottomWidth: 1,
                                            borderColor: '#eee',
                                            gap: 12,
                                        }}
                                        onPress={() => {
                                            navigation.navigate('PermissionScreen', {
                                                staff_id: userData.staff_id, // ✅ Passing staff_id
                                                staff_name: userData.staff_name,
                                                staff_type: 'main',
                                            });
                                            setActionModalVisible(false);
                                        }}
                                    >
                                        <MaterialIcons name="security" size={20} color="#FFA500" />
                                        <Text style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter-Regular',
                                            color: '#FFA500',
                                        }}>
                                            Manage Permission
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Update Staff */}
                                <TouchableOpacity onPress={handleEdit} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee', gap: 12 }}>
                                    <Feather name="edit-3" size={20} color="#3B82F6" />
                                    <Text style={{ fontSize: 15, fontFamily: 'Inter-Regular', color: '#3B82F6' }}>Update Staff</Text>
                                </TouchableOpacity>

                                {/* Delete Staff */}
                                <TouchableOpacity onPress={handleDeletePress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee', gap: 12 }}>
                                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                                    <Text style={{ fontSize: 15, fontFamily: 'Inter-Regular', color: '#DC2626' }}>Delete Staff</Text>
                                </TouchableOpacity>

                                {/* Reset Device */}
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 10,
                                        borderBottomWidth: 1,
                                        borderColor: '#eee',
                                        gap: 12,
                                    }}
                                    onPress={() => {
                                        setSelectedStaffId(userData.staff_id);
                                        setSelectedStaffName(userData.staff_name);
                                        setDeviceId(staffDetail.native_device_id || '---');
                                        setResetModal(true);
                                        setActionModalVisible(false);
                                    }}
                                >
                                    <Ionicons name="phone-portrait-outline" size={20} color={colors.Brown} />
                                    <Text style={{
                                        fontSize: 15,
                                        fontFamily: 'Inter-Regular',
                                        color: colors.Brown,
                                    }}>
                                        Reset Device
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Delete Confirmation Modal */}
                    <Modal visible={deleteConfirmModal} transparent animationType="fade" onRequestClose={() => setDeleteConfirmModal(false)}>
                        <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setDeleteConfirmModal(false)}>
                            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 8, width: '80%', alignItems: 'center' }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'black' }}>Confirm Delete</Text>
                                <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black' }}>Are you sure you want to delete this staff?</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                    <TouchableOpacity onPress={() => setDeleteConfirmModal(false)} style={{ backgroundColor: '#ddd', padding: 10, borderRadius: 5, width: '45%', alignItems: 'center' }}>
                                        <Text style={{ color: 'black', fontWeight: 'bold' }}>No</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={deleteStaff} style={{ backgroundColor: colors.Brown, padding: 10, borderRadius: 5, width: '45%', alignItems: 'center' }}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Reset Device Modal */}
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={resetModal}
                        onRequestClose={() => setResetModal(false)}
                    >
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            }}
                            onPress={() => setResetModal(false)}
                            activeOpacity={1}
                        >
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    padding: 20,
                                    borderRadius: 8,
                                    width: '80%',
                                    alignItems: 'center',
                                }}
                                onStartShouldSetResponder={() => true}
                                onTouchEnd={e => e.stopPropagation()}
                            >
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    marginBottom: 10,
                                    color: 'black',
                                    fontFamily: 'Inter-Medium'
                                }}>
                                    Reset Device
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    marginBottom: 20,
                                    textAlign: 'center',
                                    color: 'black',
                                    fontFamily: 'Inter-Medium'
                                }}>
                                    Are you sure To Reset This Staff Device Id?
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    marginBottom: 20,
                                    textAlign: 'center',
                                    color: 'black',
                                    fontFamily: 'Inter-Medium'
                                }}>
                                    {selectedStaffName || '------'}
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    marginBottom: 20,
                                    textAlign: 'center',
                                    color: 'black',
                                    fontFamily: 'Inter-Medium'
                                }}>
                                    {DeviceId || '------'}
                                </Text>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#ddd',
                                            padding: 10,
                                            borderRadius: 5,
                                            width: '45%',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        onPress={() => setResetModal(false)}
                                    >
                                        <Text style={{
                                            color: 'black',
                                            fontWeight: 'bold',
                                            fontFamily: 'Inter-Regular',
                                        }}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: colors.Brown,
                                            padding: 10,
                                            borderRadius: 5,
                                            width: '45%',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                        onPress={() => {
                                            if (selectedStaffId) {
                                                DeviceIdReset(selectedStaffId);
                                            }
                                        }}
                                    >
                                        <Text style={{
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontFamily: 'Inter-Regular',
                                        }}>
                                            Reset
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Modal>

                </>
            )}
        </View>
    );
};

export default SubAdminInformation;