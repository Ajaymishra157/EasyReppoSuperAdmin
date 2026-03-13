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
    Keyboard,
    Dimensions,
    TouchableWithoutFeedback,

} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { ENDPOINTS } from '../CommonFiles/Constant';
import BlackListShimmer from '../Component/BlackListShimmer';

const BlackListUser = () => {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const SCREEN_HEIGHT = Dimensions.get('window').height;
    const MODAL_HEIGHT = 130;

    const [staffList, setStaffList] = useState([]);

    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [permissionLoading, setPermissionLoading] = useState(true);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const modalPositionRef = useRef({ top: 0, left: 0 });
    const [selectedItem, setSelectedItem] = useState(null);

    const [searchText, setSearchText] = useState('');
    const [filteredList, setFilteredList] = useState(staffList);

    const [ConfrimationModal, setConfrimationModal] = useState(false);
    const [permissions, setPermissions] = useState({});
    console.log("Blacklist User", permissions);
    const [userType, setUsertype] = useState(null);

    const formatDateTime = (dateString) => {
        if (!dateString) return '--';

        const dateObj = new Date(dateString);

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();

        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');

        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // 0 -> 12

        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
    };


    const OpenModal = (item, event) => {
        setSelectedItem(item);

        event.currentTarget.measure((x, y, width, height, pageX, pageY) => {

            let calculatedTop = pageY + height;

            // 👇 Check if modal will go outside screen
            if (pageY + height + MODAL_HEIGHT > SCREEN_HEIGHT) {
                // Open above the button
                calculatedTop = pageY - MODAL_HEIGHT;
            }

            modalPositionRef.current = {
                top: calculatedTop,
                left: pageX - 155,
            };
            setIsModalVisible(true);
        });


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

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);


    const fetchPermissions = async () => {
        setPermissionLoading(true);
        try {
            const staff_id = await AsyncStorage.getItem('staff_id');
            if (!staff_id) {
                console.warn('No staff_id found');
                setListLoading(false);
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
                // setIsLoadingPermissions(false);
            } else {
                console.warn('Failed to fetch permissions or no payload');
                // setIsLoadingPermissions(false);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
        finally {
            setPermissionLoading(false);
        }
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
        setListLoading(true);
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
            setListLoading(false);
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

    const renderItem = ({ item, index }) => (
        <View
            style={{
                backgroundColor: '#fff',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 6,
                marginVertical: 7,
                marginHorizontal: 15,
                borderWidth: 1,
                borderColor: '#ddd',
                position: 'relative'
            }}
        >

            {/* INDEX */}
            <Text style={{
                fontSize: 11,
                color: '#2c3e50',
                marginBottom: 4,
                fontFamily: 'Inter-Bold'
            }}>
                #{index + 1}
            </Text>

            {/* NAME */}
            <Text style={{ marginTop: 2 }}>
                <Text style={{
                    fontSize: 13,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Name :
                </Text>

                <Text style={{
                    fontSize: 13,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{item.staff_name}
                </Text>
            </Text>

            {/* MOBILE */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Mobile :
                </Text>

                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{item.staff_mobile}
                </Text>
            </Text>

            {/* REMARK */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Remark :
                </Text>

                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{item.remark || '--'}
                </Text>
            </Text>

            {/* ENTRY DATE */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Entry On :
                </Text>

                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{formatDateTime(item.entry_date)}
                </Text>
            </Text>

            {/* MENU ICON */}
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
                        onPress={(event) => OpenModal(item, event)}
                        style={{
                            position: 'absolute',
                            right: 5,
                            top: 5,
                            padding: 6,
                        }}
                    >
                        <Entypo name="dots-three-vertical" size={18} color="#2c3e50" />
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
                    width: 90,
                    height: 90,
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
                        width: 50,
                        height: 50,
                        resizeMode: 'contain',
                    }}
                />
            </View>

            {/* Main Text */}
            <Text
                style={{
                    fontSize: 14,
                    color: 'red',
                    fontFamily: 'Inter-SemiBold',
                    textAlign: 'center',
                }}>
                {text}
            </Text>

            {/* Sub Text */}
            <Text
                style={{
                    fontSize: 11,
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
            {(listLoading || staffList.length > 0) && (
                <View
                    style={{
                        backgroundColor: '#fff',
                        margin: 10,
                        borderRadius: 12,
                        paddingHorizontal: 15,
                        flexDirection: 'row',
                        alignItems: 'center',
                        elevation: 3,
                        borderWidth: 1,
                        borderColor: colors.Brown,
                    }}
                >
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

                    {searchText?.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearchText('');
                                Keyboard.dismiss(); // optional 👈
                            }}
                        >
                            <AntDesign name="closecircle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {listLoading ? (<BlackListShimmer />
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
                    contentContainerStyle={{ paddingBottom: keyboardHeight + 80 }}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />

            )}

            <Modal
                visible={isModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setIsModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>

                        <View
                            style={{
                                position: 'absolute',
                                top: modalPositionRef.current.top,
                                left: modalPositionRef.current.left,
                                backgroundColor: 'white',
                                paddingVertical: 6,
                                borderRadius: 12,
                                width: 170,
                                elevation: 6,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                            }}
                        >
                            {/* Title */}
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: 'Inter-SemiBold',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    color: 'black',
                                }}
                            >
                                Select Action
                            </Text>

                            {/* Edit */}
                            {(
                                userType === 'SuperAdmin' ||
                                (userType === 'SubAdmin' && permissions?.black_list_staffs?.update) ||
                                (userType === 'main' && permissions?.black_list_staffs?.update)
                            ) && (
                                    <TouchableOpacity
                                        onPress={handleEdit}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderTopWidth: 1,
                                            borderColor: '#eee',
                                        }}
                                    >
                                        <AntDesign name="edit" size={16} color="#3B82F6" />
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                marginLeft: 8,
                                                color: '#3B82F6',
                                            }}
                                        >
                                            Edit Staff
                                        </Text>
                                    </TouchableOpacity>
                                )}

                            {/* Delete */}
                            {(
                                userType === 'SuperAdmin' ||
                                (userType === 'SubAdmin' && permissions?.black_list_staffs?.delete) ||
                                (userType === 'main' && permissions?.black_list_staffs?.delete)
                            ) && (
                                    <TouchableOpacity
                                        onPress={handleDelete}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderTopWidth: 1,
                                            borderColor: '#eee',
                                        }}
                                    >
                                        <AntDesign name="delete" size={16} color="#DC2626" />
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                marginLeft: 8,
                                                color: '#DC2626',
                                            }}
                                        >
                                            Delete Staff
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
