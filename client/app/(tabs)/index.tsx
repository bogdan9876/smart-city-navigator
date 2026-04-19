import { fetchRouteAdvice } from '@/api/trafficApi';
import Dashboard from '@/components/Dashboard';
import SearchScreen from '@/components/SearchScreen';
import { useLocation } from '@/hooks/useLocation';
import { useTrafficLight } from '@/hooks/useTrafficLight';
import { getBearing } from '@/utils/locationUtils';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Keyboard, Text, View, Image, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useApi } from '@/hooks/useApi';

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const { userLoc, errorMsg } = useLocation();
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const api = useApi();
  const [route, setRoute] = useState<any[]>([]);
  const [advice, setAdvice] = useState<any>(null);
  const [destination, setDestination] = useState<{ name: string, lat: number, lng: number } | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);

  const liveTrafficData = useTrafficLight(advice);

  const currentFavorite = destination ? favorites.find(f =>
    (f.latitude === destination.lat && f.longitude === destination.lng) ||
    f.originalAddress === destination.name ||
    f.customName === destination.name
  ) : undefined;

  useFocusEffect(
    useCallback(() => {
      const fetchFavorites = async () => {
        try {
          const response = await api.get('/favorites');
          setFavorites(response.data);
        } catch (e) {
          console.log('Failed to fetch favorites inside index');
        }
      };
      if (user) {
        fetchFavorites();
      }
    }, [user])
  );

  useEffect(() => {
    if (params.destLat && params.destLng && params.destName) {
      setDestination({
        name: params.destName as string,
        lat: parseFloat(params.destLat as string),
        lng: parseFloat(params.destLng as string)
      });
    }
  }, [params.destLat, params.destLng, params.destName]);

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

  const handleSaveFavorite = async () => {
    if (!destination) return;

    // Використовуємо нашу нову надійну змінну
    if (currentFavorite) {
      Alert.alert(
        "Видалити маршрут?",
        "Ви впевнені, що хочете видалити цей маршрут зі збережених?",
        [
          { text: "Скасувати", style: "cancel" },
          {
            text: "Видалити",
            style: "destructive",
            onPress: async () => {
              try {
                await api.delete(`/favorites/${currentFavorite.id}`);
                // Одразу оновлюємо стейт, щоб UI відреагував миттєво
                setFavorites(prev => prev.filter(f => f.id !== currentFavorite.id));
              } catch (e) {
                Alert.alert("Помилка", "Не вдалося видалити маршрут.");
              }
            }
          }
        ]
      );
      return;
    }

    try {
      const resp = await api.post('/favorites', {
        customName: destination.name,
        originalAddress: destination.name,
        latitude: destination.lat,
        longitude: destination.lng,
      });
      setFavorites(prev => [...prev, resp.data]);
      Alert.alert("Збережено!", "Цей маршрут успішно додано до ваших збережених.");
    } catch (e: any) {
      console.log('Failed to save route:', e?.response?.data || e.message);
      if (e?.response?.status === 409) {
        Alert.alert("Увага", "Цей маршрут вже збережено.");
      } else {
        Alert.alert("Помилка", "Не вдалося зберегти маршрут.");
      }
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
      const data = await fetchRouteAdvice(userLoc, destination);
      if (!data) return;

      setAdvice(data);
      if (data.routeCoords) {
        const newRoute = data.routeCoords.map((c: any) => ({ latitude: c[1], longitude: c[0] }));
        setRoute(newRoute);

        if (mapRef.current) {
          mapRef.current.animateCamera({ pitch: 0, heading: 0 }, { duration: 500 });

          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.fitToCoordinates(newRoute, {
                edgePadding: { top: 50, right: 50, bottom: 100, left: 50 },
                animated: true,
              });
            }
          }, 1000);
        }
      }
    };

    getRoadData();
  }, [destination]);

  if (!userLoc) {
    return (
      <View className="flex-1 justify-center items-center bg-brand-light">
        <ActivityIndicator size="large" color="#3498db" />
        <Text className="mt-5 text-lg font-bold text-brand-dark">Шукаємо супутники GPS...</Text>
        {errorMsg && <Text className="mt-2.5 text-brand-danger">{errorMsg}</Text>}
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
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

      {!isSearchActive && !isDrivingMode && (
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          className="absolute top-14 right-5 bg-white rounded-full p-1 shadow-md z-50 border border-gray-100"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
        >
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} className="w-11 h-11 rounded-full" />
          ) : (
            <View className="w-11 h-11 rounded-full bg-gray-200 justify-center items-center">
              <Text className="text-gray-500 font-bold text-lg">
                {user?.firstName?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {!isSearchActive && (
        <Dashboard
          destination={destination}
          advice={advice}
          liveTrafficData={liveTrafficData}
          onOpenSearch={() => setIsSearchActive(true)}
          onClearRoute={clearRoute}
          onSaveFavorite={handleSaveFavorite}
          isFavorite={!!currentFavorite}
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