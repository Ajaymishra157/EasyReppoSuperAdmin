import { Text, TouchableOpacity, View, FlatList, ToastAndroid, ActivityIndicator, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import CheckBox from '@react-native-community/checkbox';
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../CommonFiles/Constant';

const OtherAppfinancelist = () => {
  const Finance = require('../assets/images/budget.png');
  const check = require('../assets/images/check.png');
  const navigation = useNavigation();
  const route = useRoute();
  const { Id, Name } = route.params || {};

  const [financeList, setFinanceList] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveloading, setSaveloading] = useState(false);

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

  useEffect(() => {
    fetchFinanceList().then(() => {
      fetchmyFinanceList();
    });
  }, []);

  const fetchFinanceList = async () => {
    const rentAgencyId = 0;

    try {
      setLoading(true);
      const response = await fetch(ENDPOINTS.Finance_List(rentAgencyId));
      const result = await response.json();

      if (result.code == 200) {
        setFinanceList(result.payload);
      } else {
        // Show empty list or default dummy list
        setFinanceList([]); // or your static demo list
      }
    } catch (error) {
      console.log("Error fetching finance list:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchmyFinanceList = async () => {
    try {
      setLoading(true);

      const response = await fetch(ENDPOINTS.other_app_list_detail, {
        method: 'POST',          // or 'PUT', as required
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: Id
        })
      });
      const result = await response.json();
      if (response.ok && result.code == 200) {
        const item = result.payload[0];
        // Convert finance list into array
        const financeArr = item.finance_list.split(',').map(f => f.trim());
        const statusArr = item.status.split(',').map(s => s.trim());

        const finalList = financeArr.map((name, index) => ({
          finance_name: name,
          status: statusArr[index],
          staff_checkbox: statusArr[index].toLowerCase() == "active"
        }));
        setFinanceList(finalList);
      } else {
        setFinanceList([]);
      }
    } catch (error) {
      console.log("Error fetching finance list:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckbox = (index) => {
    const updatedList = [...financeList];
    updatedList[index].staff_checkbox = !updatedList[index].staff_checkbox;
    setFinanceList(updatedList);
  };

  const handleSave = async () => {
    try {
      setSaveloading(true);
      const financeNames = financeList.map(item => item.finance_name);

      // Prepare status array based on checkbox
      const statusArr = financeList.map(item =>
        item.staff_checkbox ? "active" : "deactive"
      );

      const body = {
        id: Id,
        finance_list: financeNames,
        status: statusArr
      };

      console.log("Sending this data:", body); // 👀 Debug check
      const response = await fetch(ENDPOINTS.update_finance_list, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (result.code == 200) {
        ToastAndroid.show("List updated successfully", ToastAndroid.SHORT);
        setIsEditMode(false);
      } else {
        ToastAndroid.show("Failed to update list", ToastAndroid.SHORT);
      }
    } catch (error) {
      console.log("Error updating list:", error.message);
    }
    setSaveloading(false);
  };


  const renderItem = ({ item, index }) => {
    // console.log(`Item ${index} - staff_checkbox:`, item.staff_checkbox);
    return (
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 8, padding: 4, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderWidth: 0.5 }}
        onPress={() => isEditMode && toggleCheckbox(index)}
        activeOpacity={isEditMode ? 0.6 : 1}
      >
        <CheckBox
          disabled={!isEditMode}
          value={item.staff_checkbox === true}
          onValueChange={() => toggleCheckbox(index)}
        />
        <Text style={{ fontSize: 12, color: '#333', marginLeft: 10, fontFamily: 'Inter-Regular' }}>{item.finance_name}</Text>
        {item.staff_checkbox && (
          <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row' }}>
            <Image
              source={check}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#F0F0F0' }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.Brown, paddingVertical: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity style={{ width: '15%', position: 'absolute', left: 6, top: 3, height: 50, justifyContent: 'center', alignItems: 'center', }} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" color="white" size={26} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 10, flexDirection: 'row', }}>
          <Text style={{ marginLeft: 35, color: 'white', fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter-Bold', flexWrap: 'wrap', textAlign: 'right', marginRight: 2, flexShrink: 1, width: '35%', textTransform: 'uppercase' }} numberOfLines={1} >
            {Name}
          </Text>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter-Bold', }}>- FINANCE LIST</Text>

        </View>
        {financeList.length !== 0 ? (
          <View style={{ width: '15%', justifyContent: 'center', alignItems: 'center', position: 'absolute', right: 6, top: 3, height: 50, }}>
            <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
              <Ionicons name={isEditMode ? 'close' : 'create-outline'} size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* List */}
      {
        loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.Brown} />
            <Text style={{ marginTop: 10, color: 'gray', fontFamily: 'Inter-Regular' }}>Loading Finance List...</Text>
          </View>
        ) : financeList.length === 0 ? (
          <View style={{ height: 700, justifyContent: 'center', alignItems: 'center' }}>
            <Image source={Finance} style={{ width: 70, height: 70 }} />
            <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
              No Finance Yet
            </Text>
          </View>
        ) : (
          <FlatList
            keyboardShouldPersistTaps='handled'
            data={financeList}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 10 }}
          />
        )
      }

      {/* Save Button */}
      {isEditMode && (
        saveloading ? (
          <ActivityIndicator size="large" color={colors.Brown} />
        ) : (
          <TouchableOpacity style={{ backgroundColor: colors.Brown, margin: 20, paddingVertical: 12, borderRadius: 8, alignItems: 'center', }} onPress={handleSave} >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter-Regular', }} >
              Update
            </Text>
          </TouchableOpacity>
        )
      )}

    </View>
  );
};

export default OtherAppfinancelist