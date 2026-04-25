import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { TrafficLevel } from '@/features/traffic/hooks/useRouteTraffic';

type Props = {
    level: TrafficLevel;
    delayMinutes?: number;
    jamLengthMeters?: number;
    distanceToJam?: number;
    compact?: boolean;
};

const PALETTE = {
    SLOW: {
        color: '#FFB800',
        bg: 'rgba(255, 184, 0, 0.10)',
        border: 'rgba(255, 184, 0, 0.30)',
        iconBg: 'rgba(255, 184, 0, 0.18)',
    },
    TRAFFIC_JAM: {
        color: '#FF3B30',
        bg: 'rgba(255, 59, 48, 0.10)',
        border: 'rgba(255, 59, 48, 0.35)',
        iconBg: 'rgba(255, 59, 48, 0.20)',
    },
};

function formatDistance(meters?: number): string {
    if (!meters || meters <= 0) return '';
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} км`;
    return `${Math.round(meters)} м`;
}

export default function TrafficWarning({
    level,
    delayMinutes,
    jamLengthMeters,
    distanceToJam,
    compact,
}: Props) {
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (level !== 'TRAFFIC_JAM') return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [level, pulse]);

    if (level === 'NORMAL') return null;

    const palette = PALETTE[level];
    const isHeavy = level === 'TRAFFIC_JAM';

    const title = isHeavy ? 'Затор на маршруті' : 'Повільний рух';
    const iconName = isHeavy ? 'traffic-cone' : 'car-multiple';

    const parts: string[] = [];
    if (delayMinutes && delayMinutes > 0) parts.push(`+${delayMinutes} хв`);
    const jamLen = formatDistance(jamLengthMeters);
    if (jamLen) parts.push(jamLen);
    const dist = formatDistance(distanceToJam);
    if (dist) parts.push(`за ${dist}`);
    const sub = parts.join('  ·  ');

    const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
    const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

    const iconSize = compact ? 32 : 40;
    const iconInner = compact ? 28 : 34;
    const innerIcon = compact ? 18 : 22;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: palette.bg,
                borderColor: palette.border,
                borderWidth: 1,
                borderRadius: compact ? 12 : 16,
                paddingVertical: compact ? 8 : 12,
                paddingHorizontal: compact ? 10 : 14,
            }}
        >
            <View
                style={{
                    width: iconSize,
                    height: iconSize,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {isHeavy && (
                    <Animated.View
                        style={{
                            position: 'absolute',
                            width: iconSize,
                            height: iconSize,
                            borderRadius: iconSize / 2,
                            backgroundColor: palette.color,
                            transform: [{ scale: pulseScale }],
                            opacity: pulseOpacity,
                        }}
                    />
                )}
                <View
                    style={{
                        width: iconInner,
                        height: iconInner,
                        borderRadius: iconInner / 2,
                        backgroundColor: palette.iconBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <MaterialCommunityIcons
                        name={iconName as any}
                        size={innerIcon}
                        color={palette.color}
                    />
                </View>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                    className="text-white font-bold"
                    style={{ fontSize: compact ? 14 : 16, letterSpacing: -0.2 }}
                >
                    {title}
                </Text>
                {!!sub && (
                    <Text
                        className="text-brand-muted font-medium"
                        style={{ fontSize: compact ? 12 : 13, marginTop: 2 }}
                    >
                        {sub}
                    </Text>
                )}
            </View>
        </View>
    );
}
