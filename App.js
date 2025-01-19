import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Button, 
  TextInput, 
  Alert, 
  Modal, 
  Image,
  
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { Camera, CameraView } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { emsStations } from "./emsStations";

export default function App() {
  const [location, setLocation] = React.useState(null);
  const [locationOn, setLocationOn] = React.useState(false);
  const [emsStationsArray, setEmsStations] = React.useState([]);
  const [inputLatitude, setInputLatitude] = React.useState("");
  const [inputLongitude, setInputLongitude] = React.useState("");
  const [inputIncident, setInputIncident] = React.useState("");
  const [inputDescription, setInputDescription] = React.useState("");
  const [incidentArray, setIncidentArray] = React.useState([]);

  // Camera state
  const [modalVisible, setModalVisible] = React.useState(false);
  const cameraRef = React.useRef(null);
  const [photoTaken, setPhotoTaken] = React.useState(null);
  const [selectedImage, setSelectedImage] = React.useState(null);

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need your permission to access the camera!");
      return false;
    }
    return true;
  };

  // Open camera modal
  const openCamera = async () => {
    if (await requestCameraPermission()) {
      setModalVisible(true);
    }
  };

  // Capture photo and save to gallery
  const capturePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (granted) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        Alert.alert("Photo saved to your gallery!");
        setPhotoTaken(photo.uri);
      } else {
        Alert.alert("Permission to save photos is required.");
      }
    }
  };

  // Handle marker press
  const handleMarkerPress = (incident) => {
    if (incident.photoUri) {
      setSelectedImage(incident.photoUri);
    }
  };

  // Close image modal
  const closeModal = () => setSelectedImage(null);

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Geolocation has failed and no pin will be inserted");
        return;
      }
      if (locationOn) {
        setLocationOn(false);
      } else {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        setLocationOn(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Add EMS stations to the map
  const putEmsStationsOnMap = () => {
    const stations = emsStations.features.map((station) => ({
      latitude: station.geometry.coordinates[1],
      longitude: station.geometry.coordinates[0],
      title: station.properties.STATION_NAME,
      description: "EMS Station",
      color: "#0D7AAF",
    }));
    setEmsStations(stations);
  };

  // Report incident
  const reportIncident = () => {
    const latitude = parseFloat(inputLatitude);
    const longitude = parseFloat(inputLongitude);

    if (isNaN(latitude) || isNaN(longitude) || !inputIncident || !inputDescription) {
      Alert.alert("Invalid input data. No pin will be inserted.");
      return;
    }

    setIncidentArray((prev) => [
      ...prev,
      {
        latitude,
        longitude,
        title: inputIncident,
        description: inputDescription,
        color: "red",
        photoUri: photoTaken,
      },
    ]);

    setInputLatitude("");
    setInputLongitude("");
    setInputIncident("");
    setInputDescription("");
    setPhotoTaken(null);
  };

  // Clear all markers
  const clearMarkers = () => {
    setLocation(null);
    setEmsStations([]);
    setIncidentArray([]);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 43.2555,
          longitude: -79.87329,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {locationOn && location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Current Location"
            pinColor="black"
          />
        )}

        {emsStationsArray.map((station, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: station.latitude,
              longitude: station.longitude,
            }}
            title={station.title}
            pinColor={station.color}
          />
        ))}

        {incidentArray.map((incident, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: incident.latitude,
              longitude: incident.longitude,
            }}
            title={incident.title}
            description={incident.description}
            pinColor={incident.color}
            onPress={() => handleMarkerPress(incident)}
          />
        ))}
      </MapView>

      <View style={styles.buttonContainer}>
        <View style={[styles.button, { backgroundColor: "black" }]}>
              <Button title="Geolocation" onPress={getCurrentLocation} color={"white"} accessibilityLabel="Get Current Location" />
            </View>
            <View style={styles.button}>
              <Button title="EMS Stations" onPress={putEmsStationsOnMap} color={"white"} />
            </View>
            <View style={[styles.button, { backgroundColor: "green" }]}>
              <Button title="Clear" onPress={clearMarkers} color={"white"} />
            </View>
      </View>

      <View style={styles.inputs}>
        <TextInput placeholder="Latitude" value={inputLatitude} onChangeText={setInputLatitude} style={styles.input} />
        <TextInput placeholder="Longitude" value={inputLongitude} onChangeText={setInputLongitude} style={styles.input} />
        <TextInput placeholder="Incident" value={inputIncident} onChangeText={setInputIncident} style={styles.input} />
        <TextInput placeholder="Description" value={inputDescription} onChangeText={setInputDescription} style={styles.input} />
        <Button title="Report Incident" onPress={reportIncident} />
        <Button title="Take Incident Photo" onPress={openCamera} />
      </View>

      {modalVisible && (
        <Modal animationType="slide">
          <CameraView ref={cameraRef} style={styles.camera}>
            <View style={{marginTop: 30 }}>
               <Button title="Capture Photo" onPress={capturePhoto} />
            </View>
            <Button title="Close Camera" onPress={() => setModalVisible(false)} />
          </CameraView>
        </Modal>
      )}

      {selectedImage && (
        <Modal animationType="slide">
          <View style={styles.modalContent}>
            <Image source={{ uri: selectedImage }} style={styles.image} />
            <Button title="Close" onPress={closeModal} />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    height: "60%",
    width: Dimensions.get("window").width,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#0D7AAF",
  },
  inputs: {
    marginHorizontal:  20,
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
  camera: {
    flex: 1,
    justifyContent: "space-between",
  },
  modalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
});

