import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,

  Modal,
  Alert,
  TextInput,
  Image,
  Switch,
  Keyboard
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import Toast from 'react-native-toast-message';





const HomeScreen = () => {
  const phone = require('../assets/images/phone.png');
  const Staff = require('../assets/images/team.png');
  const account = require('../assets/images/user.png');
  const navigation = useNavigation();
  const [StaffList, setStaffList] = useState([]);
  const [StaffLoading, setStaffLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [AllCount, setAllCount] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [InfoModal, SetInfoModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);



  const [ConfrimationModal, setConfrimationModal] = useState(false);
  const [ResetModal, setResetModal] = useState(false);
  const [ResetModalAll, setResetModalAll] = useState(false);

  const [data, setData] = useState(StaffList.slice(0, 20));  // Load first 20 items initially
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Keep track of current page for loading data

  const [AdminCount, setAdminCount] = useState('');
  const [text, setText] = useState('');
  const [originalStaffData, setoriginalStaffData] = useState([]);
  const hasStaff = originalStaffData.length > 0;
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

  const [currentScrollPosition, setCurrentScrollPosition] = useState(0);
  console.log("current position", currentScrollPosition)
  const [loadedStaffIds, setLoadedStaffIds] = useState([]);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // useFocusEffect में conditional logic add करें
  useFocusEffect(
    useCallback(() => {

      if (isInitialLoad) {
        console.log("1")
        fetchData(selectedTab, true);
        setIsInitialLoad(false);
      }

      if (shouldRefresh) {
        console.log("2")
        // Only fetch data if something was changed in information screen
        fetchData(selectedTab);
        setShouldRefresh(false);
      }
    }, [shouldRefresh, selectedTab, isInitialLoad])
  );

  // informationScreen से वापस आने पर data update करने के लिए function
  const handleReturnFromInfoScreen = useCallback(() => {

    // अगर search text है तो उसके according filter करें, वरना normal fetch करें
    if (text.trim() !== '') {
      // Search text है, तो current text के according filter करें
      const filtered = originalStaffData.filter(item => {
        const lowerCaseInput = text.toLowerCase();
        return (
          item.staff_name?.toLowerCase().includes(lowerCaseInput) ||
          item.staff_mobile?.toLowerCase().includes(lowerCaseInput)
        );
      });

      // Directly set filtered data
      setStaffList(filtered);
      setCurrentPage(1);
      setData(filtered.slice(0, 20));

      // थोड़ी delay के बाद scroll position restore करें
      // setTimeout(() => {
      //   if (flatListRef.current && currentScrollPosition > 0) {
      //     flatListRef.current.scrollToOffset({
      //       offset: currentScrollPosition,
      //       animated: false
      //     });
      //   }
      // }, 500);
    } else {
      // कोई search नहीं है, तो normal fetch करें
      setTimeout(() => {
        console.log("3")
        fetchData(selectedTab, true); // true = preserve scroll position
      }, 100);
    }
  }, [selectedTab, text, originalStaffData, currentScrollPosition]);




  const [permissions, setPermissions] = useState({});
  console.log("fetch permission ye hai", permissions, permissions.staff && permissions.staff.staffreset);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [blacklistChecked, setBlacklistChecked] = useState(false);
  const [remark, setRemark] = useState('');
  const [remarkError, setRemarkError] = useState('');

  const tabs = [
    { key: '', label: 'Total', count: AllCount, bgColor: '#7c3aed', },
    { key: 'admin', label: 'Admin', count: AdminCount, bgColor: '#0ea5e9', },
    { key: 'field', label: 'Field', count: FieldCount, bgColor: '#22c55e', },

  ]

  const [selectedTab, setSelectedTab] = useState('');

  const handleTabPress = (tabKey) => {
    setCurrentScrollPosition(0);
    setSelectedTab(tabKey);

    setText(''); // Search text clear करें
    setCurrentPage(1); // Pagination reset करें
    // ✅ IMPORTANT — purana data hatao
    setStaffList([]);
    setData([]);

    fetchData(tabKey, false);
    // setCurrentPage(1); // ✅ पेज रीसेट करें
    // fetchData(tabKey); // Send tab key to API
  }







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
  const closeResetModalAll = () => {
    setResetModalAll(false); // Hide the modal
  };


  const OpenResetModal = (item) => {
    setSelectedStaffId(item.staff_id);
    setselectedStaffName(item.staff_name);
    setDeviceId(item.device_id);
    setResetModal(true); // Hide the modal
  };

  const OpenResetAllModal = (item) => {
    setResetModalAll(true); // Hide the modal

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
          Toast.show({
            type: 'success',
            text1: 'Staff Deleted Successfully',
            position: 'bottom',
            bottomOffset: 60,
            visibilityTime: 2000,
          });          // reset
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

  const fetchData = async (filterKey = '', shouldPreservePosition = false) => {
    console.log("wapis aya mai and tab filter key ye hai", filterKey);


    setStaffLoading(true);

    // setStaffList([]);
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
          filter: filterKey,

        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.code === 200) {
          setStaffList(prev => {
            if (JSON.stringify(prev) === JSON.stringify(result.payload)) {
              return prev;
            }
            return result.payload;
          });
          setAdminCount(result.count_admin);
          setFieldCount(result.count_field);
          setAllCount(result.count_all);


          setoriginalStaffData(result.payload);

          // Data set होने के बाद scroll position restore करें
          // if (shouldPreservePosition && currentScrollPosition > 0) {
          //   setTimeout(() => {
          //     if (flatListRef.current) {
          //       flatListRef.current.scrollToOffset({
          //         offset: currentScrollPosition,
          //         animated: false
          //       });
          //     }
          //   }, 100);
          // }
        } else {
          console.log('Error:', 'Failed to load staff data');
          // ✅ Error की स्थिति में भी empty array set करें
          setStaffList([]);
          setoriginalStaffData([]);
        }
      } else {
        console.log('HTTP Error:', result.message || 'Something went wrong');
        setStaffList([]);
        setoriginalStaffData([]);
      }
    } catch (error) {
      console.log('Error fetching data:', error.message);
      setStaffList([]);
      setoriginalStaffData([]);
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
          Toast.show({
            type: 'success',
            text1: result.message || 'Location Access changes successfully',
            position: 'bottom',
            bottomOffset: 60,
            visibilityTime: 2000,
          });
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
        // Toast.show({
        //   type: 'error',
        //   text1: result.message || 'Failed to logout staff',
        //   position: 'bottom',
        //   bottomOffset: 60,
        //   visibilityTime: 2000,
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
          Toast.show({
            type: 'success',
            text1: 'Reset Device Id successfully',
            position: 'bottom',
            bottomOffset: 60,
            visibilityTime: 2000,
          });
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

  const resetAllDeviceId = async () => {
    try {
      const response = await fetch(ENDPOINTS.reset_all_device_id, {
        method: 'GET', // ✅ GET request
      });

      const result = await response.json();

      if (response.ok) {
        if (result.code === 200) {
          Toast.show({
            type: 'success',
            text1: 'All Device Ids reset successfully',
            position: 'bottom',
            bottomOffset: 60,
            visibilityTime: 2000,
          });
          setResetModalAll(false);
          fetchData(); // Refresh staff list
        } else {
          console.log('Error:', result.message || 'Failed to reset devices');
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

      console.log("Focus hua, current text:", text);

      // 🔴 Agar search active hai → refresh mat karo
      if (text.trim() !== '') {
        console.log("Search active hai, refresh skip");
        return;
      }

      // 🟢 Agar search empty hai → refresh karo
      console.log("Search empty hai, refresh ho raha hai");
      fetchData(selectedTab);

    }, [selectedTab, text])   // ✅ text add karo yaha
  );


  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentScrollPosition(0);
    console.log("5")
    await fetchData(selectedTab, true);
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



  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const renderItem = ({ item, index }) => {
    // Function to get initials if no image
    const getInitials = (name) => {
      if (!name) return '';
      const words = name.trim().split(' ');
      if (words.length === 1) return words[0][0].toUpperCase();
      return (words[0][0] + words[1][0]).toUpperCase();
    };

    // Function to get status color
    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'active': return '#e2feee';
        case 'pending': return '#f1c40f';
        case 'deactive': return '#fee2e2';
        default: return 'grey';
      }
    };
    // Utility function to format date
    const formatDate = (dateString) => {
      if (!dateString) return '--';
      const date = new Date(dateString);
      if (isNaN(date)) return '--';

      const day = ('0' + date.getDate()).slice(-2);
      const month = ('0' + (date.getMonth() + 1)).slice(-2); // month is 0-indexed
      const year = date.getFullYear();

      return `${day}-${month}-${year}`; // Example: 30-11-2025
    };



    return (
      <TouchableOpacity
        key={item.staff_id}
        style={{
          flexDirection: 'row',
          backgroundColor: '#ffffff',
          padding: 10,
          marginHorizontal: 13,
          marginVertical: 7,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: '#ddd',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
        onPress={() =>
          navigation.navigate('informationScreen', {
            userData: item,
            setStaffList: setStaffList,
            onGoBack: handleReturnFromInfoScreen,
            currentTab: selectedTab,
          })
        }
        activeOpacity={1}
      >

        {/* STATUS BADGE */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: getStatusColor(item.staff_status),
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderBottomLeftRadius: 5,
            borderTopRightRadius: 5,
            zIndex: 2,
          }}
        >
          <Text style={{ color: 'black', fontSize: 10, fontWeight: 'bold' }}>
            {item.staff_status || '--'}
            {item.account_status ? ` - ${item.account_status}` : ''}
          </Text>
        </View>

        {/* IMAGE + INFO */}
        <View style={{ flexDirection: 'row', width: '50%' }}>
          {/* IMAGE */}
          <View style={{ width: '30%', justifyContent: 'center', alignItems: 'flex-start' }}>
            <TouchableOpacity
              onPress={() => {
                setSelectedImage(
                  item.staff_image ? { uri: encodeURI(item.staff_image) } : { name: item.staff_name }
                );
                setModalVisible(true);
              }}
              activeOpacity={0.8}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#ccc',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: !item.staff_image ? '#ccc' : 'transparent',
              }}
            >
              {item.staff_image ? (
                <Image
                  source={{ uri: encodeURI(item.staff_image) }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  {getInitials(item.staff_name)}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* NAME + MOBILE + TYPE */}
          <View style={{ flex: 1, justifyContent: 'center', marginLeft: 5 }}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontSize: 12,
                color: '#000',
                fontFamily: 'Inter-Bold',
                textTransform: 'uppercase',
              }}
            >
              {item.staff_name || '----'}
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#374151',
              fontFamily: 'Inter-Regular', marginTop: 2
            }}>
              {item.staff_mobile || '----'}
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#374151',
              fontFamily: 'Inter-Regular', marginTop: 2
            }}>
              {item.staff_type === 'normal' ? 'Field Staff' : item.staff_type || '----'}
            </Text>
          </View>
        </View>

        {/* SCHEDULE */}
        <View
          style={{
            position: 'absolute',
            top: 35,
            left: '52%',
            width: '50%',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, color: '#000', fontFamily: 'Inter-Regular' }}>
            {item.schedule_staff_start_date && item.schedule_staff_end_date
              ? `${formatDate(item.schedule_staff_start_date)} - ${formatDate(item.schedule_staff_end_date)}`
              : 'Not Available'}
          </Text>
        </View>

      </TouchableOpacity>

    );
  };



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
      {(StaffLoading || originalStaffData.length > 0) && (
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
      )}
      {(StaffLoading || originalStaffData.length > 0) && (
        <View>
          <ScrollView
            horizontal
            keyboardShouldPersistTaps='handled'
            showsHorizontalScrollIndicator={false}
            style={{
              // FIXED HEIGHT
              paddingVertical: 5,
            }}
            contentContainerStyle={{
              paddingHorizontal: 10,
              height: 60,
              backgroundColor: 'white'
            }}
          >
            {tabs.map((tab) => {
              const isSelected = selectedTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabPress(tab.key)}
                  style={{
                    backgroundColor: isSelected ? tab.bgColor : `${tab.bgColor}33`, // selected: full color, unselected: transparent version
                    paddingVertical: 8,
                    paddingHorizontal: 15,
                    borderRadius: 8,
                    marginRight: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{
                    color: isSelected ? 'white' : 'black',
                    fontFamily: 'Inter-Bold',
                    fontSize: 12,
                  }}>
                    {tab.label}
                  </Text>
                  <Text style={{
                    color: isSelected ? 'white' : 'black',
                    fontFamily: 'Inter-Regular',
                    fontSize: 12,
                  }}>
                    {tab.count || 0}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}



      {/* {StaffLoading && StaffList.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.7)',
            zIndex: 999,
          }}
        >
          <ActivityIndicator size="large" color={colors.Brown} />
        </View>
      )} */}

      <FlatList
        // ref={flatListRef}
        keyboardShouldPersistTaps='handled'
        // data={StaffList.slice(0, currentPage * 20)}
        data={data}
        renderItem={renderItem}
        onEndReached={loadMoreItems} // Trigger when scrolled to the bottom
        onEndReachedThreshold={0.5} // This determines when to trigger loadMoreItems (0.5 means half the list height)
        keyExtractor={(item) => item.staff_id.toString()}
        removeClippedSubviews={true}

        // onScroll={(event) => {
        //   setCurrentScrollPosition(event.nativeEvent.contentOffset.y);
        // }}
        // scrollEventThrottle={16}

        // ✅ टैब बदलने पर ऊपर लोडर दिखाएं
        // ListHeaderComponent={
        //   StaffLoading && StaffList.length > 0 ? (
        //     <View style={{ padding: 10, alignItems: 'center' }}>
        //       <ActivityIndicator size="large" color={'red'} />
        //     </View>
        //   ) : null
        // }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ padding: 10, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.Brown} />
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
            colors={[colors.Brown, colors.Brown]}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: keyboardHeight + 80,
          backgroundColor: 'white'

        }}
      />



      {/* Sticky Add New Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1,
        }}
      >

        {/* Reset All Staff */}
        {(
          (userType === 'SuperAdmin' && hasStaff) ||
          (userType !== 'SuperAdmin' && permissions?.staff?.allstaffreset)
        ) && (
            <TouchableOpacity
              style={{
                flex: 1,
                marginRight: 10,
                backgroundColor: colors.Brown,
                borderWidth: 1,
                borderColor: colors.Brown,
                borderRadius: 10,
                paddingVertical: 12,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
              onPress={() => OpenResetAllModal(selectedStaff)}
            >
              <Image
                source={phone}
                style={{ width: 20, height: 20, tintColor: 'white' }}
              />
              <Text
                style={{
                  color: 'white',
                  fontSize: 14,
                  fontFamily: 'Inter-Medium',
                }}
              >
                Reset All Staff
              </Text>
            </TouchableOpacity>
          )}

        {/* Add Staff */}
        {(userType === 'SuperAdmin' ||
          permissions?.staff?.insert) && (
            <TouchableOpacity
              style={{
                flex: 1,
                marginLeft:
                  (userType === 'SuperAdmin' || permissions?.staff?.allstaffreset)
                    ? 10
                    : 0,
                backgroundColor: colors.Brown,
                borderRadius: 10,
                paddingVertical: 12,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
              onPress={() => navigation.navigate('AddStaffScreen')}
            >
              <AntDesign name="plus" color="white" size={18} />
              <Text
                style={{
                  color: 'white',
                  fontSize: 14,
                  fontFamily: 'Inter-Medium',
                }}
              >
                Add Staff
              </Text>
            </TouchableOpacity>
          )}

      </View>
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
            {selectedImage ? (
              selectedImage.uri ? (
                <Image
                  source={selectedImage}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 150,
                    resizeMode: 'cover',
                  }}
                />
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 150,
                    backgroundColor: '#ccc',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 40, fontWeight: 'bold' }}>
                    {getInitials(selectedImage.name)}
                  </Text>
                </View>
              )
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>


      <Modal
        animationType="fade"
        transparent={true}
        visible={ResetModalAll}
        onRequestClose={closeResetModalAll}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onPress={closeResetModalAll}
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
            onStartShouldSetResponder={() => true} // Prevent modal close on content click
            onTouchEnd={e => e.stopPropagation()}
          >
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 10,
              color: 'black',
              fontFamily: 'Inter-Medium'
            }}>
              Reset Device
            </Text>
            <Text style={{
              fontSize: 14,
              marginBottom: 20,
              textAlign: 'center',
              color: 'black',
              fontFamily: 'Inter-Medium'
            }}>
              Are you sure you want to Reset All Staff Device Ids?
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              {/* Cancel Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#ddd',
                  padding: 10,
                  borderRadius: 5,
                  width: '45%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={closeResetModalAll}
              >
                <Text style={{
                  color: 'black',
                  fontWeight: 'bold',
                  fontFamily: 'Inter-Regular',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              {/* Reset All Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: colors.Brown,
                  padding: 10,
                  borderRadius: 5,
                  width: '45%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={async () => {
                  await resetAllDeviceId(); // ✅ Call API
                }}
              >
                <Text style={{
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

    </View >
  );
};

export default HomeScreen;
