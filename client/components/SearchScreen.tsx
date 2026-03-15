import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import axios from 'axios';

export default function SearchScreen({ onClose, onSelect }: { onClose: () => void, onSelect: (place: any) => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [places, setPlaces] = useState<any[]>([]);

    useEffect(() => {
        const timerId = setTimeout(() => setDebouncedQuery(searchQuery), 800);
        return () => clearTimeout(timerId);
    }, [searchQuery]);

    useEffect(() => {
        const fetchPlaces = async () => {
            if (debouncedQuery.length < 3) return setPlaces([]);
            try {
                const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: { q: `${debouncedQuery}, Львів`, format: 'json', limit: 6, addressdetails: 1 },
                    headers: { 'User-Agent': 'TrafficLightDiplomApp/1.0', 'Accept-Language': 'uk-UA,uk;q=0.9' }
                });
                setPlaces(res.data);
            } catch (error: any) {
                console.error("Помилка пошуку:", error.message);
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

    return (
        <View className="absolute inset-0 bg-white z-50 pt-12 px-5">
            <View className="flex-row items-center mb-4">
                <TouchableOpacity onPress={onClose} className="p-2 mr-2">
                    <Text className="text-2xl text-brand-slate font-bold">←</Text>
                </TouchableOpacity>
                <View className="flex-1 flex-row items-center justify-center bg-brand-light rounded-xl h-14">
                    <TextInput
                        className="flex-1 p-4 h-full text-lg text-brand-dark"
                        placeholder="Введіть адресу у Львові..."
                        placeholderTextColor="#7f8c8d"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={true}
                        autoCorrect={true}
                        spellCheck={false}
                    />
                    <View className="w-12 h-full items-center justify-center">
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                className="flex-1 w-full items-center justify-center"
                                onPress={() => { setSearchQuery(''); setPlaces([]); }}
                            >
                                <Text className="text-xl text-brand-muted font-bold">✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
                {places.map((place, index) => (
                    <TouchableOpacity
                        key={index}
                        className="py-4 border-b border-brand-light"
                        onPress={() => onSelect({ name: formatPlaceName(place), lat: parseFloat(place.lat), lng: parseFloat(place.lon) })}
                    >
                        <Text className="text-lg font-bold text-brand-dark">{formatPlaceName(place)}</Text>
                        <Text className="text-sm text-brand-muted mt-1">{place.display_name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}