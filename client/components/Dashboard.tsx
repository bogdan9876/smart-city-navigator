import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import TrafficLight from './TrafficLight';

export default function Dashboard({ destination, advice, liveTrafficData, onOpenSearch, onClearRoute, isDrivingMode, onStartDrive }: any) {
    return (
        <View
            className="p-5 bg-white pb-10 rounded-t-2xl shadow-sm"
            style={{ elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1 }}
        >
            <View className="flex-row items-center bg-brand-light px-4 py-4 rounded-xl border border-brand-inputBorder mb-1.5">
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={onOpenSearch}>
                    <Text className={`text-lg ${destination ? 'text-brand-dark font-bold' : 'text-brand-muted'}`}>
                        {destination ? `📍 ${destination.name}` : "🔍 Куди їдемо?"}
                    </Text>
                </TouchableOpacity>

                {destination && (
                    <TouchableOpacity className="p-1 ml-2.5" onPress={onClearRoute}>
                        <Text className="text-xl text-brand-muted font-bold">✕</Text>
                    </TouchableOpacity>
                )}
            </View>
            {!destination && (
                <Text className="text-lg text-center mt-2.5 text-brand-dark">
                    Натисніть рядок зверху, щоб обрати маршрут
                </Text>
            )}
            {destination && !isDrivingMode && (
                <View className="mt-4">
                    {advice?.error ? (
                        <Text className="text-base text-brand-danger text-center font-bold">{advice.error}</Text>
                    ) : advice ? (
                        <View>
                            <Text className="text-base text-brand-muted text-center mb-4 font-semibold">
                                Маршрут готовий ({advice.totalDistance} м)
                            </Text>
                            <TouchableOpacity
                                className="bg-brand-primary py-4 rounded-xl items-center shadow-lg shadow-brand-primary"
                                style={{ elevation: 6 }}
                                activeOpacity={0.8}
                                onPress={onStartDrive}
                            >
                                <Text className="text-white text-xl font-black tracking-widest">ПОЇХАЛИ!</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text className="text-lg text-center mt-2.5 text-brand-dark">Будую маршрут...</Text>
                    )}
                </View>
            )}
            {destination && isDrivingMode && (
                <View>
                    {advice?.hasLight ? (
                        liveTrafficData ? (
                            <View className="flex-row items-center justify-around mt-1.5">
                                <View className="p-2.5">
                                    <TrafficLight phase={liveTrafficData.phase} />
                                </View>
                                <View className="flex-1 pl-5 justify-center">
                                    <View className="flex-row justify-between items-baseline mb-1.5">
                                        <Text className="text-base text-brand-muted font-medium">Відстань:</Text>
                                        <Text className="text-lg text-brand-dark font-bold">{advice.distanceToLight} м</Text>
                                    </View>
                                    <View className="flex-row justify-between items-baseline mb-1.5">
                                        <Text className="text-base text-brand-muted font-medium">Залишилось:</Text>
                                        <Text className={`text-2xl font-bold ${liveTrafficData.phase === 'GREEN' ? 'text-brand-success' : 'text-brand-danger'}`}>
                                            {liveTrafficData.timeLeft} сек
                                        </Text>
                                    </View>
                                    <View
                                        className="mt-2.5 bg-brand-widget border border-brand-widgetBorder rounded-xl py-2.5 px-4 items-center shadow-sm"
                                        style={{ elevation: 2 }}
                                    >
                                        <Text className="text-xs text-brand-widgetMuted font-bold tracking-wider mb-0.5">ТРИМАЙ ШВИДКІСТЬ</Text>
                                        <View className="flex-row items-baseline">
                                            <Text className="text-4xl font-black text-brand-speed">{liveTrafficData.speed}</Text>
                                            <Text className="text-base font-bold text-brand-muted ml-1"> км/год</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <Text className="text-lg text-center mt-2.5 text-brand-dark">Синхронізація зі світлофором...</Text>
                        )
                    ) : (
                        <Text className="text-xl font-bold mt-4 text-brand-success text-center">Світлофорів на шляху немає. Гарної поїздки!</Text>
                    )}
                </View>
            )}
        </View>
    );
}