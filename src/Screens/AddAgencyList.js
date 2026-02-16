import { Text, View, TextInput, TouchableOpacity, ScrollView, ToastAndroid, Keyboard } from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../CommonFiles/Colors'; // Optional, fallback added
import { ENDPOINTS } from '../CommonFiles/Constant';
import { useNavigation, useRoute } from '@react-navigation/native';

const AddAgencyList = () => {
    const route = useRoute();
    const { agencyData } = route.params || {};

    const navigation = useNavigation();
    const [agencyName, setAgencyName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        if (agencyData) {
            setAgencyName(agencyData.agency_name || '');
            setUsername(agencyData.agency_username || '');
            setPassword(agencyData.agency_password || '');
            setMobile(agencyData.agency_mobile || '');
            setEmail(agencyData.agency_email || '');
        }
    }, [agencyData]);

    const validate = () => {
        const newErrors = {};
        if (!agencyName.trim()) newErrors.agencyName = 'Agency Name is required';
        if (!username.trim()) newErrors.username = 'Username is required';
        if (!password.trim()) newErrors.password = 'Password is required';
        if (!mobile.trim()) newErrors.mobile = 'Mobile Number is required';
        else if (!/^\d{10}$/.test(mobile.trim())) newErrors.mobile = 'Mobile Number must be 10 digits';


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const payload = {
            agency_name: agencyName,
            agency_username: username,
            agency_password: password,
            agency_mobile: mobile,
            agency_email: email,
        };
        const endpoint = agencyData
            ? ENDPOINTS.Update_rent_agency  // Replace with actual update endpoint
            : ENDPOINTS.add_rent_agency;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...payload,
                    ...(agencyData ? { rent_agency_id: agencyData.agency_id } : {})  // include ID only if updating
                }),
            });

            const data = await response.json();

            if (data.code === 200) {
                ToastAndroid.show(
                    agencyData ? 'Agency updated successfully!' : 'Agency added successfully!',
                    ToastAndroid.SHORT
                );
                setAgencyName('');
                setUsername('');
                setPassword('');
                setMobile('');
                setEmail('');
                setErrors({});
                navigation.goBack();
            } else {
                ToastAndroid.show(data.message || 'Something went wrong!', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.error('API error:', error);
            ToastAndroid.show('Network error. Please try again.', ToastAndroid.SHORT);
        }
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
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={{
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
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>
                <Text style={{
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 'bold',
                    fontFamily: 'Inter-Bold',
                }}>
                    {agencyData ? 'Edit Agency' : 'Add Agency'}
                </Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: '#f5f5f5', flexGrow: 1, paddingBottom: keyboardVisible ? 340 : 30 }} keyboardShouldPersistTaps="handled">

                {/* Agency Name */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: agencyData ? 'grey' : '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Agency Name<Text style={{ color: 'red', fontFamily: 'Inter-Bold' }}>*</Text>
                </Text>
                <TextInput
                    value={agencyName}
                    onChangeText={setAgencyName}
                    placeholder="Enter Agency Name"
                    placeholderTextColor="#888"

                    editable={!agencyData}
                    style={{
                        backgroundColor: agencyData ? '#f2f2f2' : '#fff', // Light grey when disabled
                        borderWidth: 1,
                        borderColor: agencyData ? '#ddd' : '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: agencyData ? '#888' : '#000',
                        marginBottom: 8
                        , fontFamily: 'Inter-Regular'
                    }}
                />
                {errors.agencyName && <Text style={{ color: 'red', marginBottom: 8, fontFamily: 'Inter-Regular' }}>{errors.agencyName}</Text>}

                {/* Username */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Username <Text style={{ color: 'red', fontFamily: 'Inter-Bold' }}>*</Text>
                </Text>
                <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter Username"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8
                        , fontFamily: 'Inter-Medium'
                    }}
                />
                {errors.username && <Text style={{ color: 'red', marginBottom: 8, fontFamily: 'Inter-Regular' }}>{errors.username}</Text>}

                {/* Password */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Password <Text style={{ color: 'red', fontFamily: 'Inter-Bold' }}>*</Text>
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingRight: 10,
                        marginBottom: 8,
                    }}
                >
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter Password"
                        placeholderTextColor="#888"
                        secureTextEntry={!showPassword}
                        style={{
                            flex: 1,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            fontSize: 16,
                            color: '#000',
                            fontFamily: 'Inter-Medium'
                        }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
                        <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color="gray" />
                    </TouchableOpacity>
                </View>
                {errors.password && <Text style={{ color: 'red', marginBottom: 8, fontFamily: 'Inter-Regular' }}>{errors.password}</Text>}

                {/* Mobile Number */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Mobile Number <Text style={{ color: 'red', fontFamily: 'Inter-Bold' }}>*</Text>
                </Text>
                <TextInput
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="Enter Mobile Number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8, fontFamily: 'Inter-Medium'
                    }}
                />
                {errors.mobile && <Text style={{ color: 'red', marginBottom: 8, fontFamily: 'Inter-Regular' }}>{errors.mobile}</Text>}

                {/* Email */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Email
                </Text>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter Email"
                    keyboardType="email-address"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8, fontFamily: 'Inter-Medium'
                    }}
                />
                {/* {errors.email && <Text style={{ color: 'red', marginBottom: 8 }}>{errors.email}</Text>} */}

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    style={{
                        backgroundColor: colors.Brown || '#8B4513',
                        paddingVertical: 14,
                        borderRadius: 8,
                        alignItems: 'center',
                        marginTop: 10,
                    }}
                >
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', fontFamily: 'Inter-Regular' }}>{agencyData ? 'Update' : 'Submit'} </Text>
                </TouchableOpacity>
            </ScrollView>
        </View >
    );
};

export default AddAgencyList;
