import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import colors from '../CommonFiles/Colors'
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Use FontAwesome for the icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import WelcomeShimmer from '../Component/WelcomeShimmer';
import Ionicons from 'react-native-vector-icons/Ionicons'

const OtherAppMenu = ({ navigation, route }) => {
    const { Id, Name } = route.params || {};
    const Agency = require('../assets/images/marketing.png');
    const History = require('../assets/images/search.png');

    return (
        <View style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
            {/* Header */}
            <View
                style={{
                    backgroundColor: colors.Brown,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Back Arrow */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                        position: 'absolute',
                        left: 15,
                        top: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        zIndex: 10,
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                {!Name ? (
                    <WelcomeShimmer />
                ) : (
                    <Text
                        style={{
                            color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter-Bold',
                            marginTop: 4,
                            maxWidth: '75%',   // 👈 90% se 75% kiya, taaki lamba naam arrow ke upar na chadhe
                            textAlign: 'center',
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {Name}
                    </Text>
                )}
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#f7f7f7', paddingBottom: 100 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        width: '100%',
                        marginTop: 10,
                        paddingHorizontal: 15,
                        justifyContent: 'space-between', // 👈 ye har row me 3-3 items ko evenly distribute karega
                        rowGap: 15,
                    }}
                >
                    {/* Box 1 - Staff */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 15,
                            width: '30%', // 👈 fixed 100 ki jagah percentage
                            height: 120,
                            padding: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                            elevation: 8,
                        }}
                        onPress={() => {
                            navigation.navigate('OtherAppStaff', { Id, Name });
                        }}
                    >
                        <View style={{ flex: 7, justifyContent: 'center', alignItems: 'center' }}>
                            <View
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#000080',
                                }}
                            >
                                <Ionicons name="people-outline" size={25} color="#000080" />
                            </View>
                        </View>
                        <View style={{ flex: 3, alignItems: 'center', paddingHorizontal: 5 }}>
                            <Text
                                style={{ color: 'black', fontSize: 12, textAlign: 'center', fontFamily: 'Inter-Medium' }}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                            >
                                Staff
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Box 3 - Search History */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 15,
                            width: '30%',
                            height: 120,
                            padding: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                            elevation: 8,
                        }}
                        onPress={() => {
                            navigation.navigate('OtherAppSearchHistory', { Id, Name });
                        }}
                    >
                        <View style={{ flex: 7, justifyContent: 'center', alignItems: 'center' }}>
                            <View
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#87CEEB',
                                }}
                            >
                                <Ionicons name="search-outline" size={25} color="#87CEEB" />
                            </View>
                        </View>
                        <View style={{ flex: 3, alignItems: 'center', paddingHorizontal: 5 }}>
                            <Text
                                style={{
                                    color: 'black',
                                    fontSize: 12,
                                    textAlign: 'center',
                                    fontFamily: 'Inter-Medium',
                                }}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                            >
                                Search History
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Box 2 - Finance Management */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 15,
                            width: '30%',
                            height: 120,
                            padding: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                            elevation: 8,
                        }}
                        onPress={() => {
                            navigation.navigate('OtherAppfinancelist', { Id, Name });
                        }}
                    >
                        <View style={{ flex: 7, justifyContent: 'center', alignItems: 'center' }}>
                            <View
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#2563EB',
                                }}
                            >
                                <Ionicons name="business-outline" size={25} color="#2563EB" />
                            </View>
                        </View>
                        <View style={{ flex: 3, alignItems: 'center', paddingHorizontal: 5 }}>
                            <Text
                                style={{
                                    color: 'black',
                                    fontSize: 12,
                                    textAlign: 'center',
                                    fontFamily: 'Inter-Medium',
                                }}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                            >
                                Finance Management
                            </Text>
                        </View>
                    </TouchableOpacity>



                    {/* Box 4 - Vehicle Data Files */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 15,
                            width: '30%',
                            height: 120,
                            padding: 5,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                            elevation: 8,
                        }}
                        onPress={() => {
                            navigation.navigate('OtherAppVehicleReport', { Id, Name });
                        }}
                    >
                        <View style={{ flex: 7, justifyContent: 'center', alignItems: 'center' }}>
                            <View
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#4169E1',
                                }}
                            >
                                <Ionicons name="folder-open-outline" size={24} color="#4169E1" />
                            </View>
                        </View>
                        <View style={{ flex: 3, alignItems: 'center', paddingHorizontal: 5 }}>
                            <Text
                                style={{ color: 'black', fontSize: 12, textAlign: 'center', fontFamily: 'Inter-Medium' }}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                            >
                                File List
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    )
}

export default OtherAppMenu