import { ActivityIndicator, Alert, FlatList, Image, Modal, PermissionsAndroid, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import colors from '../CommonFiles/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ENDPOINTS } from '../CommonFiles/Constant';
import AntDesign from 'react-native-vector-icons/AntDesign';
import RNFS from 'react-native-fs';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import FileViewer from 'react-native-file-viewer';
import CustomerShimmer from '../Component/CustomerShimmer';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ListingScreen = () => {
  const list = require('../assets/images/List.png');
  const reset = require('../assets/images/refresh.png');
  const Finance = require('../assets/images/budget.png');
  const navigation = useNavigation();

  const [List, setList] = useState([]);
  const [ListLoading, setListLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const [fromErrorMessage, setFromErrorMessage] = useState('');
  const [toDateErrorMessage, setToDateErrorMessage] = useState('');




  const [selectedHistory, setSelectedHistory] = useState(null);
  console.log("selected history", selectedHistory);

  const [modalVisible, setModalVisible] = useState(false);
  const [id, setId] = useState(null);

  const [preLoading, setPreLoading] = useState(false);  // For Pre button loading state
  const [postLoading, setPostLoading] = useState(false);

  const [PreMailLoading, setPreMailLoading] = useState(false);
  const [PostMailLoading, setPostMailLoading] = useState(false);

  const [modalVisible2, setModalVisible2] = useState(false);
  const [fromDate, setFromDate] = useState('');

  const [toDate, setToDate] = useState('');

  const [resultCount, setResultCount] = useState(0);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [financeList, setFinanceList] = useState([]);

  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);


  const [isFilterActive, setIsFilterActive] = useState(false);

  const [ResetButtonVisible, setResetButtonVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);


  const [PrePdfLoading, setPrePdfLoading] = useState(false);
  const [PostPdfLoading, setPostPdfLoading] = useState(false);

  const [text, setText] = useState(null);
  const [originalPsoList, setOriginalPsoList] = useState([]);

  const [userType, setUsertype] = useState(null);




  useFocusEffect(
    React.useCallback(() => {
      let usertype = null;

      const fetchUsertype = async () => {
        usertype = await AsyncStorage.getItem('user_type');
        const agency = await AsyncStorage.getItem('selected_agency');
        setUsertype(usertype);
        // setIsAgencyMode(!!agency);
      };

      fetchUsertype();
    }, []),
  );


  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const staff_id = await AsyncStorage.getItem('staff_id');
      if (!staff_id) {
        console.warn('No staff_id found');
        setLoading(false);
        return;
      }
      const response = await fetch(ENDPOINTS.List_Staff_Permission, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id }),
      });

      const result = await response.json();

      if (result.code === 200 && result.payload) {
        const permData = {};

        result.payload.forEach(item => {
          // Convert menu name to lowercase key
          const menuName = item.menu_name.toLowerCase();

          // Split permissions, convert to lowercase, trim spaces
          const permsArray = item.menu_permission
            .split(',')
            .map(p => p.trim().toLowerCase());

          // Create boolean map for this menu
          const permsObject = {};
          permsArray.forEach(perm => {
            permsObject[perm] = true;
          });

          permData[menuName] = permsObject;
        });

        setPermissions(permData);
      } else {
        console.warn('Failed to fetch permissions or no payload');
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPermissions();
  }, []);




  const openModal = item => {
    setSelectedHistory(item); // Set selected item data to show in the modal
    setModalVisible(true); // Show the modal
    setPreLoading(false);
    setPostLoading(false);
  };


  const closeModal = () => {
    setModalVisible(false); // Hide the modal
    setSelectedHistory(null); // Clear the selected item data
  };



  const intimationList = async (filterPayload = null) => {
    console.log("ye hai filterpayload", filterPayload)
    setListLoading(true);
    try {
      const response = await fetch(ENDPOINTS.Intimation_List, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterPayload || {})

      });

      const result = await response.json();

      if (response.ok) {
        if (result.code === 200) {
          setList(result.payload); // Successfully received data
          setId(result.payload.id);
          setOriginalPsoList(result.payload);
          // setIsFilterActive(true);
          setResultCount(result.payload.length);
        } else {

          console.log('Error:', 'Failed to load staff data');
          setList([]);
          setResultCount(0);
        }
      } else {
        console.log('HTTP Error:', result.message || 'Something went wrong');
        setResultCount(0);
      }
    } catch (error) {
      console.log('Error fetching data:', error.message);
      setResultCount(0);
    } finally {
      setListLoading(false);

    }
  };

  useEffect(() => {
    intimationList();
  }, []);



  const PrePostEmailSendApi = async (type, id) => {
    console.log("type ye hai", type, id);

    if (type === 'pre') {
      setPreLoading(true); // Show loader for Pre button
    } else if (type === 'post') {
      setPostLoading(true); // Show loader for Post button
    }



    try {
      const response = await fetch(ENDPOINTS.Mail_Send_Pdf, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,  // Use the ID obtained from AddIntimation
          pdf: type, // Type could be 'pre' or 'post', depending on the button clicked
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Check the code in the response to decide which message to show
        if (result.code === 200) {
          ToastAndroid.show('Mail Send Successfully', ToastAndroid.SHORT);
          setModalVisible(false);
        } else if (result.code === 400) {
          // Handle case for code 400
          ToastAndroid.show(result.message || 'Something went wrong', ToastAndroid.SHORT);
        } else {
          // Handle other cases or unknown codes
          ToastAndroid.show('Failed to send mail. Please try again later.', ToastAndroid.SHORT);
        }
      } else {
        console.log('HTTP Error:', result.message || 'Something went wrong');
        ToastAndroid.show(result.message || 'Something went wrong', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.log('Error fetching data:', error.message);
      ToastAndroid.show('Error fetching data. Please try again later.', ToastAndroid.SHORT);
    } finally {
      if (type === 'pre') setPreLoading(false);
      if (type === 'post') setPostLoading(false);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to your storage to save PDF files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Storage permission granted');
        } else {
          console.log('Storage permission denied');

        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    requestStoragePermission();
  }, []);

  const handleTextChange = (inputText) => {
    setText(inputText);

    // If inputText is empty, show the original data
    if (inputText === '') {
      setList(originalPsoList);  // Reset to original data
      setResultCount(originalPsoList.length);


    } else {
      // Filter data based on Name, Reg No, or Agg No
      const filtered = originalPsoList.filter(item => {
        const lowerCaseInput = inputText.toLowerCase();
        return (
          item.customer_name.toLowerCase().includes(lowerCaseInput) ||
          item.rc_no.toLowerCase().includes(lowerCaseInput) ||
          item.engine_no.toLowerCase().includes(lowerCaseInput) ||
          item.chassis_no.toLowerCase().includes(lowerCaseInput)

        );
      });

      setList(filtered); // Update filtered data state
      setResultCount(filtered.length)
    }
  };

  const PreDownloadPDF = async () => {
    setPrePdfLoading(true);

    const htmlContent = `
        <html>
          <head>
            <style>
              body {
                font-family: 'Inter-Regular';
                font-size: 14px;
                color: black;
                padding: 20px;
                background-color: white;
              }
              table {
                         width: 80%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                padding: 10px;
                text-align: left;
               
              }
              th {
                font-weight: bold;
              }
              .header-title {
                  text-align: center;
                  font-size: 14px;
                  font-weight: bold;
                  margin-bottom: 15px;
                  
                }
                  .header-text{
                  text-decoration: underline;
                  }
              .static-text {
                font-size: 14px;
                margin-Top: 10px;
                margin-bottom: 10px;
                text-align: justify;
              }
                .static-Top {
    
    
    
    font-size: 14px;
    
    }
    
              .details-row {
                display: flex;
                justify-content: space-between;
                margin-top: 15px;
              }
              .details-row div {
                width: 48%; /* Both left and right columns take up nearly half the space */
              }
              .static-name {
    width: 40%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    font-size: 14px;
    margin-bottom: 10px;
    }
    
    
            </style>
          </head>
          <body>
            <!-- Header -->
            <div class="header-title">
             <h3 class="header-text" style="text-align:center">PRE Intimation of Repossession to Police Station</h3></div>
            
             <div class="static-Top">

          To</br>
          Police Inspector,</br>
            ${selectedHistory.police_station_address || '------'}</br>
            ${selectedHistory.police_station_area || '------'}</br>

            </div>
            

        </div>
    
            <!-- Static Message -->
            <div class="static-text">
             This is to inform you that below customer has default in payment and has not shown up to pay
    money even after several reminders. We are going to repossess the vehicle
            </div>
    
            <!-- Table for Dynamic Vehicle Details -->
            <table>
            
              <tr>
                <th>Loan Agreement No</th>
                    <td><strong>:</strong></td>
                <td>${selectedHistory.loan_no || '----------'
      }</td>
              </tr>
                </tr>
                <th>Customer Name</th>
                    <td><strong>:</strong></td>
                <td>${selectedHistory.customer_name || '----------'}</td>
              </tr>
               <tr>
                <th>Vehicle Registration No</th>
                    <td><strong>:</strong></td>
                <td>${selectedHistory.rc_no || '----------'}</td>
              </tr>
              <tr>
                <th>Product Model</th>
                    <td><strong>:</strong></td>
                <td>${selectedHistory.product || '----------'}</td>
            
                </tr>
              <tr>
                <th>Engine No</th>
                    <td><strong>:</strong></td>
                <td>${selectedHistory.engine_no || '----------'}</td>
              </tr>
              <tr>
                <tr>
                <th>Chassis No</th>
                    <td><strong>:</strong></td>
                <td>${selectedHistory.chassis_no || '----------'}</td>
              </tr>
               <tr>
                <tr>
                <th>Repossession Address</th>
                    <td><strong>:</strong></td>
                <td>${selectedHistory.repposession_address || '----------'}</td>
              </tr>
               
            <!-- Date and Time Row -->
        <tr>
          <th>Date</th>
              <td><strong>:</strong></td>
          <td>${selectedHistory.form_date || '----------'}</td>
        </tr>
        <tr>
          <th>Time</th>
              <td><strong>:</strong></td>
          <td>${selectedHistory.form_time || '----------'}</td>
        </tr>
    
            </table>
    
            <!-- Static Footer Text with 3 Paragraphs -->
            <div class="static-text">
             
              <p>Please do not take any complains of vehicle being stolen from the customer.</p>
            </div>
    
            <!-- Finance and Agency Details (Displayed on left and right side) -->
            <div class="static-name">
          
            <p>${selectedHistory.finance_name || '----------'
      }</p>
             <p>${selectedHistory.agency_select || '----------'
      }</p>
      
        
          
          </div>
          </body>
        </html>
      `;

    try {
      // Generate PDF from HTML content
      const options = {
        html: htmlContent,
        fileName: 'IntimationDetails',
        directory: RNFS.CachesDirectoryPath, // Save in app's temporary directory
      };

      const file = await RNHTMLtoPDF.convert(options);
      console.log('PDF file created:', file.filePath);

      // Define the destination path directly to the Downloads folder (Android)
      const destinationPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/PRE_PDF(${selectedHistory.loan_no}).pdf` // Pre download
          : `${RNFS.DocumentDirectoryPath}/PRE_PDF(${selectedHistory.loan_no}).pdf`; // iOS uses Document directory

      // Move the file to the Downloads folder (Android)
      await RNFS.moveFile(file.filePath, destinationPath);
      console.log('PDF saved to:', destinationPath);

      // Optionally, trigger the system to scan the file (Android)
      if (Platform.OS === 'android') {
        await RNFS.scanFile(destinationPath); // Makes the file visible in file explorer
      }

      // Inform the user that the PDF is saved
      Alert.alert(
        'PDF Downloaded',
        'Your PDF has been saved to your device in the Downloads folder.',
      );
    } catch (error) {
      console.error('Error generating or saving PDF:', error);
      Alert.alert('Error', 'There was an issue generating or saving the PDF.');
    } finally {
      setPrePdfLoading(false);
    }
  };

  const PostDownloadPDF = async () => {

    setPostPdfLoading(true);
    const htmlContent = `
          <html>
            <head>
              <style>
                body {
                  font-family: 'Inter-Regular';
                  font-size: 14px;
                  color: black;
                  padding: 20px;
                  background-color: white;
                }
                table {
                  width: 80%;
                  border-collapse: collapse;
                  margin-top: 20px;
                }
                th, td {
                  padding: 10px;
                  text-align: left;
                
                }
                th {
                  font-weight: bold;
                }
                .header-title {
                  text-align: center;
                  font-size: 14px;
                  font-weight: bold;
                  margin-bottom: 15px;
                  
                }
                  .header-text{
                  text-decoration: underline;
                  }
                .static-text {
                  font-size: 14px;
                  margin-Top: 10px;
                  margin-bottom: 10px;
                  text-align: justify;
                }
                  .static-Top {
    
     
      
      font-size: 14px;
     
    }
    
                .details-row {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 15px;
                }
                .details-row div {
                  width: 48%; /* Both left and right columns take up nearly half the space */
                }
                .static-name {
      width: 40%;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      font-size: 14px;
      margin-bottom: 10px;
    }
    
    
              </style>
            </head>
            <body>
              <!-- Header -->
              <div class="header-title">
              <h3 class="header-text" style="text-align:center">Post Intimation of Repossession to Police Station</h3></div>
            <div class="static-Top">

          To</br>
          Police Inspector,</br>
           ${selectedHistory.police_station_address || '------'}</br>
            ${selectedHistory.police_station_area || '------'}</br>

             </div>
            

        </div>
              <!-- Static Message -->
              <div class="static-text">
                This is to inform you that below customer has default in payment and has not shown up to pay money
    even after several reminders. We had repossessed the vehicle.
              </div>
    
              <!-- Table for Dynamic Vehicle Details -->
              <table>
              
                <tr>
                  <th>Loan Agreement No</th>
                              <td><strong>:</strong></td>
                  <td>${selectedHistory.loan_no || '----------'
      }</td>
                </tr>
                  </tr>
                  <th>Customer Name</th>
                  <td><strong>:</strong></td>
                  <td>${selectedHistory.customer_name || '----------'}</td>
                </tr>
                 <tr>
                  <th>Vehicle Registration No</th>
                  <td><strong>:</strong></td>
                  <td>${selectedHistory.rc_no || '----------'}</td>
                </tr>
                <tr>
                  <th>Product Model</th>
                  <td><strong>:</strong></td>
                  <td>${selectedHistory.product || '----------'}</td>
              
                  </tr>
                <tr>
                  <th>Engine No</th>
                  <td><strong>:</strong></td>
                  <td>${selectedHistory.engine_no || '----------'}</td>
                </tr>
                <tr>
                  <tr>
                  <th>Chassis No</th>
                  <td><strong>:</strong></td>
                  <td>${selectedHistory.chassis_no || '----------'}</td>
                </tr>
                 
              <!-- Date and Time Row -->
         <tr>
          <th>Date</th>
          <td><strong>:</strong></td>
          <td>${selectedHistory.form_date || '----------'}</td>
        </tr>
        <tr>
          <th>Time</th>
          <td><strong>:</strong></td>
          <td>${selectedHistory.form_time || '----------'}</td>
        </tr>
    
              </table>
    
              <!-- Static Footer Text with 3 Paragraphs -->
              <div class="static-text">
               
                <p>Please do not take any complains of vehicle being stolen from the customer.</p>
              </div>
    
              <!-- Finance and Agency Details (Displayed on left and right side) -->
              <div class="static-name">
            
              <p>${selectedHistory.finance_name || '----------'
      }</p>
             <p>${selectedHistory.agency_select || '----------'
      }</p>
      
       
          
            
            </div>
            </body>
          </html>
        `;

    try {
      // Generate PDF from HTML content
      const options = {
        html: htmlContent,
        fileName: 'IntimationDetails',
        directory: RNFS.CachesDirectoryPath, // Save in app's temporary directory
      };

      const file = await RNHTMLtoPDF.convert(options);
      console.log('PDF file created:', file.filePath);

      // Define the destination path directly to the Downloads folder (Android)
      const destinationPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/POST_PDF(${selectedHistory.loan_no}).pdf` // Post download
          : `${RNFS.DocumentDirectoryPath}/POST_PDF(${selectedHistory.loan_no}).pdf`; // iOS uses Document directory

      // Move the file to the Downloads folder (Android)
      await RNFS.moveFile(file.filePath, destinationPath);
      console.log('PDF saved to:', destinationPath);

      // Optionally, trigger the system to scan the file (Android)
      if (Platform.OS === 'android') {
        await RNFS.scanFile(destinationPath); // Makes the file visible in file explorer
      }

      // Inform the user that the PDF is saved
      Alert.alert(
        'PDF Downloaded',
        'Your PDF has been saved to your device in the Downloads folder.',
      );
    } catch (error) {
      console.error('Error generating or saving PDF:', error);
      Alert.alert('Error', 'There was an issue generating or saving the PDF.');
    } finally {
      setPostPdfLoading(false);
    }
  };




  const PrePdfAfterMail = async () => {

    setPreMailLoading(true);
    setModalVisible(false);



    const htmlContent = `
        <html>
    <head>
      <style>
        body {
          font-family: 'Inter-Regular', sans-serif;
          font-size: 14px;
          color: black;
          padding: 20px;
          background-color: white;
        }
        .mail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .mail-header img {
          width: 30px;
          height: 30px;
          margin-right: 8px;
        }
        .mail-header .gmail-text {
          font-size: 14px;
          font-weight: bold;
        }
        .agency-info {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 15px;
          font-size: 14px;
          color: #333;
        }
           .agency-info2 {
          display: flex;
           justify-content: space-between;
          margin-bottom: 15px;
          font-size: 14px;
          color: #333;
        }
          .agency-info3 {
          display: flex;
           justify-content: flex-start;
          margin-bottom: 15px;
          font-size: 14px;
          color: #333;
        }
          
        .separator {
          border-top: 1px solid #000;
          margin: 10px 0;
        }
        .header-title {
      display: flex;           /* Enables flex layout */
      justify-content: flex-start; /* Aligns content to the left */
      align-items: center;     /* Vertically centers content */
      font-size: 16px;
      font-weight: bold;
      margin: 15px 0;
    }
    
        .static-text {
          font-size: 14px;
          margin: 10px 0;
          text-align: justify;
        }
        .info-label {
          font-weight: bold;
        }
    .info-item {
      margin-bottom: 10px;     /* Increased spacing */
      padding: 8px;            /* Adds padding inside */
      line-height: 1.5;        /* Improves readability */
      display: flex;           
      justify-content: space-around;  /* Equal spacing around items */
      align-items: center;     /* Vertically centers content */
    }
    
      table {
                  width: 80%;
                  border-collapse: collapse;
                  margin-top: 20px;
                }
                th, td {
                  padding: 10px;
                  text-align: left;
            
                }
                th {
                  font-weight: bold;
                }
                .header-title {
                  text-align: center;
                  font-size: 14px;
                  font-weight: bold;
                  justify-content: flex-start;
                
                }
    
    
      .footer-details {
      margin-top: 20px;
      font-size: 14px;
      font-weight: bold;
      width: 100%;               /* Removed quotes */
      display: flex;            /* Added flex display */
      justify-content: space-between; /* Aligns items with space between */
    }
    
               .static-Top {
    
     
      
      font-size: 14px;
     
    }
      </style>
    </head>
    <body>
      <!-- Mail Header -->
      <div class="mail-header">
        <div style="display: flex; align-items: center;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png" alt="Gmail Icon">
          <span class="gmail-text">Gmail</span>
        </div>
        <div class="agency-info">
          <span><strong>${selectedHistory.agency_select || '----------'}</strong> &lt;${selectedHistory.agency_email || '----------'}&gt;</span>
        </div>
      </div>
    
      <div class="separator"></div>
    
      <!-- Header -->
      <div class="header-title">PRE POLICE REPO INTIMATION OF VEHICLE ${selectedHistory.rc_no || '----------'} </div>
    
      <div class="separator"></div>
    
        <div class="agency-info2">
      <span><strong>${selectedHistory.agency_select || '----------'}</strong> &lt;${selectedHistory.agency_email || '----------'}&gt;</span>
      <span>${selectedHistory.email_entrydate || '----------'}</span>
    </div>
    
      <div class="agency-info3">
      <span><strong>To </strong></span>
      <span style="padding: 0 8px;">:</span> <!-- Extra padding for space -->
      <span>${selectedHistory.police_station_email || '----------'}</span>
    </div>
    
    
          <div class="static-Top">
    
                To</br>
                Police Inspector,</br>
                    ${selectedHistory.police_station_area || '------'}</br>
                 ${selectedHistory.police_station_address || '------'}</br>
        
                  
    
              </div>
    
      <!-- Static Message -->
      <div class="static-text">
        This is to inform you that the below customer has defaulted in payment and has not shown up to pay even after several reminders. We are going to repossess the vehicle.
      </div>
    
      <!-- Table for Dynamic Vehicle Details -->
              <table>
            
              <tr>
                <th>Loan Agreement No</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.loan_no || '----------'
      }</td>
              </tr>
                </tr>
                <th>Customer Name</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.customer_name || '----------'}</td>
              </tr>
               <tr>
                <th>Vehicle Registration No</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.rc_no || '----------'}</td>
              </tr>
              <tr>
                <th>Product Model</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.product || '----------'}</td>
            
                </tr>
              <tr>
                <th>Engine No</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.engine_no || '----------'}</td>
              </tr>
              <tr>
                <tr>
                <th>Chassis No</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.chassis_no || '----------'}</td>
              </tr>
              <tr>
                <tr>
                <th>Repposession Address</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.repposession_address || '----------'}</td>
              </tr>
               
            <!-- Date and Time Row -->
        <tr>
          <th>Date</th>
            <td><strong>:</strong></td>
          <td>${selectedHistory.form_date || '----------'}</td>
        </tr>
        <tr>
          <th>Time</th>
            <td><strong>:</strong></td>
          <td>${selectedHistory.form_time || '----------'}</td>
        </tr>
    
            </table>
    
      <!-- Footer Text -->
      <div class="static-text">
        Please do not take any complaints of the vehicle being stolen from the customer.
      </div>
    
      <!-- Footer Details -->
      <div class="footer-details">
        <p>${selectedHistory.finance_name || '----------'}</p>
        <p>${selectedHistory.agency_select || '----------'}</p>
      </div>
    </body>
    </html>
    
        `;



    try {
      // Generate PDF from HTML content
      const options = {
        html: htmlContent,
        fileName: 'IntimationDetails',
        directory: RNFS.CachesDirectoryPath, // Save in app's temporary directory
      };

      const file = await RNHTMLtoPDF.convert(options);
      console.log('PDF file created:', file.filePath);

      // Define the destination path directly to the Downloads folder (Android)
      const destinationPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/PRE_PDF(${selectedHistory.rc_no}).pdf` // Pre download
          : `${RNFS.DocumentDirectoryPath}/PRE_PDF(${selectedHistory.rc_no}).pdf`; // iOS uses Document directory

      // Move the file to the Downloads folder (Android)
      await RNFS.moveFile(file.filePath, destinationPath);
      console.log('PDF saved to:', destinationPath);

      navigation.navigate('PDFViewerScreen', { pdfUrl: destinationPath });

      // Optionally, trigger the system to scan the file (Android)
      if (Platform.OS === 'android') {
        await RNFS.scanFile(destinationPath); // Makes the file visible in file explorer
      }

      // 📂 Open PDF after download
      // await FileViewer.open(destinationPath, { showOpenWithDialog: true });
      // console.log('PDF opened successfully');

      // Alert.alert('PDF Downloaded', 'Your PDF has been saved and opened.');

    } catch (error) {
      console.error('Error generating, saving, or opening PDF:', error);

    } finally {
      setPreMailLoading(false);
    }
  };

  const PostPdfAfterMail = async () => {
    setPostMailLoading(true);
    setModalVisible(false);

    const htmlContent = `
          <html>
            <head>
              <style>
                body {
                  font-family: 'Inter-Regular', sans-serif;
                  font-size: 14px;
                  color: black;
                  padding: 20px;
                  background-color: white;
                }
                .mail-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 15px;
                }
                .mail-header img {
                  width: 30px;
                  height: 30px;
                  margin-right: 8px;
                }
                .mail-header .gmail-text {
                  font-size: 14px;
                  font-weight: bold;
                }
                .agency-info {
                  display: flex;
                  justify-content: flex-end;
                  margin-bottom: 15px;
                  font-size: 14px;
                  color: #333;
                }
                .agency-info2 {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 15px;
                  font-size: 14px;
                  color: #333;
                }
                .agency-info3 {
                  display: flex;
                  justify-content: flex-start;
                  margin-bottom: 15px;
                  font-size: 14px;
                  color: #333;
                }
                .separator {
                  border-top: 1px solid #000;
                  margin: 10px 0;
                }
                .header-title {
                  display: flex;
                  justify-content: flex-start;
                  align-items: center;
                  font-size: 16px;
                  font-weight: bold;
                  margin: 15px 0;
                }
                .static-text {
                  font-size: 14px;
                  margin: 10px 0;
                  text-align: justify;
                }
                .info-label {
                  font-weight: bold;
                }
                .info-item {
                  margin-bottom: 10px;
                  padding: 8px;
                  line-height: 1.5;
                  display: flex;
                  justify-content: space-around;
                  align-items: center;
                }
                table {
                  width: 80%;
                  border-collapse: collapse;
                  margin-top: 20px;
                }
                th, td {
                  padding: 10px;
                  text-align: left;
                 
                }
                th {
                  font-weight: bold;
                }
                .footer-details {
                  margin-top: 20px;
                  font-size: 14px;
                  font-weight: bold;
                 width: 100%;  
                  justify-content: space-between;
                }
                .static-Top {
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <!-- Mail Header -->
              <div class="mail-header">
                <div style="display: flex; align-items: center;">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png" alt="Gmail Icon">
                  <span class="gmail-text">Gmail</span>
                </div>
                <div class="agency-info">
                  <span><strong>${selectedHistory.agency_select || '----------'}</strong> &lt;${selectedHistory.agency_email || '----------'}&gt;</span>
                </div>
              </div>
      
              <div class="separator"></div>
      
              <!-- Header Title -->
            <div class="header-title">POST POLICE REPO INTIMATION OF VEHICLE ${selectedHistory.rc_no || '----------'} </div>
      
              <div class="separator"></div>
      
              <!-- Agency Info -->
              <div class="agency-info2">
                <span><strong>${selectedHistory.agency_select || '----------'}</strong> &lt;${selectedHistory.agency_email || '----------'}&gt;</span>
                <span>${selectedHistory.email_entrydate || '----------'}</span>
              </div>
      
              <!-- Recipient Info -->
              <div class="agency-info3">
                <span><strong>To </strong></span>
                <span style="padding: 0 8px;">:</span>
                <span>${selectedHistory.police_station_email || '----------'}</span>
              </div>
      
              <div class="static-Top">
                To</br>
                Police Inspector,</br>
                    ${selectedHistory.police_station_area || '------'}</br>
              ${selectedHistory.police_station_address || '------'}</br>
        
              </div>
      
              <!-- Static Message -->
              <div class="static-text">
                This is to inform you that below customer has defaulted in payment and has not shown up to pay even after several reminders. We had repossessed the vehicle.
              </div>
      
              <!-- Vehicle Details Table -->
              <table>
            
              <tr>
                <th>Loan Agreement No</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.loan_no || '----------'
      }</td>
              </tr>
                </tr>
                <th>Customer Name</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.customer_name || '----------'}</td>
              </tr>
               <tr>
                <th>Vehicle Registration No</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.rc_no || '----------'}</td>
              </tr>
              <tr>
                <th>Product Model</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.product || '----------'}</td>
            
                </tr>
              <tr>
                <th>Engine No</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.engine_no || '----------'}</td>
              </tr>
              <tr>
                <tr>
                <th>Chassis No</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.chassis_no || '----------'}</td>
              </tr>
              <tr>
                <tr>
                <th>Repposession Address</th>
                  <td><strong>:</strong></td>
                <td>${selectedHistory.repposession_address || '----------'}</td>
              </tr>
              
               
            <!-- Date and Time Row -->
        <tr>
          <th>Date</th>
            <td><strong>:</strong></td>
          <td>${selectedHistory.form_date || '----------'}</td>
        </tr>
        <tr>
          <th>Time</th>
            <td><strong>:</strong></td>
          <td>${selectedHistory.form_time || '----------'}</td>
        </tr>
    
            </table>
      
              <!-- Footer Text -->
              <div class="static-text">
                <p>Please do not take any complaints of the vehicle being stolen from the customer.</p>
              </div>
      
              <!-- Footer Details -->
              <div class="footer-details">
                <p>${selectedHistory.finance_name || '----------'}</p>
             <p>${selectedHistory.agency_select || '----------'}</p>
              </div>
            </body>
          </html>
        `;

    try {
      const options = {
        html: htmlContent,
        fileName: 'IntimationDetails',
        directory: RNFS.CachesDirectoryPath,
      };

      const file = await RNHTMLtoPDF.convert(options);
      console.log('PDF file created:', file.filePath);

      const destinationPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/POST_PDF(${selectedHistory.rc_no}).pdf`
          : `${RNFS.DocumentDirectoryPath}/POST_PDF(${selectedHistory.rc_no}).pdf`;

      await RNFS.moveFile(file.filePath, destinationPath);
      console.log('PDF saved to:', destinationPath);

      navigation.navigate('PDFViewerScreen', { pdfUrl: destinationPath });

      if (Platform.OS === 'android') {
        await RNFS.scanFile(destinationPath);
      }

      // // Open PDF using FileViewer
      // await FileViewer.open(destinationPath)
      //   .then(() => {
      //     console.log('PDF opened successfully');
      //   })
      //   .catch(error => {
      //     console.error('Error opening PDF:', error);

      //   });

      // Alert.alert('PDF Downloaded', 'Your PDF has been saved to your device in the Downloads folder.');
    } catch (error) {
      console.error('Error generating or saving PDF:', error);

    } finally {
      setPostMailLoading(false);
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

  const onRefresh = async () => {
    await intimationList();
    await fetchPermissions();

  }



  // Render each item in the table
  const renderItem = ({ item, index }) => (
    <View style={{ flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
      <View style={{ width: '7%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: 'black', fontFamily: 'Inter-Regular' }}>{index + 1 || '----'}</Text>
      </View>
      <View style={{ width: '30%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: 'black', fontFamily: 'Inter-Regular', fontSize: 13 }}>{item.customer_name || '----'}</Text>
      </View>
      <View style={{ width: '28%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: 'black', fontFamily: 'Inter-Regular' }}>{item.rc_no || '----'}</Text>
        <TouchableOpacity style={{ backgroundColor: item.confirm_status == 'Confirm' ? 'green' : 'red', padding: 3, borderRadius: 5 }} disabled={true}>
          <Text style={{ fontSize: 12, color: 'white', fontFamily: 'Inter-Regular' }}>{item.confirm_status || '----'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width: '25%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: 'black', fontFamily: 'Inter-Regular' }}>{item.entrydate || '----'}</Text>
      </View>
      <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => openModal(item)}
          style={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',

            height: 30
          }}>
          <AntDesign name="infocirlceo" size={20} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const formatDate = (date) => {
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const formatDate2 = (date) => {
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };




  useEffect(() => {
    fetchFinanceList();
  }, []);

  const fetchFinanceList = async () => {

    let rentAgencyId = 0;
    let staff_id = 0;

    try {
      setLoading(true);

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
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = financeList.filter(item =>
      item.finance_name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filtered);
  };



  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
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
            fontSize: 16,
            fontWeight: 'bold',
            fontFamily: 'Inter-Bold',
          }}>
          Pso Confirm/Cancel List
        </Text>


        <View
          style={{
            width: '30%',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            right: 18,
            top: 4,
            height: 50,


          }}>

          {ResetButtonVisible && (
            <TouchableOpacity onPress={async () => {




              const payload = {
                finance_name_show: "",
                from_date: "",
                end_date: "",
              };

              // Simple validation
              // Reset search text and list
              setText('');
              setList(originalPsoList);

              // Reset filter states
              setSelectedType(null);
              setFromDate('');
              setToDate('');


              await intimationList(payload);
              setResetButtonVisible(false);
            }}>
              <Image source={reset} style={{ width: 28, height: 28, tintColor: 'white' }} />
            </TouchableOpacity>
          )}
        </View>

        {(
          userType === 'SuperAdmin' ||
          !permissions.pso_list ||
          permissions.pso_list.psofilter
        ) && (
            <View
              style={{
                width: '15%',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                right: 6,
                top: 5,
                height: 50,


              }}>


              <TouchableOpacity onPress={() => {
                setModalVisible2(true);
                setErrorMessage('');
                setFromErrorMessage('');
                setToDateErrorMessage('');


              }}>
                <FontAwesome5 name='filter' color='white' size={23} />
              </TouchableOpacity>
            </View>
          )}
      </View>
      <View style={{ width: '100%', paddingHorizontal: 10 }}>
        <View
          style={{
            width: '100%',

            borderWidth: 1,
            borderColor: colors.Brown,
            marginTop: 5,
            marginBottom: 5,
            borderRadius: 8,
            height: 50,
            backgroundColor: 'white',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderColor: colors.Brown,

          }}>
          <View style={{
            width: 30,  // निश्चित width दी है
            height: 50, // पूरी height ली है
            justifyContent: 'center',
            alignItems: 'center',

          }}>
            <MaterialIcons name='search' size={24} color='black' />
          </View>
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              fontFamily: 'Inter-Regular',

              color: 'black',
              height: 50,
            }}

            placeholder="Search Name/Rc No"
            placeholderTextColor="grey"
            value={text}
            onChangeText={handleTextChange}
          />
          {text ? (
            <TouchableOpacity
              onPress={() => {

                setText(''); // Clear the search text
                setList(originalPsoList);
                setResultCount(originalPsoList.length);
              }}
              style={{
                marginRight: 7,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Entypo name="cross" size={20} color="black" />
            </TouchableOpacity>
          ) : null}
        </View>

      </View>
      <View style={{
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: '#f2f2f2',
        borderBottomWidth: 1,
        borderColor: '#ddd'
      }}>
        <Text style={{
          fontSize: 14,
          fontFamily: 'Inter-Medium',
          color: '#333'
        }}>
          Showing {resultCount} result{resultCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Table Header */}
      <View style={{ backgroundColor: 'white' }}>
        {List.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#ddd',
              padding: 7,
              borderRadius: 5,
            }}>
            <View
              style={{
                width: '10%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontFamily: 'Inter-Regular',
                  textAlign: 'center',
                  fontSize: 14,
                  color: 'black',
                }}>
                #
              </Text>
            </View>
            <View
              style={{
                width: '30%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontFamily: 'Inter-Regular',
                  textAlign: 'left',
                  fontSize: 14,
                  color: 'black',
                }}>
                NAME
              </Text>
            </View>
            <View
              style={{
                width: '25%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontFamily: 'Inter-Regular',
                  textAlign: 'center',
                  fontSize: 14,
                  color: 'black',
                }}>
                RC NO
              </Text>
            </View>

            <View
              style={{
                width: '25%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontFamily: 'Inter-Regular',
                  textAlign: 'center',
                  fontSize: 14,
                  color: 'black',
                }}>
                DATE
              </Text>
            </View>

            <View
              style={{
                width: '10%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontFamily: 'Inter-Regular',
                  textAlign: 'center',
                  fontSize: 14,
                  color: 'black',
                }}>
                {/* Empty column */}
              </Text>
            </View>
          </View>
        )}


      </View>
      {/* Area List */}
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        {ListLoading ? (
          <CustomerShimmer />
        ) : (
          <FlatList
            keyboardShouldPersistTaps='handled'
            data={List}
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View
                style={{ height: 600, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={list} style={{ width: 70, height: 70, marginTop: 30, }} />
                <Text
                  style={{
                    fontFamily: 'Inter-Regular',
                    color: 'red',
                    marginTop: 20

                  }}>
                  No List Found
                </Text>
              </View>
            }
          />
        )}
      </View>


      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dimmed background
          }}
          activeOpacity={1}
          onPress={closeModal}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              width: '85%',
              paddingVertical: 5,
            }}>
            <TouchableOpacity
              onPress={closeModal}
              style={{
                marginRight: 5,
                backgroundColor: 'white',
                borderRadius: 50,
              }}>
              <Entypo name="cross" size={25} color="black" />
            </TouchableOpacity>
          </View>
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 15,
              width: '85%',
              maxHeight: '80%', // Ensure modal does not overflow
            }}
            onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
            onTouchEnd={e => e.stopPropagation()}>
            {selectedHistory && (
              <>
                {/* <TouchableOpacity
                              style={{
                                position: 'absolute',
                                right: 5,
                                top: 12,
                                width: '20%',
                                flexDirection: 'row',
                                justifyContent: 'center',
                              }}
                              onPress={closeModal}>
                              <Entypo name="cross" size={30} color="black" />
                            </TouchableOpacity> */}

                <View
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#e4dedeff',
                    borderWidth: 1, borderColor: 'black'
                  }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Inter-Medium',

                      color: 'black',
                      textAlign: 'center',
                      textTransform: 'uppercase'
                    }}>
                    Pso List Information
                  </Text>

                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {[
                    { label: 'Name', value: selectedHistory.customer_name || '-----' },
                    { label: 'RC No', value: selectedHistory.rc_no || '-----' },
                    { label: 'Date', value: selectedHistory.form_date || '-----' },
                    { label: 'Time', value: selectedHistory.form_time || '-----' },
                    { label: 'Loan/Agreement No', value: selectedHistory.loan_agreement_no || '-----' },
                    { label: 'Engine No', value: selectedHistory.engine_no || '-----' },
                    { label: 'Chassis No', value: selectedHistory.chassis_no || '-----' },
                    { label: 'Entry Date', value: selectedHistory.entrydate || '-----' },
                    { label: 'Repossession Agent', value: selectedHistory.reposession_agent || '-----' },
                  ].map((item, index) => (
                    <View
                      key={index}
                      style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}
                    >
                      {/* Label */}
                      <View
                        style={{
                          width: '40%',

                          borderLeftWidth: 1,
                          borderBottomWidth: 1,
                          borderColor: 'black',
                          padding: 5,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Inter-Regular',
                            color: 'black',
                            textAlign: 'left',
                            flexWrap: 'wrap',
                            textTransform: 'uppercase'
                          }}
                        >
                          {item.label}
                        </Text>
                      </View>



                      {/* Value */}
                      <View
                        style={{
                          width: '60%',

                          borderLeftWidth: 1,
                          borderBottomWidth: 1,
                          borderRightWidth: 1,
                          borderColor: 'black',
                          padding: 5,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: 'black',
                            fontFamily: 'Inter-Bold',
                            textAlign: 'left',
                            flexWrap: 'wrap',
                            textTransform: 'uppercase'
                          }}
                        >
                          {item.value}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Confirm Status - Special Row with TouchableOpacity */}
                  <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}>
                    {/* Label */}
                    <View
                      style={{
                        width: '40%',

                        borderLeftWidth: 1,
                        borderBottomWidth: 1,
                        borderColor: 'black',
                        padding: 5,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Inter-Regular',
                          color: 'black',
                          textAlign: 'left',
                          flexWrap: 'wrap',
                          textTransform: 'uppercase'
                        }}
                      >
                        Confirm Status
                      </Text>
                    </View>



                    {/* Value - Touchable styled as badge */}
                    <View
                      style={{
                        width: '60%',
                        justifyContent: 'flex-start', alignItems: 'flex-start',
                        borderLeftWidth: 1,
                        borderBottomWidth: 1,
                        borderRightWidth: 1,
                        borderColor: 'black',
                        padding: 5,
                      }}
                    >
                      <TouchableOpacity
                        style={{
                          backgroundColor:
                            selectedHistory.confirm_status === 'Confirm' ? 'green' : 'red',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 5,
                        }}
                        disabled={true}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: 'white',
                            fontFamily: 'Inter-Regular',
                            textAlign: 'center',
                            textTransform: 'uppercase'
                          }}
                        >
                          {selectedHistory.confirm_status || '-----'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>




                {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  {selectedHistory.confirm_status == 'Confirm' && (
                    <TouchableOpacity
                      onPress={PreDownloadPDF}
                      style={{
                        backgroundColor: 'white',
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        borderColor: colors.Brown,
                        borderWidth: 1,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 20,
                        width: '48%',
                        marginRight: 10, // Space between buttons
                        flexDirection: 'row', // Icon aur text ko side-by-side dikhane ke liye
                        alignItems: 'center', // Vertically center karne ke liye
                      }}
                      disabled={PrePdfLoading}
                    >
                      {PrePdfLoading ? (
                        <ActivityIndicator size="small" color={colors.Brown} />
                      ) : (
                        <>
                          <AntDesign name='download' color='black' size={20} style={{ marginRight: 8 }} />
                          <Text
                            style={{
                              color: 'black',
                              fontSize: 12,
                              fontWeight: 'bold',
                              fontFamily: 'Inter-Bold',
                              textTransform: 'uppercase',
                            }}
                          >
                            Pre PDF
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                  )}

                  {selectedHistory.confirm_status == 'Confirm' && (
                    <TouchableOpacity
                      onPress={PostDownloadPDF}
                      style={{
                        backgroundColor: 'white',
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        borderColor: colors.Brown,
                        borderWidth: 1,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 20,
                        width: '48%', // Adjust width so both buttons fit
                        flexDirection: 'row',
                        alignItems: 'center', // Center align for icon & text
                      }}
                      disabled={PostPdfLoading} // Disable button during loading
                    >
                      {PostPdfLoading ? (
                        <ActivityIndicator size="small" color={colors.Brown} />
                      ) : (
                        <>
                          <AntDesign name='download' color='black' size={20} style={{ marginRight: 8 }} />
                          <Text
                            style={{
                              color: 'black',
                              fontSize: 12,
                              fontWeight: 'bold',
                              fontFamily: 'Inter-Bold',
                              textTransform: 'uppercase',
                            }}
                          >
                            Post PDF
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                  )}

                </View> */}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>

                  {/* {selectedHistory.confirm_status == 'Confirm' && (
                    <TouchableOpacity
                      onPress={() => {
                        PrePostEmailSendApi('pre', selectedHistory.id);  // Send selectedHistory.id
                      }}
                      style={{
                        backgroundColor: 'white',
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        borderColor: colors.Brown,
                        borderWidth: 1,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 20,
                        width: '48%', 
                        marginRight: 10, 
                        flexDirection: 'row',
                        gap: 10
                      }}
                      disabled={preLoading}  
                    >
                      {preLoading ? (
                        <ActivityIndicator size="small" color={colors.Brown} /> 
                      ) : (
                        <>
                          <AntDesign name='mail' color='black' size={20} />
                          <Text
                            style={{
                              color: 'black',
                              fontSize: 12,
                              fontWeight: 'bold',
                              fontFamily: 'Inter-Bold',
                              textTransform: 'uppercase'
                            }}
                          >
                            Pre Pdf Mail
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )} */}

                  {/* {selectedHistory.confirm_status == 'Confirm' && (
                    <TouchableOpacity
                      onPress={() => {
                        PrePostEmailSendApi('post', selectedHistory.id);  // Send selectedHistory.id
                      }}
                      style={{
                        backgroundColor: 'white',
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        borderColor: colors.Brown,
                        borderWidth: 1,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 20,
                        width: '48%', 
                        flexDirection: 'row',
                        gap: 10
                      }}
                      disabled={postLoading}  
                    >
                      {postLoading ? (
                        <ActivityIndicator size="small" color={colors.Brown} />  
                      ) : (
                        <>
                          <AntDesign name='mail' color='black' size={20} />
                          <Text
                            style={{
                              color: 'black',
                              fontSize: 12,
                              fontWeight: 'bold',
                              fontFamily: 'Inter-Bold',
                              textTransform: 'uppercase'
                            }}
                          >
                            Post Pdf Mail
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )} */}
                  {selectedHistory.confirm_status == 'Confirm' && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      {/* Pre Download PDF Button */}
                      {(
                        userType === 'SuperAdmin' ||
                        !permissions.pso_list ||
                        permissions.pso_list.prepostdownload
                      ) && (
                          <TouchableOpacity
                            onPress={PrePdfAfterMail}
                            style={{
                              backgroundColor: 'white',
                              paddingVertical: 12,
                              paddingHorizontal: 20,
                              borderColor: colors.Brown,
                              borderWidth: 1,
                              borderRadius: 8,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginTop: 20,
                              width: '48%',
                              marginRight: 10,
                              flexDirection: 'row',
                              gap: 10,
                            }}
                            disabled={PreMailLoading} // Disable button during loading
                          >
                            {PreMailLoading ? (
                              <ActivityIndicator size="small" color="black" /> // Loading spinner
                            ) : (
                              <AntDesign name="download" color="black" size={20} />
                            )}
                            <Text
                              style={{
                                color: 'black',
                                fontSize: 12,
                                fontWeight: 'bold',
                                fontFamily: 'Inter-Bold',
                                textTransform: 'uppercase',
                              }}
                            >
                              {PreMailLoading ? 'Processing...' : 'Pre PDF'} {/* Change text during loading */}
                            </Text>
                          </TouchableOpacity>
                        )}

                      {/* Post Download PDF Button */}
                      {(
                        userType === 'SuperAdmin' ||
                        !permissions.pso_list ||
                        permissions.pso_list.prepostdownload
                      ) && (
                          <TouchableOpacity
                            onPress={PostPdfAfterMail}
                            style={{
                              backgroundColor: 'white',
                              paddingVertical: 12,
                              paddingHorizontal: 20,
                              borderColor: colors.Brown,
                              borderWidth: 1,
                              borderRadius: 8,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginTop: 20,
                              width: '48%',
                              flexDirection: 'row',
                              gap: 10,
                            }}
                            disabled={PostMailLoading}
                          >
                            {PostMailLoading ? (
                              <ActivityIndicator size="small" color="black" />
                            ) : (
                              <AntDesign name="download" color="black" size={20} />
                            )}
                            <Text
                              style={{
                                color: 'black',
                                fontSize: 12,
                                fontWeight: 'bold',
                                fontFamily: 'Inter-Bold',
                                textTransform: 'uppercase',
                              }}
                            >
                              {PostMailLoading ? 'Processing...' : 'Post PDF'}
                            </Text>
                          </TouchableOpacity>
                        )}
                    </View>
                  )}
                </View>

              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Pso list Finance wise */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible2}
        onRequestClose={() => setModalVisible2(false)}
      >
        <TouchableOpacity style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
          activeOpacity={1}
          onPress={() => setModalVisible2(false)}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              width: '90%',
              paddingVertical: 5,
            }}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible2(false);

              }}
              style={{

                backgroundColor: 'white',
                borderRadius: 50,
              }}>
              <Entypo name="cross" size={25} color="black" />
            </TouchableOpacity>
          </View>
          <View style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            width: '90%',
            elevation: 5
          }}
            onStartShouldSetResponder={() => true} // Prevent modal from closing on content click
            onTouchEnd={e => e.stopPropagation()}>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>

              <Text style={{ fontSize: 16, fontFamily: 'Inter-Bold', marginBottom: 10, color: 'black' }}>Change Filter</Text>

            </View>

            {/* Dropdown Start */}
            <Text style={{ fontSize: 14, color: 'black', marginBottom: 5 }}>Finance List </Text>
            <View style={{ marginBottom: 10 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: 'white',
                  padding: 12,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderColor: errorMessage ? 'red' : '#ddd',
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

                  {filteredData.length > 0 ? (
                    <FlatList
                      style={{ maxHeight: 150 }}
                      data={filteredData}
                      keyExtractor={(item) => item.finance_id.toString()}
                      renderItem={renderItem2}
                      keyboardShouldPersistTaps="handled"
                    />
                  ) : (
                    <View style={{ height: 150, justifyContent: 'center', alignItems: 'center' }}>
                      <Image source={Finance} style={{ width: 50, height: 50 }} />
                      <Text style={{ fontFamily: 'Inter-Regular', color: 'red', marginTop: 10 }}>
                        No Finance Found
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {errorMessage ? (
              <Text style={{ color: 'red', marginBottom: 5, fontFamily: 'Inter-Regular' }}>
                {errorMessage}
              </Text>
            ) : null}


            <Text style={{ fontSize: 14, marginBottom: 5, color: 'black', fontFamily: 'Inter-Regular' }}>From Date</Text>
            <TouchableOpacity
              onPress={() => setShowFromPicker(true)}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                padding: 10,
                borderRadius: 5,
                marginBottom: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 5
              }}
            >
              <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>{fromDate ? formatDate2(fromDate) : 'DD-MM-YYYY'}</Text>
              <Ionicons
                name="calendar"
                size={20}
                color="black"
                style={{ marginRight: 10 }}
              />
            </TouchableOpacity>

            {fromErrorMessage ? (
              <Text style={{ color: 'red', marginBottom: 5, fontFamily: 'Inter-Regular' }}>
                {fromErrorMessage}
              </Text>
            ) : null}

            <Text style={{ fontSize: 14, marginBottom: 5, color: 'black', fontFamily: 'Inter-Regular' }}>Till Date</Text>
            <TouchableOpacity
              onPress={() => setShowToPicker(true)}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                padding: 10,
                borderRadius: 5,
                marginBottom: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 5
              }}
            >
              <Text style={{ color: 'black', fontFamily: 'Inter-Regular' }}>{toDate ? formatDate2(toDate) : 'DD-MM-YYYY'}</Text>
              <Ionicons
                name="calendar"
                size={20}
                color="black"
                style={{ marginRight: 10 }}
              />
            </TouchableOpacity>

            {toDateErrorMessage ? (
              <Text style={{ color: 'red', marginBottom: 5, fontFamily: 'Inter-Regular' }}>
                {toDateErrorMessage}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, width: '100%', alignItems: 'center', marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible2(false);
                  setIsDropdownVisible(false);
                  setErrorMessage('');
                  setFromErrorMessage('');
                  setToDateErrorMessage('');
                  setSelectedType('');
                  setFromDate('');
                  setToDate('');

                }}
                style={{
                  padding: 10, width: '40%', backgroundColor: 'white',
                  borderWidth: 1, borderColor: 'red',
                  padding: 15,
                  borderRadius: 8,
                  alignItems: 'center',

                  width: '40%'
                }}
              >
                <Text style={{ color: 'red', fontFamily: 'Inter-Bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: 'white',
                  borderWidth: 1, borderColor: 'green',
                  padding: 15,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: '40%'
                }}
                onPress={async () => {

                  if (!selectedType || !fromDate || !toDate) {
                    // Set individual error messages
                    if (!selectedType) {
                      setErrorMessage('Finance name is required');
                    }
                    if (!fromDate) {
                      setFromErrorMessage('From Date is required');
                    }
                    if (!toDate) {
                      setToDateErrorMessage('To Date is required');
                    }
                    return;
                  }

                  setErrorMessage('');
                  setFromErrorMessage('');
                  setToDateErrorMessage('');
                  setModalVisible2(false);
                  setIsDropdownVisible(false);


                  const payload = {
                    finance_name: selectedType,
                    from_date: fromDate,
                    end_date: toDate,
                  };

                  // Simple validation


                  await intimationList(payload);
                  setResetButtonVisible(true)
                }}>
                <Text
                  style={{
                    color: 'green',
                    fontSize: 16,
                    fontFamily: 'Inter-Bold',
                  }}>
                  Apply
                </Text>
              </TouchableOpacity>


            </View>

            {/* FROM DateTime Picker */}
            {showFromPicker && (
              <DateTimePicker
                value={fromDate ? new Date(fromDate) : new Date()} // Use existing fromDate if available, else today
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowFromPicker(false);
                  if (event.type === 'set' && selectedDate) {
                    // Only set the date when user confirms (not when cancelled)
                    setFromDate(formatDate(selectedDate));
                  }
                  // If event.type is 'dismissed' or 'cancel', do nothing
                }}
              />
            )}

            {/* TO DateTime Picker */}
            {showToPicker && (
              <DateTimePicker
                value={toDate ? new Date(toDate) : new Date()} // Use existing toDate if available
                mode="date"
                display="default"
                maximumDate={new Date()}
                minimumDate={fromDate ? new Date(fromDate) : new Date()}
                onChange={(event, selectedDate) => {
                  setShowToPicker(false);
                  if (selectedDate && event.type !== 'dismissed') {
                    // Only set date when user confirms, not when cancels
                    setToDate(formatDate(selectedDate));
                  }
                }}
              />
            )}

          </View>
        </TouchableOpacity>
      </Modal>



      {/* Sticky Add New Button */}

      {(
        userType === 'SuperAdmin' ||
        !permissions.pso_list ||
        permissions.pso_list.insert
      ) && (
          <View
            style={{
              position: 'absolute',
              bottom: 20,
              right: 30,
              width: 60, // Set the width and height equal for a perfect circle
              height: 60, // Set height equal to the width
              zIndex: 1,
            }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.Brown,
                borderRadius: 30, // Set borderRadius to half of width/height for a circle
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                gap: 7,
              }}
              onPress={() => {
                navigation.navigate('SearchVehicle');
              }}>
              <AntDesign name="plus" color="white" size={18} />
            </TouchableOpacity>

          </View>
        )}

    </View>
  )
}

export default ListingScreen

const styles = StyleSheet.create({})
