import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Modal,
    Alert,
    TextInput,
    Image,

} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import StaffListShimmer from '../Component/StaffListShimmer';
import { ENDPOINTS } from '../CommonFiles/Constant';

const BlackListUser = () => {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);


    const [staffList, setStaffList] = useState([]);


    const [loading, setLoading] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [searchText, setSearchText] = useState('');
    const [filteredList, setFilteredList] = useState(staffList);

    const [ConfrimationModal, setConfrimationModal] = useState(false);
    const [permissions, setPermissions] = useState({});
    console.log("Blacklist User", permissions);
    const [userType, setUsertype] = useState(null);

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
        setLoading(true);
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

            if (result.code == 200 && result.payload) {

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
                setIsLoadingPermissions(false);
            } else {
                console.warn('Failed to fetch permissions or no payload');
                setIsLoadingPermissions(false);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchPermissions();
    }, []);


    const onRefresh = async () => {
        setRefreshing(true);
        await BlackListApi();
        setRefreshing(false);
    };



    useEffect(() => {
        if (searchText.trim() === '') {
            setFilteredList(staffList);
        } else {
            const filtered = staffList.filter(item =>
                item.staff_name.toLowerCase().includes(searchText.toLowerCase()) ||
                item.staff_mobile.includes(searchText)
            );
            setFilteredList(filtered);
        }
    }, [searchText, staffList]);


    useFocusEffect(
        useCallback(() => {
            BlackListApi();
        }, [])
    );

    const handleDelete = () => {
        setConfrimationModal(true);
        handleCloseModal();
        // Call Delete API with the selected staff ID
    };

    const closeconfirmodal = () => {
        setConfrimationModal(false); // Hide the modal
    };

    const handleCloseModal = () => {
        setIsModalVisible(false); // Close the modal
    };

    const BlackListApi = async () => {
        setLoading(true);
        try {
            const agencyId = await AsyncStorage.getItem('rent_agency_id');

            const response = await fetch(ENDPOINTS.list_staff_blacklist, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rent_agency_id: agencyId,
                }),
            });

            const result = await response.json();
            if (result.code === 200) {
                setStaffList(result.payload);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    // ❌ Delete API
    const DeleteApi = async (id) => {
        console.log("id ye hai", id);
        try {
            await fetch(ENDPOINTS.delete_staff_blacklist, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: id
                }),
            });

            setIsModalVisible(false);
            BlackListApi();
        } catch (err) {
            console.log(err);
        }
    };

    // ✏️ Edit
    const handleEdit = () => {
        setIsModalVisible(false);
        navigation.navigate('AddBlacklistUser', {
            editData: selectedItem,
        });
    };

    const renderItem = ({ item }) => (
        <View
            style={{
                backgroundColor: '#fff',
                marginHorizontal: 15,
                marginVertical: 8,
                padding: 14,
                borderRadius: 14,
                elevation: 4,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 6,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
            }}
        >
            {/* Left Content */}
            <View style={{ flex: 1, gap: 6 }}>

                {/* Name */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text
                        style={{
                            fontSize: 13,
                            color: '#777',
                            fontFamily: 'Inter-Regular',
                            width: 60,
                        }}
                    >
                        Name:
                    </Text>
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#333',
                            fontFamily: 'Inter-Medium',
                            flex: 1,
                            flexWrap: 'wrap',
                        }}
                    >
                        {item.staff_name}
                    </Text>
                </View>

                {/* Mobile */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text
                        style={{
                            fontSize: 13,
                            color: '#777',
                            fontFamily: 'Inter-Regular',
                            width: 60,
                        }}
                    >
                        Mobile:
                    </Text>
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#333',
                            fontFamily: 'Inter-Medium',
                            flex: 1,
                            flexWrap: 'wrap',
                        }}
                    >
                        {item.staff_mobile}
                    </Text>
                </View>

                {/* Remark */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text
                        style={{
                            fontSize: 13,
                            color: '#777',
                            fontFamily: 'Inter-Regular',
                            width: 60,
                        }}
                    >
                        Remark:
                    </Text>
                    <Text
                        style={{
                            fontSize: 13,
                            color: '#333',
                            fontFamily: 'Inter-Regular',
                            lineHeight: 18,
                            flex: 1,
                            flexWrap: 'wrap',
                        }}
                    >
                        {item.remark || '---'}
                    </Text>
                </View>

            </View>

            {/* Right Menu */}
            {(
                userType === 'SuperAdmin' ||
                (userType === 'SubAdmin' && (
                    permissions?.black_list_staffs?.update || permissions?.black_list_staffs?.delete
                ))
                || (userType === 'main' && (
                    permissions?.black_list_staffs?.update || permissions?.black_list_staffs?.delete
                ))
            ) && (
                    <TouchableOpacity
                        onPress={() => {
                            setSelectedItem(item);
                            setIsModalVisible(true);
                        }}
                        style={{
                            paddingLeft: 10,
                            paddingTop: 4,
                        }}
                    >
                        <Entypo name="dots-three-vertical" size={18} color="#000" />
                    </TouchableOpacity>
                )}
        </View>
    );


    const EmptyState = ({ text }) => (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 30,
            }}>

            {/* Image Container */}
            <View
                style={{
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    backgroundColor: '#f3f3f3',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 18,
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                }}>
                <Image
                    source={require('../assets/images/team.png')}
                    style={{
                        width: 65,
                        height: 65,
                        resizeMode: 'contain',
                    }}
                />
            </View>

            {/* Main Text */}
            <Text
                style={{
                    fontSize: 17,
                    color: 'red',
                    fontFamily: 'Inter-SemiBold',
                    textAlign: 'center',
                }}>
                {text}
            </Text>

            {/* Sub Text */}
            <Text
                style={{
                    fontSize: 13,
                    color: '#999',
                    fontFamily: 'Inter-Regular',
                    textAlign: 'center',
                    marginTop: 6,
                    lineHeight: 18,
                }}>
                You Can Add Black List Staff Using The + Button
            </Text>
        </View>
    );





    return (
        <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
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
                    Black List Staffs
                </Text>
            </View>
            {filteredList.length !== 0 && (
                <View
                    style={{
                        backgroundColor: '#fff',
                        margin: 10,
                        borderRadius: 12,
                        paddingHorizontal: 15,
                        flexDirection: 'row',
                        alignItems: 'center',
                        elevation: 3,
                        borderWidth: 1, borderColor: colors.Brown
                    }}>
                    <Ionicons name="search" size={20} color="#777" />
                    <TextInput
                        placeholder="Search By Name Or Mobile"
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                        style={{
                            flex: 1,
                            padding: 10,
                            fontSize: 14,
                            color: '#000',
                            fontFamily: 'Inter-Regular',
                        }}
                    />
                </View>
            )}

            {loading ? (<StaffListShimmer />
            ) : filteredList.length === 0 ? (
                <EmptyState
                    text={
                        searchText
                            ? 'No Staff Found For Your Search'
                            : 'No Black List Staffs available'
                    }
                />
            ) : (
                <FlatList
                    data={filteredList}
                    keyboardShouldPersistTaps="handled"
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItem}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />

            )}

            {/* 🔹 MODAL */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setIsModalVisible(false)}>

                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                    }}
                    activeOpacity={1}
                    onPress={() => setIsModalVisible(false)}>

                    {/* Cross Button */}
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            width: '80%',
                            paddingVertical: 5,
                        }}>
                        <TouchableOpacity
                            onPress={() => setIsModalVisible(false)}
                            style={{
                                marginRight: 40,
                                backgroundColor: 'white',
                                borderRadius: 50,
                                padding: 5,
                            }}>
                            <Entypo name="cross" size={25} color="black" />
                        </TouchableOpacity>
                    </View>

                    {/* Modal Box */}
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 15,
                            borderRadius: 15,
                            width: '60%',
                            alignItems: 'center',
                            elevation: 5,
                        }}
                        onStartShouldSetResponder={() => true}>

                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'Inter-SemiBold',
                                color: 'black',
                                marginBottom: 15,
                            }}>
                            Select Action
                        </Text>
                        {(
                            (userType === 'SuperAdmin') ||
                            (userType === 'SubAdmin' && permissions?.black_list_staffs?.update) || (userType === 'main' && permissions?.black_list_staffs?.update)
                        ) && (

                                <TouchableOpacity
                                    onPress={handleEdit}
                                    style={{
                                        borderColor: '#000',
                                        borderWidth: 1,
                                        borderRadius: 10,
                                        width: '100%',
                                        paddingVertical: 12,
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        gap: 10,
                                    }}>
                                    <AntDesign name="edit" size={18} color="black" />
                                    <Text style={{ fontFamily: 'Inter-Regular', color: '#000' }}>
                                        Edit
                                    </Text>
                                </TouchableOpacity>
                            )}
                        {(
                            (userType === 'SuperAdmin') ||
                            (userType === 'SubAdmin' && permissions?.black_list_staffs?.delete) || (userType === 'main' && permissions?.black_list_staffs?.delete)
                        ) && (
                                <TouchableOpacity
                                    onPress={handleDelete}
                                    style={{
                                        borderColor: 'red',
                                        borderWidth: 1,
                                        borderRadius: 10,
                                        width: '100%',
                                        paddingVertical: 12,
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        gap: 10,
                                        marginTop: 10,
                                    }}>
                                    <AntDesign name="delete" size={18} color="red" />
                                    <Text style={{ fontFamily: 'Inter-Regular', color: 'red' }}>
                                        Delete
                                    </Text>
                                </TouchableOpacity>
                            )}

                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={ConfrimationModal}
                onRequestClose={closeconfirmodal}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={closeconfirmodal}
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
                            Confirm Delete
                        </Text>
                        <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
                            Are you sure you want to remove this staff from the blacklist?
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
                                onPress={closeconfirmodal}>
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
                                    DeleteApi(selectedItem.staff_id);
                                    closeconfirmodal();
                                }}>
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

            {(
                (userType === 'SuperAdmin') ||
                (userType === 'SubAdmin' && permissions?.black_list_staffs?.insert) || (userType === 'main' && permissions?.black_list_staffs?.insert)
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
                                navigation.navigate('AddBlacklistUser');
                            }}>
                            <AntDesign name="plus" color="white" size={18} />
                        </TouchableOpacity>

                    </View>
                )}
        </View>
    );
};

export default BlackListUser;
