import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Keyboard } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import axios from 'axios';

export default function HomeScreen() {
  const [route, setRoute] = useState([]);
  const [advice, setAdvice] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [destination, setDestination] = useState<{ name: string, lat: number, lng: number } | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const [liveTrafficData, setLiveTrafficData] = useState<{ phase: string, timeLeft: number, speed: number } | null>(null);

  const userLoc = { latitude: 49.8450, longitude: 24.0250 };

  const clearRoute = () => {
    setDestination(null);
    setRoute([]);
    setAdvice(null);
    setLiveTrafficData(null);
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 800);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (debouncedQuery.length < 3) {
        setPlaces([]);
        return;
      }
      try {
        const res = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: `${debouncedQuery}, Львів`,
            format: 'json',
            limit: 9,
            addressdetails: 1
          },
          headers: {
            'User-Agent': 'TrafficLightDiplomApp/1.0',
            'Accept-Language': 'uk-UA,uk;q=0.9'
          }
        });
        setPlaces(res.data);
      } catch (error: any) {
        console.error("Помилка пошуку:", error.response?.data || error.message);
      }
    };
    fetchPlaces();
  }, [debouncedQuery]);

  const formatPlaceName = (place: any) => {
    if (place.address) {
      const road = place.address.road || place.address.pedestrian || place.address.square || "";
      const house = place.address.house_number || "";
      const amenity = place.address.amenity || place.address.shop || place.address.building || "";

      if (amenity) return `${amenity} ${road ? `(${road})` : ''}`.trim();
      if (road && house) return `${road}, ${house}`;
      if (road) return road;
    }
    const parts = place.display_name ? place.display_name.split(',') : [];
    return parts.length > 1 ? `${parts[0]}, ${parts[1]}`.trim() : (parts[0] || "");
  };

  const handleSelectPlace = (place: any) => {
    Keyboard.dismiss(); 
    setPlaces([]); 
    setIsSearchActive(false); 
    
    const beautifulName = formatPlaceName(place); 
    setSearchQuery('');
    setDebouncedQuery('');
    
    setDestination({
      name: beautifulName,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon)
    });
  };

  useEffect(() => {
    if (!destination) return;

    const getRoadData = async () => {
      try {
        const url = `http://192.168.1.96:3000/traffic/advice?lat=${userLoc.latitude}&lng=${userLoc.longitude}&destLat=${destination.lat}&destLng=${destination.lng}`;
        const res = await axios.get(url);
        const data = res.data;
        setAdvice(data);

        if (data.routeCoords) {
          const coords = data.routeCoords.map((c: any) => ({
            latitude: c[1],
            longitude: c[0]
          }));
          setRoute(coords);
        }
      } catch (error: any) {
        console.error("Помилка зв'язку з бекендом:", error.message);
      }
    };
    getRoadData();
  }, [destination]);

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
      const timeLeft = isGreen ? (light.green * 1000 - elapsed) / 1000 : (cycle - elapsed) / 1000;
      const speedMps = distance / timeLeft;

      setLiveTrafficData({
        phase: isGreen ? 'GREEN' : 'RED',
        timeLeft: Math.round(timeLeft),
        speed: Math.round(speedMps * 3.6)
      });
    };

    updateTrafficData();
    const timer = setInterval(updateTrafficData, 1000);
    return () => clearInterval(timer);
  }, [advice]);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={{ ...userLoc, latitudeDelta: 0.04, longitudeDelta: 0.04 }}>
        <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
        <Marker coordinate={userLoc} title="Моє авто" pinColor="blue" />
        
        {destination && (
          <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} title={destination.name} pinColor="purple" />
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

      {!isSearchActive && (
        <View style={styles.panel}>
          <View style={styles.fakeInputContainer}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => setIsSearchActive(true)}>
              <Text style={[styles.fakeInputText, destination && {color: '#2c3e50', fontWeight: 'bold'}]}>
                {destination ? `📍 ${destination.name}` : "🔍 Куди їдемо?"}
              </Text>
            </TouchableOpacity>

            {destination && (
              <TouchableOpacity style={styles.clearButton} onPress={clearRoute}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {advice?.error ? (
            <Text style={{ fontSize: 18, color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{advice.error}</Text>
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
                  <Text style={{ fontSize: 45, fontWeight: 'bold', color: liveTrafficData.phase === 'GREEN' ? '#2ecc71' : '#e74c3c' }}>
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
          ) : (
             <Text style={[styles.text, {textAlign: 'center'}]}>Натисніть рядок зверху, щоб обрати маршрут</Text>
          )}
        </View>
      )}

      {isSearchActive && (
        <View style={styles.searchOverlay}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setIsSearchActive(false)} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.activeInputContainer}>
              <TextInput
                style={styles.activeInput}
                placeholder="Введіть адресу у Львові..."
                placeholderTextColor="#7f8c8d"
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearTextButton} 
                  onPress={() => { setSearchQuery(''); setDebouncedQuery(''); setPlaces([]); }}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {places.map((place, index) => (
              <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => handleSelectPlace(place)}>
                <Text style={styles.suggestionTitle}>{formatPlaceName(place)}</Text>
                <Text style={styles.suggestionSub}>{place.display_name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  panel: { padding: 20, backgroundColor: 'white', paddingBottom: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: -3}, shadowOpacity: 0.1, elevation: 15 },
  fakeInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecf0f1', paddingHorizontal: 15, paddingVertical: 15, borderRadius: 10, borderWidth: 1, borderColor: '#bdc3c7', marginBottom: 15 },
  fakeInputText: { color: '#7f8c8d', fontSize: 18 },
  activeInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecf0f1', borderRadius: 10, paddingRight: 10 },
  activeInput: { flex: 1, padding: 15, fontSize: 18 },
  clearButton: { padding: 5, marginLeft: 10 },
  clearTextButton: { padding: 10 },
  clearButtonText: { fontSize: 20, color: '#7f8c8d', fontWeight: 'bold' },
  backButton: { padding: 10, marginRight: 10 },
  backButtonText: { fontSize: 24, color: '#34495e', fontWeight: 'bold' },
  searchOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 999, paddingTop: 50, paddingHorizontal: 20 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  suggestionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
  suggestionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  suggestionSub: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
  text: { fontSize: 18 },
  speed: { fontSize: 20, fontWeight: 'bold', marginTop: 10, color: '#2ecc71', textAlign: 'center' },
  trafficLightBody: { backgroundColor: '#1a1a1a', borderRadius: 15, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', borderWidth: 2, borderColor: '#333', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 10 },
  lensBox: { backgroundColor: '#0a0a0a', padding: 6, borderRadius: 5, marginBottom: 5, borderWidth: 1, borderColor: '#2a2a2a' },
  lens: { width: 45, height: 45, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(0,0,0,0.6)' },
  redOff: { backgroundColor: '#4a0000' },
  redOn: { backgroundColor: '#ff1a1a', shadowColor: '#ff1a1a', shadowRadius: 15, shadowOpacity: 1, elevation: 20 },
  yellowOff: { backgroundColor: '#4a3b00' },
  greenOff: { backgroundColor: '#003300' },
  greenOn: { backgroundColor: '#00ff00', shadowColor: '#00ff00', shadowRadius: 15, shadowOpacity: 1, elevation: 20 },
});