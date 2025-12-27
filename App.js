import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import 'react-native-gesture-handler';

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, I18nManager, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from './supabaseclient';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from './Splash'; 
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

const Stack = createStackNavigator();

const App = () => {
  const [session, setSession] = useState(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [appLanguage, setAppLanguage] = useState('en');
  const [appIsReady, setAppIsReady] = useState(false);

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
        const isRTLRequired = currentLang === 'ar';

        // ضبط إعدادات الـ RTL عند بدء التشغيل
        I18nManager.allowRTL(true);
        if (isRTLRequired !== I18nManager.isRTL) {
            I18nManager.forceRTL(isRTLRequired);
            // قد نحتاج لإعادة تشغيل أخرى في بعض الحالات النادرة، لكن غالباً هذا يكفي
        }

        setAppLanguage(currentLang);

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (currentSession?.user) {
          setIsOnboardingComplete(currentSession.user.user_metadata?.onboarding_complete || false);
        }

      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setTimeout(() => {
          setAppIsReady(true);
        }, 2500);
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

  if (!appIsReady) {
    return <SplashScreen />;
  }

  const getInitialRouteName = () => {
    if (session && session.user) {
      return isOnboardingComplete ? 'MainUI' : 'BasicInfo';
    }
    return 'Index';
  };

  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={getInitialRouteName()}
            screenOptions={{ headerShown: false }}
          >
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