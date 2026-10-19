import { ActivityIndicator, FlatList, Image, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View, TextInput, ScrollView } from 'react-native'
import React, { useCallback, useState } from 'react'
import colors from '../CommonFiles/Colors'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const OtherAppVehicleReport = () => {
    const Staff = require('../assets/images/team.png');
    const navigation = useNavigation();
    const route = useRoute();
    const { Id, Name } = route.params || {};

    const [StaffLoading, setStaffLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [text, setText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [originalData, setOriginalData] = useState([]);
    const [visibleData, setVisibleData] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0); // sabhi files ke total vehicle records ka sum

    // 🔥 API response me field ka naam jo bhi ho, yahan se pick kar lega (fallback chain)
    const getField = (item, keys) => {
        for (const k of keys) {
            if (item[k] !== undefined && item[k] !== null && item[k] !== '') return item[k];
        }
        return null;
    };

    const getFileName = (item) => getField(item, ['file_name', 'csv_file_name', 'upload_file_name', , 'vehicle_upload_file_name', 'csv_name']);
    const getFinanceName = (item) => getField(item, ['finance_name', 'finance', 'vehicle_finance_name']);
    const getRecordCount = (item) => getField(item, ['total_vehicle', 'total_records', 'total_count', 'vehicle_count', 'record_count', 'total_count']);
    const getUploadDate = (item) => getField(item, ['entry_date', 'entrydate', 'upload_date', 'created_at', 'vehicle_entry_date']);

    const formatDateTime = (dateString) => {
        if (!dateString) return '--';
        const dateObj = new Date(dateString);
        if (isNaN(dateObj)) return dateString;

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();

        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
    };

    const fetchData = async () => {
        setStaffLoading(true);
        try {
            const response = await fetch(
                'https://easyseizing.in/admin/admin/api-1.0/view_all_full_vehicle_csv_file_newuse.php',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}), // agar rent_agency_id ya koi aur param chahiye ho to yaha add kar dena
                }
            );

            const result = await response.json();
            console.log('vehicle csv file result', result);

            const payload = result?.payload || result?.data || [];

            if (response.ok && (result.code === 200 || Array.isArray(payload))) {
                setOriginalData(payload);
                setVisibleData(payload);

                // 👇 total_records = sabhi files ke andar ke total vehicle count ka sum
                const sum = payload.reduce((acc, item) => acc + (Number(getRecordCount(item)) || 0), 0);
                setTotalRecords(sum);
            } else {
                setOriginalData([]);
                setVisibleData([]);
                setTotalRecords(0);
            }
        } catch (error) {
            console.log('Error fetching vehicle csv data:', error.message);
            setOriginalData([]);
            setVisibleData([]);
            setTotalRecords(0);
        } finally {
            setStaffLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (text !== '') {
                handleTextChange(text);
            } else {
                fetchData();
            }
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        setText('');
        await fetchData();
        setRefreshing(false);
    };

    const handleTextChange = (inputText) => {
        setText(inputText);

        if (inputText === '') {
            setVisibleData(originalData);
        } else {
            const lowerCaseInput = inputText.toLowerCase();
            const filtered = originalData.filter((item) => {
                const fileName = (getFileName(item) || '').toLowerCase();
                const financeName = (getFinanceName(item) || '').toLowerCase();
                return fileName.includes(lowerCaseInput) || financeName.includes(lowerCaseInput);
            });
            setVisibleData(filtered);
        }
    };

    const getFileIcon = (fileName) => {
        if (!fileName) return 'file';
        const ext = fileName.split('.').pop().toLowerCase();
        if (ext === 'csv') return 'file-csv';
        if (['xls', 'xlsx'].includes(ext)) return 'file-excel';
        if (ext === 'pdf') return 'file-pdf';
        return 'file-alt';
    };

    const renderItem = ({ item, index }) => (
        <View
            style={{
                backgroundColor: '#fff',
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                marginVertical: 7,
                marginHorizontal: 15,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                position: 'relative',
                elevation: 3,
            }}
        >
            {/* ✅ VEHICLES TOP RIGHT */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#EFF6FF',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderTopRightRadius: 10,
                    borderBottomLeftRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
                <Ionicons name="car-outline" size={12} color="#2563EB" />
                <Text style={{ fontSize: 10, color: '#2563EB', fontFamily: 'Inter-Bold' }}>
                    {getRecordCount(item) ?? 0} Vehicles
                </Text>
            </View>

            {/* INDEX */}
            <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontFamily: 'Inter-Bold' }}>
                #{index + 1}
            </Text>

            {/* FINANCE NAME */}
            <Text>
                <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Inter-Bold' }}>
                    Finance Name:
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                    {' '}{getFinanceName(item) || '--'}
                </Text>
            </Text>

            {/* FILE NAME */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                <FontAwesome5
                    name={getFileIcon(getFileName(item))}
                    size={12}
                    color="#16A34A"
                    style={{ marginRight: 6 }}
                />
                <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Inter-Bold' }}>
                    File:
                </Text>
                <Text
                    style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular', flex: 1 }}
                    numberOfLines={1}
                >
                    {' '}{getFileName(item) || '--'}
                </Text>
            </View>

            {/* ENTRY DATE */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Inter-Bold' }}>
                    Entry On:
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                    {' '}{formatDateTime(getUploadDate(item))}
                </Text>
            </Text>

            {/* INFO ICON (commented)
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
        */}
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
                <Text
                    style={{
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Bold',
                    }}
                >
                    File List
                </Text>
            </View>

            {/* TOP COUNT CARDS */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 15, marginTop: 12, gap: 10 }}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: colors.Brown,
                        borderRadius: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        elevation: 4,
                        shadowColor: '#000',
                        shadowOpacity: 0.15,
                        shadowRadius: 5,
                    }}
                >
                    <View>
                        <Text style={{ color: 'white', fontSize: 12, fontFamily: 'Inter-Regular' }}>
                            Total Files
                        </Text>
                        <Text style={{ color: 'white', fontSize: 20, fontFamily: 'Inter-Bold', marginTop: 2 }}>
                            {originalData.length}
                        </Text>
                    </View>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <FontAwesome5 name="file-alt" size={17} color="white" />
                    </View>
                </View>

                <View
                    style={{
                        flex: 1,
                        backgroundColor: '#16A34A',
                        borderRadius: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        elevation: 4,
                        shadowColor: '#000',
                        shadowOpacity: 0.15,
                        shadowRadius: 5,
                    }}
                >
                    <View>
                        <Text style={{ color: 'white', fontSize: 12, fontFamily: 'Inter-Regular' }}>
                            Total Vehicles
                        </Text>
                        <Text style={{ color: 'white', fontSize: 20, fontFamily: 'Inter-Bold', marginTop: 2 }}>
                            {totalRecords}
                        </Text>
                    </View>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="car-sport-outline" size={20} color="white" />
                    </View>
                </View>
            </View>

            {/* SEARCH BAR */}
            <View style={{ width: '100%', paddingHorizontal: 10, marginTop: 12 }}>
                <View
                    style={{
                        width: '100%',
                        borderWidth: 1,
                        borderColor: colors.Brown,
                        marginBottom: 5,
                        borderRadius: 8,
                        height: 50,
                        backgroundColor: 'white',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <View style={{ width: 30, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                        <MaterialIcons name="search" size={24} color="black" />
                    </View>
                    <TextInput
                        style={{
                            flex: 1,
                            fontSize: 16,
                            fontFamily: 'Inter-Regular',
                            color: 'black',
                            height: 50,
                        }}
                        placeholder="Search by Finance or File Name"
                        placeholderTextColor="grey"
                        value={text}
                        onChangeText={handleTextChange}
                    />
                    {text ? (
                        <TouchableOpacity
                            onPress={() => {
                                setText('');
                                setVisibleData(originalData);
                            }}
                            style={{
                                marginRight: 10,
                                backgroundColor: '#f0f0f0',
                                borderRadius: 20,
                                padding: 6,
                                elevation: 2,
                                shadowColor: '#000',
                                shadowOpacity: 0.1,
                                shadowRadius: 3,
                            }}
                        >
                            <Entypo name="cross" size={18} color="black" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            <FlatList
                keyboardShouldPersistTaps="handled"
                data={visibleData}
                renderItem={renderItem}
                keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
                removeClippedSubviews={true}
                ListEmptyComponent={
                    StaffLoading ? (
                        <View style={{ padding: 10 }}>
                            <ActivityIndicator size="large" color={colors.Brown} />
                        </View>
                    ) : (
                        <View style={{ height: 400, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={Staff} style={{ width: 70, height: 70 }} />
                            <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                                No Vehicle Data Files Found
                            </Text>
                        </View>
                    )
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.Brown, colors.Brown]} />
                }
                contentContainerStyle={{
                    paddingBottom: 80,
                    backgroundColor: 'white',
                }}
            />

            {/* DETAIL MODAL */}
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
                        padding: 10,
                    }}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%', paddingVertical: 5 }}>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={{ marginRight: 5, backgroundColor: 'white', borderRadius: 50 }}
                        >
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
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={(e) => e.stopPropagation()}
                    >
                        <View
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#e4dedeff',
                                borderWidth: 1,
                                borderColor: 'black',
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: 'Inter-Bold',
                                    fontSize: 15,
                                    paddingVertical: 5,
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    color: 'black',
                                }}
                            >
                                Vehicle File Detail
                            </Text>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {selectedItem &&
                                [
                                    { label: 'Finance Name', value: getFinanceName(selectedItem) || '----' },
                                    { label: 'File Name', value: getFileName(selectedItem) || '----' },
                                    { label: 'Total Vehicles', value: getRecordCount(selectedItem) ?? '----' },
                                    { label: 'Uploaded On', value: formatDateTime(getUploadDate(selectedItem)) || '----' },
                                ].map((item, index) => (
                                    <View key={index} style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}>
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
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {item.label}
                                            </Text>
                                        </View>

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
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {String(item.value)}
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

export default OtherAppVehicleReport

const styles = StyleSheet.create({})