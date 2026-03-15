import React from 'react';
import { View } from 'react-native';

export default function TrafficLight({ phase }: { phase: string | undefined }) {
    return (
        <View className="bg-traffic-body rounded-2xl py-2.5 px-2 items-center border-2 border-traffic-border shadow-lg">
            <View className="bg-traffic-box p-1.5 rounded-md mb-1.5 border border-traffic-boxBorder">
                <View
                    className={`w-11 h-11 rounded-full border border-black/60 ${phase === 'RED' ? 'bg-lens-red-on shadow-lens-red-on shadow-lg' : 'bg-lens-red-off'
                        }`}
                    style={phase === 'RED' ? { elevation: 20 } : {}}
                />
            </View>
            <View className="bg-traffic-box p-1.5 rounded-md mb-1.5 border border-traffic-boxBorder">
                <View className="w-11 h-11 rounded-full border border-black/60 bg-lens-yellow-off" />
            </View>
            <View className="bg-traffic-box p-1.5 rounded-md border border-traffic-boxBorder">
                <View
                    className={`w-11 h-11 rounded-full border border-black/60 ${phase === 'GREEN' ? 'bg-lens-green-on shadow-lens-green-on shadow-lg' : 'bg-lens-green-off'
                        }`}
                    style={phase === 'GREEN' ? { elevation: 20 } : {}}
                />
            </View>
        </View>
    );
}