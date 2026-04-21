import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

type FavoriteRoute = { id: string; customName: string; originalAddress: string; latitude: number; longitude: number; };

export default function FavoritesScreen() {
  const api = useApi();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoute, setEditingRoute] = useState<FavoriteRoute | null>(null);
  const [newName, setNewName] = useState('');

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/favorites');
      setFavorites(response.data);
    } catch (e) {
      console.log('Failed to fetch favorites', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const selectRoute = (route: FavoriteRoute) => {
    router.replace({
      pathname: '/(tabs)/',
      params: {
        destLat: route.latitude,
        destLng: route.longitude,
        destName: route.customName || route.originalAddress
      }
    } as any);
  };

  const handleEdit = (route: FavoriteRoute) => {
    setEditingRoute(route);
    setNewName(route.customName);
  };

  const saveEdit = async () => {
    if (!editingRoute || !newName.trim()) return;
    try {
      await api.patch(`/favorites/${editingRoute.id}`, { customName: newName.trim() });
      setFavorites(prev => prev.map(r => r.id === editingRoute.id ? { ...r, customName: newName.trim() } : r));
      setEditingRoute(null);
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося зберегти назву');
    }
  };

  const handleDelete = (route: FavoriteRoute) => {
    Alert.alert(
      'Видалити маршрут?',
      `Ви впевнені, що хочете видалити "${route.customName}"?`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/favorites/${route.id}`);
              setFavorites(prev => prev.filter(r => r.id !== route.id));
            } catch (e) {
              Alert.alert('Помилка', 'Не вдалося видалити маршрут');
            }
          }
        }
      ]
    );
  };

  const insets = useSafeAreaInsets();

  if (loading) return (
    <View className="flex-1 bg-brand-black justify-center items-center">
      <ActivityIndicator size="large" color="#00B14F" />
    </View>
  );

  return (
    <View className="flex-1 bg-brand-black p-4" style={{ paddingTop: insets.top + 16 }}>
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-white">Мої маршрути</Text>
          {favorites.length > 0 && (
            <Text className="text-brand-muted text-sm">{favorites.length} збережено</Text>
          )}
        </View>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-brand-card p-4 rounded-2xl mb-3 border border-brand-border">
            <TouchableOpacity onPress={() => selectRoute(item)} className="flex-row items-center flex-1">
              <View className="bg-brand-surface p-3 rounded-full mr-4">
                <MaterialIcons name="star" size={24} color="#FFB800" />
              </View>
              <View className="flex-1 mr-2">
                <Text className="text-base font-bold text-white" numberOfLines={1}>{item.customName}</Text>
                <Text className="text-xs text-brand-muted mt-1" numberOfLines={1}>{item.originalAddress}</Text>
              </View>
            </TouchableOpacity>

            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => selectRoute(item)} className="bg-brand-green px-3 py-1.5 rounded-lg mr-2">
                <Text className="text-white text-xs font-bold">Їхати</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEdit(item)} className="p-2">
                <MaterialIcons name="edit" size={20} color="#999999" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} className="p-2">
                <MaterialIcons name="delete" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <MaterialIcons name="star-border" size={56} color="#2C2C2C" />
            <Text className="text-white font-semibold text-xl mt-5">Поки порожньо</Text>
            <Text className="text-brand-muted text-sm mt-2 text-center px-8">
              Збережіть маршрут на головній сторінці, натиснувши зірочку
            </Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal
        visible={!!editingRoute}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View className="bg-brand-card w-full rounded-2xl p-6 border border-brand-border">
            <Text className="text-xl font-bold mb-4 text-white">Редагувати назву</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Нова назва..."
              placeholderTextColor="#999999"
              className="w-full bg-brand-input border border-brand-border px-4 py-3 rounded-xl mb-6 text-lg text-white"
              autoFocus
              selectTextOnFocus
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setEditingRoute(null)}
                className="px-5 py-3 rounded-xl mr-3 bg-brand-surface"
              >
                <Text className="text-brand-muted font-bold text-base">Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
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
