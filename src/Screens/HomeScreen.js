import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  ToastAndroid,
  Modal,
  Alert,
  TextInput,
  Image,
  Switch,
  Keyboard
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import Header from '../Component/Header';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ENDPOINTS, IMAGE_BASE_URL } from '../CommonFiles/Constant';
import colors from '../CommonFiles/Colors';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import AsyncStorage from '@react-native-async-storage/async-storage';
import StaffShimmer from '../Component/StaffShimmer';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import CheckBox from '@react-native-community/checkbox';





const HomeScreen = () => {
  const phone = require('../assets/images/phone.png');
  const Staff = require('../assets/images/team.png');
  const account = require('../assets/images/user.png');
  const navigation = useNavigation();
  const [StaffList, setStaffList] = useState([]);
  const [StaffLoading, setStaffLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [InfoModal, SetInfoModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [ConfrimationModal, setConfrimationModal] = useState(false);
  const [ResetModal, setResetModal] = useState(false);

  const [data, setData] = useState(StaffList.slice(0, 20));  // Load first 20 items initially
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Keep track of current page for loading data

  const [AdminCount, setAdminCount] = useState('');
  const [text, setText] = useState('');
  const [originalStaffData, setoriginalStaffData] = useState([]);

  const [FieldCount, setFieldCount] = useState('');

  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedStaffName, setselectedStaffName] = useState(null);
  const [DeviceId, setDeviceId] = useState('');

  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  const [userType, setUsertype] = useState(null);
  console.log("usertype kya hai", userType);

  const [loadingToggles, setLoadingToggles] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);


  const [permissions, setPermissions] = useState({});
  console.log("fetch permission ye hai", permissions, permissions.staff && permissions.staff.staffreset);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [blacklistChecked, setBlacklistChecked] = useState(false);
  const [remark, setRemark] = useState('');
  const [remarkError, setRemarkError] = useState('');







  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const staff_id = await AsyncStorage.getItem('staff_id');
      if (!staff_id) {
        console.warn('No staff_id found');
        setPermissions({});
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
        setPermissions({});
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions({});
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPermissions();
  }, []);

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



  handleImagePress = () => {
    setModalVisible(true); // Open the modal

  };

  const handleCloseModal2 = () => {
    setIsModalVisible(false); // Close the modal
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
    setData(StaffList.slice(0, 20)); // Set the initial data (first 20 items)
  }, [StaffList]);

  const loadMoreItems = () => {
    if (isLoadingMore || data.length >= StaffList.length) return;

    console.log("Start Loading:", isLoadingMore);
    setIsLoadingMore(true);

    setTimeout(() => {
      const nextPage = currentPage + 1;
      const nextData = StaffList.slice(currentPage * 20, nextPage * 20);

      if (nextData.length === 0) {
        // 🛑 No more data to load
        setIsLoadingMore(false);
        return;
      }

      setData(prevData => [...prevData, ...nextData]);
      setCurrentPage(nextPage);
      setIsLoadingMore(false);

      console.log("Done Loading:", isLoadingMore);
    }, 100); // Delay added for visible spinner + batching fix
  };


  // Initial Data Load
  useEffect(() => {
    loadMoreItems();
  }, []);

  const OpenModal = (staff) => {
    // Only store ID or minimal required data to prevent heavy re-render
    setSelectedStaff(staff);  // If needed elsewhere
    setIsLocationEnabled(staff.staff_location === 'Yes');

    // Delay opening modal to allow UI thread to settle
    setTimeout(() => {
      setIsModalVisible(true);
    }, 100); // 20ms delay helps reduce UI lag
  };


  const handleCloseModal = () => {
    setIsModalVisible(false); // Close the modal
  };

  const closeModal = () => {
    SetInfoModal(false); // Hide the modal
  };

  const closeconfirmodal = () => {
    setConfrimationModal(false); // Hide the modal
    setBlacklistChecked(false);
    setRemark('');
    setRemarkError('');
  };
  const closeResetModal = () => {
    setResetModal(false); // Hide the modal
  };

  const OpenResetModal = (item) => {
    setSelectedStaffId(item.staff_id);
    setselectedStaffName(item.staff_name);
    setDeviceId(item.device_id);
    setResetModal(true); // Hide the modal
  };

  const handleEdit = () => {
    navigation.navigate('AddStaffScreen', {
      staff_id: selectedStaff.staff_id,
      staff_name: selectedStaff.staff_name,
      staff_email: selectedStaff.staff_email,
      staff_mobile: selectedStaff.staff_mobile,
      staff_address: selectedStaff.staff_address,
      staff_password: selectedStaff.staff_password,
      staff_type: selectedStaff.staff_type,
    });
    handleCloseModal(); // Close the modal after action
  };

  // const handleDelete = () => {
  //   DeleteStaffApi(selectedStaff.staff_id); // Call Delete API with the selected staff ID
  //   handleCloseModal(); // Close the modal after action
  // };

  const handleDelete = () => {
    setConfrimationModal(true);
    handleCloseModal();
    // Call Delete API with the selected staff ID
  };

  const DeleteStaffApi = async staffId => {
    console.log('staffId', staffId);
    try {
      const response = await fetch(ENDPOINTS.Delete_Staff, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_id: staffId,
          blacklist: blacklistChecked ? 'Yes' : 'No',
          remark: blacklistChecked ? remark : '',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.code == 200) {
          ToastAndroid.show('Staff Deleted Successfully', ToastAndroid.SHORT);
          // reset
          setBlacklistChecked(false);
          setRemark('');
          fetchData();
        } else {
          console.log('Error:', 'Failed to load staff data');
        }
      } else {
        console.log('HTTP Error:', result.message || 'Something went wrong');
      }
    } catch (error) {
      console.log('Error fetching data:', error.message);
    } finally {
      setRemarkError('');
    }
  };

  const fetchData = async () => {
    setStaffLoading(true);
    try {
      const storedAgencyId = await AsyncStorage.getItem('rent_agency_id');
      const rentAgencyId = storedAgencyId !== null ? parseInt(storedAgencyId, 10) : null;
      console.log("rent agency id ye hai staff list", rentAgencyId);
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
          setStaffList(result.payload); // Successfully received data
          setAdminCount(result.count_admin);
          setFieldCount(result.count_filed);
          setoriginalStaffData(result.payload);
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


  useEffect(() => {
    const initialToggleState = {};
    StaffList.forEach(staff => {
      initialToggleState[staff.staff_id] = staff.staff_location === 'Yes';
    });
    setIsLocationEnabled(initialToggleState);
  }, [StaffList]);




  const StaffInternetAccess = async (staff_id, action) => {
    const newValue = !isLocationEnabled;
    setIsLocationEnabled(newValue);
    console.log("Api internet called successfully", staff_id, action)
    try {
      const response = await fetch(ENDPOINTS.Staff_Internet_Access, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_id: staff_id,
          action: action, // 'Yes' or 'No'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.code === 200) {
          ToastAndroid.show("Location Access changes successfully", ToastAndroid.SHORT);
          console.log('Success:', result.message || 'Updated successfully');
        } else {
          console.log('Error:', result.message || 'Failed to update');
        }
      } else {
        console.log('HTTP Error:', result.message || 'Something went wrong');
      }
    } catch (error) {
      console.log('Error fetching data:', error.message);
    }

    finally {
      // Stop the loading spinner for this specific staff_id
      setLoadingToggles(prev => ({
        ...prev,
        [staff_id]: false,
      }));
    }
  };


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
      ToastAndroid.show('Error logging out staff', ToastAndroid.SHORT);
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





  const DeviceIdReset = async (Id) => {

    try {
      const response = await fetch(ENDPOINTS.reset_Device_Id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staff_id: Id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.code === 200) {
          ToastAndroid.show("Reset Device Id successfully", ToastAndroid.SHORT);
          setResetModal(false);
          fetchData();
        } else {
          console.log('Error:', 'Failed to load staff data');
        }
      } else {
        console.log('HTTP Error:', result.message || 'Something went wrong');
      }
    } catch (error) {
      console.log('Error fetching data:', error.message);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchPermissions();
    setText('');
    setRefreshing(false);
  };

  const handleTextChange = (inputText) => {
    console.log("handletext", inputText);
    setText(inputText);

    // If inputText is empty, show the original data
    if (inputText == '') {
      setStaffList(originalStaffData);  // Reset to original data
    } else {
      // Filter data based on Name, Reg No, or Agg No
      const filtered = originalStaffData.filter(item => {
        const lowerCaseInput = inputText.toLowerCase();
        return (
          item.staff_name.toLowerCase().includes(lowerCaseInput) ||
          item.staff_mobile.toLowerCase().includes(lowerCaseInput)

        );
      });

      setStaffList(filtered); // Update filtered data state
    }
  };
  // useEffect(() => {
  //   console.log("called this function", text);
  //   handleTextChange(text); // Reapply the filter based on the current search text
  // }, [text]);


  // useFocusEffect(
  //   useCallback(() => {
  //     // When the screen is focused again, apply filtering based on existing text
  //     if (text === '') {
  //       setStaffList(originalStaffData);
  //     } else {
  //       const filtered = originalStaffData.filter(item => {
  //         const lowerCaseInput = text.toLowerCase();
  //         return (
  //           item.staff_name?.toLowerCase().includes(lowerCaseInput)
  //           || item.staff_mobile?.toLowerCase().includes(lowerCaseInput)

  //         );
  //       });

  //       setStaffList(filtered);
  //     }
  //   }, [text, originalStaffData])
  // );

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      key={item.staff_id}
      style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        margin: 13,
        marginBottom: 7,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
      onPress={() =>
        navigation.navigate('informationScreen', {
          userData: item,
          setStaffList: setStaffList, // ✅ correctly passed
        })
      }

      activeOpacity={1}
    >
      <View style={{ flexDirection: 'row', width: '50%' }}>
        <View style={{ width: '30%', justifyContent: 'center', alignItems: 'flex-start' }}>
          <TouchableOpacity
            onPress={() => {
              const imgSrc = item.staff_image
                ? { uri: `${IMAGE_BASE_URL}${encodeURI(item.staff_image)}` }
                : account;

              setSelectedImage(imgSrc);  // set image
              setModalVisible(true);     // open modal
            }}
            activeOpacity={0.8}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: '#ccc',
            }}
          >
            <Image
              source={
                item.staff_image
                  ? { uri: `${IMAGE_BASE_URL}${encodeURI(item.staff_image)}` }
                  : account
              }
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={{ width: '70%', justifyContent: 'center', alignItems: 'flex-start', marginLeft: 5 }}>

          {/* Name */}
          <Text
            style={{
              fontSize: 12,
              textAlign: 'left',
              color: 'black',
              fontFamily: 'Inter-Regular',
              textTransform: 'uppercase',
            }}
          >
            {item.staff_name || '----'}
          </Text>

          {/* Mobile */}
          <Text
            style={{
              fontSize: 12,
              textAlign: 'center',
              color: 'black',
              fontFamily: 'Inter-Regular',
            }}
          >
            {item.staff_mobile || '----'}
          </Text>

          {/* User Type */}
          <Text
            style={{
              fontSize: 12,
              textAlign: 'center',
              color: 'black',
              fontFamily: 'Inter-Regular',
            }}
          >
            {item.staff_type === 'normal' ? 'User' : item.staff_type || '----'}
          </Text>

        </View>

      </View>



      {/* Staff Date Column */}
      {/* <View style={{ width: '22%', justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 12,
            textAlign: 'center',
            color: 'black',
            fontFamily: 'Inter-Regular',
            textTransform: 'uppercase',
          }}
        >
          {(item.staff_entry_date && item.staff_entry_date.split(' ')[0]) || '----'}

        </Text>
      </View> */}
      <View style={{ width: '72%', flexDirection: 'row', justifyContent: 'flex-start' }}>
        <View style={{ width: '60%', justifyContent: 'center', alignItems: 'flex-end', }}>
          <View style={{ width: '80%', justifyContent: 'center', alignItems: 'center', }}>


            {(
              userType === 'SuperAdmin' ||
              (userType === 'SubAdmin' && permissions?.staff?.staffreset) || (userType === 'main' && permissions?.staff?.staffreset)
            ) && (
                <TouchableOpacity
                  style={{
                    backgroundColor: 'white',
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: colors.Brown,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 5
                  }}
                  onPress={() => OpenResetModal(item)}
                >
                  <Text style={{ color: colors.Brown, fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter-Medium' }}>
                    Reset
                  </Text>
                  <Image source={phone} style={{ width: 21, height: 21, tintColor: colors.Brown }} />
                </TouchableOpacity>
              )}


            {/* {
              loadingToggles[item.staff_id] ? (
                <ActivityIndicator size="small" color={colors.Brown} />
              ) : (
                <Switch
                  trackColor={{ false: "#f54949", true: "#1cd181" }}
                  thumbColor="#ebecee"
                  ios_backgroundColor="#3e3e3e"
                  disabled={!!loadingToggles[item.staff_id]}
                  onValueChange={value => {
                    const staffId = item.staff_id;

                    // Show loader for this staff
                    setLoadingToggles(prev => ({
                      ...prev,
                      [staffId]: true,
                    }));

                    // Optimistically update both display and source
                    setStaffList(prev =>
                      prev.map(staff =>
                        staff.staff_id === staffId
                          ? { ...staff, staff_location: value ? 'Yes' : 'No' }
                          : staff
                      )
                    );

                    // Update switch state mapping
                    setIsLocationEnabled(prev => ({
                      ...prev,
                      [staffId]: value,
                    }));

                    // Background API call
                    StaffInternetAccess(staffId, value ? 'Yes' : 'No');
                  }}



                  value={
                    isLocationEnabled[item.staff_id] !== undefined
                      ? isLocationEnabled[item.staff_id]
                      : item.staff_location === 'Yes'
                  }


                />

              )
            } */}
          </View>





        </View>


        {/* Actions Column */}
        {(
          userType === 'SuperAdmin' ||
          (userType === 'SubAdmin' && (
            permissions?.staff?.update || permissions?.staff?.delete
          ))
          || (userType === 'main' && (
            permissions?.staff?.update || permissions?.staff?.delete
          ))
        ) && (

            <TouchableOpacity onPress={() => OpenModal(item)} style={{ width: '20%', justifyContent: 'center', alignItems: 'flex-start' }}>
              <TouchableOpacity
                onPress={() => OpenModal(item)}
                style={{ width: '100%', justifyContent: 'center', alignItems: 'flex-start', marginLeft: 5 }}
              >
                <Entypo name="dots-three-vertical" size={18} color="black" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
      </View>
    </TouchableOpacity>
  );


  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* <Header
        title="Rajputana Agency"
        // onMenuPress={() => navigation.openDrawer()}
      /> */}
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
          Staff List
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

            placeholder="Search Staff Name/Mobile No"
            placeholderTextColor="grey"
            value={text}
            onChangeText={handleTextChange}
          />
          {text ? (
            <TouchableOpacity
              onPress={() => {

                setText(''); // Clear the search text
                setStaffList(originalStaffData);

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
      {data.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: '#f8f8f8', // Lighter background for better contrast
            paddingVertical: 10, // Adjusted padding for better spacing
            paddingHorizontal: 15,
            borderRadius: 8,
            marginBottom: 8, // Increased bottom margin for better separation
            shadowColor: '#000', // Added shadow for better separation from background
            shadowOpacity: 0.1, // Light shadow effect
            shadowRadius: 5,
            elevation: 2, // For Android shadow
          }}
        >
          <Text style={{ color: 'black', fontFamily: 'Inter-Bold', marginRight: 20 }}>
            Admin: <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>{AdminCount}</Text>
          </Text>
          <Text style={{ color: 'black', fontFamily: 'Inter-Bold' }}>
            Field: <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>{FieldCount}</Text>
          </Text>
        </View>
      )}
      {/* {data.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#ddd',
            padding: 7,
            borderRadius: 5,
          }}
        >
        
          <View style={{ width: '8%', justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={{
                fontWeight: 'bold',
                fontFamily: 'Inter-Medium',
                textAlign: 'center',
                fontSize: 12,
                color: 'black',
              }}
            >
              #
            </Text>
          </View>

        
          <View style={{ width: '35%', justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={{
                fontWeight: 'bold',
                fontFamily: 'Inter-Medium',
                textAlign: 'center',
                fontSize: 12,
                color: 'black',
              }}
            >
              NAME
            </Text>
          </View>



          <View style={{ width: '22%', justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={{
                fontWeight: 'bold',
                fontFamily: 'Inter-Medium',
                textAlign: 'center', // Center alignment for consistency
                fontSize: 12,
                color: 'black',
              }}
            >
              DATE
            </Text>
          </View>
          <View style={{ width: '25%', justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={{
                fontWeight: 'bold',
                fontFamily: 'Inter-Medium',
                textAlign: 'center', // Center alignment for consistency
                fontSize: 12,
                color: 'black',
              }}
            >

            </Text>
          </View>

        
          <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }} />
        </View>
      )} */}

      <FlatList
        keyboardShouldPersistTaps='handled'
        data={StaffList.slice(0, currentPage * 20)}
        renderItem={renderItem}
        onEndReached={loadMoreItems} // Trigger when scrolled to the bottom
        onEndReachedThreshold={0.5} // This determines when to trigger loadMoreItems (0.5 means half the list height)
        keyExtractor={(item) => item.staff_id.toString()}
        removeClippedSubviews={true}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ padding: 10, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.Brown} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          StaffLoading ? (
            <View style={{ padding: 10 }}>
              {[...Array(7)].map((_, index) => (
                <StaffShimmer key={index} />
              ))}
            </View>
          ) : (
            <View style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
              <Image source={Staff} style={{ width: 70, height: 70 }} />
              <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                No Staff Found
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
          paddingBottom: keyboardVisible ? 340 : 80,
          backgroundColor: 'white',
        }}
      />



      {/* Sticky Add New Button */}
      {(
        (userType === 'SuperAdmin') ||
        (userType === 'SubAdmin' && permissions?.staff?.insert) || (userType === 'main' && permissions?.staff?.insert)
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
                navigation.navigate('AddStaffScreen');
              }}>
              <AntDesign name="plus" color="white" size={18} />
            </TouchableOpacity>

          </View>
        )}
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
                marginRight: 40,
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
              width: '60%',
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
                  fontSize: 15,
                  fontWeight: 'bold',
                  marginBottom: 20,
                  color: 'black',
                  fontFamily: 'Inter-Regular',
                }}>
                Select Action
              </Text>
              {/* <TouchableOpacity
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
              </TouchableOpacity> */}
            </View>
            <View style={{ gap: 3, width: '90%' }}>
              {/* Info Staff Button */}
              {/* <TouchableOpacity
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
                <AntDesign name="infocirlceo" size={20} color={colors.Brown} />

                <Text
                  style={{
                    color: 'black',
                    fontFamily: 'Inter-Regular',
                    fontSize: 16,
                  }}>
                  Information Staff
                </Text>
              </TouchableOpacity> */}

              {/* Update Leave Button */}

              {(
                (userType === 'SuperAdmin') ||
                (userType === 'SubAdmin' && permissions?.staff?.update) || (userType === 'main' && permissions?.staff?.update)
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
                    <AntDesign name="edit" size={20} color="black" />
                    <Text
                      style={{
                        color: 'black',
                        fontFamily: 'Inter-Regular',
                        fontSize: 14,
                      }}>
                      Update Staff
                    </Text>
                  </TouchableOpacity>
                )}
              {/* Delete Leave Button */}

              {(
                (userType === 'SuperAdmin') ||
                (userType === 'SubAdmin' && permissions?.staff?.delete) || (userType === 'main' && permissions?.staff?.delete)
              ) && (


                  <TouchableOpacity
                    style={{
                      borderColor: 'red',
                      borderWidth: 1,
                      borderRadius: 10,
                      width: '100%',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 10,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      gap: 15,
                    }}
                    onPress={handleDelete}>
                    <AntDesign name="delete" size={20} color="red" />
                    <Text
                      style={{
                        color: 'red',
                        fontFamily: 'Inter-Regular',
                        fontSize: 14,
                      }}>
                      Delete Staff
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
                    justifyContent: 'flex-start',
                  }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily: 'Inter-Medium',
                      marginBottom: 20,
                      color: 'black',
                      textAlign: 'center',
                    }}>
                    Staff information
                  </Text>

                </View>


                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: '#333',
                        fontFamily: 'Inter-Medium',
                      }}>
                      Staff Name:{' '}
                    </Text>
                    {selectedStaff.staff_name || '-----'}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: '#333',
                        fontFamily: 'Inter-Medium',
                      }}>
                      Mobile No:{' '}
                    </Text>
                    {selectedStaff.staff_mobile || '-----'}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: '#333',
                        fontFamily: 'Inter-Medium',
                      }}>
                      Email:{' '}
                    </Text>
                    {selectedStaff.staff_email || '-----'}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: '#333',
                        fontFamily: 'Inter-Medium',
                      }}>
                      Entry Date:{' '}
                    </Text>
                    {selectedStaff.staff_entry_date || '-----'}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: '#333',
                        fontFamily: 'Inter-Medium',
                      }}>
                      Staff Type:{' '}
                    </Text>

                    {selectedStaff.staff_type == 'normal' ? 'User' : selectedStaff.staff_type || '----'}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: '#333',

                        fontFamily: 'Inter-Medium',
                      }}>
                      Staff Status:{' '}
                    </Text>
                    <Text
                      style={{
                        color: selectedStaff.staff_status ? 'green' : 'red',
                        fontFamily: 'Inter-Regular',
                      }}>
                      {selectedStaff.staff_status || '-----'}
                    </Text>
                  </Text>
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
            <Text style={{
              fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'black', fontFamily: 'Inter-Medium'
            }}>
              Confirm Delete
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
              Are you sure you want to delete the staff ?
            </Text>

            {/* Blacklist Checkbox */}
            <View style={{ width: '100%', marginBottom: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CheckBox
                  value={blacklistChecked}
                  onValueChange={(val) => {
                    setBlacklistChecked(val);
                    if (!val) {
                      setRemark('');
                      setRemarkError('');
                    }
                  }}

                  tintColors={{ true: colors.Brown, false: '#999' }}
                />
                <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>
                  Blacklist this staff
                </Text>
              </View>

              {blacklistChecked && (
                <>
                  <TextInput
                    placeholder="Enter remark"
                    placeholderTextColor="#999"
                    value={remark}
                    onChangeText={(text) => {
                      setRemark(text);
                      if (text.trim() !== '') setRemarkError('');
                    }}
                    style={{
                      borderWidth: 1,
                      borderColor: remarkError ? 'red' : '#ccc',
                      borderRadius: 6,
                      padding: 10,
                      marginTop: 8,
                      color: 'black',
                      fontFamily: 'Inter-Regular'
                    }}
                    multiline
                  />

                  {remarkError !== '' && (
                    <Text style={{
                      color: 'red',
                      fontSize: 12,
                      marginTop: 4,
                      fontFamily: 'Inter-Regular'
                    }}>
                      {remarkError}
                    </Text>
                  )}
                </>
              )}

            </View>


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
                  if (blacklistChecked && remark.trim() === '') {
                    setRemarkError('Remark is required');
                    return; // ❌ API call stop
                  }
                  setRemarkError('');

                  DeleteStaffApi(selectedStaff.staff_id);
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
        animationType="fade"
        transparent={true}
        visible={ResetModal}
        onRequestClose={closeResetModal}>
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onPress={closeResetModal}
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
              Reset Device
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
              Are you sure To Delete This Staff Device Id ?
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
              {selectedStaffName || '------'}
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: 'black', fontFamily: 'Inter-Medium' }}>
              {DeviceId || '------'}
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
                onPress={closeResetModal}>
                <Text
                  style={{
                    color: 'black',
                    fontWeight: 'bold',
                    fontFamily: 'Inter-Regular',
                  }}>
                  Cancle
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

                  if (selectedStaffId) {
                    DeviceIdReset(selectedStaffId); // Pass staff ID here
                  }
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontFamily: 'Inter-Regular',
                  }}>
                  Reset
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

    </View >
  );
};

export default HomeScreen;
