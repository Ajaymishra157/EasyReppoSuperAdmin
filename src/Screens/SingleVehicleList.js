import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, Image } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ENDPOINTS } from '../CommonFiles/Constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';


const SingleVehicleList = () => {
    const vehicle = require('../assets/images/vehicle.png');

    const navigation = useNavigation();
    const [data, setData] = useState([]);
    console.log("data ye hai ok", data);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [SelectedVehicle, setSelectedVehicle] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [vehicleId, setVehicleId] = useState('');

    const [userType, setUsertype] = useState(null);


    const [permissions, setPermissions] = useState({});



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

    useFocusEffect(
        useCallback(() => {
            fetchVehicles();
        }, [])
    );

    const handleEdit = (vehicle) => () => {
        navigation.navigate('SingleVehicleUpload', {
            vehicleData: vehicle, // pura object bhej rahe
        });
        closeActionModal(); // modal close karna ho to
    };

    const confirmDelete = (agencyId) => {
        setVehicleId(agencyId);
        setShowDeleteModal(true);
        setActionModalVisible(false);
    };


    const deleteVehicle = async (vehicleId) => {
        try {
            // API endpoint replace karo apne endpoint se
            const response = await fetch(ENDPOINTS.delete_vehicle_details, {
                method: 'POST', // ya DELETE agar tumhara backend support karta hai
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ full_vehicle_id: vehicleId }),
            });

            const result = await response.json();

            if (result.code == 200) { // API success
                Toast.show({
                    type: 'success',
                    text1: 'Vehicle deleted successfully!',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });


                // Data state se vehicle remove karo 500ms ke delay ke saath
                setData(prevData => prevData.filter(item => item.full_vehicle_id !== vehicleId));


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




    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const response = await fetch(ENDPOINTS.single_add_vehicle_list);
            const result = await response.json();

            if (result.code === 200 && Array.isArray(result.payload)) {
                setData(result.payload);
            } else {
                setData([]);

            }
        } catch (err) {
            console.log('Vehicle list fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (item) => {
        setSelectedVehicle(item);
        setActionModalVisible(true);
    };


    const closeActionModal = () => {
        setSelectedVehicle(null);
        setActionModalVisible(false);
    };


    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={{
                flexDirection: 'row',
                backgroundColor: '#fff',
                padding: 10,
                marginBottom: 7,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#ddd',
                alignItems: 'center',
                marginTop: 5,
            }}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('VehicleUploadList', { vehicleData: item })}
        >
            <View style={{ width: '10%', alignItems: 'center' }}>
                <Icon
                    name={item.vehicle_type === '2' ? 'bicycle' : 'car'}
                    size={16}
                    color="black"
                />
            </View>

            <View style={{ width: '35%' }}>
                <Text style={{ fontSize: 12, color: 'black', fontFamily: 'Inter-Bold' }}>
                    {item.vehicle_registration_no}
                </Text>
            </View>

            <View style={{ width: '40%' }}>
                <Text style={{ fontSize: 12, color: 'black', fontFamily: 'Inter-Bold' }}>
                    {item.vehicle_product || '-----'}
                </Text>
            </View>

            {/* Delete icon container */}
            {(
                userType === 'SuperAdmin' ||
                (userType === 'SubAdmin' && (
                    permissions?.vehicle_upload?.update || permissions?.vehicle_upload?.delete
                ))
                || (userType === 'main' && (
                    permissions?.vehicle_upload?.update || permissions?.vehicle_upload?.delete
                ))
            ) && (
                    <TouchableOpacity onPress={() => openActionModal(item)} style={{ width: '20%', alignItems: 'center', paddingLeft: 10 }}>
                        <Entypo name="dots-three-vertical" size={18} color="black" />
                    </TouchableOpacity>
                )}
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
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
                <Text style={{
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 'bold',
                    fontFamily: 'Inter-Bold',
                }}>
                    Vehicle Upload List
                </Text>
            </View>

            {/* Loader or List */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.Brown} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    contentContainerStyle={{ padding: 10 }}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={vehicle} style={{ width: 70, height: 70, marginTop: 30 }} />
                                <Text style={{
                                    fontFamily: 'Inter-Regular',
                                    color: 'red',
                                    marginTop: 20
                                }}>
                                    No Vehicles Found
                                </Text>
                            </View>
                        ) : null
                    }
                />
            )}



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

                        {(
                            (userType === 'SuperAdmin') ||
                            (userType === 'SubAdmin' && permissions?.vehicle_upload?.update) || (userType === 'main' && permissions?.vehicle_upload?.update)
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
                                    onPress={handleEdit(SelectedVehicle)}
                                >
                                    <AntDesign name="edit" size={20} color="black" />
                                    <Text
                                        style={{
                                            color: 'black',
                                            fontFamily: 'Inter-Regular',
                                            fontSize: 14,
                                        }}
                                    >
                                        Update Vehicle
                                    </Text>
                                </TouchableOpacity>
                            )}


                        {(
                            (userType === 'SuperAdmin') ||
                            (userType === 'SubAdmin' && permissions?.vehicle_upload?.delete) || (userType === 'main' && permissions?.vehicle_upload?.delete)
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
                                    // onPress={() => deleteStaff(selectedStaff.staff_id)}
                                    onPress={() => {
                                        confirmDelete(SelectedVehicle.full_vehicle_id)
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
                                        Delete Vehicle
                                    </Text>
                                </TouchableOpacity>
                            )}
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

            {(
                (userType === 'SuperAdmin') ||
                (userType === 'SubAdmin' && permissions?.vehicle_upload?.insert) || (userType === 'main' && permissions?.vehicle_upload?.insert)
            ) && (
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
                                navigation.navigate('SingleVehicleUpload');
                            }}>
                            <AntDesign name="plus" color="white" size={18} />
                        </TouchableOpacity>

                    </View>
                )}
        </View>
    )
}

export default SingleVehicleList

