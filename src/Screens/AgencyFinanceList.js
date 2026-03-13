
import { Text, TouchableOpacity, View, FlatList, ActivityIndicator, Image, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import CheckBox from '@react-native-community/checkbox';
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../CommonFiles/Constant';
import Toast from 'react-native-toast-message';

const AgencyFinanceList = () => {
    const Finance = require('../assets/images/budget.png');
    const check = require('../assets/images/check.png');
    const navigation = useNavigation();
    const route = useRoute();
    const { agencyId, agencyName } = route.params || {};
    console.log("agency id and agency name", agencyId, agencyName);


    const [financeList, setFinanceList] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filteredList, setFilteredList] = useState([]);
    const [tempFinanceList, setTempFinanceList] = useState([]);
    const [selectAll, setSelectAll] = useState(false);


    const [loading, setLoading] = useState(false);


    // const AgencyStaffLogout = async (navigation, confirmLogout) => {
    //     try {
    //         const staffId = await AsyncStorage.getItem('staff_id');

    //         if (!staffId) {
    //             
    //             return;
    //         }

    //         const response = await fetch(ENDPOINTS.Staff_Agency_Logout, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ staff_id: staffId }),
    //         });

    //         const result = await response.json();

    //         if (result.code === 200) {
    //             const staffStatus = result?.payload?.[0]?.staff_status;

    //             if (staffStatus === 'Deactive') {

    //                 confirmLogout(); // Trigger logout
    //             } else {

    //             }
    //         } else {
    //          
    //         }
    //     } catch (error) {
    //         console.log('Logout error:', error.message);
    //         
    //     }
    // };


    // useFocusEffect(
    //     React.useCallback(() => {
    //         AgencyStaffLogout(navigation, confirmLogout);
    //     }, [])
    // );


    const confirmLogout = async () => {
        await AsyncStorage.removeItem('id'); // User data clear karega
        await AsyncStorage.removeItem('selected_agency'); // User data clear karega
        navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }], // LoginScreen par redirect karega
        });

    };

    useEffect(() => {
        fetchFinanceList();
    }, []);

    const fetchFinanceList = async () => {
        const storedAgencyId = await AsyncStorage.getItem('rent_agency_id');
        console.log("Api Called Successfully", storedAgencyId);
        const rentAgencyId = 0;

        try {
            setLoading(true);

            const response = await fetch(ENDPOINTS.easyreppo_Finance_List(rentAgencyId, agencyId));
            console.log(response);
            const result = await response.json();

            if (response.ok && result.code == 200 && Array.isArray(result.payload)) {

                const cleanedPayload = result.payload.map(item => ({
                    ...item,
                    staff_checkbox: String(item.staff_checkbox).toLowerCase() === 'true'
                }));
                setFinanceList(cleanedPayload);
                setFilteredList(cleanedPayload);

            } else {
                // Show empty list or default dummy list
                setFinanceList([]); // or your static demo list
                setFilteredList([]);

            }
        } catch (error) {
            console.log("Error fetching finance list:", error.message);
            setFinanceList([]); // or your static demo list
            setFilteredList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isEditMode) return;

        const allChecked =
            tempFinanceList.length > 0 &&
            tempFinanceList.every(item => item.staff_checkbox === true);

        setSelectAll(allChecked);
    }, [tempFinanceList, isEditMode]);


    const toggleSelectAll = () => {
        const newValue = !selectAll;
        setSelectAll(newValue);

        const updatedList = tempFinanceList.map(item => ({
            ...item,
            staff_checkbox: newValue
        }));

        setTempFinanceList(updatedList);
    };


    const handleSearch = (text) => {
        setSearchText(text);

        if (text.trim() === '') {
            setFilteredList(financeList);
        } else {
            const filtered = financeList.filter(item =>
                item.finance_name?.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredList(filtered);
        }
    };

    const toggleEditMode = () => {
        if (!isEditMode) {
            // entering edit mode
            setTempFinanceList(JSON.parse(JSON.stringify(financeList)));
        }
        setIsEditMode(!isEditMode);
    };


    const toggleCheckbox = (index) => {
        const updatedList = [...tempFinanceList];
        updatedList[index].staff_checkbox = !updatedList[index].staff_checkbox;
        setTempFinanceList(updatedList);
    };



    const handleSave = async () => {

        try {
            const selectedItems = tempFinanceList.filter(item => item.staff_checkbox);
            const financeNames = selectedItems.map(item => item.finance_name).join(',');

            const body = {
                agency_id: agencyId,
                finance_data: financeNames
            };

            console.log("Sending this data:", body); // 👀 Debug check
            const response = await fetch(ENDPOINTS.easyreppo_finance_update, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (result.code === 200) {
                Toast.show({
                    type: 'success',
                    text1: 'List updated successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000, // SHORT duration
                }); setFinanceList(tempFinanceList); // 🔥 permanent save
                setFilteredList(tempFinanceList);
                setIsEditMode(false);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to update list',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000, // SHORT duration
                });
            }
        } catch (error) {
            console.log("Error updating list:", error.message);
        }
    };


    const renderItem = ({ item, index }) => {
        // console.log(`Item ${index} - staff_checkbox:`, item.staff_checkbox);
        return (
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#f9f9f9',
                    borderRadius: 8,
                    padding: 4,
                    marginBottom: 8,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                    borderWidth: 0.5
                }}
                onPress={() => isEditMode && toggleCheckbox(index)}
                activeOpacity={isEditMode ? 0.6 : 1}
            >
                <CheckBox
                    disabled={!isEditMode}
                    value={item.staff_checkbox === true}
                    onValueChange={() => toggleCheckbox(index)}
                    tintColors={{
                        true: colors.Brown,
                        false: '#999',       // unchecked visible rahega
                    }}
                />
                <Text style={{ fontSize: 12, color: '#333', marginLeft: 10, fontFamily: 'Inter-Regular' }}>{item.finance_name}</Text>
                {item.staff_checkbox && (
                    <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row' }}>
                        <Image
                            source={check}
                            style={{ width: 20, height: 20 }}
                            resizeMode="contain"
                        />
                    </View>
                )}
            </TouchableOpacity>
        );
    };
    return (
        <View style={{ flex: 1, backgroundColor: '#F0F0F0' }}>
            {/* Header */}
            <View style={{
                backgroundColor: colors.Brown,
                paddingVertical: 20,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <TouchableOpacity
                    style={{
                        width: '15%',
                        position: 'absolute',
                        left: 6,
                        top: 3,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',

                    }}
                    onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>
                <View style={{ flex: 1, paddingHorizontal: 10, flexDirection: 'row', }}>
                    <Text
                        style={{
                            marginLeft: 35,
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 'bold',
                            fontFamily: 'Inter-Bold',
                            flexWrap: 'wrap',
                            textAlign: 'right',
                            marginRight: 2,
                            flexShrink: 1,         // Allow text to shrink if needed
                            width: '35%',
                            textTransform: 'uppercase'

                        }}
                        numberOfLines={1}

                    >
                        {agencyName}

                    </Text>
                    <Text style={{
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Bold',
                    }}>- FINANCE LIST
                    </Text>

                </View>
                {financeList.length !== 0 ? (
                    <View
                        style={{
                            width: '15%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'absolute',
                            right: 6,
                            top: 3,

                            height: 50,


                        }}>

                        <TouchableOpacity onPress={toggleEditMode}>
                            <Ionicons name={isEditMode ? 'close' : 'create-outline'} size={24} color="white" />
                        </TouchableOpacity>

                    </View>
                ) : null}


            </View>

            {isEditMode && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 15,
                    paddingVertical: 8,
                    backgroundColor: '#fff',
                    borderBottomWidth: 1,
                    borderColor: '#eee'
                }}>
                    <CheckBox
                        value={selectAll}
                        onValueChange={toggleSelectAll}
                        tintColors={{ true: colors.Brown, false: '#999' }}
                    />
                    <Text style={{
                        marginLeft: 8,
                        fontFamily: 'Inter-Regular',
                        color: '#333'
                    }}>
                        Select All
                    </Text>
                </View>
            )}


            {/* Search Bar */}
            {financeList.length !== 0 && (
                <View style={{
                    backgroundColor: '#fff',
                    margin: 10,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    borderWidth: 1,
                    borderColor: '#ddd'
                }}>
                    <Ionicons name="search" size={18} color="#999" />
                    <TextInput
                        placeholder="Search finance..."
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={handleSearch}
                        style={{
                            flex: 1,
                            padding: 8,
                            color: '#000',
                            fontFamily: 'Inter-Regular'
                        }}
                    />
                    {searchText !== '' && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            )}


            {/* List */}
            {
                loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.Brown} />
                        <Text style={{ marginTop: 10, color: 'gray', fontFamily: 'Inter-Regular' }}>Loading Finance List...</Text>
                    </View>
                ) : financeList.length === 0 ? (
                    <View style={{ height: 700, justifyContent: 'center', alignItems: 'center' }}>
                        <Image source={Finance} style={{ width: 70, height: 70 }} />
                        <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                            No Finance Yet
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        keyboardShouldPersistTaps='handled'
                        data={isEditMode ? tempFinanceList : filteredList}

                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 10 }}
                    />

                )
            }

            {/* Save Button */}
            {isEditMode && (
                <TouchableOpacity
                    style={{
                        backgroundColor: colors.Brown,
                        margin: 20,
                        paddingVertical: 12,
                        borderRadius: 8,
                        alignItems: 'center'
                    }}
                    onPress={handleSave}
                >
                    <Text style={{
                        color: 'white',
                        fontSize: 16,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Regular'
                    }}>
                        Update
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default AgencyFinanceList;
