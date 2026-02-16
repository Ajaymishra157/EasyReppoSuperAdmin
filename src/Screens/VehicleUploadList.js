import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import colors from '../CommonFiles/Colors';

const VehicleUploadList = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { vehicleData } = route.params || {};
    console.log("VEHICLE DATA YE HAI", vehicleData);

    const Call = require('../assets/images/Call.png'); // Replace with your actual call icon path

    const handlePhoneCall = (phoneNumber) => {
        console.log("called", phoneNumber);

        let phone = phoneNumber.replace(/\D/g, ''); // Remove non-numeric characters
        if (phone) {
            Linking.openURL(`tel:${phone}`).catch(() => Alert('Failed to make a call'));
        }
    };
    const SecondPhoneCall = (phoneNumber) => {


        if (!phoneNumber || typeof phoneNumber !== 'string') {
            Alert.alert("Invalid Number", "No valid phone number provided.");
            return;
        }

        const phone = phoneNumber.replace(/\D/g, ''); // Remove non-digits

        if (phone.length > 0) {
            Linking.openURL(`tel:${phone}`)
                .catch(() => Alert.alert("Error", "Failed to make a call."));
        } else {
            Alert.alert("Invalid Number", "Phone number is empty or invalid.");
        }
    };

    const fields = [
        { label: 'MANAGER', value: vehicleData.vehicle_manager },
        { label: 'MONTH', value: vehicleData.vehicle_month },
        { label: 'BRANCH', value: vehicleData.vehicle_branch },
        { label: 'AGGREMENT NUMBER', value: vehicleData.vehicle_agreement_no },
        { label: 'FINANCE NAME', value: vehicleData.vehicle_finance_name },
        { label: 'APP ID', value: vehicleData.vehicle_app_id },
        { label: 'CUSTOMER NAME', value: vehicleData.vehicle_customer_name },
        { label: 'PRODUCT', value: vehicleData.vehicle_product },
        { label: 'BUCKET', value: vehicleData.vehicle_bucket },
        { label: 'EMI', value: vehicleData.vehicle_emi },
        { label: 'PRINCIPLE OUTSTANDING', value: vehicleData.vehicle_principle_outstanding },
        { label: 'TOTAL OUTSTANDING', value: vehicleData.vehicle_total_outstanding },
        { label: 'RC NUMBER', value: vehicleData.vehicle_registration_no },
        { label: 'CHASSIS NUMBER', value: vehicleData.vehicle_chassis_no },
        { label: 'ENGINE NUMBER', value: vehicleData.vehicle_engine_no },
        { label: 'REPO FOS', value: vehicleData.vehicle_repo_fos },
        { label: 'FIELD FOS', value: vehicleData.vehicle_fild_fos },
    ];
    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            {/* Header Section */}
            <View
                style={{
                    backgroundColor: colors.Brown,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                }}>
                <TouchableOpacity
                    style={{ position: 'absolute', top: 15, left: 15 }}
                    onPress={() => {
                        navigation.goBack();
                    }}>
                    <Entypo name="cross" size={30} color="white" />
                </TouchableOpacity>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text
                        style={{
                            color: 'white',
                            fontSize: 20,
                            fontWeight: 'bold',
                            fontFamily: 'Inter-Bold',
                        }}>
                        {vehicleData.vehicle_registration_no}
                    </Text>
                </View>



            </View>


            <ScrollView style={{ flex: 1, padding: 10, backgroundColor: '#fff' }} keyboardShouldPersistTaps='handled' contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#ddd',

                    backgroundColor: '#fff',
                }}>
                    {fields.map((item, index) => (
                        <View
                            key={index}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                borderBottomWidth: index !== fields.length - 1 ? 0.5 : 0,
                                borderColor: '#ccc',
                                paddingVertical: 6,
                                paddingHorizontal: 10,
                            }}
                        >
                            <View style={{
                                width: '45%',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                            }}>
                                <Text style={{
                                    fontSize: 12,
                                    fontFamily: 'Inter-Regular',
                                    color: 'black',
                                    textTransform: 'uppercase',
                                }}>
                                    {item.label}
                                </Text>
                            </View>

                            <View style={{
                                width: '55%',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                            }}>
                                <TouchableOpacity
                                    onPress={() => item.label === 'MANAGER' && item.value ? handlePhoneCall(item.value) : null}
                                    activeOpacity={item.label === 'MANAGER' ? 0.6 : 1}
                                >
                                    <Text style={{
                                        fontSize: 12,
                                        fontFamily: 'Inter-Bold',
                                        color: 'black',
                                        flexWrap: 'wrap',
                                        lineHeight: 18,
                                    }}>
                                        {item.value || '--'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Finance Contact Block */}
                <View style={{
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: '#ddd',

                    backgroundColor: '#fff',
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                        borderBottomWidth: 0.5,
                        borderColor: '#ccc',
                    }}>
                        <View style={{ width: '50%', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 10,
                                fontFamily: 'Inter-Regular',
                                color: 'black'
                            }}>
                                FINANCE CONTACT PERSON NAME
                            </Text>
                        </View>
                        <View style={{ width: '50%', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 10,
                                fontFamily: 'Inter-Regular',
                                color: 'black'
                            }}>
                                FINANCE CONTACT NUMBER
                            </Text>
                        </View>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 10,
                    }}>
                        <View style={{ width: '50%', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 11,
                                fontFamily: 'Inter-Bold',
                                color: 'black'
                            }}>
                                {vehicleData.agency_person_name || '---'}
                            </Text>
                        </View>
                        <View style={{
                            width: '50%',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 10
                        }}>
                            <Image source={Call} style={{ width: 20, height: 20, marginRight: 6 }} />
                            <TouchableOpacity onPress={() => SecondPhoneCall(vehicleData.agency_contact_number)}>
                                <Text style={{
                                    fontSize: 11,
                                    fontFamily: 'Inter-Regular',
                                    color: 'blue',
                                }}>
                                    {vehicleData.agency_contact_number || '---'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>



        </View>
    )
}

export default VehicleUploadList

const styles = StyleSheet.create({})