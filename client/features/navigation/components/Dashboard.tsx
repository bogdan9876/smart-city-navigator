import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrafficLight from '@/features/traffic/components/TrafficLight';
import TrafficWarning from '@/features/traffic/components/TrafficWarning';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function formatDistance(meters: number | undefined | null): string {
    if (meters == null || isNaN(meters)) return '—';
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} км`;
    return `${Math.round(meters)} м`;
}

function formatMinutes(minutes: number | undefined | null): string {
    if (minutes == null || isNaN(minutes)) return '—';
    return `~${minutes} хв`;
}

export default function Dashboard({ destination, advice, liveTrafficData, trafficInfo, trafficError, onOpenSearch, onClearRoute, onSaveFavorite, isFavorite, isDrivingMode, onStartDrive }: any) {
    const insets = useSafeAreaInsets();
    const hasTrafficIssue = trafficInfo && trafficInfo.worstLevel !== 'NORMAL';
    const adviceTotalDistance: number | undefined = advice?.hasLight === false ? advice?.distanceMeters : advice?.totalDistance;
    const totalDistance: number | undefined = trafficInfo?.totalDistanceMeters ?? adviceTotalDistance;
    const totalMinutes: number | undefined = trafficInfo?.totalDurationMinutes
        ?? (totalDistance != null ? Math.ceil((totalDistance / 1000) / 40 * 60) : undefined);
    return (
        <View
            className="px-5 pt-3 bg-brand-surface border-t border-brand-border"
            style={{ paddingBottom: insets.bottom + 16, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.4 }}
        >
            <View className="items-center mb-4">
                <View className="w-10 h-1 rounded-full bg-brand-border" />
            </View>

            <View className="flex-row items-center bg-brand-input px-4 py-4 rounded-xl border border-brand-border mb-1.5">
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={onOpenSearch}>
                    <Text className={`text-lg ${destination ? 'text-white font-bold' : 'text-brand-muted'}`} numberOfLines={1}>
                        {destination ? destination.name : "Куди їдемо?"}
                    </Text>
                </TouchableOpacity>

                {destination && (
                    <View className="flex-row items-center">
                        <TouchableOpacity className="p-1 ml-2" onPress={onSaveFavorite}>
                            <MaterialCommunityIcons name={isFavorite ? "star" : "star-outline"} size={28} color="#FFB800" />
                        </TouchableOpacity>
                        <TouchableOpacity className="p-1 ml-2.5" onPress={onClearRoute}>
                            <MaterialCommunityIcons name="close" size={22} color="#999999" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {!destination && (
                <Text className="text-base text-center mt-3 text-brand-muted">
                    Натисніть рядок вище, щоб обрати маршрут
                </Text>
            )}

            {destination && !isDrivingMode && (
                <View className="mt-4">
                    {advice?.error ? (
                        <View className="flex-row items-center justify-center bg-red-950 rounded-xl p-3 border border-red-900">
                            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#ef4444" />
                            <Text className="text-red-400 font-semibold ml-2">{advice.error}</Text>
                        </View>
                    ) : advice ? (
                        <View>
                            {/* Route stats row */}
                            <View className="flex-row mb-4 gap-3">
                                <View className="flex-1 bg-brand-card rounded-xl p-3 border border-brand-border items-center">
                                    <MaterialCommunityIcons name="map-marker-distance" size={20} color="#999999" />
                                    <Text className="text-white font-bold text-lg mt-1">{formatDistance(totalDistance)}</Text>
                                    <Text className="text-brand-muted text-xs">відстань</Text>
                                </View>
                                <View className="flex-1 bg-brand-card rounded-xl p-3 border border-brand-border items-center">
                                    <MaterialCommunityIcons name="clock-outline" size={20} color="#999999" />
                                    <Text className="text-white font-bold text-lg mt-1">{formatMinutes(totalMinutes)}</Text>
                                    <Text className="text-brand-muted text-xs">у дорозі</Text>
                                </View>
                                {advice.hasLight && (
                                    <View className="flex-1 bg-brand-card rounded-xl p-3 border border-brand-border items-center">
                                        <MaterialCommunityIcons name="traffic-light" size={20} color="#999999" />
                                        <Text className="text-white font-bold text-lg mt-1">{formatDistance(advice.distanceMeters ?? advice.distanceToLight)}</Text>
                                        <Text className="text-brand-muted text-xs">до світлофора</Text>
                                    </View>
                                )}
                            </View>

                            {hasTrafficIssue && (
                                <View className="mb-4">
                                    <TrafficWarning
                                        level={trafficInfo.worstLevel}
                                        delayMinutes={trafficInfo.delayMinutes}
                                        jamLengthMeters={trafficInfo.jamLengthMeters}
                                    />
                                </View>
                            )}

                            {trafficError && !trafficInfo && (
                                <View className="flex-row items-center bg-yellow-950 rounded-xl p-3 border border-yellow-900 mb-4">
                                    <MaterialCommunityIcons name="cloud-alert" size={18} color="#FFB800" />
                                    <Text className="text-yellow-400 text-xs font-semibold ml-2 flex-1" numberOfLines={2}>
                                        Google Maps: {String(trafficError)}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                className="bg-brand-green py-4 rounded-xl items-center"
                                style={{ elevation: 6 }}
                                activeOpacity={0.8}
                                onPress={onStartDrive}
                            >
                                <Text className="text-white text-xl font-black tracking-widest">ПОЇХАЛИ</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="flex-row items-center justify-center py-3">
                            <ActivityIndicator size="small" color="#00B14F" />
                            <Text className="text-base text-brand-muted ml-3">Будую маршрут...</Text>
                        </View>
                    )}
                </View>
            )}

            {destination && isDrivingMode && (
                <View>
                    {hasTrafficIssue && (
                        <View className="mb-3">
                            <TrafficWarning
                                level={trafficInfo.worstLevel}
                                delayMinutes={trafficInfo.delayMinutes}
                                jamLengthMeters={trafficInfo.jamLengthMeters}
                                compact
                            />
                        </View>
                    )}
                    {advice?.hasLight ? (
                        liveTrafficData ? (
                            <View className="mt-1.5">
                                {liveTrafficData.isInJam ? (
                                    /* ── JAM STATE ── */
                                    <View>
                                        <View className="flex-row items-center bg-red-950 rounded-xl px-4 py-3 border border-red-900 mb-3">
                                            <MaterialCommunityIcons name="car-brake-alert" size={22} color="#FF3B30" />
                                            <View className="ml-3 flex-1">
                                                <Text className="text-red-400 font-bold text-base">Ви у заторі</Text>
                                                <Text className="text-red-300 text-xs mt-0.5">Розрахунок оптимальної швидкості тимчасово недоступний</Text>
                                            </View>
                                        </View>

                                        <View className="flex-row gap-3 mb-3">
                                            <View className="flex-1 bg-brand-card rounded-xl p-3 border border-brand-border items-center">
                                                <MaterialCommunityIcons name="clock-fast" size={20} color="#FFB800" />
                                                <Text className="text-white font-bold text-xl mt-1">
                                                    ~{liveTrafficData.estimatedJamExitMinutes} хв
                                                </Text>
                                                <Text className="text-brand-muted text-xs text-center">орієнт. час у заторі</Text>
                                            </View>
                                            <View className="flex-1 bg-brand-card rounded-xl p-3 border border-brand-border items-center">
                                                <MaterialCommunityIcons name="map-marker-distance" size={20} color="#999999" />
                                                <Text className="text-white font-bold text-xl mt-1">
                                                    {formatDistance(liveTrafficData.jamBeforeLightMeters)}
                                                </Text>
                                                <Text className="text-brand-muted text-xs text-center">затор до світлофора</Text>
                                            </View>
                                        </View>

                                        {liveTrafficData.speedAfterJam != null && (
                                            <View className="bg-brand-card border border-brand-border rounded-xl py-3 px-4 items-center">
                                                <Text className="text-xs text-brand-muted font-bold tracking-wider mb-0.5">ШВИДКІСТЬ ПІСЛЯ ЗАТОРУ</Text>
                                                <View className="flex-row items-baseline">
                                                    <Text className="text-4xl font-black text-white">{liveTrafficData.speedAfterJam}</Text>
                                                    <Text className="text-base font-bold text-brand-muted ml-1">км/год</Text>
                                                </View>
                                                <Text className="text-brand-muted text-xs mt-1">щоб потрапити на зелене</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    /* ── NORMAL STATE ── */
                                    <View className="flex-row items-center justify-around">
                                        <View className="p-2.5">
                                            <TrafficLight phase={liveTrafficData.phase} />
                                        </View>
                                        <View className="flex-1 pl-5 justify-center">
                                            <View className="flex-row justify-between items-baseline mb-1.5">
                                                <Text className="text-base text-brand-muted font-medium">До світлофора:</Text>
                                                <Text className="text-lg text-white font-bold">{formatDistance(advice.distanceMeters ?? advice.distanceToLight)}</Text>
                                            </View>
                                            <View className="flex-row justify-between items-baseline mb-2">
                                                <Text className="text-base text-brand-muted font-medium">Фаза:</Text>
                                                <Text className={`text-2xl font-bold ${liveTrafficData.phase === 'GREEN' ? 'text-brand-green' : 'text-red-500'}`}>
                                                    {liveTrafficData.timeLeft} сек
                                                </Text>
                                            </View>
                                            <View className="h-1.5 bg-brand-border rounded-full mb-3 overflow-hidden">
                                                <View
                                                    className={`h-full rounded-full ${liveTrafficData.phase === 'GREEN' ? 'bg-brand-green' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min((liveTrafficData.timeLeft / 60) * 100, 100)}%` }}
                                                />
                                            </View>
                                            {liveTrafficData.speed != null ? (
                                                <View className="bg-brand-card border border-brand-border rounded-xl py-2.5 px-4 items-center" style={{ elevation: 2 }}>
                                                    <Text className="text-xs text-brand-muted font-bold tracking-wider mb-0.5">РЕКОМЕНДОВАНА ШВИДКІСТЬ</Text>
                                                    <View className="flex-row items-baseline">
                                                        <Text className="text-4xl font-black text-white">{liveTrafficData.speed}</Text>
                                                        <Text className="text-base font-bold text-brand-muted ml-1">км/год</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View className="bg-brand-card border border-brand-border rounded-xl py-2.5 px-4 items-center">
                                                    <Text className="text-xs text-brand-muted font-bold tracking-wider">РУХАЙТЕСЬ ВІЛЬНО</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View className="flex-row items-center justify-center py-3">
                                <ActivityIndicator size="small" color="#00B14F" />
                                <Text className="text-base text-brand-muted ml-3">Синхронізація зі світлофором...</Text>
                            </View>
                        )
                    ) : (
                        <View className="flex-row items-center justify-center mt-4">
                            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#00B14F" />
                            <Text className="text-lg font-bold text-brand-green ml-2">Світлофорів на шляху немає</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
