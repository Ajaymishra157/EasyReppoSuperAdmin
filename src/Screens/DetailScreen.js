import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import CheckBox from '@react-native-community/checkbox';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../CommonFiles/Constant';
import { openDB } from '../utils/db';
import Toast from 'react-native-toast-message';
// import Geolocation from 'react-native-geolocation-service';



const DetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { vehicleData, currentLat, currentLong, locationName } = route.params || {};
    console.log("ye hai sare data", currentLat, currentLong, locationName);

    const whatsapp = require('../assets/images/whatsapp.png');
    const Call = require('../assets/images/Call.png');
    const Copy = require('../assets/images/copy.png');
    const Delete = require('../assets/images/delete.png');
    const [DetailModal, setDetailModal] = useState(false);
    const [modalType, setModalType] = useState('copy');  // "copy" ya "whatsapp"
    const [userType, setUsertype] = useState(null);

    const [vehicleId, setVehicleId] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const [staffName, setStaffName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');


    const [permissions, setPermissions] = useState({});


    const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
    const [duplicateStaff, setDuplicateStaff] = useState(null);



    const fetchPermissions = async () => {

        try {
            const staff_id = await AsyncStorage.getItem('staff_id');
            if (!staff_id) {
                console.warn('No staff_id found');
                setLoading(false);
                return;
            }
            const response = await fetch(ENDPOINTS.List_Staff_Permission, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staff_id }),
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
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }

    }

    useEffect(() => {
        fetchPermissions();
    }, []);


    const confirmDelete = (vehicleId) => {
        setVehicleId(vehicleId);
        setShowDeleteModal(true);

    };





    const deleteVehicle = async (vehicleId) => {
        try {
            const response = await fetch(ENDPOINTS.delete_vehicle_details, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_vehicle_id: vehicleId }),
            });

            const result = await response.json();

            if (result.code == 200) {
                Toast.show({
                    type: 'success',
                    text1: 'Vehicle deleted successfully!',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
                // ✅ Delete from local SQLite database
                try {
                    const db = await openDB();
                    await db.executeSql(
                        'DELETE FROM full_vehicle_detail WHERE full_vehicle_id = ?',
                        [vehicleId]
                    );
                    console.log('Vehicle deleted from local database');
                } catch (localDbError) {
                    console.error('Error deleting from local database:', localDbError);
                }

                // Call callback passed from FirstScreen
                if (route.params?.onDelete) {
                    route.params.onDelete(vehicleId);
                }
                // ⏳ Delay navigation
                setTimeout(() => {
                    navigation.goBack();
                }, 500);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to delete vehicle',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            console.error('Delete vehicle error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error deleting vehicle',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            });
        }
    };


    const AgencyStaffLogout = async (navigation, confirmLogout) => {
        try {
            const staffId = await AsyncStorage.getItem('staff_id');

            if (!staffId) {
                Toast.show({
                    type: 'error',
                    text1: 'No staff ID found',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
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
                // Toast.show({
                //     type: 'error',
                //     text1: result.message || 'Failed to logout staff',
                //     position: 'bottom',
                //     bottomOffset: 60,
                //     visibilityTime: 2000,
                // });
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
        await AsyncStorage.removeItem('id'); // User data clear karega
        await AsyncStorage.removeItem('selected_agency'); // User data clear karega
        navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }], // LoginScreen par redirect karega
        });

    };


    useFocusEffect(
        React.useCallback(() => {
            let usertype = null;

            const fetchUsertype = async () => {
                usertype = await AsyncStorage.getItem('user_type');
                setUsertype(usertype);
            };

            fetchUsertype();
        }, []),
    );


    useEffect(() => {

        sendLocationDataApi();

    }, []);



    const allowedFieldsForNormal = [
        { label: 'RC NUMBER', key: 'vehicle_registration_no' },
        { label: 'ENGINE NUMBER', key: 'vehicle_engine_no' },
        { label: 'CHASSIS NUMBER', key: 'vehicle_chassis_no' },
        { label: 'FINANCE NAME', key: 'vehicle_finance_name' },
        { label: 'PRODUCT', key: 'vehicle_product' },
        { label: 'CUSTOMER NAME', key: 'vehicle_customer_name' },
        { label: 'FINANCE CONTACT PERSON NAME', key: 'vehicle_finance_contact_person_name' },
        { label: 'FINANCE CONTACT NUMBER', key: 'vehicle_finance_contact_number' }
    ];

    const fields = [
        { label: 'MANAGER', value: vehicleData.vehicle_manager },
        { label: 'MONTH', value: vehicleData.vehicle_month },
        { label: 'BRANCH', value: vehicleData.vehicle_branch },
        { label: 'AGGREMENT NUMBER', value: vehicleData.vehicle_agreement_no },
        { label: 'FINANCE NAME', value: vehicleData.vehicle_finance_name },
        { label: 'APP ID', value: vehicleData.vehicle_app_id },
        { label: 'CUSTOMER NAME', value: vehicleData.vehicle_customer_name },
        { label: 'PRODUCT', value: vehicleData.vehicle_product },
        { label: 'BUCKET', value: vehicleData.vehicle_bucket },
        { label: 'EMI', value: vehicleData.vehicle_emi },
        { label: 'PRINCIPLE OUTSTANDING', value: vehicleData.vehicle_principle_outstanding },
        { label: 'TOTAL OUTSTANDING', value: vehicleData.vehicle_total_outstanding },
        { label: 'RC NUMBER', value: vehicleData.vehicle_registration_no },
        { label: 'CHASSIS NUMBER', value: vehicleData.vehicle_chassis_no },
        { label: 'ENGINE NUMBER', value: vehicleData.vehicle_engine_no },
        { label: 'REPO FOS', value: vehicleData.vehicle_repo_fos },
        { label: 'FIELD FOS', value: vehicleData.vehicle_fild_fos },
    ];

    const [selectedFields, setSelectedFields] = useState({});
    const [isAllSelected, setIsAllSelected] = useState(false);

    // const toggleSelection = (label) => {
    //     setSelectedFields((prev) => ({
    //         ...prev,
    //         [label]: !prev[label],
    //     }));
    // };


    const sendLocationDataApi = async () => {


        const storedAgencyId = await AsyncStorage.getItem('rent_agency_id');

        const staffId = await AsyncStorage.getItem('staff_id');



        try {

            const payload = {
                vehicle_id: vehicleData?.full_vehicle_id || '',
                agreement_no: vehicleData.vehicle_agreement_no || '',
                rc_no: vehicleData.vehicle_registration_no || '',
                customer_name: vehicleData.vehicle_customer_name || '',
                chassis_no: vehicleData.vehicle_chassis_no || '',
                engine_no: vehicleData.vehicle_engine_no || '',
                user_id: staffId || '', // assuming staffId is your user id
                rent_agency_id: storedAgencyId || '',
            };

            console.log('Sending payload:', payload);

            const response = await fetch(ENDPOINTS.AddSubAdmin_History, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.code === 200) {

                // You can navigate back or do anything else here
            } else {
                console.log('API Error:', data.message);

            }
        } catch (error) {
            console.error('API call error:', error.message);

        } finally {

        }
    };




    const toggleSelection = (label) => {
        setSelectedFields((prev) => {
            const updatedFields = { ...prev };
            if (updatedFields[label]) {
                // Agar already selected hai to deselect kar do
                delete updatedFields[label];
            } else {
                // Naya select karte waqt add kar do
                updatedFields[label] = true;
            }
            return updatedFields;
        });
    };

    const filteredFields = fields.filter(item => {
        if (userType === 'SubAdmin' && vehicleData.owner_type === 'owner' && item.label === 'MANAGER') {
            return false; // exclude MANAGER
        }
        return true;
    });


    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedFields({});
        } else {
            const allSelected = filteredFields.reduce((acc, item) => {
                acc[item.label] = true;
                return acc;
            }, {});
            setSelectedFields(allSelected);
        }
        setIsAllSelected(!isAllSelected);  // ✅ Toggling the checkbox
    };




    // const handleCopy = () => {
    //     const selectedData = fields
    //         .filter(item => selectedFields[item.label])
    //         .map(item => `*${item.label}* : ${item.value}`)
    //         .join('\n');

    //     if (selectedData) {
    //         Clipboard.setString(selectedData);
    //       
    //     } else {
    //         // Alert.alert('No Fields Selected', 'Please select at least one field to copy.');
    //     }

    //     closeModal();
    // };

    const handleCopy = () => {
        const filteredFields = fields.filter(item => {
            if (userType === 'SubAdmin' && vehicleData.owner_type === 'owner' && item.label === 'MANAGER') {
                return false; // Exclude MANAGER here as well
            }
            return true;
        });

        const selectedData = filteredFields
            .filter(item => selectedFields[item.label])
            .map(item => `*${item.label}* : ${item.value}`)
            .join('\n');

        if (selectedData) {
            Clipboard.setString(selectedData);
            Toast.show({
                type: 'success',
                text1: 'Field Copied',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            });
        } else {
            // Optionally alert if nothing selected
        }

        closeModal();
    };


    const handleWhatsApp = async () => {


        const filteredFields = fields.filter(item => {
            if (userType === 'SubAdmin' && vehicleData.owner_type === 'owner' && item.label === 'MANAGER') {
                return false; // Exclude MANAGER
            }
            return true;
        });



        const selectedData = filteredFields
            .filter(item => selectedFields[item.label])
            .map(item => `*${item.label}*: ${item.value}`)
            .join('\n');

        if (selectedData) {
            // Copy to clipboard
            Clipboard.setString(selectedData);

            // WhatsApp open karne ka code
            const messageContent = `\n${selectedData}`;
            try {
                const url = `whatsapp://send?text=${encodeURIComponent(messageContent)}`;
                const supported = await Linking.canOpenURL(url);

                if (supported) {
                    await Linking.openURL(url);
                } else {
                    const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(messageContent)}`;
                    await Linking.openURL(fallbackUrl);
                }
            } catch (error) {
                console.error('Error sending message:', error);
                Alert.alert('Error', 'There was an issue sending the message.');
            }
        } else {
            Alert.alert('No Fields Selected', 'Please select at least one field to send.');
        }

        closeModal();
    };




    const openModal = (type) => {
        setModalType(type);
        setIsAllSelected(true);  // ✅ Checkbox ko checked karne ke liye
        const allSelected = fields.reduce((acc, item) => {
            acc[item.label] = true;
            return acc;
        }, {});
        setSelectedFields(allSelected);
        setDetailModal(true);
    };

    const closeModal = () => {
        setDetailModal(false);
        setSelectedFields({});  // Deselect all fields
    };



    const handlePhoneCall = (phoneNumber) => {
        console.log("called", phoneNumber);

        let phone = phoneNumber.replace(/\D/g, ''); // Remove non-numeric characters
        if (phone) {
            Linking.openURL(`tel:${phone}`).catch(() => Alert('Failed to make a call'));
        }
    };
    const SecondPhoneCall = (phoneNumber) => {
        console.log("called", phoneNumber);

        if (!phoneNumber || typeof phoneNumber !== 'string') {
            Alert.alert("Invalid Number", "No valid phone number provided.");
            return;
        }

        const phone = phoneNumber.replace(/\D/g, ''); // Remove non-digits

        if (phone.length > 0) {
            Linking.openURL(`tel:${phone}`)
                .catch(() => Alert.alert("Error", "Failed to make a call."));
        } else {
            Alert.alert("Invalid Number", "Phone number is empty or invalid.");
        }
    };

    const ThirdPhoneCall = (phoneNumber) => {
        console.log("called", phoneNumber);

        if (!phoneNumber || typeof phoneNumber !== 'string') {
            Alert.alert("Invalid Number", "No valid phone number provided.");
            return;
        }

        const phone = phoneNumber.replace(/\D/g, ''); // Remove non-digits

        if (phone.length > 0) {
            Linking.openURL(`tel:${phone}`)
                .catch(() => Alert.alert("Error", "Failed to make a call."));
        } else {
            Alert.alert("Invalid Number", "Phone number is empty or invalid.");
        }
    };



    const handleAddStaff = async () => {
        if (!staffName.trim()) {
            setErrorMessage('Please Enter Staff Name'); // Set error in state
            return;
        }

        try {
            setErrorMessage('');
            // Replace with your API call
            const response = await fetch(ENDPOINTS.add_staff_vehicle_records, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_vehicle_id: vehicleData.full_vehicle_id,
                    staff_name: staffName
                }),
            });

            const data = await response.json();

            if (data.code == 200) {
                Toast.show({
                    type: 'success',
                    text1: 'Staff added successfully!',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                }); setStaffName('');// Clear input
            }
            else if (data.code === 400 && data.message === "Record already exists") {
                // Show Modal instead of Alert
                setDuplicateStaff(data.payload);
                setDuplicateModalVisible(true);
            } else {
                setErrorMessage('Failed to add staff');
            }
        } catch (error) {
            console.error(error);
            setErrorMessage('Error adding staff');
        }
    };


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

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            {/* Header Section */}
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
                    style={{ position: 'absolute', top: 15, left: 15 }}
                    onPress={() => {
                        navigation.goBack();
                    }}>
                    <Entypo name="cross" size={30} color="white" />
                </TouchableOpacity>
                <Text
                    style={{
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Bold',
                    }}>
                    {vehicleData.vehicle_registration_no}
                </Text>
                <View
                    style={{
                        width: '25%',
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        right: 10,
                        top: 3,
                        flexDirection: 'row', gap: 10,



                    }}>
                    {userType === 'SuperAdmin' && (
                        <TouchableOpacity onPress={() => confirmDelete(vehicleData.full_vehicle_id)} >

                            <Image source={Delete} style={{ width: 22, height: 22, tintColor: 'white' }} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={() => openModal('copy')}>

                        <Image source={Copy} style={{ width: 30, height: 30, tintColor: 'white' }} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => openModal('whatsapp')}>
                        <Image source={whatsapp} style={{ width: 30, height: 30 }} />
                    </TouchableOpacity>
                </View>

            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: keyboardVisible ? 100 : 30, flexGrow: 1 }} style={{ backgroundColor: 'white', margin: 10 }} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 3, borderWidth: 1, borderColor: '#ddd' }}>
                    {fields
                        .filter(item => !(userType === 'SubAdmin' && vehicleData.owner_type === 'owner' && item.label === 'MANAGER'))
                        .map((item, index) => (
                            <View
                                key={index}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    borderBottomWidth: 0.5,
                                    borderColor: '#ccc',
                                    paddingVertical: 1.5

                                }}
                            >

                                <View style={{ width: '30%', justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontFamily: 'Inter-Regular',
                                            padding: 6,
                                            color: 'black',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {item.label}
                                    </Text>
                                </View>


                                <View style={{ width: '70%' }}>
                                    <TouchableOpacity
                                        style={{
                                            borderRadius: 8,
                                            padding: 6,
                                            flexDirection: 'row', // Important for wrapping
                                            alignItems: 'flex-start', // Align text to start
                                            backgroundColor: 'white',
                                        }}
                                        onPress={() =>
                                            item.label === 'MANAGER' && item.value
                                                ? handlePhoneCall(item.value)
                                                : null
                                        }
                                        disabled={!item.value} // Disable if no value
                                        activeOpacity={1}
                                    >
                                        <Text
                                            style={{
                                                color: 'black',
                                                fontFamily: 'Inter-Bold',
                                                flexWrap: 'wrap', // Allow text to wrap
                                                flex: 1, // Take full available space
                                                flexDirection: 'row',
                                                lineHeight: 18, // Line spacing for better readability
                                                fontSize: 12
                                            }}
                                        >
                                            {item.value}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                </View>

                <View style={{ marginTop: 10, borderWidth: 1, borderColor: '#ddd', }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                        <View style={{ width: '50%', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular', fontSize: 10 }}>FINANCE CONTACT PERSON NAME</Text>
                        </View>
                        <View style={{ width: '50%', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular', fontSize: 10 }}>FINANCE CONTACT NUMBER</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                        <View style={{ width: '50%', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular', fontSize: 11 }}>{vehicleData.agency_person_name || '---'}</Text>
                        </View>
                        <View style={{ width: '50%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 20 }}>
                            <Image source={Call} style={{ width: 24, height: 24 }} />
                            <TouchableOpacity onPress={() => SecondPhoneCall(vehicleData.agency_contact_number)} >
                                <Text style={{ color: 'blue', fontFamily: 'Inter-Regular', fontSize: 11 }}>{vehicleData.agency_contact_number || '---'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>

                {userType === 'SuperAdmin' && (
                    <View style={{ marginTop: 10, padding: 10 }}>

                        {/* Label */}
                        <Text style={{ color: 'black', fontFamily: 'Inter-Regular', fontSize: 12, marginBottom: 5 }}>
                            Enter Staff Name <Text style={{ color: 'red', fontFamily: 'Inter-Bold', }}>*</Text>
                        </Text>

                        {/* Input + Button */}
                        <View style={{}}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        borderWidth: 1,
                                        borderColor: '#ddd',
                                        paddingVertical: 5,
                                        paddingHorizontal: 10,
                                        borderRadius: 5,
                                        fontFamily: 'Inter-Regular',
                                        fontSize: 12,
                                        color: '#555'
                                    }}
                                    placeholder="Staff Name - Mobile Number"
                                    placeholderTextColor='#ddd'
                                    value={staffName}
                                    onChangeText={setStaffName}
                                />

                                <TouchableOpacity
                                    onPress={handleAddStaff}
                                    style={{
                                        backgroundColor: '#173161',
                                        paddingVertical: 8,
                                        paddingHorizontal: 15,
                                        borderRadius: 5,
                                    }}
                                >
                                    <Text style={{ color: 'white', fontFamily: 'Inter-Bold', fontSize: 12 }}>
                                        Add
                                    </Text>
                                </TouchableOpacity>

                            </View>
                            {errorMessage !== '' && (
                                <Text style={{ color: 'red', fontSize: 12, marginTop: 5, fontFamily: 'Inter-Regular' }}>
                                    {errorMessage}
                                </Text>
                            )}
                        </View>

                    </View>
                )}

                {userType === 'normal' && (
                    <View style={{
                        marginTop: 10,
                        borderWidth: 1,
                        borderColor: '#ddd',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 10
                    }}>

                        {/* Left Side: Label */}
                        <Text style={{
                            color: 'black',
                            fontFamily: 'Inter-Regular',
                            fontSize: 12
                        }}>
                            CONFIRMATION NUMBER
                        </Text>

                        {/* Right Side: Icon + Phone Number */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10
                        }}>
                            <Image source={Call} style={{ width: 20, height: 20 }} />
                            <TouchableOpacity onPress={() => ThirdPhoneCall('02656631816')}>
                                <Text style={{ color: 'blue', fontFamily: 'Inter-Regular', fontSize: 12 }}>
                                    02656631816
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                )}



            </ScrollView>

            {/* Product click par modal */}

            {/* <Modal
                animationType="slide"
                transparent={true}
                visible={DetailModal}
                onRequestClose={closeModal}
            >
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            justifyContent: 'flex-end',

                        }}
                    >
                        <View

                            style={{ width: '100%' }}
                            onStartShouldSetResponder={() => true}
                            onTouchEnd={e => e.stopPropagation()}
                        >

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    padding: 10,
                                }}


                            >
                                <TouchableOpacity
                                    onPress={closeModal}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: 25,
                                        padding: 5,
                                        elevation: 5,
                                    }}
                                >
                                    <Entypo name="cross" size={25} color="black" />
                                </TouchableOpacity>
                            </TouchableOpacity>



                            <View
                                style={{
                                    backgroundColor: 'white',
                                    borderTopLeftRadius: 20,
                                    borderTopRightRadius: 20,
                                    padding: 20,
                                    width: '100%',
                                    maxHeight: 400,
                                }}
                            >
                                <Text
                                    style={{
                                        color: 'black',
                                        fontFamily: 'Inter-Bold',
                                        fontSize: 18,
                                        marginBottom: 10,
                                        textAlign: 'center',
                                    }}
                                >
                                    {modalType === 'copy' ? 'Copy' : 'WhatsApp'}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'flex-end' }}>
                                    <CheckBox
                                        value={isAllSelected}
                                        onValueChange={toggleSelectAll}
                                        tintColors={{ true: colors.Brown, false: '#ccc' }}
                                    />
                                    <Text style={{ marginLeft: 8, fontWeight: 'bold' }}>
                                        {isAllSelected ? 'Deselect All' : 'Select All'}
                                    </Text>
                                </View>

                                <ScrollView
                                    style={{ maxHeight: 500 }}
                                    contentContainerStyle={{ paddingBottom: 5 }}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={true}
                                >
                                    <View style={{ flex: 1 }}>
                                        {fields.map((item) => (
                                            <View
                                                key={item.label}
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginVertical: 8,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: 'black',
                                                        flex: 1,
                                                        fontFamily: 'Inter-Regular',
                                                    }}
                                                >
                                                    {item.label}
                                                </Text>

                                                <CheckBox
                                                    value={selectedFields[item.label] || false}
                                                    onValueChange={() => toggleSelection(item.label)}
                                                    tintColors={{ true: colors.Brown, false: '#ccc' }}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>

                            </View>


                            <View style={{ backgroundColor: 'white' }}>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: selectedFields && Object.keys(selectedFields).length > 0 ? colors.Brown : '#ccc', // Grey when disabled
                                        paddingVertical: 12,
                                        paddingHorizontal: 30,
                                        borderRadius: 8,
                                        width: '90%',
                                        alignItems: 'center',
                                        alignSelf: 'center',
                                        marginBottom: 20,
                                        flexDirection: 'row',
                                        justifyContent: 'center', gap: 10
                                    }}
                                    onPress={modalType === 'copy' ? handleCopy : handleWhatsApp}
                                    disabled={!(selectedFields && Object.keys(selectedFields).length > 0)}

                                >
                                    {modalType === 'whatsapp' && (
                                        <Image
                                            source={whatsapp}
                                            style={{ width: 20, height: 20 }}
                                        />
                                    )}
                                    <Text
                                        style={{
                                            color: selectedFields && Object.keys(selectedFields).length > 0 ? '#fff' : 'grey',
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                            fontFamily: 'Inter-Regular',
                                        }}
                                    >
                                        {modalType === 'copy' ? 'Copy' : 'WhatsApp Send'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal> */}

            {/* isme scroll work hota hai */}

            <Modal
                animationType="slide"
                transparent={true}
                visible={DetailModal}
                onRequestClose={closeModal}
            >
                <TouchableOpacity onPress={closeModal} style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', }}>
                    {/* <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            padding: 10,
                            width: '100%'
                        }}


                    >
                        <TouchableOpacity
                            onPress={closeModal}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 25,
                                padding: 5,
                                elevation: 5,
                            }}
                        >
                            <Entypo name="cross" size={25} color="black" />
                        </TouchableOpacity>
                    </View> */}
                    <View onStartShouldSetResponder={(e) => e.stopPropagation()} style={{ width: '100%', backgroundColor: '#fff', borderRadius: 10, height: '90%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', backgroundColor: colors.Brown, padding: 10 }}>
                            <TouchableOpacity
                                style={{ justifyContent: 'center', alignItems: 'center' }}
                                onPress={closeModal}>
                                <Entypo name="cross" size={30} color="white" />
                            </TouchableOpacity>
                            <View style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 7, }}>
                                <Text
                                    style={{
                                        color: 'white',
                                        fontFamily: 'Inter-Bold',
                                        fontSize: 14,

                                        textAlign: 'center',
                                    }}
                                >
                                    {/* {modalType === 'copy' ? 'Copy' : 'WhatsApp'} */}
                                    Copy vehicle Detail
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 7, justifyContent: 'flex-end', padding: 3, flex: 1 }}>
                                <CheckBox
                                    value={isAllSelected}
                                    onValueChange={toggleSelectAll}
                                    tintColors={{ true: 'white', false: '#ccc' }}
                                />
                                <Text style={{ marginLeft: 8, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Regular' }}>
                                    {isAllSelected ? 'Deselect All' : 'Select All'}
                                </Text>
                            </View>


                        </View>



                        <ScrollView keyboardShouldPersistTaps="handled" style={{ backgroundColor: 'white' }} contentContainerStyle={{ paddingBottom: 10 }}>

                            {filteredFields.map((item) => (
                                <View
                                    key={item.label}
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginVertical: 3,
                                        borderBottomWidth: 0.5,
                                        borderColor: '#ccc',
                                        paddingHorizontal: 10
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: 'black',
                                            flex: 1,
                                            fontFamily: 'Inter-Regular',
                                        }}
                                    >
                                        {item.label}
                                    </Text>

                                    <CheckBox
                                        value={selectedFields[item.label] || false}
                                        onValueChange={() => toggleSelection(item.label)}
                                        tintColors={{ true: colors.Brown, false: '#ccc' }}
                                    />
                                </View>
                            ))}

                        </ScrollView>
                        <View style={{ backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', padding: 10 }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: selectedFields && Object.keys(selectedFields).length > 0 ? colors.Brown : '#ccc', // Grey when disabled
                                    paddingVertical: 8,
                                    paddingHorizontal: 30,
                                    borderRadius: 8,
                                    width: '100%',
                                    alignItems: 'center',
                                    alignSelf: 'center',

                                    flexDirection: 'row',
                                    justifyContent: 'center', gap: 10
                                }}
                                onPress={modalType === 'copy' ? handleCopy : handleWhatsApp}
                                disabled={!(selectedFields && Object.keys(selectedFields).length > 0)}

                            >
                                {modalType === 'whatsapp' && (
                                    <Image
                                        source={whatsapp}
                                        style={{ width: 20, height: 20 }}
                                    />
                                )}
                                <Text
                                    style={{
                                        color: selectedFields && Object.keys(selectedFields).length > 0 ? '#fff' : 'grey',
                                        fontSize: 14,
                                        fontWeight: 'bold',
                                        fontFamily: 'Inter-Regular',
                                    }}
                                >
                                    {modalType === 'copy' ? 'Copy' : 'WhatsApp Send'}
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
                            Are you sure you want to delete this Vehicle?
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
                                    deleteVehicle(vehicleId);
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
                visible={duplicateModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDuplicateModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={() => setDuplicateModalVisible(false)}
                    activeOpacity={1}
                >

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            padding: 5,
                            width: '85%'
                        }}


                    >
                        <TouchableOpacity
                            onPress={() => setDuplicateModalVisible(false)}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 25,

                            }}
                        >
                            <Entypo name="cross" size={25} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 20,
                            borderRadius: 10,
                            width: '80%',
                            alignItems: 'center',
                        }}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={e => e.stopPropagation()}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                marginBottom: 10,
                                color: 'black', fontFamily: 'Inter-Regular'
                            }}
                        >
                            Alert
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                marginBottom: 20,
                                textAlign: 'center',
                                color: 'black', fontFamily: 'Inter-Regular'
                            }}
                        >
                            Staff{" "}
                            <Text style={{ fontWeight: 'bold', color: 'black', fontFamily: 'Inter-Regular' }}>
                                {duplicateStaff?.staff_name}
                            </Text>{" "}
                            already added for vehicle{" "}
                            <Text style={{ fontWeight: 'bold', color: 'black', fontFamily: 'Inter-Regular' }}>
                                {duplicateStaff?.vehicle_registration_number}
                            </Text>{" "}
                            on{" "}
                            <Text style={{ fontWeight: 'bold', color: 'black', fontFamily: 'Inter-Regular' }}>
                                {duplicateStaff?.entrydate}
                            </Text>.
                        </Text>
                        <TouchableOpacity
                            onPress={() => setDuplicateModalVisible(false)}
                            style={{
                                backgroundColor: colors.Brown,
                                paddingVertical: 8,
                                paddingHorizontal: 20,
                                borderRadius: 5,
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', fontFamily: 'Inter-Bold' }}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>


        </View >
    )
}

export default DetailScreen

const styles = StyleSheet.create({})