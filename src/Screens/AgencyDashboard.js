import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import colors from '../CommonFiles/Colors'
import { useNavigation, useRoute } from '@react-navigation/native'
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons'

const AgencyDashboard = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { agencyId, agencyName, agencyDetail } = route.params || {};
    console.log("agency id dashboard", agencyId);
    return (
        <View style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
            <View
                style={{
                    backgroundColor: colors.Brown,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={{
                        width: 50,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        left: 6,
                        top: 5,
                    }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>

                {/* Title */}
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Bold',
                        textTransform: 'uppercase',
                        maxWidth: '80%', // Avoid overlapping
                        textAlign: 'center',
                    }}
                >
                    {agencyName}
                </Text>
            </View>


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
                        navigation.navigate('AgencyStaff', {
                            agencyId: agencyId,
                            agencyName: agencyName,
                            agencyDetail: agencyDetail
                        });
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
                        navigation.navigate('AgencyStaffSchedule', {
                            agencyId: agencyId,
                            agencyName: agencyName,
                            agencyDetail: agencyDetail
                        });
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

                {/* Third Box (File List) */}
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
                        navigation.navigate('AgencyFiles', {
                            agencyId,
                            agencyName,
                            agencyDetail
                        });
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
                            borderColor: '#4169E1' // Royal Blue
                        }}>
                        <FontAwesome name="folder-open" size={24} color="#4169E1" />
                    </View>

                    <Text
                        style={{
                            color: 'black',
                            fontSize: 12,
                            textAlign: 'center',
                            fontFamily: 'Inter-Medium',
                        }}>
                        File List
                    </Text>
                </TouchableOpacity>


            </View>
        </View>
    )
}

export default AgencyDashboard

const styles = StyleSheet.create({})