import {
    View, Text, TouchableOpacity, Image, Switch, ActivityIndicator,
    Modal, ToastAndroid, ScrollView
} from 'react-native';
import React, { useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import { ENDPOINTS, IMAGE_BASE_URL } from '../CommonFiles/Constant';

const SubAdminInformation = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userData } = route.params || {};
    console.log("userData ye hai subadmin info ke andar", userData);
    const PlaceholderImage = require('../assets/images/user.png');

    const [modalVisible, setModalVisible] = useState(false);
    const [isEnabled, setIsEnabled] = useState(userData.status === 'Active');

    const [loadingToggles, setLoadingToggles] = useState({});
    const [AccountToggles, setAccountToggles] = useState({});

    const toggleSwitch = () => {
        setIsEnabled(prev => !prev);
        ToastAndroid.show('Status toggled (demo)', ToastAndroid.SHORT);
    };

    const [isAccountEnabled, setIsAccountEnabled] = useState({
        [userData.staff_id]: userData.staff_status === 'Active',
    });

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

    const handleImagePress = () => setModalVisible(true);
    const handleCloseModal = () => setModalVisible(false);

    if (!userData) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'white'
            }}>
                <ActivityIndicator size="large" color={colors.Brown} />
                <Text style={{ marginTop: 10, color: 'gray' }}>Loading sub-admin data...</Text>
            </View>
        );
    }

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
                    style={{
                        width: '15%',
                        position: 'absolute',
                        left: 10,
                        top: 10
                    }}
                    onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>
                <Text style={{
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 'bold',
                    fontFamily: 'Inter-Bold'
                }}>
                    User Info
                </Text>
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

            {/* Profile Image */}
            <View style={{
                width: '100%', position: 'absolute',
                top: 60, justifyContent: 'center', alignItems: 'center'
            }}>
                <TouchableOpacity onPress={handleImagePress}>
                    <Image
                        source={
                            userData.staff_image_profile
                                ? { uri: `${IMAGE_BASE_URL}${encodeURI(userData.staff_image_profile)}` }
                                : PlaceholderImage
                        }
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            borderWidth: 4,
                            borderColor: 'white',
                            backgroundColor: '#fff'
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
                        {userData.staff_mobile}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Info Section */}
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
                        backgroundColor: '#e7fefb'
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
                                        disabled={!!AccountToggles[userData.staff_id]}
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
                    {/* <View style={{
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

                            <Switch
                                trackColor={{ false: "#f54949", true: "#1cd181" }}
                                thumbColor="#ebecee"
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={toggleSwitch}
                                value={isEnabled}
                            />



                        </View>
                    </View> */}
                    {/* <View style={{
                        paddingVertical: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#e7fefb'
                    }}>
                        <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="person-outline" size={20} color="#1abc9c" />


                        </View>
                        <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                            Reference Name
                        </Text>
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 5, }}>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 5 }}>
                                <Text style={{ color: 'black', fontFamily: 'Inter-Regular', textTransform: 'uppercase' }}>{userData.staff_reference || '----'}</Text>
                            </View>


                        </View>
                    </View> */}


                    {/* Address */}
                    <TouchableOpacity style={{
                        paddingVertical: 10,

                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#e7fefb',
                    }}
                        activeOpacity={1}>
                        <View style={{ width: '30%', justifyContent: 'flex-start', alignItems: 'center', gap: 10, flexDirection: 'row', paddingLeft: 5, }}>
                            <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="location-outline" size={20} color='#6a0572' />
                            </View>

                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                                Address
                            </Text>
                        </View>

                        <View style={{ width: '70%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 5, }}>
                            <Text style={{ color: 'black', fontFamily: 'Inter-Regular', }}>{userData.staff_address || '----'}</Text>
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

                    {/* Manage Permissions */}

                </View>
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
                        navigation.navigate('RentStaffFinanceList', {
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

                {userData.staff_type != 'normal' && (
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
                                staff_type: 'main',
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

            {/* Modal */}
            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={handleCloseModal}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.8)'
                    }}
                    onPress={handleCloseModal}
                >
                    <View style={{
                        width: '80%',
                        height: '40%',
                        backgroundColor: 'white',
                        borderRadius: 150,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Image
                            source={
                                userData.staff_image_profile
                                    ? { uri: `${IMAGE_BASE_URL}${encodeURI(userData.staff_image_profile)}` }
                                    : PlaceholderImage
                            }
                            style={{
                                width: '100%',
                                height: '100%',
                                resizeMode: 'cover'
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default SubAdminInformation;
