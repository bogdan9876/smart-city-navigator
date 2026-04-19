import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  useWarmUpBrowser();

  const { signIn, setActive, isLoaded } = useSignIn();

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  const onSignInPress = async () => {
    if (!isLoaded) {
      alert("Почекайте, Clerk ще завантажується (або відсутній ключ в .env)");
      return;
    }
    try {
      const completeSignIn = await signIn.create({ identifier: emailAddress, password });
      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Невідома помилка";
      alert("Auth Error: " + msg);
    }
  };

  const onPressGoogle = useCallback(async () => {
    try {
      const redirectUrl = Linking.createURL('/(tabs)');
      const { createdSessionId, signIn, signUp, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
      } else {

        if (signIn?.createdSessionId && setOAuthActive) {
          await setOAuthActive({ session: signIn.createdSessionId });
        } else if (signUp?.createdSessionId && setOAuthActive) {
          await setOAuthActive({ session: signUp.createdSessionId });
        } else if (signUp?.unverifiedFields?.length || signUp?.missingFields?.length) {
          alert(`Incomplete Sign Up. Missing/Unverified: ${signUp?.missingFields?.join(', ') || signUp?.unverifiedFields?.join(', ')}`);
        }
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || JSON.stringify(err);
      alert("Google Auth Error: " + msg);
    }
  }, [startOAuthFlow]);

  return (
    <View className="flex-1 justify-center px-6 bg-slate-50">
      <Text className="text-3xl font-bold text-slate-800 mb-8 text-center bg-white p-4 rounded-xl border border-gray-200">
        Sign In
      </Text>

      <TouchableOpacity
        onPress={onPressGoogle}
        className="flex-row items-center justify-center bg-white py-4 rounded-xl mb-6 border border-gray-300 shadow-sm"
      >
        <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
        <Text className="ml-3 font-semibold text-lg text-gray-800">
          Continue with Google
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-[1px] bg-gray-300" />
        <Text className="mx-4 text-gray-500 font-medium">OR</Text>
        <View className="flex-1 h-[1px] bg-gray-300" />
      </View>

      <TextInput
        placeholder="Email"
        className="w-full bg-white p-4 rounded-xl mb-4 border border-gray-200"
        value={emailAddress}
        onChangeText={setEmailAddress}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        className="w-full bg-white p-4 rounded-xl mb-6 border border-gray-200"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={onSignInPress}
        className="bg-blue-600 py-4 rounded-xl items-center"
      >
        <Text className="text-white font-bold text-lg">Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
