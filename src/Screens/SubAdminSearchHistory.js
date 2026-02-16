import { ActivityIndicator, ScrollView, FlatList, Image, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ENDPOINTS } from '../CommonFiles/Constant';
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SearchHistoryShimmer from '../Component/SearchHistoryShimmer';
import AntDesign from 'react-native-vector-icons/AntDesign';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
Geocoder.init('AIzaSyBvoWcgSBGvofFvJi2tPnOyr7mj7Plc1pk');

const SubAdminSearchHistory = () => {
    const History = require('../assets/images/history.png');
    const navigation = useNavigation();
    const route = useRoute();
    const [text, setText] = useState(null);
    const { agencyId, agencyName } = route.params;
    const [SearchHistory, setSearchHistory] = useState([]);
    console.log("search history aa gaya ab", agencyId);
    const [refreshing, setRefreshing] = useState(false);
    const [totalItems, setTotalItems] = useState(0);

    const [selectedFilter, setSelectedFilter] = useState('Month');

    const filters = ['All', 'Today', 'Yesterday', 'Month', 'custom'];

    const [originalSearchHistory, setoriginalSearchHistory] = useState('');
    const [loadingMore, setLoadingMore] = useState(false);
    const [isFilterActive, setIsFilterActive] = useState(false);


    const [Customodal, setCustomodal] = useState(false);
    const [isValidFromDate, setIsValidFromDate] = useState(true);
    const [isValidTillDate, setIsValidTillDate] = useState(true);
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showTillDatePicker, setShowTillDatePicker] = useState(false);

    const [userType, setUsertype] = useState(null);


    const [page, setPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [allLoaded, setAllLoaded] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [currentSearch, setCurrentSearch] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const [selectedHistory, setSelectedHistory] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [MapLoading, setMapLoading] = useState(true);
    const [location, setLocation] = useState(null);



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
        if (selectedFilter === 'All') {
            // If "All" is selected, set fromDate and tillDate to empty
            setFromDate('');
            setTillDate('');
            fetchSearchHistory('', ''); // Fetch without date filter
        } else {
            // Fetch based on other filters (when fromDate and tillDate are set)
            handleFilterPress(selectedFilter);
        }
    }, [selectedFilter]);

    const [permissions, setPermissions] = useState({});


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

    const [loading, setLoading] = useState(false);

    const [ModalFilter, setModalFilter] = useState(false);

    const openModal2 = () => {
        setModalFilter(true);
    };



    const closeModal2 = () => {
        setModalFilter(false);
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

    const getFirstDateOfCurrentMonth = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        return `${year}-${month < 10 ? `0${month}` : month}-01`;
    };

    const getFormattedCurrentDate = () => {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1; // Months are zero-indexed
        const year = today.getFullYear();
        return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day
            }`;
    };


    const [fromDate, setFromDate] = useState('');
    const [tillDate, setTillDate] = useState('');


    const formattedDate = dateString => {
        console.log("date string hai", dateString);
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



    const handleFilterPress = filter => {
        setSelectedFilter(filter); // Update selected filter
        // setIsFilterActive(filter !== '');
        // // setIsFilterActive(true);

        if (filter !== 'Month') {
            setIsFilterActive(true);
        }
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
        } else if (filter === 'All') {
            updatedFromDate = ''; // Reset the dates for 'All'
            updatedTillDate = ''; // Reset the dates for 'All'
        }

        // Log the selected filter and date values for debugging


        if (filter !== 'custom') {
            setFromDate(updatedFromDate);
            setTillDate(updatedTillDate);
            fetchSearchHistory(updatedFromDate, updatedTillDate);
        }

        closeModal2();
    };

    const fetchSearchHistory = async (fromdate, tilldate, pageNumber = 1) => {
        console.log("Fetching page:", pageNumber, "from", fromdate, "to", tilldate, "agencyId", agencyId);

        if (pageNumber === 1) {
            setSearchLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const response = await fetch(ENDPOINTS.subadmin_vehicle_history_paginate, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from_date: fromdate,
                    till_date: tilldate,
                    rent_agency_id: agencyId,
                    page: pageNumber.toString(),
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const result = await response.json();

            if (result.code === 200 && Array.isArray(result.payload)) {
                if (pageNumber === 1) {
                    setSearchHistory(result.payload);
                    setoriginalSearchHistory(result.payload);
                } else {
                    setSearchHistory(prev => [...prev, ...result.payload]);
                }

                // Check if all data is loaded
                if (result.payload.length < itemsPerPage) {
                    setAllLoaded(true);
                } else {
                    setAllLoaded(false);
                }

                setPage(pageNumber);
            } else {
                if (pageNumber === 1) {
                    setSearchHistory([]);
                    setoriginalSearchHistory([]);
                }
            }
        } catch (error) {
            console.error('Error fetching agency list:', error.message);
            if (pageNumber === 1) {
                setSearchHistory([]);
            }
        } finally {
            setSearchLoading(false);
            setLoadingMore(false);
        }
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
            fetchSearchHistory(fromDate, tillDate, 1);
            return;
        }

        setCurrentSearch(inputText);
        setIsSearchActive(true);
        setHasSearched(true);

        if (pageNumber === 1) {
            setSearchLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const response = await fetch(ENDPOINTS.subadmin_vehicle_history_search, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    search: inputText,
                    rent_agency_id: agencyId,
                    page: pageNumber.toString(),
                }),
            });

            const result = await response.json();

            if (result.code === 200) {
                if (pageNumber === 1) {
                    setSearchHistory(result.payload);
                } else {
                    setSearchHistory(prev => [...prev, ...result.payload]);
                }

                // Check if all data is loaded
                if (result.payload.length < itemsPerPage) {
                    setAllLoaded(true);
                } else {
                    setAllLoaded(false);
                }

                setPage(pageNumber);
            } else {
                if (pageNumber === 1) setSearchHistory([]);
            }
        } catch (error) {
            console.log('Search API error:', error);
            if (pageNumber === 1) setSearchHistory([]);
        } finally {
            setSearchLoading(false);
            setLoadingMore(false);
        }
    };




    useEffect(() => {
        if (fromDate && tillDate) {
            if (new Date(fromDate) <= new Date(tillDate)) {
                console.log("Valid date range. Fetching data.");
                fetchSearchHistory(fromDate, tillDate);

            } else {
                console.warn("Invalid date range: From Date is after Till Date");
                setSearchHistory([]);
            }
        }
    }, [fromDate, tillDate]);


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
        fetchSearchHistory(fromDate, tillDate);
    };

    const handleClearSearch = () => {
        setText('');
        setIsSearchActive(false);
        setCurrentSearch('');
        setPage(1);
        setAllLoaded(false);
        setHasSearched(false);
        setSearchLoading(true);
        fetchSearchHistory(fromDate, tillDate, 1);
    };

    const handleTextChange = (inputText) => {
        setText(inputText);

        // If input is empty, revert to showing all data
        if (inputText === '') {
            handleClearSearch();
        }
    };
    const loadMoreData = () => {
        if (loadingMore || allLoaded) return;

        if (isSearchActive) {
            // If search is active, load more search results
            handleSearch(currentSearch, page + 1);
        } else {
            // If not searching, load more from normal API
            fetchSearchHistory(fromDate, tillDate, page + 1);
        }
    };


    useEffect(() => {
        loadMoreData();
    }, []);

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


    const onRefresh = async () => {
        setRefreshing(true);
        setIsFilterActive(false);
        setSelectedFilter('Month');
        const today = getFormattedCurrentDate();
        const Monthday = getFirstDateOfCurrentMonth();

        // Set both from and till date to today
        setFromDate(Monthday);
        setTillDate(today);

        await fetchSearchHistory(Monthday, today);

        setText('');
        setRefreshing(false);
    };

    const openModal = item => {
        setSelectedHistory(item); // Set selected item data to show in the modal
        setModalVisible(true); // Show the modal
    };
    const closeModal = () => {
        setModalVisible(false); // Hide the modal
        setSelectedHistory(null); // Clear the selected item data
    };


    const renderItem = ({ item, index }) => (
        <View
            key={item.id}
            style={{
                marginTop: 10,
                backgroundColor: '#fff',
                padding: 5,
                marginBottom: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.Brown,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 3,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 2,

                }}
            >
                <View style={{ width: '10%', }}>



                    <Text
                        style={{
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#333',
                            fontFamily: 'Inter-Regular',
                        }}
                    >
                        #{index + 1}
                    </Text>
                </View>
                <View style={{ width: '80%', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                    <Text
                        style={{
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#333',
                            fontFamily: 'Inter-Regular',
                            textAlign: 'center'
                        }}
                    >
                        {item.staff_name || '----'}
                    </Text>
                </View>

                <View style={{ width: '10%', }}>
                    <TouchableOpacity
                        onPress={() => openModal(item)}
                        style={{
                            padding: 5,
                            borderRadius: 50,
                            backgroundColor: '#f0f0f0',
                            justifyContent: 'center',
                            alignItems: 'center',

                        }}
                    >
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
                            flexWrap: 'wrap', // Allow wrapping of long text
                        }}
                    >
                        {item.rc_no || '----'}
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


                <View style={{ width: '50%', flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 12, color: '#888', fontFamily: 'Inter-Regular' }}>Eng No</Text>
                    <Text style={{ fontSize: 12, color: '#333', fontFamily: 'Inter-Regular' }}> : </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            color: '#333',
                            fontFamily: 'Inter-Regular',
                            flexWrap: 'wrap', // Allow wrapping of long text
                        }}
                    >
                        {item.engine_no || '----'}
                    </Text>
                </View>

            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>

                <View style={{ width: '50%', flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 12, color: '#888', fontFamily: 'Inter-Regular' }}>Chassis No</Text>
                    <Text style={{ fontSize: 12, color: '#333', fontFamily: 'Inter-Regular' }}> : </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            color: '#333',
                            fontFamily: 'Inter-Regular',
                            flexWrap: 'wrap', // Allow wrapping of long text
                        }}
                    >
                        {item.chassis_no || '----'}
                    </Text>
                </View>
                <View style={{ width: '50%', flexDirection: 'row', flexWrap: 'wrap' }}>
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
                        {item.agreement_no || '----'}
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
                        {item.location || '----'}
                    </Text>
                </View>
            </View>



        </View>
    );
    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            {/* Header */}
            <View style={{
                backgroundColor: colors.Brown || '#8B4513',
                paddingVertical: 15,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
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
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Bold',
                        textTransform: 'uppercase',
                        maxWidth: '80%', // Avoid overlapping
                        textAlign: 'center',

                    }}
                >
                    {agencyName}-Search History
                </Text>


                {/* {(
                    userType === 'SuperAdmin' ||
                    (userType === 'SubAdmin' && permissions?.subadmin_history?.searchfilter) ||
                    (userType === 'main' && permissions?.subadmin_history?.searchfilter)

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
            {/* <View style={{ width: '100%', paddingLeft: 20, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }}>
                {SearchHistory.length > 0 && (
                    <>
                        <Text style={{ fontSize: 12, color: 'black', fontFamily: 'Inter-Light' }}>
                            Total Records:
                        </Text>
                        <Text style={{ fontSize: 12, color: 'black', fontFamily: 'Inter-Bold', marginLeft: 4 }}>
                            {SearchHistory.length}
                        </Text>
                    </>
                )}
            </View> */}





            <View style={{ flex: 1, padding: 10 }}>

                {searchLoading ? (
                    <SearchHistoryShimmer />

                ) : (
                    <FlatList
                        data={SearchHistory} // The list data
                        keyExtractor={(item) => item.id.toString()} // Unique key for each item
                        renderItem={renderItem} // Function to render each row
                        onEndReached={loadMoreData} // Trigger loading more data when scrolled to the bottom
                        onEndReachedThreshold={0.5} // Trigger when the user reaches 50% from the end
                        keyboardShouldPersistTaps="handled"

                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#9Bd35A', '#689F38']}
                            />
                        }
                        contentContainerStyle={{
                            paddingBottom: 30,
                            backgroundColor: 'white',
                        }}
                        ListEmptyComponent={
                            <View style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={History} style={{ width: 70, height: 70 }} />
                                <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                                    No Search History Found
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>


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
                                color: 'black',
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
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            color: '#333',
                                            fontFamily: 'Inter-Regular',
                                        }}>
                                        {fromDate ? formattedDate(fromDate) : 'Select From Date'}
                                    </Text>

                                    <FontAwesome name="calendar" size={20} color='black' />
                                </TouchableOpacity>
                                {!isValidFromDate && (
                                    <Text
                                        style={{
                                            color: 'red',
                                            fontSize: 12,
                                            fontFamily: 'Inter-Regular',
                                        }}>
                                        From Date is required
                                    </Text>
                                )}
                            </View>

                            {/* Till Date */}
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontWeight: '500',
                                        marginBottom: 5,
                                        color: 'black',
                                        fontFamily: 'Inter-Medium',
                                    }}>
                                    Till Date
                                </Text>
                                <TouchableOpacity
                                    style={{
                                        padding: 10,
                                        backgroundColor: '#ffffff',
                                        borderRadius: 5,
                                        borderWidth: 1,
                                        borderColor: !isValidTillDate ? 'red' : '#cccccc',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                    }}
                                    onPress={() => setShowTillDatePicker(true)}>
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            color: '#333',
                                            fontFamily: 'Inter-Regular',
                                        }}>
                                        {tillDate ? formattedDate(tillDate) : 'Select Till Date'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setShowTillDatePicker(true)}>
                                        <FontAwesome name="calendar" size={20} color='black' />
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
                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 20,
                            }}>
                            <TouchableOpacity
                                style={{
                                    paddingVertical: 10,
                                    paddingHorizontal: 20,
                                    backgroundColor: colors.Brown,
                                    borderRadius: 5,
                                }}
                                onPress={handleSubmit}>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: 'white',
                                        fontFamily: 'Inter-Regular',
                                    }}>
                                    View
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

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
                                        { label: 'Staff Name', value: selectedHistory.staff_name || '-----' },
                                        { label: 'Staff Mobile', value: selectedHistory.staff_mobile || '-----' },
                                        { label: 'Vehicle Agreement No', value: selectedHistory.agreement_no || '-----' },
                                        { label: 'Vehicle Registration No', value: selectedHistory.rc_no || '-----' },
                                        { label: 'Entry Date', value: selectedHistory.entry_date || '-----' },
                                        { label: 'Vehicle Location', value: selectedHistory.location || '-----' },
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
                                    latitude: location.latitude,
                                    longitude: location.longitude
                                    ,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                }}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: location.latitude,
                                        longitude: location.longitude,
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
        </View>
    )
}

export default SubAdminSearchHistory

const styles = StyleSheet.create({})