import { Image, StyleSheet, Text, TouchableOpacity, View, TextInput, Switch, Modal, ActivityIndicator, ToastAndroid, Alert, PermissionsAndroid, Platform, Linking, ScrollView, BackHandler, FlatList, TouchableWithoutFeedback, Animated } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ENDPOINTS, IMAGE_BASE_URL } from '../CommonFiles/Constant';
import Feather from 'react-native-vector-icons/Feather'
import AsyncStorage from '@react-native-async-storage/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import RNFS from 'react-native-fs';
import WebView from 'react-native-webview';
import RNFetchBlob from 'react-native-blob-util';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import MapView, { Marker } from 'react-native-maps';


const informationScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userData, setStaffList, onGoBack } = route.params || {};
    console.log("userdata ke id", userData.staff_id)

    const [ConfrimationModal, setConfrimationModal] = useState(false);

    const [historyDetailModalVisible, setHistoryDetailModalVisible] = useState(false);
    const [selectedHistoryDetail, setSelectedHistoryDetail] = useState(null);
    const [MapLoading, setMapLoading] = useState(false);
    const [staffdetail, setStaffDetail] = useState([]);

    const [ResetModal, setResetModal] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [selectedStaffName, setSelectedStaffName] = useState(null);
    const [DeviceId, setDeviceId] = useState('');

    // NEW STATE FOR ICARD TYPE MODAL
    const [icardTypeModalVisible, setIcardTypeModalVisible] = useState(false);

    const [docModalVisible, setDocModalVisible] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    const [isLoading, setIsLoading] = useState(true);

    const call = require('../assets/images/Call.png');
    const whatsapp = require('../assets/images/whatsapp.png');

    const openHistoryDetailModal = (item) => {
        setSelectedHistoryDetail(item);
        setHistoryDetailModalVisible(true);
    };

    const closeHistoryDetailModal = () => {
        setHistoryDetailModalVisible(false);
        setSelectedHistoryDetail(null);
    };

    const openMap = (location, lat, lng) => {
        let url = '';

        if (lat && lng) {
            url = Platform.select({
                ios: `http://maps.apple.com/?ll=${lat},${lng}`,
                android: `geo:${lat},${lng}?q=${lat},${lng}`
            });
        } else if (location) {
            const encodedAddress = encodeURIComponent(location);
            url = Platform.select({
                ios: `http://maps.apple.com/?q=${encodedAddress}`,
                android: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
            });
        } else {
            ToastAndroid.show("Location not available", ToastAndroid.SHORT);
            return;
        }

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    ToastAndroid.show("Cannot open map", ToastAndroid.SHORT);
                }
            })
            .catch((err) => console.error("Error opening map:", err));
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

    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    const User = require('../assets/images/user.png');
    const [name, setName] = useState(staffdetail.staff_image || '');

    const [mobile, setMobile] = useState(staffdetail.staff_mobile || '');
    const [email, setEmail] = useState(staffdetail.staff_email || '');
    const [modalVisible, setModalVisible] = useState(false);
    const [userType, setUsertype] = useState(null);
    const [userId, setUserId] = useState('');

    const [statusModal, setStatusModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState('1day');

    const [searchHistory, setSearchHistory] = useState([]);
    const [displayedSearchHistory, setDisplayedSearchHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [loadingMore, setLoadingMore] = useState(false);

    const [scheduleHistory, setScheduleHistory] = useState([]);
    const [displayedScheduleHistory, setDisplayedScheduleHistory] = useState([]);
    const [scheduleCurrentPage, setScheduleCurrentPage] = useState(1);
    const [scheduleLoadingMore, setScheduleLoadingMore] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [searchHistoryLoading, setSearchHistoryLoading] = useState(false);
    const [scheduleHistoryLoading, setScheduleHistoryLoading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const formatDateDMY = (dateStr) => {
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    useFocusEffect(
        React.useCallback(() => {
            let usertype = null;

            const fetchUsertype = async () => {
                usertype = await AsyncStorage.getItem('user_type');
                const agency = await AsyncStorage.getItem('selected_agency');
                setUsertype(usertype);
            };

            fetchUsertype();
        }, []),
    );

    const [icardUrl, setIcardUrl] = useState(null);
    const [type, setType] = useState(null);

    const [webViewVisible, setWebViewVisible] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

    const OpenModal = (x, y) => {
        setModalPosition({
            top: y + 12,
            left: x - 220,
        });
        setIsModalVisible(true);
    };

    const handleEdit = () => {
        navigation.navigate('AddStaffScreen', {
            staff_id: staffdetail.staff_id,
            staff_name: staffdetail.staff_name,
            staff_email: staffdetail.staff_email,
            staff_mobile: staffdetail.staff_mobile,
            staff_address: staffdetail.staff_address,
            staff_password: staffdetail.staff_password,
            staff_type: staffdetail.staff_type,
        });
        handleCloseModalthree();
    };

    const handleDelete = () => {
        setConfrimationModal(true);
        handleCloseModalthree();
    };

    const closeconfirmodal = () => {
        setConfrimationModal(false);
    };

    const handleCloseModalthree = () => {
        setIsModalVisible(false);
    };

    const requestStoragePermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission',
                        message: 'App needs access to your storage to save files',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        } else {
            return true;
        }
    };

    useEffect(() => {
        requestStoragePermission();
    }, []);

    useEffect(() => {
        const fetchIcardUrl = async () => {
            const userId = await AsyncStorage.getItem('staff_id');
            setUserId(userId);
        };

        fetchIcardUrl();
    }, []);

    const formatDate = date => {
        console.log('date hai ye formate ka', date);
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const handleAddSchedule = async (staffId, startDate, endDate) => {
        console.log("staffid start date and end date", staffId, startDate, endDate);
        try {
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = endDate ? formatDate(endDate) : null;
            console.log("Schedule Id ye hai", staffId);

            const response = await fetch(ENDPOINTS.Add_Schedule, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    staff_id: staffId,
                    start_date: formattedStartDate,
                    end_date: formattedEndDate,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to connect to the server');
            }

            const data = await response.json();
            console.log('Response:', data);

            if (data.code === 200) {
                ToastAndroid.show('Schedule Added Successfully', ToastAndroid.SHORT);
                SingleStaffDetailApi();
            } else {
                console.log('Add failed:', data.message);
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    };

    const DeleteStaffApi = async staffId => {
        console.log('staffId', staffId);
        try {
            const response = await fetch(ENDPOINTS.Delete_Staff, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    staff_id: staffId,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                if (result.code == 200) {
                    ToastAndroid.show('Staff Deleted Successfully', ToastAndroid.SHORT);
                    navigation.goBack();
                } else {
                    console.log('Error:', 'Failed to load staff data');
                }
            } else {
                console.log('HTTP Error:', result.message || 'Something went wrong');
            }
        } catch (error) {
            console.log('Error fetching data:', error.message);
        } finally {
        }
    };

    const downloadImage = async () => {
        const defaultUrl = "https://ayzalenterprises.in/images/user_image/user.jpg";

        if (!selectedDoc?.url || selectedDoc.url === defaultUrl) {
            Alert.alert("Oops!", "Image not available for download.");
            return;
        }

        try {
            const imageUrl = selectedDoc.url;
            const fileName = imageUrl.split("/").pop() || 'image.jpg';

            let downloadPath;

            if (Platform.OS === 'android') {
                downloadPath = RNFS.DownloadDirectoryPath + '/' + fileName;
            } else {
                downloadPath = RNFS.DocumentDirectoryPath + '/' + fileName;
            }

            const download = RNFS.downloadFile({
                fromUrl: imageUrl,
                toFile: downloadPath,
                background: true,
                discretionary: true,
                progress: (res) => {
                    const progress = (res.bytesWritten / res.contentLength);
                    console.log(`Download progress: ${progress * 100}%`);
                }
            });

            download.promise
                .then(result => {
                    if (result.statusCode === 200) {
                        ToastAndroid.show("Image Downloaded Successfully!", ToastAndroid.SHORT);
                        setDocModalVisible(false);
                    } else {
                        throw new Error(`Download failed with status: ${result.statusCode}`);
                    }
                })
                .catch(error => {
                    console.log("Download error:", error);
                    ToastAndroid.show("Download failed!", ToastAndroid.SHORT);
                    setDocModalVisible(false);
                });

        } catch (error) {
            console.log("Error:", error);
            ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT);
            setDocModalVisible(false);
        }
    };

    const handleDownload = async (type, userId) => {
        try {
            const hasPermission = await requestPermissions();
            if (!hasPermission) {
                ToastAndroid.show('Storage permission denied!', ToastAndroid.SHORT);
                return;
            }

            const { fs, android } = RNFetchBlob;
            const fileUrl = ENDPOINTS.ICard(userId, type);
            const fileName = `Icard_${type}_${userId}.pdf`;
            const downloadPath = `${fs.dirs.DownloadDir}/${fileName}`;

            const res = await RNFetchBlob.config({
                fileCache: true,
                path: downloadPath,
            }).fetch('GET', fileUrl);

            if (Platform.OS === 'android') {
                android.actionViewIntent(res.path(), 'application/pdf');
                RNFetchBlob.fs.scanFile([{ path: res.path(), mime: 'application/pdf' }]);
            }

            console.log("File saved to:", res.path());
            ToastAndroid.show(`Saved to Downloads: ${fileName}`, ToastAndroid.LONG);

        } catch (error) {
            console.error('Download error:', error);
            ToastAndroid.show('Download failed!', ToastAndroid.SHORT);
        }
    };

    const [permissions, setPermissions] = useState({});

    const [loading, setLoading] = useState(false);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const staff_id = await AsyncStorage.getItem('staff_id');

            const response = await fetch(ENDPOINTS.List_Staff_Permission, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id }),
            });

            const result = await response.json();

            if (result.code === 200 && result.payload) {
                const permData = {};

                result.payload.forEach(item => {
                    const menuName = item.menu_name.toLowerCase();
                    const permsArray = item.menu_permission
                        .split(',')
                        .map(p => p.trim().toLowerCase());

                    const permsObject = {};
                    permsArray.forEach(perm => {
                        permsObject[perm] = true;
                    });

                    permData[menuName] = permsObject;
                });

                setPermissions(permData)
            } else {
                console.warn('Failed to fetch permissions or no payload');
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const hasAccountStatusPermission =
        userType === 'SuperAdmin' ||
        (userType === 'SubAdmin' && permissions?.staff?.accountstatus) ||
        (userType === 'main' && permissions?.staff?.accountstatus);

    const hasInternetStatusPermission =
        userType === 'SuperAdmin' ||
        (userType === 'SubAdmin' && permissions?.staff?.internetstatus) ||
        (userType === 'main' && permissions?.staff?.internetstatus);

    const [isLocationEnabled, setIsLocationEnabled] = useState({
        [staffdetail.staff_id]: staffdetail.staff_location === 'Yes',
    });

    const [isAccountEnabled, setIsAccountEnabled] = useState({
        [staffdetail.staff_id]: staffdetail.staff_status === 'Active',
    });

    const [loadingToggles, setLoadingToggles] = useState({});
    const [AccountToggles, setAccountToggles] = useState({});

    handleImagePress = () => {
        setModalVisible(true);
    };
    const handleCloseModal = () => {
        setModalVisible(false);
    };

    if (!staffdetail) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                <ActivityIndicator size="large" color={colors.Brown} />
                <Text style={{ marginTop: 10, color: 'gray', fontFamily: 'Inter-Regular' }}>Loading user data...</Text>
            </View>
        );
    }

    const StaffAccountStatus = async (staff_id, action) => {
        try {
            const response = await fetch(ENDPOINTS.Staff_Account_Status, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id, action }),
            });

            const result = await response.json();

            if (result.code === 200) {
                ToastAndroid.show("Staff Account Status Successfully", ToastAndroid.SHORT);
            } else {
                ToastAndroid.show("Failed Staff Account Status", ToastAndroid.SHORT);
                setIsAccountEnabled(prev => ({
                    ...prev,
                    [staff_id]: !prev[staff_id],
                }));
            }
        } catch (error) {
            ToastAndroid.show("Error updating Account Status", ToastAndroid.SHORT);
        } finally {
            setAccountToggles(prev => ({
                ...prev,
                [staff_id]: false,
            }));
        }
    };

    const DeviceIdReset = async (staffId) => {
        try {
            const response = await fetch(ENDPOINTS.reset_Device_Id, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    staff_id: staffId,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                if (result.code === 200) {
                    ToastAndroid.show("Reset Device Id successfully", ToastAndroid.SHORT);
                    setResetModal(false);
                    SingleStaffDetailApi();
                } else {
                    console.log('Error:', 'Failed to reset device');
                    ToastAndroid.show(result.message || 'Failed to reset', ToastAndroid.SHORT);
                }
            } else {
                console.log('HTTP Error:', result.message || 'Something went wrong');
                ToastAndroid.show('Network error', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.log('Error fetching data:', error.message);
            ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
        }
    };

    const StaffInternetAccess = async (staff_id, action) => {
        try {
            const response = await fetch(ENDPOINTS.Staff_Internet_Access, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id, action }),
            });

            const result = await response.json();

            if (response.ok && result.code === 200) {
                ToastAndroid.show("Location Access changed successfully", ToastAndroid.SHORT);
            } else {
                ToastAndroid.show("Failed to update Location Access", ToastAndroid.SHORT);
                setIsLocationEnabled(prev => ({
                    ...prev,
                    [staff_id]: !prev[staff_id],
                }));
            }
        } catch (error) {
            ToastAndroid.show("Error updating Location Access", ToastAndroid.SHORT);
            setIsLocationEnabled(prev => ({
                ...prev,
                [staff_id]: !prev[staff_id],
            }));
        } finally {
            setLoadingToggles(prev => ({
                ...prev,
                [staff_id]: false,
            }));
        }
    };

    const AgencyStaffLogout = async (navigation, confirmLogout) => {
        try {
            const staffId = await AsyncStorage.getItem('staff_id');

            if (!staffId) {
                ToastAndroid.show('No staff ID found', ToastAndroid.SHORT);
                return;
            }

            const response = await fetch(ENDPOINTS.Staff_Agency_Logout, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId }),
            });

            const result = await response.json();

            if (result.code === 200) {
                const staffStatus = result?.payload?.[0]?.staff_status;
                const userType = result?.payload?.[0]?.user_type;
                await AsyncStorage.setItem('user_type', userType);

                if (staffStatus === 'Deactive') {
                    confirmLogout();
                } else {
                }
            } else {
            }
        } catch (error) {
            console.log('Logout error:', error.message);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            AgencyStaffLogout(navigation, confirmLogout);
        }, [])
    );

    const confirmLogout = async () => {
        await AsyncStorage.removeItem('id');
        await AsyncStorage.removeItem('selected_agency');
        navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
        });
    };

    const getInitials = (name) => {
        if (!name) return '';
        const words = name.trim().split(' ');
        if (words.length === 1) return words[0][0].toUpperCase();
        return (words[0][0] + words[1][0]).toUpperCase();
    };

    const fetchSearchHistory = async () => {
        console.log('staff id 111111', userData.staff_id)
        setSearchHistoryLoading(true);
        try {
            const response = await fetch(ENDPOINTS.user_vehicle_history, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userData.staff_id
                }),
            });

            const result = await response.json();

            if (result.code == 200 && result.payload) {
                setSearchHistory(result.payload);
                setDisplayedSearchHistory(result.payload.slice(0, itemsPerPage));
                setCurrentPage(1);
            } else {
                setSearchHistory([]);
                setDisplayedSearchHistory([]);
            }
        } catch (error) {
            console.error('Error fetching search history:', error);
            setSearchHistory([]);
            setDisplayedSearchHistory([]);
        }
        setSearchHistoryLoading(false);
    };

    const loadMoreSearchHistory = () => {
        if (loadingMore) return;

        const nextPage = currentPage + 1;
        const startIndex = nextPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        if (startIndex >= searchHistory.length) return;

        setLoadingMore(true);

        setTimeout(() => {
            const nextItems = searchHistory.slice(startIndex, endIndex);
            setDisplayedSearchHistory(prev => [...prev, ...nextItems]);
            setCurrentPage(nextPage);
            setLoadingMore(false);
        }, 500);
    };

    const loadMoreScheduleHistory = () => {
        if (scheduleLoadingMore) return;

        const nextPage = scheduleCurrentPage + 1;
        const startIndex = nextPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        if (startIndex >= scheduleHistory.length) return;

        setScheduleLoadingMore(true);

        setTimeout(() => {
            const nextItems = scheduleHistory.slice(startIndex, endIndex);
            setDisplayedScheduleHistory(prev => [...prev, ...nextItems]);
            setScheduleCurrentPage(nextPage);
            setScheduleLoadingMore(false);
        }, 500);
    };

    const fetchScheduleHistory = async () => {
        console.log('staff id', userData.staff_id)
        setScheduleHistoryLoading(true);
        try {
            const response = await fetch(ENDPOINTS.staff_schedule_history, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: userData.staff_id
                }),
            });

            const result = await response.json();

            if (result.code == 200 && result.payload) {
                setScheduleHistory(result.payload);
                setDisplayedScheduleHistory(result.payload.slice(0, itemsPerPage));
                setScheduleCurrentPage(1);
            } else {
                setScheduleHistory([]);
                setDisplayedScheduleHistory([]);
            }
        } catch (error) {
            console.error('Error fetching schedule history:', error);
            setScheduleHistory([]);
            setDisplayedScheduleHistory([]);
        }
        setScheduleHistoryLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            SingleStaffDetailApi();
        }, [])
    );

    const SingleStaffDetailApi = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(ENDPOINTS.single_staff_detail, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: userData.staff_id }),
            });

            const result = await response.json();
            console.log("result ka data ", result);

            if (result.code == 200 && result.payload) {
                setStaffDetail(result.payload);
                setTimeout(() => setIsLoading(false), 500);
            } else {
                console.log("Error:", result.message);
                setIsLoading(false);
            }
        } catch (error) {
            console.log("API Error:", error.message);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSearchHistory();
    }, []);

    const [activeTab, setActiveTab] = useState("Search");

    const TabButton = ({ label, tabKey, icon }) => {
        const isActive = activeTab === tabKey;

        return (
            <TouchableOpacity
                onPress={() => {
                    setActiveTab(tabKey)
                    console.log("iske andar tab key ye hai", tabKey);
                    setTimeout(async () => {
                        if (tabKey === "Search") {
                            await fetchSearchHistory();
                        } else if (tabKey === "Schedule") {
                            await fetchScheduleHistory();
                        }
                    }, 10);
                }}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    marginRight: 10,
                    borderRadius: 20,
                    backgroundColor: isActive ? "#2563EB" : "#F3F4F6",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: "#E5E7EB",
                }}
            >
                <Ionicons
                    name={icon}
                    size={18}
                    color={isActive ? "#fff" : "#374151"}
                    style={{ marginRight: 6 }}
                />

                <Text
                    style={{
                        fontSize: 14,
                        fontFamily: "Inter-Medium",
                        color: isActive ? "#fff" : "#374151",
                    }}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#fff',
            }}
        >
            <View
                style={{
                    backgroundColor: colors.Brown,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
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
                    onPress={handleBack}>
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>
                <Text
                    style={{
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Bold',
                    }}>
                    Information
                </Text>
            </View>

            <View
                style={{
                    width: '100%',
                    marginTop: 15,
                    paddingHorizontal: 10,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: '#ffffff',
                        borderRadius: 15,
                        padding: 10,
                        alignItems: 'center',
                        elevation: 5,
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowRadius: 6,
                    }}
                >
                    <TouchableOpacity onPress={handleImagePress}>
                        {staffdetail.staff_image_profile ? (
                            <Image
                                source={{ uri: encodeURI(staffdetail.staff_image_profile) }}
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 60,
                                    borderWidth: 3,
                                    borderColor: '#fff',
                                }}
                            />
                        ) : (
                            <View
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 60,
                                    backgroundColor: '#c9c9c9',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 3,
                                    borderColor: '#fff',
                                }}
                            >
                                <Text style={{
                                    color: '#fff',
                                    fontSize: 24,
                                    fontWeight: '700',
                                    letterSpacing: 1,
                                }}>
                                    {getInitials(staffdetail.staff_name)}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View
                        style={{
                            flex: 1,
                            marginLeft: 12,
                            justifyContent: 'center',
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            style={{
                                fontSize: 14,
                                color: '#000',
                                fontFamily: 'Inter-Bold',
                                textTransform: 'uppercase',
                            }}
                        >
                            {staffdetail.staff_name}
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                                paddingVertical: 8,
                                borderRadius: 8,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: '#374151',
                                    fontFamily: 'Inter-Regular',
                                }}
                            >
                                {staffdetail.staff_mobile}
                            </Text>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    marginLeft: 'auto',
                                    alignItems: 'center',
                                    gap: 18,
                                    flex: 1
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => Linking.openURL(`tel:${staffdetail.staff_mobile}`)}
                                >
                                    <Image source={call} style={{ width: 17, height: 17 }} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() =>
                                        Linking.openURL(
                                            `https://wa.me/${staffdetail.staff_mobile}`
                                        )
                                    }
                                >
                                    <Image source={whatsapp} style={{ width: 20, height: 20 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: 100,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexDirection: 'row',
                        }}
                    >
                        {AccountToggles[staffdetail.staff_id] ? (
                            <ActivityIndicator size="small" color="#8b5e3c" />
                        ) : (
                            <Switch
                                trackColor={{ false: "#f54949", true: "#1cd181" }}
                                thumbColor="#fff"
                                disabled={!!AccountToggles[staffdetail.staff_id] || !hasAccountStatusPermission}
                                onValueChange={(value) => {
                                    const staffId = staffdetail.staff_id;

                                    setAccountToggles(prev => ({
                                        ...prev,
                                        [staffId]: true,
                                    }));

                                    setIsAccountEnabled(prev => ({
                                        ...prev,
                                        [staffId]: value,
                                    }));

                                    StaffAccountStatus(staffId, value ? 'On' : 'Off');
                                }}
                                value={
                                    isAccountEnabled[staffdetail.staff_id] !== undefined
                                        ? isAccountEnabled[staffdetail.staff_id]
                                        : staffdetail.staff_status === 'Active'
                                }
                            />
                        )}

                        <TouchableOpacity
                            onPress={(e) => {
                                const { pageX, pageY } = e.nativeEvent;
                                OpenModal(pageX, pageY);
                            }}
                            style={{
                                padding: 6,
                                borderRadius: 10,
                                backgroundColor: '#f2f2f2',
                            }}
                        >
                            <Entypo name="dots-three-vertical" size={18} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{
                    backgroundColor: '#ffffff', width: '100%', paddingHorizontal: 10, marginTop: 15,
                }}>
                    <View
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 15,
                            padding: 15,
                            marginTop: 15,
                            shadowColor: '#000',
                            shadowOpacity: 0.05,
                            shadowOffset: { width: 0, height: 2 },
                            shadowRadius: 4,
                            elevation: 2,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderColor: '#eee',
                            }}
                        >
                            <View style={{ width: 30, alignItems: 'center' }}>
                                <Ionicons name="mail-outline" size={26} color="#4A7DFE" />
                            </View>
                            <View
                                style={{
                                    flex: 1,
                                    marginLeft: 10,
                                }}
                            >
                                <Text style={{
                                    fontFamily: 'Inter-SemiBold',
                                    fontSize: 16,
                                    color: '#374151',
                                    letterSpacing: 0.2,
                                    marginBottom: 2,
                                }}>Email</Text>
                                <Text style={{
                                    fontFamily: 'Inter-Regular',
                                    fontSize: 15,
                                    color: '#4B5563',
                                    lineHeight: 22
                                }}>
                                    {staffdetail.staff_email || '----'}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderColor: '#eee',
                            }}
                        >
                            <View style={{ width: 30, alignItems: 'center' }}>
                                <Ionicons name="person-circle-outline" size={26} color="#2EC4B6" />
                            </View>
                            <View
                                style={{
                                    flex: 1,
                                    marginLeft: 10,
                                }}
                            >
                                <Text style={{
                                    fontFamily: 'Inter-SemiBold',
                                    fontSize: 16,
                                    color: '#374151',
                                    letterSpacing: 0.2,
                                    marginBottom: 2,
                                }}>Reference Name</Text>
                                <Text style={{
                                    fontFamily: 'Inter-Regular',
                                    fontSize: 15,
                                    color: '#4B5563',
                                    lineHeight: 22
                                }}>
                                    {staffdetail.staff_reference?.toUpperCase() || '----'}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderColor: '#eee',
                            }}
                        >
                            <View style={{ width: 30, alignItems: 'center' }}>
                                <Ionicons name="location-outline" size={26} color="#A259FF" />
                            </View>
                            <View
                                style={{
                                    flex: 1,
                                    marginLeft: 10,
                                }}
                            >
                                <Text style={{
                                    fontFamily: 'Inter-SemiBold',
                                    fontSize: 16,
                                    color: '#374151',
                                    letterSpacing: 0.2,
                                    marginBottom: 2,
                                }}>Address</Text>
                                <Text style={{
                                    fontFamily: 'Inter-Regular',
                                    fontSize: 15,
                                    color: '#4B5563',
                                    lineHeight: 22
                                }}>
                                    {staffdetail.staff_address || '----'}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderColor: '#eee',
                            }}
                        >
                            <View style={{ width: 30, alignItems: 'center' }}>
                                <Ionicons name="calendar-outline" size={26} color="#F4B400" />
                            </View>
                            <View
                                style={{
                                    flex: 1,
                                    marginLeft: 10,
                                }}
                            >
                                <Text style={{
                                    fontFamily: 'Inter-SemiBold',
                                    fontSize: 16,
                                    color: '#374151',
                                    letterSpacing: 0.2,
                                    marginBottom: 2,
                                }}>Entry Date</Text>
                                <Text style={{
                                    fontFamily: 'Inter-Regular',
                                    fontSize: 15,
                                    color: '#4B5563',
                                    lineHeight: 22
                                }}>
                                    {staffdetail.staff_entry_date ? (() => {
                                        const date = new Date(staffdetail.staff_entry_date);
                                        if (isNaN(date)) return staffdetail.staff_entry_date;

                                        const d = String(date.getDate()).padStart(2, '0');
                                        const m = String(date.getMonth() + 1).padStart(2, '0');
                                        const y = date.getFullYear();
                                        const h = String(date.getHours()).padStart(2, '0');
                                        const min = String(date.getMinutes()).padStart(2, '0');
                                        const s = String(date.getSeconds()).padStart(2, '0');

                                        return `${d}-${m}-${y} ${h}:${min}:${s}`;
                                    })() : '----'}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderColor: '#eee',
                            }}
                        >
                            <View style={{ width: 30, alignItems: 'center' }}>
                                {staffdetail.account_status === "Expired" ? (
                                    <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
                                ) : (
                                    <Ionicons name="checkmark-circle-outline" size={26} color="#10B981" />
                                )}
                            </View>

                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text
                                    style={{
                                        fontFamily: 'Inter-SemiBold',
                                        fontSize: 16,
                                        color: '#374151',
                                        letterSpacing: 0.2,
                                        marginBottom: 2,
                                    }}
                                >
                                    Account Status
                                </Text>

                                <Text
                                    style={{
                                        fontFamily: 'Inter-Regular',
                                        fontSize: 15,
                                        color: staffdetail.account_status === "Expired" ? "#DC2626" : "#10B981",
                                        lineHeight: 22,
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {staffdetail.account_status || '----'}
                                </Text>
                            </View>

                            {staffdetail.account_status === "Expired" && (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#4A7DFE',
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                    }}
                                    onPress={() => {
                                        setStatusModal(true)
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#fff',
                                            fontSize: 14,
                                            fontFamily: 'Inter-SemiBold',
                                        }}
                                    >
                                        Extend
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

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

                        <View style={{
                            height: 1,
                            backgroundColor: "#E5E7EB",
                            marginVertical: 15,
                            marginHorizontal: 10
                        }} />

                        <View style={{
                            backgroundColor: '#F9FAFB',
                            paddingVertical: 20,
                            paddingHorizontal: 10,
                            borderRadius: 16,
                            marginHorizontal: 10,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            minHeight: 180,
                        }}>
                            {activeTab === "Search" && (
                                <View style={{ flex: 1 }}>
                                    {searchHistoryLoading ? (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                                            <ActivityIndicator size="large" color={colors.Brown} />
                                            <Text style={{ marginTop: 10, fontFamily: 'Inter-Regular', color: '#6B7280' }}>
                                                Loading search history...
                                            </Text>
                                        </View>
                                    ) : searchHistory.length > 0 ? (
                                        <FlatList
                                            data={displayedSearchHistory}
                                            keyExtractor={(item, index) => index.toString()}
                                            showsVerticalScrollIndicator={false}
                                            onEndReached={loadMoreSearchHistory}
                                            onEndReachedThreshold={0.5}
                                            ListFooterComponent={
                                                loadingMore ? (
                                                    <View style={{ padding: 20 }}>
                                                        <ActivityIndicator size="small" color={colors.Brown} />
                                                    </View>
                                                ) : null
                                            }
                                            renderItem={({ item, index }) => (
                                                <View
                                                    style={{
                                                        marginTop: 8,
                                                        backgroundColor: "#fff",
                                                        padding: 12,
                                                        marginBottom: 12,
                                                        borderRadius: 14,
                                                        borderWidth: 1,
                                                        borderColor: "#E5E7EB",
                                                        shadowColor: "#000",
                                                        shadowOpacity: 0.06,
                                                        shadowRadius: 3,
                                                        elevation: 1,
                                                    }}
                                                >
                                                    <View style={{
                                                        flexDirection: 'row',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: 5
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 14,
                                                            fontFamily: 'Inter-SemiBold',
                                                            color: '#1F2937'
                                                        }}>
                                                            #{index + 1}
                                                        </Text>
                                                        <View style={{ flexDirection: 'row', gap: 5 }}>
                                                            <Ionicons name="car-outline" size={18} color="#374151" />
                                                            <Text style={{
                                                                fontFamily: 'Inter-Regular',
                                                                fontSize: 14,
                                                                color: '#374151'
                                                            }}>
                                                                {item.vehicle_registration_no || 'N/A'}
                                                            </Text>
                                                        </View>

                                                        <TouchableOpacity
                                                            onPress={() => openHistoryDetailModal(item)}
                                                            style={{
                                                                padding: 6,
                                                                borderRadius: 50,
                                                                backgroundColor: '#F3F4F6'
                                                            }}
                                                        >
                                                            <AntDesign name="infocirlceo" size={20} color="black" />
                                                        </TouchableOpacity>
                                                    </View>

                                                    {item.vehicle_chassis_no ? (
                                                        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                                            <Ionicons name="barcode-outline" size={18} color="#6B7280" />
                                                            <Text style={{
                                                                fontFamily: 'Inter-Regular',
                                                                fontSize: 13,
                                                                marginLeft: 6,
                                                                color: '#6B7280'
                                                            }}>
                                                                {item.vehicle_chassis_no}
                                                            </Text>
                                                        </View>
                                                    ) : null}

                                                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                                        <Ionicons name="time-outline" size={18} color="#6B7280" />
                                                        <Text
                                                            style={{
                                                                fontFamily: 'Inter-Regular',
                                                                fontSize: 13,
                                                                marginLeft: 6,
                                                                color: '#6B7280',
                                                            }}
                                                        >
                                                            {(() => {
                                                                if (!item.entry_date) return '----';

                                                                const dateObj = new Date(item.entry_date);
                                                                if (isNaN(dateObj)) return item.entry_date;

                                                                const d = String(dateObj.getDate()).padStart(2, '0');
                                                                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                                                const y = dateObj.getFullYear();

                                                                const hh = String(dateObj.getHours()).padStart(2, '0');
                                                                const mm = String(dateObj.getMinutes()).padStart(2, '0');
                                                                const ss = String(dateObj.getSeconds()).padStart(2, '0');

                                                                return `${d}-${m}-${y}   ${hh}:${mm}:${ss}`;
                                                            })()}
                                                        </Text>
                                                    </View>

                                                    <TouchableOpacity
                                                        onPress={() => openMap(item.vehicle_location, item.latitude, item.longitude)}
                                                        style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'center' }}
                                                    >
                                                        <Ionicons name="location-outline" size={18} color="#6B7280" />
                                                        <Text style={{
                                                            fontFamily: 'Inter-Regular',
                                                            fontSize: 13,
                                                            marginLeft: 6,
                                                            flex: 1,
                                                            color: (item.vehicle_location || (item.latitude && item.longitude)) ? '#2563EB' : '#6B7280',
                                                            textDecorationLine: (item.vehicle_location || (item.latitude && item.longitude)) ? 'underline' : 'none',
                                                        }}>
                                                            {item.vehicle_location || 'Unknown Location'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        />
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
                                            <Ionicons name="search-outline" size={50} color="#D1D5DB" />
                                            <Text style={{
                                                marginTop: 15,
                                                fontSize: 16,
                                                fontFamily: "Inter-Medium",
                                                color: "#6B7280",
                                                textAlign: "center",
                                            }}>
                                                No search history found
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {activeTab === "Schedule" && (
                                <View style={{ flex: 1 }}>
                                    {scheduleHistoryLoading ? (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                                            <ActivityIndicator size="large" color={colors.Brown} />
                                            <Text style={{ marginTop: 10, fontFamily: 'Inter-Regular', color: '#6B7280' }}>
                                                Loading schedule history...
                                            </Text>
                                        </View>
                                    ) : scheduleHistory.length > 0 ? (
                                        <FlatList
                                            data={displayedScheduleHistory}
                                            keyExtractor={(item, index) => index.toString()}
                                            showsVerticalScrollIndicator={false}
                                            onEndReached={loadMoreScheduleHistory}
                                            onEndReachedThreshold={0.5}
                                            renderItem={({ item, index }) => {
                                                const formatDMY = (dateStr) => {
                                                    if (!dateStr) return 'N/A';
                                                    const d = new Date(dateStr);
                                                    if (isNaN(d)) return 'N/A';
                                                    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1)
                                                        .toString().padStart(2, '0')}-${d.getFullYear()}`;
                                                };

                                                let daysBgColor = '#f0f0f0';
                                                const today = new Date();
                                                const endDate = item.schedule_staff_end_date ? new Date(item.schedule_staff_end_date) : null;
                                                if (endDate && today > endDate) {
                                                    daysBgColor = '#f0f0f0';
                                                }

                                                return (
                                                    <View
                                                        style={{
                                                            backgroundColor: 'white',
                                                            padding: 16,
                                                            marginBottom: 12,
                                                            borderRadius: 12,
                                                            borderWidth: 1,
                                                            borderColor: '#E5E7EB',
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <View style={{ flex: 1 }}>
                                                                <Text
                                                                    style={{
                                                                        fontFamily: 'Inter-Medium',
                                                                        fontSize: 13,
                                                                        color: '#374151',
                                                                    }}
                                                                >
                                                                    {formatDMY(item.schedule_staff_start_date)} — {formatDMY(item.schedule_staff_end_date)}
                                                                </Text>
                                                            </View>

                                                            <View
                                                                style={{
                                                                    backgroundColor: daysBgColor,
                                                                    paddingVertical: 4,
                                                                    paddingHorizontal: 10,
                                                                    borderRadius: 8,
                                                                }}
                                                            >
                                                                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 13, fontFamily: 'Inter-Regular' }}>
                                                                    {item.schedule_staff_total_day || '0'}
                                                                </Text>
                                                            </View>
                                                        </View>

                                                        <View
                                                            style={{
                                                                height: 1,
                                                                backgroundColor: '#E5E7EB',
                                                                marginVertical: 10,
                                                            }}
                                                        />

                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#374151' }}>
                                                                Payment:{' '}
                                                                <Text
                                                                    style={{
                                                                        fontFamily: 'Inter-Medium',
                                                                        fontSize: 13,
                                                                        color: item.schedule_staff_payment_status === 'Paid' ? '#059669' : '#DC2626',
                                                                    }}
                                                                >
                                                                    {item.schedule_staff_payment_status || 'N/A'}
                                                                </Text>
                                                            </Text>

                                                            <Text
                                                                style={{
                                                                    fontFamily: 'Inter-Medium',
                                                                    fontSize: 13,
                                                                    color: '#6B7280',
                                                                }}
                                                            >
                                                                Entry On: {formatDMY(item.schedule_staff_entry_date)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                );
                                            }}
                                        />
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                                            <Ionicons name="time-outline" size={50} color="#D1D5DB" />
                                            <Text style={{
                                                marginTop: 15,
                                                fontSize: 16,
                                                fontFamily: 'Inter-Medium',
                                                color: '#6B7280',
                                                textAlign: 'center',
                                            }}>
                                                No schedule history found
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={handleCloseModal}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    }}
                    onPress={handleCloseModal}
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
                        {staffdetail.staff_image_profile ? (
                            <Image
                                source={{ uri: encodeURI(staffdetail.staff_image_profile) }}
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
                                    borderRadius: 100,
                                    backgroundColor: '#ccc',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{
                                    color: '#fff',
                                    fontSize: 60,
                                    fontWeight: 'bold',
                                }}>
                                    {getInitials(staffdetail.staff_name)}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={historyDetailModalVisible}
                transparent={true}
                animationType="slide"
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    activeOpacity={1}
                    onPress={closeHistoryDetailModal}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            width: '85%',
                            paddingVertical: 5,
                        }}>
                        <TouchableOpacity
                            onPress={closeHistoryDetailModal}
                            style={{
                                marginRight: 5,
                                backgroundColor: 'white',
                                borderRadius: 50,
                            }}>
                            <Entypo name="cross" size={25} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 20,
                            borderRadius: 15,
                            width: '85%',
                            maxHeight: '100%',
                        }}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={e => e.stopPropagation()}>
                        {selectedHistoryDetail ? (
                            <>
                                <View
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: '#e4dedeff',
                                        borderWidth: 1, borderColor: 'black'
                                    }}>
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter-Medium',
                                            color: 'black',
                                            textAlign: 'center',
                                            textTransform: 'uppercase'
                                        }}>
                                        Search History Details
                                    </Text>
                                </View>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={{ marginBottom: 20 }}
                                >
                                    {[
                                        { label: 'Staff Name', value: selectedHistoryDetail.history_staff_name || '-----' },
                                        { label: 'Staff Mobile', value: selectedHistoryDetail.history_staff_mobile || '-----' },
                                        { label: 'Vehicle Agreement No', value: selectedHistoryDetail.vehicle_agreement_no || '-----' },
                                        { label: 'Vehicle Registration No', value: selectedHistoryDetail.vehicle_registration_no || '-----' },
                                        { label: 'Vehicle Chassis No', value: selectedHistoryDetail.vehicle_chassis_no || '-----' },
                                        { label: 'Vehicle Engine No', value: selectedHistoryDetail.vehicle_engine_no || '-----' },
                                        {
                                            label: 'Entry Date',
                                            value: selectedHistoryDetail.entry_date
                                                ? formatDateDMY(selectedHistoryDetail.entry_date)
                                                : '-----',
                                        },
                                    ].map((item, index) => (
                                        <View
                                            key={index}
                                            style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}
                                        >
                                            <View style={{
                                                width: '40%',
                                                borderLeftWidth: 1,
                                                borderBottomWidth: 1,
                                                borderColor: 'black',
                                                padding: 5,
                                            }}>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily: 'Inter-Regular',
                                                        color: 'black',
                                                        textAlign: 'left',
                                                        flexWrap: 'wrap',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                    {item.label}
                                                </Text>
                                            </View>

                                            <View style={{
                                                width: '60%',
                                                borderLeftWidth: 1,
                                                borderBottomWidth: 1,
                                                borderRightWidth: 1,
                                                borderColor: 'black',
                                                padding: 5,
                                            }}>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        color: 'black',
                                                        fontFamily: 'Inter-Bold',
                                                        textAlign: 'left',
                                                        flexWrap: 'wrap',
                                                    }}>
                                                    {item.value}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>

                                {selectedHistoryDetail.vehicle_location &&
                                    selectedHistoryDetail.vehicle_location.toLowerCase() !== 'unknown address' &&
                                    selectedHistoryDetail.latitude &&
                                    selectedHistoryDetail.longitude ? (
                                    <MapView
                                        style={{ width: '100%', height: 200, marginTop: 10 }}
                                        region={{
                                            latitude: parseFloat(selectedHistoryDetail.latitude),
                                            longitude: parseFloat(selectedHistoryDetail.longitude),
                                            latitudeDelta: 0.005,
                                            longitudeDelta: 0.005,
                                        }}
                                    >
                                        <Marker
                                            coordinate={{
                                                latitude: parseFloat(selectedHistoryDetail.latitude),
                                                longitude: parseFloat(selectedHistoryDetail.longitude),
                                            }}
                                            title={selectedHistoryDetail.vehicle_location}
                                        />
                                    </MapView>
                                ) : (
                                    <Text style={{ fontSize: 14, color: 'red', textAlign: 'center', marginTop: 10 }}>
                                        No Location Found
                                    </Text>
                                )}
                            </>
                        ) : null}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={webViewVisible} transparent>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)" }}>
                    <TouchableOpacity
                        style={{ padding: 10, alignSelf: "flex-end" }}
                        onPress={() => setWebViewVisible(false)}
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>

                    <WebView
                        source={{ uri: pdfUrl }}
                        style={{ flex: 1 }}
                        javaScriptEnabled
                        domStorageEnabled
                    />
                </View>
            </Modal>

            <Modal
                visible={statusModal}
                transparent
                animationType="fade"
                onRequestClose={() => setStatusModal(false)}
            >
                <TouchableOpacity style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20
                }}
                    activeOpacity={1}
                    onPress={() => setStatusModal(false)}>
                    <View style={{
                        width: '100%',
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 20
                    }}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={e => e.stopPropagation()}>
                        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15, color: 'black', fontFamily: 'Inter-Bold' }}>
                            Select Account Duration
                        </Text>

                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}
                            onPress={() => setSelectedOption('1day')}
                        >
                            <View style={{
                                height: 20,
                                width: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: '#333',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 10
                            }}>
                                {selectedOption === '1day' && (
                                    <View style={{
                                        height: 10,
                                        width: 10,
                                        borderRadius: 5,
                                        backgroundColor: '#333'
                                    }} />
                                )}
                            </View>

                            <Text style={{ fontSize: 15, color: 'black', fontFamily: 'Inter-Regular' }}>1 Day (Today → Tomorrow)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}
                            onPress={() => setSelectedOption('1month')}
                        >
                            <View style={{
                                height: 20,
                                width: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: '#333',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 10
                            }}>
                                {selectedOption === '1month' && (
                                    <View style={{
                                        height: 10,
                                        width: 10,
                                        borderRadius: 5,
                                        backgroundColor: '#333'
                                    }} />
                                )}
                            </View>

                            <Text style={{ fontSize: 15, color: 'black', fontFamily: 'Inter-Regular' }}>1 Month (Full Month)</Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setStatusModal(false)}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#f2f2f2',
                                    padding: 12,
                                    borderRadius: 10,
                                    marginLeft: 5
                                }}
                            >
                                <Text style={{ textAlign: 'center', color: 'red', fontWeight: '600', fontFamily: 'Inter-Regular' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    const today = new Date();
                                    let startDate = '';
                                    let endDate = '';

                                    if (selectedOption === '1day') {
                                        let tomorrow = new Date();
                                        tomorrow.setDate(today.getDate() + 1);

                                        startDate = today.toISOString().split('T')[0];
                                        endDate = tomorrow.toISOString().split('T')[0];
                                    }

                                    if (selectedOption === '1month') {
                                        const y = today.getFullYear();
                                        const m = today.getMonth();
                                        const d = today.getDate();

                                        startDate = today.toISOString().split('T')[0];

                                        let nextMonth = new Date(y, m + 1, d);

                                        if (nextMonth.getDate() !== d) {
                                            nextMonth = new Date(y, m + 2, 0);
                                        }

                                        endDate = nextMonth.toISOString().split('T')[0];
                                    }

                                    handleAddSchedule(staffdetail.staff_id, startDate, endDate);
                                    setStatusModal(false);
                                }}
                                style={{
                                    flex: 1,
                                    backgroundColor: colors.Brown,
                                    padding: 12,
                                    borderRadius: 10,
                                    marginRight: 5
                                }}
                            >
                                <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '600', fontFamily: 'Inter-Regular' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={isModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={handleCloseModalthree}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    }}
                    activeOpacity={1}
                    onPress={handleCloseModalthree}
                >
                    <View
                        style={{
                            position: 'absolute',
                            top: modalPosition.top,
                            left: modalPosition.left,
                            backgroundColor: 'white',
                            padding: 15,
                            borderRadius: 12,
                            width: 220,
                            elevation: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.25,
                            shadowRadius: 5,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 17,
                                fontFamily: 'Inter-SemiBold',
                                marginBottom: 12,
                                color: 'black',
                            }}
                        >
                            Select Action
                        </Text>

                        {/* View I-Card - now opens modal */}
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
                                setIcardTypeModalVisible(true);
                                handleCloseModalthree();
                            }}
                        >
                            <Ionicons name="eye-outline" size={20} color={colors.Brown} />
                            <Text style={{
                                fontSize: 15,
                                fontFamily: 'Inter-Regular',
                                color: colors.Brown,
                            }}>
                                View I-Card
                            </Text>
                        </TouchableOpacity>

                        {/* Manage Finance - conditional as before */}
                        {(userType === 'SuperAdmin' ||
                            (userType === 'SubAdmin' && permissions?.staff?.financelist) ||
                            (userType === 'main' && permissions?.staff?.financelist)
                        ) && (
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
                                        navigation.navigate('FinanceList', {
                                            staff_id: userData.staff_id,
                                            staff_name: userData.staff_name,
                                        });
                                        handleCloseModalthree();
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
                            )}

                        {/* NEW: Manage Permission - only for admin */}
                        {(userType !== 'SubAdmin' && userType !== 'main' && userData.staff_type !== 'normal') && (
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
                                    navigation.navigate('PermissionScreen', { staff_id: userData.staff_id, staff_name: userData.staff_name });
                                    handleCloseModalthree();
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
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 10,
                                borderBottomWidth: 1,
                                borderColor: '#eee',
                                gap: 12,
                            }}
                            onPress={handleEdit}
                        >
                            <Feather name="edit-3" size={20} color="#3B82F6" />
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'Inter-Regular',
                                    color: '#3B82F6',
                                }}
                            >
                                Update Staff
                            </Text>
                        </TouchableOpacity>

                        {/* Delete Staff */}
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
                                handleDelete(userData.staff_id);
                                handleCloseModalthree();
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#DC2626" />
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'Inter-Regular',
                                    color: '#DC2626',
                                }}
                            >
                                Delete Staff
                            </Text>
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
                                setDeviceId(staffdetail.native_device_id || '---');
                                setResetModal(true);
                                handleCloseModalthree();
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

            <Modal
                animationType="fade"
                transparent={true}
                visible={ConfrimationModal}
                onRequestClose={closeconfirmodal}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={closeconfirmodal}
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
                            fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'black', fontFamily: 'Inter-Medium'
                        }}>
                            Confirm Delete
                        </Text>
                        <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
                            Are you sure you want to delete the staff ?
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
                                onPress={closeconfirmodal}
                            >
                                <Text
                                    style={{
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
                                    DeleteStaffApi(userData.staff_id);
                                    closeconfirmodal();
                                }}
                            >
                                <Text
                                    style={{
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
                visible={docModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDocModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.7)",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 20,
                    }}
                    activeOpacity={1}
                    onPress={() => setDocModalVisible(false)}
                >
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View
                            style={{
                                width: "100%",
                                alignItems: "center",
                                position: "relative",
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "flex-end",
                                    width: "105%",
                                    paddingVertical: 5,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => setDocModalVisible(false)}
                                    style={{
                                        marginRight: 5,
                                        backgroundColor: "white",
                                        borderRadius: 50,
                                        padding: 4,
                                    }}
                                >
                                    <Entypo name="cross" size={25} color="black" />
                                </TouchableOpacity>
                            </View>

                            <View style={{ width: "100%", height: "75%", position: "relative" }}>
                                <Image
                                    source={{ uri: selectedDoc ? encodeURI(selectedDoc.url) : null }}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: 12,
                                        backgroundColor: "#E5E7EB",
                                        resizeMode: "contain",
                                    }}
                                />

                                <TouchableOpacity
                                    onPress={downloadImage}
                                    style={{
                                        position: "absolute",
                                        bottom: 15,
                                        right: 15,
                                        backgroundColor: "rgba(255,255,255,0.9)",
                                        padding: 10,
                                        borderRadius: 50,
                                        elevation: 5,
                                    }}
                                >
                                    <Ionicons name="download-outline" size={28} color="#111" />
                                </TouchableOpacity>
                            </View>

                            <Text
                                style={{
                                    marginTop: 15,
                                    color: "#fff",
                                    fontSize: 18,
                                    fontFamily: "Inter-SemiBold",
                                    textAlign: "center",
                                }}
                            >
                                {selectedDoc?.label}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            {/* Reset Device Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={ResetModal}
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

            {/* NEW MODAL FOR ICARD TYPE SELECTION */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={icardTypeModalVisible}
                onRequestClose={() => setIcardTypeModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={() => setIcardTypeModalVisible(false)}
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
                            Select I-Card Type
                        </Text>

                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderColor: '#eee',
                                width: '100%',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                            onPress={() => {
                                setIcardTypeModalVisible(false);
                                navigation.navigate("WebviewScreen", { type: "mjs", userId: userData.staff_id, userData: staffdetail });
                            }}
                        >
                            <Ionicons name="card-outline" size={22} color={colors.Brown} />
                            <Text style={{ fontSize: 16, fontFamily: 'Inter-Regular', color: colors.Brown }}>
                                Maa Jagdamba Service
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                width: '100%',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                            onPress={() => {
                                setIcardTypeModalVisible(false);
                                navigation.navigate("WebviewScreen", { type: "kanha", userId: userData.staff_id, userData: staffdetail });
                            }}
                        >
                            <Ionicons name="card-outline" size={22} color={colors.Brown} />
                            <Text style={{ fontSize: 16, fontFamily: 'Inter-Regular', color: colors.Brown }}>
                                Kanha Enterprise
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                marginTop: 15,
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                backgroundColor: '#ddd',
                                borderRadius: 5,
                            }}
                            onPress={() => setIcardTypeModalVisible(false)}
                        >
                            <Text style={{ fontSize: 14, fontFamily: 'Inter-Regular', color: 'black' }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

export default informationScreen

const styles = StyleSheet.create({})