import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWarmUpBrowser } from '@/features/auth/hooks/useWarmUpBrowser';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  useWarmUpBrowser();

  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startGithubFlow } = useOAuth({ strategy: 'oauth_github' });
  const { startOAuthFlow: startFacebookFlow } = useOAuth({ strategy: 'oauth_facebook' });

  const handleOAuth = useCallback(
    async (startFlow: typeof startGithubFlow, label: string) => {
      try {
        const redirectUrl = Linking.createURL('/(tabs)');
        const { createdSessionId, signIn, signUp, setActive } = await startFlow({ redirectUrl });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        } else if (signIn?.createdSessionId && setActive) {
          await setActive({ session: signIn.createdSessionId });
        } else if (signUp?.createdSessionId && setActive) {
          await setActive({ session: signUp.createdSessionId });
        } else if (signUp?.unverifiedFields?.length || signUp?.missingFields?.length) {
          alert(`Incomplete Sign Up. Missing/Unverified: ${signUp?.missingFields?.join(', ') || signUp?.unverifiedFields?.join(', ')}`);
        }
      } catch (err: any) {
        console.error(`${label} OAuth error:`, err);
        const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || JSON.stringify(err);
        alert(`${label} Auth Error: ` + msg);
      }
    },
    [],
  );

  const onPressGoogle = useCallback(() => handleOAuth(startGoogleFlow, 'Google'), [handleOAuth, startGoogleFlow]);
  const onPressGithub = useCallback(() => handleOAuth(startGithubFlow, 'GitHub'), [handleOAuth, startGithubFlow]);
  const onPressFacebook = useCallback(() => handleOAuth(startFacebookFlow, 'Facebook'), [handleOAuth, startFacebookFlow]);

  return (
    <SafeAreaView className="flex-1 bg-brand-black">
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-brand-card border border-brand-border items-center justify-center mb-4">
            <MaterialCommunityIcons name="traffic-light" size={36} color="#00B14F" />
          </View>
          <Text className="text-3xl font-black text-white tracking-tight">Smart City</Text>
          <Text className="text-brand-muted text-base mt-1">Навігатор</Text>
        </View>

        <TouchableOpacity
          onPress={onPressGoogle}
          className="flex-row items-center justify-center bg-brand-card py-4 rounded-xl mb-4 border border-brand-border"
        >
          <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
          <Text className="ml-3 font-semibold text-lg text-white">
            Увійти через Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressGithub}
          className="flex-row items-center justify-center bg-brand-card py-4 rounded-xl mb-4 border border-brand-border"
        >
          <MaterialCommunityIcons name="github" size={24} color="#FFFFFF" />
          <Text className="ml-3 font-semibold text-lg text-white">
            Увійти через GitHub
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressFacebook}
          className="flex-row items-center justify-center bg-brand-card py-4 rounded-xl border border-brand-border"
        >
          <MaterialCommunityIcons name="facebook" size={24} color="#1877F2" />
          <Text className="ml-3 font-semibold text-lg text-white">
            Увійти через Facebook
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
