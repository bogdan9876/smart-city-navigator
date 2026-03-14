import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
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
        <View style={styles.searchOverlay}>
            <View style={styles.searchHeader}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                <View style={styles.activeInputContainer}>
                    <TextInput
                        style={styles.activeInput}
                        placeholder="Введіть адресу у Львові..."
                        placeholderTextColor="#7f8c8d"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity style={styles.clearTextButton} onPress={() => { setSearchQuery(''); setPlaces([]); }}>
                            <Text style={styles.clearButtonText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
                {places.map((place, index) => (
                    <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => onSelect({ name: formatPlaceName(place), lat: parseFloat(place.lat), lng: parseFloat(place.lon) })}>
                        <Text style={styles.suggestionTitle}>{formatPlaceName(place)}</Text>
                        <Text style={styles.suggestionSub}>{place.display_name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    searchOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 999, paddingTop: 50, paddingHorizontal: 20 },
    searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    backButton: { padding: 10, marginRight: 10 },
    backButtonText: { fontSize: 24, color: '#34495e', fontWeight: 'bold' },
    activeInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecf0f1', borderRadius: 10, paddingRight: 10 },
    activeInput: { flex: 1, padding: 15, fontSize: 18 },
    clearTextButton: { padding: 10 },
    clearButtonText: { fontSize: 20, color: '#7f8c8d', fontWeight: 'bold' },
    suggestionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
    suggestionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    suggestionSub: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
});