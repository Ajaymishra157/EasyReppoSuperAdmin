import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Alert,
    Keyboard,
    Modal,
    ActivityIndicator,
    Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../CommonFiles/Colors';
import { ENDPOINTS } from '../CommonFiles/Constant';
import Toast from 'react-native-toast-message';

const AddAgencyStaff = () => {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');           // Added email state
    const [address, setAddress] = useState('');       // Added address state
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [scheduleDays, setScheduleDays] = useState('1 day');
    const [loading, setLoading] = useState(false);

    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    console.log("selected type ye hai bhai ab", selectedType);

    const route = useRoute();
    const { agencyId, staff_id, staff_name, staff_email, staff_mobile, staff_password, staff_address, staff_type } = route.params || {};
    console.log("agency id and staff id", agencyId, staff_id, staff_type);


    // Error states
    const [nameError, setNameError] = useState('');
    const [mobileError, setMobileError] = useState('');
    const [EmailError, setEmailError] = useState('');
    const [SubmitError, setSubmitError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [staffTypeError, setStaffTypeError] = useState('');

    const [blacklistError, setBlacklistError] = useState('');
    const [blacklistModalVisible, setBlacklistModalVisible] = useState(false);

    const dropdownData = [
        { label: 'Sub Admin', value: 'subadmin' },
        { label: 'Field Staff', value: 'normal' },
    ];

    const toggleDropdown = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    const handleSelect = (item) => {
        setSelectedType(item);
        setIsDropdownVisible(false);
        // ✅ Select hote hi error clear
        if (staffTypeError) {
            setStaffTypeError('');
        }

    };


    const mapStaffType = (type) => {
        if (!type) return null;

        const lowerType = type.toLowerCase();

        if (lowerType === 'normal' || lowerType === 'field staff') {
            return 'normal';
        }

        if (lowerType === 'subadmin' || lowerType === 'admin staff' ||
            lowerType === 'admin') {
            return 'subadmin';
        }

        return null;
    };


    React.useEffect(() => {
        if (staff_id) {
            setName(staff_name || '');
            setEmail(staff_email || '');
            setMobile(staff_mobile || '');
            setPassword(staff_password || '');
            setAddress(staff_address || '');
            const mappedType = mapStaffType(staff_type);

            setSelectedType(
                dropdownData.find(item => item.value === mappedType) || null
            );
        }
    }, [staff_id]);


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

    const validate = () => {
        let valid = true;

        if (!name.trim()) {
            setNameError('Name is required');
            valid = false;
        } else {
            setNameError('');
        }

        if (!mobile.trim()) {
            setMobileError('Mobile Number is required');
            valid = false;
        } else if (!/^\d{10}$/.test(mobile.trim())) {
            setMobileError('Mobile Number must be 10 digits');
            valid = false;
        } else {
            setMobileError('');
        }

        if (!password.trim()) {
            setPasswordError('Password is required');
            valid = false;
        } else if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            valid = false;
        } else {
            setPasswordError('');
        }

        if (!selectedType) {
            setStaffTypeError('Please select a staff type');
            valid = false;
        } else {
            setStaffTypeError('');
        }

        return valid;
    };

    const handleSave = async (isAdmin) => {
        if (!validate()) return;
        setLoading(true);

        const payload = {
            rent_agency_id: agencyId,
            staff_name: name,
            staff_email: email,
            staff_mobile: mobile,
            staff_password: password,
            staff_address: address,
            staff_type: selectedType.value, // 'normal' or 'subadmin'
            schedule_type: scheduleDays, // '1 day', '1 month', '1 year'
            ...(staff_id ? { staff_id } : {})
        };

        console.log("add schedule ka payload", payload);

        // If it's update, include staff_id
        if (staff_id) {
            payload.staff_id = staff_id;
        }

        try {
            const endpoint = staff_id ? ENDPOINTS.update_agency_staff : ENDPOINTS.Add_Agency_Staff;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                Toast.show({
                    type: 'error',
                    text1: errorData.message || 'Failed to save staff.',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                }); return;
            }

            const data = await response.json();

            if (data.code === 200) {
                // ✅ New custom toast

                Toast.show({
                    type: 'success',
                    text1: staff_id
                        ? 'Staff updated successfully'
                        : 'Staff added successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
                // Delay navigation a little
                setTimeout(() => {
                    if (isAdmin) {
                        navigation.replace('PermissionScreen', {
                            staff_id: data.payload.staff_id,
                            staff_type: data.payload.staff_type,
                            staff_name: data.payload.staff_name
                        });
                    } else {
                        navigation.goBack();
                    }
                }, 500);
            } else if (data.code === 400 && data.message === 'This mobile number is blacklisted') {
                // 🔹 Blacklist case
                const payload = data.payload;
                setBlacklistError(`${payload.staff_name} has been blacklisted\nRemark: ${payload.remark}`);
                setBlacklistModalVisible(true);
            } else {
                console.log('Add failed:', data.message);
                // Check if the error is related to mobile number already existing
                if (data.message === 'Mobile number already exists') {
                    setMobileError('Mobile number already exists'); // Set the error message to state
                    // setSubmitError('');
                } else if (data.message === 'Email address already exists') {
                    setEmailError('Email address already exists');
                } else if (
                    data.message ===
                    'Mobile number already exists, Email address already exists'
                ) {
                    setSubmitError(
                        'Mobile number already exists, Email address already exists',
                    );
                }
            }


        } catch (error) {
            console.error('API error:', error);
            console.log('Network error, please try again later.');
        } finally {
            setLoading(false);   // ✅ Stop loader (IMPORTANT)
        }
    };

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
                    {staff_id ? 'Update' : 'Add'} Agency Staff
                </Text>
            </View>
            <ScrollView
                contentContainerStyle={{ padding: 20, backgroundColor: '#f7f7f7', flexGrow: 1, paddingBottom: keyboardVisible ? 340 : 30 }}
                keyboardShouldPersistTaps="handled"
            >


                {/* Name */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Name<Text style={{ color: 'red', fontFamily: 'Inter-Bold', }}>*</Text>
                </Text>
                <TextInput
                    value={name}
                    onChangeText={(text) => {
                        setName(text);

                        // Typing start hote hi error clear
                        if (nameError) {
                            setNameError('');
                        }
                    }}
                    placeholder="Enter Name"
                    placeholderTextColor="#999"
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        borderWidth: 1,
                        borderColor: nameError ? 'red' : '#ccc',
                        marginBottom: nameError ? 0 : 15,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                {nameError ? <Text style={{ color: 'red', marginBottom: 2, fontFamily: 'Inter-Regular', marginBottom: 5 }}>{nameError}</Text> : null}


                {/* Mobile */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 5, fontFamily: 'Inter-Medium' }}>
                    Mobile Number<Text style={{ color: 'red', fontFamily: 'Inter-Bold', }}>*</Text>
                </Text>
                <TextInput
                    value={mobile}
                    onChangeText={(text) => {
                        setMobile(text);
                        if (mobileError) {
                            setMobileError('');
                        }
                    }}
                    placeholder="Enter Mobile Number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholderTextColor="#999"
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        borderWidth: 1,
                        borderColor: mobileError ? 'red' : '#ccc',
                        marginBottom: mobileError ? 0 : 15,
                        fontFamily: 'Inter-Regular'

                    }}
                />

                {mobileError ? <Text style={{ color: 'red', marginBottom: 2, fontFamily: 'Inter-Regular', marginBottom: 5 }}>{mobileError}</Text> : null}

                {/* Email */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 5, fontFamily: 'Inter-Medium' }}>
                    Email
                </Text>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter Email"
                    keyboardType="email-address"
                    placeholderTextColor="#999"
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        borderWidth: 1,
                        borderColor: EmailError ? 'red' : '#ddd',
                        marginBottom: 15,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                {EmailError && (
                    <Text
                        style={{
                            color: 'red',
                            fontSize: 12,
                            marginBottom: 10,
                            fontFamily: 'Inter-Regular',
                        }}>
                        {EmailError}
                    </Text>
                )}


                {/* Password */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Password<Text style={{ color: 'red', fontFamily: 'Inter-Bold', }}>*</Text>
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: passwordError ? 'red' : '#ccc',
                        borderRadius: 8,
                        backgroundColor: '#fff',
                        marginBottom: passwordError ? 0 : 15,
                        paddingRight: 10,
                    }}
                >
                    <TextInput
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);

                            // Typing start hote hi error clear
                            if (passwordError) {
                                setPasswordError('');
                            }
                        }}
                        placeholder="Enter Password"
                        secureTextEntry={!showPassword}
                        placeholderTextColor="#999"
                        style={{
                            flex: 1,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            fontSize: 16,
                            color: '#000',
                            borderRadius: 8,
                            marginBottom: 0,
                            fontFamily: 'Inter-Regular'
                        }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
                        <Ionicons
                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={22}
                            color="gray"
                        />
                    </TouchableOpacity>
                </View>

                {passwordError ? <Text style={{ color: 'red', marginBottom: 2, fontFamily: 'Inter-Regular', marginBottom: 5 }}>{passwordError}</Text> : null}



                {/* Staff Type Dropdown */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Staff Type<Text style={{ color: 'red', fontFamily: 'Inter-Bold', }}>*</Text>
                </Text>
                <View style={{ position: 'relative', marginBottom: staffTypeError ? 0 : 5 }}>
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#fff',
                            padding: 12,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderColor: staffTypeError ? 'red' : '#ccc',
                            borderWidth: 1,
                        }}
                        onPress={toggleDropdown}
                    >
                        <Text style={{ fontSize: 16, color: selectedType ? '#000' : '#999', fontFamily: 'Inter-Regular' }}>
                            {selectedType ? selectedType.label : 'Select Type'}
                        </Text>
                        <Ionicons
                            name={isDropdownVisible ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="black"
                        />
                    </TouchableOpacity>

                    {isDropdownVisible && (
                        <View
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: '#fff',
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: '#ccc',
                                marginTop: 4,
                                zIndex: 10,
                                maxHeight: 120,
                            }}
                        >
                            <FlatList
                                data={dropdownData}
                                keyExtractor={(item) => item.value}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => handleSelect(item)}
                                        style={{
                                            paddingVertical: 12,
                                            paddingHorizontal: 15,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#eee',
                                        }}
                                    >
                                        <Text style={{ fontSize: 16, color: '#222' }}>{item.label}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}
                </View>

                {staffTypeError ? <Text style={{ color: 'red', marginBottom: 2, fontFamily: 'Inter-Regular', marginBottom: 5 }}>{staffTypeError}</Text> : null}


                {/* Address */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Address
                </Text>
                <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter Address"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        marginBottom: 15,
                        textAlignVertical: 'top',  // so that multiline input aligns text at top
                        fontFamily: 'Inter-Regular'
                    }}
                />




                {/* Schedule Days */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Schedule Days
                </Text>
                <View style={{ flexDirection: 'row', marginBottom: 25 }}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 30 }}
                        onPress={() => setScheduleDays('1 day')}
                    >
                        <View
                            style={{
                                height: 22,
                                width: 22,
                                borderRadius: 11,
                                borderWidth: 2,
                                borderColor: '#777',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {scheduleDays === '1 day' && (
                                <View
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: colors.Brown,
                                    }}
                                />
                            )}
                        </View>
                        <Text style={{ marginLeft: 8, fontSize: 16, color: '#222', fontFamily: 'Inter-Regular' }}>1 Day</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 30 }}
                        onPress={() => setScheduleDays('1 month')}
                    >
                        <View
                            style={{
                                height: 22,
                                width: 22,
                                borderRadius: 11,
                                borderWidth: 2,
                                borderColor: '#777',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {scheduleDays === '1 month' && (
                                <View
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: colors.Brown,
                                    }}
                                />
                            )}
                        </View>
                        <Text style={{ marginLeft: 8, fontSize: 16, color: '#222', fontFamily: 'Inter-Regular' }}>1 Month</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => setScheduleDays('1 year')}
                    >
                        <View
                            style={{
                                height: 22,
                                width: 22,
                                borderRadius: 11,
                                borderWidth: 2,
                                borderColor: '#777',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {scheduleDays === '1 year' && (
                                <View
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: colors.Brown,
                                    }}
                                />
                            )}
                        </View>
                        <Text style={{ marginLeft: 8, fontSize: 16, color: '#222', fontFamily: 'Inter-Regular' }}>1 Year</Text>
                    </TouchableOpacity>
                </View>




                {/* Save Button */}
                <TouchableOpacity
                    disabled={loading}
                    style={{
                        backgroundColor: loading ? '#a1887f' : colors.Brown,
                        paddingVertical: 14,
                        borderRadius: 8,
                        alignItems: 'center',
                        opacity: loading ? 0.8 : 1
                    }}
                    onPress={() => {
                        const isAdmin = selectedType?.value === 'subadmin';
                        handleSave(isAdmin); // It handles both goBack and replace
                    }}


                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{
                            color: '#fff',
                            fontSize: 18,
                            fontWeight: '600',
                            fontFamily: 'Inter-Regular'
                        }}>
                            {selectedType?.value === 'subadmin' ? 'Next' : 'Save'}
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    {SubmitError && (
                        <Text
                            style={{
                                color: 'red',
                                fontSize: 13,
                                marginTop: 10,
                                fontFamily: 'Inter-Regular',
                            }}>
                            {SubmitError}
                        </Text>
                    )}
                </View>
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={blacklistModalVisible}
                onRequestClose={() => setBlacklistModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    activeOpacity={1}
                    onPress={() => setBlacklistModalVisible(false)}
                >
                    <View
                        style={{
                            backgroundColor: 'white',
                            padding: 20,
                            borderRadius: 8,
                            width: '80%',
                            alignItems: 'center',
                        }}
                        onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
                        onTouchEnd={(e) => e.stopPropagation()}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                marginBottom: 10,
                                color: 'red',
                                fontFamily: 'Inter-Medium',
                                textAlign: 'center',
                            }}
                        >
                            Blacklist Staff
                        </Text>

                        <Text
                            style={{
                                fontSize: 14,
                                marginBottom: 10,
                                textAlign: 'center',
                                color: 'black',
                                fontFamily: 'Inter-Medium',
                            }}
                        >
                            {blacklistError.split('\n')[0] || 'Staff has been blacklisted'}
                        </Text>

                        <Text
                            style={{
                                fontSize: 14,
                                marginBottom: 20,
                                textAlign: 'center',
                                color: 'black',
                                fontFamily: 'Inter-Medium',
                            }}
                        >
                            {blacklistError.split('\n')[1] || 'Remark: ---'}
                        </Text>

                        <TouchableOpacity
                            style={{
                                backgroundColor: colors.Brown,
                                padding: 10,
                                borderRadius: 5,
                                width: '50%',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            onPress={() => setBlacklistModalVisible(false)}
                        >
                            <Text
                                style={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontFamily: 'Inter-Regular',
                                }}
                            >
                                CLOSE
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default AddAgencyStaff;
