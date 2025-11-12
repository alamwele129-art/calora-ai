// App.js - الكود الكامل والنهائي

import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import 'react-native-gesture-handler';

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, I18nManager, DevSettings } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from './supabaseclient'; 
import * as Linking from 'expo-linking'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoSplashScreen from 'expo-splash-screen';

// --- استيراد جميع الشاشات ---
import IndexScreen from './Index';
import SignInScreen from './signin';
import SignUpScreen from './signup';
import ForgotPasswordScreen from './forgotpassword';
import EmailVerificationScreen from './emailverification';
import ResetPasswordScreen from './resetpassword';
import BasicInfoScreen from './basicinfo';
import MeasurementsScreen from './measurements';
import GoalScreen from './goal';
import ActivityLevelScreen from './activitylevel';
import ResultsScreen from './results';
import MainUI from './mainui';
import SettingsScreen from './setting';

ExpoSplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

const App = () => {
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [appLanguage, setAppLanguage] = useState('en');

  const handleDeepLink = async (url) => {
    if (!url) return;
    const params = url.split('#')[1];
    if (params) {
        const parsedParams = params.split('&').reduce((acc, part) => {
            const [key, value] = part.split('=');
            acc[decodeURIComponent(key)] = decodeURIComponent(value);
            return acc;
        }, {});

        if (parsedParams.access_token && parsedParams.refresh_token) {
            await supabase.auth.setSession({
                access_token: parsedParams.access_token,
                refresh_token: parsedParams.refresh_token,
            });
        }
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('appLanguage');
        const currentLang = savedLang || 'en';
        setAppLanguage(currentLang);
        if (I18nManager.isRTL !== (currentLang === 'ar')) {
          I18nManager.forceRTL(currentLang === 'ar');
        }
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession?.user) {
          setIsOnboardingComplete(currentSession.user.user_metadata?.onboarding_complete || false);
        }
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setIsReady(true);
      }
    };
    
    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setIsOnboardingComplete(session.user.user_metadata?.onboarding_complete || false);
      } else {
        setIsOnboardingComplete(false);
      }
    });

    const linkSubscription = Linking.addEventListener('url', (event) => handleDeepLink(event.url));
    Linking.getInitialURL().then(url => handleDeepLink(url));
    
    return () => {
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  const getInitialRouteName = () => {
    if (session && session.user) {
      return isOnboardingComplete ? 'MainUI' : 'BasicInfo';
    }
    return 'Index';
  };

  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer} onLayout={onLayoutRootView}>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName={getInitialRouteName()} 
            screenOptions={{ headerShown: false }}
          >
            {/* ✅ تمرير اللغة لجميع الشاشات التي تحتاج للترجمة */}
            <Stack.Screen name="Index">
              {(props) => <IndexScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="SignIn">
              {(props) => <SignInScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="SignUp">
              {(props) => <SignUpScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="ForgotPassword">
              {(props) => <ForgotPasswordScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="EmailVerification">
              {(props) => <EmailVerificationScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="ResetPassword">
              {(props) => <ResetPasswordScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="BasicInfo">
              {(props) => <BasicInfoScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="Measurements">
              {(props) => <MeasurementsScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="Goal">
              {(props) => <GoalScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="ActivityLevel">
              {(props) => <ActivityLevelScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="Results">
              {(props) => <ResultsScreen {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
            <Stack.Screen name="Settings">
              {(props) => <SettingsScreen {...props} appLanguage={appLanguage} onThemeChange={async (isDark) => { await AsyncStorage.setItem('isDarkMode', String(isDark)); }} />}
            </Stack.Screen>
            <Stack.Screen name="MainUI">
              {(props) => <MainUI {...props} appLanguage={appLanguage} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: '#fff' },
});

export default App;
