import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import colors from '../CommonFiles/Colors'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { ENDPOINTS } from '../CommonFiles/Constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const AgencyDashboard = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { agencyId, agencyName, agencyDetail } = route.params || {};
    console.log("agency id dashboard", agencyId);

    const [permissions, setPermissions] = useState({});
    const [isActionModalVisible, setIsActionModalVisible] = React.useState(false);
    const [modalPosition, setModalPosition] = React.useState({ top: 40, left: 0 });
    const [userType, setUsertype] = useState(null);
    const [selectedAgencyId2, setSelectedAgencyId2] = useState(null);
    console.log("seleted agency id ye hai", selectedAgencyId2);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const threeDotRef = React.useRef(null);

    const handleEdit2 = () => {
        setIsActionModalVisible(false); // Close the modal first

        if (agencyDetail) {
            navigation.navigate('AddAgencyList', { agencyData: agencyDetail });
        }
    };


    useFocusEffect(
        useCallback(() => {
            const fetchUsertype = async () => {
                const usertype = await AsyncStorage.getItem('user_type');
                setUsertype(usertype);
            };
            fetchUsertype();
        }, [])
    );

    const confirmDelete2 = (agencyId) => {
        setSelectedAgencyId2(agencyId);
        setShowDeleteModal(true);
        setIsActionModalVisible(false);
    };

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
                Toast.show({
                    type: 'success',
                    text1: 'Agency deleted successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000, // 2 sec
                });

                setTimeout(() => {
                    navigation.goBack();
                }, 500); // 0.5 sec delay before going back
            } else {
                Toast.show({
                    type: 'error',
                    text1: result.message || 'Failed to delete agency',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000, // 2 sec
                });
            }
        } catch (error) {
            console.error('Delete error:', error);

        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
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
                {/* Back Button */}
                <TouchableOpacity
                    style={{
                        width: 50,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        left: 6,
                        top: 5,
                    }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>

                {/* Title */}
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Bold',
                        textTransform: 'uppercase',
                        maxWidth: '70%',
                        textAlign: 'center',
                    }}
                >
                    {agencyName}
                </Text>

                {/* Three Dot Button */}
                {(
                    userType === 'SuperAdmin' ||
                    !permissions?.rent_agency ||
                    permissions?.rent_agency?.update ||
                    permissions?.rent_agency?.delete
                ) && (
                        <TouchableOpacity
                            ref={threeDotRef}
                            style={{
                                width: 50,
                                height: 50,
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'absolute',
                                right: 6,
                                top: 5,
                            }}
                            onPress={() => {
                                threeDotRef.current.measure((fx, fy, width, height, px, py) => {
                                    setModalPosition({
                                        top: py + 38,
                                        left: px - 170, // adjust for width
                                    });
                                    setIsActionModalVisible(true);
                                });
                            }}
                        >
                            <Ionicons name="ellipsis-vertical" color="white" size={24} />
                        </TouchableOpacity>
                    )}
            </View>


            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginTop: 10,
                    paddingHorizontal: 15,

                }}>
                {/* First Box (Staff) */}
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 15,
                        width: 100,
                        height: 120,
                        padding: 5,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 6,
                        elevation: 8,
                    }}
                    onPress={() => {
                        navigation.navigate('AgencyStaff', {
                            agencyId: agencyId,
                            agencyName: agencyName,
                            agencyDetail: agencyDetail,
                        });
                    }}
                >
                    {/* Top 70%: Icon */}
                    <View style={{ flex: 7, justifyContent: 'center', alignItems: 'center' }}>
                        <View
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                backgroundColor: 'white',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#000080',
                            }}
                        >
                            <Ionicons name="people-outline" size={25} color="#000080" />
                        </View>
                    </View>

                    {/* Bottom 30%: Text */}
                    <View style={{ flex: 3, alignItems: 'center', paddingHorizontal: 5 }}>
                        <Text
                            style={{
                                color: 'black',
                                fontSize: 12,
                                textAlign: 'center',
                                fontFamily: 'Inter-Medium',
                            }}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            Staff
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Second Box (Schedule) */}
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 15,
                        width: 100,
                        height: 120,
                        padding: 5,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 6,
                        elevation: 8,
                    }}
                    onPress={() => {
                        navigation.navigate('AgencyStaffSchedule', {
                            agencyId: agencyId,
                            agencyName: agencyName,
                            agencyDetail: agencyDetail,
                        });
                    }}
                >
                    {/* Top 70%: Icon */}
                    <View style={{ flex: 7, justifyContent: 'center', alignItems: 'center' }}>
                        <View
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                backgroundColor: 'white',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#2E8B57',
                            }}
                        >
                            <Ionicons name="calendar-outline" size={25} color="#2E8B57" />
                        </View>
                    </View>

                    {/* Bottom 30%: Text */}
                    <View style={{ flex: 3, alignItems: 'center', paddingHorizontal: 5 }}>
                        <Text
                            style={{
                                color: 'black',
                                fontSize: 12,
                                textAlign: 'center',
                                fontFamily: 'Inter-Medium',
                            }}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            Schedule
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Third Box (File List) */}
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 15,
                        width: 100,
                        height: 120,
                        padding: 5,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 6,
                        elevation: 8,
                    }}
                    onPress={() => {
                        navigation.navigate('AgencyFiles', {
                            agencyId,
                            agencyName,
                            agencyDetail,
                        });
                    }}
                >
                    {/* Top 70%: Icon */}
                    <View style={{ flex: 7, justifyContent: 'center', alignItems: 'center' }}>
                        <View
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                backgroundColor: 'white',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#4169E1',
                            }}
                        >
                            <Ionicons name="folder-open-outline" size={24} color="#4169E1" />
                        </View>
                    </View>

                    {/* Bottom 30%: Text */}
                    <View style={{ flex: 3, alignItems: 'center', paddingHorizontal: 5 }}>
                        <Text
                            style={{
                                color: 'black',
                                fontSize: 12,
                                textAlign: 'center',
                                fontFamily: 'Inter-Medium',
                            }}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            File List
                        </Text>
                    </View>
                </TouchableOpacity>


            </View>


            <Modal
                visible={isActionModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setIsActionModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsActionModalVisible(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
                        <View
                            style={{
                                position: 'absolute',
                                top: modalPosition.top,
                                left: modalPosition.left,
                                backgroundColor: 'white',
                                padding: 15,
                                borderRadius: 12,
                                width: 200,
                                elevation: 8,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.25,
                                shadowRadius: 5,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontFamily: 'Inter-SemiBold',
                                    marginBottom: 12,
                                    color: 'black',
                                }}
                            >
                                Select Action
                            </Text>

                            {/* Update Agency */}
                            {(
                                userType === 'SuperAdmin' ||
                                !permissions.rent_agency ||
                                permissions.rent_agency.update
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
                                        onPress={handleEdit2}
                                    >
                                        <Ionicons name="create-outline" size={20} color="#3B82F6" />
                                        <Text style={{ fontSize: 14, color: '#3B82F6' }}>
                                            Update Agency
                                        </Text>
                                    </TouchableOpacity>
                                )}

                            {/* Delete Agency */}
                            {(
                                userType === 'SuperAdmin' ||
                                !permissions.rent_agency ||
                                permissions.rent_agency.delete
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

                                            confirmDelete2(agencyId);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#DC2626" />
                                        <Text style={{ fontSize: 14, color: '#DC2626' }}>
                                            Delete Agency
                                        </Text>
                                    </TouchableOpacity>
                                )}

                            {/* Finance List */}
                            {(
                                userType === 'SuperAdmin' ||
                                !permissions.rent_agency ||
                                permissions.rent_agency.update
                            ) && (
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 10,
                                            gap: 12,
                                        }}
                                        onPress={() => {

                                            setIsActionModalVisible(false);
                                            navigation.navigate('AgencyFinanceList', {
                                                agencyId: agencyId,
                                                agencyName: agencyName,
                                            });
                                        }}
                                    >
                                        <Ionicons name="business-outline" size={20} color={colors.Brown} />
                                        <Text style={{ fontSize: 14, color: colors.Brown }}>
                                            Agency Finance List
                                        </Text>
                                    </TouchableOpacity>
                                )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
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
                                    deleteAgency(selectedAgencyId2);
                                    setIsActionModalVisible(false);
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
    )
}

export default AgencyDashboard

const styles = StyleSheet.create({})