import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TrafficLight from './TrafficLight';

export default function Dashboard({ destination, advice, liveTrafficData, onOpenSearch, onClearRoute, isDrivingMode, onStartDrive }: any) {
    return (
        <View style={styles.panel}>

            {/* 1. FAKE INPUT: Рядок пошуку (завжди видимий) */}
            <View style={styles.fakeInputContainer}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={onOpenSearch}>
                    <Text style={[styles.fakeInputText, destination && { color: '#2c3e50', fontWeight: 'bold' }]}>
                        {destination ? `📍 ${destination.name}` : "🔍 Куди їдемо?"}
                    </Text>
                </TouchableOpacity>

                {destination && (
                    <TouchableOpacity style={styles.clearButton} onPress={onClearRoute}>
                        <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ЛОГІКА ВІДОБРАЖЕННЯ */}

            {/* СТАН А: Маршрут ще не обрано */}
            {!destination && (
                <Text style={[styles.text, { textAlign: 'center', marginTop: 10 }]}>
                    Натисніть рядок зверху, щоб обрати маршрут
                </Text>
            )}

            {/* СТАН Б: Маршрут обрано, але ще НЕ ПОЇХАЛИ (режим Preview) */}
            {destination && !isDrivingMode && (
                <View style={styles.previewContainer}>
                    {advice?.error ? (
                        <Text style={{ fontSize: 16, color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{advice.error}</Text>
                    ) : advice ? (
                        <View>
                            <Text style={styles.previewText}>
                                Маршрут готовий ({advice.distanceMeters} м)
                            </Text>
                            <TouchableOpacity style={styles.goButton} activeOpacity={0.8} onPress={onStartDrive}>
                                <Text style={styles.goButtonText}>ПОЇХАЛИ!</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={[styles.text, { textAlign: 'center' }]}>Будую маршрут...</Text>
                    )}
                </View>
            )}

            {/* СТАН В: РЕЖИМ ВОДІННЯ (Drive Mode) */}
            {destination && isDrivingMode && (
                <View>
                    {advice?.hasLight ? (
                        liveTrafficData ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 5 }}>
                                <View style={{ padding: 10 }}>
                                    <TrafficLight phase={liveTrafficData.phase} />
                                </View>

                                <View style={{ flex: 1, paddingLeft: 20, justifyContent: 'center' }}>
                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsLabel}>Відстань:</Text>
                                        <Text style={styles.statsValue}>{advice.distanceMeters} м</Text>
                                    </View>

                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsLabel}>Залишилось:</Text>
                                        <Text style={[styles.statsValue, { color: liveTrafficData.phase === 'GREEN' ? '#2ecc71' : '#e74c3c', fontSize: 22 }]}>
                                            {liveTrafficData.timeLeft} сек
                                        </Text>
                                    </View>

                                    <View style={styles.speedWidget}>
                                        <Text style={styles.speedWidgetLabel}>ТРИМАЙ ШВИДКІСТЬ</Text>
                                        <View style={styles.speedWidgetValueContainer}>
                                            <Text style={styles.speedWidgetValue}>{liveTrafficData.speed}</Text>
                                            <Text style={styles.speedWidgetUnit}> км/год</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <Text style={[styles.text, { textAlign: 'center' }]}>Синхронізація зі світлофором...</Text>
                        )
                    ) : (
                        <Text style={[styles.speed, { marginTop: 15 }]}>Світлофорів на шляху немає. Гарної поїздки!</Text>
                    )}
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    panel: { padding: 20, backgroundColor: 'white', paddingBottom: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, elevation: 15 },
    fakeInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecf0f1', paddingHorizontal: 15, paddingVertical: 15, borderRadius: 10, borderWidth: 1, borderColor: '#bdc3c7', marginBottom: 5 },
    fakeInputText: { color: '#7f8c8d', fontSize: 18 },
    clearButton: { padding: 5, marginLeft: 10 },
    clearButtonText: { fontSize: 20, color: '#7f8c8d', fontWeight: 'bold' },
    text: { fontSize: 18 },
    speed: { fontSize: 20, fontWeight: 'bold', marginTop: 10, color: '#2ecc71', textAlign: 'center' },

    // === СТИЛІ КНОПКИ "ПОЇХАЛИ!" ===
    previewContainer: { marginTop: 15 },
    previewText: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', marginBottom: 15, fontWeight: '600' },
    goButton: {
        backgroundColor: '#3498db',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 6,
    },
    goButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 2,
    },

    // === СТИЛІ ДАШБОРДА ===
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
    statsLabel: { fontSize: 16, color: '#7f8c8d', fontWeight: '500' },
    statsValue: { fontSize: 18, color: '#2c3e50', fontWeight: 'bold' },
    speedWidget: { marginTop: 10, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    speedWidgetLabel: { fontSize: 11, color: '#95a5a6', fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
    speedWidgetValueContainer: { flexDirection: 'row', alignItems: 'baseline' },
    speedWidgetValue: { fontSize: 38, fontWeight: '900', color: '#27ae60' },
    speedWidgetUnit: { fontSize: 16, fontWeight: 'bold', color: '#7f8c8d', marginLeft: 4 },
});