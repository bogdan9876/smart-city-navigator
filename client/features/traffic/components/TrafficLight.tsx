import React from 'react';
import { View } from 'react-native';

export default function TrafficLight({ phase }: { phase: string | undefined }) {
  const activeElevation = 8;
  const inactiveElevation = 0;

  return (
    <View className="bg-traffic-body rounded-2xl py-4 px-3 items-center">
      <View 
        className={`w-10 h-10 rounded-full ${
          phase === 'RED' ? 'bg-lens-red-on' : 'bg-traffic-boxBorder'
        }`} 
        style={{ elevation: phase === 'RED' ? activeElevation : inactiveElevation }}
      />
      <View 
        className="w-10 h-10 rounded-full bg-traffic-boxBorder mt-2"
        style={{ elevation: inactiveElevation }}
      />
      <View 
        className={`w-10 h-10 rounded-full mt-2 ${
          phase === 'GREEN' ? 'bg-lens-green-on' : 'bg-traffic-boxBorder'
        }`} 
        style={{ elevation: phase === 'GREEN' ? activeElevation : inactiveElevation }}
      />
    </View>
  );
}