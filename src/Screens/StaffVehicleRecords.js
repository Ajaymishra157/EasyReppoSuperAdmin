import { ActivityIndicator, FlatList, Image, Modal, RefreshControl, StyleSheet, Text, ToastAndroid, TouchableOpacity, View, TextInput, ScrollView } from 'react-native'
import React, { useCallback, useState } from 'react'
import colors from '../CommonFiles/Colors'
import { ENDPOINTS } from '../CommonFiles/Constant';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import StaffShimmer from '../Component/StaffShimmer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


const StaffVehicleRecords = () => {
    const Staff = require('../assets/images/team.png');
    const [StaffList, setStaffList] = useState([]);
    const [originalStaffData, setoriginalStaffData] = useState([]);
    const [StaffLoading, setStaffLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [text, setText] = useState('');
    const [modalVisible, setModalVisible] = useState(false); // Modal show/hide
    const [selectedItem, setSelectedItem] = useState(null);

    const navigation = useNavigation();

    const fetchData = async () => {
        setStaffLoading(true);
        try {


            const response = await fetch(ENDPOINTS.list_staff_vehicle_records, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },

            });

            const result = await response.json();

            if (response.ok) {
                if (result.code === 200) {
                    setStaffList(result.payload); // Successfully received data
                    setoriginalStaffData(result.payload);
                } else {
                    console.log('Error:', 'Failed to load staff data');
                }
            } else {
                console.log('HTTP Error:', result.message || 'Something went wrong');
            }
        } catch (error) {
            console.log('Error fetching data:', error.message);
        } finally {
            setStaffLoading(false);
        }
    };


    useFocusEffect(
        useCallback(() => {

            if (text != '') {
                handleTextChange(text);
            } else {
                fetchData();
            }
        }, [text]), // Empty array ensures this is called only when the screen is focused
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            key={item.id}
            style={{
                flexDirection: 'row',
                backgroundColor: '#fff',
                padding: 10,
                marginHorizontal: 13,
                marginBottom: 7,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#ddd',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
            activeOpacity={0.8}
        >
            {/* Left: Staff Info with Labels */}
            <View style={{ flexDirection: 'column', flex: 1 }}>
                {/* Staff Name */}
                <View style={{ flexDirection: 'row', marginBottom: 4, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Inter-Bold', color: 'gray', width: 120 }}>
                        Staff Name:
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: 'black', flex: 1, flexWrap: 'wrap' }}>
                        {item.staff_name || '----'}
                    </Text>
                </View>

                {/* Vehicle Registration Number */}
                <View style={{ flexDirection: 'row', marginBottom: 4, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Inter-Bold', color: 'gray', width: 120 }}>
                        Registration No:
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: 'black', flex: 1, flexWrap: 'wrap' }}>
                        {item.vehicle_registration_number || '----'}
                    </Text>
                </View>

                {/* Vehicle Name */}
                <View style={{ flexDirection: 'row', marginBottom: 4, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Inter-Bold', color: 'gray', width: 120 }}>
                        Vehicle Name:
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: 'black', flex: 1, flexWrap: 'wrap' }}>
                        {item.vehicle_name || '----'}
                    </Text>
                </View>
            </View>



            {/* Right: Info Icon */}
            <TouchableOpacity
                onPress={() => {
                    setSelectedItem(item);   // Modal me ye item show hoga
                    setModalVisible(true);   // Modal open
                }}
                style={{
                    width: 35,
                    height: 35,
                    borderRadius: 18,
                    backgroundColor: '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <AntDesign name="infocirlceo" size={20} color="black" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();

        setText('');
        setRefreshing(false);
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
                    item.vehicle_registration_number.toLowerCase().includes(lowerCaseInput)


                );
            });

            setStaffList(filtered); // Update filtered data state
        }
    };


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
                    Staff Vehicle Record
                </Text>

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

                        placeholder="Search Staff Name/Rc No"
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
            <FlatList
                keyboardShouldPersistTaps='handled'
                data={StaffList}
                renderItem={renderItem}

                keyExtractor={(item) => item.id.toString()}
                removeClippedSubviews={true}

                ListEmptyComponent={
                    StaffLoading ? (
                        <View style={{ padding: 10 }}>
                            {[...Array(7)].map((_, index) => (
                                <StaffShimmer key={index} />
                            ))}
                        </View>
                    ) : (
                        <View style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={Staff} style={{ width: 70, height: 70 }} />
                            <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                                No Staff Vehicle Record Found
                            </Text>
                        </View>
                    )
                }

                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#9Bd35A', '#689F38']}
                    />
                }
                contentContainerStyle={{
                    paddingBottom: 80,
                    backgroundColor: 'white',
                }}
            />
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        padding: 10

                    }}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            width: '100%',
                            paddingVertical: 5,
                        }}>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={{
                                marginRight: 5,
                                backgroundColor: 'white',
                                borderRadius: 50,
                            }}>
                            <Entypo name="cross" size={25} color="black" />
                        </TouchableOpacity>
                    </View>

                    <View
                        style={{
                            width: '100%',
                            maxHeight: '80%',
                            backgroundColor: '#fff',
                            borderRadius: 10,
                            padding: 20,
                        }}
                        onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
                        onTouchEnd={e => e.stopPropagation()}
                    >
                        <View
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#e4dedeff',
                                borderWidth: 1, borderColor: 'black'
                            }}>
                            <Text
                                style={{
                                    fontFamily: 'Inter-Bold',
                                    fontSize: 15,
                                    paddingVertical: 5,

                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    color: 'black'
                                }}
                            >
                                Staff & Vehicle Details
                            </Text>
                        </View>

                        {/* Details */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {selectedItem &&
                                [
                                    { label: 'Staff Name', value: selectedItem.staff_name || '----' },
                                    { label: 'Vehicle Name', value: selectedItem.vehicle_name || '----' },
                                    { label: 'Registration No', value: selectedItem.vehicle_registration_number || '----' },
                                    { label: 'Engine No', value: selectedItem.vehicle_engine_number || '----' },
                                    { label: 'Chasis No', value: selectedItem.vehicle_chesis_number || '----' },
                                    { label: 'Agreement No', value: selectedItem.vehicle_agreement_number || '----' },
                                    { label: 'Customer', value: selectedItem.customer_name || '----' },
                                    { label: 'Finance Person', value: selectedItem.finance_person_name || '----' },
                                    { label: 'Finance Contact', value: selectedItem.finance_contact_number || '----' },
                                ].map((item, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            width: '100%',
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {/* Label */}
                                        <View
                                            style={{
                                                width: '40%',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderLeftWidth: 1,
                                                borderBottomWidth: 1,
                                                borderColor: 'black',
                                                padding: 5,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    fontFamily: 'Inter-Regular',
                                                    color: 'black',
                                                    textAlign: 'left',
                                                    flexWrap: 'wrap',
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {item.label}
                                            </Text>
                                        </View>



                                        {/* Value */}
                                        <View
                                            style={{
                                                width: '60%',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderLeftWidth: 1,
                                                borderBottomWidth: 1,
                                                borderRightWidth: 1,
                                                borderColor: 'black',
                                                padding: 5,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    fontFamily: 'Inter-Bold',
                                                    color: 'black',
                                                    textAlign: 'left',
                                                    flexWrap: 'wrap',
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {item.value}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                        </ScrollView>




                    </View>
                </TouchableOpacity>
            </Modal>


        </View>
    )
}

export default StaffVehicleRecords

const styles = StyleSheet.create({})