import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import Share from "react-native-share";
import RNFetchBlob from 'react-native-blob-util';
import colors from "../CommonFiles/Colors";
import { useNavigation } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { ENDPOINTS } from "../CommonFiles/Constant";

const WebviewScreen = ({ route }) => {
  const { type, userId } = route.params;
  const webRef = useRef(null);
  const [userData, setUserData] = useState([])
  console.log("userdata ye ha ok", userData);
  const navigation = useNavigation();


  const pdfUrl = ENDPOINTS.ICard(userId, type);
  console.log("pdfUrl", pdfUrl);

  const fileName = `icard_${userId}_${type}.pdf`;

  const apiUrl = ENDPOINTS.ICardApi(userId, type);
  console.log("pdfUrl", apiUrl);

  // ✅ Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);
        setUserData(data.data);
      } catch (err) {
        console.log("Error fetching user data:", err);
        Alert.alert("Error", "Unable to fetch user data");
      }
    };

    fetchUserData();
  }, [apiUrl]);


  // Storage permission (Android < 11)
  const requestPermission = async () => {
    if (Platform.OS === "android" && Platform.Version < 30) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "App needs access to your storage to download/share files",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // ✅ Fetch HTML content from server

  const fetchHtmlContent = async () => {
    try {
      let html = await RNFetchBlob.fetch('GET', pdfUrl).then(res => res.text());
      console.log("Server response preview:", html.slice(0, 200));

      // Server ka base URL nikal lo
      const baseUrl = pdfUrl.split('/').slice(0, 3).join('/');

      // 1. HTML se <img src="..."> URLs nikaalo
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      const matches = [...html.matchAll(imgRegex)];

      for (const match of matches) {
        const imgUrl = match[1];

        // Ignore data URLs jo already base64 me hai
        if (imgUrl.startsWith("data:")) continue;

        // Relative URL ko absolute URL me convert karo
        const fullImgUrl = imgUrl.startsWith('https') ? imgUrl : `${baseUrl}/${imgUrl}`;

        try {
          // RNFetchBlob se image ko base64 me fetch karo
          const base64 = await RNFetchBlob.fetch('GET', fullImgUrl).then(resp => resp.base64());

          // HTML me original URL ko base64 se replace karo
          html = html.replace(imgUrl, `data:image/png;base64,${base64}`);
        } catch (err) {
          console.log("Error fetching image:", imgUrl, err);
        }
      }

      return html;
    } catch (err) {
      console.log("Error fetching HTML:", err);
      Alert.alert("Error", "Cannot fetch HTML from server");
      return null;
    }
  };




  // ✅ Convert HTML → PDF
  const htmlToPDF = async (htmlContent) => {
    try {
      const options = {
        html: htmlContent,
        fileName: `icard_${userId}_${type}`,
        directory: "Documents",
      };
      const file = await RNHTMLtoPDF.convert(options);

      return file.filePath;
    } catch (err) {
      console.log("Error generating PDF:", err);
      Alert.alert("Error", "Cannot generate PDF");
      return null;
    }
  };


  const generateICardHtml = (userData) => {

    const isKanha = type?.toLowerCase() === "kanha";
    const isMJS = type?.toLowerCase() === "mjs";

    // 🎨 Colors set karo
    const primaryColor = isKanha ? "#3b78f7" : "#b61827";
    const headerBg = isKanha
      ? primaryColor
      : "linear-gradient(to right, #b61827, #0d47a1)";
    const footerBg = isKanha
      ? primaryColor
      : "#b61827";
    const bottomBarBg = isKanha
      ? primaryColor
      : "linear-gradient(to right, #0d47a1, #b61827)";
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #f2f2f2;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 10px;
      }
      .id-card-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: center;
      }
      .id-card {
        width: 320px;
        background: #fff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        text-align: center;
     
      }
      .header {
             background: ${headerBg};
        color: #fff;
        padding: 12px;
        font-size: 20px;
        font-weight: bold;
      }
      .photo {
        margin: 20px 0;
      }
      .photo img {
        width: 120px;
        height: 120px;
        object-fit: cover;
       border: 3px solid ${primaryColor};
        border-radius: 8px;
      }
      .details {
        text-align: left;
        padding: 0 20px 20px;
        font-size: 15px;
        min-height: 120px;
      }
      .details p {
        margin: 6px 0;
      }
.footer {
  background: ${footerBg};
  color: #fff;

  width: 100%;
  padding: 10px 20px;
  font-size: 13px;
  display: flex;
  justify-content: space-between; /* left & right space */
  align-items: center;

}

.footer .left {
  display: flex;
  align-items: center;

  padding: 5px 10px;
  border-radius: 6px;
   margin-left: 20px; /* 👈 right margin */
}
   .footer .left .logo {
  height: 50px;  /* bada logo */
  width: auto;
}

/* Right side */
.footer .right {
  display: flex;
  align-items: center;

  padding: 5px 10px;
  border-radius: 6px;
  margin-right: 40px; /* 👈 right margin */
}

.footer .logo {
  height: 40px; /* 👈 logo bada */
  width: auto;
}

.footer .type-text {
  font-size: 22px;
  font-weight: bold;
   text-transform: uppercase; 
}

.footer .signature {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 11px;
}

.footer .signature-img {
  width: 60px;
  height: auto;
  margin-bottom: 2px;
}

.footer .signature-text {
  font-size: 13px;
}


      /* Back Card */
      .back-card {
        padding: 15px;
        text-align: left;
        font-size: 14px;
      }
      .back-card .head-office {
        font-weight: bold;
    color: ${primaryColor};
        margin-bottom: 6px;
      }
      .back-card address {
        font-style: normal;
        margin-bottom: 12px;
      }
      .instruction-title {
        background: ${primaryColor};
        color: #fff;
        padding: 6px 10px;
        border-radius: 6px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 10px;
      }
      .instruction-box {
        border: 1px solid #222;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 15px;
      }
      .instruction-box ul {
        padding-left: 20px;
        margin: 0;
      }
      .instruction-box ul li {
        margin-bottom: 6px;
        list-style-type: disc;
      }
      .validity {
  margin-top: 8px;
  font-size: 13px;

}
      .bottom-bar {
  background: ${bottomBarBg};
  padding: 8px 12px;
  color: #fff;
  font-weight: bold;
  border-radius: 0 0 10px 10px;

  display: flex;
  justify-content: space-between; /* left & right */
  align-items: center;
}

.bottom-bar .left {
  display: flex;
  align-items: center;
}

.bottom-bar .left .logo {
  height: 50px;  /* bada logo */
  width: auto;
}

.bottom-bar .left .type-text {
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
}

.bottom-bar .right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;              /* 👈 issuer ko zyada space dene ke liye */
    /* optional: left spacing from logo/type */
}

.bottom-bar .issuer-name {
  font-size: 16px;
  font-weight: bold;
  text-align: right;
  margin-right: 30px;
}

    </style>
  </head>
  <body>
    <div class="id-card-container">
      
      <!-- Front Side -->
      <div class="id-card">
        <div class="header">${userData.issuer || ""}</div>
        <div class="photo">
          <img src="${userData.image_url}" alt="${userData.name}" />
        </div>
        <div class="details">
          <p><strong>ID No:</strong> ${userData.id_number}</p>
          <p><strong>Name:</strong> ${userData.name}</p>
          <p><strong>Mob. No:</strong> ${userData.mobile || "---"}</p>
        </div>
 <div class="footer">
  <!-- Left side -->
  <div class="left">
    ${isKanha
        ? `<img src="${userData.logo_image_url}" alt="Logo" class="logo" />`
        : `<div class="type-text">${type}</div>`
      }
  </div>

  <!-- Right side -->
  <div class="right">
    ${userData.signature_image_url
        ? `<div class="signature">
            <img src="${userData.signature_image_url}" alt="Signature" class="signature-img" />
         <div class="signature-text">Authorised Signature</div>
         </div>`
        : `<div class="signature-text">Authorised Signature</div>`
      }
  </div>
</div>


      </div>

      <!-- Back Side -->
      <div class="id-card">
        <div class="back-card">
          <div class="head-office">Head Office:</div>
          <address>
            ${userData.address || "Office Address"}<br>
            <strong>Email:</strong> ${userData.email || "---"}
          </address>
          <div class="instruction-title">INSTRUCTION</div>
          <div class="instruction-box">
            <ul>
              <li>This card is the property of <strong>${userData.issuer}</strong>.</li>
              <li>This is digital id card authorised by Maa Jagdamba Service. Physical copy is not required.</li>
              <li>This card is valid in India.</li>
            </ul>
          <div class="validity">
  This card is valid <br>
  From: ${userData.valid_from} To: ${userData.valid_to}
</div>
          </div>
        </div>
       <div class="bottom-bar">
  <!-- Left side -->
  <div class="left">
    ${isKanha
        ? `<img src="${userData.logo_image_url}" alt="Logo" class="logo" />`
        : `<div class="type-text">${type}</div>`
      }
  </div>

  <!-- Right side -->
  <div class="right">
    <div class="issuer-name">${userData.issuer || ""}</div>
  </div>
</div>

      </div>

    </div>
  </body>
  </html>
  `;
  };




  // Download PDF
  const handleDownload = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert("Permission Required", "Storage permission is needed to download files.");
      return;
    }

    const htmlContent = await fetchHtmlContent();
    if (!htmlContent) return;

    const pdfPath = await htmlToPDF(htmlContent);
    if (!pdfPath) return;

    Alert.alert("Download Complete", `PDF saved at: ${pdfPath}`);
  };

  // Share PDF
  // const handleShare = async () => {
  //     const hasPermission = await requestPermission();
  //     if (!hasPermission) {
  //         Alert.alert("Permission Required", "Storage permission is needed to share files.");
  //         return;
  //     }

  //     const htmlContent = await fetchHtmlContent();
  //     if (!htmlContent) return;

  //     const pdfPath = await htmlToPDF(htmlContent);
  //     if (!pdfPath) return;

  //     try {
  //         await Share.open({
  //             url: `file://${pdfPath}`,
  //             type: "application/pdf",
  //             failOnCancel: false,
  //         });
  //     } catch (err) {
  //         console.log("Error sharing PDF:", err);
  //         Alert.alert("Error", err.message);
  //     }
  // };

  const handleShare = async () => {
    const htmlContent = generateICardHtml(userData); // apna HTML use karo
    const pdfPath = await htmlToPDF(htmlContent);
    if (!pdfPath) return;

    try {
      await Share.open({
        url: `file://${pdfPath}`,
        type: "application/pdf",
        failOnCancel: false,
      });
    } catch (err) {
      console.log("Error sharing PDF:", err);
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 15,
            left: 15,
            width: '13%',
          }}
          onPress={() => {
            navigation.goBack();
          }}>
          <Ionicons name="arrow-back" color="white" size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PDF Viewer</Text>


        <View
          style={{
            width: '15%',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            right: 6,
            top: 16,

          }}>

          <TouchableOpacity onPress={handleShare}>
            <Icon name="share" size={24} color="#fff" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>
      {/* WebView HTML preview */}
      <WebView
        ref={webRef}
        source={{ uri: pdfUrl }}
        style={{ flex: 1 }}
        originWhitelist={["*"]}
        startInLoadingState={true}
      />

      {/* Download Button */}
      {/* <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                <Text style={styles.btnText}>Download PDF</Text>
            </TouchableOpacity> */}

      {/* Share Button */}
      {/* <TouchableOpacity
        style={[styles.downloadBtn]}
        onPress={handleShare}
      >
        <Text style={styles.btnText}>Share PDF</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  downloadBtn: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 5,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  header: {
    height: 60,
    backgroundColor: colors.Brown, // Purple color
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    elevation: 4, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WebviewScreen;
