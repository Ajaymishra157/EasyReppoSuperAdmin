import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import colors from '../CommonFiles/Colors'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../CommonFiles/Constant';

const SubAdminAgencyWise = () => {
    const navigation = useNavigation();
    const [agencies, setAgencies] = useState([]);
    const Agency = require('../assets/images/company.png');

    const [loading, setLoading] = useState(false);
    const fetchAgencyList = async () => {
        setLoading(true);
        try {
            const response = await fetch(ENDPOINTS.Agency_List, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const result = await response.json();
            console.log("Agency List API Response:", result);

            if (result.code === 200 && Array.isArray(result.payload)) {

                setAgencies(result.payload);


            } else {
                setAgencies([]);

            }
        } catch (error) {
            console.error('Error fetching agency list:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAgencyList();
        }, [])
    )


    const renderItem = ({ item, index }) => {

        return (
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9f9f9',
                    borderRadius: 8,
                    padding: 4,
                    marginBottom: 8,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                    borderWidth: 0.5,
                    paddingVertical: 10,
                }}
                onPress={() => navigation.navigate('SubAdminSearchHistory', {
                    agencyId: item.agency_id,
                    agencyName: item.agency_name
                })}

            >

                <Text style={{ fontSize: 12, color: '#333', marginLeft: 10, fontFamily: 'Inter-Medium', textTransform: 'uppercase' }}>{item.agency_name || '--'}</Text>

            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            {/* Header */}
            <View style={{
                backgroundColor: colors.Brown || '#8B4513',
                paddingVertical: 15,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
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
                    fontWeight: 'bold'
                }}>
                    Agency List
                </Text>
            </View>
            {
                loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.Brown} />
                        <Text style={{ marginTop: 10, color: 'gray', fontFamily: 'Inter-Regular' }}>Loading Finance List...</Text>
                    </View>
                ) : agencies.length === 0 ? (
                    <View style={{ height: 700, justifyContent: 'center', alignItems: 'center' }}>
                        <Image source={Agency} style={{ width: 70, height: 70 }} />
                        <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                            No Agency Yet
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        keyboardShouldPersistTaps='handled'
                        data={agencies}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 10 }}
                    />

                )
            }
        </View>
    )
}

export default SubAdminAgencyWise

const styles = StyleSheet.create({})