import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Alert,
  Keyboard
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../CommonFiles/Colors';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ENDPOINTS } from '../CommonFiles/Constant';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sqlite-storage';
import { openDB } from '../utils/db';

const SearchVehicle = () => {
  const vehicle = require('../assets/images/vehicle.png');
  const navigation = useNavigation();

  const [SearchVehicle, setSearchVehicle] = useState([]);
  const [SearchLoading, setSearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [text, setText] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('Reg No');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [typeError, settypeError] = useState('');
  const [SearchError, setSearchError] = useState('');
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [userType, setUsertype] = useState(null);
  const [staff_financelist, setStaff_financelist] = useState(null);
  const [easyreppo_financelist, seteasyreppo_financelist] = useState(null);
  const [rentAgencyId, setRentAgencyId] = useState(null);

  const textInputRef = useRef(null);
  const availableTypes = ['Reg No', 'Chassis No', 'Eng No', 'Agg No'];

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let usertype = null;
      const fetchUsertype = async () => {
        usertype = await AsyncStorage.getItem('user_type');
        setUsertype(usertype);
      };
      fetchUsertype();
    }, []),
  );

  useEffect(() => {
    const loadRentAgencyId = async () => {
      try {
        const id = await AsyncStorage.getItem('rent_agency_id');
        console.log('🏢 Rent Agency ID:', id);
        setRentAgencyId(id);
      } catch (error) {
        console.log('Error loading rent agency id:', error);
      }
    };
    loadRentAgencyId();
    UserWiseExpiryApi();
    fetchPermissions();
  }, []);

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
          const menuName = item.menu_name.toLowerCase();
          const permsArray = item.menu_permission
            .split(',')
            .map(p => p.trim().toLowerCase());
          const permsObject = {};
          permsArray.forEach(perm => {
            permsObject[perm] = true;
          });
          permData[menuName] = permsObject;
        });
        setPermissions(permData);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
    setLoading(false);
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
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      console.log("userwise ka result ye hai okay", result);
      if (result.code == 200 && result.payload) {
        setStaff_financelist(result.payload.staff_finance_list);
        seteasyreppo_financelist(result.payload.easyreppo_finance_list);
      }
    } catch (error) {
      console.log('❌ Error fetching user wise data asc:', error.message);
    }
  };

  const normalizedotherFinanceList = React.useMemo(() => {
    if (!easyreppo_financelist) return [];
    let list = Array.isArray(easyreppo_financelist)
      ? easyreppo_financelist
      : easyreppo_financelist.split(',');
    return list
      .map(f => f.trim().toUpperCase())
      .filter(f => f.length > 0);
  }, [easyreppo_financelist]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [])
  );

  const toggleType = () => {
    setText('');
    setSearchError('');
    setSearchVehicle([]);
    const currentIndex = availableTypes.indexOf(selectedType);
    const nextIndex = (currentIndex + 1) % availableTypes.length;
    setSelectedType(availableTypes[nextIndex]);
  };

  // Helper function to extract last 4/5 characters
  const getLastCharacters = (input, count) => {
    if (!input) return '';
    // Remove all non-alphanumeric characters first
    const cleaned = input.replace(/[^a-zA-Z0-9]/g, '');
    // Return last 'count' characters
    return cleaned.slice(-count).toUpperCase();
  };

  const handleLocalSearch = async (query) => {
    if (!query) {
      setSearchVehicle([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    try {
      const db = await openDB();
      let sql = '';
      let params = [];

      const makeRange = (prefix) => {
        if (!prefix) return ['', ''];
        const lastChar = prefix.slice(-1);
        const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
        const nextPrefix = prefix.slice(0, -1) + nextChar;
        return [prefix, nextPrefix];
      };

      let searchQuery = query.toUpperCase().trim();
      const cleanedQuery = searchQuery.replace(/[^a-zA-Z0-9]/g, '');

      // 🔹 Different logic for each search type
      if (selectedType === "Reg No") {
        // Agar 4 characters se kam hai to error
        if (cleanedQuery.length < 4) {
          setSearchError('Please enter at least 4 characters for registration number');
          setSearchLoading(false);
          return;
        }

        // Agar exactly 4 alphanumeric characters hain to range search (last 4)
        if (cleanedQuery.length === 4) {
          let range = makeRange(cleanedQuery);
          sql = `SELECT * FROM full_vehicle_detail WHERE reg_last >= ? AND reg_last < ? AND vehicle_status = 'Active'`;
          params = range;
          console.log("🔍 Searching Reg No by last 4:", cleanedQuery);
        } else {
          // Agar 4 se zyada characters hain to full search (exact match ya partial)
          // Pehle exact match try karo
          sql = `SELECT * FROM full_vehicle_detail WHERE vehicle_registration_no = ? AND vehicle_status = 'Active'`;
          params = [searchQuery];
          console.log("🔍 Searching Reg No by exact match:", searchQuery);
        }
      }
      else if (selectedType === "Chassis No") {
        if (cleanedQuery.length < 5) {
          setSearchError('Please enter at least 5 characters for chassis number');
          setSearchLoading(false);
          return;
        }

        if (cleanedQuery.length === 5) {
          let range = makeRange(cleanedQuery);
          sql = `SELECT * FROM full_vehicle_detail WHERE chassis_last >= ? AND chassis_last < ? AND vehicle_status = 'Active'`;
          params = range;
          console.log("🔍 Searching Chassis No by last 5:", cleanedQuery);
        } else {
          // Full chassis number search
          sql = `SELECT * FROM full_vehicle_detail WHERE vehicle_chassis_no = ? AND vehicle_status = 'Active'`;
          params = [searchQuery];
          console.log("🔍 Searching Chassis No by exact match:", searchQuery);
        }
      }
      else if (selectedType === "Eng No") {
        if (cleanedQuery.length < 5) {
          setSearchError('Please enter at least 5 characters for engine number');
          setSearchLoading(false);
          return;
        }

        if (cleanedQuery.length === 5) {
          let range = makeRange(cleanedQuery);
          sql = `SELECT * FROM full_vehicle_detail WHERE eng_last >= ? AND eng_last < ? AND vehicle_status = 'Active'`;
          params = range;
          console.log("🔍 Searching Engine No by last 5:", cleanedQuery);
        } else {
          // Full engine number search
          sql = `SELECT * FROM full_vehicle_detail WHERE vehicle_engine_no = ? AND vehicle_status = 'Active'`;
          params = [searchQuery];
          console.log("🔍 Searching Engine No by exact match:", searchQuery);
        }
      }
      else if (selectedType === "Agg No") {
        // Agreement Number ke liye exact match ya LIKE search
        if (searchQuery.length < 4) {
          setSearchError('Please enter at least 4 characters for agreement number');
          setSearchLoading(false);
          return;
        }
        // Agreement number ke liye exact match ya partial search
        sql = `SELECT * FROM full_vehicle_detail WHERE (vehicle_agreement_no = ? OR vehicle_agreement_no LIKE ?) AND vehicle_status = 'Active'`;
        params = [searchQuery, `%${searchQuery}%`];
        console.log("🔍 Searching Agreement No:", searchQuery);
      }
      else {
        console.log("⚠️ Unknown selectedType:", selectedType);
        setSearchLoading(false);
        return;
      }

      // Finance filter apply karo
      const easyList = normalizedotherFinanceList.map(f => f.toUpperCase().trim());
      if (rentAgencyId && rentAgencyId !== '0') {
        if (easyList.length > 0) {
          const placeholders = easyList.map(() => '?').join(',');
          sql += ` AND (data_type != 'mjs' OR UPPER(TRIM(vehicle_finance_name)) NOT IN (${placeholders}))`;
          params.push(...easyList);
        }
      }

      console.log("🧾 SQL QUERY:", sql.replace(/\s+/g, " ").trim());
      console.log("📊 Params:", params);

      const [results] = await db.executeSql(sql, params);

      const uniqueMap = new Map();
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        let key = '';

        if (selectedType === "Reg No") key = row.vehicle_registration_no;
        else if (selectedType === "Chassis No") key = row.vehicle_chassis_no;
        else if (selectedType === "Eng No") key = row.vehicle_engine_no;
        else if (selectedType === "Agg No") key = row.vehicle_agreement_no;

        if (key && !uniqueMap.has(key)) uniqueMap.set(key, row);
      }

      const uniqueRows = Array.from(uniqueMap.values());
      setSearchVehicle(uniqueRows);
      setSearchError(''); // Clear any previous errors

      // Agar exact match nahi mila aur Reg/Chassis/Engine ke liye >4/5 characters the, to try partial search
      if (uniqueRows.length === 0 && selectedType !== "Agg No") {
        if (selectedType === "Reg No" && cleanedQuery.length > 4) {
          // Try partial search for Reg No
          const partialSql = `SELECT * FROM full_vehicle_detail WHERE vehicle_registration_no LIKE ? AND vehicle_status = 'Active'`;
          const partialParams = [`%${searchQuery}%`];

          // Add finance filter
          let finalPartialSql = partialSql;
          if (rentAgencyId && rentAgencyId !== '0' && easyList.length > 0) {
            const placeholders = easyList.map(() => '?').join(',');
            finalPartialSql += ` AND (data_type != 'mjs' OR UPPER(TRIM(vehicle_finance_name)) NOT IN (${placeholders}))`;
            partialParams.push(...easyList);
          }

          const [partialResults] = await db.executeSql(finalPartialSql, partialParams);

          const partialMap = new Map();
          for (let i = 0; i < partialResults.rows.length; i++) {
            const row = partialResults.rows.item(i);
            const key = row.vehicle_registration_no;
            if (key && !partialMap.has(key)) partialMap.set(key, row);
          }

          const partialRows = Array.from(partialMap.values());
          if (partialRows.length > 0) {
            setSearchVehicle(partialRows);
            console.log("🔍 Found", partialRows.length, "vehicles by partial match");
          }
        }
        else if ((selectedType === "Chassis No" || selectedType === "Eng No") && cleanedQuery.length > 5) {
          // Try partial search for Chassis/Engine
          const fieldName = selectedType === "Chassis No" ? "vehicle_chassis_no" : "vehicle_engine_no";
          const partialSql = `SELECT * FROM full_vehicle_detail WHERE ${fieldName} LIKE ? AND vehicle_status = 'Active'`;
          const partialParams = [`%${searchQuery}%`];

          let finalPartialSql = partialSql;
          if (rentAgencyId && rentAgencyId !== '0' && easyList.length > 0) {
            const placeholders = easyList.map(() => '?').join(',');
            finalPartialSql += ` AND (data_type != 'mjs' OR UPPER(TRIM(vehicle_finance_name)) NOT IN (${placeholders}))`;
            partialParams.push(...easyList);
          }

          const [partialResults] = await db.executeSql(finalPartialSql, partialParams);

          const partialMap = new Map();
          for (let i = 0; i < partialResults.rows.length; i++) {
            const row = partialResults.rows.item(i);
            const key = row[fieldName];
            if (key && !partialMap.has(key)) partialMap.set(key, row);
          }

          const partialRows = Array.from(partialMap.values());
          if (partialRows.length > 0) {
            setSearchVehicle(partialRows);
            console.log("🔍 Found", partialRows.length, "vehicles by partial match");
          }
        }
      }
    } catch (err) {
      console.log("❌ handleLocalSearch error:", err);
      Alert.alert("Error", "Failed to search from database");
    } finally {
      setSearchLoading(false);
    }
  };

  const SearchVehicleApi = async () => {
    let isValid = true;

    // Validation based on search type
    if (!text.trim()) {
      setSearchError('Search No is required');
      isValid = false;
    } else if (selectedType === 'Reg No' && text.replace(/[^a-zA-Z0-9]/g, '').length < 4) {
      setSearchError('Please enter at least 4 characters for registration number');
      isValid = false;
    } else if ((selectedType === 'Chassis No' || selectedType === 'Eng No') && text.replace(/[^a-zA-Z0-9]/g, '').length < 5) {
      setSearchError('Please enter at least 5 characters for ' + selectedType);
      isValid = false;
    } else if (selectedType === 'Agg No' && text.trim().length < 4) {
      setSearchError('Please enter at least 4 characters for agreement number');
      isValid = false;
    } else {
      setSearchError('');
    }

    if (!selectedType) {
      settypeError('Type Is Required');
      isValid = false;
    } else {
      settypeError('');
    }

    if (!isValid) return;

    console.log('Searching for:', selectedType, text);
    await handleLocalSearch(text);
  };

  const handleTextChange = (newText) => {
    // Allow all characters
    setText(newText);
    setSearchError('');

    // Clear results when text is cleared
    if (newText.length === 0) {
      setSearchVehicle([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchError('');
    settypeError('');
    setSearchVehicle([]);
    setText('');
    await fetchPermissions();
    setRefreshing(false);
  };

  const openModal = item => {
    setSelectedHistory(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedHistory(null);
  };

  const renderItem = ({ item, index }) => (
    <View
      key={item.full_vehicle_id}
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
      <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, textAlign: 'center', color: 'black', fontFamily: 'Inter-Regular' }}>
          {index + 1}
        </Text>
      </View>
      <View style={{ width: '35%', justifyContent: 'center', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 12, textAlign: 'left', color: 'black', fontFamily: 'Inter-Regular' }}>
          {item.vehicle_customer_name}
        </Text>
      </View>
      <View style={{ width: '40%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, textAlign: 'center', color: 'black', fontFamily: 'Inter-Regular' }}>
          {item.vehicle_registration_no}
        </Text>
        <Text style={{ fontSize: 12, textAlign: 'center', color: 'black', fontFamily: 'Inter-Regular' }}>
          {item.vehicle_chassis_no}
        </Text>
      </View>
      <View style={{ width: '15%', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('IntimationScreen', {
              vehicleDetails: item,
            });
          }}
          style={{ width: '100%', justifyContent: 'center', flexDirection: 'row', height: 30, alignItems: 'center' }}
        >
          <AntDesign name="infocirlceo" size={20} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Get keyboard type based on selected type
  const getKeyboardType = () => {
    return 'default'; // Default keyboard for all types
  };

  // Get max length based on selected type
  const getMaxLength = () => {
    if (selectedType === 'Reg No') {
      return 20; // Allow full registration number like BR01-CH-8534
    } else if (selectedType === 'Chassis No' || selectedType === 'Eng No') {
      return 30; // Allow full chassis/engine number
    } else if (selectedType === 'Agg No') {
      return 50; // Allow agreement number
    }
    return 30;
  };

  // Get placeholder based on selected type
  const getPlaceholder = () => {
    if (selectedType === 'Reg No') {
      return 'Enter Reg No';
    } else if (selectedType === 'Chassis No') {
      return 'Enter Chassis No';
    } else if (selectedType === 'Eng No') {
      return 'Enter Engine No';
    } else if (selectedType === 'Agg No') {
      return 'Enter Agreement No';
    }
    return `Enter ${selectedType}`;
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
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" color="white" size={26} />
        </TouchableOpacity>

        <Text
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            fontFamily: 'Inter-Bold',
          }}>
          Search Vehicle
        </Text>
        {(userType === 'SuperAdmin' || !permissions.intimation || permissions.intimation.insert) && (
          <View
            style={{
              width: '15%',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              right: 6,
              top: 5,
              height: 50,
            }}>
            <TouchableOpacity onPress={() => navigation.navigate('CreateIntimation')}>
              <AntDesign name='plus' color='white' size={25} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: 10,
          paddingHorizontal: 10,
        }}>
        <TouchableOpacity
          style={{
            backgroundColor: colors.Brown,
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: colors.Brown,
            borderWidth: 1,
            width: '15%',
          }}
          onPress={toggleType}>
          <Ionicons name="swap-horizontal" size={20} color="white" />
        </TouchableOpacity>

        <View
          style={{
            width: '65%',
            borderRadius: 8,
            borderWidth: 1,
            height: 50,
            backgroundColor: 'white',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderColor: SearchError ? 'red' : colors.Brown,
          }}>
          <View style={{
            width: 30,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <MaterialIcons name='search' size={24} color='grey' />
          </View>
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              fontFamily: 'Inter-Regular',
              color: 'black',
              height: 50,
            }}
            ref={textInputRef}
            placeholder={getPlaceholder()}
            placeholderTextColor="grey"
            value={text}
            onChangeText={handleTextChange}
            maxLength={getMaxLength()}
            keyboardType={getKeyboardType()}
            autoCapitalize="characters"
            onSubmitEditing={SearchVehicleApi} // Enter press karne par search
          />
          {text ? (
            <TouchableOpacity
              onPress={() => {
                setText('');
                setSearchVehicle([]);
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

        <TouchableOpacity
          style={{
            backgroundColor: colors.Brown,
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            width: '15%',
          }}
          onPress={SearchVehicleApi}>
          <FontAwesome name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Error Messages */}
      <View style={{ width: '100%', flexDirection: 'row', paddingHorizontal: 10 }}>
        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
          {SearchError ? (
            <Text
              style={{
                color: 'red',
                fontFamily: 'Inter-Regular',
                textAlign: 'center',
                fontSize: 14,
                marginTop: 5,
              }}>
              {SearchError}
            </Text>
          ) : null}

          {/* Help text */}
          {selectedType === 'Reg No' && text && (
            <Text style={{ color: '#666', fontSize: 12, marginTop: 3, textAlign: 'center' }}>
              {text.replace(/[^a-zA-Z0-9]/g, '').length === 4 ? 'Searching by last 4 characters' : 'Searching by exact match'}
            </Text>
          )}
          {(selectedType === 'Chassis No' || selectedType === 'Eng No') && text && (
            <Text style={{ color: '#666', fontSize: 12, marginTop: 3, textAlign: 'center' }}>
              {text.replace(/[^a-zA-Z0-9]/g, '').length === 5 ? 'Searching by last 5 characters' : 'Searching by exact match'}
            </Text>
          )}
        </View>
      </View>

      {/* Results Header */}
      {SearchVehicle.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#ddd',
            padding: 7,
            borderRadius: 5,
            marginTop: 10,
            marginHorizontal: 10,
          }}
        >
          <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontFamily: 'Inter-Regular', fontSize: 14, color: 'black' }}>
              #
            </Text>
          </View>
          <View style={{ width: '35%', justifyContent: 'center', alignItems: 'flex-start' }}>
            <Text style={{ fontWeight: 'bold', fontFamily: 'Inter-Regular', fontSize: 14, color: 'black' }}>
              Customer Name
            </Text>
          </View>
          <View style={{ width: '40%', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontFamily: 'Inter-Regular', fontSize: 14, color: 'black' }}>
              RCNO / Chassis
            </Text>
          </View>
          <View style={{ width: '15%', justifyContent: 'center', alignItems: 'center' }} />
        </View>
      )}

      {/* Results List */}
      <ScrollView
        style={{ flex: 1, marginTop: 5 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9Bd35A', '#689F38']}
          />
        }>
        {SearchLoading ? (
          <View style={{ height: 600, justifyContent: 'center', alignItems: 'center', marginTop: 30 }}>
            <ActivityIndicator size="large" color={colors.Brown} />
          </View>
        ) : SearchVehicle.length == 0 ? (
          <View style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
            <Image source={vehicle} style={{ width: 70, height: 70, marginTop: 30 }} />
            <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 20 }}>
              {text ? 'No Vehicles Found' : 'Search for vehicles'}
            </Text>
            {text && (
              <Text style={{ fontFamily: 'Inter-Regular', color: '#666', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
                Searched for: {selectedType} - {text}
              </Text>
            )}
          </View>
        ) : (
          <>
            <FlatList
              data={SearchVehicle}
              keyExtractor={(item) => item.full_vehicle_id.toString()}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: keyboardVisible ? 340 : 80 }}
            />
            {/* <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter-Regular', color: '#666' }}>
                {SearchVehicle.length} vehicles found
              </Text>
              {text && (
                <Text style={{ fontFamily: 'Inter-Regular', color: '#666', fontSize: 12, marginTop: 5 }}>
                  Search type: {selectedType}
                  {selectedType === 'Reg No' && text.replace(/[^a-zA-Z0-9]/g, '').length === 4 && ' (by last 4)'}
                  {(selectedType === 'Chassis No' || selectedType === 'Eng No') && text.replace(/[^a-zA-Z0-9]/g, '').length === 5 && ' (by last 5)'}
                  {selectedType !== 'Agg No' && text.replace(/[^a-zA-Z0-9]/g, '').length > (selectedType === 'Reg No' ? 4 : 5) && ' (by exact/partial match)'}
                </Text>
              )}
            </View> */}
          </>
        )}
      </ScrollView>

      {/* Modal for Vehicle Details */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          activeOpacity={1}
          onPress={closeModal}>
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 15,
              width: '85%',
              maxHeight: '80%',
            }}
            onStartShouldSetResponder={() => true}
            onTouchEnd={e => e.stopPropagation()}>
            {selectedHistory && (
              <>
                <View style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <Text style={{ fontSize: 20, fontFamily: 'Inter-Medium', marginBottom: 20, color: 'black', textAlign: 'center' }}>
                    Search Vehicle Details
                  </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text style={{ fontWeight: 'bold', color: '#333', fontFamily: 'Inter-Medium' }}>
                      Customer Name:{' '}
                    </Text>
                    {selectedHistory.vehicle_customer_name}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text style={{ fontWeight: 'bold', color: '#333', fontFamily: 'Inter-Medium' }}>
                      Rc No:{' '}
                    </Text>
                    {selectedHistory.vehicle_registration_no}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text style={{ fontWeight: 'bold', color: '#333', fontFamily: 'Inter-Medium' }}>
                      Engine No:{' '}
                    </Text>
                    {selectedHistory.vehicle_engine_no}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text style={{ fontWeight: 'bold', color: '#333', fontFamily: 'Inter-Medium' }}>
                      Chassis No:{' '}
                    </Text>
                    {selectedHistory.vehicle_chassis_no}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text style={{ fontWeight: 'bold', color: '#333', fontFamily: 'Inter-Medium' }}>
                      Agreement No:{' '}
                    </Text>
                    {selectedHistory.vehicle_agreement_no || '-----'}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text style={{ fontWeight: 'bold', color: '#333', fontFamily: 'Inter-Medium' }}>
                      Entry Date:{' '}
                    </Text>
                    {selectedHistory.vehicle_entry_date}
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: 'Inter-Regular',
                      color: 'black',
                    }}>
                    <Text style={{ fontWeight: 'bold', color: '#333', fontFamily: 'Inter-Medium' }}>
                      Vehicle Status:{' '}
                    </Text>
                    <Text style={{ color: selectedHistory.vehicle_status ? 'green' : 'red', fontFamily: 'Inter-Regular' }}>
                      {selectedHistory.vehicle_status}
                    </Text>
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    backgroundColor: colors.Brown,
                    borderRadius: 10,
                    marginTop: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={closeModal}>
                  <Text style={{ color: 'white', fontFamily: 'Inter-Regular', fontSize: 16 }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default SearchVehicle;

const styles = StyleSheet.create({});