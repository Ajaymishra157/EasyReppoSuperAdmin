import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  ToastAndroid,
  Modal,
  FlatList,
  TextInput,
  Image,
  Linking
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import colors from '../CommonFiles/Colors';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { ENDPOINTS, IMAGE_BASE_URL } from '../CommonFiles/Constant';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import EvilIcons from 'react-native-vector-icons/EvilIcons'
import AsyncStorage from '@react-native-async-storage/async-storage';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import StaffShimmer from '../Component/StaffShimmer';

const StaffSchedule = () => {
  const Schedule = require('../assets/images/schedule.png');
  const account = require('../assets/images/user.png');
  const navigation = useNavigation();
  const [staffSchedule, setstaffSchedule] = useState([]);
  const [staffLoading, setstaffLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [InfoModal, SetInfoModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [ConfrimationModal, setConfrimationModal] = useState(false);

  const [data, setData] = useState(staffSchedule.slice(0, 20));  // Load first 20 items initially
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Keep track of current page for loading data
  const [text, setText] = useState(null);
  const [originalSchedule, setoriginalSchedule] = useState([]);

  const [userType, setUsertype] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);


  const [permissions, setPermissions] = useState({});
  console.log("staff Permission ye hai ab", permissions);

  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ staff_id: staff_id }),
      });

      const result = await response.json();
      console.log("ye raha result ok staff schedule ka", result);

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



  const AgencyStaffLogout = async (navigation, confirmLogout) => {
    try {
      const staffId = await AsyncStorage.getItem('staff_id');

      if (!staffId) {
        ToastAndroid.show('No staff ID found', ToastAndroid.SHORT);
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
        ToastAndroid.show(result.message || 'Failed to logout staff', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.log('Logout error:', error.message);
      ToastAndroid.show('Error logging  out out staff', ToastAndroid.SHORT);
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
    setData(staffSchedule.slice(0, 20)); // Set the initial data (first 20 items)
  }, [staffSchedule]);

  const loadMoreItems = () => {
    if (isLoadingMore) return; // Prevent multiple loads at the same time
    setIsLoadingMore(true);

    // Load next 20 items
    const nextPage = currentPage + 1;
    const nextData = staffSchedule.slice(nextPage * 20, (nextPage + 1) * 20); // Get the next set of 20 items

    // Update the data state
    setData(prevData => [...prevData, ...nextData]);
    setCurrentPage(nextPage); // Increment page number
    setIsLoadingMore(false); // Reset loading state
  };

  handleImagePress = () => {
    setModalVisible(true); // Open the modal

  };

  const renderItem = ({ item, index }) => (
    <View
      key={item.staff_schedule_id}
      style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        marginBottom: 7,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
      }}
    >
      {/* Index Column */}
      <View style={{ width: '23%', justifyContent: 'center', alignItems: 'flex-start' }}>
        <TouchableOpacity
          onPress={() => {
            const imgSrc = item.staff_image
              ? { uri: `${encodeURI(item.staff_image)}` }
              : account;

            setSelectedImage(imgSrc);  // set image
            setModalVisible(true);     // open modal
          }}
          activeOpacity={0.8}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#ccc',
          }}
        >
          <Image
            source={
              item.staff_image
                ? { uri: `${encodeURI(item.staff_image)}` }
                : account
            }
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Name Column */}
      <View style={{ width: '32%' }}>
        {/* Staff Name */}
        <Text
          style={{
            fontSize: 12,
            textAlign: 'left',
            color: 'black',
            fontFamily: 'Inter-Medium',
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
          numberOfLines={2}
        >
          {item.schedule_staff_name || '----'}
        </Text>



        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
          <TouchableOpacity
            onPress={() => {
              if (item.schedule_staff_mobile) {
                Linking.openURL(`tel:${item.schedule_staff_mobile}`);
              }
            }}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Image
              source={require('../assets/images/dial.png')}
              style={{ width: 12, height: 12, marginRight: 4 }}
            />
            <Text
              style={{
                fontSize: 12,
                color: 'blue',
                fontFamily: 'Inter-Regular',
              }}
              numberOfLines={1}
            >
              {item.schedule_staff_mobile || '----'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>


      {/* Date Column */}


      {/* Total Days Column */}
      <View style={{ width: '35.5%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 12, paddingVertical: 8 }}>
        <Text
          style={{
            fontSize: 12,
            textAlign: 'center',
            color: '#022e29',
            fontFamily: 'Inter-Bold',
          }}
        >
          {item.schedule_staff_total_day || '----'}
        </Text>
      </View>

      {/* Actions Column */}
      <View style={{ width: '13.5%', justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }}>


        {/* {(!permissions?.staff_schedule || permissions?.staff_schedule?.update || permissions?.staff_schedule?.delete) && ( */}
        <TouchableOpacity
          onPress={() => OpenModal(item)}
          style={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Entypo name="dots-three-vertical" size={18} color="black" />
        </TouchableOpacity>
        {/* )} */}
      </View>
    </View>
  );

  const OpenModal = staff => {
    setSelectedStaff(staff);
    setIsModalVisible(true); // Open the modal
  };

  const handleCloseModal = () => {
    setIsModalVisible(false); // Close the modal
  };

  const closeModal = () => {
    SetInfoModal(false); // Hide the modal
  };

  const handleDelete = () => {
    setConfrimationModal(true);
    handleCloseModal();
    // Call Delete API with the selected staff ID
  };

  const closeconfirmodal = () => {
    setConfrimationModal(false); // Hide the modal
  };

  const handleEdit = () => {
    navigation.navigate('AddScheduleScreen', {
      staff_id: selectedStaff.staff_id,
      Schedule_id: selectedStaff.staff_schedule_id,
      staff_name: selectedStaff.schedule_staff_name,
      start_date: selectedStaff.schedule_staff_start_date,
      end_date: selectedStaff.schedule_staff_end_date,
    });
    handleCloseModal(); // Close the modal after action
  };

  const StaffScheduleApi = async () => {
    setstaffLoading(true);
    try {
      const storedAgencyId = await AsyncStorage.getItem('rent_agency_id');
      const rentAgencyId = storedAgencyId !== null ? parseInt(storedAgencyId, 10) : null;
      console.log("rentAgencyId ye hai", rentAgencyId);
      const response = await fetch(ENDPOINTS.Staff_Schedule_List, {
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
          setstaffSchedule(result.payload); // Successfully received data
          setoriginalSchedule(result.payload);
        } else {
          console.log('Error:', 'Failed to load staff data');
        }
      } else {
        console.log('HTTP Error:', result.message || 'Something went wrong');
      }
    } catch (error) {
      console.log('Error fetching data:', error.message);
    } finally {
      setstaffLoading(false);
    }
  };

  const DeleteStaffApi = async scheduleId => {
    console.log(' DeleteStaffApi scheduleId', scheduleId);
    try {
      const response = await fetch(ENDPOINTS.Delete_Schedule, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_schedule_id: scheduleId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.code === 200) {
          ToastAndroid.show(
            'Schedule Deleted Successfully',
            ToastAndroid.SHORT,
          );
          StaffScheduleApi();
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

  // useEffect(() => {
  //   StaffScheduleApi();
  // }, []);

  useFocusEffect(
    useCallback(() => {
      StaffScheduleApi();
    }, []), // Empty array ensures this is called only when the screen is focused
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setText('');
    await StaffScheduleApi();
    await fetchPermissions();

    // setData([]); // Clear current data
    // setCurrentPage(1);

    setRefreshing(false);
  };

  const formatDate = date => {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleTextChange = (inputText) => {
    setText(inputText);

    // If inputText is empty, show the original data
    if (inputText === '') {
      setstaffSchedule(originalSchedule);  // Reset to original data
    } else {
      // Filter data based on Name, Reg No, or Agg No
      const filtered = originalSchedule.filter(item => {
        const lowerCaseInput = inputText.toLowerCase();
        return (
          item.schedule_staff_name.toLowerCase().includes(lowerCaseInput) ||
          item.schedule_staff_mobile.toLowerCase().includes(lowerCaseInput)

        );
      });

      setstaffSchedule(filtered); // Update filtered data state
    }
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
          Staff Schedule
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

            placeholder="Search Schedule/Mobile no"
            placeholderTextColor="grey"
            value={text}
            onChangeText={handleTextChange}
          />
          {text ? (
            <TouchableOpacity
              onPress={() => {

                setText(''); // Clear the search text
                setstaffSchedule(originalSchedule);

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
      {/* Table Header */}




      <FlatList
        keyboardShouldPersistTaps='handled'
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.staff_schedule_id.toString()}
        onEndReached={loadMoreItems} // Trigger loading more items when scrolled to bottom
        onEndReachedThreshold={0.5} // This determines how far from the bottom before triggering loadMoreItems
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ padding: 10, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0000ff" /> {/* Loader while fetching more items */}
            </View>
          ) : null
        }
        ListEmptyComponent={
          staffLoading ? (
            <View style={{ padding: 10 }}>
              {[...Array(7)].map((_, index) => (
                <StaffShimmer key={index} />
              ))}
            </View>
          ) : (
            <View style={{ height: 600, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7' }}>
              <Image source={Schedule} style={{ width: 70, height: 70 }} />
              <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                No Schedule Found
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



      {/* Sticky Add New Button */}

      {(
        userType === 'SuperAdmin' ||
        (userType === 'SubAdmin' && permissions?.staff_schedule?.insert) ||
        (userType === 'main' && permissions?.staff_schedule?.insert)
      ) && (
          <View
            style={{
              position: 'absolute',
              bottom: 20,
              right: 30,
              width: 60, // Set the width and height equal for a perfect circle
              height: 60, // Set height equal to the width
              zIndex: 1,
            }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.Brown,
                borderRadius: 30, // Set borderRadius to half of width/height for a circle
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                gap: 7,
              }}
              onPress={() => {
                navigation.navigate('AddScheduleScreen');
              }}>
              <AntDesign name="plus" color="white" size={18} />
            </TouchableOpacity>
          </View>
        )}

      {/* <Modal
              visible={isModalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={handleCloseModal}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
                activeOpacity={1}
                onPress={handleCloseModal}>
                <View
                  style={{
                    backgroundColor: 'white',
                    padding: 10,
                    borderRadius: 15,
                    width: '80%',
                    alignItems: 'center',
                    elevation: 5, // Adds shadow for Android
                    shadowColor: '#000', // Shadow for iOS
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                  }}
                  onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
                  onTouchEnd={e => e.stopPropagation()}>
                  <View
                    style={{
                      flexDirection: 'row',
                      width: '100%',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        marginBottom: 20,
                        color: 'black',
                        fontFamily: 'Inter-Regular',
                      }}>
                      Select Action
                    </Text>
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: -8,
                        width: '15%',
                        flexDirection: 'row',
                        justifyContent: 'center',
                      }}
                      onPress={handleCloseModal}>
                      <Text
                        style={{
                          fontSize: 28,
                          fontWeight: 'bold',
                          color: 'black',
                          fontFamily: 'Inter-Regular',
                        }}>
                        ×
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{gap: 15, width: '100%'}}>
                    <TouchableOpacity
                      style={{
                        borderColor: 'red',
                        borderWidth: 1,
                        borderRadius: 10,
                        width: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 12,
                        flexDirection: 'row',
                        gap: 15,
                      }}
                      onPress={handleDelete}
                      >
                      <AntDesign name="delete" size={24} color="red" />
                      <Text
                        style={{
                          color: 'red',
                          fontFamily: 'Inter-Regular',
                          fontSize: 16,
                        }}>
                        Delete Staff
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        borderColor: 'black',
                        borderWidth: 1,
                        borderRadius: 10,
                        width: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 12,
                        marginTop: 10,
                        flexDirection: 'row',
                        gap: 15,
                      }}
                      onPress={handleEdit}
                      >
                      <AntDesign name="edit" size={24} color="Black" />
                      <Text
                        style={{
                          color: 'black',
                          fontFamily: 'Inter-Regular',
                          fontSize: 16,
                        }}>
                        Update Staff
                      </Text>
                    </TouchableOpacity>
      
                    <TouchableOpacity
                      style={{
                        borderColor: colors.Brown,
                        borderWidth: 1,
                        borderRadius: 10,
                        width: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 12,
                        marginTop: 10,
                        flexDirection: 'row',
                        gap: 15,
                      }}
                      onPress={() => {
                        SetInfoModal(true);
                        setIsModalVisible(false);
                      }}>
                      <AntDesign name="infocirlceo" size={20} color="black" />
      
                      <Text
                        style={{
                          color: 'black',
                          fontFamily: 'Inter-Regular',
                          fontSize: 16,
                        }}>
                        Information Staff
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal> */}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}>
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          activeOpacity={1}
          onPress={handleCloseModal}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              width: '80%',
              paddingVertical: 5,
            }}>
            <TouchableOpacity
              onPress={handleCloseModal}
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
              padding: 10,
              borderRadius: 15,
              width: '80%',
              alignItems: 'center',
              elevation: 5, // Adds shadow for Android
              shadowColor: '#000', // Shadow for iOS
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
            }}
            onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
            onTouchEnd={e => e.stopPropagation()}>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 20,
                  color: 'black',
                  fontFamily: 'Inter-Regular',
                }}>
                Select Action
              </Text>

            </View>
            <View style={{ gap: 3, width: '80%' }}>


              {/* Info Staff Button */}
              <TouchableOpacity
                style={{
                  borderColor: colors.Brown,
                  borderWidth: 1,
                  borderRadius: 10,
                  width: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: 12,
                  marginTop: 10,
                  flexDirection: 'row',
                  gap: 15,
                }}
                onPress={() => {
                  SetInfoModal(true);
                  setIsModalVisible(false);
                }}>
                <AntDesign name="infocirlceo" size={20} color="black" />

                <Text
                  style={{
                    color: 'black',
                    fontFamily: 'Inter-Regular',
                    fontSize: 16,
                  }}>
                  Information Schedule
                </Text>
              </TouchableOpacity>

              {/* Update Leave Button */}

              {(
                userType === 'SuperAdmin' ||
                (userType === 'SubAdmin' && permissions?.staff_schedule?.update) ||
                (userType === 'main' && permissions?.staff_schedule?.update)
              ) && (

                  <TouchableOpacity
                    style={{
                      borderColor: 'black',
                      borderWidth: 1,
                      borderRadius: 10,
                      width: '100%',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingVertical: 12,
                      marginTop: 10,
                      flexDirection: 'row',
                      gap: 15,
                    }}
                    onPress={handleEdit}>
                    <AntDesign name="edit" size={24} color="black" />
                    <Text
                      style={{
                        color: 'black',
                        fontFamily: 'Inter-Regular',
                        fontSize: 16,
                      }}>
                      Update Schedule
                    </Text>
                  </TouchableOpacity>
                )}

              {/* Delete Leave Button */}

              {(
                userType === 'SuperAdmin' ||
                (userType === 'SubAdmin' && permissions?.staff_schedule?.delete) ||
                (userType === 'main' && permissions?.staff_schedule?.delete)
              ) && (
                  <TouchableOpacity
                    style={{
                      borderColor: 'red',
                      borderWidth: 1,
                      borderRadius: 10,
                      width: '100%',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingVertical: 12,
                      flexDirection: 'row',
                      gap: 15,
                      marginTop: 10,
                    }}
                    onPress={handleDelete}>
                    <AntDesign name="delete" size={24} color="red" />
                    <Text
                      style={{
                        color: 'red',
                        fontFamily: 'Inter-Regular',
                        fontSize: 16,
                      }}>
                      Delete Schedule
                    </Text>
                  </TouchableOpacity>
                )}

            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={InfoModal} transparent={true} animationType="slide">
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
              maxHeight: '80%', // Ensure modal does not overflow
            }}
            onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
            onTouchEnd={e => e.stopPropagation()}>
            {selectedStaff && (
              <>
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
                    Staff Schedule information
                  </Text>

                </View>


                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">

                  {/* Reusable Row Component */}
                  {[
                    { label: 'Staff Name', value: selectedStaff.schedule_staff_name || '-----' },
                    { label: 'Mobile No', value: selectedStaff.schedule_staff_mobile || '-----' },
                    { label: 'From Date', value: formatDate(selectedStaff.schedule_staff_start_date) || '-----' },
                    { label: 'End Date', value: formatDate(selectedStaff.schedule_staff_end_date) || '-----' },
                    { label: 'Entry Date', value: selectedStaff.schedule_staff_entry_date || '-----' },
                    { label: 'Total Days', value: selectedStaff.schedule_staff_total_day || '-----' },
                    {
                      label: 'Staff Status',
                      value: selectedStaff.schedule_staff_status || '-----',
                      valueStyle: { color: selectedStaff.schedule_staff_status ? 'green' : 'red' }
                    },
                    {
                      label: 'Payment Status',
                      value: selectedStaff.schedule_staff_payment_status || '-----',
                      valueStyle: { color: selectedStaff.schedule_staff_payment_status === 'Unpaid' ? 'red' : 'green' }
                    },
                  ].map((item, index) => (
                    <View
                      key={index}
                      style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}>

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
                            item.valueStyle || {}
                          ]}>
                          {item.value}
                        </Text>
                      </View>
                    </View>
                  ))}

                </ScrollView>


                {/* <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    backgroundColor: colors.Brown,
                    borderRadius: 10,
                    marginTop: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={closeModal}>
                  <Text
                    style={{
                      color: 'white',
                      fontFamily: 'Inter-Regular',
                      fontSize: 16,
                    }}>
                    Close
                  </Text>
                </TouchableOpacity> */}
              </>
            )}
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
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'black', fontFamily: 'Inter-Medium' }}>
              Confirm Delete
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
              Are you sure you want to delete the Schedule ?
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
                onPress={() => {
                  DeleteStaffApi(selectedStaff.staff_schedule_id);
                  closeconfirmodal();
                }}>
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
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
          onPress={() => setModalVisible(false)}
          activeOpacity={1}
        >
          <View
            style={{
              width: '80%',
              height: '40%',
              backgroundColor: 'white',
              borderRadius: 150,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onStartShouldSetResponder={() => true}
            onTouchEnd={e => e.stopPropagation()}
          >
            {selectedImage && (
              <Image
                source={selectedImage}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 150,
                  resizeMode: 'stretch',
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default StaffSchedule;
