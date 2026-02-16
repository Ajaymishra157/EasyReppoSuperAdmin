import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    Platform,
    ScrollView,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';
import React, { useEffect, useState } from 'react';
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ENDPOINTS } from '../CommonFiles/Constant';
import RNFS from 'react-native-fs';

const BORDER = '#E5E7EB';
const TEXT = '#222';

const AgencyFiles = () => {

    const route = useRoute();
    const navigation = useNavigation();
    const { agencyId, agencyName, agencyDetail } = route.params || {};
    const [loading, setLoading] = useState(true);


    const [search, setSearch] = useState('');
    const [filteredFiles, setFilteredFiles] = useState(fileList);

    const [fileList, setFileList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [keyboardVisible, setKeyboardVisible] = useState(false);


    const [downloadingItems, setDownloadingItems] = useState({});

    // ✅ DATE FORMAT FUNCTION
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');

        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);


    // ✅ FETCH API
    const fetchFileList = async () => {
        setLoading(true);
        try {
            const response = await fetch(ENDPOINTS.full_vehicle_detail_csv_upload, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rent_agency_id: agencyId }),
            });

            const result = await response.json();
            console.log("result", result);

            if (result.code == 200 && Array.isArray(result.payload)) {

                // 👉 Only required fields
                const formatted = result.payload.map(item => ({
                    file_name: item.vehicle_upload_file_name,
                    finance_name: item.vehicle_finance_name,
                    entry_date: item.entry_date,
                    status: item.vehicle_status,
                    upload_number: item.vehicle_excel_upload_number
                }));

                setFileList(formatted);
                setFilteredList(formatted);
            }

        } catch (error) {
            console.log('Fetch error:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFileList();
    }, []);

    // ✅ SEARCH (FAST)
    const handleSearch = (text) => {

        setSearch(text);

        if (!text) {
            setFilteredList(fileList);
            return;
        }

        const lower = text.toLowerCase();

        const filtered = fileList.filter(item =>
            item.finance_name?.toLowerCase().includes(lower) ||
            item.file_name?.toLowerCase().includes(lower)
        );

        setFilteredList(filtered);
    };

    const downloadExcel = async (uploadNumber, financeName) => {
        if (!uploadNumber || !agencyId) return;

        setDownloadingItems(prev => ({ ...prev, [uploadNumber]: true }));

        try {

            const excelUrl = `${ENDPOINTS.upload_number_wise_export}?vehicle_excel_upload_number=${uploadNumber}&rent_agency_id=${agencyId}`;

            const response = await fetch(excelUrl);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const blob = await response.blob();

            const reader = new FileReader();

            reader.onloadend = async () => {

                const base64data = reader.result.split(',')[1];

                const now = new Date();
                const day = String(now.getDate()).padStart(2, '0');
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const year = now.getFullYear();
                const hour = String(now.getHours()).padStart(2, '0');
                const minute = String(now.getMinutes()).padStart(2, '0');
                const second = String(now.getSeconds()).padStart(2, '0');

                const formattedDate = `${day}${month}${year}${hour}${minute}${second}`;

                const cleanFinanceName = (financeName || 'Excel')
                    .replace(/\s+/g, '')
                    .replace(/[^a-zA-Z0-9]/g, '');

                const fileName = `${cleanFinanceName}_${formattedDate}.xlsx`;

                const path =
                    Platform.OS === 'android'
                        ? `${RNFS.DownloadDirectoryPath}/${fileName}`
                        : `${RNFS.DocumentDirectoryPath}/${fileName}`;

                await RNFS.writeFile(path, base64data, 'base64');

                if (Platform.OS === 'android') {
                    await RNFS.scanFile(path);
                    ToastAndroid.show(`${fileName} saved to Downloads`, ToastAndroid.LONG);
                } else {
                    Alert.alert('Saved', `${fileName} saved successfully`);
                }
            };

            reader.readAsDataURL(blob);

        } catch (error) {
            console.log("Excel Download Error:", error);
            Alert.alert('Error', 'Failed to download Excel');
        } finally {
            setDownloadingItems(prev => ({ ...prev, [uploadNumber]: false }));
        }
    };





    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>

            {/* HEADER */}
            <View style={{
                backgroundColor: colors.Brown,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center'
            }}>

                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        left: 10,
                        top: 12,
                        padding: 5
                    }}
                    onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>

                <Text style={{
                    color: 'white',
                    fontSize: 20,
                    fontFamily: 'Inter-Bold'
                }}>
                    File List
                </Text>
            </View>

            {/* ✅ SEARCH BAR */}
            <View style={{
                margin: 10,
                backgroundColor: '#F9FAFB',
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: '#d3d5d8'
            }}>
                <Ionicons name="search-outline" size={18} color="#6B7280" />

                <TextInput
                    placeholder="Search by Finance or File name..."
                    placeholderTextColor="#9CA3AF"
                    value={search}
                    onChangeText={handleSearch}
                    style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 6,
                        fontFamily: 'Inter-Regular',
                        color: '#111827'
                    }}
                />

                {search.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <Ionicons name="close-circle" size={18} color="#6B7280" />
                    </TouchableOpacity>
                )}
            </View>


            <View style={{ flex: 1 }}>
                {loading ? (

                    // ⭐ CENTER LOADER
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 40
                    }}>
                        <ActivityIndicator size="large" color={colors.Brown} />

                        <Text style={{
                            marginTop: 10,
                            color: '#6B7280',
                            fontFamily: 'Inter-Medium'
                        }}>
                            Loading files...
                        </Text>
                    </View>

                ) : (




                    < FlatList
                        data={filteredList}
                        keyExtractor={(item, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 10, paddingBottom: keyboardVisible ? 340 : 30 }}
                        keyboardShouldPersistTaps='handled'
                        renderItem={({ item, index }) => (

                            <View style={{
                                backgroundColor: '#fff',
                                paddingVertical: 10,
                                paddingHorizontal: 14,
                                borderRadius: 10,
                                marginVertical: 7,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                position: 'relative',
                                elevation: 3
                            }}>

                                {/* ✅ STATUS TOP RIGHT */}
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    backgroundColor:
                                        item.status === "Active"
                                            ? '#DCFCE7'
                                            : '#FEE2E2',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderTopRightRadius: 10,
                                    borderBottomLeftRadius: 10,
                                }}>
                                    <Text style={{
                                        fontSize: 10,
                                        fontFamily: 'Inter-Bold',
                                        color:
                                            item.status === "Active"
                                                ? '#166534'
                                                : '#991B1B'
                                    }}>
                                        {item.status}
                                    </Text>
                                </View>


                                {/* INDEX */}
                                <Text style={{
                                    fontSize: 11,
                                    color: '#6B7280',
                                    marginBottom: 6,
                                    fontFamily: 'Inter-Bold'
                                }}>
                                    #{index + 1}
                                </Text>


                                {/* FINANCE */}
                                <Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#111827',
                                        fontFamily: 'Inter-Bold'
                                    }}>
                                        Finance Name:
                                    </Text>

                                    <Text style={{
                                        fontSize: 12,
                                        color: '#6B7280',
                                        fontFamily: 'Inter-Regular'
                                    }}>
                                        {" "}{item.finance_name}
                                    </Text>
                                </Text>


                                {/* FILE */}
                                <Text style={{ marginTop: 5 }}>
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#111827',
                                        fontFamily: 'Inter-Bold'
                                    }}>
                                        Excel File Name:
                                    </Text>

                                    <Text style={{
                                        fontSize: 12,
                                        color: '#6B7280',
                                        fontFamily: 'Inter-Regular'
                                    }}>
                                        {" "}{item.file_name}
                                    </Text>
                                </Text>


                                {/* DATE */}
                                <Text style={{ marginTop: 5 }}>
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#111827',
                                        fontFamily: 'Inter-Bold'
                                    }}>
                                        Entry On :
                                    </Text>

                                    <Text style={{
                                        fontSize: 12,
                                        color: '#6B7280',
                                        fontFamily: 'Inter-Regular'
                                    }}>
                                        {" "}{formatDateTime(item.entry_date)}
                                    </Text>
                                </Text>


                                {/* ✅ DOWNLOAD BOTTOM RIGHT */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => downloadExcel(item.upload_number, item.finance_name)}
                                    style={{
                                        position: 'absolute',
                                        bottom: 3,
                                        right: 3,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: colors.Brown,
                                        paddingVertical: 6,
                                        paddingHorizontal: 10,
                                        borderRadius: 8,
                                    }}
                                >
                                    {downloadingItems[item.upload_number] ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="download-outline" size={11} color="#fff" />
                                            <Text style={{
                                                color: '#fff',
                                                fontSize: 9,
                                                marginLeft: 4,
                                                fontFamily: 'Inter-Medium'
                                            }}>
                                                Download
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>


                            </View>
                        )}



                    />

                )}


            </View>





        </View>
    );
};

export default AgencyFiles;
