import React, { useCallback, useEffect, useState } from 'react';
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
    Keyboard
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


    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [originalStaffData, setoriginalStaffData] = useState([]);
    const [AdminCount, setAdminCount] = useState('');
    const [FieldCount, setFieldCount] = useState('');
    const [text, setText] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [userType, setUsertype] = useState(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [agencyIdSend, setAgencyIdSend] = useState('');

    const [isModalVisible, setIsModalVisible] = useState(false);

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

    const [permissions, setPermissions] = useState({});



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
                // setoriginalStaffData(updated);
                navigation.goBack();
            } else {
                ToastAndroid.show(result.message || 'Failed to delete agency', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.error('Delete error:', error);
            ToastAndroid.show('Error deleting agency', ToastAndroid.SHORT);
        }
    };



    useFocusEffect(
        React.useCallback(() => {
            let usertype = null;

            const fetchUsertype = async () => {
                usertype = await AsyncStorage.getItem('user_type');
                const agency = await AsyncStorage.getItem('selected_agency');
                setUsertype(usertype);
                // setIsAgencyMode(!!agency);
            };

            fetchUsertype();
        }, []),
    );



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

    const fetchStaff = async () => {
        const storedAgencyId = await AsyncStorage.getItem('rent_agency_id');
        try {
            const response = await fetch(ENDPOINTS.List_Staff_Subadmin, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rent_agency_id: agencyId }),
            });

            const result = await response.json();
            if (result.code === 200 && Array.isArray(result.payload)) {
                setStaffList(result.payload);
                setAdminCount(result.count_admin);
                setFieldCount(result.count_filed);
                setoriginalStaffData(result.payload);

            } else {
                setStaffList([]);

            }
        } catch (error) {
            console.log('Fetch error:', error.message);
        } finally {
            setLoading(false);
        }
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

    //     useCallback(() => {
    //         fetchStaff();
    //     }, [agencyId])
    // )

    useFocusEffect(
        useCallback(() => {

            if (text != '') {
                handleTextChange(text);
            } else {
                fetchStaff();
            }
        }, [text, agencyId]), // Empty array ensures this is called only when the screen is focused
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

    const renderItem = ({ item }) => (
        <TouchableOpacity
            key={item.staff_id}
            style={{
                flexDirection: 'row',
                backgroundColor: '#fff',
                padding: 10,
                marginBottom: 7,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#ddd',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}

            activeOpacity={1}

            onPress={() =>
                navigation.navigate('SubAdminInformation', {
                    userData: item,

                })
            }
        >
            <View style={{ flexDirection: 'row', width: '50%' }}>
                <View style={{ width: '30%', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <TouchableOpacity
                        onPress={() => {
                            const imgSrc = item.staff_image_profile
                                ? { uri: `${IMAGE_BASE_URL}${encodeURI(item.staff_image_profile)}` }
                                : account;
                            setSelectedImage(imgSrc);
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
                        }}
                    >
                        <Image
                            source={
                                item.staff_image_profile
                                    ? { uri: `${IMAGE_BASE_URL}${encodeURI(item.staff_image_profile)}` }
                                    : account
                            }
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                </View>

                <View style={{ width: '70%', justifyContent: 'center', paddingLeft: 5 }}>
                    <Text style={{
                        fontSize: 12,
                        color: 'black',
                        fontFamily: 'Inter-Regular',
                        textTransform: 'uppercase',
                    }}>
                        {item.staff_name || '----'}
                    </Text>

                    <Text style={{
                        fontSize: 12,
                        color: 'black',
                        fontFamily: 'Inter-Regular',
                    }}>
                        {item.staff_mobile || '----'}
                    </Text>

                    <Text style={{
                        fontSize: 12,
                        color: 'black',
                        fontFamily: 'Inter-Regular',
                    }}>
                        {item.staff_type === 'normal' ? 'User' : item.staff_type || '----'}
                    </Text>
                </View>
            </View>

            <View style={{ width: '50%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                <View style={{ width: '60%', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            paddingVertical: 5,
                            paddingHorizontal: 10,
                            borderRadius: 5,
                            borderWidth: 1,
                            borderColor: colors.Brown,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 5
                        }}
                        onPress={() => OpenResetModal(item)}
                    >
                        <Text style={{ color: colors.Brown, fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter-Medium' }}>
                            Reset
                        </Text>
                        <Image source={phone} style={{ width: 21, height: 21, tintColor: colors.Brown }} />
                    </TouchableOpacity>

                </View>

                <TouchableOpacity onPress={() => openActionModal(item)} style={{ width: '20%', alignItems: 'flex-start', paddingLeft: 10 }}>
                    <Entypo name="dots-three-vertical" size={18} color="black" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

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
            {staffList.length > 0 && (
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
            )}

            {/* Body */}
            {loading ? (
                <View style={{ padding: 10 }}>
                    {[...Array(8)].map((_, index) => (
                        <StaffShimmer key={index} />
                    ))}
                </View>
            ) : staffList.length === 0 ? (

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Image
                        source={Staff}  // Staff icon image you already imported at top
                        style={{ width: 80, height: 80, marginBottom: 15, }}
                        resizeMode="contain"
                    />
                    <Text style={{ fontSize: 18, color: 'black', fontFamily: 'Inter-Regular' }}>
                        No Staff Found
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={staffList}
                    keyExtractor={(item) => item.staff_id.toString()}
                    contentContainerStyle={{ padding: 15, paddingBottom: keyboardVisible ? 340 : 80, }}
                    renderItem={renderItem}
                    keyboardShouldPersistTaps='handled'
                    refreshing={refreshing}                // ✅ Pull-to-refresh loader
                    onRefresh={handleRefresh}
                />
            )}

            <View
                style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 30,
                    width: 60, // Set the width and height equal for a perfect circle
                    height: 60, // Set height equal to the width
                    zIndex: 1,
                }}>
                <TouchableOpacity
                    style={{
                        backgroundColor: colors.Brown,
                        borderRadius: 30, // Set borderRadius to half of width/height for a circle
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 7,
                    }}
                    onPress={() => {
                        navigation.navigate('AddAgencyStaff', { agencyId });
                    }}>
                    <AntDesign name="plus" color="white" size={18} />
                </TouchableOpacity>
            </View>

            {/* Image Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
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
                        onStartShouldSetResponder={() => true}  // This prevents the modal from closing when touching inside this view
                        onTouchEnd={e => e.stopPropagation()}
                    >
                        <Image
                            source={selectedImage}
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: 150,
                                resizeMode: 'stretch',
                            }}
                        />
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

        </View>
    );
};

export default AgencyStaff;


