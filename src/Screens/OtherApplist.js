import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, ToastAndroid, TextInput, Modal, Switch, RefreshControl, Image } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ENDPOINTS } from '../CommonFiles/Constant';
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import Entypo from 'react-native-vector-icons/Entypo';
import AgencyListShimmer from '../Component/AgencyListShimmer';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const OtherApplist = () => {
    const navigation = useNavigation();
    const Agency = require('../assets/images/company.png');
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [originalStaffData, setoriginalStaffData] = useState([]);
    const [userType, setUsertype] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAgencyId, setSelectedAgencyId] = useState(null);
    
    const [agencyToggles, setAgencyToggles] = useState({});
    const [isAgencyEnabled, setIsAgencyEnabled] = useState({});
    
    const [permissions, setPermissions] = useState({});

    const handleCloseModal = () => {
        setIsModalVisible(false); // Close the modal
    };

    const confirmDelete = (agencyId) => {
        setSelectedAgencyId(agencyId);
        setShowDeleteModal(true);
        setIsModalVisible(false);
    };

    const OpenModal = (staff) => {
        // Only store ID or minimal required data to prevent heavy re-render
        setSelectedStaff(staff);  // If needed elsewhere

        setTimeout(() => {
            setIsModalVisible(true);
        }, 100); // 20ms delay helps reduce UI lag

    };

    // const handleDelete = () => {
    //     setShowDeleteModal(true);
    //     setIsModalVisible(false);
    // }

    const handleEdit = () => {
        setIsModalVisible(false); // Close the modal first

        if (selectedStaff) {
            navigation.navigate('AddAgencyList', { agencyData: selectedStaff });
        }
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
                // Remove from list
                const updated = agencies.filter(agency => agency.agency_id !== agencyId);
                setAgencies(updated);
                setoriginalStaffData(updated);
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

    const handleTextChange = (inputText) => {
        console.log("handletext", inputText);
        setText(inputText);

        // If inputText is empty, show the original data
        if (inputText == '') {
            setAgencies(originalStaffData);  // Reset to original data
        } else {
            // Filter data based on Name, Reg No, or Agg No
            const filtered = originalStaffData.filter(item => {
                const lowerCaseInput = inputText.toLowerCase();
                return (
                    item.name.toLowerCase().includes(lowerCaseInput) ||
                    item.mobile.toLowerCase().includes(lowerCaseInput)

                );
            });

            setAgencies(filtered); // Update filtered data state
        }
    };

    const handleAgencySelect = async (agency) => {
        // await AsyncStorage.setItem('selected_agency', agency.agency_name);
        // await AsyncStorage.setItem('selected_agency_id', agency.id.toString());  // Save the agency ID
        navigation.navigate('OtherAppMenu', {
            Id: agency.id,
            Name: agency.name,
        });
    };

    const fetchotherapplist = async () => {
        try {
            const response = await fetch(ENDPOINTS.other_app_list, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });


            const result = await response.json();
            if (result.code == 200) {
                setAgencies(result.payload);
                setoriginalStaffData(result.payload)
            } else {
                setAgencies([]);
            }
        } catch (error) {
            console.error('Error fetching agency list:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchotherapplist();
        }, []));

    const updateRentAgencyStatus = async (agencyId, action) => {
        try {
            const response = await fetch(ENDPOINTS.status_rent_agency, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rent_agency_id: agencyId,
                    action: action,
                }),
            });

            const data = await response.json();
            return data; // You can return this to handle success/failure in UI
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    };

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await fetchPermissions();
        } catch (error) {
            console.error('Error during refresh:', error);
            ToastAndroid.show('Refresh failed', ToastAndroid.SHORT);
        } finally {
            setRefreshing(false);
        }
    };


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
                    Extra App List
                </Text>
            </View>

            <View style={{ width: '100%', paddingHorizontal: 10 }}>
                <View style={{width: '100%',borderWidth: 1,borderColor: colors.Brown,marginTop: 5,marginBottom: 5,borderRadius: 8,height: 50,backgroundColor: 'white',flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',borderColor: colors.Brown, }}>
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

                        placeholder="Search Name/Mobile No"
                        placeholderTextColor="grey"
                        value={text}
                        onChangeText={handleTextChange}
                    />
                    {text ? (
                        <TouchableOpacity
                            onPress={() => {
                                setText(''); // Clear the search text
                                setAgencies(originalStaffData);
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

            {loading ? (
                <AgencyListShimmer />
            ) : agencies.length == 0 ? (
                <View
                    style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
                    <Image source={Agency} style={{ width: 70, height: 70, marginTop: 30, }} />
                    <Text
                        style={{
                            fontFamily: 'Inter-Regular',
                            color: 'red',
                            marginTop: 20

                        }}>
                        No Extra Apps Available.
                    </Text>
                </View>

            ) : (
                <FlatList
                    data={agencies}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
                    keyboardShouldPersistTaps='handled'
                    renderItem={({ item }) => (
                        <View
                            style={{
                                backgroundColor: 'white',
                                padding: 10,
                                marginVertical: 10,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: 'black',
                                position: 'relative',
                                flexWrap: 'wrap',
                                flexShrink: 1,
                            }}
                        >

                            <TouchableOpacity
                                onPress={() => handleAgencySelect(item)}
                                style={{
                                    position: 'absolute',
                                    right: 8,
                                    top: 40,
                                }}
                            >
                                <Ionicons name="arrow-forward" color="black" size={28} />
                            </TouchableOpacity>


                            <View style={{}}>

                                {/* <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10, width: '100%' }}>
                                    {
                                        agencyToggles[item.agency_id] ? (
                                            <ActivityIndicator size="small" color={colors.Brown} />
                                        ) : (
                                            <Switch
                                                trackColor={{ false: "#f54949", true: "#1cd181" }}
                                                thumbColor="#ebecee"
                                                ios_backgroundColor="#3e3e3e"
                                                disabled={!!agencyToggles[item.agency_id]}
                                                onValueChange={async value => {
                                                    const agencyId = item.agency_id;

                                                    setAgencyToggles(prev => ({
                                                        ...prev,
                                                        [agencyId]: true,
                                                    }));

                                                    setIsAgencyEnabled(prev => ({
                                                        ...prev,
                                                        [agencyId]: value,
                                                    }));

                                                    try {
                                                        const result = await updateRentAgencyStatus(agencyId, value ? 'On' : 'Off');

                                                        if (result.code === 200) {
                                                            ToastAndroid.show(`Agency status updated successfully`, ToastAndroid.SHORT);
                                                        } else {
                                                            ToastAndroid.show(result.message || 'Failed to update status', ToastAndroid.SHORT);
                                                            // Revert toggle on failure
                                                            setIsAgencyEnabled(prev => ({
                                                                ...prev,
                                                                [agencyId]: !value,
                                                            }));
                                                        }
                                                    } catch (error) {
                                                        ToastAndroid.show('Error updating agency status', ToastAndroid.SHORT);
                                                        // Revert toggle on error
                                                        setIsAgencyEnabled(prev => ({
                                                            ...prev,
                                                            [agencyId]: !value,
                                                        }));
                                                    } finally {
                                                        setAgencyToggles(prev => ({
                                                            ...prev,
                                                            [agencyId]: false,
                                                        }));
                                                    }
                                                }}

                                                value={
                                                    isAgencyEnabled[item.agency_id] !== undefined
                                                        ? isAgencyEnabled[item.agency_id]
                                                        : item.agency_status === 'Active' // ya jo bhi API status field hai
                                                }
                                            />
                                        )
                                    }
                                </View> */}
                                {/* Agency Name */}
                                <View style={{ flexDirection: 'row' }}>
                                    <Ionicons name="business-outline" size={18} color={colors.accentBlue} style={{ marginRight: 8 }} />
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: 'black', width:'87%' }}>
                                        Agency Name:{' '}
                                        <Text style={{
                                            fontFamily: 'Inter-Regular', color: 'black', flexShrink: 1,
                                            flexWrap: 'wrap',
                                            textTransform: 'uppercase'
                                        }}>
                                            {item.agency_name || '--'}
                                        </Text>
                                    </Text>

                                </View>

                                {/* Mobile */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                    <Ionicons name="call-outline" size={18} color={colors.accentBlue} style={{ marginRight: 8 }} />
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: 'black' }}>
                                        Mobile:{' '}
                                        <Text style={{ fontFamily: 'Inter-Regular' }}>
                                            {item.mobile || '--'}
                                        </Text>
                                    </Text>
                                </View>

                                {/* Username */}
                                <View style={{ flexDirection: 'row',}}>
                                    <Ionicons name="person-outline" size={18} color={colors.accentBlue} style={{ marginRight: 8 }} />
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: 'black', width:'86%' }}>
                                        Username:{' '}
                                        <Text style={{ fontFamily: 'Inter-Regular' }}>
                                            {item.name || '--'}
                                        </Text>
                                    </Text>
                                </View>

                                {/* Password */}
                                {/* <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                    <Ionicons name="lock-closed-outline" size={18} color={colors.accentBlue} style={{ marginRight: 8 }} />
                                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: 'black' }}>
                                        Password:{' '}
                                        <Text style={{ fontFamily: 'Inter-Regular' }}>
                                            {item.agency_password || '--'}
                                        </Text>
                                    </Text>
                                </View> */}
                            </View>
                        </View>
                    )}

                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#9Bd35A', '#689F38']}
                        />
                    }


                />
            )}

            {/* {(
                userType === 'SuperAdmin' ||
                !permissions.rent_agency ||
                permissions.rent_agency.insert
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
                                navigation.navigate('AddAgencyList');
                            }}>
                            <AntDesign name="plus" color="white" size={18} />
                        </TouchableOpacity>

                    </View>
                )} */}

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
                                    deleteAgency(selectedAgencyId);
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

            {/* Question modal hai ye */}

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
                                        onPress={handleEdit}>
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
                                            confirmDelete(selectedStaff.agency_id)
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
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

        </View>
    );
};

export default OtherApplist