import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View className="flex-1 bg-brand-black">
      {/* Header */}
      <View
        className="flex-row items-center pb-4 px-4 bg-brand-surface border-b border-brand-border z-10 w-full mb-6"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white ml-4">Профіль</Text>
      </View>

      <View className="items-center px-6">
        {/* Avatar */}
        <View className="w-28 h-28 rounded-full border-4 border-brand-border mb-6 overflow-hidden bg-brand-card justify-center items-center">
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} className="w-full h-full" />
          ) : (
            <MaterialCommunityIcons name="account" size={60} color="#999999" />
          )}
        </View>

        {/* User Info */}
        <Text className="text-2xl font-bold text-white mb-1">
          {user?.fullName || "Користувач"}
        </Text>
        <Text className="text-base text-brand-muted mb-8">
          {user?.primaryEmailAddress?.emailAddress || "Пошту не вказано"}
        </Text>

        {/* Actions */}
        <View className="w-full bg-brand-card rounded-2xl overflow-hidden mb-6 border border-brand-border">
          <TouchableOpacity
            className="flex-row items-center px-4 py-4 border-b border-brand-border"
            onPress={() => router.push('/(tabs)/favorites')}
          >
            <View className="w-10 h-10 rounded-full bg-brand-surface items-center justify-center mr-4">
              <MaterialCommunityIcons name="star-outline" size={24} color="#00B14F" />
            </View>
            <Text className="flex-1 text-lg font-medium text-white">Мої збережені маршрути</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center px-4 py-4"
            onPress={handleSignOut}
          >
            <View className="w-10 h-10 rounded-full bg-brand-surface items-center justify-center mr-4">
              <MaterialCommunityIcons name="logout" size={22} color="#ef4444" />
            </View>
            <Text className="flex-1 text-lg font-medium text-white">Вийти</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999999" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
