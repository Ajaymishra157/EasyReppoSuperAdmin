import { Image, StyleSheet, Text, TouchableOpacity, View, TextInput, Switch, Modal, ActivityIndicator, ToastAndroid, Alert, PermissionsAndroid, Platform, Linking } from 'react-native'
import React, { useEffect, useState } from 'react'
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



const informationScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userData, setStaffList } = route.params || {};




    const initialStatus = userData.staff_status?.toLowerCase() === 'active';
    const [isEnabled, setIsEnabled] = useState(initialStatus);

    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    const User = require('../assets/images/user.png');
    const [name, setName] = useState(userData.staff_image || '');

    const [mobile, setMobile] = useState(userData.staff_mobile || '');
    const [email, setEmail] = useState(userData.staff_email || '');
    const [modalVisible, setModalVisible] = useState(false);
    const [userType, setUsertype] = useState(null);
    const [userId, setUserId] = useState('');


    const [downloadImage, setDownloadImage] = useState(false);

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


    // // ✅ Permission Request (Android)
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
            console.log("User ID Found:", userId);
            setUserId(userId);



        };

        fetchIcardUrl();
    }, []);






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
                path: downloadPath, // direct save to Downloads
            }).fetch('GET', fileUrl);

            // 👉 Android ke MediaScanner ko bolo taaki "Files" app me dikhe
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
                // Reset permissions first
                const permData = {};

                result.payload.forEach(item => {
                    const menuName = item.menu_name.toLowerCase();
                    const permsArray = item.menu_permission
                        .split(',')
                        .map(p => p.trim().toLowerCase());

                    const permsObject = {};
                    // Only include what's present in the API
                    permsArray.forEach(perm => {
                        permsObject[perm] = true;
                    });

                    permData[menuName] = permsObject;
                });

                // ✅ Now set new clean permissions
                setPermissions(permData) // only from API, no default true
            } else {
                // setPermissions({});
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
        [userData.staff_id]: userData.staff_location === 'Yes',
    });

    const [isAccountEnabled, setIsAccountEnabled] = useState({
        [userData.staff_id]: userData.staff_status === 'Active',
    });

    const [loadingToggles, setLoadingToggles] = useState({});
    const [AccountToggles, setAccountToggles] = useState({});

    handleImagePress = () => {
        setModalVisible(true); // Open the modal

    };
    const handleCloseModal = () => {
        setModalVisible(false); // Close the modal
    };

    if (!userData) {
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
                // No need to update isLocationEnabled here, optimistic update done already

            } else {
                ToastAndroid.show("Failed Staff Account Status", ToastAndroid.SHORT);
                // Rollback the optimistic update
                setIsAccountEnabled(prev => ({
                    ...prev,
                    [staff_id]: !prev[staff_id],
                }));
            }
        } catch (error) {
            ToastAndroid.show("Error updating Account Status", ToastAndroid.SHORT);

        } finally {
            // Hide the loading spinner no matter what
            setAccountToggles(prev => ({
                ...prev,
                [staff_id]: false,
            }));
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
                // No need to update isLocationEnabled here, optimistic update done already
            } else {
                ToastAndroid.show("Failed to update Location Access", ToastAndroid.SHORT);
                // Revert UI change on failure
                setIsLocationEnabled(prev => ({
                    ...prev,
                    [staff_id]: !prev[staff_id], // revert toggle
                }));
            }
        } catch (error) {
            ToastAndroid.show("Error updating Location Access", ToastAndroid.SHORT);
            // Revert UI change on error
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

                    confirmLogout(); // Trigger logout
                } else {

                }
            } else {
                // ToastAndroid.show(result.message || 'Failed to logout staff', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.log('Logout error:', error.message);
            // ToastAndroid.show('Error logging  out out staff', ToastAndroid.SHORT);
        }
    };


    useFocusEffect(
        React.useCallback(() => {
            AgencyStaffLogout(navigation, confirmLogout);
        }, [])
    );


    const confirmLogout = async () => {
        await AsyncStorage.removeItem('id'); // User data clear karega
        await AsyncStorage.removeItem('selected_agency'); // User data clear karega
        navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }], // LoginScreen par redirect karega
        });

    };



    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            {/* <Header
          title="Rajputana Agency"
          // onMenuPress={() => navigation.openDrawer()}
        /> */}
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
                    onPress={() => {
                        navigation.goBack();
                    }}>
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
                {
                    (
                        userType === 'SuperAdmin' ||
                        (userType === 'SubAdmin' && permissions?.staff?.icard) ||
                        (userType === 'main' && permissions?.staff?.icard)
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

                            <TouchableOpacity onPress={() => setDownloadImage(true)}>
                                <AntDesign name="download" size={25} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}
            </View>
            <View
                style={{
                    width: '100%',
                    height: 70,
                    backgroundColor: '#f5f7fa',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingTop: 20,
                    backgroundColor: colors.Brown

                }}
            >


            </View>
            <View style={{
                width: '100%', position: 'absolute',
                top: 60, justifyContent: 'center', alignItems: 'center'
            }}>
                <TouchableOpacity
                    onPress={handleImagePress}
                >
                    <Image
                        source={
                            userData.staff_image
                                ? { uri: `${IMAGE_BASE_URL}${encodeURI(userData.staff_image)}` }
                                : User
                        }
                        style={{

                            width: 120,
                            height: 120,
                            borderRadius: 55,
                            backgroundColor: '#fff',
                            borderRadius: 100,
                            borderWidth: 4,
                            borderColor: 'white',
                        }}
                    />
                </TouchableOpacity>

                <TouchableOpacity

                    style={{
                        marginTop: 10,
                        paddingVertical: 4,
                        paddingHorizontal: 10,
                        borderRadius: 10,
                        backgroundColor: 'white',

                    }}
                >
                    <Text
                        style={{
                            color: 'black',
                            fontSize: 12,
                            fontFamily: 'Inter-Bold',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase'
                        }}
                    >
                        {userData.staff_name}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity

                    style={{
                        marginTop: 5,
                        paddingVertical: 4,
                        paddingHorizontal: 10,
                        borderRadius: 10,
                        backgroundColor: 'white',

                    }}
                >
                    <Text
                        style={{
                            color: 'black',
                            fontSize: 12,
                            fontFamily: 'Inter-Bold',
                            letterSpacing: 0.5,
                        }}
                    >
                        {mobile}
                    </Text>
                </TouchableOpacity>


            </View>
            <View style={{
                backgroundColor: 'white', width: '100%', position: 'absolute', padding: 20,
                top: 250,

            }}>
                <View style={{
                    borderBottomWidth: 1,
                    borderColor: '#EEE',
                    borderWidth: 1,
                    borderColor: 'black',
                    borderRadius: 15,
                    backgroundColor: '#e7fefb'
                }}>
                    {/* Email */}
                    <TouchableOpacity style={{
                        paddingVertical: 10,
                        borderTopLeftRadius: 15,
                        borderTopRightRadius: 15,

                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#e7fefb'
                    }}
                        activeOpacity={1}>
                        <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="mail-outline" size={20} color='#60a7ff' />
                        </View>
                        <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                            Email
                        </Text>
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 5 }}>
                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>{userData.staff_email || '----'}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Status with Toggle */}
                    <View style={{
                        paddingVertical: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#e7fefb',

                    }}>
                        <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="shield-checkmark-outline" size={20} color='#1a73e8' />
                        </View>
                        <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                            Account Status
                        </Text>
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 5, }}>

                            {
                                AccountToggles[userData.staff_id] ? (
                                    <ActivityIndicator size="small" color={colors.Brown} />
                                ) : (
                                    <Switch
                                        trackColor={{ false: "#f54949", true: "#1cd181" }}
                                        thumbColor="#ebecee"
                                        ios_backgroundColor="#3e3e3e"
                                        disabled={!!AccountToggles[userData.staff_id] || !hasAccountStatusPermission}
                                        onValueChange={value => {
                                            const staffId = userData.staff_id;

                                            // Show loading
                                            setAccountToggles(prev => ({
                                                ...prev,
                                                [staffId]: true,
                                            }));

                                            // Optimistic UI update
                                            setIsAccountEnabled(prev => ({
                                                ...prev,
                                                [staffId]: value,
                                            }));

                                            // API call
                                            StaffAccountStatus(staffId, value ? 'On' : 'Off');
                                        }}


                                        value={
                                            isAccountEnabled[userData.staff_id] !== undefined
                                                ? isAccountEnabled[userData.staff_id]
                                                : userData.staff_status === 'Active'
                                        }



                                    />

                                )
                            }

                        </View>
                    </View>

                    {/* Status with Toggle */}
                    <View style={{
                        paddingVertical: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#e7fefb'
                    }}>
                        <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="wifi-outline" size={20} color='#FF5733' />
                        </View>
                        <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                            Internet Status
                        </Text>
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 5, }}>

                            {
                                loadingToggles[userData.staff_id] ? (
                                    <ActivityIndicator size="small" color={colors.Brown} />
                                ) : (
                                    <Switch
                                        trackColor={{ false: "#f54949", true: "#1cd181" }}
                                        thumbColor="#ebecee"
                                        ios_backgroundColor="#3e3e3e"
                                        disabled={!!loadingToggles[userData.staff_id] || !hasInternetStatusPermission}
                                        onValueChange={value => {
                                            const staffId = userData.staff_id;

                                            // Show loading
                                            setLoadingToggles(prev => ({
                                                ...prev,
                                                [staffId]: true,
                                            }));

                                            // Optimistic UI update
                                            setIsLocationEnabled(prev => ({
                                                ...prev,
                                                [staffId]: value,
                                            }));

                                            // API call
                                            StaffInternetAccess(staffId, value ? 'Yes' : 'No');
                                        }}


                                        value={
                                            isLocationEnabled[userData.staff_id] !== undefined
                                                ? isLocationEnabled[userData.staff_id]
                                                : userData.staff_location === 'Yes'
                                        }



                                    />

                                )
                            }

                        </View>
                    </View>
                    <View style={{
                        paddingVertical: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#e7fefb',
                        width: '100%'
                    }}>
                        <View style={{ width: '50%', flexDirection: 'row', gap: 5, }}>
                            <View style={{ width: '15%', alignItems: 'center', marginLeft: 5 }}>
                                <Ionicons name="person-outline" size={20} color="#1abc9c" />


                            </View>
                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                                Reference Name
                            </Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 5, width: '50%', }}>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 5 }}>
                                <Text style={{ color: 'black', fontFamily: 'Inter-Regular', textTransform: 'uppercase' }}>{userData.staff_reference || '----'}</Text>
                            </View>


                        </View>
                    </View>


                    {/* Address */}
                    <TouchableOpacity style={{
                        paddingVertical: 10,

                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#e7fefb',
                        width: '100%'
                    }}
                        activeOpacity={1}>
                        <View style={{ width: '40%', flexDirection: 'row', gap: 10, }}>
                            <View style={{ width: '15%', alignItems: 'center', marginLeft: 5 }}>
                                <Ionicons name="location-outline" size={20} color='#6a0572' />
                            </View>

                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                                Address
                            </Text>
                        </View>

                        <View style={{
                            flex: 1,
                            alignItems: 'flex-end',
                            paddingRight: 5,
                            width: '60%'
                        }}>
                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>{userData.staff_address || '----'}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={{
                        paddingVertical: 10,
                        borderBottomLeftRadius: 15,
                        borderBottomRightRadius: 15,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#e7fefb'
                    }}
                        activeOpacity={1}>
                        <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="calendar-outline" size={20} color='#ffb347' />
                        </View>

                        <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                            Entry Date
                        </Text>

                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 5, }}>
                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>{userData.staff_entry_date || '----'}</Text>
                        </View>
                    </TouchableOpacity>




                </View>

                {
                    (
                        userType === 'SuperAdmin' ||
                        (userType === 'SubAdmin' && permissions?.staff?.financelist) ||
                        (userType === 'main' && permissions?.staff?.financelist)
                    ) && (
                        <TouchableOpacity style={{
                            paddingVertical: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'white',
                            borderWidth: 1,
                            borderRadius: 10,
                            marginTop: 30
                        }}
                            activeOpacity={1}
                            onPress={() => {
                                navigation.navigate('FinanceList', {
                                    staff_id: userData.staff_id, // ✅ Passing staff_id
                                    staff_name: userData.staff_name,
                                });
                            }}
                        >
                            <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                                <Feather name="settings" size={20} color="#ffb347" />


                            </View>

                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                                Manage Finance
                            </Text>

                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 5, }}>
                                <Ionicons name="arrow-forward" color="black" size={22} />
                            </View>
                        </TouchableOpacity>
                    )}

                {userType !== 'SubAdmin' && userType !== 'main' && userData.staff_type != 'normal' && (
                    <TouchableOpacity style={{
                        paddingVertical: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        borderWidth: 1,
                        borderRadius: 10,
                        marginTop: 30
                    }}
                        activeOpacity={1}
                        onPress={() => {
                            navigation.navigate('PermissionScreen', {
                                staff_id: userData.staff_id, // ✅ Passing staff_id
                                staff_name: userData.staff_name,
                            });
                        }}
                    >
                        <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="shield-checkmark-outline" size={22} color="#ffb347" />



                        </View>

                        <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                            Manage Permission
                        </Text>

                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 5, }}>
                            <Ionicons name="arrow-forward" color="black" size={22} />
                        </View>
                    </TouchableOpacity>
                )}
            </View>



            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={handleCloseModal}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    }}
                    onPress={handleCloseModal}
                    activeOpacity={1}>
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
                        onTouchEnd={e => e.stopPropagation()}>
                        <Image
                            source={
                                userData.staff_image
                                    ? { uri: `${IMAGE_BASE_URL}${encodeURI(userData.staff_image)}` }
                                    : User
                            }
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: 150,
                                resizeMode: 'stretch', // Make sure the image fits in the modal
                            }}
                        />
                        {/* <TouchableOpacity
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      backgroundColor: '#007BFF',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 10,
                    }}
                    onPress={handleCloseModal}>
                    <Text style={{color: 'white', fontWeight: 'bold'}}>OK</Text>
                  </TouchableOpacity> */}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={downloadImage}
                transparent
                animationType="fade"
                onRequestClose={() => setDownloadImage(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "flex-start",
                        alignItems: "center",
                    }}
                    onPress={() => setDownloadImage(false)}
                    activeOpacity={1}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            width: '85%',
                            paddingVertical: 5,
                            marginTop: 20
                        }}>
                        <TouchableOpacity
                            onPress={() => setDownloadImage(false)}
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
                            backgroundColor: "white",


                            width: "80%",
                            alignItems: "center",
                        }}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={e => e.stopPropagation()}
                    >


                        {/* Option 1 */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                paddingVertical: 12,
                                paddingHorizontal: 20,
                                borderBottomWidth: 1, borderColor: '#dddadaff',


                                width: "100%",
                                alignItems: "center",
                            }}
                            // onPress={() => {
                            //     setDownloadImage(false);
                            //     const url = `https://admin.easyreppo.in/api-1.0/icard.php?user_id=${userId}&type=mjs`;
                            //     setPdfUrl(url); // WebView ke liye
                            //     setWebViewVisible(true);
                            //     handleDownload("mjs"); // Direct download bhi ho jaye
                            // }}
                            onPress={() => {
                                setDownloadImage(false);
                                navigation.navigate("WebviewScreen", { type: "mjs", userId: userData.staff_id, userData: userData });
                            }}
                        // onPress={() => {
                        //     setDownloadImage(false);
                        //     const url = `https://admin.easyreppo.in/new_api_dev/icard_pdf.php?user_id=${userId}&type=mjs`;
                        //     Linking.openURL(url); // ✅ Chrome ya default browser me open hoga
                        // }}
                        >
                            <Text style={{ color: "black", fontSize: 16, fontFamily: 'Inter-Regular', textTransform: 'uppercase' }}>
                                Maa Jagdamba Service
                            </Text>
                        </TouchableOpacity>

                        {/* Option 2 */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                paddingVertical: 12,
                                paddingHorizontal: 20,

                                width: "100%",
                                alignItems: "center",
                            }}
                            // onPress={() => {
                            //     setDownloadImage(false);
                            //     const url = `https://admin.easyreppo.in/api-1.0/icard.php?user_id=${userId}&type=kanha`;
                            //     setPdfUrl(url);
                            //     setWebViewVisible(true);
                            //     handleDownload("kanha");
                            // }}
                            onPress={() => {
                                setDownloadImage(false);
                                navigation.navigate("WebviewScreen", { type: "kanha", userId: userData.staff_id });
                            }}
                        // onPress={() => {
                        //     setDownloadImage(false);
                        //     const url = `https://admin.easyreppo.in/new_api_dev/icard_pdf.php?user_id=${userId}&type=kanha`;
                        //     Linking.openURL(url); // ✅ Chrome ya default browser me open hoga
                        // }}
                        >
                            <Text style={{ color: "black", fontSize: 16, fontSize: 16, fontFamily: 'Inter-Regular', textTransform: 'uppercase' }}>
                                Kanha Enterprise
                            </Text>
                        </TouchableOpacity>

                        {/* Cancel */}
                        {/* <TouchableOpacity
                            style={{
                                marginTop: 20,
                                padding: 10,
                            }}
                            onPress={() => setDownloadImage(false)}
                        >
                            <Text style={{ fontSize: 16, color: "red" }}>Cancel</Text>
                        </TouchableOpacity> */}
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




        </View>
    )
}

export default informationScreen

const styles = StyleSheet.create({})