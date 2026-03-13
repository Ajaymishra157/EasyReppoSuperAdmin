import { ActivityIndicator, Alert, Animated, BackHandler, FlatList, Image, Keyboard, Modal, PermissionsAndroid, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import colors from '../CommonFiles/Colors';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Icon from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Bottomtab from '../Component/Bottomtab';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../CommonFiles/Constant';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import WelcomeShimmer from '../Component/WelcomeShimmer';
import DigitSizedShimmer from '../Component/DigitSizedShimmer';
import RNExitApp from 'react-native-exit-app';
import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';
import SQLite from 'react-native-sqlite-storage';
import KeepAwake from 'react-native-keep-awake';
import * as Progress from 'react-native-progress';
import FastImage from 'react-native-fast-image';
import { openDB } from '../utils/db';
import Toast from 'react-native-toast-message';
// import Geolocation from 'react-native-geolocation-service';

const FirstScreen = () => {
    const vehicle = require('../assets/images/vehicle.png');
    const Edit = require('../assets/images/edit.png');
    const logout = require('../assets/images/logout.png');
    const accountstatus = require('../assets/images/accountstatus.png');
    const remain = require('../assets/images/remain.png');

    const [days, setDays] = useState('');
    const [VisibleType, setVisibleType] = useState('Reg No');
    const [scheduleType, setScheduleType] = useState('Reg No');
    const [searchQuery, setSearchQuery] = useState('');

    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [SearchVehicle, setSearchVehicle] = useState([]);
    // console.log("isme hai vehcile ka pura data", SearchVehicle);
    const navigation = useNavigation();

    const [selectedOption, setSelectedOption] = useState('List'); // for modal selection
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [downloadModal, setDownloadModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [showBottomTab, setShowBottomTab] = useState(true);
    const scrollTimeoutRef = useRef(null);
    const lastOffsetY = useRef(0);

    const [SelectedDropdownItem, setSelectedDropdownItem] = useState('List');
    const [selectedType, setSelectedType] = useState('All');

    const [searchPerformed, setSearchPerformed] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [remainingday, setRemainingday] = useState(0);
    const [loadedCount, setLoadedCount] = useState(0);

    const [searchResults, setSearchResults] = useState([]);
    const [isSearched, setIsSearched] = useState(false); // to show/hide result count view

    const [CloseAppModal, setCloseAppModal] = useState(false);
    const [SyncStatus, setSyncStatus] = useState(null);
    console.log("syncstatus ye hai dost", SyncStatus);
    const [StatusVisible, setStatusVisible] = useState(false);
    const [SearchLoading, setSearchLoading] = useState(false);
    const [text, setText] = useState('');
    const [Name, setName] = useState('');

    const [staff_financelist, setStaff_financelist] = useState(null);
    const [easyreppo_financelist, seteasyreppo_financelist] = useState(null);

    const [dynamicUrl, SetDynamicUrl] = useState('');


    const [rentAgencyId, setRentAgencyId] = React.useState(null);



    const [userType, setUsertype] = useState(null);


    const inputRef = useRef(null);
    const [wasInputFocused, setWasInputFocused] = useState(false);


    // new sync state
    const [loadingDone, setLoadingDone] = useState(true);
    const [progressPercent, setProgressPercent] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isStoringData, setIsStoringData] = useState(false); // Track storing data state

    // Remember if the input was focused before navigating away
    const handleBlur = () => {
        setWasInputFocused(true);
    };

    const handleFocus = () => {
        setWasInputFocused(false); // It's now focused, so reset the "was focused before"
    };

    const bottomTabAnim = useRef(new Animated.Value(0)).current; // 0=visible, 1=hidden

    useEffect(() => {
        Animated.timing(bottomTabAnim, {
            toValue: showBottomTab ? 0 : 1,
            duration: 30,
            useNativeDriver: true,
        }).start();
    }, [showBottomTab]);

    const SCROLL_THRESHOLD = 20; // 15–25 best value

    const handleScroll = (event) => {
        const currentOffset = event.nativeEvent.contentOffset.y;
        const diff = currentOffset - lastOffsetY.current;

        if (Math.abs(diff) < SCROLL_THRESHOLD) {
            return; // Ignore small scrolls
        }

        if (diff > 0) {
            // Scrolling DOWN → hide
            if (showBottomTab) {
                setShowBottomTab(false);
            }
        } else {
            // Scrolling UP → show
            if (!showBottomTab) {
                setShowBottomTab(true);
            }
        }

        lastOffsetY.current = currentOffset;
    };

    React.useEffect(() => {
        const loadRentAgencyId = async () => {
            const id = await AsyncStorage.getItem('rent_agency_id');
            setRentAgencyId(id); // string hi rahegi ('0', '1', etc.)
            console.log('🏢 Rent Agency ID:', id);
        };

        loadRentAgencyId();
    }, []);


    useFocusEffect(
        useCallback(() => {
            // When screen is focused
            if (wasInputFocused) {
                const timer = setTimeout(() => {
                    inputRef.current?.focus();
                }, 300);

                return () => clearTimeout(timer);
            }
        }, [wasInputFocused])
    );

    const INTERNAL_DB_PATH = `${RNFS.DocumentDirectoryPath}/VehicleDB.db`;
    const INTERNAL_EXTRACT_PATH = `${RNFS.DocumentDirectoryPath}/dbfile`;

    // 🔒 Force close DB before deleting file
    const closeExistingDB = async () => {
        try {
            const db = await SQLite.openDatabase({ name: INTERNAL_DB_PATH, location: 'default', readOnly: true });
            await db.close();
            console.log("🔒 Database closed successfully");
        } catch (e) {
            console.log("⚠️ Database was not open or already closed:", e.message);
        }
    };

    const FetchDynamicUrlApi = async () => {
        try {
            const storedAgencyId = await AsyncStorage.getItem('rent_agency_id');
            console.log("store rent agency id ye hai ", storedAgencyId);

            const response = await fetch(
                'https://admin.easyreppo.in/sqlite_file/url.php',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rent_agency_id: storedAgencyId,
                    }),
                }
            );

            const result = await response.json();

            if (result.code === 200 && result.zip_path) {
                SetDynamicUrl(result.zip_path); // ✅ URL set
                return result.zip_path;         // ✅ return also
            } else {
                console.log('Error', result.message || 'Failed to get zip url');
                return null;
            }
        } catch (error) {
            console.log('URL API error:', error.message);
            return null;
        }
    };


    const cleanOldDataBeforeDownload = async () => {
        const zipPath = `${RNFS.DocumentDirectoryPath}/full_vehicle_detail.zip`;
        const extractPath = INTERNAL_EXTRACT_PATH;
        const deviceDBPath = INTERNAL_DB_PATH;

        console.log("🧹 Cleaning old data before download...");

        // 1️⃣ Remove cached count
        await AsyncStorage.removeItem("totalVehicleCount");

        // 2️⃣ Close & delete DB
        try {
            const db = await SQLite.openDatabase({ name: deviceDBPath, location: 'default' });
            await db.close();
            console.log("🔒 DB closed");
        } catch (e) { }

        if (await RNFS.exists(deviceDBPath)) {
            await RNFS.unlink(deviceDBPath);
            console.log("🗑️ Old DB deleted");
        }

        // 3️⃣ Delete extracted folder
        if (await RNFS.exists(extractPath)) {
            await RNFS.unlink(extractPath);
            console.log("🗑️ Old extracted folder deleted");
        }

        // 4️⃣ Delete ZIP
        if (await RNFS.exists(zipPath)) {
            await RNFS.unlink(zipPath);
            console.log("🗑️ Old ZIP deleted");
        }
    };


    const syncDataFromFile = async () => {
        KeepAwake.activate();
        try {
            setLoadingDone(false);
            setProgressPercent(0);

            // 🔥🔥🔥 THIS IS IMPORTANT 🔥🔥🔥
            await cleanOldDataBeforeDownload();

            // 🔥 Step 1: Get ZIP URL from API
            const apiZipUrl = await FetchDynamicUrlApi();
            if (!apiZipUrl) throw new Error('Zip URL not found');

            const zipUrl = `${apiZipUrl}?v=${Date.now()}`;
            const zipPath = `${RNFS.DocumentDirectoryPath}/full_vehicle_detail.zip`;
            const extractPath = INTERNAL_EXTRACT_PATH;
            const deviceDBPath = INTERNAL_DB_PATH;

            // ===== Delete old ZIP =====
            console.log("Checking if old zip exists at:", zipPath);
            if (await RNFS.exists(zipPath)) {
                await RNFS.unlink(zipPath);
                console.log("🗑️ Old zip file deleted");
            }

            // ===== Delete extracted folder =====
            console.log("Checking if extracted folder exists:", extractPath);
            if (await RNFS.exists(extractPath)) {
                try {
                    await RNFS.unlink(extractPath);
                    console.log("🗑️ Old extracted folder deleted");
                } catch (err) {
                    console.log("⚠️ Failed to delete extracted folder:", err.message);
                }
            }

            // ===== Delete old DB (THIS WAS FAILING EARLIER) =====
            console.log("Checking if old DB exists at:", deviceDBPath);
            if (await RNFS.exists(deviceDBPath)) {
                console.log("🔒 Closing DB before deletion...");
                await closeExistingDB();

                // Wait for OS to release file lock
                await new Promise(r => setTimeout(r, 500));

                await RNFS.unlink(deviceDBPath);
                console.log("🗑️ Old VehicleDB.db deleted from internal storage");
            }

            await AsyncStorage.removeItem("totalVehicleCount");

            // ===== Create extract folder again =====
            if (!(await RNFS.exists(extractPath))) {
                await RNFS.mkdir(extractPath);
                console.log("✅ Created extract folder:", extractPath);
            }

            // ===== Download ZIP =====
            console.log("📥 Downloading from:", zipUrl);

            // ✅ Download with progress tracking
            const download = RNFS.downloadFile({
                fromUrl: zipUrl,
                toFile: zipPath,
                progressDivider: 1, // triggers every 1% progress
                begin: (res) => {
                    console.log("🚀 Download started...");
                    // setSyncPhase("downloading");
                    setProgressPercent(0);
                },
                progress: (res) => {
                    const percent = Math.floor((res.bytesWritten / res.contentLength) * 100);
                    setProgressPercent(percent);
                },
            });

            const res = await download.promise;
            if (res.statusCode != 200) throw new Error(`Download failed (${res.statusCode})`);
            console.log("✅ ZIP downloaded:", zipPath);

            const zipStat = await RNFS.stat(zipPath);
            console.log("📦 ZIP file size (bytes):", zipStat.size);
            console.log("📦 ZIP file size (MB):", (zipStat.size / (1024 * 1024)).toFixed(2), "MB");

            setIsStoringData(true);
            // Unzip SQLite file
            await unzip(zipPath, extractPath);
            console.log("✅ Unzipped to:", extractPath);

            // Delete old DB if exists in internal storage
            if (await RNFS.exists(deviceDBPath)) {
                await RNFS.unlink(deviceDBPath);
                console.log("🧹 Old DB deleted from internal storage");
            }

            // Move the SQLite file to internal storage
            const files = await RNFS.readDir(extractPath);
            const sqliteFile = files.find(f => f.name.endsWith('.sqlite'));

            if (!sqliteFile) {
                throw new Error("No .sqlite file found in extracted folder");
            }

            console.log("📄 Extracted SQLite file size (bytes):", sqliteFile.size);
            console.log("📄 Extracted SQLite file size (MB):", (sqliteFile.size / (1024 * 1024)).toFixed(2), "MB");


            const extractedDBPath = sqliteFile.path;
            await RNFS.moveFile(extractedDBPath, deviceDBPath);
            console.log("✅ DB moved to internal storage:", deviceDBPath);

            // await AsyncStorage.removeItem("totalVehicleCount");

            // Open DB using Promise style from internal storage
            const db = await SQLite.openDatabase({ name: deviceDBPath, location: 'default' });
            console.log("✅ Database opened successfully from internal storage");

            console.log("⚡ Creating indexes…");
            await db.executeSql("CREATE INDEX IF NOT EXISTS idx_reg_state ON full_vehicle_detail(reg_last, state_code,vehicle_finance_name, data_type);");
            await db.executeSql("CREATE INDEX IF NOT EXISTS idx_chassis_state ON full_vehicle_detail(chassis_last, state_code,vehicle_finance_name, data_type);");
            await db.executeSql("CREATE INDEX IF NOT EXISTS idx_engine_state ON full_vehicle_detail(eng_last, state_code,vehicle_finance_name, data_type);");
            await db.executeSql("CREATE INDEX IF NOT EXISTS idx_finance_name ON full_vehicle_detail(vehicle_finance_name);");

            await db.executeSql("PRAGMA analysis_limit=4000;");
            await db.executeSql("PRAGMA optimize;");
            console.log("⚡ Indexes created");

            // Check table exists
            await countVehiclesInDB();

            // Optional: scan file on Android to make it visible
            if (Platform.OS == 'android') {
                await RNFS.scanFile(deviceDBPath);
            }

            // ✅ Done
            // setSyncPhase("completed");
            setProgressPercent(100);
            await Updatesyncstatus();
        } catch (error) {
            console.log("❌ Sync failed:", error.message);
            Alert.alert("Error", "Failed to sync data from file");
            // setSyncPhase("error");
        } finally {
            // setDownloadLoading(false);
            setLoadingDone(true);
            setIsStoringData(false)
            KeepAwake.deactivate();
        }
    };


    const Updatesyncstatus = async () => {
        const userId = await AsyncStorage.getItem('staff_id');
        if (!userId) {
            console.log("❌ User ID not found");
            return;
        }

        try {
            const response = await fetch(`${ENDPOINTS.update_sync_status}?staff_id=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (result.code == 200) {
                UserWiseExpiryApi();
            } else {
                console.log('❌ Error: Failed ');
            }
        } catch (error) {
            console.log('❌ Error checking for update sync time:', error.message);
        }
    };

    // Retry query logic
    const retryQuery = async (query, retries = 3, delay = 1000) => {
        try {
            console.log(`Attempting query: ${query}`);
            const result = await db.executeSql(query);
            return result;
        } catch (error) {
            if (retries > 0) {
                console.log(`❌ Query failed, retrying in ${delay / 1000}s... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return retryQuery(query, retries - 1, delay); // Exponential backoff could be considered
            } else {
                console.log("❌ Max retries reached for query");
                throw new Error("Max retries reached for query");
            }
        }
    };

    const countVehiclesInDB = async (force = false) => {
        try {
            if (!force) {
                const cached = await AsyncStorage.getItem("totalVehicleCount");
                console.log("total vehicle count countvehicleindb ke andar", cached);
                if (cached) {
                    setTotalCount(parseInt(cached, 10));
                    // console.log("📊 Used cached count:", cached);
                    return;
                }
            }

            const db = await openDB();
            const [res] = await db.executeSql('SELECT COUNT(*) AS count FROM full_vehicle_detail');
            const total = res.rows.item(0).count;

            await AsyncStorage.setItem("totalVehicleCount", String(total));
            setTotalCount(total);
            console.log("📊 Count refreshed:", total);
        } catch (e) {
            console.log("❌ countVehiclesInDB error:", e.message);
        }
    };




    useFocusEffect(
        useCallback(() => {
            const backAction = () => {

                setCloseAppModal(true); // Show modal on back press
                return true; // Prevent default behavior
            };

            BackHandler.addEventListener("hardwareBackPress", backAction);

            return () =>
                BackHandler.removeEventListener("hardwareBackPress", backAction);
        }, [])
    );


    const AgencyStaffLogout = async (navigation, confirmLogout) => {
        try {
            const staffId = await AsyncStorage.getItem('staff_id');

            if (!staffId) {
                Toast.show({
                    type: 'error',
                    text1: 'No staff ID found',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });;
                return;
            }

            const response = await fetch(ENDPOINTS.Staff_Agency_Logout, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId }),
            });

            const result = await response.json();

            if (result.code === 200) {
                const days = result.days;
                setDays(days);
                setName(result.payload[0]?.staff_name);
                const staffStatus = result?.payload?.[0]?.staff_status;

                const userType = result?.payload?.[0]?.user_type;
                console.log("agency logout mai first screen se mene usrtyoe liya", userType);
                await AsyncStorage.setItem('user_type', userType);

                if (staffStatus === 'Deactive') {

                    confirmLogout(); // Trigger logout
                } else {

                }
            } else {
                // Toast.show({
                //     type: 'error',
                //     text1: result.message || 'Failed to logout staff',
                //     position: 'bottom',
                //     bottomOffset: 60,
                //     visibilityTime: 2000, // 2 sec
                // });
            }
        } catch (error) {
            console.log('Logout error:', error.message);

        }
    };

    const TotalCountApi = async () => {
        try {
            const storedAgencyId = await AsyncStorage.getItem('rent_agency_id');
            const staffId = await AsyncStorage.getItem('staff_id');


            const response = await fetch(ENDPOINTS.Vehicle_Count, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rent_agency_id: storedAgencyId,
                    staff_id: staffId
                }),
            });

            const result = await response.json();

            if (result.code === 200) {

                // setTotalCount(result.total_records_count);
                setRemainingday(result.days_left);
            } else {
                // Toast.show({
                //     type: 'error',
                //     text1: result.message || 'Failed to logout staff',
                //     position: 'bottom',
                //     bottomOffset: 60,
                //     visibilityTime: 2000,
                // });
            }
        } catch (error) {
            console.log('Logout error:', error.message);
        }
    };



    const UserWiseExpiryApi = async () => {
        const userId = await AsyncStorage.getItem('staff_id');
        console.log("userwise ka userId", userId);
        if (!userId) {
            console.log("❌ User ID not found");
            return;
        }

        try {
            const response = await fetch(`${ENDPOINTS.UserWiseExpiry}?user_id=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (result.code == 200 && result.payload) {
                const syncStatus = result.payload.sync_status;
                const name = result.payload.name;
                const status = result.payload.staff_status;
                const totaldays = result.payload.total_days;

                setStaff_financelist(result.payload.staff_finance_list);
                seteasyreppo_financelist(result.payload.easyreppo_finance_list);
                setSyncStatus(syncStatus);
            } else {
                console.log('❌ Error: Failed to load data');

            }
        } catch (error) {
            console.log('❌ Error fetching user wise data asc:', error.message);

        }
    };
    useEffect(() => {
        UserWiseExpiryApi();
    }, []);



    useFocusEffect(
        React.useCallback(() => {
            TotalCountApi();
            countVehiclesInDB();
        }, [])
    );


    useFocusEffect(
        React.useCallback(() => {
            AgencyStaffLogout(navigation, confirmLogout);
        }, [])
    );


    const confirmLogout = async () => {
        await AsyncStorage.removeItem('id'); // User data clear karega
        await AsyncStorage.removeItem('selected_agency'); // User data clear karega
        navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }], // LoginScreen par redirect karega
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


    const [SearchError, setSearchError] = useState('');
    const [typeError, settypeError] = useState('');

    const [dropdownData] = useState([

        { label: 'List Design', value: 'List' },

        { label: 'Grid Design', value: 'Grid' },
    ]);

    const [searchQuery2, setSearchQuery2] = useState('');
    const [listType, setListType] = useState('List');

    const [StateData] = useState([
        { label: 'All', value: 'All' },
        { label: 'Andhra Pradesh', value: 'AP' },
        { label: 'Arunachal Pradesh', value: 'AR' },
        { label: 'Assam', value: 'AS' },
        { label: 'Bihar', value: 'BR' },
        { label: 'Chhattisgarh', value: 'CG' },
        { label: 'Goa', value: 'GA' },
        { label: 'Gujarat', value: 'GJ' },
        { label: 'Haryana', value: 'HR' },
        { label: 'Himachal Pradesh', value: 'HP' },
        { label: 'Jharkhand', value: 'JH' },
        { label: 'Karnataka', value: 'KA' },
        { label: 'Kerala', value: 'KL' },
        { label: 'Madhya Pradesh', value: 'MP' },
        { label: 'Maharashtra', value: 'MH' },
        { label: 'Manipur', value: 'MN' },
        { label: 'Meghalaya', value: 'ML' },
        { label: 'Mizoram', value: 'MZ' },
        { label: 'Nagaland', value: 'NL' },
        { label: 'Odisha', value: 'OD' },
        { label: 'Punjab', value: 'PB' },
        { label: 'Rajasthan', value: 'RJ' },
        { label: 'Sikkim', value: 'SK' },
        { label: 'Tamil Nadu', value: 'TN' },
        { label: 'Telangana', value: 'TS' },
        { label: 'Tripura', value: 'TR' },
        { label: 'Uttar Pradesh', value: 'UP' },
        { label: 'Uttarakhand', value: 'UK' },
        { label: 'West Bengal', value: 'WB' },
    ]);


    const filteredStates = StateData.filter((item) =>
        item.label.toLowerCase().includes(searchQuery2.toLowerCase())
    );

    const closeExitModal = () => {
        setCloseAppModal(false);

    }
    const confirmExit = () => {
        RNExitApp.exitApp();
    };


    // const getLocationAndNavigate = async (item) => {
    //     console.log("This Api Called");
    //     try {
    //         if (Platform.OS === 'android') {
    //             const granted = await PermissionsAndroid.request(
    //                 PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    //             );
    //             if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    //                 Alert.alert('Permission Denied', 'Location permission is required');
    //                 return;
    //             }
    //         }

    //         Geolocation.getCurrentPosition(
    //             async (position) => {
    //                 const { latitude, longitude } = position.coords;

    //                 // Reverse Geocoding - Get location name/address from lat & long
    //                 try {
    //                     const response = await fetch(
    //                         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`
    //                     );
    //                     const data = await response.json();

    //                     let locationName = 'Unknown Location';
    //                     if (
    //                         data.status === 'OK' &&
    //                         data.results &&
    //                         data.results.length > 0
    //                     ) {
    //                         locationName = data.results[0].formatted_address;
    //                     }

    //                     // Navigate with data + location name
    //                     navigation.navigate('DetailScreen', {
    //                         vehicleData: item,
    //                         currentLat: latitude,
    //                         currentLong: longitude,
    //                         locationName: locationName,
    //                     });
    //                 } catch (geoError) {
    //                     console.error('Geocoding Error:', geoError);
    //                     Alert.alert('Geocoding Error', 'Could not fetch location name');
    //                 }
    //             },
    //             (error) => {
    //                 console.error('Location Error:', error.message);
    //                 Alert.alert('Location Error', error.message);
    //             },
    //             { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    //         );
    //     } catch (err) {
    //         console.error('Permission Error:', err);
    //     }
    // };

    const [ConfrimationModal, setConfrimationModal] = useState(false);
    const handleLogout = async () => {
        setConfrimationModal(true);

    };

    const closeconfirmodal = () => {
        setConfrimationModal(false); // Hide the modal
    };


    const formatIndianNumber = (number) => {
        return new Intl.NumberFormat('en-IN').format(number);
    };


    const [isStateVisible, setIsStateVisible] = useState(false);
    const [tempSelectedState, setTempSelectedState] = useState(null);
    const [SelectedState, setSelectedState] = useState('All');
    const [selectedStateOption, setSelectedStateOption] = useState('All');
    const [StateType, setStateType] = useState('All');


    const renderItem = ({ item, index }) => {
        let displayNumber = '-----';

        if (scheduleType === 'Reg No') {
            displayNumber = item.vehicle_registration_no || '-----';
        } else if (scheduleType === 'Chassis No') {
            displayNumber = item.vehicle_chassis_no || '-----';
        } else if (scheduleType === 'Engine No') {
            displayNumber = item.vehicle_engine_no || '-----';
        }


        return (

            <TouchableOpacity
                key={item.id}
                style={{
                    flexDirection: 'row',
                    backgroundColor: '#fff',
                    padding: 10,
                    marginBottom: 7,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: '#ddd',
                    alignItems: 'center',
                    marginTop: 5
                }}
                // onPress={() => {
                //     if (userType === 'SubAdmin') {
                //         getLocationAndNavigate(item);
                //     } else {
                //         navigation.navigate('DetailScreen', { vehicleData: item });
                //     }
                // }}
                // onPress={() => navigation.navigate('DetailScreen', { vehicleData: item })}

                onPress={() =>
                    navigation.navigate('DetailScreen', {
                        vehicleData: item,
                        onDelete: (deletedVehicleId) => {
                            // 1. Update SearchVehicle state
                            setSearchVehicle(prev =>
                                prev.filter(v => v.full_vehicle_id !== deletedVehicleId)
                            );

                            // 2. Update total count state
                            setTotalCount(prev => prev - 1);

                            // 3. Update cached count in AsyncStorage
                            const updateCachedCount = async () => {
                                try {
                                    const cached = await AsyncStorage.getItem("totalVehicleCount");
                                    if (cached) {
                                        const newCount = parseInt(cached) - 1;
                                        await AsyncStorage.setItem("totalVehicleCount", String(newCount));
                                        console.log("✅ Updated cached count after deletion:", newCount);
                                    }
                                } catch (error) {
                                    console.log("❌ Error updating cached count:", error.message);
                                }
                            };
                            updateCachedCount();
                        },
                    })
                }

                activeOpacity={1}
            >
                <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, textAlign: 'center', color: 'black', fontFamily: 'Inter-Bold' }}>
                        {item.vehicle_type == "2" ? (
                            <Icon name="bicycle" size={16} color="black" />
                        ) : (
                            <Icon name="car" size={16} color="black" />
                        )}
                    </Text>
                </View>

                <View style={{ width: '40%', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 12, textAlign: 'center', color: 'black', fontFamily: 'Inter-Bold' }}>
                        {displayNumber}
                    </Text>

                </View>
                <View style={{ width: '50%', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 12, textAlign: 'left', color: 'black', fontFamily: 'Inter-Bold' }}>
                        {item.vehicle_product || '-----'}
                    </Text>

                </View>


            </TouchableOpacity>
        );
    };

    const renderGridItem = ({ item }) => (
        <TouchableOpacity
            key={item.id}
            style={{
                backgroundColor: '#fff',
                padding: 6,
                margin: 5,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#ddd',
                width: '45%',
            }}
            // onPress={() => {
            //     if (userType === 'SubAdmin') {
            //         getLocationAndNavigate(item);
            //     } else {
            //         navigation.navigate('DetailScreen', { vehicleData: item });
            //     }
            // }}
            onPress={() => navigation.navigate('DetailScreen', { vehicleData: item })}
            activeOpacity={1}
        >
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 8, gap: 9 }}>
                <Text style={{ fontSize: 12, textAlign: 'center', color: 'black', fontFamily: 'Inter-Bold' }}>
                    {item.vehicle_type === "2" ? (
                        <Icon name="bicycle" size={16} color="black" />
                    ) : (
                        <Icon name="car" size={16} color="black" />
                    )}
                </Text>
                <Text style={{ fontSize: 12, color: 'black', fontFamily: 'Inter-Bold', marginTop: 5 }}>
                    {item.vehicle_registration_no || '-----'}
                </Text>

            </View>
        </TouchableOpacity>
    );

    const renderStateItem = ({ item }) => (
        <TouchableOpacity
            style={{
                paddingVertical: 10,
                paddingHorizontal: 15,
                backgroundColor: 'white',
                flexDirection: 'row', justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderColor: '#ccc'
            }}
            onPress={() => {
                setTempSelectedState(item.value);
                setSelectedStateOption(item.label);
                setIsStateVisible(false);
            }}
        >
            <Text style={{ fontSize: 16, color: 'black', fontFamily: 'Inter-Regular' }}>{item.label}</Text>

            {selectedStateOption === item.label && (
                <Entypo name="check" size={20} color="green" />
            )}
        </TouchableOpacity>
    );


    // const SearchVehicleApi = async (SearchText) => {


    //     const storedAgencyId = await AsyncStorage.getItem('rent_agency_id');


    //     setSearchLoading(true);

    //     let apiTypeKey = '';
    //     if (scheduleType === 'Reg No') {
    //         apiTypeKey = 'Reg No';
    //     } else if (scheduleType === 'Unreg No') {
    //         apiTypeKey = 'Chassis No';
    //     } else if (scheduleType === 'Eng No') {
    //         apiTypeKey = 'Eng No';
    //     }
    //     try {
    //         const response = await fetch(ENDPOINTS.Search_Vehicle, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 type: apiTypeKey,
    //                 number: SearchText,
    //                 rent_agency_id: storedAgencyId
    //             }),
    //         });

    //         // Check the status code first
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         }

    //         const result = await response.json();
    //         console.log("result", result);
    //         if (result.code == 200) {
    //             setSearchVehicle(result.payload);
    //             setIsSearched(true);
    //             setSearchPerformed(true);
    //             setTotalCount(result.total_records_count);
    //             setSearchQuery('');

    //             setText('');

    //         } else {
    //             setSearchVehicle([]); // Set empty array if the result is not correct
    //             setSearchPerformed(true);
    //             console.log('Error: Failed to load data');

    //         }
    //     } catch (error) {
    //         console.log('Error fetching data:', error.message);
    //         setSearchPerformed(true);
    //     } finally {
    //         setSearchLoading(false);
    //     }
    // };



    // Normalize finance list to uppercase array
    const normalizedFinanceList = React.useMemo(() => {
        if (!staff_financelist) return [];

        // If API returns comma separated string → convert to array
        let list = Array.isArray(staff_financelist)
            ? staff_financelist
            : staff_financelist.split(',');

        return list
            .map(f => f.trim().toUpperCase())
            .filter(f => f.length > 0);
    }, [staff_financelist]);

    const normalizedotherFinanceList = React.useMemo(() => {
        if (!easyreppo_financelist) return [];

        // If API returns comma separated string → convert to array
        let list = Array.isArray(easyreppo_financelist)
            ? easyreppo_financelist
            : easyreppo_financelist.split(',');

        return list
            .map(f => f.trim().toUpperCase())
            .filter(f => f.length > 0);
    }, [easyreppo_financelist]);

    const handleSearch = async (query) => {
        if (!query) {
            setSearchVehicle([]);
            setSearchLoading(false);
            return;
        }

        setSearchQuery('');
        // setSearchLoading(true);

        try {
            const db = await openDB(); // ✅ open prepared database instance

            let sql = '';
            let params = [];

            // 🔹 Helper → build prefix range for LIKE-style search
            const makeRange = (prefix) => {
                if (!prefix) return ['', ''];
                const lastChar = prefix.slice(-1);
                const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
                const nextPrefix = prefix.slice(0, -1) + nextChar;
                return [prefix, nextPrefix];
            };

            let prefix = query.toUpperCase().trim();
            let range = makeRange(prefix);

            // 🔹 Choose query depending on schedule type
            if (scheduleType == "Reg No") {
                sql = `
              SELECT *
              FROM full_vehicle_detail 
              WHERE reg_last >= ? AND reg_last < ?
            `;
                params = range;
            } else if (scheduleType == "Chassis No") {
                sql = `
              SELECT *
              FROM full_vehicle_detail 
              WHERE chassis_last >= ? AND chassis_last < ?
            `;
                params = range;
            } else if (scheduleType == "Engine No") {
                sql = `
              SELECT *
              FROM full_vehicle_detail 
              WHERE eng_last >= ? AND eng_last < ?
            `;
                params = range;
            } else {
                console.log("⚠️ Unknown scheduleType:", scheduleType);
                return;
            }

            // 🔹 Add optional state filter
            if (SelectedState && SelectedState != "All") {
                sql += " AND state_code = ?";
                params.push(SelectedState);
                console.log("🌎 Added State Filter:", SelectedState);
            }

            // Filter: Only Active Vehicles
            sql += " AND vehicle_status = 'Active'";

            // --------- DYNAMIC FINANCE FILTER FROM API ---------
            let financeFilterSQL = '';
            let financeParams = [];

            const easyList = normalizedotherFinanceList.map(f => f.toUpperCase().trim());

            if (rentAgencyId !== '0') {
                // ✅ ONLY rent agency login → apply easyreppo_financelist
                if (easyList.length > 0) {
                    const placeholders = easyList.map(() => '?').join(',');
                    financeFilterSQL += `
            AND (
                data_type != 'mjs'
                OR UPPER(TRIM(vehicle_finance_name)) NOT IN (${placeholders})
            )
        `;
                    financeParams.push(...easyList);
                }
            }


            // Add dynamic finance filter to SQL
            sql += financeFilterSQL;
            params.push(...financeParams);

            // 🔹 Optional: EXPLAIN QUERY PLAN
            try {
                const [plan] = await db.executeSql(`EXPLAIN QUERY PLAN ${sql}`, params);
                for (let i = 0; i < plan.rows.length; i++) {
                    const row = plan.rows.item(i);
                    console.log(`🧠 Query Plan [${i}]:`, row.detail || JSON.stringify(row));
                }
            } catch (planErr) {
                console.log("⚠️ Could not get EXPLAIN QUERY PLAN:", planErr.message);
            }

            console.log("========================================");
            console.log("🧾 FINAL SQL QUERY:");
            console.log(sql.replace(/\s+/g, " ").trim());

            // 🔹 Execute final query
            const [results] = await db.executeSql(sql, params);

            if (results.rows.length === 0) {
                console.log("⚠️ No results found for query:", query);
            }

            // 🔹 Keep only unique vehicles by scheduleType field
            const uniqueMap = new Map();
            for (let i = 0; i < results.rows.length; i++) {
                const row = results.rows.item(i);

                let key = '';
                if (scheduleType === "Reg No") key = row.vehicle_registration_no;
                else if (scheduleType === "Chassis No") key = row.vehicle_chassis_no;
                else if (scheduleType === "Engine No") key = row.vehicle_engine_no;

                if (!uniqueMap.has(key)) uniqueMap.set(key, row);
            }

            const uniqueRows = Array.from(uniqueMap.values());
            setSearchVehicle(uniqueRows);
            setSearchPerformed(true);
            setIsSearched(true);

        } catch (err) {
            console.log("❌ handleSearch error:", err);
            setModalMessage(
                "Please download vehicle data by clicking the Download button. Only then the app will be able to search."
            );

            setDownloadModal(true)
        } finally {
            console.log("⏹️ Search finished");
            setSearchLoading(false);
        }
    };

    const transformToColumnWise = (data, numColumns = 2) => {
        const columnWise = [];
        const itemsPerColumn = Math.ceil(data.length / numColumns);

        for (let i = 0; i < itemsPerColumn; i++) {
            for (let j = 0; j < numColumns; j++) {
                const index = i + j * itemsPerColumn;
                if (index < data.length) {
                    columnWise.push(data[index]);
                }
            }
        }
        return columnWise;
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
    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <View
                style={{
                    backgroundColor: colors.Brown,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {/* Left Spacer */}
                <View style={{ width: 32 }} />

                {/* Center Title */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text
                        style={{
                            color: 'white',
                            fontSize: 20,
                            fontWeight: 'bold',
                            fontFamily: 'Inter-Bold',
                        }}
                    >
                        Easy Reppo
                    </Text>
                </View>

                {/* Right Download Button */}
                {SyncStatus == "Yes" && (
                    <TouchableOpacity
                        onPress={syncDataFromFile}
                        style={{
                            paddingHorizontal: 4,
                            paddingVertical: 4,
                        }}
                    >
                        <MaterialIcons name="download" size={22} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>


            {/* Empty Box (Can be used for content) */}
            {/* {!Name ? (
                <WelcomeShimmer />
            ) : (
                <View
                    style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        flexDirection: 'row',
                        paddingLeft: 10,


                        height: 20,

                    }}
                >
                    <Text
                        style={{
                            color: 'black',
                            fontSize: 15,

                            fontFamily: 'Inter-Bold',
                        }}>
                        Welcome
                    </Text>
                    <Text
                        style={{
                            color: 'black',
                            fontSize: 15,

                            fontFamily: 'Inter-Regular',
                            marginLeft: 5
                        }}>
                        :- {Name}
                    </Text>

                </View>
            )} */}


            <View
                style={{ flex: 1, backgroundColor: 'white' }}
            >


                {days !== 0 && (

                    <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row', gap: 7, paddingVertical: 3 }}>



                        <View style={{ flexDirection: 'row', alignItems: 'center', borderColor: colors.Brown, borderWidth: 1, borderRadius: 5, backgroundColor: 'white', paddingHorizontal: 10, height: 40, width: '83%' }} >
                            <FontAwesome5 name="search" size={15} color="#000" style={{ marginRight: 5 }} />

                            <TextInput ref={inputRef} style={{ flex: 1, fontSize: 14, fontFamily: 'Inter-Regular', color: 'black', padding: 0 }}
                                placeholder={scheduleType == 'Reg No' ? 'Search Register Number'
                                    : scheduleType == 'Chassis No' ? 'Search Chassis Number'
                                        : 'Search Engine Number'}
                                placeholderTextColor="gray"
                                value={searchQuery}
                                onBlur={handleBlur}
                                onFocus={handleFocus}
                                maxLength={scheduleType === 'Reg No' ? 4 : 5}
                                keyboardType={scheduleType === 'Reg No' ? 'phone-pad' : 'email-address'}
                                onChangeText={(text) => {
                                    const filtered = text.replace(/[^a-zA-Z0-9]/g, ''); // allow letters and numbers

                                    setSearchQuery(filtered);
                                    if ((scheduleType === 'Reg No' && filtered.length === 4) ||
                                        ((scheduleType === 'Chassis No' || scheduleType === 'Engine No') && filtered.length === 5)) {
                                        handleSearch(filtered);
                                    } else if (filtered.length == 0) {
                                        setSearchVehicle([]); // ✅ clear results when input is empty

                                    } else {
                                        // loadAllFromDB(); // reload full list if less than 4 digits
                                    }
                                }}
                            />

                        </View>
                        <View style={{ position: 'relative', width: '12%' }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: colors.Brown, height: 40, borderRadius: 8, padding: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderColor: colors.Brown,
                                    borderWidth: 1,
                                    width: '100%',
                                    paddingHorizontal: 5
                                }}
                                onPress={() => {
                                    if (scheduleType == 'Reg No') {
                                        setScheduleType('Chassis No');
                                        setSearchVehicle([]);
                                    } else if (scheduleType == 'Chassis No') {
                                        setScheduleType('Engine No');
                                        setSearchVehicle([]);
                                    } else if (scheduleType == 'Engine No') {
                                        setScheduleType('Reg No');
                                        setSearchVehicle([]);
                                    } else {
                                        setScheduleType('Reg No');
                                        setVisibleType('Reg No');
                                        setSearchVehicle([]);
                                    }
                                }}
                            >
                                <Ionicons name="swap-horizontal" size={25} color="white" />

                            </TouchableOpacity>
                        </View>

                        {/* <TouchableOpacity
                        style={{
                            width: '10%',
                            borderWidth: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderColor: '#ccc',
                            borderRadius: 8,
                            flexDirection: 'row',
                            backgroundColor: colors.Brown
                        }}
                        onPress={() => {
                            setSelectedOption(listType); // pre-fill current view
                            setIsDropdownVisible(true);
                        }}
                    >
                        <AntDesign name="filter" size={22} color="white" />
                    </TouchableOpacity> */}

                        <Modal
                            animationType="slide"
                            transparent={true}
                            visible={isDropdownVisible}
                            onRequestClose={() => setIsDropdownVisible(false)}
                        >
                            <TouchableOpacity
                                style={{
                                    flex: 1,

                                    justifyContent: 'flex-end',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                }}
                                activeOpacity={1}
                                onPress={() => setIsDropdownVisible(false)}
                            >
                                <View

                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'flex-end',
                                        width: '100%',
                                        paddingVertical: 5,

                                    }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsDropdownVisible(false);
                                            setIsStateVisible(false);
                                        }}
                                        style={{
                                            marginRight: 10,
                                            backgroundColor: 'white',
                                            borderRadius: 50,
                                        }}>
                                        <Entypo name="cross" size={25} color="black" />
                                    </TouchableOpacity>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: 'white',
                                        borderTopLeftRadius: 20,
                                        borderTopRightRadius: 20,
                                        padding: 20,
                                        paddingBottom: 40,
                                        height: 450

                                    }}
                                    onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
                                    onTouchEnd={e => e.stopPropagation()}
                                >
                                    <Text style={{ fontSize: 16, fontFamily: 'Inter-Bold', marginBottom: 15, color: 'grey', fontFamily: 'Inter-Regular' }}>
                                        Select Design
                                    </Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '95%' }}>
                                        {dropdownData.map((item) => (
                                            <TouchableOpacity
                                                key={item.value}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginVertical: 8,
                                                    paddingHorizontal: 15,
                                                    paddingVertical: 10,
                                                    borderRadius: 8,
                                                    backgroundColor: selectedOption === item.value ? '#c5e8e4' : 'transparent',

                                                }}
                                                onPress={() => {
                                                    setSelectedOption(item.value);
                                                    setSelectedDropdownItem(item.value);
                                                }
                                                }
                                            >
                                                <View
                                                    style={{
                                                        height: 20,
                                                        width: 20,
                                                        borderRadius: 10,
                                                        borderWidth: 2,
                                                        borderColor: colors.Brown,
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        marginRight: 12,
                                                        flexDirection: 'row', borderWidth: 1
                                                    }}
                                                >
                                                    {selectedOption === item.value && (
                                                        <View
                                                            style={{
                                                                height: 10,
                                                                width: 10,
                                                                borderRadius: 5,
                                                                backgroundColor: colors.Brown,
                                                            }}
                                                        />
                                                    )}
                                                </View>
                                                <Text style={{ fontSize: 16, fontFamily: 'Inter-Regular', color: 'black', fontFamily: 'Inter-Regular' }}>{item.label}</Text>
                                            </TouchableOpacity>

                                        ))}
                                    </View>

                                    {/* State Selection */}
                                    <View style={{ margin: 20 }}>
                                        {/* State Selection Label */}
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontFamily: 'Inter-Bold',
                                                marginBottom: 15,
                                                color: 'grey',
                                            }}
                                        >
                                            Select State
                                        </Text>

                                        {/* Dropdown Field */}
                                        <View style={{}}>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: 'white',
                                                    padding: 12,
                                                    borderRadius: 8,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    borderColor: '#ddd',
                                                    borderWidth: 1,
                                                }}
                                                onPress={() => {
                                                    setIsStateVisible(!isStateVisible);
                                                    setSearchQuery2('');
                                                }}
                                            >
                                                <Text style={{ fontSize: 16, color: 'black', fontFamily: 'Inter-Regular' }}>{selectedStateOption}</Text>
                                                <Ionicons
                                                    name={isStateVisible ? 'chevron-up' : 'chevron-down'}
                                                    size={20}
                                                    color="black"
                                                />
                                            </TouchableOpacity>

                                            {/* Dropdown List */}
                                            <Modal
                                                animationType="fade"
                                                transparent={true}
                                                visible={isStateVisible}
                                                onRequestClose={() => setIsStateVisible(false)}
                                            >
                                                <View
                                                    style={{
                                                        flex: 1,
                                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'flex-end',
                                                            width: '80%',


                                                            backgroundColor: 'white'
                                                        }}>
                                                        <View style={{
                                                            width: '80%', borderBottomWidth: 1, borderColor: '#ccc', flexDirection: 'row', justifyContent: 'center', paddingVertical: 10, alignItems: 'center', borderTopLeftRadius: 10,

                                                        }}>
                                                            <Text style={{ color: 'black', fontFamily: 'Inter-regular', fontSize: 16 }}>Select State(राज्य चुनें)</Text>
                                                        </View>
                                                        <View style={{ width: '20%', borderBottomWidth: 1, borderColor: '#ccc', flexDirection: 'row', justifyContent: 'center', paddingVertical: 10, alignItems: 'center', borderTopRightRadius: 10, }}>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    setIsStateVisible(false);

                                                                }}
                                                                style={{
                                                                    marginRight: 5,
                                                                    backgroundColor: 'white',
                                                                    borderRadius: 50,
                                                                }}>
                                                                <Entypo name="cross" size={30} color="grey" />
                                                            </TouchableOpacity>

                                                        </View>
                                                    </View>

                                                    {/* Search Input */}
                                                    <View
                                                        style={{
                                                            backgroundColor: 'white',
                                                            width: '80%',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            borderWidth: 1,
                                                            borderColor: '#ccc',
                                                            paddingHorizontal: 10,

                                                        }}
                                                    >
                                                        <Feather name="search" size={20} color="#999" style={{ marginRight: 8 }} />
                                                        <TextInput
                                                            placeholder="Search"
                                                            placeholderTextColor="#999"

                                                            value={searchQuery2}
                                                            onChangeText={setSearchQuery2}
                                                            style={{
                                                                flex: 1,
                                                                paddingVertical: 10,
                                                                fontSize: 16,
                                                                fontFamily: 'Inter-Regular',
                                                                color: 'black',
                                                            }}
                                                        />

                                                        {searchQuery2 ? (
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    setSearchQuery2('');

                                                                }
                                                                }
                                                                style={{
                                                                    padding: 5,
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <Entypo name="cross" size={20} color="black" />
                                                            </TouchableOpacity>
                                                        ) : null}
                                                    </View>
                                                    <View
                                                        style={{
                                                            backgroundColor: 'white',
                                                            width: '80%',
                                                            maxHeight: '70%',


                                                        }}
                                                    >
                                                        <FlatList
                                                            data={filteredStates}
                                                            showsVerticalScrollIndicator={false}
                                                            renderItem={renderStateItem}
                                                            keyExtractor={(item) => item.value}
                                                            keyboardShouldPersistTaps="handled"
                                                        />


                                                    </View>
                                                </View>
                                            </Modal>
                                        </View>
                                    </View>



                                    {/* Buttons */}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            marginTop: 25,

                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                setIsDropdownVisible(false);
                                                setIsStateVisible(false);
                                            }}
                                            style={{
                                                paddingVertical: 10,
                                                paddingHorizontal: 20,
                                                backgroundColor: '#ccc',
                                                borderRadius: 8,
                                                width: '45%',
                                                justifyContent: 'center', alignItems: 'center'
                                            }}
                                        >
                                            <Text style={{ fontFamily: 'Inter-Bold', color: 'black' }}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={async () => {
                                                try {
                                                    setListType(selectedOption);
                                                    await AsyncStorage.setItem('selected_view_type', selectedOption);
                                                    // Fetch the previous state
                                                    const previousState = await AsyncStorage.getItem('selected_state');

                                                    // Determine which state to save
                                                    const stateToSave = tempSelectedState ?? previousState ?? 'All';

                                                    // Update UI and AsyncStorage
                                                    setSelectedState(stateToSave);
                                                    await AsyncStorage.setItem('selected_state', stateToSave);

                                                    // ✅ Set selectedStateOption from label
                                                    const label = StateData.find(item => item.value === stateToSave)?.label;
                                                    if (label) setSelectedStateOption(label);
                                                } catch (e) {
                                                    console.error('Error saving view type', e);
                                                }
                                                setIsDropdownVisible(false);
                                                setIsStateVisible(false);

                                                setSearchVehicle([]);
                                            }}

                                            style={{
                                                paddingVertical: 10,
                                                paddingHorizontal: 20,
                                                backgroundColor: colors.Brown,
                                                borderRadius: 8,
                                                width: '45%',
                                                justifyContent: 'center', alignItems: 'center'
                                            }}
                                        >
                                            <Text style={{ fontFamily: 'Inter-Bold', color: 'white' }}>Apply</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Modal>



                    </View>
                )}

                <View style={{ paddingHorizontal: 10, backgroundColor: 'white' }}>

                </View>


                {SearchLoading ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: 30,
                        }}>
                        <ActivityIndicator size='small' color='black' />
                    </View>


                ) : SearchVehicle.length === 0 && !searchPerformed ? (
                    <View
                        style={{
                            flex: 1,

                            padding: 10,
                            backgroundColor: 'white',
                        }}
                    >


                        {/* Weslcome Text */}
                        {/* <Text
                            style={{
                                fontSize: 20,
                                fontFamily: 'Inter-Bold',
                                color: colors.Brown,
                                marginBottom: 20,
                            }}
                        >
                            Welcome!
                        </Text> */}

                        {/* Easy Reppo Icon Box */}
                        <View
                            style={{
                                backgroundColor: 'white',
                                width: '100%',
                                borderRadius: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 18,
                                borderColor: colors.Brown,
                                borderWidth: 1,

                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 5,
                            }}
                        >
                            <Image
                                source={require('../assets/images/logo.png')} // replace with Easy Reppo icon if available
                                style={{ width: 130, height: 130, resizeMode: 'contain' }}
                            />
                            {/* <Text
                                style={{
                                    fontSize: 16,
                                    fontFamily: 'Inter-Bold',
                                    color: colors.Brown,
                                    textAlign: 'center',
                                }}
                            >
                                Easy Reppo
                            </Text> */}
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                            {!Name ? (
                                <WelcomeShimmer />
                            ) : (
                                <>
                                    <Text
                                        style={{
                                            fontSize: 20,
                                            fontFamily: 'Inter-Bold',
                                            color: '#333',
                                        }}
                                    >
                                        Summary Of
                                    </Text>
                                    <Text
                                        style={{
                                            color: 'black',
                                            fontSize: 20,
                                            fontFamily: 'Inter-Bold',
                                            marginLeft: 5,
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {Name}
                                    </Text>
                                </>
                            )}
                        </View>






                        {/* Info Box Row */}
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                gap: 10, // Optional: Add spacing between boxes (React Native 0.71+)
                                marginTop: 15,
                            }}
                        >
                            {days !== 0 && (
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'white',
                                        padding: 20,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        borderColor: colors.Brown,
                                        borderWidth: 1,
                                    }}
                                >
                                    <Image source={Edit} style={{ width: 50, height: 50 }} />

                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter-Regular',
                                            color: 'black',
                                            marginTop: 7,
                                            textAlign: 'center'
                                        }}
                                    >
                                        Records
                                    </Text>
                                    {totalCount === null || totalCount === undefined ? (
                                        <DigitSizedShimmer />
                                    ) : (
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontFamily: 'Inter-Bold',
                                                marginTop: 7,
                                                color: 'black',
                                            }}
                                        >
                                            {formatIndianNumber(totalCount || 0)}
                                        </Text>
                                    )}
                                </View>
                            )}
                            {/* Remaining Days Box */}
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: 'white',
                                    padding: 20,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    borderColor: colors.Brown,
                                    borderWidth: 1,
                                }}
                            >
                                <Image source={remain} style={{ width: 50, height: 50 }} resizeMode="contain" />

                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter-Regular',
                                        color: 'black',
                                        marginTop: 7,
                                        textAlign: 'center'
                                    }}
                                >
                                    Days Left
                                </Text>
                                {remainingday === null || remainingday === undefined ? (
                                    <DigitSizedShimmer />
                                ) : (
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontFamily: 'Inter-Bold',
                                            marginTop: 7,
                                            color: 'black',
                                        }}
                                    >
                                        {remainingday}
                                    </Text>
                                )}
                            </View>

                            {/* Account Status Box */}
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: 'white',
                                    padding: 20,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    borderColor: colors.Brown,
                                    borderWidth: 1,
                                }}
                            >
                                <Image source={accountstatus} style={{ width: 50, height: 50 }} resizeMode="contain" />

                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter-Regular',
                                        color: 'black',
                                        marginTop: 7,
                                        textAlign: 'center'
                                    }}
                                >
                                    Status
                                </Text>

                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: 'Inter-Bold',
                                        marginTop: 7,
                                        color: days === 0 ? 'red' : 'green',// Green for Active, red for Inactive
                                    }}
                                >
                                    {days === 0 ? 'Schedule Expired' : 'Active'}
                                </Text>
                            </View>
                        </View>


                    </View>

                ) :
                    SearchVehicle.length === 0 && searchPerformed ? (
                        <View
                            style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={vehicle} style={{ width: 70, height: 70, marginTop: 30, }} />
                            <Text
                                style={{
                                    fontFamily: 'Inter-Regular',
                                    color: 'red',
                                    marginTop: 20

                                }}>
                                No Vehicles Found
                            </Text>
                        </View>
                    ) : (
                        <>
                            {isSearched && (
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    marginHorizontal: 0,
                                    marginBottom: 5,
                                }}>
                                    <Text style={{ fontFamily: 'Inter-Bold', color: '#555' }}>
                                        {SearchVehicle.length} Vehicles Found
                                    </Text>
                                    <TouchableOpacity onPress={() => {
                                        setSearchQuery('');
                                        setSearchVehicle([]);
                                        setSearchPerformed(false);
                                        setIsSearched(false);
                                    }}>
                                        <Text style={{ fontFamily: 'Inter-Bold', color: 'red' }}>Clear</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {isSearched && (
                                // <FlatList
                                //     data={SearchVehicle}
                                //     extraData={SearchVehicle}
                                //     keyExtractor={(item) => item.full_vehicle_id.toString()}
                                //     renderItem={listType === 'Grid' ? renderGridItem : renderItem}
                                //     numColumns={listType === 'Grid' ? 2 : 1}
                                //     key={listType === 'Grid' ? 'g' : 'l'} // Force re-render on layout change
                                //     // onEndReached={loadMoreData}
                                //     // onEndReachedThreshold={0.5}
                                //     // ListFooterComponent={loadingMore && <ActivityIndicator size="small" color={colors.primary} />}
                                //     keyboardShouldPersistTaps="handled"
                                //     // refreshControl={
                                //     //     <RefreshControl
                                //     //         refreshing={refreshing}
                                //     //         onRefresh={onRefresh}
                                //     //         colors={['#9Bd35A', '#689F38']}
                                //     //     />
                                //     // }
                                //     contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: keyboardVisible ? 340 : 80 }}
                                //     columnWrapperStyle={listType === 'Grid' ? { justifyContent: 'space-between' } : null}

                                // />

                                <FlatList
                                    data={
                                        listType === "Grid"
                                            ? transformToColumnWise(
                                                [...SearchVehicle].sort((a, b) => {
                                                    const fieldA =
                                                        scheduleType === "Reg No"
                                                            ? a.vehicle_registration_no
                                                            : scheduleType === "Chassis No"
                                                                ? a.vehicle_chassis_no
                                                                : a.vehicle_engine_no;

                                                    const fieldB =
                                                        scheduleType === "Reg No"
                                                            ? b.vehicle_registration_no
                                                            : scheduleType === "Chassis No"
                                                                ? b.vehicle_chassis_no
                                                                : b.vehicle_engine_no;

                                                    return (fieldA || "").localeCompare(fieldB || "");
                                                })
                                            )
                                            : [...SearchVehicle].sort((a, b) => {
                                                const fieldA =
                                                    scheduleType === "Reg No"
                                                        ? a.vehicle_registration_no
                                                        : scheduleType === "Chassis No"
                                                            ? a.vehicle_chassis_no
                                                            : a.vehicle_engine_no;

                                                const fieldB =
                                                    scheduleType === "Reg No"
                                                        ? b.vehicle_registration_no
                                                        : scheduleType === "Chassis No"
                                                            ? b.vehicle_chassis_no
                                                            : b.vehicle_engine_no;

                                                return (fieldA || "").localeCompare(fieldB || "");
                                            })
                                    }
                                    extraData={SearchVehicle}
                                    keyExtractor={(item) => item.full_vehicle_id.toString()}
                                    renderItem={listType === 'Grid' ? renderGridItem : renderItem}
                                    numColumns={listType === 'Grid' ? 2 : 1}
                                    key={listType === 'Grid' ? 'g' : 'l'} // Force re-render on layout change
                                    keyboardShouldPersistTaps="handled"
                                    onScroll={handleScroll}
                                    scrollEventThrottle={16} // smooth scroll events
                                    contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: keyboardVisible ? 340 : 80 }}
                                    columnWrapperStyle={listType === 'Grid' ? { justifyContent: 'space-between' } : null}
                                />

                            )}
                        </>
                    )
                }

            </View>



            <Animated.View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    transform: [{
                        translateY: bottomTabAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 80] // adjust height of bottom tab
                        })
                    }]
                }}
            >
                <Bottomtab />
            </Animated.View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={CloseAppModal}
                onRequestClose={closeExitModal}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={closeExitModal}
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
                            Confirmation
                        </Text>
                        <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
                            Are you sure you want to Really Exit ?
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
                                onPress={closeExitModal}>
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
                                onPress={confirmExit}>
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
                            Logout
                        </Text>
                        <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
                            Are you sure you want to Logout ?
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
                                onPress={confirmLogout}>
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


            {!loadingDone && (
                <Modal visible transparent animationType="fade">
                    <View style={{
                        flex: 1, justifyContent: 'center', alignItems: 'center',
                        backgroundColor: '#00000070'
                    }}>
                        <View style={{
                            width: 320, height: 200, backgroundColor: 'white',
                            borderRadius: 20, justifyContent: 'center', alignItems: 'center',
                            shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.25, shadowRadius: 3.5, elevation: 5,
                            padding: 20,
                        }}>

                            {(isDeleting || isStoringData) &&
                                <View style={{ alignItems: 'center' }}>
                                    <ActivityIndicator color={'#022e29'} size='large' />
                                </View>
                            }
                            {(!isDeleting && !isStoringData) &&

                                <FastImage
                                    source={require('../assets/animations/loader.gif')} // 👈 update path accordingly
                                    style={{
                                        width: 50,
                                        height: 50,
                                        marginBottom: 10,
                                        alignSelf: 'center',
                                    }}
                                    resizeMode='contain'
                                />}

                            <Text style={{
                                marginTop: 10, fontFamily: 'Inter-Bold', color: 'black',
                                fontSize: 18, textAlign: 'center',
                            }}>
                                {isDeleting ? 'Please wait, we are fetching records from server...' : isStoringData ? 'Storing Data...' : 'Downloading Data...'}
                            </Text>

                            {isStoringData ? <Text style={{ fontSize: 14, color: '#555', textAlign: 'center', marginTop: 8, fontFamily: 'Inter-Regular', }}>Please wait while storing data</Text> : null}

                            {(!isDeleting && !isStoringData) &&
                                <>
                                    <Progress.Bar
                                        progress={progressPercent / 100} // 0.0 to 1.0
                                        width={280}
                                        height={10}
                                        borderRadius={5}
                                        color={colors.Brown}
                                        style={{ marginTop: 15 }}
                                    />

                                    <Text style={{
                                        marginTop: 5,
                                        fontSize: 16,
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        {progressPercent}% Completed
                                    </Text>
                                </>}
                        </View>
                    </View>
                </Modal>
            )}



            <Modal
                animationType="fade"
                transparent={true}
                visible={downloadModal}
                onRequestClose={() => setDownloadModal(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={() => setDownloadModal(false)}
                    activeOpacity={1}
                >
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 20,
                            borderRadius: 8,
                            width: '80%',
                            alignItems: 'center',
                        }}
                        onStartShouldSetResponder={() => true}
                        onTouchEnd={e => e.stopPropagation()}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                marginBottom: 10,
                                color: 'black',
                                fontFamily: 'Inter-Medium',
                            }}
                        >
                            Data Not Available
                        </Text>

                        <Text
                            style={{
                                fontSize: 14,
                                marginBottom: 20,
                                textAlign: 'center',
                                color: 'black',
                                fontFamily: 'Inter-Medium',
                            }}
                        >
                            {modalMessage}
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                width: '100%',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#ddd',
                                    padding: 10,
                                    borderRadius: 5,
                                    width: '45%',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={() => setDownloadModal(false)}
                            >
                                <Text
                                    style={{
                                        color: 'black',
                                        fontWeight: 'bold',
                                        fontFamily: 'Inter-Regular',
                                    }}
                                >
                                    Cancel
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
                                    setDownloadModal(false);

                                }}
                            >
                                <Text
                                    style={{
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontFamily: 'Inter-Regular',
                                    }}
                                >
                                    Ok
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>



        </View>
    )
}

export default FirstScreen

const styles = StyleSheet.create({})