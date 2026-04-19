import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center pt-14 pb-4 px-4 bg-white shadow-sm z-10 w-full mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <MaterialCommunityIcons name="arrow-left" size={28} color="#334155" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-800 ml-4">Profile</Text>
      </View>

      <View className="items-center px-6">
        {/* Avatar */}
        <View className="w-28 h-28 rounded-full border-4 border-white shadow-lg mb-6 overflow-hidden bg-gray-200 justify-center items-center">
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} className="w-full h-full" />
          ) : (
            <MaterialCommunityIcons name="account" size={60} color="#9ca3af" />
          )}
        </View>

        {/* User Info */}
        <Text className="text-2xl font-bold text-slate-800 mb-1">
          {user?.fullName || "User"}
        </Text>
        <Text className="text-base text-slate-500 mb-8">
          {user?.primaryEmailAddress?.emailAddress || "No email provided"}
        </Text>

        {/* Actions */}
        <View className="w-full bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <TouchableOpacity 
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
            onPress={() => router.push('/(tabs)/favorites')}
          >
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
              <MaterialCommunityIcons name="star-outline" size={24} color="#3b82f6" />
            </View>
            <Text className="flex-1 text-lg font-medium text-slate-800">My Saved Routes</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
            onPress={handleSignOut}
          >
            <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-4">
              <MaterialCommunityIcons name="logout" size={22} color="#ef4444" />
            </View>
            <Text className="flex-1 text-lg font-medium text-slate-800">Sign Out</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
