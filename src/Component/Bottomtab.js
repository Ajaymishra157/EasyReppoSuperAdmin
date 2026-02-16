import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, ToastAndroid } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'

import colors from '../CommonFiles/Colors';
import { useNavigation, useIsFocused, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../CommonFiles/Constant';

const { width } = Dimensions.get('window');

const Bottomtab = () => {
    const more = require('../assets/images/more.png')
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const route = useRoute();
    const [userType, setUsertype] = useState(null);
    const [activeTab, setActiveTab] = useState('inti');
    const [days, setDays] = useState('');
    console.log("total days", days);


    const AgencyStaffLogout = async (navigation, confirmLogout) => {
        try {
            const staffId = await AsyncStorage.getItem('staff_id');

            if (!staffId) {
                ToastAndroid.show('No staff ID found', ToastAndroid.SHORT);
                return;
            }

            const response = await fetch(ENDPOINTS.Staff_Agency_Logout, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId }),
            });

            const result = await response.json();

            if (result.code === 200) {
                const days = result.days;
                setDays(days);

                const staffStatus = result?.payload?.[0]?.staff_status;
                const userType = result?.payload?.[0]?.user_type;
                await AsyncStorage.setItem('user_type', userType);

                if (staffStatus === 'Deactive') {

                    confirmLogout(); // Trigger logout
                } else {

                }
            } else {
                // ToastAndroid.show(result.message || 'Failed to logout staff', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.log('Logout error:', error.message);
            ToastAndroid.show('Error logging out staff', ToastAndroid.SHORT);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            AgencyStaffLogout(navigation, confirmLogout);
        }, [])
    );

    const confirmLogout = async () => {
        await AsyncStorage.removeItem('id'); // User data clear karega
        await AsyncStorage.removeItem('selected_agency'); // User data clear karega
        navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }], // LoginScreen par redirect karega
        });

    };

    useEffect(() => {
        if (isFocused) {
            const currentRoute = route.name;

            // Preventing unnecessary state update
            if (currentRoute === 'FirstScreen' && activeTab !== 'Home') {
                setActiveTab('Home');
            } else if (currentRoute === 'DashboardScreen' && activeTab !== 'Dashboard') {
                setActiveTab('Dashboard');
            } else if (currentRoute === 'SearchVehicle' && activeTab !== 'Inti') {
                setActiveTab('Inti');
            } else if (currentRoute === 'ProfileScreen' && activeTab !== 'Prof') {
                setActiveTab('Prof');
            } else if (currentRoute === 'SettingScreen' && activeTab !== 'sett') {
                setActiveTab('sett');
            }
        }
    }, [isFocused, route]);



    useFocusEffect(
        React.useCallback(() => {
            let usertype = null;

            const fetchUsertype = async () => {
                usertype = await AsyncStorage.getItem('user_type');
                setUsertype(usertype);
            };

            fetchUsertype();
        }, []),
    );

    // Handle Tab Press Logic
    const handleTabPress = tabName => {
        if (activeTab !== tabName) { // Only update state if tab is different
            setActiveTab(tabName);
        }

        if (tabName === 'Home') {
            navigation.navigate('FirstScreen');
        } else if (tabName === 'Dashboard') {
            navigation.navigate('DashboardScreen');
        } else if (tabName === 'Prof') {
            navigation.navigate('ProfileScreen');
        } else if (tabName === 'sett') {
            navigation.navigate('SettingScreen');
        }

    };

    const getTabStyle = tabName => ({
        width: '50%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    });

    const getIconTintColor = tabName =>
        activeTab === tabName ? '#FFFFFF' : '#CCCCCC';

    const getTextColor = tabName =>
        activeTab === tabName ? '#FFFFFF' : '#CCCCCC';

    return (
        <View style={{ flexDirection: 'row', backgroundColor: colors.Brown, height: 60, borderTopWidth: 1, borderTopColor: '#ccc' }}>
            <TouchableOpacity
                style={getTabStyle('Home')}
                onPress={() => handleTabPress('Home')}
            >
                <Feather name="search" size={28} color={getIconTintColor('Home')} />

                <Text style={{ color: getTextColor('Home'), fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 3 }}>
                    Search
                </Text>
            </TouchableOpacity>


            {days !== 0 && (
                <TouchableOpacity
                    style={getTabStyle('Dashboard')}
                    onPress={() => handleTabPress('Dashboard')}
                >
                    <SimpleLineIcons name="settings" size={28} color={getIconTintColor('Dashboard')} />


                    <Text style={{ color: getTextColor('Dashboard'), fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 3 }}>
                        Setting
                    </Text>
                </TouchableOpacity>
            )}

            {/* {userType === 'normal' && (
                <TouchableOpacity
                    style={getTabStyle('sett')}
                    onPress={() => handleTabPress('sett')}
                >
                    <FontAwesome5 name="cog" size={28} color={getIconTintColor('sett')} />
                    <Text style={{ color: getTextColor('sett'), fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 3 }}>
                        Setting
                    </Text>
                </TouchableOpacity>
            )} */}
            <TouchableOpacity
                style={getTabStyle('Prof')}
                onPress={() => handleTabPress('Prof')}
            >
                <Image source={require('../assets/images/profile.png')} style={{ width: 28, height: 28, tintColor: getIconTintColor('Prof') }} />


                <Text style={{ color: getTextColor('Prof'), fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 3 }}>
                    Profile
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default Bottomtab;
