import { postRouteAnalysis } from '@/features/traffic/api/trafficApi';
import Dashboard from '@/features/navigation/components/Dashboard';
import SearchScreen from '@/features/search/components/SearchScreen';
import { useLocation } from '@/features/location/hooks/useLocation';
import { useTrafficLight } from '@/features/traffic/hooks/useTrafficLight';
import { useRouteTraffic, TrafficLevel } from '@/features/traffic/hooks/useRouteTraffic';
import { getBearing } from '@/features/location/utils/locationUtils';
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Keyboard, Text, View, Image, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { LocationReadyContext } from '@/app/_layout';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useApi } from '@/shared/hooks/useApi';

const TRAFFIC_COLORS: Record<TrafficLevel, string> = {
  NORMAL: '#00B14F',
  SLOW: '#FFB800',
  TRAFFIC_JAM: '#FF3B30',
};

const COORD_EPSILON = 1e-5;

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const { userLoc, gpsSpeed } = useLocation();
  const notifyLocationReady = useContext(LocationReadyContext);
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const api = useApi();
  const [advice, setAdvice] = useState<any>(null);
  const [destination, setDestination] = useState<{ name: string, lat: number, lng: number } | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveModalName, setSaveModalName] = useState('');

  const { data: trafficInfo, error: trafficError } = useRouteTraffic(userLoc, destination);
  const liveTrafficData = useTrafficLight(advice, trafficInfo, userLoc, gpsSpeed);

  const currentFavorite = destination ? favorites.find(f =>
    Math.abs(f.latitude - destination.lat) < COORD_EPSILON &&
    Math.abs(f.longitude - destination.lng) < COORD_EPSILON
  ) : undefined;

  useFocusEffect(
    useCallback(() => {
      const fetchFavorites = async () => {
        try {
          console.log('[favorites] → GET /favorites');
          const response = await api.get('/favorites');
          console.log('[favorites] ← response', response.status, 'count:', Array.isArray(response.data) ? response.data.length : '?');
          setFavorites(Array.isArray(response.data) ? response.data : []);
        } catch (e: any) {
          console.error('[favorites] ✗ fetch error', {
            status: e?.response?.status,
            data: e?.response?.data,
            message: e?.message,
          });
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
    setAdvice(null);
    setIsDrivingMode(false);

    if (mapRef.current && userLoc) {
      mapRef.current.animateCamera({
        center: userLoc, pitch: 0, heading: 0, altitude: 4000, zoom: 14,
      }, { duration: 1000 });
    }
  };

  const handleSaveFavorite = () => {
    if (!destination) return;

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

    setSaveModalName(destination.name);
    setSaveModalVisible(true);
  };

  const confirmSaveFavorite = async () => {
    if (!destination) {
      console.warn('[saveFavorite] aborted: no destination');
      return;
    }
    const customName = saveModalName.trim() || destination.name;
    const payload = {
      customName,
      originalAddress: destination.name,
      latitude: destination.lat,
      longitude: destination.lng,
    };
    console.log('[saveFavorite] → POST /favorites', payload);
    setSaveModalVisible(false);

    try {
      const resp = await api.post('/favorites', payload);
      console.log('[saveFavorite] ← response', resp.status, resp.data);
      if (resp.data && resp.data.id) {
        setFavorites(prev => [...prev, resp.data]);
      } else {
        console.warn('[saveFavorite] response has no id', resp.data);
      }
    } catch (e: any) {
      console.error('[saveFavorite] ✗ error', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
      });
      if (e?.response?.status === 409) {
        Alert.alert("Увага", "Цей маршрут вже збережено.");
      } else {
        Alert.alert("Помилка", `Не вдалося зберегти маршрут: ${e?.message ?? 'unknown'}`);
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
    const routeCoords = trafficInfo?.coords ?? [];
    if (routeCoords.length > 1) {
      heading = getBearing(userLoc, routeCoords[1]);
    } else if (destination) {
      heading = getBearing(userLoc, { latitude: destination.lat, longitude: destination.lng });
    }

    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: userLoc, pitch: 60, heading: heading, altitude: 300, zoom: 17.5,
      }, { duration: 1500 });
    }
  };

  // When Mapbox route is ready — send coords to server for traffic light analysis
  // and fit the map to the new route.
  useEffect(() => {
    if (!trafficInfo?.rawCoords?.length) {
      setAdvice(null);
      return;
    }

    const analyseRoute = async () => {
      console.log('[advice] → postRouteAnalysis, coords:', trafficInfo.rawCoords.length, 'dist:', trafficInfo.totalDistanceMeters);
      const data = await postRouteAnalysis(
        trafficInfo.rawCoords,
        trafficInfo.totalDistanceMeters,
      );
      console.log('[advice] ← response', data ? { hasLight: data.hasLight, lightsCount: data.lightsAhead?.length } : 'null');
      setAdvice(data);
    };

    analyseRoute();

    // Fit map to Mapbox route
    if (mapRef.current && trafficInfo.coords.length > 0) {
      mapRef.current.animateCamera({ pitch: 0, heading: 0 }, { duration: 500 });
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(trafficInfo.coords, {
            edgePadding: { top: 50, right: 50, bottom: 100, left: 50 },
            animated: true,
          });
        }
      }, 1000);
    }
  }, [trafficInfo?.rawCoords]);

  useEffect(() => {
    if (userLoc) notifyLocationReady();
  }, [userLoc]);

  if (!userLoc) return null;

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
        {liveTrafficData?.lightsAhead?.map((l: any) => (
          <Marker
            key={`light-${l.light.id}`}
            coordinate={{ latitude: l.light.lat, longitude: l.light.lng }}
            title={l.light.name}
            description={`${l.phaseAtArrival === 'GREEN' ? 'Зелене' : 'Червоне'} при прибутті · ${l.timeLeftAtArrival}с`}
            pinColor={l.phaseAtArrival === 'GREEN' ? 'green' : 'red'}
          />
        ))}
        {trafficInfo && trafficInfo.coords.length > 1 && trafficInfo.segments.length > 0 ? (
          <>
            <Polyline
              coordinates={trafficInfo.coords}
              strokeColor="rgba(0,0,0,0.35)"
              strokeWidth={8}
            />
            {trafficInfo.segments.map((seg, i) => {
              if (seg.coords.length < 2) return null;
              return (
                <Polyline
                  key={`seg-${i}`}
                  coordinates={seg.coords}
                  strokeColor={TRAFFIC_COLORS[seg.level]}
                  strokeWidth={5}
                  zIndex={seg.level === 'TRAFFIC_JAM' ? 3 : seg.level === 'SLOW' ? 2 : 1}
                />
              );
            })}
            {trafficInfo.jamStart && (
              <Marker
                coordinate={trafficInfo.jamStart}
                title="Затор попереду"
                description={`+${trafficInfo.delayMinutes} хв затримки`}
                pinColor="red"
              />
            )}
          </>
        ) : null}
      </MapView>

      {!isSearchActive && !isDrivingMode && (
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          className="absolute top-14 right-5 bg-brand-card rounded-full p-1 z-50 border border-brand-border"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3.84, elevation: 5 }}
        >
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} className="w-11 h-11 rounded-full" />
          ) : (
            <View className="w-11 h-11 rounded-full bg-brand-surface justify-center items-center">
              <Text className="text-brand-muted font-bold text-lg">
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
          trafficInfo={trafficInfo}
          trafficError={trafficError}
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

      <Modal visible={saveModalVisible} transparent animationType="fade" onRequestClose={() => setSaveModalVisible(false)}>
        <View className="flex-1 justify-center items-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View className="bg-brand-card w-full rounded-2xl p-6 border border-brand-border">
            <Text className="text-xl font-bold mb-1 text-white">Зберегти маршрут</Text>
            <Text className="text-brand-muted text-sm mb-4" numberOfLines={2}>
              {destination?.name}
            </Text>
            <TextInput
              value={saveModalName}
              onChangeText={setSaveModalName}
              placeholder="Назва маршруту..."
              placeholderTextColor="#999999"
              className="bg-brand-surface border border-brand-border rounded-xl mb-4"
              style={{ fontSize: 16, color: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12 }}
              autoFocus
              selectTextOnFocus
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setSaveModalVisible(false)}
                className="px-5 py-3 rounded-xl mr-3 bg-brand-surface"
              >
                <Text className="text-brand-muted font-bold text-base">Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSaveFavorite}
                className="bg-brand-green px-5 py-3 rounded-xl"
              >
                <Text className="text-white font-bold text-base">Зберегти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
