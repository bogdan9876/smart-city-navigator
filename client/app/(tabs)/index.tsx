import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Keyboard } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Dashboard from '@/components/Dashboard';
import SearchScreen from '@/components/SearchScreen';
import axios from 'axios';

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);

  const [route, setRoute] = useState<any[]>([]);
  const [advice, setAdvice] = useState<any>(null);
  const [destination, setDestination] = useState<{ name: string, lat: number, lng: number } | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [liveTrafficData, setLiveTrafficData] = useState<{ phase: string, timeLeft: number, speed: number } | null>(null);

  const userLoc = { latitude: 49.8450, longitude: 24.0250 };

  const getBearing = (start: { latitude: number, longitude: number }, end: { latitude: number, longitude: number }) => {
    const toRad = (val: number) => (val * Math.PI) / 180;
    const toDeg = (val: number) => (val * 180) / Math.PI;

    const lat1 = toRad(start.latitude);
    const lon1 = toRad(start.longitude);
    const lat2 = toRad(end.latitude);
    const lon2 = toRad(end.longitude);

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

    const bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
  };

  const clearRoute = () => {
    setDestination(null);
    setRoute([]);
    setAdvice(null);
    setLiveTrafficData(null);
    setIsDrivingMode(false);

    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: userLoc,
        pitch: 0,
        heading: 0,
        altitude: 4000,
        zoom: 14,
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

    let heading = 0;
    if (route.length > 1) {
      heading = getBearing(userLoc, route[1]);
    } else if (destination) {
      heading = getBearing(userLoc, { latitude: destination.lat, longitude: destination.lng });
    }

    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: userLoc,
        pitch: 60,
        heading: heading,
        altitude: 300,
        zoom: 17.5,
      }, { duration: 1500 });
    }
  };

  useEffect(() => {
    if (!destination) return;
    const getRoadData = async () => {
      try {
        const url = `http://192.168.1.55:3000/traffic/advice?lat=${userLoc.latitude}&lng=${userLoc.longitude}&destLat=${destination.lat}&destLng=${destination.lng}`;
        const res = await axios.get(url);
        setAdvice(res.data);
        if (res.data.routeCoords) {
          setRoute(res.data.routeCoords.map((c: any) => ({ latitude: c[1], longitude: c[0] })));
        }
      } catch (error: any) {
        console.error("Помилка зв'язку з бекендом:", error.message);
      }
    };
    getRoadData();
  }, [destination]);

  useEffect(() => {
    if (!advice || !advice.hasLight || !advice.targetLight) return setLiveTrafficData(null);

    const light = advice.targetLight;
    const distance = advice.distanceMeters;

    const updateTrafficData = () => {
      const now = Date.now();
      const cycle = (light.green + light.red) * 1000;
      const elapsed = (now - light.start) % cycle;
      const isGreen = elapsed < light.green * 1000;
      const timeLeft = isGreen ? (light.green * 1000 - elapsed) / 1000 : (cycle - elapsed) / 1000;
      setLiveTrafficData({
        phase: isGreen ? 'GREEN' : 'RED',
        timeLeft: Math.round(timeLeft),
        speed: Math.round((distance / timeLeft) * 3.6)
      });
    };

    updateTrafficData();
    const timer = setInterval(updateTrafficData, 1000);
    return () => clearInterval(timer);
  }, [advice]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="mutedStandard"
        showsCompass={false}
        showsBuildings={true}
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
        <SearchScreen
          onClose={() => setIsSearchActive(false)}
          onSelect={handleSelectPlace}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});