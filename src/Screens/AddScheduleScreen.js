import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,

  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ENDPOINTS } from '../CommonFiles/Constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';


const AddScheduleScreen = () => {

  const navigation = useNavigation();
  const route = useRoute();
  const Staff = require('../assets/images/team.png');

  const { staff_id, staff_name, start_date, end_date, Schedule_id } =
    route.params || {};
  // const {staffId, staffname, startdate, enddate} = route.params || {};
  // const {staffId} = route.params || {};
  // console.log('staffid hai', staffId, staffname, startdate, enddate);

  // const [staffName, setStaffName] = useState(staffname || null);

  const [ScheduleLoading, setScheduleLoading] = useState(false);


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


  const [loadingMore, setLoadingMore] = useState(false); // Loading state for pagination
  const [page, setPage] = useState(1); // Page number for pagination
  const itemsPerPage = 20; // Number of items to load per page

  const [totalItems, setTotalItems] = useState(0);

  const convertToDateObject = dateString => {
    return dateString ? new Date(dateString) : null;
  };

  // Initialize dates properly
  const [startDate, setStartDate] = useState(
    convertToDateObject(start_date) || new Date(),
  ); // Default to current date
  const [endDate, setEndDate] = useState(convertToDateObject(end_date) || null); // Set endDate to null initially

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const onChangeStartDate = (event, selectedDate) => {
    console.log('selected Date', selectedDate);
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    setStartDate(currentDate);
  };

  const onChangeEndDate = (event, selectedDate) => {
    console.log('selected Date', selectedDate);
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    setEndDate(currentDate);
  };

  // Function to format date as dd-mm-yyyy
  const formatDate = date => {
    console.log('date hai ye formate ka', date);
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0'); // Ensures two digits for day
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Track dropdown visibility
  const [selectedType, setSelectedType] = useState(staff_name || ''); // Store selected type
  console.log('selected type', selectedType);
  const [selectedId, setselectedId] = useState(staff_id || '');

  console.log('selected id', selectedId);
  const [dropdownData, setDropdownData] = useState([]);


  const [filteredData, setFilteredData] = useState([]); // Filtered data
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };



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
        });
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

  const fetchData = async () => {
    try {

      const storedAgencyId = await AsyncStorage.getItem('rent_agency_id');
      const rentAgencyId = storedAgencyId !== null ? parseInt(storedAgencyId, 10) : null;
      const response = await fetch(ENDPOINTS.List_Staff, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rent_agency_id: rentAgencyId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.code === 200) {
          // Map the staff data to include both staff_id and staff_name
          const staffData = result.payload.map(staff => ({
            staff_id: staff.staff_id,
            staff_name: staff.staff_name,
          }));
          setDropdownData(staffData);
        } else {
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

  useEffect(() => {
    fetchData();
  }, []);
  const handleSelect = staff => {
    // Destructure the staff object to get both id and name
    const { staff_id, staff_name } = staff;

    // Set the selected name and id to separate states
    setSelectedType(staff_name); // For setting the staff name
    setselectedId(staff_id); // For setting the staff id

    // ❗ error remove
    setStaffNameError('');
    // 🔹 Search reset
    setSearchQuery('');
    // 🔹 Full list restore
    setFilteredData(dropdownData);

    // Close the dropdown after selection
    setIsDropdownVisible(false);
  };


  // const handleSearch = text => {
  //   setSearchQuery(text);

  //   // Filter data based on text input
  //   if (text === '') {
  //     setFilteredData(dropdownData); // If search query is empty, show all items
  //   } else {
  //     const filtered = dropdownData.filter(item => {
  //       const staffName = item.staff_name.toLowerCase();
  //       const searchQuery = text.toLowerCase();

  //       // Split staff name into words and check if the first word starts with the search query
  //       const nameWords = staffName.split(' ');

  //       // Only show items where the first word starts with the search query
  //       return nameWords[0].startsWith(searchQuery);
  //     });

  //     setFilteredData(filtered);
  //   }
  // };

  const handleSearch = text => {
    setSearchQuery(text);
  };





  const loadMoreData = () => {
    if (loadingMore || dropdownData.length >= totalItems) return;
    setLoadingMore(true);

    // Simulate API call or fetching more data
    setTimeout(() => {
      const nextData = dropdownData.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
      // setData((prevData) => [...prevData, ...nextData]);
      setPage(page + 1); // Increment the page number for next batch
      setLoadingMore(false);
    }, 1000); // Simulate network delay
  };

  // Load the first batch of data
  useEffect(() => {
    loadMoreData();
  }, []);

  useEffect(() => {
    // Filter dropdown based on search query
    if (searchQuery === '') {
      setFilteredData(dropdownData); // Show all items if query is empty
    } else {
      const filtered = dropdownData.filter(item =>
        item.staff_name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, dropdownData]); // Run whenever searchQuery or dropdownData changes

  // Error states for each field
  const [staffNameError, setStaffNameError] = useState('');

  {
    /* Logic to update End Date to 30 days after Start Date */
  }
  useEffect(() => {
    if (!endDate) {
      if (startDate) {
        // Calculate the date 30 days after start date
        const endDateCalculated = new Date(startDate);
        endDateCalculated.setDate(endDateCalculated.getDate() + 30);
        setEndDate(endDateCalculated);
      }
    }
  }, [startDate, endDate]);

  // const handleSubmit = async () => {
  //   let valid = true;
  //   setStaffNameError('');

  //   if (!dropdownData) {
  //     setStaffNameError('Staff Name Is Required');
  //     valid = false;
  //   }

  //   if (valid) {
  //     const formattedStartDate = formatDate(startDate); // Format start date
  //     const formattedEndDate = endDate ? formatDate(endDate) : null; // Format end date

  //     try {
  //       setScheduleLoading(true);
  //       const response = await fetch(ENDPOINTS.Add_Schedule, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           staff_id: selectedId,
  //           start_date: formattedStartDate,
  //           end_date: formattedEndDate,
  //         }),
  //       });
  //       console.log(
  //         'startdate,enddateand staffid',
  //         selectedId,
  //         formattedStartDate,
  //         formattedEndDate,
  //       );

  //       if (!response.ok) {
  //         throw new Error('Failed to connect to the server');
  //       }

  //       const data = await response.json();
  //       console.log('Response:', data);

  //       // Check response status
  //       if (data.code == 200) {
  //      
  //         navigation.goBack();
  //       } else {
  //       }
  //     } catch (error) {
  //       console.error('Error:', error.message);
  //     } finally {
  //       setScheduleLoading(false);
  //     }
  //   }
  // };

  // const handleSubmit = async () => {
  //   let valid = true;
  //   setStaffNameError('');

  //   if (!dropdownData) {
  //     setStaffNameError('Staff Name Is Required');
  //     valid = false;
  //   }

  //   if (valid) {
  //     try {
  //       const scheduleData = {
  //         staff_name: selectedId, // Make sure to pass all necessary fields
  //         start_date: startDate,
  //         end_date: startDate,
  //       };
  //       console.log('staffname ,start_date', selectedId, startDate.endDate);

  //       // Check if it's an update (i.e., staffId exists)
  //       if (staffId) {
  //         // If staffId exists, this is an update
  //         const response = await fetch(ENDPOINTS.Update_Schedule, {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify(scheduleData),
  //         });

  //         if (!response.ok) {
  //           throw new Error('Failed to connect to the server');
  //         }

  //         const data = await response.json();
  //         console.log('Response:', data);

  //         if (data.code === 200) {
  //         
  //           navigation.navigate('StaffSchedule');
  //         } else {
  //           console.log('Update failed:', data.message);
  //         }
  //       } else {
  //         // If no staffId, it's an add operation
  //         const response = await fetch(ENDPOINTS.Add_Schedule, {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify(scheduleData),
  //         });

  //         if (!response.ok) {
  //           throw new Error('Failed to connect to the server');
  //         }

  //         const data = await response.json();
  //         console.log('Response:', data);

  //         // Check response status
  //         if (data.code === 200) {
  //          
  //           navigation.navigate('StaffSchedule');
  //         } else {
  //           console.log('Add failed:', data.message);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error:', error.message);
  //     } finally {
  //       // Optionally reset any states or perform cleanup here
  //     }
  //   }
  // };

  // const handleSubmit = async () => {
  //   let valid = true;
  //   setStaffNameError('');

  //   // Check if dropdown data is selected, which is required
  //   if (!dropdownData) {
  //     setStaffNameError('Staff Name Is Required');
  //     valid = false;
  //   }

  //   if (valid) {
  //     // Format the start and end dates
  //     const formattedStartDate = formatDate(startDate);
  //     const formattedEndDate = endDate ? formatDate(endDate) : null;

  //     try {
  //       setScheduleLoading(true);

  //       // If staff_id is present, perform an update
  //       if (staff_id) {
  //         const response = await fetch(ENDPOINTS.Update_Schedule, {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify({
  //             staff_id: selectedId, // Include staff_id for update
  //             staff_name: selectedType, // You may use the selected name here
  //             start_date: formattedStartDate,
  //             end_date: formattedEndDate,
  //           }),
  //         });

  //         console.log(
  //           'staffid,staff_name 222,startDate33,endDate44',
  //           staff_id,
  //           staff_name,
  //           start_date,
  //           endDate,
  //         );

  //         if (!response.ok) {
  //           throw new Error('Failed to connect to the server');
  //         }

  //         const data = await response.json();
  //         console.log('Response:', data);

  //         if (data.code === 200) {
  //          
  //           navigation.goBack();
  //         } else {
  //           console.log('Update failed:', data.message);
  //         }
  //       } else {
  //         // If staff_id is not present, perform an add operation
  //         const response = await fetch(ENDPOINTS.Add_Schedule, {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify({
  //             staff_id: selectedId, // Use selectedId to add new schedule
  //             start_date: formattedStartDate,
  //             end_date: formattedEndDate,
  //           }),
  //         });

  //         if (!response.ok) {
  //           throw new Error('Failed to connect to the server');
  //         }

  //         const data = await response.json();
  //         console.log('Response:', data);

  //         if (data.code === 200) {
  //          
  //           navigation.goBack();
  //         } else {
  //           console.log('Add failed:', data.message);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error:', error.message);
  //     } finally {
  //       setScheduleLoading(false);
  //     }
  //   }
  // };

  // Function to handle schedule update
  const handleUpdateSchedule = async () => {
    try {
      setScheduleLoading(true);

      const formattedStartDate = formatDate(startDate); // Format start date
      const formattedEndDate = endDate ? formatDate(endDate) : null; // Format end date

      // Call Update API
      const response = await fetch(ENDPOINTS.Update_Schedule, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_schedule_id: Schedule_id, // Use the current staff_id for the update
          staff_id: selectedId, // Assuming selectedType is the staff name
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        }),
      });

      console.log(
        'staffid, staff_name, startDate, endDate',
        Schedule_id,
        staff_id,
        selectedId,
        formattedStartDate,
        formattedEndDate,
      );

      if (!response.ok) {
        throw new Error('Failed to connect to the server');
      }

      const data = await response.json();
      console.log('Response:', data);

      if (data.code === 200) {

        Toast.show({
          type: 'success',
          text1: 'Schedule Updated Successfully',
          position: 'bottom',
          visibilityTime: 2000, // 500 sec
        });
        setTimeout(() => {
          navigation.goBack();
        }, 500);

      } else {
        console.log('Update failed:', data.message);
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Function to handle adding a new schedule
  const handleAddSchedule = async () => {
    try {
      setScheduleLoading(true);

      const formattedStartDate = formatDate(startDate); // Format start date
      const formattedEndDate = endDate ? formatDate(endDate) : null; // Format end date
      console.log("Schedule Id ye hai xxxx", selectedId, formattedStartDate, formattedEndDate);

      // Call Add API
      const response = await fetch(ENDPOINTS.Add_Schedule, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_id: selectedId, // Use selectedId for the new schedule
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to the server');
      }

      const data = await response.json();
      console.log('Response:', data);

      if (data.code === 200) {

        Toast.show({
          type: 'success',
          text1: 'Schedule Added Successfully',
          position: 'bottom',
          visibilityTime: 2000, // 500 sec
        });
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } else {
        console.log('Add failed:', data.message);
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  // The main submit function
  const handleSubmit = async () => {
    let valid = true;
    setStaffNameError(''); // Reset error

    // Check if dropdown data is selected
    if (!selectedType || !selectedId) {
      setStaffNameError('Staff Name Is Required');
      valid = false;
    }

    if (valid) {
      // If staff_id is provided, update the schedule; otherwise, add a new schedule
      if (staff_id) {
        await handleUpdateSchedule();
      } else {
        await handleAddSchedule();
      }
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedId === item.staff_id;

    return (
      <TouchableOpacity
        key={item.staff_id}
        style={{
          padding: 8,
          borderBottomColor: '#ddd',
          borderBottomWidth: 1,
          backgroundColor: isSelected ? colors.light : 'white',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onPress={() => handleSelect(item)}
      >
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Inter-Regular',
            color: 'black',
          }}>
          {item.staff_name}
        </Text>

        {isSelected && (
          <Ionicons name="checkmark" size={18} color={colors.Brown} />
        )}
      </TouchableOpacity>
    );
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
          <TouchableOpacity

            onPress={() => {
              navigation.goBack();
            }}>
            <Ionicons name="arrow-back" color="white" size={26} />
          </TouchableOpacity>
        </TouchableOpacity>
        <Text
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            fontFamily: 'Inter-Bold',
          }}>
          {staff_id ? 'Update Schedule' : 'Add Schedule'}
        </Text>
      </View>
      {/* Form Section */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View style={{ padding: 20 }}>
          {/* Staff Name Label */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              marginBottom: 5,
              fontFamily: 'Inter-Medium',
              color: 'black',
            }}>
            Staff Name<Text style={{ color: 'red', fontFamily: 'Inter-Bold', }}>*</Text>
          </Text>

          <View style={{}}>
            {/* Dropdown TextInput */}
            <TouchableOpacity
              style={{
                backgroundColor: 'white',
                padding: 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderColor: staffNameError ? 'red' : '#ddd',
                borderWidth: 1,
              }}
              onPress={() => {
                setIsDropdownVisible(!isDropdownVisible);

                if (!isDropdownVisible) {
                  setSearchQuery('');
                  setFilteredData(dropdownData);
                }
              }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Inter-Regular',
                  color: selectedType ? 'black' : '#777',
                }}>
                {selectedType ? selectedType : 'Select Staff'}
              </Text>

              <Ionicons
                name={isDropdownVisible ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="black"
              />
            </TouchableOpacity>

            {/* Dropdown and Search Input */}
            {isDropdownVisible && (
              <View
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  borderColor: '#ddd',
                  borderWidth: 1,
                  zIndex: 1,
                  marginTop: 2,
                }}>

                {/* STAFF AVAILABLE TABHI SEARCH BAR DIKHANA */}
                {dropdownData.length > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderColor: colors.Brown,
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      marginBottom: 5,
                    }}>
                    <TextInput
                      style={{
                        flex: 1,
                        height: 40,
                        color: 'black',
                        fontFamily: 'Inter-Regular',
                      }}
                      placeholder="Search Staff"
                      placeholderTextColor="#ccc"
                      value={searchQuery}
                      onChangeText={handleSearch}
                    />

                    {searchQuery !== '' && (
                      <TouchableOpacity
                        onPress={() => {
                          setSearchQuery('');
                          setFilteredData(dropdownData);
                        }}>
                        <Ionicons name="close-circle" size={20} color="gray" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <FlatList
                  style={{ maxHeight: 200 }}
                  data={filteredData}
                  keyExtractor={(item) => item.staff_id.toString()}
                  renderItem={renderItem}
                  keyboardShouldPersistTaps="handled"

                  ListEmptyComponent={() => (
                    <View
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 20,
                      }}>
                      <Image source={Staff} style={{ width: 60, height: 60 }} />
                      <Text
                        style={{
                          fontFamily: 'Inter-Regular',
                          color: 'red',
                          marginTop: 10,
                        }}>
                        No Staff Found
                      </Text>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
          {staffNameError && (
            <Text
              style={{
                color: 'red',
                fontSize: 12,
                marginBottom: 10,

                fontFamily: 'inter-Regular',
              }}>
              {staffNameError}
            </Text>
          )}

          {/* Start Date */}
          <Text
            style={{
              fontSize: 14,
              marginTop: 5,
              fontWeight: 'bold',
              marginBottom: 5,
              fontFamily: 'Inter-Medium',
              color: 'black',
            }}>
            Start Date
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 12,
              marginBottom: 15,
              borderWidth: 1,
              borderColor: '#ddd',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 14,
              color: 'black',
            }}
            onPress={() => setShowStartDatePicker(true)}>
            <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
              {startDate ? formatDate(startDate) : 'Select Start Date'}
            </Text>
            <Ionicons
              name="calendar"
              size={20}
              color="black"
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>

          {/* Show DateTimePicker for Start Date */}
          {showStartDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={startDate}
              mode="date"
              display="default"
              onChange={onChangeStartDate}
              minimumDate={new Date()} // Disable past dates
            />
          )}

          {/* End Date */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              marginBottom: 5,
              fontFamily: 'Inter-Medium',
              color: 'black',
            }}>
            End Date
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 12,
              marginBottom: 15,
              borderWidth: 1,
              borderColor: '#ddd',
              flexDirection: 'row',
              justifyContent: 'space-between',
              fontSize: 14,
              color: 'black',
            }}
            onPress={() => setShowEndDatePicker(true)}>
            <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
              {endDate ? formatDate(endDate) : 'Select End Date'}
            </Text>
            <Ionicons
              name="calendar"
              size={20}
              color="black"
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>

          {/* Show DateTimePicker for End Date */}
          {showEndDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={endDate ? endDate : new Date()}
              mode="date"
              display="default"
              onChange={onChangeEndDate}
              minimumDate={startDate} // End date must be after the start date
            />
          )}
          {/* Submit Button */}
          {ScheduleLoading ? (
            <View>
              <ActivityIndicator size="small" color={'#3b82f6'} />
            </View>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: colors.Brown,
                padding: 15,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 15,
              }}
              onPress={handleSubmit}>
              <Text
                style={{
                  color: '#fff',
                  fontSize: 16,
                  fontFamily: 'Inter-Medium',
                }}>
                Submit
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default AddScheduleScreen;

const styles = StyleSheet.create({});
