import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

  useEffect(() => { fetchFavorites(); }, []);

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

  if (loading) return <ActivityIndicator size="large" className="mt-10" />;

  return (
    <View className="flex-1 bg-white p-4 pt-12">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" size={28} color="#334155" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-800">My Routes</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-gray-50 p-4 rounded-xl mb-3 border border-gray-100">
            <TouchableOpacity onPress={() => selectRoute(item)} className="flex-row items-center flex-1">
              <View className="bg-blue-50 p-3 rounded-full mr-4">
                <MaterialIcons name="star" size={24} color="#FFB800" />
              </View>
              <View className="flex-1 mr-2">
                <Text className="text-lg font-bold text-slate-800" numberOfLines={1}>{item.customName}</Text>
                <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>{item.originalAddress}</Text>
              </View>
            </TouchableOpacity>
            
            <View className="flex-row">
              <TouchableOpacity onPress={() => handleEdit(item)} className="p-2">
                <MaterialIcons name="edit" size={22} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} className="p-2">
                <MaterialIcons name="delete" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text className="text-gray-500 text-center mt-10">No saved routes yet</Text>}
      />

      {/* Edit Modal */}
      <Modal
        visible={!!editingRoute}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white w-full rounded-2xl p-6 shadow-xl">
            <Text className="text-xl font-bold mb-4 text-slate-800">Редагувати назву</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Нова назва..."
              className="w-full bg-slate-100 px-4 py-3 rounded-xl mb-6 text-lg text-slate-800"
              autoFocus
            />
            <View className="flex-row justify-end">
              <TouchableOpacity 
                onPress={() => setEditingRoute(null)} 
                className="px-5 py-3 rounded-xl mr-3"
              >
                <Text className="text-slate-500 font-bold text-base">Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={saveEdit} 
                className="bg-blue-500 px-5 py-3 rounded-xl"
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
