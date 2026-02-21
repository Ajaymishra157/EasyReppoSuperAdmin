import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../Screens/LoginScreen';
import HomeScreen from '../Screens/HomeScreen';
import AddStaffScreen from '../Screens/AddStaffScreen';
import SearchHistory from '../Screens/SearchHistory';
import AddScheduleScreen from '../Screens/AddScheduleScreen';
import StaffSchedule from '../Screens/StaffSchedule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../CommonFiles/Colors';
import DashboardScreen from '../Screens/DashboardScreen';
import SearchVehicle from '../Screens/SearchVehicle';
import IntimationScreen from '../Screens/IntimationScreen';
import SplashScreen from '../Screens/SplashScreen';
import ListingScreen from '../Screens/ListingScreen';
import AreaList from '../Screens/AreaList';
import AddArea from '../Screens/AddArea';

import CreateIntimation from '../Screens/CreateIntimation';
import informationScreen from '../Screens/informationScreen';
import AgencySelect from '../Screens/AgencySelect';
import FinanceList from '../Screens/FinanceList';
import FirstScreen from '../Screens/FirstScreen';
import Bottomtab from '../Component/Bottomtab';
import ProfileScreen from '../Screens/ProfileScreen';
import DetailScreen from '../Screens/DetailScreen';
import AddAgencyStaff from '../Screens/AddAgencyStaff';
import AgencyStaff from '../Screens/AgencyStaff';
import SubAdminInformation from '../Screens/SubAdminInformation';
import PermissionScreen from '../Screens/PermissionScreen';
import AddAgencyList from '../Screens/AddAgencyList';
import SingleVehicleUpload from '../Screens/SingleVehicleUpload';
import SingleVehicleList from '../Screens/SingleVehicleList';
import SubAdminAgencyWise from '../Screens/SubAdminAgencyWise';
import SubAdminSearchHistory from '../Screens/SubAdminSearchHistory';
import VehicleUploadList from '../Screens/VehicleUploadList';
import AgencyFinanceList from '../Screens/AgencyFinanceList';
import WebviewScreen from '../Screens/WebviewScreen';
import StaffVehicleRecords from '../Screens/StaffVehicleRecords';
import AppSetting from '../Screens/AppSetting';
import OtherApplist from '../Screens/OtherApplist';
import OtherAppfinancelist from '../Screens/OtherAppfinancelist';
import OtherAppMenu from '../Screens/OtherAppMenu';
import OtherAppSearchHistory from '../Screens/OtherAppSearchHistory';
import BlackListUser from '../Screens/BlackListUser';
import AddBlacklistUser from '../Screens/AddBlacklistUser';
import AgencyDashboard from '../Screens/AgencyDashboard';
import AgencyStaffSchedule from '../Screens/AgencyStaffSchedule';
import RentStaffFinanceList from '../Screens/RentStaffFinanceList';
import AgencyAddStaffSchedule from '../Screens/AgencyAddStaffSchedule';
import PDFViewerScreen from '../Screens/PDFViewerScreen';
import AgencyFiles from '../Screens/AgencyFiles';
import AllVehicleSearch from '../Screens/AllVehicleSearch';


const Stack = createNativeStackNavigator();


const RouteNavigation = () => {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const id = await AsyncStorage.getItem('id');
      console.log('id hai ya staffid', id);

      if (id) {
        setInitialRoute('FirstScreen');
      } else {
        setInitialRoute('LoginScreen');
      }
    };

    checkLoginStatus();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.Brown} />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddStaffScreen"
          component={AddStaffScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SearchHistory"
          component={SearchHistory}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="StaffSchedule"
          component={StaffSchedule}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddScheduleScreen"
          component={AddScheduleScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DashboardScreen"
          component={DashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SearchVehicle"
          component={SearchVehicle}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="IntimationScreen"
          component={IntimationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name='ListingScreen' component={ListingScreen} options={{ headerShown: false }} />

        <Stack.Screen name='AreaList' component={AreaList} options={{ headerShown: false }} />
        <Stack.Screen name='AddArea' component={AddArea} options={{ headerShown: false }} />
        <Stack.Screen name='PDFViewerScreen' component={PDFViewerScreen} options={{ headerShown: false }} />
        <Stack.Screen name='CreateIntimation' component={CreateIntimation} options={{ headerShown: false }} />
        <Stack.Screen name='informationScreen' component={informationScreen} options={{ headerShown: false }} />
        <Stack.Screen name='AgencySelect' component={AgencySelect} options={{ headerShown: false }} />
        <Stack.Screen name='FinanceList' component={FinanceList} options={{ headerShown: false }} />
        <Stack.Screen name='FirstScreen' component={FirstScreen} options={{ headerShown: false }} />
        <Stack.Screen name='Bottomtab' component={Bottomtab} options={{ headerShown: false }} />
        <Stack.Screen name='ProfileScreen' component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name='DetailScreen' component={DetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name='AgencyStaff' component={AgencyStaff} options={{ headerShown: false }} />
        <Stack.Screen name='AddAgencyStaff' component={AddAgencyStaff} options={{ headerShown: false }} />
        <Stack.Screen name='SubAdminInformation' component={SubAdminInformation} options={{ headerShown: false }} />
        <Stack.Screen name='PermissionScreen' component={PermissionScreen} options={{ headerShown: false }} />
        <Stack.Screen name='AddAgencyList' component={AddAgencyList} options={{ headerShown: false }} />
        <Stack.Screen name='SingleVehicleUpload' component={SingleVehicleUpload} options={{ headerShown: false }} />
        <Stack.Screen name='SingleVehicleList' component={SingleVehicleList} options={{ headerShown: false }} />
        <Stack.Screen name='SubAdminAgencyWise' component={SubAdminAgencyWise} options={{ headerShown: false }} />
        <Stack.Screen name='SubAdminSearchHistory' component={SubAdminSearchHistory} options={{ headerShown: false }} />
        <Stack.Screen name='VehicleUploadList' component={VehicleUploadList} options={{ headerShown: false }} />
        <Stack.Screen name='AgencyFinanceList' component={AgencyFinanceList} options={{ headerShown: false }} />
        <Stack.Screen name='WebviewScreen' component={WebviewScreen} options={{ headerShown: false }} />
        <Stack.Screen name='StaffVehicleRecords' component={StaffVehicleRecords} options={{ headerShown: false }} />
        <Stack.Screen name='AppSetting' component={AppSetting} options={{ headerShown: false }} />
        <Stack.Screen name='OtherApplist' component={OtherApplist} options={{ headerShown: false }} />
        <Stack.Screen name='OtherAppfinancelist' component={OtherAppfinancelist} options={{ headerShown: false }} />
        <Stack.Screen name='OtherAppMenu' component={OtherAppMenu} options={{ headerShown: false }} />
        <Stack.Screen name='OtherAppSearchHistory' component={OtherAppSearchHistory} options={{ headerShown: false }} />
        <Stack.Screen name='BlackListUser' component={BlackListUser} options={{ headerShown: false }} />
        <Stack.Screen name='AddBlacklistUser' component={AddBlacklistUser} options={{ headerShown: false }} />
        <Stack.Screen name='AgencyDashboard' component={AgencyDashboard} options={{ headerShown: false }} />
        <Stack.Screen name='AgencyStaffSchedule' component={AgencyStaffSchedule} options={{ headerShown: false }} />
        <Stack.Screen name='RentStaffFinanceList' component={RentStaffFinanceList} options={{ headerShown: false }} />
        <Stack.Screen name='AgencyAddStaffSchedule' component={AgencyAddStaffSchedule} options={{ headerShown: false }} />
        <Stack.Screen name='AgencyFiles' component={AgencyFiles} options={{ headerShown: false }} />
        <Stack.Screen name='AllVehicleSearch' component={AllVehicleSearch} options={{ headerShown: false }} />





      </Stack.Navigator>
    </NavigationContainer>
  );
};

// const RouteNavigation = () => {
//   return (
//     <NavigationContainer>
//       <Drawer.Navigator
//         drawerContent={props => <DrawerNavigation {...props} />}>
//         <Drawer.Screen
//           name="MainStack"
//           component={MainStack}
//           options={{headerShown: false}}
//         />
//       </Drawer.Navigator>
//     </NavigationContainer>
//   );
// };

export default RouteNavigation;

const styles = StyleSheet.create({});
