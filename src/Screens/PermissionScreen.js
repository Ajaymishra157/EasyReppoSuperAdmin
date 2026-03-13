import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import CheckBox from '@react-native-community/checkbox';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../CommonFiles/Colors';
import { ENDPOINTS } from '../CommonFiles/Constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const PermissionScreen = () => {
    const navigation = useNavigation();

    const route = useRoute();

    const { staff_id, staff_name, staff_type } = route.params || {};

    const [loading, setLoading] = useState(false);

    // All permission states
    const [staffAdd, setStaffAdd] = useState(false);
    const [staffDelete, setStaffDelete] = useState(false);
    const [staffUpdate, setStaffUpdate] = useState(false);
    const [staffView, setStaffView] = useState(false);
    const [staffAccountStatus, setstaffAccountStatus] = useState(false)
    const [FinanceList, setFinanceList] = useState(false);
    const [staffreset, setstaffReset] = useState(false);
    const [allStaffReset, setAllStaffReset] = useState(false);
    const [staffinternetStatus, setstaffInternetStatus] = useState(false);
    const [staffiCard, setStaffiCard] = useState(false);


    const [scheduleAdd, setScheduleAdd] = useState(false);
    const [scheduleDelete, setScheduleDelete] = useState(false);
    const [scheduleUpdate, setScheduleUpdate] = useState(false);
    const [scheduleView, setScheduleView] = useState(false);

    const [searchAdd, setSearchAdd] = useState(false);
    const [searchDelete, setSearchDelete] = useState(false);
    const [searchUpdate, setSearchUpdate] = useState(false);
    const [searchView, setSearchView] = useState(false);
    const [searchhistoryFilter, setsearchhistoryFilter] = useState(false);

    const [intimationAdd, setIntimationAdd] = useState(false);
    const [intimationDelete, setIntimationDelete] = useState(false);
    const [intimationUpdate, setIntimationUpdate] = useState(false);
    const [intimationView, setIntimationView] = useState(false);
    const [intimationprepostmail, setintimationPrepostmail] = useState(false);
    const [intimationwhatsapp, setintimationWhatsapp] = useState(false);

    const [psoAdd, setPsoAdd] = useState(false);
    const [psoDelete, setPsoDelete] = useState(false);
    const [psoUpdate, setPsoUpdate] = useState(false);
    const [psoView, setPsoView] = useState(false);
    const [psoPrePostDownload, setpsoPrePostDownload] = useState(false);
    const [psoFilter, setpsoFilter] = useState(false);


    const [areaAdd, setAreaAdd] = useState(false);
    const [areaDelete, setAreaDelete] = useState(false);
    const [areaUpdate, setAreaUpdate] = useState(false);
    const [areaView, setAreaView] = useState(false);
    const [areaLocation, setAreaLocation] = useState(false); // ✅ Extra location permission

    const [rentAdd, setRentAdd] = useState(false);
    const [rentDelete, setRentDelete] = useState(false);
    const [rentUpdate, setRentUpdate] = useState(false);
    const [rentView, setRentView] = useState(false);



    const [vehicleAdd, setVehicleAdd] = useState(false);
    const [vehicleUpdate, setVehicleUpdate] = useState(false);
    const [vehicleDelete, setVehicleDelete] = useState(false);


    const [subadminHistoryFilter, setSubadminHistoryFilter] = useState(false);

    const [blacklistAdd, setBlacklistAdd] = useState(false);
    const [blacklistDelete, setBlacklistDelete] = useState(false);
    const [blacklistUpdate, setBlacklistUpdate] = useState(false);




    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        try {
            // const staffId = await AsyncStorage.getItem('staff_id');
            // if (!staffId) return;

            const response = await fetch(ENDPOINTS.List_Staff_Permission, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ staff_id: staff_id }),
            });

            const result = await response.json();

            if (result.code === 200 && result.payload) {
                const permissionMap = {};

                result.payload.forEach(item => {
                    const name = item.menu_name;
                    const permissions = item.menu_permission.split(',').map(p => p.trim().toLowerCase());

                    if (!permissionMap[name]) permissionMap[name] = new Set();
                    permissions.forEach(p => permissionMap[name].add(p));
                });

                const updateStateFromPermission = (menuName, setterMap) => {
                    const perms = permissionMap[menuName] || new Set();

                    Object.keys(setterMap).forEach(key => {
                        setterMap[key](perms.has(key.toLowerCase()));
                    });
                };

                updateStateFromPermission('Staff', {
                    insert: setStaffAdd,
                    delete: setStaffDelete,
                    update: setStaffUpdate,
                    view: setStaffView,
                    accountstatus: setstaffAccountStatus,
                    financelist: setFinanceList,
                    internetstatus: setstaffInternetStatus,
                    staffreset: setstaffReset,
                    allstaffreset: setAllStaffReset,
                    icard: setStaffiCard,
                });

                updateStateFromPermission('Staff_Schedule', {
                    insert: setScheduleAdd,
                    delete: setScheduleDelete,
                    update: setScheduleUpdate,
                    view: setScheduleView,
                });

                updateStateFromPermission('Search_History', {
                    insert: setSearchAdd,
                    delete: setSearchDelete,
                    update: setSearchUpdate,
                    view: setSearchView,
                    searchfilter: setsearchhistoryFilter
                });

                updateStateFromPermission('Intimation', {
                    insert: setIntimationAdd,
                    delete: setIntimationDelete,
                    update: setIntimationUpdate,
                    view: setIntimationView,
                    prepostmail: setintimationPrepostmail,
                    whatsapp: setintimationWhatsapp,
                });

                updateStateFromPermission('PSO_List', {
                    insert: setPsoAdd,
                    delete: setPsoDelete,
                    update: setPsoUpdate,
                    view: setPsoView,
                    prepostdownload: setpsoPrePostDownload,
                    psofilter: setpsoFilter,
                });

                updateStateFromPermission('Area', {
                    insert: setAreaAdd,
                    delete: setAreaDelete,
                    update: setAreaUpdate,
                    view: setAreaView,
                    location: setAreaLocation,
                });

                updateStateFromPermission('Rent_Agency', {
                    insert: setRentAdd,
                    delete: setRentDelete,
                    update: setRentUpdate,
                    view: setRentView,
                });

                updateStateFromPermission('Vehicle_Upload', {
                    insert: setVehicleAdd,
                    update: setVehicleUpdate,
                    delete: setVehicleDelete,
                });

                updateStateFromPermission('Subadmin_History', {
                    searchfilter: setSubadminHistoryFilter,
                });

                updateStateFromPermission('Black_List_Staffs', {
                    insert: setBlacklistAdd,
                    delete: setBlacklistDelete,
                    update: setBlacklistUpdate,
                });


            } else {
                console.log('No permission data found');
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
        }
    };


    const anyPermissionSelected = () => {
        return [
            staffAdd, staffDelete, staffUpdate, staffView, staffAccountStatus, FinanceList, staffreset, staffinternetStatus, staffiCard,
            scheduleAdd, scheduleDelete, scheduleUpdate, scheduleView,
            searchAdd, searchDelete, searchUpdate, searchView, searchhistoryFilter,
            intimationAdd, intimationDelete, intimationUpdate, intimationView, intimationprepostmail, intimationwhatsapp,
            psoAdd, psoDelete, psoUpdate, psoView, psoPrePostDownload, psoFilter,
            areaAdd, areaDelete, areaUpdate, areaView, areaLocation,
            rentAdd, rentDelete, rentUpdate, rentView,
            vehicleAdd, vehicleUpdate, vehicleDelete,
            subadminHistoryFilter,
            blacklistAdd, blacklistDelete, blacklistUpdate,

        ].some(permission => permission === true);
    };


    const handleSave = async () => {

        if (loading) return;

        setLoading(true);
        try {
            // const staffId = await AsyncStorage.getItem('staff_id');

            // if (!staffId) {
            //     return;
            // }

            // Map frontend labels to backend permission keys
            const permissionMap = {
                "Add": "insert",
                "Delete": "Delete",
                "Update": "update",
                "View": "View",

                "Account Status": "Accountstatus",
                "Finance List": "financelist",
                "Internet Status": "internetstatus",
                "Single Staff Reset": "staffreset",
                "All Staff Reset": "allstaffreset",
                "PrePost Mail": "prepostmail",
                "Whatsapp": "whatsapp",
                "PrePost Download": "prepostdownload",
                "Pso Filter": "psofilter",
                "Search Filter": "searchFilter",
                "iCard": "icard",
                "Black List Add": "insert",
                "Black List Delete": "delete",
                "Black List Update": "update",


            };

            // Modules and their checkbox states
            const modules = [
                {
                    name: "Staff",
                    states: [staffAdd, staffDelete, staffUpdate, staffView, staffAccountStatus, FinanceList, staffinternetStatus, staffreset, allStaffReset, staffiCard],
                    labels: ["Add", "Delete", "Update", "View", "Account Status", "Finance List", "Internet Status", "Single Staff Reset", "All Staff Reset", "iCard"],
                },
                {
                    name: "Staff_Schedule",
                    states: [scheduleAdd, scheduleDelete, scheduleUpdate],
                    labels: ["Add", "Delete", "Update"],
                },

                {
                    name: "Intimation",
                    states: [intimationAdd, intimationDelete, intimationUpdate, intimationView, intimationprepostmail, intimationwhatsapp],
                    labels: ["Add", "Delete", "Update", "View", "PrePost Mail", "Whatsapp"],
                },
                {
                    name: "Area",
                    states: [areaAdd, areaDelete, areaUpdate, areaView, areaLocation],
                    labels: ["Add", "Delete", "Update", "View", "Location"],
                },
                {
                    name: "PSO_List",
                    states: [psoAdd, psoDelete, psoUpdate, psoView, psoPrePostDownload, psoFilter],
                    labels: ["Add", "Delete", "Update", "View", "PrePost Download", "Pso Filter"],
                },
                {
                    name: "Search_History",
                    states: [searchAdd, searchDelete, searchUpdate, searchView, searchhistoryFilter],
                    labels: ["Add", "Delete", "Update", "View", "Search Filter"],
                },

                {
                    name: "Rent_Agency",
                    states: [rentAdd, rentDelete, rentUpdate, rentView],
                    labels: ["Add", "Delete", "Update", "View"],
                },

                {
                    name: "Vehicle_Upload",
                    states: [vehicleAdd, vehicleUpdate, vehicleDelete],
                    labels: ["Add", "Update", "Delete"],
                },

                {
                    name: "Subadmin_History",
                    states: [subadminHistoryFilter],
                    labels: ["Search Filter"],
                },

                {
                    name: "Black_List_Staffs",
                    states: [blacklistAdd, blacklistDelete, blacklistUpdate],
                    labels: ["Add", "Delete", "Update"],
                },


            ];

            const menuNames = [];
            const menuPermissions = {};

            // Prepare payload data
            modules.forEach((module) => {
                const selectedPermissions = [];

                module.states.forEach((checked, index) => {
                    if (checked) {
                        const key = permissionMap[module.labels[index]];
                        if (key) selectedPermissions.push(key);
                    }
                });

                if (selectedPermissions.length > 0) {
                    menuNames.push(module.name);
                    menuPermissions[module.name] = selectedPermissions.join(',');
                }
            });

            const payload = {
                staff_id: staff_id,
                menu_names: menuNames,
                menu_permissions: menuPermissions,
            };

            console.log("✅ Sending Payload:", JSON.stringify(payload, null, 2));

            const response = await fetch(ENDPOINTS.Update_Staff_Permission, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.code === 200) {
                Toast.show({
                    type: 'success',
                    text1: '✅ Permissions saved successfully!',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });

                setTimeout(() => {
                    navigation.goBack();
                }, 500); // 500ms delay
            } else {
                Toast.show({
                    type: 'error',
                    text1: result.message || '❌ Failed to save permissions',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            console.error('❌ Save Permissions Error:', error);
            setLoading(false);
            Toast.show({
                type: 'error',
                text1: 'Something went wrong',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000,
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <View style={{ flex: 1, backgroundColor: '#f0f0f0' }}>
            {/* Header */}
            <View style={{
                backgroundColor: colors.Brown,
                paddingVertical: 15,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}>
                {/* Back Button */}
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        left: 10,
                        top: 12,
                        zIndex: 1,
                        padding: 5,

                    }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>

                {/* Title Text */}
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
                    {staff_name}-Right Access
                </Text>
            </View>

            {/* Scrollable permission blocks */}
            <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 100, }} keyboardShouldPersistTaps='handled'>
                {(staff_type === 'main' || staff_type === 'subadmin') ? (
                    <>
                        <PermissionBlock title="Staff" states={[staffAdd, staffDelete, staffUpdate, staffAccountStatus, FinanceList, staffinternetStatus, staffreset, allStaffReset, staffiCard]} setters={[setStaffAdd, setStaffDelete, setStaffUpdate, setstaffAccountStatus, setFinanceList, setstaffInternetStatus, setstaffReset, setAllStaffReset, setStaffiCard]} labels={["Add", "Delete", "Update", "Account Status", "Finance List", "Internet Status", "Single Staff Reset", "All Staff Reset", "iCard"]} />
                        <PermissionBlock title="Schedule" states={[scheduleAdd, scheduleDelete, scheduleUpdate]} setters={[setScheduleAdd, setScheduleDelete, setScheduleUpdate]} labels={["Add", "Delete", "Update"]} />
                        <PermissionBlock title="Search History" states={[searchhistoryFilter]} setters={[setsearchhistoryFilter]} labels={["Search Filter"]} />

                    </>

                ) : (
                    <>


                        <PermissionBlock title="Staff" states={[staffAdd, staffDelete, staffUpdate, staffAccountStatus, FinanceList, staffinternetStatus, staffreset, allStaffReset, staffiCard]} setters={[setStaffAdd, setStaffDelete, setStaffUpdate, setstaffAccountStatus, setFinanceList, setstaffInternetStatus, setstaffReset, setAllStaffReset, setStaffiCard]} labels={["Add", "Delete", "Update", "Account Status", "Finance List", "Internet Status", "Single Staff Reset", "All Staff Reset", "iCard"]} />
                        <PermissionBlock title="Schedule" states={[scheduleAdd, scheduleDelete, scheduleUpdate]} setters={[setScheduleAdd, setScheduleDelete, setScheduleUpdate]} labels={["Add", "Delete", "Update"]} />
                        <PermissionBlock title="Intimation" states={[intimationAdd, intimationprepostmail, intimationwhatsapp]} setters={[setIntimationAdd, setintimationPrepostmail, setintimationWhatsapp]} labels={["Add", "PrePost Download", "Whatsapp"]} />
                        <PermissionBlock title="Area" states={[areaAdd, areaDelete, areaUpdate,]} setters={[setAreaAdd, setAreaDelete, setAreaUpdate,]} labels={["Add", "Delete", "Update"]} />
                        <PermissionBlock title="PSO Confirm/Cancel List" states={[psoAdd, psoPrePostDownload, psoFilter]} setters={[setPsoAdd, setpsoPrePostDownload, setpsoFilter]} labels={["Add", "PrePost Download", "Pso Filter"]} />
                        <PermissionBlock title="Search History" states={[searchhistoryFilter]} setters={[setsearchhistoryFilter]} labels={["Search Filter"]} />
                        <PermissionBlock title="Rent Agency" states={[rentAdd, rentDelete, rentUpdate]} setters={[setRentAdd, setRentDelete, setRentUpdate]} labels={["Add", "Delete", "Update"]} />
                        <PermissionBlock
                            title="Vehicle Upload"
                            states={[vehicleAdd, vehicleUpdate, vehicleDelete]}
                            setters={[setVehicleAdd, setVehicleUpdate, setVehicleDelete]}
                            labels={["Add", "Update", "Delete"]}
                        />

                        <PermissionBlock
                            title="Subadmin History"
                            states={[subadminHistoryFilter]}
                            setters={[setSubadminHistoryFilter]}
                            labels={["Search Filter"]}
                        />
                        <PermissionBlock
                            title="Black List Staffs"
                            states={[blacklistAdd, blacklistDelete, blacklistUpdate]}
                            setters={[setBlacklistAdd, setBlacklistDelete, setBlacklistUpdate]}
                            labels={["Add", "Delete", "Update"]}
                        />



                    </>
                )}
            </ScrollView>

            {/* Sticky Save Button */}
            {/* {anyPermissionSelected() && ( */}
            <View style={{
                position: 'absolute',
                bottom: 10,
                left: 20,
                right: 20,
                backgroundColor: anyPermissionSelected() ? colors.Brown : 'grey',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
            }}>
                <TouchableOpacity onPress={handleSave}
                    disabled={!anyPermissionSelected() || loading} style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', }}>
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={{ color: 'white', fontSize: 18, fontFamily: 'Inter-SemiBold' }}>
                            Save
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
            {/* )} */}
        </View>
    );
};

// Permission block component
const PermissionBlock = ({ title, states, setters, labels }) => {
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        // Automatically update "Select All" if all checkboxes are manually selected/deselected
        const allChecked = states.every(state => state === true);
        if (selectAll !== allChecked) {
            setSelectAll(allChecked);
        }
    }, [states]);

    const handleSelectAllToggle = (value) => {
        setSelectAll(value);
        setters.forEach(setter => setter(value));
    };
    return (
        <View style={{ marginBottom: 20, borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 10, backgroundColor: 'white' }}>
            {/* Header with Select All */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                padding: 8
            }}>
                <Text style={{ fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#173161', marginBottom: 8 }}>
                    {title}
                </Text>
                <TouchableOpacity
                    onPress={() => handleSelectAllToggle(!selectAll)}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                    <CheckBox
                        value={selectAll}
                        onValueChange={handleSelectAllToggle}
                        tintColors={{ true: colors.Brown, false: 'gray' }}
                    />
                    <Text style={{
                        fontSize: 12,
                        fontFamily: 'Inter-Medium',
                        color: '#173161',
                        marginLeft: 4,
                    }}>Select All</Text>
                </TouchableOpacity>
            </View>
            <View style={{ borderWidth: 1, borderColor: '#e9e5e5ff' }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 5 }}>
                {labels.map((label, index) => (
                    <View key={label} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        width: '33.33%',


                        marginBottom: 10,
                        paddingRight: 5,
                    }}>
                        <CheckBox
                            value={states[index]}
                            onValueChange={(val) => setters[index](val)}
                            tintColors={{ true: colors.Brown, false: 'gray' }}
                        />
                        <Text style={{
                            color: '#173161', flexShrink: 1,
                            flexWrap: 'wrap', fontSize: 12, fontFamily: 'Inter-Medium'
                        }}>{label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};


export default PermissionScreen;
