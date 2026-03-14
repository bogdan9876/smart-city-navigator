import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import axios from 'axios';

const DESTINATIONS = [
  { id: 1, name: "Політехніка", lat: 49.8356, lng: 24.0144 },
  { id: 2, name: "Форум Львів", lat: 49.8498, lng: 24.0223 },
  { id: 3, name: "Вокзал", lat: 49.8397, lng: 23.9945 }
];

export default function HomeScreen() {
  const [route, setRoute] = useState([]);
  const [advice, setAdvice] = useState<any>(null);
  const [selectedDestId, setSelectedDestId] = useState<number | null>(null);
  const [liveTrafficData, setLiveTrafficData] = useState<{ phase: string, timeLeft: number, speed: number } | null>(null);

  const userLoc = { latitude: 49.8450, longitude: 24.0250 };

  useEffect(() => {
    if (!selectedDestId) return;

    const dest = DESTINATIONS.find(d => d.id === selectedDestId);
    if (!dest) return;

    const getRoadData = async () => {
      try {
        console.log(`ПОЧАТОК: Ти натиснув на кнопку "${dest.name}"`);
        const url = `http://192.168.1.96:3000/traffic/advice?lat=${userLoc.latitude}&lng=${userLoc.longitude}&destLat=${dest.lat}&destLng=${dest.lng}`;
        console.log("ВІДПРАВЛЯЮ ЗАПИТ НА БЕКЕНД");

        const res = await axios.get(url);
        const data = res.data;
        setAdvice(data);

        if (data.routeCoords) {
          console.log(`МАЛЮЮ МАРШРУТ: Отримано ${data.routeCoords.length} точок для лінії.`);
          const coords = data.routeCoords.map((c: any) => ({
            latitude: c[1],
            longitude: c[0]
          }));
          setRoute(coords);
          console.log("УСПІХ: Лінія має з'явитися на екрані!");
        } else {
          console.log("УВАГА: Бекенд не надіслав координати для лінії (routeCoords порожній).");
        }
      } catch (error: any) {
        console.error("\n!!! ПОМИЛКА ЗВ'ЯЗКУ !!!");
        console.error("Що саме пішло не так:", error.message);
      }
    };

    getRoadData();
  }, [selectedDestId]);

  useEffect(() => {
    if (!advice || !advice.hasLight || !advice.targetLight) {
      setLiveTrafficData(null);
      return;
    }

    const light = advice.targetLight;
    const distance = advice.distanceMeters;

    const updateTrafficData = () => {
      const now = Date.now();
      const cycle = (light.green + light.red) * 1000;
      const elapsed = (now - light.start) % cycle;
      const isGreen = elapsed < light.green * 1000;

      const timeLeft = isGreen
        ? (light.green * 1000 - elapsed) / 1000
        : (cycle - elapsed) / 1000;

      const speedMps = distance / timeLeft;

      setLiveTrafficData({
        phase: isGreen ? 'GREEN' : 'RED',
        timeLeft: Math.round(timeLeft),
        speed: Math.round(speedMps * 3.6)
      });
    };

    updateTrafficData();

    const timer = setInterval(updateTrafficData, 2000);

    return () => clearInterval(timer);
  }, [advice]);

  const selectedDest = DESTINATIONS.find(d => d.id === selectedDestId);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={{ ...userLoc, latitudeDelta: 0.04, longitudeDelta: 0.04 }}>
        <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
        <Marker coordinate={userLoc} title="Моє авто" pinColor="blue" />
        {selectedDest && (
          <Marker coordinate={{ latitude: selectedDest.lat, longitude: selectedDest.lng }} title={selectedDest.name} pinColor="purple" />
        )}
        {advice?.hasLight && advice?.targetLight && (
          <Marker
            coordinate={{ latitude: advice.targetLight.lat, longitude: advice.targetLight.lng }}
            title="Світлофор на шляху"
            pinColor={liveTrafficData?.phase === 'GREEN' ? 'green' : 'red'}
          />
        )}
        {route.length > 0 && <Polyline coordinates={route} strokeColor="blue" strokeWidth={4} />}
      </MapView>
      <View style={styles.panel}>
        <View style={styles.buttonsRow}>
          {DESTINATIONS.map(dest => (
            <TouchableOpacity
              key={dest.id}
              style={[styles.button, selectedDestId === dest.id && styles.buttonActive]}
              onPress={() => setSelectedDestId(dest.id)}
            >
              <Text style={selectedDestId === dest.id ? styles.textActive : styles.textInactive}>
                {dest.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {advice?.error ? (
          <Text style={{ fontSize: 18, color: 'red', textAlign: 'center', fontWeight: 'bold' }}>
            {advice.error}
          </Text>
        ) : advice?.hasLight ? (
          liveTrafficData ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 10 }}>
              <View style={{ padding: 10 }}> 
                <View style={styles.trafficLightBody}>
                  <View style={styles.lensBox}>
                    <View style={[styles.lens, liveTrafficData.phase === 'RED' ? styles.redOn : styles.redOff]} />
                  </View>
                  <View style={styles.lensBox}>
                    <View style={[styles.lens, styles.yellowOff]} />
                  </View>
                  <View style={[styles.lensBox, { marginBottom: 0 }]}>
                    <View style={[styles.lens, liveTrafficData.phase === 'GREEN' ? styles.greenOn : styles.greenOff]} />
                  </View>
                </View>
              </View>

              <View style={{ flex: 1, paddingLeft: 15 }}>
                <Text style={styles.text}>До перехрестя: {advice.distanceMeters} м</Text>
                <Text style={{ 
                  fontSize: 45, 
                  fontWeight: 'bold', 
                  color: liveTrafficData.phase === 'GREEN' ? '#2ecc71' : '#e74c3c' 
                }}>
                  {liveTrafficData.timeLeft} сек
                </Text>
                <Text style={styles.text}>Тримай швидкість:</Text>
                <Text style={styles.speed}>{liveTrafficData.speed} км/год</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.text}>Синхронізація зі світлофором...</Text>
          )
        ) : advice?.routeCoords ? (
          <Text style={styles.speed}>Світлофорів на шляху немає. Гарної поїздки!</Text>
        ) : selectedDestId ? (
          <Text style={styles.text}>Будую маршрут...</Text>
        ) : (
          <Text style={styles.text}>Оберіть пункт призначення зверху</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  panel: { padding: 20, backgroundColor: 'white', paddingBottom: 40 },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  button: { padding: 10, borderRadius: 8, backgroundColor: '#f0f0f0', flex: 1, marginHorizontal: 5, alignItems: 'center' },
  buttonActive: { backgroundColor: '#3498db' },
  textInactive: { color: 'black' },
  textActive: { color: 'white', fontWeight: 'bold' },
  text: { fontSize: 18 },
  speed: { fontSize: 20, fontWeight: 'bold', marginTop: 10, color: '#2ecc71', textAlign: 'center' },
  trafficLightBody: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 10,
  },
  lensBox: {
    backgroundColor: '#0a0a0a',
    padding: 6,
    borderRadius: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  lens: {
    width: 45,
    height: 45,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.6)',
  },
  redOff: { backgroundColor: '#4a0000' },
  redOn: {
    backgroundColor: '#ff1a1a',
    shadowColor: '#ff1a1a',
    shadowRadius: 15,
    shadowOpacity: 1,
    elevation: 20
  },
  yellowOff: { backgroundColor: '#4a3b00' },
  yellowOn: {
    backgroundColor: '#ffcc00',
    shadowColor: '#ffcc00',
    shadowRadius: 15,
    shadowOpacity: 1,
    elevation: 20
  },
  greenOff: { backgroundColor: '#003300' },
  greenOn: {
    backgroundColor: '#00ff00',
    shadowColor: '#00ff00',
    shadowRadius: 15,
    shadowOpacity: 1,
    elevation: 20
  },
});