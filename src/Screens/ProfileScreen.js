import React, { useEffect, useState } from 'react';
import {
    View, Text, Image, TouchableOpacity, Modal,
    ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../CommonFiles/Colors';
import Bottomtab from '../Component/Bottomtab';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS, IMAGE_BASE_URL } from '../CommonFiles/Constant';
import RNFS from 'react-native-fs';
import SQLite from 'react-native-sqlite-storage';
SQLite.enablePromise(true);


const ProfileScreen = ({ navigation }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [confirmModal, setConfirmModal] = useState(false);
    const [imageUri, setImageUri] = useState(null);

    const account = require('../assets/images/account.png');
    const logoutIcon = require('../assets/images/logout.png');


    const [Email, setEmail] = useState(null);
    const [Address, setAddress] = useState(null)
    const [userType, setUsertype] = useState(null);
    const [userName, setuserName] = useState(null);
    const [UserName, setUserName] = useState('');
    const [MobileNumber, setMobileNumber] = useState('');
    const [ProfileData, setProfileData] = useState([]);


    const handleImagePress = () => setModalVisible(true);
    const closeImageModal = () => setModalVisible(false);
    const openConfirmModal = () => setConfirmModal(true);
    const closeConfirmModal = () => setConfirmModal(false);
    const [logoutLoading, setLogoutLoading] = useState(false);


    const confirmLogout = async () => {
        try {
            setConfirmModal(false);
            setLogoutLoading(true);

            // 1️⃣ Close DB if open
            await closeDBIfOpen();

            // 2️⃣ Delete SQLite DB (system level)
            await SQLite.deleteDatabase({
                name: 'VehicleDB.db',
                location: 'default',
            }).catch(() => { });

            // 3️⃣ Delete files & folders
            await deleteAllLocalData();

            // 4️⃣ Clear AsyncStorage (vehicle count bhi)
            await AsyncStorage.multiRemove([
                'totalVehicleCount',
                'staff_id',
                'rent_agency_id',
            ]);

            // optional (extra safe)
            await AsyncStorage.clear();

            setLogoutLoading(false);

            // 5️⃣ Reset navigation
            navigation.reset({
                index: 0,
                routes: [{ name: 'LoginScreen' }],
            });

            console.log('✅ FULL LOGOUT CLEAN DONE');

        } catch (e) {
            setLogoutLoading(false);
            console.log('❌ Logout error:', e.message);
        }
    };


    const closeDBIfOpen = async () => {
        try {
            const db = await SQLite.openDatabase({
                name: 'VehicleDB.db',
                location: 'default',
            });
            await db.close();
            console.log('🔒 DB closed');
        } catch (e) {
            console.log('ℹ️ DB already closed');
        }
    };


    const deleteAllLocalData = async () => {
        const paths = [
            `${RNFS.DocumentDirectoryPath}/VehicleDB.db`,
            `${RNFS.DocumentDirectoryPath}/full_vehicle_detail.zip`,
            `${RNFS.DocumentDirectoryPath}/main.zip`,
            `${RNFS.DocumentDirectoryPath}/dbfile`,
            `${RNFS.DocumentDirectoryPath}/AFZAL_KHILLI_vehicle_detail`,
        ];

        for (const path of paths) {
            if (await RNFS.exists(path)) {
                await RNFS.unlink(path);
                console.log('🗑️ Deleted:', path);
            }
        }
    };




    const ProfileDataApi = async () => {
        try {
            const StaffId = await AsyncStorage.getItem('staff_id');
            console.log("Staff Id", StaffId);

            if (!StaffId) {
                console.log('Staff ID not found');
                return;
            }

            const response = await fetch(ENDPOINTS.Staff_Agency_Logout, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    staff_id: StaffId
                }),
            });

            const result = await response.json();

            if (result.code === 200 && Array.isArray(result.payload) && result.payload.length > 0) {
                const data = result.payload[0];

                setProfileData(data);
                setUserName(data.staff_name);
                setEmail(data.staff_email);
                setMobileNumber(data.staff_mobile);
                setAddress(data.staff_address);
                setImageUri(data.staff_image_profile); // If it's relative, you already handle full URL in <Image>
            } else {
                console.log('Error:', result.message || 'Failed to load staff data');
            }
        } catch (error) {
            console.log('Error fetching data:', error.message);
        }
    };


    useEffect(() => {

        ProfileDataApi();

    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            {/* Header */}
            <View style={{
                backgroundColor: colors.Brown,
                paddingVertical: 15,
                paddingHorizontal: 20,
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Text style={{
                    color: 'white',
                    fontSize: 20,
                    fontFamily: 'Inter-Bold',
                }}>Profile</Text>
            </View>

            {/* Profile Image and Name */}
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                    <TouchableOpacity onPress={handleImagePress}>
                        <Image
                            source={imageUri ? { uri: `${IMAGE_BASE_URL}${encodeURI(imageUri)}` } : account}
                            style={{
                                width: 120,
                                height: 120,
                                borderRadius: 60,
                                borderWidth: 3,
                                borderColor: '#fff',
                                backgroundColor: '#eee',
                            }}
                        />
                    </TouchableOpacity>
                    <Text style={{
                        marginTop: 15,
                        fontSize: 18,
                        fontFamily: 'Inter-Bold',
                        color: 'black',
                    }}>
                        {ProfileData.staff_name || '-----'}
                    </Text>
                </View>

                {/* Info Box */}
                <View style={{
                    borderWidth: 1,
                    borderColor: 'black',
                    borderRadius: 10,
                    overflow: 'hidden',
                    marginTop: 10


                }}>



                    {/* Mobile Number */}
                    <View style={{
                        paddingVertical: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#f2f2f2',
                        width: '100%',


                        borderBottomWidth: 1,
                        borderColor: '#ccc'
                    }}>
                        <View style={{ width: '40%', flexDirection: 'row', gap: 10, }}>
                            <View style={{ width: '15%', alignItems: 'center', marginLeft: 5 }}>
                                <Ionicons name="call-outline" size={20} color="#007BFF" />
                            </View>
                            <Text style={{
                                color: 'black',
                                fontFamily: 'Inter-Regular',
                            }}>Mobile Number</Text>
                        </View>

                        <View style={{
                            flex: 1,
                            alignItems: 'flex-end',
                            paddingRight: 5,
                            width: '60%'
                        }}>
                            <Text style={{
                                color: 'black',
                                fontFamily: 'Inter-Regular',


                            }}>{MobileNumber || '----'}</Text>
                        </View>
                    </View>

                    {/* Email */}
                    <View style={{
                        paddingVertical: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#f2f2f2',
                        width: '100%',


                        borderBottomWidth: 1,
                        borderColor: '#ccc'
                    }}>
                        <View style={{ width: '40%', flexDirection: 'row', gap: 10, }}>
                            <View style={{ width: '15%', alignItems: 'center', marginLeft: 5 }}>
                                <Ionicons name="mail-outline" size={20} color="#28A745" />
                            </View>
                            <Text style={{
                                color: 'black',
                                fontFamily: 'Inter-Regular',
                            }}>Email</Text>
                        </View>
                        <View style={{
                            flex: 1,
                            alignItems: 'flex-end',
                            paddingRight: 5,
                            width: '60%'
                        }}>
                            <Text style={{
                                color: 'black',
                                fontFamily: 'Inter-Regular',
                                textTransform: 'uppercase'

                            }}>{Email || 'NA'}</Text>
                        </View>
                    </View>

                    {/* Address */}
                    <View style={{
                        paddingVertical: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#f2f2f2',
                        borderBottomLeftRadius: 15,
                        borderBottomRightRadius: 15,
                        width: '100%'

                    }}>
                        <View style={{ width: '40%', flexDirection: 'row', gap: 10, }}>
                            <View style={{ width: '15%', alignItems: 'center', marginLeft: 5 }}>
                                <Ionicons name="location-outline" size={20} color="#6C757D" />
                            </View>
                            <Text style={{
                                color: 'black',
                                fontFamily: 'Inter-Regular',
                            }}>Address</Text>

                        </View>
                        <View style={{
                            flex: 1,
                            alignItems: 'flex-end',
                            paddingRight: 5,
                            width: '60%'
                        }}>
                            <Text style={{
                                color: 'black',
                                fontFamily: 'Inter-Regular',
                                textTransform: 'uppercase'

                            }}>{Address || 'NA'}</Text>
                        </View>
                    </View>


                </View>


                <TouchableOpacity
                    style={{
                        marginTop: 20,
                        backgroundColor: 'white',
                        borderWidth: 1,
                        borderColor: colors.Brown,
                        paddingVertical: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        width: '100%',
                    }}
                    onPress={openConfirmModal}
                >
                    <View style={{ width: '85%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Image source={logoutIcon} style={{ width: 22, height: 22, tintColor: 'black' }} />
                        <Text style={{ color: 'black', fontSize: 14, fontFamily: 'Inter-Bold' }}>Logout</Text>
                    </View>
                </TouchableOpacity>


            </View>

            <View style={{ justifyContent: 'flex-end' }}>
                <Bottomtab />
            </View>

            {/* Modal - Image */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={closeImageModal}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                    onPress={closeImageModal}
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
                        onTouchEnd={e => e.stopPropagation()}>
                        <Image
                            source={imageUri ? { uri: `${IMAGE_BASE_URL}${encodeURI(imageUri)}` } : account}
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

            {/* Modal - Logout Confirmation */}
            <Modal
                transparent={true}
                visible={confirmModal}
                animationType="fade"
                onRequestClose={closeConfirmModal}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                    onPress={closeConfirmModal}
                    activeOpacity={1}
                >
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 20,
                            borderRadius: 8,
                            width: '80%',
                            alignItems: 'center'
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
                        }}>Logout</Text>
                        <Text style={{
                            fontSize: 14,
                            textAlign: 'center',
                            marginBottom: 20,
                            color: 'black',
                            fontFamily: 'Inter-Medium'
                        }}>
                            Are you sure you want to Logout?
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                            <TouchableOpacity
                                onPress={closeConfirmModal}
                                style={{
                                    backgroundColor: '#ddd',
                                    padding: 10,
                                    borderRadius: 5,
                                    width: '45%',
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ color: 'black', fontWeight: 'bold', fontFamily: 'Inter-Regular' }}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmLogout}
                                style={{
                                    backgroundColor: colors.Brown,
                                    padding: 10,
                                    borderRadius: 5,
                                    width: '45%',
                                    alignItems: 'center'
                                }}

                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontFamily: 'Inter-Regular' }} >Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                transparent={true}
                visible={logoutLoading}
                animationType="fade"
            >
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        alignItems: 'center'
                    }}>
                        <ActivityIndicator size="large" color={colors.Brown} />
                        <Text style={{ marginTop: 15, fontSize: 16, color: 'black', fontFamily: 'Inter-Medium' }}>
                            Logging out...
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ProfileScreen;
