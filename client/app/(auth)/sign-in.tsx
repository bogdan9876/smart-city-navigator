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
    <View className="flex-1 justify-center px-6 bg-brand-black">
      <View className="items-center mb-10">
        <View className="w-16 h-16 rounded-2xl bg-brand-card border border-brand-border items-center justify-center mb-4">
          <MaterialCommunityIcons name="traffic-light" size={36} color="#00B14F" />
        </View>
        <Text className="text-3xl font-black text-white tracking-tight">Smart City</Text>
        <Text className="text-brand-muted text-base mt-1">Navigator</Text>
      </View>

      <TouchableOpacity
        onPress={onPressGoogle}
        className="flex-row items-center justify-center bg-brand-card py-4 rounded-xl mb-6 border border-brand-border"
      >
        <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
        <Text className="ml-3 font-semibold text-lg text-white">
          Continue with Google
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-[1px] bg-brand-border" />
        <Text className="mx-4 text-brand-muted font-medium">OR</Text>
        <View className="flex-1 h-[1px] bg-brand-border" />
      </View>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999999"
        className="w-full bg-brand-input p-4 rounded-xl mb-4 border border-brand-border text-white"
        value={emailAddress}
        onChangeText={setEmailAddress}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#999999"
        className="w-full bg-brand-input p-4 rounded-xl mb-6 border border-brand-border text-white"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={onSignInPress}
        className="bg-brand-accent py-4 rounded-xl items-center"
      >
        <Text className="text-brand-black font-bold text-lg">Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
