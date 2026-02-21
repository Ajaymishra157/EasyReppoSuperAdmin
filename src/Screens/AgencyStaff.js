import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    ToastAndroid,
    Modal,
    TextInput,
    Keyboard,
    RefreshControl,
    ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { ENDPOINTS, IMAGE_BASE_URL } from '../CommonFiles/Constant';
import colors from '../CommonFiles/Colors';
import AntDesign from 'react-native-vector-icons/AntDesign';
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import AsyncStorage from '@react-native-async-storage/async-storage';
import StaffShimmer from '../Component/StaffShimmer';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const AgencyStaff = () => {
    const phone = require('../assets/images/phone.png');
    const Staff = require('../assets/images/team.png');
    const account = require('../assets/images/user.png');
    const route = useRoute();
    const navigation = useNavigation();
    const { agencyId, agencyName, agencyDetail } = route.params || {};
    console.log("agency id", agencyId);


    const [StaffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [StaffLoading, setStaffLoading] = useState(false);
    const [AllCount, setAllCount] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [AdminCount, setAdminCount] = useState('');
    const [FieldCount, setFieldCount] = useState('');
    const [text, setText] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [userType, setUsertype] = useState(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [agencyIdSend, setAgencyIdSend] = useState('');

    const [originalStaffData, setOriginalStaffData] = useState([]);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const flatListRef = useRef(null);

    const [currentScrollPosition, setCurrentScrollPosition] = useState(0);
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // New states for action modal
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);

    const [selectedAgencyId, setSelectedAgencyId] = useState(null);
    const [selectedAgencyId2, setSelectedAgencyId2] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [showDeleteModal2, setShowDeleteModal2] = useState(false);

    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [selectedStaffName, setselectedStaffName] = useState(null);
    const [DeviceId, setDeviceId] = useState('');
    const [ResetModal, setResetModal] = useState(false);
    const [ResetModalAll, setResetModalAll] = useState(false);
    const [data, setData] = useState(StaffList.slice(0, 20));  // Load first 20 items initially
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1); // Keep track of current page for loading data

    const [permissions, setPermissions] = useState({});

    const tabs = [
        { key: '', label: 'Total', count: AllCount, bgColor: '#7c3aed', },
        { key: 'admin', label: 'Admin', count: AdminCount, bgColor: '#0ea5e9', },
        { key: 'field', label: 'Field', count: FieldCount, bgColor: '#22c55e', },

    ]

    const [selectedTab, setSelectedTab] = useState('');


    useFocusEffect(
        useCallback(() => {
            const fetchUsertype = async () => {
                const usertype = await AsyncStorage.getItem('user_type');
                setUsertype(usertype);
            };
            fetchUsertype();
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            if (isInitialLoad) {
                fetchStaff(selectedTab, true);
                setIsInitialLoad(false);
            }

            if (shouldRefresh) {
                fetchStaff(selectedTab);
                setShouldRefresh(false);
            }
        }, [shouldRefresh, selectedTab, isInitialLoad])
    );

    // informationScreen से वापस आने पर data update करने के लिए function
    const handleReturnFromInfoScreen = useCallback(() => {

        // अगर search text है तो उसके according filter करें, वरना normal fetch करें
        if (text.trim() !== '') {
            // Search text है, तो current text के according filter करें
            const filtered = originalStaffData.filter(item => {
                const lowerCaseInput = text.toLowerCase();
                return (
                    item.staff_name?.toLowerCase().includes(lowerCaseInput) ||
                    item.staff_mobile?.toLowerCase().includes(lowerCaseInput)
                );
            });

            // Directly set filtered data
            setStaffList(filtered);
            setCurrentPage(1);
            setData(filtered.slice(0, 20));

            // थोड़ी delay के बाद scroll position restore करें
            // setTimeout(() => {
            //     if (flatListRef.current && currentScrollPosition > 0) {
            //         flatListRef.current.scrollToOffset({
            //             offset: currentScrollPosition,
            //             animated: false
            //         });
            //     }
            // }, 50);
        } else {
            // कोई search नहीं है, तो normal fetch करें
            setTimeout(() => {
                console.log("3")
                fetchStaff(selectedTab, true); // true = preserve scroll position
            }, 100);
        }
    }, [selectedTab, text, originalStaffData, currentScrollPosition]);


    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const loadMoreItems = () => {
        if (isLoadingMore || data.length >= StaffList.length) return;

        console.log("Start Loading:", isLoadingMore);
        setIsLoadingMore(true);

        setTimeout(() => {
            const nextPage = currentPage + 1;
            const nextData = StaffList.slice(currentPage * 20, nextPage * 20);

            if (nextData.length === 0) {
                // 🛑 No more data to load
                setIsLoadingMore(false);
                return;
            }

            setData(prevData => [...prevData, ...nextData]);
            setCurrentPage(nextPage);
            setIsLoadingMore(false);

            console.log("Done Loading:", isLoadingMore);
        }, 100); // Delay added for visible spinner + batching fix
    };

    const handleTabPress = (tabKey) => {
        setCurrentScrollPosition(0);
        setSelectedTab(tabKey);

        setText(''); // Search text clear करें
        setCurrentPage(1); // Pagination reset करें
        // Tab change पर scroll top करना चाहिए, इसलिए position preserve न करें
        setStaffList([]);
        setData([]);

        fetchStaff(tabKey, false);
        // setCurrentPage(1); // ✅ पेज रीसेट करें
        // fetchStaff(tabKey); // Send tab key to API
    }


    const fetchPermissions = async () => {

        try {
            const staff_id = await AsyncStorage.getItem('staff_id');
            if (!staff_id) {
                console.warn('No staff_id found');
                setPermissions({});
                setLoading(false);
                return;
            }
            const response = await fetch(ENDPOINTS.List_Staff_Permission, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id }),
            });

            const result = await response.json();

            if (result.code === 200 && result.payload) {
                const permData = {};

                result.payload.forEach(item => {
                    // Convert menu name to lowercase key
                    const menuName = item.menu_name.toLowerCase();

                    // Split permissions, convert to lowercase, trim spaces
                    const permsArray = item.menu_permission
                        .split(',')
                        .map(p => p.trim().toLowerCase());

                    // Create boolean map for this menu
                    const permsObject = {};
                    permsArray.forEach(perm => {
                        permsObject[perm] = true;
                    });

                    permData[menuName] = permsObject;
                });

                setPermissions(permData);
            } else {
                console.warn('Failed to fetch permissions or no payload');
                setPermissions({});
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            setPermissions({});
        }

    }

    useEffect(() => {
        fetchPermissions();
    }, []);


    const handleEdit2 = () => {
        setIsModalVisible(false); // Close the modal first

        if (agencyDetail) {
            navigation.navigate('AddAgencyList', { agencyData: agencyDetail });
        }
    };

    const confirmDelete2 = (agencyId) => {
        setSelectedAgencyId2(agencyId);
        setShowDeleteModal2(true);
        setIsModalVisible(false);
    };

    const deleteAgency = async (agencyId) => {
        try {
            const response = await fetch(ENDPOINTS.delete_rent_agency, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rent_agency_id: agencyId }),
            });

            const result = await response.json();
            if (result.code === 200) {
                ToastAndroid.show('Agency deleted successfully', ToastAndroid.SHORT);
                // // Remove from list
                // const updated = agencies.filter(agency => agency.agency_id !== agencyId);
                // setAgencies(updated);
                // setOriginalStaffData(updated);
                navigation.goBack();
            } else {
                ToastAndroid.show(result.message || 'Failed to delete agency', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.error('Delete error:', error);
            ToastAndroid.show('Error deleting agency', ToastAndroid.SHORT);
        }
    };







    const confirmDelete = (agencyId) => {
        setSelectedAgencyId(agencyId);
        setShowDeleteModal(true);
        setActionModalVisible(false);
    };


    const handleCloseModal = () => {
        setIsModalVisible(false); // Close the modal
    };

    const handleRefresh = async () => {
        setLoading(true);

        try {
            // 🔁 Call the function you already use to fetch staff list
            await fetchStaff();  // Replace with your actual fetch method
        } catch (error) {
            console.error('Refresh error:', error);
        }

        setLoading(false);
    };

    const fetchStaff = async (filterKey = '', shouldPreservePosition = false) => {
        setStaffLoading(true);
        try {
            const response = await fetch(ENDPOINTS.list_agency_subadmin_new, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rent_agency_id: agencyId, filter: filterKey }),
            });
            const result = await response.json();
            if (result.code === 200 && Array.isArray(result.payload)) {
                setStaffList(result.payload);
                setAdminCount(result.count_admin || 0);
                setFieldCount(result.count_field || 0);
                setAllCount(result.count_all || 0);
                setOriginalStaffData(result.payload);

                // Restore scroll position after data is rendered
                // if (shouldPreservePosition && currentScrollPosition > 0) {
                //     setTimeout(() => {
                //         flatListRef.current?.scrollToOffset({ offset: currentScrollPosition, animated: false });
                //     }, 100);
                // }
            } else {
                setStaffList([]);
                setOriginalStaffData([]);
            }
        } catch (error) {
            console.log('Fetch error:', error.message);
        } finally {
            setStaffLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setCurrentScrollPosition(0);
        await fetchStaff(selectedTab, false);
        setText('');
        setRefreshing(false);
    };


    const handleTextChange = (inputText) => {
        console.log("handletext", inputText);
        setText(inputText);

        // If inputText is empty, show the original data
        if (inputText == '') {
            setStaffList(originalStaffData);  // Reset to original data
        } else {
            // Filter data based on Name, Reg No, or Agg No
            const filtered = originalStaffData.filter(item => {
                const lowerCaseInput = inputText.toLowerCase();
                return (
                    item.staff_name.toLowerCase().includes(lowerCaseInput) ||
                    item.staff_mobile.toLowerCase().includes(lowerCaseInput)

                );
            });

            setStaffList(filtered); // Update filtered data state
        }
    };
    // useFocusEffect(
    //     React.useCallback(() => {
    //         AgencyStaffLogout(navigation, confirmLogout);
    //     }, [])
    // );
    useFocusEffect(
        useCallback(() => {

            console.log("Focus hua, current text:", text);

            // 🔴 Agar search active hai → refresh mat karo
            if (text.trim() !== '') {
                console.log("Search active hai, refresh skip");
                return;
            }

            // 🟢 Agar search empty hai → refresh karo
            console.log("Search empty hai, refresh ho raha hai");
            fetchStaff(selectedTab);

        }, [selectedTab, text])   // ✅ text add karo yaha
    );


    const openActionModal = (item) => {
        setSelectedStaff(item);
        setActionModalVisible(true);
    };

    const closeActionModal = () => {
        setSelectedStaff(null);
        setActionModalVisible(false);
    };

    const OpenModal = (agency) => {
        setAgencyIdSend(agencyDetail.agency_id);

        setTimeout(() => {
            setIsModalVisible(true);
        }, 100); // 20ms delay helps reduce UI lag

    };



    const deleteStaff = async (staffId) => {
        try {
            const response = await fetch(ENDPOINTS.Staff_Agency_Delete, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId }),
            });
            const result = await response.json();

            if (result.code === 200) {
                ToastAndroid.show('Staff deleted successfully', ToastAndroid.SHORT);
                closeActionModal();
                fetchStaff(); // Refresh the list
            } else {
                ToastAndroid.show('Failed to delete staff', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.log('Delete error:', error.message);
            ToastAndroid.show('Error deleting staff', ToastAndroid.SHORT);
        }
    };
    const OpenResetAllModal = (item) => {
        setResetModalAll(true); // Hide the modal

    };

    const handleEdit = (staff) => () => {
        navigation.navigate('AddAgencyStaff', {
            staff_id: staff.staff_id,
            staff_name: staff.staff_name,
            staff_email: staff.staff_email,
            staff_mobile: staff.staff_mobile,
            staff_password: staff.staff_password,
            staff_address: staff.staff_address,
            staff_type: staff.staff_type,
            agencyId: agencyId, // Also pass agency ID if needed in AddAgencyStaff
        });
        closeActionModal(); // close modal after navigation
    };


    const OpenResetModal = (item) => {
        setSelectedStaffId(item.staff_id);
        setselectedStaffName(item.staff_name);
        setDeviceId(item.device_id);
        setResetModal(true); // Hide the modal
    };

    const closeResetModal = () => {
        setResetModal(false); // Hide the modal
    };
    const closeResetModalAll = () => {
        setResetModalAll(false); // Hide the modal
    };


    const DeviceIdReset = async (Id) => {

        try {
            const response = await fetch(ENDPOINTS.reset_Device_Id, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    staff_id: Id,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                if (result.code === 200) {
                    ToastAndroid.show("Reset Device Id successfully", ToastAndroid.SHORT);
                    setResetModal(false);
                    fetchStaff();
                } else {
                    console.log('Error:', 'Failed to load staff data');
                }
            } else {
                console.log('HTTP Error:', result.message || 'Something went wrong');
            }
        } catch (error) {
            console.log('Error fetching data:', error.message);
        }
    };

    const resetAllDeviceId = async () => {
        try {
            const response = await fetch(ENDPOINTS.reset_all_device_id, {
                method: 'GET', // ✅ GET request
            });

            const result = await response.json();

            if (response.ok) {
                if (result.code === 200) {
                    ToastAndroid.show("All Device Ids reset successfully", ToastAndroid.SHORT);
                    setResetModalAll(false);
                    fetchStaff(); // Refresh staff list
                } else {
                    console.log('Error:', result.message || 'Failed to reset devices');
                }
            } else {
                console.log('HTTP Error:', result.message || 'Something went wrong');
            }
        } catch (error) {
            console.log('Error fetching data:', error.message);
        }
    };

    const getInitials = (name) => {
        if (!name) return '';
        const words = name.trim().split(' ');
        if (words.length === 1) return words[0][0].toUpperCase();
        return (words[0][0] + words[1][0]).toUpperCase();
    };

    const renderItem = ({ item, index }) => {
        // Function to get initials if no image
        const getInitials = (name) => {
            if (!name) return '';
            const words = name.trim().split(' ');
            if (words.length === 1) return words[0][0].toUpperCase();
            return (words[0][0] + words[1][0]).toUpperCase();
        };

        // Function to get status color
        const getStatusColor = (status) => {
            switch (status?.toLowerCase()) {
                case 'active': return '#e2feee';
                case 'pending': return '#f1c40f';
                case 'deactive': return '#fee2e2';
                default: return 'grey';
            }
        };
        // Utility function to format date
        const formatDate = (dateString) => {
            if (!dateString) return '--';
            const date = new Date(dateString);
            if (isNaN(date)) return '--';

            const day = ('0' + date.getDate()).slice(-2);
            const month = ('0' + (date.getMonth() + 1)).slice(-2); // month is 0-indexed
            const year = date.getFullYear();

            return `${day}-${month}-${year}`; // Example: 30-11-2025
        };



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
                onPress={() =>
                    navigation.navigate('SubAdminInformation', {
                        agencyId: agencyId,
                        userData: item,
                        setStaffList: setStaffList,
                        onGoBack: handleReturnFromInfoScreen,
                        currentTab: selectedTab,
                    })
                }
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
                    {/* IMAGE */}
                    <View style={{ width: '30%', justifyContent: 'center', alignItems: 'flex-start' }}>
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedImage(
                                    item.staff_image ? { uri: encodeURI(item.staff_image) } : { name: item.staff_name }
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

                    {/* NAME + MOBILE + TYPE */}
                    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 5 }}>
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
                        <Text style={{
                            fontSize: 12,
                            color: '#374151',
                            fontFamily: 'Inter-Regular', marginTop: 2
                        }}>
                            {item.staff_mobile || '----'}
                        </Text>
                        <Text style={{
                            fontSize: 12,
                            color: '#374151',
                            fontFamily: 'Inter-Regular', marginTop: 2
                        }}>
                            {item.staff_type === 'normal' ? 'Field Staff' : item.staff_type || '----'}
                        </Text>
                    </View>
                </View>

                {/* SCHEDULE */}
                <View
                    style={{
                        position: 'absolute',
                        top: 35,
                        left: '52%',
                        width: '50%',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ fontSize: 12, color: '#000', fontFamily: 'Inter-Regular' }}>
                        {item.schedule_staff_start_date && item.schedule_staff_end_date
                            ? `${formatDate(item.schedule_staff_start_date)} - ${formatDate(item.schedule_staff_end_date)}`
                            : 'Not Available'}
                    </Text>
                </View>

            </TouchableOpacity>

        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header */}
            <View style={{
                backgroundColor: colors.Brown,
                paddingVertical: 15,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}>
                {/* Back Button */}
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        left: 10,
                        top: 12,
                        zIndex: 1,
                        padding: 5,

                    }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>

                {/* Title Text */}
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Bold',

                        maxWidth: '80%', // Avoid overlapping
                        textAlign: 'center',

                    }}
                >
                    Staff List
                </Text>
                {(
                    userType === 'SuperAdmin' ||
                    !permissions?.rent_agency ||
                    permissions?.rent_agency?.update ||
                    permissions?.rent_agency?.delete
                ) && (

                        <View
                            style={{
                                width: '15%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'absolute',
                                right: 6,
                                top: 5,
                                height: 50,


                            }}>

                            <TouchableOpacity onPress={() => OpenModal(agencyDetail)}>
                                <Entypo name="dots-three-vertical" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}
            </View>

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
                        borderColor: colors.Brown,

                    }}>
                    <View style={{
                        width: 30,  // निश्चित width दी है
                        height: 50, // पूरी height ली है
                        justifyContent: 'center',
                        alignItems: 'center',

                    }}>
                        <MaterialIcons name='search' size={24} color='black' />
                    </View>
                    <TextInput
                        style={{
                            flex: 1,
                            fontSize: 16,
                            fontFamily: 'Inter-Regular',

                            color: 'black',
                            height: 50,
                        }}

                        placeholder="Search Staff Name/Mobile No"
                        placeholderTextColor="grey"
                        value={text}
                        onChangeText={handleTextChange}
                    />
                    {text ? (
                        <TouchableOpacity
                            onPress={() => {

                                setText(''); // Clear the search text
                                setStaffList(originalStaffData);

                            }}
                            style={{
                                marginRight: 7,
                                height: 40,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <Entypo name="cross" size={20} color="black" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
            {/* {StaffList.length > 0 && (
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        backgroundColor: '#f8f8f8', // Lighter background for better contrast
                        paddingVertical: 10, // Adjusted padding for better spacing
                        paddingHorizontal: 15,
                        borderRadius: 8,
                        marginBottom: 8, // Increased bottom margin for better separation
                        shadowColor: '#000', // Added shadow for better separation from background
                        shadowOpacity: 0.1, // Light shadow effect
                        shadowRadius: 5,
                        elevation: 2, // For Android shadow
                    }}
                >
                    <Text style={{ color: 'black', fontFamily: 'Inter-Bold', marginRight: 20 }}>
                        Admin: <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>{AdminCount}</Text>
                    </Text>
                    <Text style={{ color: 'black', fontFamily: 'Inter-Bold' }}>
                        Field: <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>{FieldCount}</Text>
                    </Text>
                </View>
            )} */}

            <View>
                <ScrollView
                    horizontal
                    keyboardShouldPersistTaps='handled'
                    showsHorizontalScrollIndicator={false}
                    style={{
                        // FIXED HEIGHT
                        paddingVertical: 5,
                    }}
                    contentContainerStyle={{
                        paddingHorizontal: 10,
                        height: 60,
                        backgroundColor: 'white'
                    }}
                >
                    {tabs.map((tab) => {
                        const isSelected = selectedTab === tab.key;

                        return (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => handleTabPress(tab.key)}
                                style={{
                                    backgroundColor: isSelected ? tab.bgColor : `${tab.bgColor}33`, // selected: full color, unselected: transparent version
                                    paddingVertical: 8,
                                    paddingHorizontal: 15,
                                    borderRadius: 8,
                                    marginRight: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{
                                    color: isSelected ? 'white' : 'black',
                                    fontFamily: 'Inter-Bold',
                                    fontSize: 12,
                                }}>
                                    {tab.label}
                                </Text>
                                <Text style={{
                                    color: isSelected ? 'white' : 'black',
                                    fontFamily: 'Inter-Regular',
                                    fontSize: 12,
                                }}>
                                    {tab.count || 0}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Body */}

            <FlatList
                // ref={flatListRef}
                keyboardShouldPersistTaps='handled'
                // data={StaffList.slice(0, currentPage * 20)}
                data={StaffList}
                renderItem={renderItem}
                onEndReached={loadMoreItems} // Trigger when scrolled to the bottom
                onEndReachedThreshold={0.5} // This determines when to trigger loadMoreItems (0.5 means half the list height)
                keyExtractor={(item) => item.staff_id.toString()}
                removeClippedSubviews={true}

                // onScroll={(event) => {
                //     setCurrentScrollPosition(event.nativeEvent.contentOffset.y);
                // }}
                // scrollEventThrottle={16}

                // ✅ टैब बदलने पर ऊपर लोडर दिखाएं
                // ListHeaderComponent={
                //     StaffLoading && StaffList.length > 0 ? (
                //         <View style={{ padding: 10, alignItems: 'center' }}>
                //             <ActivityIndicator size="large" color={colors.Brown} />
                //         </View>
                //     ) : null
                // }
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={{ padding: 10, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.Brown} />
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
                    paddingBottom: 80,
                    backgroundColor: 'white'

                }}
            />


            {/* Sticky Add New Button */}
            {/* Sticky Add New Button */}

            <View
                style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    right: 20,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 1,
                }}
            >
                {/* Reset All Staff */}
                <TouchableOpacity
                    style={{
                        flex: 1,
                        marginRight: 10,
                        backgroundColor: colors.Brown,
                        borderWidth: 1,
                        borderColor: colors.Brown,
                        borderRadius: 10,
                        paddingVertical: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 8,
                    }}
                    onPress={() => OpenResetAllModal(selectedStaff)}
                >
                    <Image source={phone} style={{ width: 20, height: 20, tintColor: 'white' }} />
                    <Text style={{ color: 'white', fontSize: 14, fontFamily: 'Inter-Medium' }}>Reset All Staff</Text>
                </TouchableOpacity>

                {/* Add Staff */}
                <TouchableOpacity
                    style={{
                        flex: 1,
                        marginLeft: 10,
                        backgroundColor: colors.Brown,
                        borderRadius: 10,
                        paddingVertical: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 8,
                    }}
                    onPress={() => {
                        navigation.navigate('AddAgencyStaff', { agencyId });
                    }}
                >
                    <AntDesign name="plus" color="white" size={18} />
                    <Text style={{ color: 'white', fontSize: 14, fontFamily: 'Inter-Medium' }}>Add Staff</Text>
                </TouchableOpacity>
            </View>


            {/* Image Modal */}
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
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
                        onTouchEnd={e => e.stopPropagation()}
                    >
                        {selectedImage ? (
                            selectedImage.uri ? (
                                <Image
                                    source={selectedImage}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 150,
                                        resizeMode: 'cover',
                                    }}
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

            <Modal
                visible={actionModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeActionModal}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    activeOpacity={1}
                    onPress={closeActionModal}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            width: '80%',
                            paddingVertical: 5,
                        }}
                    >
                        <TouchableOpacity
                            onPress={closeActionModal}
                            style={{
                                marginRight: 40,
                                backgroundColor: 'white',
                                borderRadius: 50,
                                padding: 5,
                            }}
                        >
                            <Entypo name="cross" size={25} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 10,
                            borderRadius: 15,
                            width: '60%',
                            alignItems: 'center',
                            elevation: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 5,
                        }}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={e => e.stopPropagation()}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontWeight: 'bold',
                                marginBottom: 20,
                                color: 'black',
                                fontFamily: 'Inter-Regular',
                            }}
                        >
                            Select Action
                        </Text>

                        <TouchableOpacity
                            style={{
                                borderColor: 'black',
                                borderWidth: 1,
                                borderRadius: 10,
                                width: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingVertical: 12,
                                marginTop: 10,
                                flexDirection: 'row',
                                gap: 15,
                            }}
                            onPress={handleEdit(selectedStaff)}
                        >
                            <AntDesign name="edit" size={20} color="black" />
                            <Text
                                style={{
                                    color: 'black',
                                    fontFamily: 'Inter-Regular',
                                    fontSize: 14,
                                }}
                            >
                                Update Staff
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                borderColor: 'red',
                                borderWidth: 1,
                                borderRadius: 10,
                                width: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: 10,
                                paddingVertical: 12,
                                flexDirection: 'row',
                                gap: 15,
                            }}
                            // onPress={() => deleteStaff(selectedStaff.staff_id)}
                            onPress={() => {
                                confirmDelete(selectedStaff.staff_id)
                            }}
                        >
                            <AntDesign name="delete" size={20} color="red" />
                            <Text
                                style={{
                                    color: 'red',
                                    fontFamily: 'Inter-Regular',
                                    fontSize: 14,
                                }}
                            >
                                Delete Staff
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>


            <Modal
                animationType="fade"
                transparent={true}
                visible={ResetModal}
                onRequestClose={closeResetModal}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={closeResetModal}
                    activeOpacity={1}>
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 20,
                            borderRadius: 8,
                            width: '80%',
                            alignItems: 'center',
                        }}
                        onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
                        onTouchEnd={e => e.stopPropagation()}>
                        <Text style={{
                            fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'black', fontFamily: 'Inter-Medium'
                        }}>
                            Reset Device
                        </Text>
                        <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
                            Are you sure To Delete This Staff Device Id ?
                        </Text>
                        <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
                            {selectedStaffName || '------'}
                        </Text>
                        <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
                            {DeviceId || '------'}
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                width: '100%',
                            }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#ddd',
                                    padding: 10,
                                    borderRadius: 5,
                                    width: '45%',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={closeResetModal}>
                                <Text
                                    style={{
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
                                        DeviceIdReset(selectedStaffId); // Pass staff ID here
                                    }
                                }}
                            >
                                <Text
                                    style={{
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

            <Modal
                animationType="fade"
                transparent={true}
                visible={showDeleteModal}
                onRequestClose={() => setShowDeleteModal(false)}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={() => setShowDeleteModal(false)}
                    activeOpacity={1}>
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 20,
                            borderRadius: 8,
                            width: '80%',
                            alignItems: 'center',
                        }}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={e => e.stopPropagation()}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            marginBottom: 10,
                            color: 'black',
                            fontFamily: 'Inter-Medium',
                        }}>
                            Confirmation
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            marginBottom: 20,
                            textAlign: 'center',
                            color: 'black',
                            fontFamily: 'Inter-Medium',
                        }}>
                            Are you sure you want to delete this staff?
                        </Text>

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            width: '100%',
                        }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#ddd',
                                    padding: 10,
                                    borderRadius: 5,
                                    width: '45%',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={() => setShowDeleteModal(false)}>
                                <Text style={{
                                    color: 'black',
                                    fontWeight: 'bold',
                                    fontFamily: 'Inter-Regular',
                                }}>
                                    No
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
                                    deleteStaff(selectedAgencyId);
                                    setShowDeleteModal(false);
                                }}>
                                <Text style={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontFamily: 'Inter-Regular',
                                }}>
                                    Yes
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCloseModal}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    activeOpacity={1}
                    onPress={handleCloseModal}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            width: '80%',
                            paddingVertical: 5,
                        }}>
                        <TouchableOpacity
                            onPress={handleCloseModal}
                            style={{
                                marginRight: 40,
                                backgroundColor: 'white',
                                borderRadius: 50,
                            }}>
                            <Entypo name="cross" size={23} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 10,
                            borderRadius: 15,
                            width: '60%',
                            alignItems: 'center',
                            elevation: 5, // Adds shadow for Android
                            shadowColor: '#000', // Shadow for iOS
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 5,
                        }}
                        onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
                        onTouchEnd={e => e.stopPropagation()}>
                        <View
                            style={{
                                flexDirection: 'row',
                                width: '100%',
                                justifyContent: 'center',
                            }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: 'bold',
                                    marginBottom: 20,
                                    color: 'black',
                                    fontFamily: 'Inter-Regular',
                                }}>
                                Select Action
                            </Text>
                            {/* <TouchableOpacity
                                        style={{
                                          position: 'absolute',
                                          right: 0,
                                          top: -8,
                                          width: '15%',
                                          flexDirection: 'row',
                                          justifyContent: 'center',
                                        }}
                                        onPress={handleCloseModal}>
                                        <Text
                                          style={{
                                            fontSize: 28,
                                            fontWeight: 'bold',
                                            color: 'black',
                                            fontFamily: 'Inter-Regular',
                                          }}>
                                          ×
                                        </Text>
                                      </TouchableOpacity> */}
                        </View>
                        <View style={{ gap: 3, width: '90%' }}>
                            {/* Info Staff Button */}
                            {/* <TouchableOpacity
                                        style={{
                                          borderColor: colors.Brown,
                                          borderWidth: 1,
                                          borderRadius: 10,
                                          width: '100%',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          paddingVertical: 12,
                                          marginTop: 10,
                                          flexDirection: 'row',
                                          gap: 15,
                                        }}
                                        onPress={() => {
                                          SetInfoModal(true);
                                          setIsModalVisible(false);
                                        }}>
                                        <AntDesign name="infocirlceo" size={20} color={colors.Brown} />
                        
                                        <Text
                                          style={{
                                            color: 'black',
                                            fontFamily: 'Inter-Regular',
                                            fontSize: 16,
                                          }}>
                                          Information Staff
                                        </Text>
                                      </TouchableOpacity> */}

                            {/* Update Leave Button */}

                            {/* {(
                                            userType === 'SuperAdmin' ||
                                            !permissions.staff ||
                                            permissions.staff.update
                                        ) && ( */}
                            {(
                                userType === 'SuperAdmin' ||
                                !permissions.rent_agency ||
                                permissions.rent_agency.update
                            ) && (
                                    <TouchableOpacity
                                        style={{
                                            borderColor: 'black',
                                            borderWidth: 1,
                                            borderRadius: 10,
                                            width: '100%',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingVertical: 12,
                                            marginTop: 10,
                                            flexDirection: 'row',
                                            gap: 15,
                                        }}
                                        onPress={handleEdit2}>
                                        <AntDesign name="edit" size={20} color="black" />
                                        <Text
                                            style={{
                                                color: 'black',
                                                fontFamily: 'Inter-Regular',
                                                fontSize: 14,
                                            }}>
                                            Update Agency
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            {/* )} */}
                            {/* Delete Leave Button */}

                            {(
                                userType === 'SuperAdmin' ||
                                !permissions.rent_agency ||
                                permissions.rent_agency.delete
                            ) && (
                                    <TouchableOpacity
                                        style={{
                                            borderColor: 'red',
                                            borderWidth: 1,
                                            borderRadius: 10,
                                            width: '100%',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginTop: 10,
                                            paddingVertical: 12,
                                            flexDirection: 'row',
                                            gap: 15,
                                        }}
                                        onPress={() => {
                                            confirmDelete2(agencyDetail.agency_id)
                                        }}>
                                        <AntDesign name="delete" size={20} color="red" />
                                        <Text
                                            style={{
                                                color: 'red',
                                                fontFamily: 'Inter-Regular',
                                                fontSize: 14,
                                            }}>
                                            Delete Agency
                                        </Text>
                                    </TouchableOpacity>
                                )}


                            {(
                                userType === 'SuperAdmin' ||
                                !permissions.rent_agency ||
                                permissions.rent_agency.update
                            ) && (
                                    <TouchableOpacity
                                        style={{
                                            borderColor: 'black',
                                            borderWidth: 1,
                                            borderRadius: 10,
                                            width: '100%',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingVertical: 12,
                                            marginTop: 10,
                                            flexDirection: 'row',
                                            gap: 15,
                                        }}
                                        onPress={() => {


                                            navigation.navigate('AgencyFinanceList', {
                                                agencyId: agencyId,
                                                agencyName: agencyName,
                                            });
                                        }}
                                    >
                                        <FontAwesome5 name="building" size={20} color="black" />

                                        <Text
                                            style={{
                                                color: 'black',
                                                fontFamily: 'Inter-Regular',
                                                fontSize: 14,
                                            }}>
                                            Agency Finance List
                                        </Text>
                                    </TouchableOpacity>
                                )}


                        </View>

                    </View>



                </TouchableOpacity>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={showDeleteModal2}
                onRequestClose={() => setShowDeleteModal2(false)}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={() => setShowDeleteModal2(false)}
                    activeOpacity={1}>
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 20,
                            borderRadius: 8,
                            width: '80%',
                            alignItems: 'center',
                        }}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={e => e.stopPropagation()}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            marginBottom: 10,
                            color: 'black',
                            fontFamily: 'Inter-Medium',
                        }}>
                            Confirmation
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            marginBottom: 20,
                            textAlign: 'center',
                            color: 'black',
                            fontFamily: 'Inter-Medium',
                        }}>
                            Are you sure you want to delete this agency?
                        </Text>

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            width: '100%',
                        }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#ddd',
                                    padding: 10,
                                    borderRadius: 5,
                                    width: '45%',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={() => setShowDeleteModal2(false)}>
                                <Text style={{
                                    color: 'black',
                                    fontWeight: 'bold',
                                    fontFamily: 'Inter-Regular',
                                }}>
                                    No
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
                                    deleteAgency(selectedAgencyId2);
                                    setShowDeleteModal(false);
                                }}>
                                <Text style={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontFamily: 'Inter-Regular',
                                }}>
                                    Yes
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={ResetModalAll}
                onRequestClose={closeResetModalAll}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={closeResetModalAll}
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
                        onStartShouldSetResponder={() => true} // Prevent modal close on content click
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
                            Are you sure you want to Reset All Staff Device Ids?
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                width: '100%',
                            }}
                        >
                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#ddd',
                                    padding: 10,
                                    borderRadius: 5,
                                    width: '45%',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={closeResetModalAll}
                            >
                                <Text style={{
                                    color: 'black',
                                    fontWeight: 'bold',
                                    fontFamily: 'Inter-Regular',
                                }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            {/* Reset All Button */}
                            <TouchableOpacity
                                style={{
                                    backgroundColor: colors.Brown,
                                    padding: 10,
                                    borderRadius: 5,
                                    width: '45%',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={async () => {
                                    await resetAllDeviceId(); // ✅ Call API
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

        </View>
    );
};

export default AgencyStaff;


