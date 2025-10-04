import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth, useOAuth } from '@clerk/clerk-expo';

export default function SSOCallback() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const params = useLocalSearchParams();

  useEffect(() => {
    // If user is already signed in, redirect to main app
    if (isSignedIn) {
      router.replace('/(tabs)');
      return;
    }

    // Handle the callback parameters if needed
    if (params.code || params.state) {
      // Clerk should handle this automatically
      // Just redirect to the auth flow
      router.replace('/(auth)');
    } else {
      // No auth params, redirect to auth
      router.replace('/(auth)');
    }
  }, [isSignedIn, params, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}