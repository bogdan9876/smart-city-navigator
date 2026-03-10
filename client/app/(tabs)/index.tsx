import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import axios from 'axios';

const ALL_LIGHTS = [
  { id: 1, name: "Оперний", lat: 49.8440, lng: 24.0260 },
  { id: 2, name: "Пл. Ринок", lat: 49.8416, lng: 24.0324 },
  { id: 3, name: "Митна", lat: 49.8396, lng: 24.0358 }
];

type TrafficAdvice = {
  distanceMeters: number;
  phase: string;
  timeLeft: number;
  recommendedSpeedKmh: number;
  targetLight: { lat: number; lng: number };
};

export default function HomeScreen() {
  const [route, setRoute] = useState([]);
  const [advice, setAdvice] = useState<TrafficAdvice | null>(null);
  const [selectedLightId, setSelectedLightId] = useState<number | null>(null);

  const userLoc = { latitude: 49.8450, longitude: 24.0250 };
  const finalDest = { latitude: 49.8356, longitude: 24.0144 };

  useEffect(() => {
    if (!selectedLightId) return;

    const getRoadData = async () => {
      try {
        console.log("1. Звертаємося до комп'ютера...");

        const adviceRes = await axios.get(`http://192.168.1.55:3000/traffic/advice?lat=${userLoc.latitude}&lng=${userLoc.longitude}&lightId=${selectedLightId}`);
        const adviceData = adviceRes.data;
        setAdvice(adviceData);

        if (adviceData.targetLight) {
          console.log("2. Комп'ютер відповів! Будуємо шлях до:", adviceData.targetLight);

          const url = `https://router.project-osrm.org/route/v1/driving/${userLoc.longitude},${userLoc.latitude};${adviceData.targetLight.lng},${adviceData.targetLight.lat};${finalDest.longitude},${finalDest.latitude}?overview=full&geometries=geojson`;
          console.log("3. Посилання для зовнішньої карти:", url);

          const routeRes = await axios.get(url);

          const coords = routeRes.data.routes[0].geometry.coordinates.map((c: any[]) => ({
            latitude: c[1],
            longitude: c[0]
          }));

          console.log("4. Точок для малювання дороги знайдено:", coords.length);
          setRoute(coords);
        }
      } catch (error: any) {
        console.log("Помилка зв'язку. Щось пішло не так:", error.message);
      }
    };

    getRoadData();
  }, [selectedLightId]);
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{ ...userLoc, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      >
        <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
        <Marker coordinate={userLoc} title="Моє авто" pinColor="blue" />

        <Marker coordinate={finalDest} title="Фініш (Політехніка)" pinColor="purple" />

        {ALL_LIGHTS.map((light) => (
          <Marker
            key={light.id}
            coordinate={{ latitude: light.lat, longitude: light.lng }}
            title={light.name}
            pinColor={
              light.id === selectedLightId
                ? (advice?.phase === 'GREEN' ? 'green' : 'red')
                : 'linen'
            }
          />
        ))}

        {route.length > 0 && <Polyline coordinates={route} strokeColor="blue" strokeWidth={4} />}
      </MapView>

      <View style={styles.panel}>
        <View style={styles.buttonsRow}>
          {ALL_LIGHTS.map(light => (
            <TouchableOpacity
              key={light.id}
              style={[styles.button, selectedLightId === light.id && styles.buttonActive]}
              onPress={() => setSelectedLightId(light.id)}
            >
              <Text style={selectedLightId === light.id ? styles.textActive : styles.textInactive}>
                {light.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.text}>Відстань: {advice?.distanceMeters || 0} м</Text>
        <Text style={styles.text}>Світлофор: {advice?.phase || '...'} ({advice?.timeLeft || 0} сек)</Text>
        <Text style={styles.speed}>Рекомендовано: {advice?.recommendedSpeedKmh || 0} км/год</Text>
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
  speed: { fontSize: 24, fontWeight: 'bold', marginTop: 10, color: '#2ecc71' }
});