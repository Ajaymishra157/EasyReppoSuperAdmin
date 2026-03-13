import { ActivityIndicator, FlatList, Image, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View, TextInput, ScrollView } from 'react-native'
import React, { useCallback, useState } from 'react'
import colors from '../CommonFiles/Colors'
import { ENDPOINTS } from '../CommonFiles/Constant';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import StaffVehicleShimmer from '../Component/StaffVehicleShimmer';


const StaffVehicleRecords = () => {
    const Staff = require('../assets/images/team.png');
    const [StaffList, setStaffList] = useState([]);
    const [originalStaffData, setoriginalStaffData] = useState([]);
    const [StaffLoading, setStaffLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [text, setText] = useState('');
    const [modalVisible, setModalVisible] = useState(false); // Modal show/hide
    const [selectedItem, setSelectedItem] = useState(null);

    const ITEMS_PER_PAGE = 20;

    const [visibleData, setVisibleData] = useState([]);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const navigation = useNavigation();

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

    const loadMore = () => {
        if (!hasMore || loadingMore) return;

        setLoadingMore(true);

        setTimeout(() => {
            const nextPage = page + 1;
            const startIndex = page * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;

            const newData = StaffList.slice(startIndex, endIndex);

            setVisibleData(prev => [...prev, ...newData]);
            setPage(nextPage);
            setHasMore(endIndex < StaffList.length);
            setLoadingMore(false);
        }, 500); // small delay for smooth loader
    };

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

                    // 👇 Reset pagination
                    const firstBatch = result.payload.slice(0, ITEMS_PER_PAGE);
                    setVisibleData(firstBatch);
                    setPage(1);
                    setHasMore(result.payload.length > ITEMS_PER_PAGE);
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

            {/* INDEX (Optional - hata sakte ho agar nahi chahiye) */}
            <Text style={{
                fontSize: 11,
                color: '#2c3e50',
                marginBottom: 4,
                fontFamily: 'Inter-Bold'
            }}>
                #{index + 1}
            </Text>

            {/* STAFF NAME */}
            <Text style={{ marginTop: 2 }}>
                <Text style={{
                    fontSize: 13,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Staff Name :
                </Text>

                <Text style={{
                    fontSize: 13,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{item.staff_name || '--'}
                </Text>
            </Text>

            {/* REGISTRATION NUMBER */}
            <Text style={{ marginTop: 6 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Registration No :
                </Text>

                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{item.vehicle_registration_number || '--'}
                </Text>
            </Text>

            {/* VEHICLE NAME */}
            <Text style={{ marginTop: 6 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Vehicle Name :
                </Text>

                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{item.vehicle_name || '--'}
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
                    {" "}{formatDateTime(item.entrydate)}
                </Text>
            </Text>

            {/* INFO ICON */}
            <TouchableOpacity
                onPress={() => {
                    setSelectedItem(item);
                    setModalVisible(true);
                }}
                style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <AntDesign name="infocirlceo" size={18} color="#2c3e50" />
            </TouchableOpacity>

        </View>
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();

        setText('');
        setRefreshing(false);
    };


    const handleTextChange = (inputText) => {
        setText(inputText);

        let filteredData = [];

        if (inputText === '') {
            filteredData = originalStaffData;
        } else {
            const lowerCaseInput = inputText.toLowerCase();
            filteredData = originalStaffData.filter(item =>
                item.staff_name.toLowerCase().includes(lowerCaseInput) ||
                item.vehicle_registration_number.toLowerCase().includes(lowerCaseInput)
            );
        }

        setStaffList(filteredData);

        // 👇 Reset pagination
        const firstBatch = filteredData.slice(0, ITEMS_PER_PAGE);
        setVisibleData(firstBatch);
        setPage(1);
        setHasMore(filteredData.length > ITEMS_PER_PAGE);
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
            {(StaffLoading || originalStaffData.length > 0) && (
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
                                    setText('');
                                    setStaffList(originalStaffData);
                                }}
                                style={{
                                    marginRight: 10,
                                    backgroundColor: '#f0f0f0',
                                    borderRadius: 20,
                                    padding: 6,
                                    elevation: 2, // Android shadow
                                    shadowColor: '#000', // iOS shadow
                                    shadowOpacity: 0.1,
                                    shadowRadius: 3,
                                }}
                            >
                                <Entypo name="cross" size={18} color="black" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            )}
            <FlatList
                keyboardShouldPersistTaps='handled'
                data={visibleData}
                renderItem={renderItem}

                keyExtractor={(item) => item.id.toString()}
                removeClippedSubviews={true}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={5}
                ListEmptyComponent={
                    StaffLoading ? (
                        <StaffVehicleShimmer />
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
                        colors={['#022e29', '#022e29']}
                    />
                }
                contentContainerStyle={{
                    paddingBottom: 80,
                    backgroundColor: 'white',
                }}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={{ padding: 15 }}>
                            <ActivityIndicator size="small" color={colors.Brown} />
                        </View>
                    ) : null
                }
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
                                Staff Vehicle Confirm List
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
                                    { label: 'Finance Name', value: selectedItem.finance_name || '----' },
                                    { label: 'Finance Person Name', value: selectedItem.finance_person_name || '----' },
                                    { label: 'Finance Contact Number', value: selectedItem.finance_contact_number || '----' },

                                    { label: 'Files Upload Name', value: selectedItem.upload_file_name || '----' },
                                    { label: 'Entry On', value: formatDateTime(selectedItem.entrydate) || '----' },
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