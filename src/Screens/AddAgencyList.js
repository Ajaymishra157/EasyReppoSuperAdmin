import { Text, View, TextInput, TouchableOpacity, ScrollView, Keyboard, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../CommonFiles/Colors'; // Optional, fallback added
import { ENDPOINTS } from '../CommonFiles/Constant';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const AddAgencyList = () => {
    const route = useRoute();
    const { agencyData } = route.params || {};
    const [loading, setLoading] = useState(false);

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
        if (!agencyName.trim()) newErrors.agencyName = 'Agency Name Is Required';
        if (!username.trim()) newErrors.username = 'Username Is Required';
        if (!password.trim()) newErrors.password = 'Password Is Required';
        if (!mobile.trim()) newErrors.mobile = 'Mobile Number Is Required';
        else if (!/^\d{10}$/.test(mobile.trim())) newErrors.mobile = 'Mobile Number must be 10 digits';


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;


        setLoading(true);

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
                Toast.show({
                    type: 'success',
                    text1: agencyData
                        ? 'Agency updated successfully!'
                        : 'Agency added successfully!',
                    position: 'bottom',
                    visibilityTime: 2000,
                });
                setAgencyName('');
                setUsername('');
                setPassword('');
                setMobile('');
                setEmail('');
                setErrors({});
                setTimeout(() => {
                    navigation.goBack();
                }, 500);
            } else {
                Toast.show({
                    type: 'error',
                    text1: data?.message || 'Something went wrong!',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            console.error('API error:', error);
            Toast.show({
                type: 'error',
                text1: 'Network error. Please try again.',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            });
        } finally {
            setLoading(false); // 👈 Stop Loader (Important)
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
                    onChangeText={(text) => {
                        setAgencyName(text);
                        if (errors.agencyName) {
                            setErrors(prev => ({ ...prev, agencyName: '' }));
                        }
                    }}
                    placeholder="Enter Agency Name"
                    placeholderTextColor="#888"

                    editable={!agencyData}
                    style={{
                        backgroundColor: agencyData ? '#f2f2f2' : '#fff', // Light grey when disabled
                        borderWidth: 1,
                        borderColor: errors.agencyName ? 'red' : '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: agencyData ? '#888' : '#000',
                        marginBottom: errors.agencyName ? 0 : 8
                        , fontFamily: 'Inter-Regular'
                    }}
                />
                {errors.agencyName && <Text style={{ color: 'red', marginBottom: 8, fontFamily: 'Inter-Regular' }}>{errors.agencyName}</Text>}

                {/* Username */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Username<Text style={{ color: 'red', fontFamily: 'Inter-Bold' }}>*</Text>
                </Text>
                <TextInput
                    value={username}
                    onChangeText={(text) => {
                        setUsername(text);
                        if (errors.username) {
                            setErrors(prev => ({ ...prev, username: '' }));
                        }
                    }}
                    placeholder="Enter Username"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: errors.username ? 'red' : '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: errors.username ? 0 : 8
                        , fontFamily: 'Inter-Medium'
                    }}
                />
                {errors.username && <Text style={{ color: 'red', marginBottom: 8, fontFamily: 'Inter-Regular' }}>{errors.username}</Text>}

                {/* Password */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Password<Text style={{ color: 'red', fontFamily: 'Inter-Bold' }}>*</Text>
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: errors.password ? 'red' : '#ccc',
                        borderRadius: 8,
                        paddingRight: 10,
                        marginBottom: errors.password ? 0 : 8,
                    }}
                >
                    <TextInput
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) {
                                setErrors(prev => ({ ...prev, password: '' }));
                            }
                        }}
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
                    Mobile Number<Text style={{ color: 'red', fontFamily: 'Inter-Bold' }}>*</Text>
                </Text>
                <TextInput
                    value={mobile}
                    onChangeText={(text) => {
                        setMobile(text);
                        if (errors.mobile) {
                            setErrors(prev => ({ ...prev, mobile: '' }));
                        }
                    }}
                    placeholder="Enter Mobile Number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: errors.mobile ? 'red' : '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: errors.mobile ? 0 : 8, fontFamily: 'Inter-Medium'
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
                    disabled={loading}
                    style={{
                        backgroundColor: colors.Brown || '#8B4513',
                        paddingVertical: 14,
                        borderRadius: 8,
                        alignItems: 'center',
                        marginTop: 10,
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', fontFamily: 'Inter-Regular' }}>{agencyData ? 'Update' : 'Submit'} </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View >
    );
};

export default AddAgencyList;
