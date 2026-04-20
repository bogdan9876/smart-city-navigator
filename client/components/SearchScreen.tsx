import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

export default function SearchScreen({ onClose, onSelect }: { onClose: () => void, onSelect: (place: any) => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [places, setPlaces] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const timerId = setTimeout(() => setDebouncedQuery(searchQuery), 800);
        return () => clearTimeout(timerId);
    }, [searchQuery]);

    useEffect(() => {
        const fetchPlaces = async () => {
            if (debouncedQuery.length < 3) return setPlaces([]);
            setIsLoading(true);
            try {
                const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: { q: `${debouncedQuery}, Львів`, format: 'json', limit: 6, addressdetails: 1 },
                    headers: { 'User-Agent': 'TrafficLightDiplomApp/1.0', 'Accept-Language': 'uk-UA,uk;q=0.9' }
                });
                setPlaces(res.data);
            } catch (error: any) {
                console.error("Помилка пошуку:", error.message);
            } finally {
                setIsLoading(false);
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

    const isSearching = searchQuery !== debouncedQuery && searchQuery.length >= 3;
    const showEmpty = !isLoading && !isSearching && debouncedQuery.length >= 3 && places.length === 0;

    return (
        <View className="absolute inset-0 bg-brand-black z-50 pt-[60px] px-5">
            <View className="flex-row items-center mb-4">
                <TouchableOpacity onPress={onClose} className="p-2 mr-2">
                    <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <View className="flex-1 flex-row items-center bg-brand-input rounded-xl h-14 border border-brand-border">
                    <TextInput
                        style={{ flex: 1, fontSize: 16, color: '#FFFFFF', paddingHorizontal: 16 }}
                        placeholder="Введіть адресу у Львові..."
                        placeholderTextColor="#999999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={true}
                        autoCorrect={true}
                        spellCheck={false}
                    />
                    <View className="w-12 h-full items-center justify-center">
                        {(isLoading || isSearching) ? (
                            <ActivityIndicator size="small" color="#999999" />
                        ) : searchQuery.length > 0 ? (
                            <TouchableOpacity
                                className="flex-1 w-full items-center justify-center"
                                onPress={() => { setSearchQuery(''); setPlaces([]); }}
                            >
                                <MaterialCommunityIcons name="close" size={20} color="#999999" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
                {places.map((place, index) => (
                    <TouchableOpacity
                        key={index}
                        className="flex-row items-center py-4 border-b border-brand-border"
                        onPress={() => onSelect({ name: formatPlaceName(place), lat: parseFloat(place.lat), lng: parseFloat(place.lon) })}
                    >
                        <View className="w-9 h-9 rounded-full bg-brand-card border border-brand-border items-center justify-center mr-3">
                            <MaterialCommunityIcons name="map-marker-outline" size={18} color="#999999" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-bold text-white" numberOfLines={1}>{formatPlaceName(place)}</Text>
                            <Text className="text-xs text-brand-muted mt-0.5" numberOfLines={1}>{place.display_name}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#2C2C2C" />
                    </TouchableOpacity>
                ))}

                {showEmpty && (
                    <View className="items-center mt-16">
                        <MaterialCommunityIcons name="map-search-outline" size={48} color="#2C2C2C" />
                        <Text className="text-white font-semibold text-lg mt-4">Нічого не знайдено</Text>
                        <Text className="text-brand-muted text-sm mt-1 text-center">Спробуйте іншу адресу або назву місця</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
