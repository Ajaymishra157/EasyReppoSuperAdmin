import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,

  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../CommonFiles/Colors';
import { ENDPOINTS } from '../CommonFiles/Constant';
import { useNavigation } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
  const logo = require('../assets/images/logo.png');
  const navigation = useNavigation();
  const [Email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [Loading, setLoading] = useState(false);

  const [myDeviceId, setMyDeviceId] = useState(null);
  console.log('myDeviceId xxx', myDeviceId);

  const [showPassword, setShowPassword] = useState(false);

  const [EmailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Fetch the unique device ID
    DeviceInfo.getUniqueId()
      .then(uniqueId => {
        setMyDeviceId(uniqueId);
        console.log('Device ID:', uniqueId);
      })
      .catch(error => {
        console.error('Error fetching device ID:', error);
      });
  }, []);

  const handleLogin = async () => {
    let isValid = true;

    // Reset errors
    setEmailError('');
    setPasswordError('');
    setLoginError('');

    // Validation for Mobile
    if (!Email) {
      setEmailError('Please Enter Mobile No');
      isValid = false;
    }

    // Password validation (minimum 4 characters)
    if (password.length < 6) {
      setPasswordError('Password Must be 6 Character');
      isValid = false;
    }

    if (isValid) {
      setLoading(true);
      try {
        const response = await fetch(ENDPOINTS.LOGIN, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: Email,
            password: password,
            device_id: myDeviceId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to connect to the server');
        }

        const data = await response.json();
        console.log('Response:', data);

        // Check response status
        if (data.code == 200) {
          Toast.show({
            type: 'success',
            text1: 'Login Successfully',
            position: 'bottom',
            bottomOffset: 60,
            visibilityTime: 2000,
          });
          const staffId = data.payload.id;


          const Rent_Agency_Id = data.payload.rent_agency_id;

          await AsyncStorage.setItem('staff_id', staffId);

          await AsyncStorage.setItem('rent_agency_id', Rent_Agency_Id);

          await AsyncStorage.setItem('id', myDeviceId);

          navigation.reset({
            index: 0, // Reset the stack
            routes: [{ name: 'FirstScreen' }], // Navigate to HomeScreen
          });
        } else {
          setLoginError(data.message || 'Invalid credentials');
        }
      } catch (error) {
        console.error('Error:', error.message);
        setLoginError('Something went wrong. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',

        backgroundColor: 'white',
      }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', backgroundColor: 'white', paddingTop: 120, paddingBottom: 200 }}
        keyboardShouldPersistTaps='handled' >
        <View style={{ height: 200 }}>
          <Image
            source={logo}
            style={{
              height: 160,
              width: 160,
              resizeMode: 'contain',
            }}
          />
        </View>
        <View style={{ width: '100%', paddingHorizontal: 20 }}>
          {/* Email input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderColor: EmailError ? 'red' : '#d1d5db',
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              marginBottom: EmailError ? 0 : 7,
            }}>
            <Ionicons name="phone-portrait-outline" size={20} color="gray" />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 16,
                color: '#333',
                fontFamily: 'Inter-Regular',
              }}
              placeholder="Enter Mobile No"
              placeholderTextColor="grey"
              keyboardType="phone-pad"
              value={Email}
              onChangeText={setEmail}
              maxLength={10}
            />
          </View>

          {EmailError ? (
            <Text
              style={{
                color: 'red',
                fontSize: 14,
                marginBottom: 5,
                fontFamily: 'Inter-Regular',
              }}>
              {EmailError}
            </Text>
          ) : null}

          {/* Password Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderColor: passwordError ? 'red' : '#d1d5db',
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              marginBottom: passwordError ? 0 : 7,
              marginTop: 5,
            }}>
            <Ionicons name="lock-closed-outline" size={20} color="gray" />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 16,
                color: '#333',
                fontFamily: 'Inter-Regular',
              }}
              placeholder="Enter Password"
              placeholderTextColor="grey"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>

          {passwordError ? (
            <Text
              style={{
                color: 'red',
                fontSize: 14,
                marginBottom: 5,

                fontFamily: 'Inter-Regular',
              }}>
              {passwordError}
            </Text>
          ) : null}
          <TouchableOpacity
            style={{
              backgroundColor: colors.Brown,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 10,
              flexDirection: 'row',
              justifyContent: 'center',
              opacity: Loading ? 0.7 : 1,
            }}
            onPress={handleLogin}
            disabled={Loading}
          >
            {Loading && (
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ marginRight: 8 }}
              />
            )}

            <Text
              style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16,
                fontFamily: 'Inter-Regular',
              }}
            >
              {Loading ? 'Please wait...' : 'Login'}
            </Text>
          </TouchableOpacity>
          {loginError ? (
            <Text
              style={{
                color: 'red',
                fontSize: 14,
                marginBottom: 10,
                marginLeft: 15,
                fontFamily: 'Inter-Regular',
              }}>
              {loginError}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({});
