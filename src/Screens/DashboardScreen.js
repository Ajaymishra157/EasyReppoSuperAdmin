import React, { useCallback, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, Image, Alert, Modal, BackHandler, ToastAndroid, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Use FontAwesome for the icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import colors from '../CommonFiles/Colors';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Bottomtab from '../Component/Bottomtab';
import { ENDPOINTS } from '../CommonFiles/Constant';
import WelcomeShimmer from '../Component/WelcomeShimmer';
import RNExitApp from 'react-native-exit-app';
import Ionicons from 'react-native-vector-icons/Ionicons'

const DashboardScreen = () => {
  const [ConfrimationModal, setConfrimationModal] = useState(false);
  const navigation = useNavigation();
  const logout = require('../assets/images/logout.png');
  const sports = require('../assets/images/sportbike.png');
  const Agency = require('../assets/images/marketing.png');
  const Car = require('../assets/images/car.png');
  const History = require('../assets/images/search.png');
  const Permission = require('../assets/images/permission.png');
  const staff = require('../assets/images/team.png');

  const [isAgencyMode, setIsAgencyMode] = useState(false);
  const [days, setDays] = useState('');


  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchPermissions(); // Or whatever data-fetching function you use
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const [permissions, setPermissions] = useState({});
  console.log("permission ye hai", permissions);

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

      if (result.code == 200 && result.payload) {

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
        setIsLoadingPermissions(false);
      } else {
        console.warn('Failed to fetch permissions or no payload');
        setIsLoadingPermissions(false);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPermissions();
  }, []);


  const [userType, setUsertype] = useState(null);
  console.log("sub adminhai kya", userType);

  const allPermissionsFalse = Object.keys(permissions).length === 0;


  const [Name, setName] = useState('');

  const [CloseAppModal, setCloseAppModal] = useState(false)
  const handleLogout = async () => {
    setConfrimationModal(true);

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
        const days = result.days;
        setName(result.payload[0]?.staff_name);
        setDays(days);
        const staffStatus = result?.payload?.[0]?.staff_status;

        const userType = result?.payload?.[0]?.user_type;
        console.log("agency logout mai dashboard screen se mene usrtyoe liya", userType);
        await AsyncStorage.setItem('user_type', userType);


        if (staffStatus === 'Deactive') {

          confirmLogout(); // Trigger logout
        } else {

        }
      } else {
        // ToastAndroid.show(result.message || 'Failed to logout staff', ToastAndroid.SHORT);
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
    setConfrimationModal(false); // Modal ko close karega
  };


  const closeconfirmodal = () => {
    setConfrimationModal(false); // Hide the modal
  };


  const closeExitModal = () => {
    setCloseAppModal(false);

  }
  const confirmExit = () => {
    RNExitApp.exitApp();
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        console.log("called");
        setCloseAppModal(true); // Show modal on back press
        return true; // Prevent default behavior
      };

      BackHandler.addEventListener("hardwareBackPress", backAction);

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", backAction);
    }, [])
  );





  useFocusEffect(
    React.useCallback(() => {
      let usertype = null;

      const fetchUsertype = async () => {
        usertype = await AsyncStorage.getItem('user_type');
        const agency = await AsyncStorage.getItem('selected_agency');
        setUsertype(usertype);
        setIsAgencyMode(!!agency);
      };

      fetchUsertype();
    }, []),
  );


  // useFocusEffect(
  //   React.useCallback(() => {
  //     const backAction = () => {
  //       Alert.alert(
  //         "Confirmation",
  //         "Are You Sure You Want To close The App?",
  //         [
  //           {
  //             text: "No",
  //             onPress: () => null,
  //             style: "cancel"
  //           },
  //           { text: "Yes", onPress: () => BackHandler.exitApp() }
  //         ]
  //       );
  //       return true; // Prevent default behavior
  //     };

  //     BackHandler.addEventListener("hardwareBackPress", backAction);

  //     return () =>
  //       BackHandler.removeEventListener("hardwareBackPress", backAction);
  //   }, [])
  // );


  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  console.log("isloadingpermission", isLoadingPermissions);

  // useEffect to monitor permission load

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
      <View style={{ backgroundColor: colors.Brown, paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter-Bold', }}> Easy Reppo </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#f7f7f7', paddingBottom: 100 }} refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#9Bd35A', '#689F38']}
        />
      }>

        {!Name ? (
          <WelcomeShimmer />
        ) : (
          <View style={{ width: '100%', justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row', paddingLeft: 10, height: 30, }} >
            <Text style={{ color: 'black', fontSize: 15, fontFamily: 'Inter-Bold', }}> Welcome</Text>
            <Text style={{ color: 'black', fontSize: 15, fontFamily: 'Inter-Regular', marginLeft: 5 }}> :- {Name} </Text>
          </View>
        )}

        {/* Row container */}
        {userType == 'SuperAdmin' && (
          <>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                marginTop: 10,
                paddingHorizontal: 15,

              }}>
              {/* First Box (Staff) */}
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android
                }}
                onPress={() => {
                  navigation.navigate('HomeScreen');
                }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#000080'
                  }}>
                  <FontAwesome name="user" size={25} color="#000080" />
                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',
                  }}>
                  Staff
                </Text>
              </TouchableOpacity>

              {/* Second Box (Schedule) */}
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android
                }}
                onPress={() => {
                  navigation.navigate('StaffSchedule');
                }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#2E8B57'
                  }}>
                  <FontAwesome name="calendar" size={25} color="#2E8B57" />
                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',
                  }}>
                  Schedule
                </Text>
              </TouchableOpacity>
              {/* First Box */}
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android
                }}
                onPress={() => {
                  navigation.navigate('SearchVehicle');
                }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#FFA500'
                  }}>
                  <Image
                    source={sports}
                    style={{ width: 25, height: 25, tintColor: '#FFA500' }}
                  />
                </View>
                <Text
                  style={{
                    color: '#000', // Change text color to make it more visible on white
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',
                  }}>
                  Intimation
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                marginTop: 30,
                paddingHorizontal: 15,
                justifyContent: 'space-between',
              }}>

              {/* third Box */}
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android

                }}
                onPress={() => {
                  navigation.navigate('AreaList');
                }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#800080'
                  }}>
                  <MaterialIcons name="location-on" size={25} color="#800080" />
                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',


                  }}>
                  Area
                </Text>
              </TouchableOpacity>
              {/* Second Box */}
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android

                }}
                onPress={() => {
                  navigation.navigate('ListingScreen');
                }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#8B0000'
                  }}>
                  <FontAwesome name="list" size={25} color="#8B0000" />
                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',



                  }}>
                  Pso Confirm/Cancel List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android
                }}
                onPress={() => {
                  navigation.navigate('SearchHistory');
                }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#87CEEB'
                  }}>
                  <FontAwesome name="search" size={25} color="#87CEEB" />
                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',

                  }}>
                  Search History
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                marginTop: 30,
                paddingHorizontal: 15,
              }}>

              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android
                }}
                onPress={() => {
                  navigation.navigate('AgencySelect');
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#4169E1', // Royal Blue
                  }}
                >
                  <Image source={Agency} style={{ width: 25, height: 25 }} />
                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',
                  }}
                >
                  Rent Agency
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android
                }}
                onPress={() => {
                  navigation.navigate('OtherApplist');
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#4169E1', // Royal Blue
                  }}
                >
                  <Image source={Agency} style={{ width: 25, height: 25 }} />
                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',
                  }}
                >
                  Extra App
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android
                }}
                onPress={() => {
                  navigation.navigate('SingleVehicleList');
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#4169E1', // Royal Blue
                  }}
                >
                  <Image source={Car} style={{ width: 50, height: 50 }} />
                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',
                  }}
                >
                  Vehicle Upload
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                marginTop: 30,
                paddingHorizontal: 15,
              }}>
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android
                }}
                onPress={() => {
                  navigation.navigate('SubAdminAgencyWise');
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#4169E1', // Royal Blue
                  }}
                >
                  <Image source={History} style={{ width: 25, height: 25 }} />
                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',
                  }}
                >
                  SubAdmin History
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8,
                }}
                onPress={() => {
                  navigation.navigate('BlackListUser'); // 👈 apna screen name
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#DC2626', // 🔴 Red for blacklist
                  }}
                >
                  <MaterialIcons name="block" size={26} color="#DC2626" />
                </View>

                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',
                  }}
                >
                  Black List Staffs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android
                }}
                onPress={() => {
                  navigation.navigate('StaffVehicleRecords');
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#3F51B5', // Royal Blue
                  }}
                >
                  <Image source={staff} style={{ width: 25, height: 25 }} />
                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',
                  }}
                >
                  Staff Vehicle Records
                </Text>
              </TouchableOpacity>

















            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                marginTop: 30,
                paddingHorizontal: 15,
              }}>



              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  width: 100,
                  height: 120,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8, // For Android
                }}
                onPress={() => {
                  navigation.navigate('AppSetting');
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 30,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#009688', // Royal Blue
                  }}
                >
                  <Ionicons name="settings-outline" size={25} color="#009688" />

                </View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 12,
                    textAlign: 'center',
                    fontFamily: 'Inter-Medium',
                  }}
                >
                  App Settings
                </Text>
              </TouchableOpacity>
















            </View>
          </>
        )}

        {userType == 'main' && (() => {
          if (isLoadingPermissions) {
            return (
              <View style={{ height: 600, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color="#022e29" />
                <Text style={{ marginTop: 10 }}>Loading permissions...</Text>
              </View>
            );
          }
          const items = [
            permissions?.staff && {
              label: 'Staff',
              icon: <FontAwesome name="user" size={25} color="#000080" />,
              navigateTo: 'HomeScreen',
              borderColor: '#000080',
            },
            permissions?.staff_schedule && {
              label: 'Schedule',
              icon: <FontAwesome name="calendar" size={25} color="#2E8B57" />,
              navigateTo: 'StaffSchedule',
              borderColor: '#2E8B57',
            },
            permissions?.search_history && {
              label: 'Search History',
              icon: <FontAwesome name="search" size={25} color="#87CEEB" />,
              navigateTo: 'SearchHistory',
              borderColor: '#87CEEB',
            },
            permissions?.intimation && {
              label: 'Intimation',
              icon: <Image source={sports} style={{ width: 25, height: 25, tintColor: '#FFA500' }} />,
              navigateTo: 'SearchVehicle',
              borderColor: '#FFA500',
            },
            permissions?.pso_list && {
              label: 'PSO CONFIRM/CANCEL LIST',
              icon: <FontAwesome name="list" size={25} color="#8B0000" />,
              navigateTo: 'ListingScreen',
              borderColor: '#8B0000',
              fontSize: 11,
            },
            permissions?.area && {
              label: 'Area',
              icon: <MaterialIcons name="location-on" size={25} color="#800080" />,
              navigateTo: 'AreaList',
              borderColor: '#800080',
            },
            permissions?.rent_agency && {
              label: 'Rent Agency',
              icon: <Image source={Agency} style={{ width: 25, height: 25 }} />,
              navigateTo: 'AgencySelect',
              borderColor: '#42eb6cff',
            },
            permissions?.vehicle_upload && {
              label: 'Vehicle Upload',
              icon: <Image source={Car} style={{ width: 25, height: 25 }} />,
              navigateTo: 'SingleVehicleList',
              borderColor: '#2E8B57',
            },

            permissions?.subadmin_history && {
              label: 'SubAdmin History',
              icon: <Image source={History} style={{ width: 30, height: 30 }} />,
              navigateTo: 'SubAdminAgencyWise',
              borderColor: '#87CEEB',
            },
            permissions?.black_list_staffs && {  // ✅ Check your permission key
              label: 'Black List Staffs',
              icon: <FontAwesome name="ban" size={25} color="#FF0000" />, // ya koi custom icon/image
              navigateTo: 'BlackListUser', // jo screen aapka black list staff screen hai
              borderColor: '#FF0000',
            }

          ].filter(Boolean);

          if (items.length === 0) {
            return (
              <View style={{ height: 600, padding: 40, alignItems: 'center', justifyContent: 'center', }}>
                <Image source={Permission} style={{ width: 70, height: 70 }} />
                <Text style={{ fontSize: 16, color: 'red', fontFamily: 'Inter-Regular', marginTop: 20 }}>
                  No Permission Assigned
                </Text>
              </View>
            );
          }
          return (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
                gap: 25,
                marginTop: 30,
                paddingHorizontal: 20,
                paddingBottom: 80

              }}
            >
              {/* Collect all boxes dynamically */}
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    borderRadius: 15,
                    width: 100,
                    height: 120,
                    padding: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 8,
                    marginBottom: 7,


                  }}
                  onPress={() => navigation.navigate(item.navigateTo)}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 30,
                      backgroundColor: 'white',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: item.borderColor,
                    }}
                  >
                    {item.icon}
                  </View>
                  <Text
                    style={{
                      color: 'black',
                      fontSize: item.fontSize || 12,
                      textAlign: 'center',
                      fontFamily: 'Inter-Medium',
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })()}

        {userType == 'SubAdmin' && (() => {

          if (isLoadingPermissions) {
            return (
              <View style={{ height: 600, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color="#022e29" />
                <Text style={{ marginTop: 10 }}>Loading permissions...</Text>
              </View>
            );
          }
          const items = [
            permissions?.staff && {
              label: 'Staff',
              icon: <FontAwesome name="user" size={25} color="#000080" />,
              navigateTo: 'HomeScreen',
              borderColor: '#000080',
            },
            permissions?.staff_schedule && {
              label: 'Schedule',
              icon: <FontAwesome name="calendar" size={25} color="#2E8B57" />,
              navigateTo: 'StaffSchedule',
              borderColor: '#2E8B57',
            },
            permissions?.search_history && {
              label: 'Search History',
              icon: <FontAwesome name="search" size={25} color="#87CEEB" />,
              navigateTo: 'SearchHistory',
              borderColor: '#87CEEB',
            },
          ]
            .filter(Boolean);
          if (items.length === 0) {
            return (
              <View style={{ height: 600, padding: 40, alignItems: 'center', justifyContent: 'center', }}>
                <Image source={Permission} style={{ width: 70, height: 70 }} />
                <Text style={{ fontSize: 16, color: 'red', fontFamily: 'Inter-Regular', marginTop: 20 }}>
                  No Permission Assigned
                </Text>
              </View>
            );
          }

          return (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                marginTop: 30,
                paddingHorizontal: 15,
              }}
            >


              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    borderRadius: 15,
                    width: 100,
                    height: 120,
                    padding: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 8,
                  }}
                  onPress={() => navigation.navigate(item.navigateTo)}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 30,
                      backgroundColor: 'white',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: item.borderColor,
                    }}
                  >
                    {item.icon}
                  </View>
                  <Text
                    style={{
                      color: 'black',
                      fontSize: item.fontSize || 12,
                      textAlign: 'center',
                      fontFamily: 'Inter-Medium',
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })()}
      </ScrollView>

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

      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Bottomtab />
      </View>
    </View>
  );
};

export default DashboardScreen;
