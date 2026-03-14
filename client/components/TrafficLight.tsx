import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function TrafficLight({ phase }: { phase: string | undefined }) {
    return (
        <View style={styles.trafficLightBody}>
            <View style={styles.lensBox}>
                <View style={[styles.lens, phase === 'RED' ? styles.redOn : styles.redOff]} />
            </View>
            <View style={styles.lensBox}>
                <View style={[styles.lens, styles.yellowOff]} />
            </View>
            <View style={[styles.lensBox, { marginBottom: 0 }]}>
                <View style={[styles.lens, phase === 'GREEN' ? styles.greenOn : styles.greenOff]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    trafficLightBody: { backgroundColor: '#1a1a1a', borderRadius: 15, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', borderWidth: 2, borderColor: '#333', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 10 },
    lensBox: { backgroundColor: '#0a0a0a', padding: 6, borderRadius: 5, marginBottom: 5, borderWidth: 1, borderColor: '#2a2a2a' },
    lens: { width: 45, height: 45, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(0,0,0,0.6)' },
    redOff: { backgroundColor: '#4a0000' },
    redOn: { backgroundColor: '#ff1a1a', shadowColor: '#ff1a1a', shadowRadius: 15, shadowOpacity: 1, elevation: 20 },
    yellowOff: { backgroundColor: '#4a3b00' },
    greenOff: { backgroundColor: '#003300' },
    greenOn: { backgroundColor: '#00ff00', shadowColor: '#00ff00', shadowRadius: 15, shadowOpacity: 1, elevation: 20 },
});