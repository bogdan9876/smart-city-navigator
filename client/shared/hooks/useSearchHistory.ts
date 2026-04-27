import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'search_history';
const MAX_ITEMS = 8;

export type HistoryItem = {
    name: string;
    lat: number;
    lng: number;
    savedAt: number;
};

export function useSearchHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Load on mount
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((raw) => {
                if (raw) setHistory(JSON.parse(raw));
            })
            .catch(() => {});
    }, []);

    const addToHistory = useCallback(async (item: Omit<HistoryItem, 'savedAt'>) => {
        setHistory((prev) => {
            // Remove duplicate (same name + coords)
            const filtered = prev.filter(
                (h) => !(Math.abs(h.lat - item.lat) < 1e-5 && Math.abs(h.lng - item.lng) < 1e-5)
            );
            const next: HistoryItem[] = [
                { ...item, savedAt: Date.now() },
                ...filtered,
            ].slice(0, MAX_ITEMS);

            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
            return next;
        });
    }, []);

    const clearHistory = useCallback(async () => {
        setHistory([]);
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }, []);

    const removeItem = useCallback(async (lat: number, lng: number) => {
        setHistory((prev) => {
            const next = prev.filter(
                (h) => !(Math.abs(h.lat - lat) < 1e-5 && Math.abs(h.lng - lng) < 1e-5)
            );
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
            return next;
        });
    }, []);

    return { history, addToHistory, clearHistory, removeItem };
}
