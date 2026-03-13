import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, RefreshControl, ScrollView, Modal, TouchableWithoutFeedback, TextInput, FlatList, Image } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ENDPOINTS } from '../CommonFiles/Constant';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Icon from 'react-native-vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import MapView, { Marker } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import SearchHistoryShimmer from '../Component/SearchHistoryShimmer';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

Geocoder.init('AIzaSyBvoWcgSBGvofFvJi2tPnOyr7mj7Plc1pk');

const OtherAppSearchHistory = () => {
    const History = require('../assets/images/history.png');
    const navigation = useNavigation();
    const route = useRoute();
    const { Id, Name } = route.params || {};

    const [SearchHistory, setSearchHistory] = useState([]);
    const [SearchLoading, setSearchLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [location, setLocation] = useState(null);
    const [originalSearchHistory, setOriginalSearchHistory] = useState([]);

    const [page, setPage] = useState(1); // Page number for pagination
    const itemsPerPage = 20; // Number of items to load per page
    const [data, setData] = useState([]);
    const [loadingMore, setLoadingMore] = useState(false);
    const [allLoaded, setAllLoaded] = useState(false);
    const [currentSearch, setCurrentSearch] = useState('');
    const [totalItems, setTotalItems] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [ModalFilter, setModalFilter] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [text, setText] = useState(null);
    const [MapLoading, setMapLoading] = useState(true);
    const [userType, setUsertype] = useState(null);
    const [search, setSearch] = useState(true);
    const [isSearchActive, setIsSearchActive] = useState(false);


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

    const filters = ['Today', 'Yesterday', 'Month', 'custom'];
    const [selectedFilter, setSelectedFilter] = useState('Today'); // Selected filter state
    const [isFilterActive, setIsFilterActive] = useState(false);

    const [Customodal, setCustomodal] = useState(false);
    const [isValidFromDate, setIsValidFromDate] = useState(true);
    const [isValidTillDate, setIsValidTillDate] = useState(true);
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showTillDatePicker, setShowTillDatePicker] = useState(false);

    const getFormattedCurrentDate = () => {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1; // Months are zero-indexed
        const year = today.getFullYear();
        return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day
            }`;
    };

    useEffect(() => {
        if (selectedHistory && selectedHistory.vehicle_location) {
            // console.log('Vehicle Location:', selectedHistory.vehicle_location);
            setMapLoading(true); // API call se pehle loading ko true karo
            setLocation(null); // Purani location ko clear karo

            Geocoder.from(selectedHistory.vehicle_location)
                .then(json => {
                    // console.log('Geocoder Response:', json);
                    if (json.results.length > 0) {
                        const location = json.results[0].geometry.location;
                        // console.log('Parsed Location:', location);
                        setLocation(location);
                    } else {
                        // console.warn('No results found for the location.');
                        setLocation(null); // Location nahi mila to null set karo
                    }
                })
                .catch(error => {
                    console.warn('Geocoding Error:', error);
                    setLocation(null); // Error par bhi null set karo
                })
                .finally(() => {
                    setMapLoading(false); // API call ke baad loading ko false karo
                });
        } else {
            setMapLoading(false); // Agar selectedHistory nahi hai to loading false karo
            setLocation(null); // Purani location ko clear karo
        }
    }, [selectedHistory]);

    useEffect(() => {
        if (location || !selectedHistory) {
            setMapLoading(false); // Jab location mile ya selectedHistory null ho to loading false karo
        }
    }, [location, selectedHistory]);


    // Get the first date of the current month
    const getFirstDateOfCurrentMonth = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        return `${year}-${month < 10 ? `0${month}` : month}-01`;
    };

    // Get the first date of 3 months ago
    const getFirstDateThreeMonthsAgo = () => {
        const today = new Date();
        const year = today.getFullYear();
        let month = today.getMonth() - 2; // subtract 2 because JS months start at 0
        let adjustedYear = year;

        if (month < 0) {
            month += 12;      // wrap around
            adjustedYear -= 1; // adjust year
        }

        return `${adjustedYear}-${month + 1 < 10 ? `0${month + 1}` : month + 1}-01`;
    };

    const getYesterdayDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1); // Subtract one day
        const day = yesterday.getDate();
        const month = yesterday.getMonth() + 1;
        const year = yesterday.getFullYear();
        return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day
            }`;
    };

    const [fromDate, setFromDate] = useState(getFirstDateThreeMonthsAgo());
    const [tillDate, setTillDate] = useState(getFormattedCurrentDate());

    const openModal2 = () => {
        setModalFilter(true);
    };

    const closeModal2 = () => {
        setModalFilter(false);
    };

    const handleFilterPress = filter => {
        setSelectedFilter(filter); // Update selected filter
        setIsFilterActive(filter !== '');

        let updatedFromDate = '';
        let updatedTillDate = '';

        // Handle date range based on selected filter
        if (filter === 'Today') {
            updatedFromDate = getFormattedCurrentDate();
            updatedTillDate = getFormattedCurrentDate();
        } else if (filter === 'Yesterday') {
            updatedFromDate = getYesterdayDate();
            updatedTillDate = getYesterdayDate();
        } else if (filter === 'Month') {
            updatedFromDate = getFirstDateOfCurrentMonth();
            updatedTillDate = getFormattedCurrentDate();
        } else if (filter === 'custom') {
            setCustomodal(true);
            setIsValidFromDate(true);
            setIsValidTillDate(true);
            setFromDate('');
            setTillDate('');
        }

        if (filter !== 'custom') {
            setFromDate(updatedFromDate);
            setTillDate(updatedTillDate);
            SearchHistoryApi(updatedFromDate, updatedTillDate);
        }
        closeModal2();
    };

    useFocusEffect(
        useCallback(() => {
            // if (fromDate && tillDate) {
            if (search == true) {
                setSearchLoading(true);
                SearchHistoryApi(fromDate, tillDate);
            }
            // }
        }, [fromDate, tillDate, search])
    );

    const handleSubmit = () => {
        const isFromDateValid = fromDate !== '';
        const isTillDateValid = tillDate !== '';

        // Set validation states
        setIsValidFromDate(isFromDateValid);
        setIsValidTillDate(isTillDateValid);

        // Check if both dates are valid
        if (!isFromDateValid || !isTillDateValid) {
            // If either fromDate or tillDate is invalid, show the validation error
            if (!isFromDateValid) {
            }
            if (!isTillDateValid) {
            }
            return; // Prevent form submission if validation fails
        }
        // If both dates are valid, proceed with the API call
        setCustomodal(false); // Close modal after submitting
        SearchHistoryApi(fromDate, tillDate);
    };

    const loadMoreData = () => {
        if (loadingMore || allLoaded) return;

        if (isSearchActive) {
            // If search is active, load more search results
            handleSearch(currentSearch, page + 1);
        } else {
            // If not searching, load more from normal API
            SearchHistoryApi(fromDate, tillDate, page + 1);
        }
    };

    const openModal = item => {
        setSelectedHistory(item); // Set selected item data to show in the modal
        setModalVisible(true); // Show the modal
    };

    const closeModal = () => {
        setModalVisible(false); // Hide the modal
        setSelectedHistory(null); // Clear the selected item data
    };

    const formattedDate = dateString => {
        const date = new Date(dateString); // Convert the string to a Date object
        const day = String(date.getDate()).padStart(2, '0'); // Get the day and ensure it's 2 digits
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Get the month (0-indexed, so add 1) and ensure it's 2 digits
        const year = date.getFullYear(); // Get the year

        return `${day}-${month}-${year}`; // Return the formatted date as "DD-MM-YYYY"
    };

    const formatDate = date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding leading zero
        const day = String(date.getDate()).padStart(2, '0'); // Adding leading zero
        return `${year}-${month}-${day}`; // New format: "YYYY-MM-DD"
    };

    const handleDateChange = (event, selectedDate, type) => {
        if (event.type === 'dismissed') {
            if (type === 'from') {
                setShowFromDatePicker(false); // Close From Date picker if cancelled
            } else {
                setShowTillDatePicker(false); // Close Till Date picker if cancelled
            }
            return;
        }
        // If selectedDate is null (meaning the user cancelled), don't update the date
        if (!selectedDate) {
            return;
        }

        const currentDate = selectedDate || new Date(); // Default to the selected date or current date
        if (type === 'from') {
            setFromDate(formatDate(currentDate)); // Set formatted 'from' date
        } else {
            setTillDate(formatDate(currentDate)); // Set formatted 'till' date
        }

        // Close the date picker after selecting the date
        if (type === 'from') {
            setShowFromDatePicker(false);
        } else {
            setShowTillDatePicker(false);
        }
    };

    const allLoadedRef = useRef(allLoaded);
    useEffect(() => {
        allLoadedRef.current = allLoaded;
    }, [allLoaded]);

    const [showNoData, setShowNoData] = useState(false);

    const [hasSearched, setHasSearched] = useState(false);

    const SearchHistoryApi = async (fromdate, tilldate, pageNumber = 1) => {
        if (allLoadedRef.current) return;
        setLoadingMore(true);
        try {
            const rentAgencyId = 0;
            const response = await fetch(ENDPOINTS.other_app_history, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_date: fromdate,
                    till_date: tilldate,
                    rent_agency_id: rentAgencyId,
                    page: pageNumber.toString(), // ✅ page bhejna
                    other_agency_id: Id
                }),
            });

            console.log('Fetching page:', pageNumber, 'from', fromdate, 'to', tilldate, rentAgencyId, Id);
            const result = await response.json();
            if (result.code == 200) {
                if (pageNumber == 1) {
                    // page 1 → replace data
                    setSearchHistory(result.payload);
                } else {
                    // page 2+ → append
                    setSearchHistory((prev) => [...prev, ...result.payload]);
                }
                // Agar payload ka size 0 hai → sab data load ho gaya
                if (result.payload.length === 0) {
                    setAllLoaded(true);
                } else {
                    setAllLoaded(false);
                }

                setPage(pageNumber); // current page update
            } else {
                if (pageNumber == 1) setSearchHistory([]);
                console.log('Error loading data', result.message || result.code);
            }
        } catch (error) {
            console.log('Error fetching data:', error.message);
        } finally {
            setLoadingMore(false);
            setSearchLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setIsFilterActive(false);
        setSelectedFilter('Today');
        const today = getFormattedCurrentDate();

        // Set both from and till date to today
        setFromDate(today);
        setTillDate(today);
        await SearchHistoryApi(today, today);
        await fetchPermissions();
        setRefreshing(false);
    };

    const handleSearch = async (inputText, pageNumber = 1) => {
        if (!inputText || inputText.trim() === '') {
            // If search is empty, revert to showing all data
            setIsSearchActive(false);
            setCurrentSearch('');
            setPage(1);
            setAllLoaded(false);
            setSearchLoading(true);
            setHasSearched(false);
            SearchHistoryApi(fromDate, tillDate, 1);
            return;
        }
        const storedAgencyId = await AsyncStorage.getItem('rent_agency_id');
        const rentAgencyId = 0;
        setCurrentSearch(inputText);
        setIsSearchActive(true);
        setHasSearched(true);
        setLoadingMore(true);

        try {
            const response = await fetch(ENDPOINTS.search_other_app_history, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    search: inputText,
                    rent_agency_id: rentAgencyId,
                    page: pageNumber.toString(),
                    other_agency_id: Id
                }),
            });
            const result = await response.json();
            if (result.code == 200) {
                console.log('search inside search')
                if (pageNumber === 1) {
                    setSearchHistory(result.payload);
                } else {
                    console.log('merge')
                    setSearchHistory((prev) => [...prev, ...result.payload]);
                }
                if (result.payload.length === 0) {
                    setAllLoaded(true);
                } else {
                    setAllLoaded(false);
                }
                setPage(pageNumber);
            } else {
                if (pageNumber == 1) setSearchHistory([]);
                // console.log('Search API error', result.message || result.code);
            }
        } catch (error) {
            console.log('Search API error:', error);
        } finally {
            setLoadingMore(false);
            setSearchLoading(false);
        }
    };
    // Update the cross button handler
    const handleClearSearch = async () => {
        console.log('called');
        setText('');
        setIsSearchActive(false);
        setCurrentSearch('');
        setPage(1);
        setAllLoaded(false);
        setHasSearched(false);
        setSearchHistory([]);
        setSearchLoading(true);
        try {
            await SearchHistoryApi(fromDate, tillDate, 1);
            console.log('API finished');
        } catch (e) {
            console.log('API error', e);
            setSearchHistory([]); // Only clear if there's an error
        }
    };

    // Update the search button handler
    const handleSearchPress = () => {
        if ((text || '').trim() === '') {
            // If search is empty, show all data
            handleClearSearch();
        } else {
            // If search has text, perform search
            handleSearch(text);
            setSearchLoading(true);
        }
    };

    // Update the text change handler
    const handleTextChange = (inputText) => {
        setText(inputText);
        // Agar text empty hai toh immediately data clear karo taaki shimmer dikhe
        if (inputText == '') {
            handleClearSearch();
        }
    };

    const renderItem = ({ item, index }) => (
        <View style={{ marginTop: 10, backgroundColor: '#fff', padding: 5, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.Brown, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, }} >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, }} >
                <View style={{ width: '10%', }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', fontFamily: 'Inter-Regular', }} >#{index + 1}</Text>
                </View>
                <View style={{ width: '80%', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', fontFamily: 'Inter-Regular', }} >{item.history_staff_name || '----'}</Text>
                </View>
                <View style={{ width: '10%', }}>
                    <TouchableOpacity onPress={() => openModal(item)} style={{ padding: 5, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', }} >
                        <AntDesign name="infocirlceo" size={20} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Use flexWrap: 'wrap' to ensure content wraps to the next line if it overflows */}
            <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                <View style={{ width: '50%', flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 12, color: '#888', fontFamily: 'Inter-Regular' }}>RegNo</Text>
                    <Text style={{ fontSize: 12, color: '#333', fontFamily: 'Inter-Regular' }}> : </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            color: '#333',
                            fontFamily: 'Inter-Regular',
                            flexWrap: 'wrap',
                        }}
                    >
                        {item.vehicle_registration_no || '----'}
                    </Text>
                </View>

                <View style={{ width: '50%', flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 12, color: '#888', fontFamily: 'Inter-Regular' }}>Date</Text>
                    <Text style={{ fontSize: 12, color: '#333', fontFamily: 'Inter-Regular' }}> : </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            color: '#333',
                            fontFamily: 'Inter-Regular',
                            flexWrap: 'wrap', // Allow wrapping of long text
                        }}
                    >
                        {item.entry_date || '----'}
                    </Text>
                </View>
            </View>



            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 12, color: '#888', fontFamily: 'Inter-Regular' }}>Agg No</Text>
                    <Text style={{ fontSize: 12, color: '#333', fontFamily: 'Inter-Regular' }}> : </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            color: '#333',
                            fontFamily: 'Inter-Regular',
                            flexWrap: 'wrap', // Allow wrapping of long text
                        }}
                    >
                        {item.vehicle_agreement_no || '----'}
                    </Text>
                </View>


            </View>


            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                <View style={{ width: '80%', flexDirection: 'row' }}>
                    <Text style={{ fontSize: 12, color: '#888', fontFamily: 'Inter-Regular' }}>Location</Text>
                    <Text style={{ fontSize: 12, color: '#333', fontFamily: 'Inter-Regular' }}> : </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            color: '#333',
                            fontFamily: 'Inter-Regular',
                            flexWrap: 'wrap', // Allow wrapping of long text
                        }}
                    >
                        {item.vehicle_location || '----'}
                    </Text>
                </View>
            </View>
        </View>
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
                const staffStatus = result?.payload?.[0]?.staff_status;
                const userType = result?.payload?.[0]?.user_type;
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
                //     visibilityTime: 2000,
                // });
            }
        } catch (error) {
            console.log('Logout error:', error.message);

        }
    };


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

    return (
        <View style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
            {/* Header */}
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
                    Search History
                </Text>


                {/* {(
            userType === 'SuperAdmin' ||
            (userType === 'SubAdmin' && permissions?.search_history?.searchfilter) ||
            (userType === 'main' && permissions?.search_history?.searchfilter)
  
          ) && (
  
  
  
              <TouchableOpacity
                style={{
                  width: '15%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'absolute',
                  right: 6,
                  top: 5,
  
                  height: 50,
  
  
                }}
                onPress={openModal2}>
                {isFilterActive && (
                  <View
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      width: 8,
                      height: 8,
                      borderRadius: 5,
                      backgroundColor: 'white',
                    }}
                  />
                )}
                <TouchableOpacity onPress={openModal2}>
                  <AntDesign name="filter" size={30} color="white" />
                </TouchableOpacity>
              </TouchableOpacity>
            )} */}
            </View>

            <View style={{ width: '100%', flexDirection: 'row', paddingHorizontal: 10, marginTop: 5 }}>
                {/* Search Box */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        borderWidth: 1,
                        borderColor: colors.Brown,
                        borderRadius: 8,
                        backgroundColor: 'white',
                        height: 50,
                        paddingHorizontal: 8,
                    }}
                >
                    <View style={{
                        width: 30,  // निश्चित width दी है
                        height: 50, // पूरी height ली है
                        justifyContent: 'center',
                        alignItems: 'center',

                    }}>
                        <MaterialIcons name='search' size={24} color='black' />
                    </View>

                    <TextInput
                        autoCapitalize="words"
                        style={{
                            flex: 1,
                            fontSize: 16,
                            fontFamily: 'Inter-Regular',
                            color: 'black',
                        }}
                        placeholder="Search Name/Veh No/Agg No"
                        placeholderTextColor="grey"
                        value={text}
                        // onChangeText={setText} // ✅ typing par sirf text set hoga
                        onChangeText={handleTextChange}
                    />

                    {text ? (
                        <TouchableOpacity
                            // onPress={() => {
                            //   setText('');
                            //   setCurrentSearch('');

                            //   setPage(1);
                            //   setAllLoaded(false);

                            //   setSearchLoading(true);   // loader sabse pehle
                            //   setSearchHistory([]);     // list clear karo
                            //   handleSearch('');
                            // }}
                            onPress={handleClearSearch}
                            style={{
                                padding: 6,
                                borderRadius: 20,
                                backgroundColor: '#f2f2f2',
                                marginLeft: 5,
                            }}
                        >
                            <Entypo name="cross" size={18} color="black" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Search Button */}
                <TouchableOpacity
                    // onPress={() => {
                    //   handleSearch(text);

                    //   setSearchLoading(true);
                    // }
                    // }// ✅ ab yaha click se chalega
                    onPress={handleSearchPress}
                    style={{
                        marginLeft: 8,
                        width: 50,
                        height: 50,
                        borderRadius: 8,
                        backgroundColor: colors.Brown,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <FontAwesome name="search" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#8B4513', '#8B4513']}
                    />
                }
                contentContainerStyle={{ paddingHorizontal: 10 }}>
                {/* Loading Indicator */}
                {SearchLoading ? (
                    <SearchHistoryShimmer />
                ) : SearchHistory.length === 0 ? (
                    hasSearched ? ( // ✅ Agar search kiya hai aur data nahi mila
                        <View style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={History} style={{ width: 70, height: 70 }} />
                            <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                                No Search History Found
                            </Text>
                        </View>
                    ) : ( // ✅ Agar abhi tak search nahi kiya (initial load)
                        <SearchHistoryShimmer />
                    )
                ) : (
                    <FlatList
                        data={SearchHistory}
                        keyExtractor={(item) => item.history_id.toString()}
                        renderItem={renderItem}
                        onEndReached={loadMoreData}
                        onEndReachedThreshold={0.5}
                        keyboardShouldPersistTaps="handled"
                        ListFooterComponent={
                            loadingMore ? (
                                null
                                // <ActivityIndicator size="small" color={colors.Brown} style={{ marginVertical: 10 }} />
                            ) : allLoaded ? (
                                <Text style={{ textAlign: 'center', padding: 10, color: 'grey', fontFamily: 'Inter-Regular' }}>
                                    No more data
                                </Text>
                            ) : null
                        }
                    />
                )}

            </ScrollView>
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dimmed background
                    }}
                    activeOpacity={1}
                    onPress={closeModal}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            width: '85%',
                            paddingVertical: 5,
                        }}>
                        <TouchableOpacity
                            onPress={closeModal}
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
                            backgroundColor: 'white',
                            padding: 20,
                            borderRadius: 15,
                            width: '85%',
                            maxHeight: '100%', // Ensure modal does not overflow
                        }}
                        onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
                        onTouchEnd={e => e.stopPropagation()}>
                        {selectedHistory && (
                            <>
                                {/* <TouchableOpacity
                    style={{
                      position: 'absolute',
                      right: 5,
                      top: 12,
                      width: '20%',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                    onPress={closeModal}>
                    <Entypo name="cross" size={30} color="black" />
                  </TouchableOpacity> */}

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
                                            fontSize: 16,
                                            fontFamily: 'Inter-Medium',

                                            color: 'black',
                                            textAlign: 'center',
                                            textTransform: 'uppercase'
                                        }}>
                                        Search History Details
                                    </Text>
                                    {/* <TouchableOpacity onPress={closeModal} style={{ padding: 2, position: 'absolute', top: -10, right: -10 }}>
  
  
                      <Entypo name='cross' color='black' size={25} />
                    </TouchableOpacity> */}
                                </View>


                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={{ marginBottom: 20 }}
                                >
                                    {[
                                        { label: 'Staff Name', value: selectedHistory.history_staff_name || '-----' },
                                        { label: 'Staff Mobile', value: selectedHistory.history_staff_mobile || '-----' },
                                        { label: 'Vehicle Agreement No', value: selectedHistory.vehicle_agreement_no || '-----' },
                                        { label: 'Vehicle Registration No', value: selectedHistory.vehicle_registration_no || '-----' },
                                        { label: 'Entry Date', value: selectedHistory.entry_date || '-----' },
                                        { label: 'Vehicle Location', value: selectedHistory.vehicle_location || '-----' },
                                    ].map((item, index) => (
                                        <View
                                            key={index}
                                            style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}
                                        >
                                            {/* Label */}
                                            <View style={{
                                                width: '40%',

                                                borderLeftWidth: 1,
                                                borderBottomWidth: 1,
                                                borderColor: 'black',
                                                padding: 5,
                                            }}>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily: 'Inter-Regular',
                                                        color: 'black',
                                                        textAlign: 'left',
                                                        flexWrap: 'wrap',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                    {item.label}
                                                </Text>
                                            </View>



                                            {/* Value */}
                                            <View style={{
                                                width: '60%',

                                                borderLeftWidth: 1,
                                                borderBottomWidth: 1,
                                                borderRightWidth: 1,
                                                borderColor: 'black',
                                                padding: 5,
                                            }}>
                                                <Text
                                                    style={[
                                                        {
                                                            fontSize: 12,
                                                            color: 'black',
                                                            fontFamily: 'Inter-Bold',
                                                            textAlign: 'left',
                                                            flexWrap: 'wrap',
                                                        },

                                                    ]}>
                                                    {item.value}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>


                            </>
                        )}

                        {MapLoading ? (
                            <ActivityIndicator size="large" color={colors.Brown} />
                        ) : location ? (
                            <MapView
                                style={{ width: '100%', height: 200 }}
                                region={{
                                    latitude: location.lat,
                                    longitude: location.lng,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                }}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: location.lat,
                                        longitude: location.lng,
                                    }}
                                    title={selectedHistory?.vehicle_location || 'Location'}
                                />
                            </MapView>
                        ) : (
                            <Text style={{ fontSize: 16, color: 'red', textAlign: 'center', fontFamily: 'Inter-Regular' }}>
                                No Location Found
                            </Text>
                        )}


                    </View>
                </TouchableOpacity>
            </Modal>
            {/* filter modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={ModalFilter}
                onRequestClose={closeModal2}>
                <TouchableWithoutFeedback onPress={closeModal2}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                        }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-end',
                                width: '100%',
                                paddingVertical: 5,
                            }}>
                            <TouchableOpacity
                                onPress={closeModal2}
                                style={{
                                    marginRight: 10,
                                    backgroundColor: 'white',
                                    borderRadius: 50,
                                }}>
                                <Entypo name="cross" size={25} color="black" />
                            </TouchableOpacity>
                        </View>
                        <View
                            onStartShouldSetResponder={e => e.stopPropagation()}
                            style={{
                                backgroundColor: 'white',
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                padding: 20,
                                width: '100%',
                                paddingBottom: 40,
                            }}>
                            <Text
                                style={{
                                    color: 'black',
                                    fontFamily: 'Inter-Medium',
                                    fontSize: 18,
                                    marginBottom: 10,
                                    textAlign: 'left',
                                }}>
                                Change Date
                            </Text>
                            {filters.map((filter, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={{
                                        backgroundColor:
                                            selectedFilter === filter ? colors.LightGrey : 'white',
                                        padding: 10,
                                        width: '100%',
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#ccc',
                                        borderRadius: 5,
                                    }}
                                    onPress={() => handleFilterPress(filter)}>
                                    <Text
                                        style={{
                                            color: selectedFilter === filter ? 'black' : 'black',
                                            fontFamily: 'Inter-Regular',
                                            fontSize: 16,
                                        }}>
                                        {filter}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* custom modal */}

            <Modal visible={Customodal} animationType="slide" transparent={true}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={() => {
                        setCustomodal(false);
                    }}
                    activeOpacity={1}>
                    <View
                        style={{
                            width: '80%',
                            padding: 20,
                            backgroundColor: 'white',
                            borderRadius: 10,
                            alignItems: 'center',
                        }}
                        onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
                        onTouchEnd={e => e.stopPropagation()}>
                        <View
                            style={{
                                justifyContent: 'flex-end',
                                flexDirection: 'row',
                                width: '100%',
                            }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setCustomodal(false);
                                }}>
                                <Entypo name="cross" size={24} color="Black" />
                            </TouchableOpacity>
                        </View>
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                marginBottom: 20,
                                fontFamily: 'Inter-Medium',
                            }}>
                            Custom History
                        </Text>

                        {/* From and Till Date in a row */}
                        <View
                            style={{
                                marginTop: 15,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginBottom: 15,
                            }}>
                            {/* From Date */}
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontWeight: '500',
                                        marginBottom: 5,
                                        color: 'black',
                                        fontFamily: 'Inter-Medium',
                                    }}>
                                    From Date
                                </Text>
                                <TouchableOpacity
                                    style={{
                                        padding: 10,
                                        backgroundColor: '#ffffff',
                                        borderRadius: 5,
                                        borderWidth: 1,
                                        borderColor: !isValidFromDate ? 'red' : '#cccccc',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                    }}
                                    onPress={() => setShowFromDatePicker(true)}>
                                    <Text style={{ fontSize: 10, color: '#333', fontFamily: 'Inter-Regular', }}>{fromDate ? formattedDate(fromDate) : 'Select From Date'}</Text>
                                    <FontAwesome name="calendar" size={20} />
                                </TouchableOpacity>
                                {!isValidFromDate && (
                                    <Text style={{ color: 'red', fontSize: 12, fontFamily: 'Inter-Regular', }}> From Date is required </Text>
                                )}
                            </View>

                            {/* Till Date */}
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 5, color: 'black', fontFamily: 'Inter-Medium', }}> Till Date </Text>
                                <TouchableOpacity style={{ padding: 10, backgroundColor: '#ffffff', borderRadius: 5, borderWidth: 1, borderColor: !isValidTillDate ? 'red' : '#cccccc', flexDirection: 'row', justifyContent: 'space-between', }}
                                    onPress={() => setShowTillDatePicker(true)}>
                                    <Text style={{ fontSize: 10, color: '#333', fontFamily: 'Inter-Regular', }}> {tillDate ? formattedDate(tillDate) : 'Select Till Date'}</Text>
                                    <TouchableOpacity onPress={() => setShowTillDatePicker(true)}>
                                        <FontAwesome name="calendar" size={20} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                                {!isValidTillDate && (
                                    <Text
                                        style={{
                                            color: 'red',
                                            fontSize: 12,
                                            fontFamily: 'Inter-Regular',
                                        }}>
                                        Till Date is required
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Show Date Pickers */}
                        {showFromDatePicker && (
                            <DateTimePicker
                                value={
                                    fromDate
                                        ? new Date(fromDate.split('/').reverse().join('-'))
                                        : new Date()
                                }
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) =>
                                    handleDateChange(event, selectedDate, 'from')
                                }
                                minimumDate={new Date('1900-01-01')} // Allow dates from 1900 or earlier, adjust as per requirement
                                maximumDate={new Date()} // Restrict future dates
                            />
                        )}

                        {showTillDatePicker && (
                            <DateTimePicker
                                value={
                                    tillDate
                                        ? new Date(tillDate.split('/').reverse().join('-'))
                                        : new Date()
                                }
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) =>
                                    handleDateChange(event, selectedDate, 'till')
                                }
                                minimumDate={
                                    fromDate
                                        ? new Date(fromDate.split('/').reverse().join('-'))
                                        : new Date()
                                } // Set minimumDate to From Date
                                maximumDate={new Date()}
                            />
                        )}

                        {/* Action Buttons */}
                        <View style={{ flexDirection: 'row', marginTop: 20, }}>
                            <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: colors.Brown, borderRadius: 5, }} onPress={handleSubmit}>
                                <Text style={{ fontSize: 16, color: 'white', fontFamily: 'Inter-Regular', }}>View</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};
export default OtherAppSearchHistory