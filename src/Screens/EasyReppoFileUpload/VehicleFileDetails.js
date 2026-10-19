import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import RNFS from 'react-native-fs';
import React, { useCallback, useMemo, useState } from 'react';

import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../CommonFiles/Colors';
import { ENDPOINTS } from '../../CommonFiles/Constant'; // 👈 Check according to your project path

const VehicleFileDetails = () => {
    const navigation = useNavigation();

    const [search, setSearch] = useState('');
    const [fileList, setFileList] = useState([]);
    const [totalFiles, setTotalFiles] = useState(0);
    const [totalVehicles, setTotalVehicles] = useState(0);

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null); // jis file ko delete karna hai
    const [statusItem, setStatusItem] = useState(null); // jis file ka status badalna hai
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [downloadingItems, setDownloadingItems] = useState({});

    /* ---------- LIST API ---------- */
    const fetchFiles = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await fetch(ENDPOINTS.listvehiclerand, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // khali bhejne par saari agencies ki list aati hai (0 bhejoge to "Invalid Agency ID" aayega)
                body: JSON.stringify({ rent_agency_id: '' }),
            });
            const result = await res.json();

            if (result.code === 200 && Array.isArray(result.payload)) {
                setFileList(result.payload);
                setTotalFiles(Number(result.total_file_names) || result.payload.length);
                setTotalVehicles(Number(result.total_vehicle_count) || 0);
            } else {
                setFileList([]);
                setTotalFiles(0);
                setTotalVehicles(0);
            }
        } catch (error) {
            console.log('File list fetch error:', error.message);

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // screen par aate hi (aur upload se wapas aane par) list refresh
    useFocusEffect(
        useCallback(() => {
            fetchFiles();
        }, [])
    );

    /* ---------- DELETE ---------- */
    const confirmDelete = (item) => setDeleteItem(item);

    const onConfirmDelete = async () => {
        const item = deleteItem;
        setDeleteItem(null); // pehle modal band
        if (item) await handleDelete(item);
    };

    const handleDelete = async (item) => {
        try {
            setDeleting(true);

            const res = await fetch(ENDPOINTS.deletevehiclerand, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicle_excel_upload_number: item.vehicle_excel_upload_number,
                }),
            });
            const text = await res.text();
            console.log('delete response:', text);

            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid server response');
            }

            const ok =
                json.code === 200 ||
                json.status === true ||
                json.status === 'True' ||
                json.status === 'success';

            if (!ok) throw new Error(json.message || 'Delete failed');

            Toast.show({
                type: 'success',
                text1: json.message || 'File deleted successfully',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            });

            await fetchFiles();
        } catch (e) {
            console.log('Delete error:', e.message);
            Toast.show({
                type: 'error',
                text1: e.message || 'Delete failed',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            });
        } finally {
            setDeleting(false);
        }
    };

    // status field ka naam apni API ke hisab se badlo
    const isActive = (item) => {
        const s = String(item?.vehicle_status ?? '').toLowerCase();
        return s === 'active' || s === '1';
    };

    const onConfirmStatus = async () => {
        const item = statusItem;
        setStatusItem(null); // pehle modal band
        if (!item) return;

        const newStatus = isActive(item) ? 'Deactive' : 'Active';

        try {
            setStatusUpdating(true);

            const res = await fetch(ENDPOINTS.change_excel_status, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicle_excel_upload_number: item.vehicle_excel_upload_number,
                    vehicle_status: newStatus,
                }),
            });
            const json = await res.json();

            const ok =
                json.code === 200 ||
                json.status === true ||
                json.status === 'True' ||
                json.status === 'success';

            if (!ok) throw new Error(json.message || 'Status change failed');

            Toast.show({
                type: 'success',
                text1: json.message || `File ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully.`,
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            });

            await fetchFiles();
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: e.message || 'Status change failed',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            });
        } finally {
            setStatusUpdating(false);
        }
    };

    const downloadExcel = async (item) => {
        const uploadNumber = item.vehicle_excel_upload_number;
        const agencyId = item.rent_agency_id; // list API ke field ke hisab se badlo
        if (!uploadNumber) return;

        setDownloadingItems(prev => ({ ...prev, [uploadNumber]: true }));

        try {
            const excelUrl = `${ENDPOINTS.upload_number_wise_export}?vehicle_excel_upload_number=${uploadNumber}&rent_agency_id=${agencyId ?? ''}`;

            const response = await fetch(excelUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();

            // FileReader ko Promise me wrap kiya, taaki loader file save hone tak chale
            const base64data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const stamp = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

            const cleanFinanceName = (item.vehicle_finance_name || 'Excel')
                .replace(/\s+/g, '')
                .replace(/[^a-zA-Z0-9]/g, '');

            const fileName = `${cleanFinanceName}_${stamp}.xlsx`;

            const path =
                Platform.OS === 'android'
                    ? `${RNFS.DownloadDirectoryPath}/${fileName}`
                    : `${RNFS.DocumentDirectoryPath}/${fileName}`;

            await RNFS.writeFile(path, base64data, 'base64');

            if (Platform.OS === 'android') {
                await RNFS.scanFile(path);
                Toast.show({
                    type: 'success',
                    text1: `${fileName} saved to Downloads`,
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 3500,
                });
            } else {
                Alert.alert('Saved', `${fileName} saved successfully`);
            }
        } catch (error) {
            console.log('Excel Download Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Download failed',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            });
        } finally {
            setDownloadingItems(prev => ({ ...prev, [uploadNumber]: false }));
        }
    };

    /* ---------- HELPERS ---------- */
    const formatDateTime = (dateString) => {
        if (!dateString) return '--';
        const str = String(dateString).trim();
        const hasTime = str.length > 10; // API date + time bheje to time bhi dikhega
        const date = new Date(hasTime ? str.replace(' ', 'T') : `${str}T00:00:00`);
        if (isNaN(date)) return '--';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        if (!hasTime) return `${day}-${month}-${year}`;

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const getFileIcon = (fileName) => {
        if (!fileName) return 'file';
        const ext = fileName.trim().split('.').pop().toLowerCase();
        if (ext === 'csv') return 'file-csv';
        if (['xls', 'xlsx'].includes(ext)) return 'file-excel';
        return 'file-alt';
    };

    // ✅ SEARCH (list refresh hone par bhi filter bana rahega)
    const filteredList = useMemo(() => {
        if (!search) return fileList;
        const lower = search.toLowerCase();
        return fileList.filter(
            (item) =>
                item.vehicle_finance_name?.toLowerCase().includes(lower) ||
                item.vehicle_upload_file_name?.toLowerCase().includes(lower)
        );
    }, [search, fileList]);

    // Add New Excel → mapping wala flow
    const handleAddExcel = () => navigation.navigate('VehicleFileUpload', { fileType: 'excel' });
    // Add New → CSV ya Excel dono, mapping nahi, direct upload
    const handleAddDirect = () => navigation.navigate('VehicleFileUpload', { fileType: 'direct' });

    /* ---------- LIST ITEM ---------- */
    const renderItem = ({ item, index }) => (
        <View
            style={{
                backgroundColor: '#fff',
                paddingTop: 10,
                paddingBottom: 34,
                paddingHorizontal: 14,
                borderRadius: 10,
                marginVertical: 7,
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
                    gap: 5,
                }}
            >
                <Ionicons name="car-outline" size={12} color="#2563EB" />
                <Text style={{ fontSize: 11, fontFamily: 'Inter-Bold', color: '#2563EB' }}>
                    {item.total_count} Vehicles
                </Text>
            </View>

            {/* INDEX */}
            <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontFamily: 'Inter-Bold' }}>
                #{index + 1}
            </Text>

            {/* FINANCE */}
            <Text>
                <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Inter-Bold' }}>
                    Finance Name:
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                    {' '}{item.vehicle_finance_name}
                </Text>
            </Text>

            {/* FILE */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                <FontAwesome5
                    name={getFileIcon(item.vehicle_upload_file_name)}
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
                    {' '}{item.vehicle_upload_file_name}
                </Text>
            </View>

            {/* DATE */}
            <Text style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Inter-Bold' }}>
                    Entry On:
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' }}>
                    {' '}{formatDateTime(item.entry_date)}
                </Text>
            </Text>

            {/* ✅ DELETE BOTTOM RIGHT */}
            {/* STATUS + DELETE BOTTOM RIGHT */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                {/* STATUS BUTTON */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setStatusItem(item)}
                    disabled={statusUpdating || deleting}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isActive(item) ? '#DCFCE7' : '#F3F4F6',
                        borderWidth: 1,
                        borderColor: isActive(item) ? '#16A34A' : '#9CA3AF',
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                    }}
                >
                    <Ionicons
                        name={isActive(item) ? 'checkmark-circle' : 'close-circle'}
                        size={12}
                        color={isActive(item) ? '#16A34A' : '#6B7280'}
                    />
                    <Text
                        style={{
                            color: isActive(item) ? '#16A34A' : '#6B7280',
                            fontSize: 10,
                            marginLeft: 4,
                            fontFamily: 'Inter-Medium',
                        }}
                    >
                        {isActive(item) ? 'Active' : 'Deactive'}
                    </Text>
                </TouchableOpacity>

                {/* DELETE BUTTON (icon only) */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => confirmDelete(item)}
                    disabled={deleting}
                    style={{
                        backgroundColor: '#DC2626',
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="trash-outline" size={14} color="#fff" />
                </TouchableOpacity>

                {/* DOWNLOAD BUTTON (icon only) */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => downloadExcel(item)}
                    disabled={!!downloadingItems[item.vehicle_excel_upload_number]}
                    style={{
                        backgroundColor: colors.Brown,
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {downloadingItems[item.vehicle_excel_upload_number] ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="download-outline" size={14} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* HEADER */}
            <View
                style={{
                    backgroundColor: colors.Brown,
                    paddingVertical: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <TouchableOpacity
                    style={{ position: 'absolute', left: 10, top: 12, padding: 5 }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>

                <Text style={{ color: 'white', fontSize: 20, fontFamily: 'Inter-Bold' }}>
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
                            {totalFiles}
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
                            {totalVehicles}
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

            {/* ADD BUTTONS */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 15, marginTop: 12, gap: 10 }}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleAddExcel}
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#16A34A',
                        borderRadius: 10,
                        paddingVertical: 12,
                        gap: 6,
                        elevation: 3,
                    }}
                >
                    <FontAwesome5 name="file-excel" size={14} color="white" />
                    <Text style={{ color: 'white', fontSize: 13, fontFamily: 'Inter-Bold' }}>
                        Add New Excel
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleAddDirect}
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#2563EB',
                        borderRadius: 10,
                        paddingVertical: 12,
                        gap: 6,
                        elevation: 3,
                    }}
                >
                    <FontAwesome5 name="file-upload" size={14} color="white" />
                    <Text style={{ color: 'white', fontSize: 13, fontFamily: 'Inter-Bold' }}>
                        Add New
                    </Text>
                </TouchableOpacity>
            </View>

            {/* SEARCH BAR */}
            <View
                style={{
                    margin: 10,
                    marginTop: 12,
                    backgroundColor: '#F9FAFB',
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    borderWidth: 1,
                    borderColor: '#d3d5d8',
                }}
            >
                <Ionicons name="search-outline" size={18} color="#6B7280" />

                <TextInput
                    placeholder="Search by Finance or File name..."
                    placeholderTextColor="#9CA3AF"
                    value={search}
                    onChangeText={setSearch}
                    style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 6,
                        fontFamily: 'Inter-Regular',
                        color: '#111827',
                    }}
                />

                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color="#6B7280" />
                    </TouchableOpacity>
                )}
            </View>

            {/* LIST */}
            {loading && fileList.length === 0 ? (
                <View style={{ marginTop: 80, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.Brown} />
                </View>
            ) : (
                <FlatList
                    data={filteredList}
                    keyExtractor={(item, i) => `${item.vehicle_excel_upload_number}_${i}`}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ padding: 10, paddingBottom: 30 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchFiles(true)}
                            colors={[colors.Brown]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 80 }}>
                            <Ionicons name="folder-open-outline" size={50} color="#D1D5DB" />
                            <Text style={{ marginTop: 10, fontSize: 16, color: '#6B7280', fontFamily: 'Inter-Bold' }}>
                                No File Exist
                            </Text>
                            <Text style={{ marginTop: 5, fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter-Regular' }}>
                                There are no uploaded files available.
                            </Text>
                        </View>
                    }
                />
            )}

            {/* DELETE CONFIRMATION MODAL */}
            <Modal
                visible={!!deleteItem}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteItem(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center' }}>
                        <View
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: '#FEE2E2',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons name="trash-outline" size={28} color="#DC2626" />
                        </View>

                        <Text style={{ marginTop: 12, fontSize: 17, color: '#111827', fontFamily: 'Inter-Bold' }}>
                            Delete File?
                        </Text>

                        <Text
                            style={{
                                marginTop: 8,
                                fontSize: 12,
                                color: '#6B7280',
                                fontFamily: 'Inter-Regular',
                                textAlign: 'center',
                                lineHeight: 18,
                            }}
                        >
                            All vehicles in this file will be deleted. This action cannot be undone.
                        </Text>

                        {/* FILE INFO */}
                        <View
                            style={{
                                alignSelf: 'stretch',
                                marginTop: 14,
                                backgroundColor: '#F9FAFB',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 10,
                                padding: 10,
                            }}
                        >
                            <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Inter-Bold' }} numberOfLines={2}>
                                {deleteItem?.vehicle_upload_file_name}
                            </Text>
                            <Text style={{ marginTop: 3, fontSize: 11, color: '#6B7280', fontFamily: 'Inter-Regular' }} numberOfLines={1}>
                                {deleteItem?.vehicle_finance_name}
                            </Text>
                            <Text style={{ marginTop: 3, fontSize: 11, color: '#2563EB', fontFamily: 'Inter-Bold' }}>
                                {deleteItem?.total_count} Vehicles
                            </Text>
                        </View>

                        {/* BUTTONS */}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setDeleteItem(null)}
                                style={{
                                    flex: 1,
                                    paddingVertical: 12,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    backgroundColor: '#F3F4F6',
                                }}
                            >
                                <Text style={{ fontSize: 13, color: '#374151', fontFamily: 'Inter-Bold' }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={onConfirmDelete}
                                style={{
                                    flex: 1,
                                    paddingVertical: 12,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    backgroundColor: '#DC2626',
                                }}
                            >
                                <Text style={{ fontSize: 13, color: '#fff', fontFamily: 'Inter-Bold' }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* DELETING LOADER */}
            {deleting && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#DC2626" />
                        <Text style={{ marginTop: 10, fontSize: 13, color: '#111827', fontFamily: 'Inter-Bold' }}>
                            Deleting...
                        </Text>
                    </View>
                </View>
            )}

            {/* STATUS CONFIRMATION MODAL */}
            <Modal
                visible={!!statusItem}
                transparent
                animationType="fade"
                onRequestClose={() => setStatusItem(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center' }}>
                        <View
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: isActive(statusItem) ? '#FEF3C7' : '#DCFCE7',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons
                                name={isActive(statusItem) ? 'pause-circle-outline' : 'checkmark-circle-outline'}
                                size={30}
                                color={isActive(statusItem) ? '#D97706' : '#16A34A'}
                            />
                        </View>

                        <Text style={{ marginTop: 12, fontSize: 17, color: '#111827', fontFamily: 'Inter-Bold' }}>
                            {isActive(statusItem) ? 'Deactivate File?' : 'Activate File?'}
                        </Text>

                        <Text
                            style={{
                                marginTop: 8,
                                fontSize: 12,
                                color: '#6B7280',
                                fontFamily: 'Inter-Regular',
                                textAlign: 'center',
                                lineHeight: 18,
                            }}
                        >
                            {isActive(statusItem)
                                ? 'The vehicles in this file will be deactivated.'
                                : 'The vehicles in this file will be activated.'}
                        </Text>

                        <View
                            style={{
                                alignSelf: 'stretch',
                                marginTop: 14,
                                backgroundColor: '#F9FAFB',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 10,
                                padding: 10,
                            }}
                        >
                            <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Inter-Bold' }} numberOfLines={2}>
                                {statusItem?.vehicle_upload_file_name}
                            </Text>
                            <Text style={{ marginTop: 3, fontSize: 11, color: '#6B7280', fontFamily: 'Inter-Regular' }} numberOfLines={1}>
                                {statusItem?.vehicle_finance_name}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setStatusItem(null)}
                                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#F3F4F6' }}
                            >
                                <Text style={{ fontSize: 13, color: '#374151', fontFamily: 'Inter-Bold' }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={onConfirmStatus}
                                style={{
                                    flex: 1,
                                    paddingVertical: 12,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    backgroundColor: isActive(statusItem) ? '#D97706' : '#16A34A',
                                }}
                            >
                                <Text style={{ fontSize: 13, color: '#fff', fontFamily: 'Inter-Bold' }}>
                                    {isActive(statusItem) ? 'Deactivate' : 'Activate'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default VehicleFileDetails;