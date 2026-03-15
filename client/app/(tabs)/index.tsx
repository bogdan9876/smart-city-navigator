import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Keyboard, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Dashboard from '@/components/Dashboard';
import SearchScreen from '@/components/SearchScreen';
import { useLocation } from '@/hooks/useLocation';
import { useTrafficLight } from '@/hooks/useTrafficLight';
import { getBearing } from '@/utils/locationUtils';

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const { userLoc, errorMsg } = useLocation();
  const [route, setRoute] = useState<any[]>([]);
  const [advice, setAdvice] = useState<any>(null);
  const [destination, setDestination] = useState<{ name: string, lat: number, lng: number } | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isDrivingMode, setIsDrivingMode] = useState(false);

  const liveTrafficData = useTrafficLight(advice);

  const clearRoute = () => {
    setDestination(null);
    setRoute([]);
    setAdvice(null);
    setIsDrivingMode(false);

    if (mapRef.current && userLoc) {
      mapRef.current.animateCamera({
        center: userLoc, pitch: 0, heading: 0, altitude: 4000, zoom: 14,
      }, { duration: 1000 });
    }
  };

  const handleSelectPlace = (placeData: any) => {
    Keyboard.dismiss();
    setIsSearchActive(false);
    setIsDrivingMode(false);
    setDestination(placeData);
  };

  const handleStartDrive = () => {
    setIsDrivingMode(true);
    if (!userLoc) return;

    let heading = 0;
    if (route.length > 1) {
      heading = getBearing(userLoc, route[1]);
    } else if (destination) {
      heading = getBearing(userLoc, { latitude: destination.lat, longitude: destination.lng });
    }

    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: userLoc, pitch: 60, heading: heading, altitude: 300, zoom: 17.5,
      }, { duration: 1500 });
    }
  };

  useEffect(() => {
    if (!destination || !userLoc) return;
    const getRoadData = async () => {
      try {
        const url = `${process.env.EXPO_PUBLIC_API_URL}/traffic/advice?lat=${userLoc.latitude}&lng=${userLoc.longitude}&destLat=${destination.lat}&destLng=${destination.lng}`;
        const res = await axios.get(url);
        setAdvice(res.data);
        if (res.data.routeCoords) {
          const newRoute = res.data.routeCoords.map((c: any) => ({ latitude: c[1], longitude: c[0] }));
          setRoute(newRoute);

          if (mapRef.current) {
            mapRef.current.animateCamera({ pitch: 0, heading: 0 }, { duration: 500 });
          }

          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.fitToCoordinates(newRoute, {
                edgePadding: {
                  top: 50,
                  right: 50,
                  bottom: 100,
                  left: 50
                },
                animated: true,
              });
            }
          }, 1000);
        }
      } catch (error: any) {
        console.error("Помилка зв'язку з бекендом:", error.message);
      }
    };
    getRoadData();
  }, [destination]);

  if (!userLoc) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ecf0f1' }]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 20, fontSize: 18, fontWeight: 'bold', color: '#2c3e50' }}>Шукаємо супутники GPS...</Text>
        {errorMsg && <Text style={{ color: 'red', marginTop: 10 }}>{errorMsg}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="mutedStandard"
        initialRegion={{ ...userLoc, latitudeDelta: 0.04, longitudeDelta: 0.04 }}
      >
        <Marker coordinate={userLoc} title="Моє авто" pinColor="blue" />

        {destination && <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} title={destination.name} pinColor="purple" />}

        {advice?.hasLight && advice?.targetLight && (
          <Marker
            coordinate={{ latitude: advice.targetLight.lat, longitude: advice.targetLight.lng }}
            title="Світлофор на шляху"
            pinColor={liveTrafficData?.phase === 'GREEN' ? 'green' : 'red'}
          />
        )}

        {route.length > 0 && <Polyline coordinates={route} strokeColor="#3498db" strokeWidth={5} />}
      </MapView>

      {!isSearchActive && (
        <Dashboard
          destination={destination}
          advice={advice}
          liveTrafficData={liveTrafficData}
          onOpenSearch={() => setIsSearchActive(true)}
          onClearRoute={clearRoute}
          isDrivingMode={isDrivingMode}
          onStartDrive={handleStartDrive}
        />
      )}

      {isSearchActive && (
        <SearchScreen onClose={() => setIsSearchActive(false)} onSelect={handleSelectPlace} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});