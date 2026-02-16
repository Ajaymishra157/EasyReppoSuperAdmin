import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import colors from '../CommonFiles/Colors'
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Use FontAwesome for the icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import WelcomeShimmer from '../Component/WelcomeShimmer';

const OtherAppMenu = ({ navigation, route }) => {
    const { Id, Name } = route.params || {};
    const Agency = require('../assets/images/marketing.png');
    const History = require('../assets/images/search.png');

    return (
        <View style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
            <View style={{ backgroundColor: colors.Brown, paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter-Bold', }}> Easy Reppo </Text>
            </View>

            {!Name ? (
                <WelcomeShimmer />
            ) : (
                <View style={{ width: '100%', justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row', paddingLeft: 10, height: 30, }} >
                    <Text style={{ color: 'black', fontSize: 15, fontFamily: 'Inter-Bold', }}> Welcome</Text>
                    <Text style={{ color: 'black', fontSize: 15, fontFamily: 'Inter-Regular', marginLeft: 5 }}> :- {Name} </Text>
                </View>
            )}

            <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#f7f7f7', paddingBottom: 100 }}>
                <View style={{ flexDirection: 'row', width: '100%', marginTop: 10, paddingHorizontal: 15, gap:20 }}>

                    <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 15, width: 100, height: 120, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 8, }}
                        onPress={() => { navigation.navigate('OtherAppfinancelist', { Id, Name }); }}>
                        <View style={{ width: 50, height: 50, borderRadius: 30, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#4169E1' }}>
                            <Image source={Agency} style={{ width: 25, height: 25 }} />
                        </View>
                        <Text style={{ color: 'black', fontSize: 12, textAlign: 'center', fontFamily: 'Inter-Medium', }}>Finance Management</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 15, width: 100, height: 120, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 8, }}
                        onPress={() => {
                            navigation.navigate('OtherAppSearchHistory',{Id, Name});
                        }}>
                        <View style={{ width: 50, height: 50, borderRadius: 30, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#87CEEB' }}>
                            <FontAwesome name="search" size={25} color="#87CEEB" />
                        </View>
                        <Text style={{ color: 'black', fontSize: 12, textAlign: 'center', fontFamily: 'Inter-Medium', }}>Search History</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    )
}

export default OtherAppMenu