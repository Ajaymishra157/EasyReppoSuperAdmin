import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ToastAndroid,
    Keyboard,
    FlatList
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../CommonFiles/Colors';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FinanceList from './FinanceList';
import { ENDPOINTS } from '../CommonFiles/Constant';

const SingleVehicleUpload = () => {
    const navigation = useNavigation();

    const route = useRoute();

    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const [manager, setManager] = useState('');
    const [product, setProduct] = useState('');
    const [month, setMonth] = useState('');
    const [agreementNo, setAgreementNo] = useState('');
    const [appId, setAppId] = useState('');
    const [totalOutstanding, setTotalOutstanding] = useState('');
    const [rcNumber, setRcNumber] = useState('');
    const [repoFos, setRepoFos] = useState('');
    const [fieldFos, setFieldFos] = useState('');
    const [finance, setFinance] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [principleOutstanding, setPrincipleOutstanding] = useState('');
    const [branch, setBranch] = useState('');
    const [bucket, setBucket] = useState('');
    const [emi, setEmi] = useState('');
    const [chassisNo, setChassisNo] = useState('');
    const [EngineNo, setEngineNo] = useState('');

    const [selectedType, setSelectedType] = useState(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [filteredData, setFilteredData] = useState([]);
    const [financeList, setFinanceList] = useState([]);


    const handleSearch = (query) => {
        setSearchQuery(query);
        const filtered = financeList.filter(item =>
            item.finance_name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredData(filtered);
    };

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);


    useEffect(() => {

        if (route.params?.vehicleData.full_vehicle_id) {
            const vehicle = route.params.vehicleData;

            setManager(vehicle.vehicle_manager || '');
            setProduct(vehicle.vehicle_product || '');
            setMonth(vehicle.vehicle_month || '');
            setAgreementNo(vehicle.vehicle_agreement_no || '');
            setAppId(vehicle.vehicle_app_id || '');
            setTotalOutstanding(vehicle.vehicle_total_outstanding || '');
            setRcNumber(vehicle.vehicle_registration_no || '');
            setRepoFos(vehicle.vehicle_repo_fos || '');
            setFieldFos(vehicle.vehicle_fild_fos || '');
            setSelectedType(vehicle.vehicle_finance_name || null);
            setCustomerName(vehicle.vehicle_customer_name || '');
            setPrincipleOutstanding(vehicle.vehicle_principle_outstanding || '');
            setBranch(vehicle.vehicle_branch || '');
            setBucket(vehicle.vehicle_bucket || '');
            setEmi(vehicle.vehicle_emi || '');
            setChassisNo(vehicle.vehicle_chassis_no || '');
            setEngineNo(vehicle.vehicle_engine_no || '');
        }
    }, [route.params?.vehicleData.full_vehicle_id]);

    // const validate = () => {
    //     const newErrors = {};
    //     if (!manager) newErrors.manager = 'Manager is required';
    //     if (!product) newErrors.product = 'Product is required';
    //     if (!month) newErrors.month = 'Month is required';
    //     if (!agreementNo) newErrors.agreementNo = 'Agreement No is required';
    //     if (!appId) newErrors.appId = 'App ID is required';
    //     if (!totalOutstanding) newErrors.totalOutstanding = 'Total Outstanding is required';
    //     if (!rcNumber) newErrors.rcNumber = 'RC Number is required';
    //     if (!repoFos) newErrors.repoFos = 'Repo FOS is required';
    //     if (!fieldFos) newErrors.fieldFos = 'Field FOS is required';
    //     if (!finance) newErrors.finance = 'Finance is required';
    //     if (!customerName) newErrors.customerName = 'Customer Name is required';
    //     if (!principleOutstanding) newErrors.principleOutstanding = 'Principle Outstanding is required';
    //     if (!branch) newErrors.branch = 'Branch is required';
    //     if (!bucket) newErrors.bucket = 'Bucket is required';
    //     if (!emi) newErrors.emi = 'EMI is required';
    //     if (!chassisNo) newErrors.chassisEngineNo = 'Chassis No is required';
    //     if (!EngineNo) newErrors.EngineNo = 'Engine No  is required';

    //     setErrors(newErrors);
    //     return Object.keys(newErrors).length === 0;
    // };

    const validate = () => {
        const newErrors = {};
        if (!selectedType) {
            newErrors.finance = 'Finance is required';

        }
        if (!rcNumber) {
            newErrors.rcNumber = 'RC Number is required';

        }


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };



    const handleSubmit = async () => {

        if (!validate()) return;

        try {
            const payload = {
                finance_name: selectedType,
                month: month,
                manager: manager,
                branch: branch,
                agreement_no: agreementNo,
                app_id: appId,
                customer_name: customerName,
                bucket: bucket,
                emi: emi,
                principle_out: principleOutstanding, // changed key
                total_out: totalOutstanding, // changed key
                product: product,
                fild_fos: fieldFos, // note the spelling "fild_fos"
                reg_no: rcNumber,
                engine_no: EngineNo,
                chassis_no: chassisNo,
                repo_fos: repoFos,
            };

            // If updating, add full_vehicle_id to payload
            if (route.params?.vehicleData.full_vehicle_id) {
                payload.full_vehicle_id = route.params.vehicleData.full_vehicle_id;
            }


            // Log payload to console
            console.log('Payload:', payload);


            const apiUrl = route.params?.vehicleData.full_vehicle_id ? ENDPOINTS.update_vehicle_details : ENDPOINTS.add_vehicle_details;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',

                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.code == 200) {
                ToastAndroid.show(
                    route.params?.vehicleData.full_vehicle_id ? 'Vehicle Updated Successfully!' : 'Vehicle Uploaded Successfully!',
                    ToastAndroid.SHORT
                );
                // Reset form or navigate back etc
                navigation.goBack();
            } else {
                ToastAndroid.show(result.message || 'Upload failed', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.log('Upload error:', error.message);
            ToastAndroid.show('Error uploading vehicle', ToastAndroid.SHORT);
        }
    };


    useEffect(() => {
        fetchFinanceList();
    }, []);

    const fetchFinanceList = async () => {

        let rentAgencyId = 0;
        let staff_id = 0;

        try {

            const response = await fetch(ENDPOINTS.Finance_List(rentAgencyId, staff_id));
            const result = await response.json();


            if (result.code === 200 && Array.isArray(result.payload)) {

                setFinanceList(result.payload);
                setFilteredData(result.payload)
            } else {
                setFinanceList([]);
                ToastAndroid.show("No finance data found", ToastAndroid.SHORT);
            }
        } catch (error) {
            console.log("Finance list fetch error:", error.message);
        } finally {

        }
    };

    const renderItem2 = ({ item }) => (
        <TouchableOpacity
            onPress={() => {
                setSelectedType(item.finance_name);
                setIsDropdownVisible(false);
            }}
            style={{
                padding: 10,
                borderBottomWidth: 1,
                borderColor: '#eee'
            }}>
            <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>{item.finance_name}</Text>
        </TouchableOpacity>
    );

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
                    Vehicle Upload
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={{
                    padding: 20,
                    backgroundColor: '#f5f5f5',
                    flexGrow: 1,
                    paddingBottom: keyboardVisible ? 300 : 30,
                }}
                keyboardShouldPersistTaps="handled"
            >


                <Text style={{ fontSize: 14, color: 'black', marginBottom: 5 }}>Finance List <Text style={{ color: 'red', fontFamily: 'Inter-Bold' }}>*</Text> </Text>
                <View style={{ marginBottom: 15 }}>
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            padding: 12,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderColor: '#ddd',
                            borderWidth: 1,
                        }}
                        onPress={() => setIsDropdownVisible(!isDropdownVisible)}>
                        <Text style={{
                            fontSize: 16,
                            fontFamily: 'Inter-Regular',
                            color: selectedType ? 'black' : '#777',
                        }}>
                            {selectedType || 'Select Finance'}
                        </Text>
                        <Ionicons name={isDropdownVisible ? 'chevron-up' : 'chevron-down'} size={20} color="black" />
                    </TouchableOpacity>

                    {/* Error Message */}
                    {errors.finance && (
                        <Text style={{
                            color: 'red',
                            marginTop: 4,
                            fontSize: 13,
                            fontFamily: 'Inter-Regular'
                        }}>
                            {errors.finance}
                        </Text>
                    )}


                    {isDropdownVisible && (
                        <View style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            borderRadius: 8,
                            borderColor: '#ddd',
                            borderWidth: 1,
                            zIndex: 1,
                            marginTop: 2,
                            flex: 1,
                        }}>
                            <View style={{
                                position: 'relative',
                                margin: 5,
                            }}>
                                <TextInput
                                    style={{
                                        height: 40,
                                        borderColor: '#aaa',
                                        borderWidth: 1,
                                        borderRadius: 5,
                                        paddingLeft: 10,
                                        paddingRight: 30, // space for the icon
                                        color: 'black'
                                    }}
                                    placeholder="Search Finance"
                                    placeholderTextColor="#ccc"
                                    value={searchQuery}
                                    onChangeText={handleSearch}
                                />

                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSearchQuery('');
                                            setFilteredData(financeList); // optional: reset the list
                                        }}
                                        style={{
                                            position: 'absolute',
                                            right: 10,
                                            top: 10,
                                        }}>
                                        <FontAwesome name="times-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <FlatList
                                style={{ maxHeight: 150 }}
                                data={filteredData}
                                keyExtractor={(item) => item.finance_id.toString()}
                                renderItem={renderItem2}
                                keyboardShouldPersistTaps="handled"
                                nestedScrollEnabled={true}
                            />
                        </View>
                    )}
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Manager
                </Text>
                <TextInput
                    value={manager}
                    onChangeText={setManager}
                    placeholder="Enter Manager"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />


                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Product
                </Text>
                <TextInput
                    value={product}
                    onChangeText={setProduct}
                    placeholder="Enter Product"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />




                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Month
                </Text>
                <TextInput
                    value={month}
                    onChangeText={setMonth}
                    placeholder="Enter Month"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Agreement No
                </Text>
                <TextInput
                    value={agreementNo}
                    onChangeText={setAgreementNo}
                    placeholder="Enter Agreement No"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    App ID
                </Text>
                <TextInput
                    value={appId}
                    onChangeText={setAppId}
                    placeholder="Enter App ID"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Total Outstanding
                </Text>
                <TextInput
                    value={totalOutstanding}
                    onChangeText={setTotalOutstanding}
                    placeholder="Enter Total Outstanding"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />



                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Repo FOS
                </Text>
                <TextInput
                    value={repoFos}
                    onChangeText={setRepoFos}
                    placeholder="Enter Repo FOS"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Field FOS
                </Text>
                <TextInput
                    value={fieldFos}
                    onChangeText={setFieldFos}
                    placeholder="Enter Field FOS"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />


                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Customer Name
                </Text>
                <TextInput
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Enter Customer Name"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Principle Outstanding
                </Text>
                <TextInput
                    value={principleOutstanding}
                    onChangeText={setPrincipleOutstanding}
                    placeholder="Enter Principle Outstanding"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Branch
                </Text>
                <TextInput
                    value={branch}
                    onChangeText={setBranch}
                    placeholder="Enter Branch"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Bucket
                </Text>
                <TextInput
                    value={bucket}
                    onChangeText={setBucket}
                    placeholder="Enter Bucket"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    EMI
                </Text>
                <TextInput
                    value={emi}
                    onChangeText={setEmi}
                    placeholder="Enter EMI"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    RC Number <Text style={{ color: 'red', fontFamily: 'Inter-Bold' }}>*</Text>
                </Text>
                <TextInput
                    value={rcNumber}
                    onChangeText={setRcNumber}
                    placeholder="Enter RC Number"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />
                {errors.rcNumber && (
                    <Text style={{
                        color: 'red',
                        marginTop: 4,
                        fontSize: 13,
                        fontFamily: 'Inter-Regular'
                    }}>
                        {errors.rcNumber}
                    </Text>
                )}

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Chassis No
                </Text>
                <TextInput
                    value={chassisNo}
                    onChangeText={setChassisNo}
                    placeholder="Enter Chassis No"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: 'Inter-Medium' }}>
                    Engine No
                </Text>

                <TextInput
                    value={EngineNo}
                    onChangeText={setEngineNo}
                    placeholder="Enter Chassis No"
                    placeholderTextColor="#888"
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#000',
                        marginBottom: 8,
                        fontFamily: 'Inter-Regular'
                    }}
                />




                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    style={{
                        backgroundColor: colors.Brown || '#8B4513',
                        padding: 14,
                        borderRadius: 8,
                        alignItems: 'center',
                        marginTop: 10,
                    }}
                >
                    <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Inter-Regular' }}>{route.params?.vehicleData.full_vehicle_id ? 'Update' : 'Submit'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

export default SingleVehicleUpload;
