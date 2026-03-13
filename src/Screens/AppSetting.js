import { StyleSheet, Text, View, TouchableOpacity, TextInput, Switch, Keyboard, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../CommonFiles/Colors';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ENDPOINTS } from '../CommonFiles/Constant';
import Toast from 'react-native-toast-message';

const AppSetting = () => {
    const navigation = useNavigation();
    const [isEnabled, setIsEnabled] = useState(false);
    const [startTime, setStartTime] = useState('00:00 AM');
    const [closingTime, setClosingTime] = useState('11:59 PM');
    const [appMessage, setAppMessage] = useState('');
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [appMessageError, setAppMessageError] = useState('');

    // Time picker states
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showClosingTimePicker, setShowClosingTimePicker] = useState(false);

    // Radio button states
    const [selectedOption, setSelectedOption] = useState('Permanent On');
    const [appSettings, setAppSettings] = useState(null);
    const [isAppAvailable, setIsAppAvailable] = useState(true);
    const [appStatusMessage, setAppStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Map API status to radio button values
    const statusMap = {
        'Permanent On': 'Permanent On',
        'Permanent Close': 'permanentClose',
        'Time Frame': 'timeBetween'
    };

    const reverseStatusMap = {
        'Permanent On': 'Permanent On',
        'permanentClose': 'Permanent Close',
        'timeBetween': 'Time Frame'
    };

    const fetchAppSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch(ENDPOINTS.app_setting_time, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (result.code === 200 && result.payload) {
                setAppSettings(result.payload);
                updateUIFromApiData(result.payload);
            } else {
                console.log('❌ Error fetching app settings:', result.message);
                Alert.alert('Error', 'Failed to fetch app settings');
            }
        } catch (error) {
            console.log('❌ Error fetching app settings:', error.message);
            Alert.alert('Error', 'Network error while fetching settings');
        } finally {
            setLoading(false);
        }
    };

    const updateUIFromApiData = (payload) => {
        // Set radio button based on app_status
        if (payload.app_status && statusMap[payload.app_status]) {
            setSelectedOption(statusMap[payload.app_status]);
        }

        // Set times if available
        if (payload.start_time) {
            setStartTime(formatTimeFromApi(payload.start_time));
        }
        if (payload.end_time) {
            setClosingTime(formatTimeFromApi(payload.end_time));
        }

        // Set app message
        if (payload.app_message) {
            setAppMessage(payload.app_message);
        }
    };

    // Convert API time format (HH:MM:SS) to display format (HH:MM AM/PM)
    const formatTimeFromApi = (timeString) => {
        if (!timeString) return '7:00 AM';

        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const minute = minutes || '00';

        if (hour === 0) {
            return `12:${minute} AM`;
        } else if (hour < 12) {
            return `${hour}:${minute} AM`;
        } else if (hour === 12) {
            return `12:${minute} PM`;
        } else {
            return `${hour - 12}:${minute} PM`;
        }
    };

    // Convert display time format to API time format (HH:MM:SS)
    const formatTimeForApi = (timeString) => {
        const [timePart, period] = timeString.split(' ');
        let [hours, minutes] = timePart.split(':');

        hours = parseInt(hours);
        minutes = minutes || '00';

        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    };


    const validateForm = () => {
        setAppMessageError('');

        // Check if app message is required and empty
        if ((selectedOption === 'permanentClose' || selectedOption === 'timeBetween') && !appMessage.trim()) {
            setAppMessageError('App message is required for this mode');
            return false;
        }

        return true;
    };

    const updateAppSettings = async () => {

        // Validate form first
        if (!validateForm()) {
            return;
        }
        try {
            setLoading(true);

            const payload = {
                // time_option: selectedOption === 'timeBetween' ? 'Time Period' : 'Fixed',
                app_start_time: selectedOption === 'timeBetween' ? formatTimeForApi(startTime) : '00:00:00',
                app_end_time: selectedOption === 'timeBetween' ? formatTimeForApi(closingTime) : '23:59:59',
                app_status: reverseStatusMap[selectedOption],
                app_message: appMessage
            };

            console.log('Updating with payload:', payload);

            const response = await fetch(ENDPOINTS.update_time_setting, {
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
                    text1: 'Settings updated successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });                // Refresh the settings after update
                fetchAppSettings();
            } else {
                console.log('❌ Error updating app settings:', result.message);
                Alert.alert('Error', result.message || 'Failed to update app settings');
            }
        } catch (error) {
            console.log('❌ Error updating app settings:', error.message);
            Alert.alert('Error', 'Network error while updating settings');
        } finally {
            setLoading(false);
        }
    };

    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    // Start Time Picker Handler
    const handleStartTimeChange = (event, selectedTime) => {
        setShowStartTimePicker(false);
        if (selectedTime) {
            let hours = selectedTime.getHours();
            const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';

            // Convert to 12-hour format
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12

            const formattedTime = `${hours}:${minutes} ${ampm}`;
            setStartTime(formattedTime);
        }
    };

    // Closing Time Picker Handler
    const handleClosingTimeChange = (event, selectedTime) => {
        setShowClosingTimePicker(false);
        if (selectedTime) {
            let hours = selectedTime.getHours();
            const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';

            // Convert to 12-hour format
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12

            const formattedTime = `${hours}:${minutes} ${ampm}`;
            setClosingTime(formattedTime);
        }
    };

    // Convert current time string to Date object for picker
    const getTimeFromString = (timeString) => {
        let hours, minutes;

        if (timeString.includes('AM') || timeString.includes('PM')) {
            // 12-hour format
            const [timePart, ampm] = timeString.split(' ');
            [hours, minutes] = timePart.split(':').map(Number);

            if (ampm === 'PM' && hours !== 12) {
                hours += 12;
            } else if (ampm === 'AM' && hours === 12) {
                hours = 0;
            }
        } else {
            // 24-hour format
            [hours, minutes] = timeString.split(':').map(Number);
        }

        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        return date;
    };

    // Radio button selection handler
    const handleRadioSelect = (option) => {
        setSelectedOption(option);
        setAppMessageError('');
    };

    // Handle app message change
    const handleAppMessageChange = (text) => {
        setAppMessage(text);
        // Clear error when user starts typing
        if (appMessageError) {
            setAppMessageError('');
        }
    };

    useEffect(() => {
        fetchAppSettings();
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

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            {/* Header */}
            <View
                style={{
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
                    onPress={() => {
                        navigation.goBack();
                    }}>
                    <Ionicons name="arrow-back" color="white" size={26} />
                </TouchableOpacity>
                <Text
                    style={{
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 'bold',
                        fontFamily: 'Inter-Bold',
                    }}>
                    App Settings
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: keyboardVisible ? 340 : 80 }} keyboardShouldPersistTaps='handled'>

                {/* App Status Section */}
                <View style={{
                    backgroundColor: 'white',
                    padding: 20,
                    borderRadius: 12,
                    marginBottom: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    borderWidth: 1,
                    borderColor: '#cccccc'
                }}>

                    {/* Radio Buttons */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{
                            fontFamily: 'Inter-Bold',
                            fontSize: 16,
                            color: '#333',
                            marginBottom: 15
                        }}>
                            App Status Mode
                        </Text>

                        {/* Always On Radio Button */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 3,
                                paddingVertical: 5
                            }}
                            onPress={() => handleRadioSelect('Permanent On')}
                        >
                            <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: colors.Brown,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12
                            }}>
                                {selectedOption === 'Permanent On' && (
                                    <View style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: colors.Brown
                                    }} />
                                )}
                            </View>
                            <Text style={{
                                fontFamily: 'Inter-Medium',
                                fontSize: 14,
                                color: '#333'
                            }}>
                                Permanent On (24 Hours)
                            </Text>
                        </TouchableOpacity>

                        {/* Permanent Close Radio Button */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 3,
                                paddingVertical: 5
                            }}
                            onPress={() => handleRadioSelect('permanentClose')}
                        >
                            <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: colors.Brown,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12
                            }}>
                                {selectedOption === 'permanentClose' && (
                                    <View style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: colors.Brown
                                    }} />
                                )}
                            </View>
                            <Text style={{
                                fontFamily: 'Inter-Medium',
                                fontSize: 14,
                                color: '#333'
                            }}>
                                Permanent Close
                            </Text>
                        </TouchableOpacity>

                        {/* Time Between Radio Button */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 3,
                                paddingVertical: 5
                            }}
                            onPress={() => handleRadioSelect('timeBetween')}
                        >
                            <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: colors.Brown,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12
                            }}>
                                {selectedOption === 'timeBetween' && (
                                    <View style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: colors.Brown
                                    }} />
                                )}
                            </View>
                            <Text style={{
                                fontFamily: 'Inter-Medium',
                                fontSize: 14,
                                color: '#333'
                            }}>
                                Time Between
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {selectedOption === 'timeBetween' && (
                        <View style={{ flexDirection: 'row', gap: 5 }}>
                            {/* Start Time */}
                            <View style={{ width: '50%' }}>
                                <Text style={{
                                    fontFamily: 'Inter-Medium',
                                    fontSize: 14,
                                    color: 'black',
                                    paddingVertical: 10
                                }}>
                                    Start time:
                                </Text>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: 8,
                                        padding: 12,
                                        marginBottom: 15,
                                        borderWidth: 1,
                                        borderColor: '#ddd',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: 14,
                                        color: 'black',
                                    }}
                                    onPress={() => setShowStartTimePicker(true)}
                                >
                                    <Text style={{
                                        fontFamily: 'Inter-Medium',
                                        fontSize: 14,
                                        color: '#333',
                                        marginRight: 10
                                    }}>
                                        {startTime}
                                    </Text>
                                    <View style={{ padding: 5 }}>
                                        <Ionicons name="timer-outline" size={20} color="black" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Closing Time */}
                            <View style={{ width: '50%' }}>
                                <Text style={{
                                    fontFamily: 'Inter-Medium',
                                    fontSize: 14,
                                    color: 'black',
                                    paddingVertical: 10
                                }}>
                                    Closing time:
                                </Text>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: 8,
                                        padding: 12,
                                        marginBottom: 15,
                                        borderWidth: 1,
                                        borderColor: '#ddd',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: 14,
                                        color: 'black',
                                    }}
                                    onPress={() => setShowClosingTimePicker(true)}
                                >
                                    <Text style={{
                                        fontFamily: 'Inter-Medium',
                                        fontSize: 14,
                                        color: '#333',
                                        marginRight: 10
                                    }}>
                                        {closingTime}
                                    </Text>
                                    <TouchableOpacity style={{ padding: 5 }}>
                                        <Ionicons name="timer-outline" size={20} color="black" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <Text style={{
                        fontFamily: 'Inter-Bold',
                        fontSize: 16,
                        color: '#333',
                        marginBottom: 10
                    }}>
                        App Message:
                    </Text>
                    <TextInput
                        style={{
                            fontFamily: 'Inter-Regular',
                            fontSize: 14,
                            borderWidth: 1,
                            borderColor: appMessageError ? 'red' : '#ddd',
                            borderRadius: 8,
                            padding: 12,
                            textAlignVertical: 'top',
                            minHeight: 100,
                            backgroundColor: '#fafafa',
                            color: 'black'
                        }}
                        value={appMessage}
                        onChangeText={handleAppMessageChange}
                        placeholder="Enter your message here..."
                        placeholderTextColor='#ccc'
                        multiline
                        numberOfLines={4}
                    />
                    {appMessageError ? (
                        <Text style={{
                            fontFamily: 'Inter-Regular',
                            fontSize: 12,
                            color: 'red',
                            marginTop: 5
                        }}>
                            {appMessageError}
                        </Text>
                    ) : null}
                </View>

                {/* Update Button */}
                <TouchableOpacity
                    style={{
                        backgroundColor: loading ? '#ccc' : colors.Brown,
                        paddingVertical: 15,
                        borderRadius: 10,
                        alignItems: 'center'
                    }}
                    onPress={updateAppSettings}
                    disabled={loading}
                >
                    <Text style={{
                        fontFamily: 'Inter-Bold',
                        fontSize: 16,
                        color: 'white'
                    }}>
                        {loading ? 'Updating...' : 'Update'}
                    </Text>
                </TouchableOpacity>

                {/* Time Pickers */}
                {showStartTimePicker && (
                    <DateTimePicker
                        value={getTimeFromString(startTime)}
                        mode="time"
                        display="spinner"
                        onChange={handleStartTimeChange}
                    />
                )}

                {showClosingTimePicker && (
                    <DateTimePicker
                        value={getTimeFromString(closingTime)}
                        mode="time"
                        display="spinner"
                        onChange={handleClosingTimeChange}
                    />
                )}
            </ScrollView>
        </View>
    )
}

export default AppSetting

const styles = StyleSheet.create({})