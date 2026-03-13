import { FlatList, StyleSheet, Text, TouchableOpacity, View, Modal, RefreshControl, ActivityIndicator, TextInput, Image, Dimensions, TouchableWithoutFeedback } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { ENDPOINTS } from '../CommonFiles/Constant';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import AreaShimmer from '../Component/AreaShimmer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
const AreaList = () => {
    const navigation = useNavigation();
    const Map = require('../assets/images/map.png');
    const [AreaList, setAreaList] = useState([]);
    const [originalAreaData, setoriginalAreaData] = useState([]);
    const [text, setText] = useState(null);
    const SCREEN_HEIGHT = Dimensions.get('window').height;
    const MODAL_HEIGHT = 130;
    const [AreaListLoading, setAreaListLoading] = useState(false);
    const [ConfrimationModal, setConfrimationModal] = useState(false);
    const [SelectedArea, setSelectedArea] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const modalPositionRef = useRef({ top: 0, left: 0 });
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



    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(false);

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
        await fetchAreaList();
        await fetchPermissions();
        setRefreshing(false);
    };

    const handleDelete = () => {
        setConfrimationModal(true);
        setIsModalVisible(false);

        // Call Delete API with the selected staff ID
    };
    const closeconfirmodal = () => {
        setConfrimationModal(false); // Hide the modal
    };

    const OpenModal = (item, event) => {
        setSelectedArea(item);
        event.currentTarget.measure((x, y, width, height, pageX, pageY) => {

            let calculatedTop = pageY + height;

            // 👇 Check if modal will go outside screen
            if (pageY + height + MODAL_HEIGHT > SCREEN_HEIGHT) {
                // Open above the button
                calculatedTop = pageY - MODAL_HEIGHT;
            }

            modalPositionRef.current = {
                top: calculatedTop,
                left: pageX - 160,
            };
            setIsModalVisible(true); // Open the modal
        });
    };

    const handleCloseModal = () => {
        setIsModalVisible(false); // Close the modal
    };

    const handleEdit = () => {
        navigation.navigate('AddArea', {
            manage_email_id: SelectedArea.manage_email_id,
            manage_area_name: SelectedArea.manage_area_name,
            manage_address: SelectedArea.manage_address,
            manage_id: SelectedArea.manage_emailid, // You can pass more data if needed
        });
        handleCloseModal(); // Close the modal after action (optional, if applicable)
    };


    const DeleteAreaApi = async EmailId => {
        console.log("emaildid", EmailId);

        try {
            const response = await fetch(ENDPOINTS.Delete_Area, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    manage_email_id: EmailId,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                if (result.code === 200) {
                    Toast.show({
                        type: 'success',
                        text1: 'Area Deleted Successfully',
                        position: 'bottom',
                        bottomOffset: 60,
                        visibilityTime: 2000,
                    });
                    fetchAreaList();
                } else {
                    Toast.show({
                        type: 'error',
                        text1: 'Area not Deleted',
                        position: 'bottom',
                        bottomOffset: 60,
                        visibilityTime: 2000,
                    });
                    console.log('Error:', 'Failed to load staff data');
                }
            } else {
                console.log('HTTP Error:', result.message || 'Something went wrong');
            }
        } catch (error) {
            console.log('Error fetching data:', error.message);
        } finally {
        }
    };


    const fetchAreaList = async () => {
        setAreaListLoading(true);
        try {
            const response = await fetch(ENDPOINTS.Area_list);
            const result = await response.json();
            if (result.code === 200) {
                setAreaList(result.payload);  // Save the full list
                setoriginalAreaData(result.payload);
            } else {
                console.log('Error:', result.message);
            }
        } catch (error) {
            console.log('Error fetching data:', error.message);
        } finally {
            setAreaListLoading(false)
        }
    };




    // useEffect(() => {
    //     fetchAreaList();
    // }, []);
    useFocusEffect(
        useCallback(() => {
            setText('');
            fetchAreaList();
        }, []), // Empty array ensures this is called only when the screen is focused
    );

    // useFocusEffect(
    //     useCallback(() => {
    //         if (!text || text.trim() === '') {
    //             fetchAreaList();
    //         }
    //     }, [text])
    // );

    const handleTextChange = (inputText) => {
        setText(inputText);

        // If inputText is empty, show the original data
        if (inputText === '') {
            setAreaList(originalAreaData);  // Reset to original data
        } else {
            // Filter data based on Name, Reg No, or Agg No
            const filtered = originalAreaData.filter(item => {
                const lowerCaseInput = inputText.toLowerCase();
                return (
                    item.manage_area_name.toLowerCase().includes(lowerCaseInput)


                );
            });

            setAreaList(filtered); // Update filtered data state
        }
    };


    // Render each item in the table
    const renderItem = ({ item, index }) => (
        <View style={{ flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
            <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: 'black', fontFamily: 'Inter-Regular' }}>{index + 1 || '----'}</Text>
            </View>
            <View style={{ width: '40%', justifyContent: 'center', alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 14, color: 'black', fontFamily: 'Inter-Regular', textTransform: 'uppercase' }}>{item.manage_area_name || '----'}</Text>
            </View>
            <View style={{
                width: '40%', justifyContent: 'center', alignItems: 'flex-start'
            }}>
                <Text style={{ fontSize: 14, color: 'black', fontFamily: 'Inter-Regular', textTransform: 'capitalize' }}>{item.manage_address || '----'}</Text>
            </View>

            <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>

                {(
                    userType === 'SuperAdmin' ||
                    !permissions?.area ||
                    permissions?.area?.update ||
                    permissions?.area?.delete
                ) && (
                        <TouchableOpacity
                            onPress={(event) => OpenModal(item, event)}
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Entypo name="dots-three-vertical" size={18} color="black" />
                        </TouchableOpacity>
                    )}
            </View>
        </View>
    );




    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
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
                    Area List
                </Text>
            </View>
            {(AreaListLoading || originalAreaData.length > 0) && (
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

                            placeholder="Search Area Name"
                            placeholderTextColor="grey"
                            value={text}
                            onChangeText={handleTextChange}
                        />
                        {text ? (
                            <TouchableOpacity
                                onPress={() => {

                                    setText(''); // Clear the search text
                                    setAreaList(originalAreaData);

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
            )}

            {/* Table Header */}
            {AreaList.length > 0 && (
                <View style={{ backgroundColor: 'white' }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            backgroundColor: '#ddd',
                            padding: 7,
                            borderRadius: 5,
                        }}>
                        <View
                            style={{
                                width: '10%',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    fontFamily: 'Inter-Regular',
                                    textAlign: 'center',
                                    fontSize: 12,
                                    color: 'black',
                                }}>
                                #
                            </Text>
                        </View>
                        <View
                            style={{
                                width: '40%',
                                justifyContent: 'center',
                                alignItems: 'flex-start'
                            }}>
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    fontFamily: 'Inter-Regular',
                                    textAlign: 'center',
                                    fontSize: 12,
                                    color: 'black',
                                }}>
                                AREA
                            </Text>
                        </View>
                        <View
                            style={{
                                width: '40%',
                                justifyContent: 'center',
                                alignItems: 'flex-start'
                            }}>
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    fontFamily: 'Inter-Regular',
                                    textAlign: 'center',
                                    fontSize: 12,
                                    color: 'black',
                                }}>
                                LOCATION
                            </Text>
                        </View>


                        <View
                            style={{
                                width: '10%',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    fontFamily: 'Inter-Regular',
                                    textAlign: 'center',
                                    fontSize: 12,
                                    color: 'black',
                                }}>

                            </Text>
                        </View>

                    </View>


                </View>
            )}

            {/* Area List */}
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                {AreaListLoading ? (
                    <View style={{ padding: 10 }}>
                        <AreaShimmer />
                    </View>
                ) : AreaList.length === 0 ? (
                    <View style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
                        <Image source={Map} style={{ width: 70, height: 70 }} />
                        <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                            No Area Found
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        keyboardShouldPersistTaps='handled'
                        data={AreaList}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.manage_email_id.toString()}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#9Bd35A', '#689F38']}
                            />
                        }
                        contentContainerStyle={{ paddingBottom: 75 }}


                    />
                )}

            </View>

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
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'black', fontFamily: 'Inter-Medium' }}>
                            Confirm Delete
                        </Text>
                        <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
                            Are you sure you want to delete the Area ?
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
                                    if (SelectedArea) {
                                        DeleteAreaApi(SelectedArea.manage_email_id);  // Pass the selected area's manage_email_id to the delete API
                                    }
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

            <Modal
                visible={isModalVisible}
                animationType="fade"
                transparent
                onRequestClose={handleCloseModal}
            >
                <TouchableWithoutFeedback onPress={handleCloseModal}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>

                        <View
                            style={{
                                position: 'absolute',
                                top: modalPositionRef.current.top,
                                left: modalPositionRef.current.left,
                                backgroundColor: 'white',
                                paddingVertical: 6,
                                borderRadius: 12,
                                width: 180,
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

                            {/* Update Area */}
                            {(userType === 'SuperAdmin' ||
                                !permissions.area ||
                                permissions.area.update) && (
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderTopWidth: 1,
                                            borderColor: '#eee',
                                        }}
                                        onPress={handleEdit}
                                    >
                                        <AntDesign name="edit" size={18} color="#3B82F6" />
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                color: '#3B82F6',
                                                marginLeft: 8,
                                            }}
                                        >
                                            Update Area
                                        </Text>
                                    </TouchableOpacity>
                                )}

                            {/* Delete Area */}
                            {(userType === 'SuperAdmin' ||
                                !permissions.area ||
                                permissions.area.delete) && (
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderTopWidth: 1,
                                            borderColor: '#eee',
                                        }}
                                        onPress={handleDelete}
                                    >
                                        <AntDesign name="delete" size={18} color="#DC2626" />
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                color: '#DC2626',
                                                marginLeft: 8,
                                            }}
                                        >
                                            Delete Area
                                        </Text>
                                    </TouchableOpacity>
                                )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Sticky Add New Button */}



            {(
                userType === 'SuperAdmin' ||
                !permissions.area ||
                permissions.area.insert
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
                                navigation.navigate('AddArea');
                            }}>
                            <AntDesign name="plus" color="white" size={18} />

                        </TouchableOpacity>
                    </View>
                )}
        </View>
    )
}

export default AreaList

const styles = StyleSheet.create({})