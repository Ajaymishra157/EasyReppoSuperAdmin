import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../CommonFiles/Colors';
import { ENDPOINTS } from '../CommonFiles/Constant';

const AddBlacklistUser = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const editData = route.params?.editData;

    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [remark, setRemark] = useState('');
    const [loading, setLoading] = useState(false);

    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // 🔴 Error States
    const [errors, setErrors] = useState({
        name: '',
        mobile: '',
        remark: '',
    });

    useEffect(() => {
        if (editData) {
            setName(editData.staff_name);
            setMobile(editData.staff_mobile);
            setRemark(editData.remark);
        }
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

    // 🔹 Validation
    const validate = () => {
        let valid = true;
        let tempErrors = { name: '', mobile: '', remark: '' };

        if (!name.trim()) {
            tempErrors.name = 'Name is required';
            valid = false;
        }
        if (!mobile.trim()) {
            tempErrors.mobile = 'Mobile number is required';
            valid = false;
        }


        setErrors(tempErrors);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);

        const api = editData
            ? ENDPOINTS.update_staff_blacklist
            : ENDPOINTS.add_staff_blacklist;

        try {
            await fetch(api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: editData?.staff_id,
                    staff_name: name,
                    staff_mobile: mobile,
                    remark: remark,
                }),
            });


            navigation.goBack();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false); // 🔹 Stop loading
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>

            {/* 🔹 HEADER */}
            <View
                style={{
                    backgroundColor: colors.Brown,
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <TouchableOpacity
                    style={{
                        width: '15%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        left: 6,
                        top: 5,
                        height: 40,
                    }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" color="white" size={24} />
                </TouchableOpacity>

                <Text
                    style={{
                        color: 'white',
                        fontSize: 18,
                        fontFamily: 'Inter-Bold',
                    }}
                >
                    {editData ? 'Update Blacklist Staff' : 'Add Blacklist Staff'}
                </Text>
            </View>

            {/* 🔹 FORM */}
            <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={{ padding: 15, paddingBottompaddingBottom: keyboardVisible ? 340 : 85, }}>

                {/* Name */}
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#000', marginBottom: 4 }}>
                    Name <Text style={{ color: 'red' }}>*</Text>
                </Text>
                <TextInput
                    placeholder="Enter name"
                    placeholderTextColor="#aaa"
                    value={name}
                    onChangeText={(text) => {
                        setName(text);
                        if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    style={[styles.input, errors.name && { borderColor: 'red' }]}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                {/* Mobile */}
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#000', marginBottom: 4, marginTop: 8 }}>
                    Mobile Number <Text style={{ color: 'red' }}>*</Text>
                </Text>
                <TextInput
                    placeholder="Enter mobile number"
                    placeholderTextColor="#aaa"
                    value={mobile}
                    keyboardType="number-pad"
                    onChangeText={(text) => {
                        setMobile(text);
                        if (errors.mobile) setErrors({ ...errors, mobile: '' });
                    }}
                    style={[styles.input, errors.mobile && { borderColor: 'red' }]}
                />
                {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

                {/* Remark */}
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#000', marginBottom: 4, marginTop: 8 }}>
                    Remark
                </Text>
                <TextInput
                    placeholder="Enter remark"
                    placeholderTextColor="#aaa"
                    value={remark}
                    multiline
                    onChangeText={(text) => {
                        setRemark(text);
                        if (errors.remark) setErrors({ ...errors, remark: '' });
                    }}
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }, errors.remark && { borderColor: 'red' }]}
                />

                {/* Submit */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading} // 🔹 Disable button while loading
                    style={{
                        backgroundColor: loading ? '#3c423aff' : colors.Brown,
                        padding: 12,
                        borderRadius: 8,
                        marginTop: 18,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={{ color: '#fff', textAlign: 'center', fontSize: 15, fontFamily: 'Inter-SemiBold' }}>
                            {editData ? 'Update' : 'Add'}
                        </Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View >
    );
}
export default AddBlacklistUser

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 5,
        fontSize: 13,
        color: '#000',
        fontFamily: 'Inter-Regular',
    },
    errorText: {
        color: 'red',
        fontSize: 11,
        marginBottom: 8,
        marginLeft: 3,
        fontFamily: 'Inter-Regular',
    },
});

