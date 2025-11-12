import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from './supabaseclient';

// ===================================================================
// --- 1. الثيمات والترجمات ---
// ===================================================================
const lightTheme = {
  primary: '#388E3C', textAndIcons: '#2E7D32', background: '#F9FBFA', white: '#FFFFFF',
  cardBorder: '#EFF2F1', grayText: '#888888', disabled: '#A5D6A7', statusBar: 'dark-content',
  shadowColor: '#000', cardShadowOpacity: 0.1, buttonTextColor: '#FFFFFF',
};
const darkTheme = {
  primary: '#66BB6A', textAndIcons: '#AED581', background: '#121212', white: '#1E1E1E',
  cardBorder: '#272727', grayText: '#B0B0B0', disabled: '#424242', statusBar: 'light-content',
  shadowColor: '#000', cardShadowOpacity: 0.25, buttonTextColor: '#121212',
};
const translations = {
  en: {
    title: "Your Custom Plan is Ready!", resultUnit: "calories per day",
    infoText: "This is your suggested daily goal to reach your target weight. You can adjust this goal later in your account settings.",
    buttonTitle: "Let's Get Started!", errorSaving: "Failed to save your data. Please try again.",
  },
  ar: {
    title: "خطتك المخصصة جاهزة!", resultUnit: "سعر حراري يومياً",
    infoText: "هذا هو هدفك اليومي المقترح للوصول إلى وزنك المستهدف. يمكنك تعديل هذا الهدف لاحقاً من إعدادات حسابك.",
    buttonTitle: "لنبدأ!", errorSaving: "فشل في حفظ بياناتك. الرجاء المحاولة مرة أخرى.",
  },
};

// ===================================================================
// --- 2. المكونات الاحترافية ---
// ===================================================================
const PrimaryButton = ({ title, onPress, disabled = false, theme }) => (
  <Pressable
    style={({ pressed }) => [
      styles.button(theme),
      disabled ? styles.buttonDisabled(theme) : styles.buttonEnabled(theme),
      pressed && !disabled && styles.buttonPressed,
    ]}
    onPress={() => { if (!disabled) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onPress(); } }}
    disabled={disabled}>
    <Text style={styles.buttonText(theme)}>{title}</Text>
  </Pressable>
);

// ===================================================================
// --- 3. دالة حساب السعرات الحرارية ---
// ===================================================================
const calculateCalories = (userData) => {
  if (!userData || !userData.birthDate || !userData.weight || !userData.height || !userData.gender || !userData.activityLevel || !userData.goal) {
    return 2000; 
  }
  const { birthDate, gender, weight, height, activityLevel, goal } = userData;
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  let bmr = (gender === 'male')
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const activityMultipliers = { sedentary: 1.2, light: 1.375, active: 1.55, very_active: 1.725 };
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  const tdee = bmr * multiplier;
  let finalCalories;
  switch (goal) {
    case 'lose': finalCalories = tdee - 500; break;
    case 'gain': finalCalories = tdee + 500; break;
    default: finalCalories = tdee; break;
  }
  return Math.max(1200, Math.round(finalCalories));
};

// ===================================================================
// --- 4. شاشة عرض الخطة (ResultsScreen) ---
// ===================================================================
const ResultsScreen = ({ route, navigation }) => {
  const [theme, setTheme] = useState(lightTheme);
  const [language, setLanguage] = useState('ar');
  const t = (key) => translations[language][key] || translations['en'][key];
  const userData = route?.params?.userData;
  const calculatedCalories = useMemo(() => calculateCalories(userData), [userData]);
  const animation = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      const loadSettings = async () => {
        try {
          const savedTheme = await AsyncStorage.getItem('isDarkMode');
          setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
          const savedLang = await AsyncStorage.getItem('appLanguage');
          setLanguage(savedLang || 'ar');
        } catch (e) {
          console.error("Failed to load settings", e);
        }
      };
      loadSettings();
      animation.setValue(0);
      Animated.spring(animation, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [animation])
  );

  const animatedStyle = {
    opacity: animation,
    transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
  };

  const handleStartJourney = async () => {
    try {
      // 1. تحديث بيانات المستخدم في Supabase بمعلومتين: الإعداد اكتمل + الهدف اليومي للسعرات
      const { error } = await supabase.auth.updateUser({
        data: { 
          onboarding_complete: true,
          daily_goal: calculatedCalories // ✅✅✅ الإضافة الحاسمة هنا
        }
      });

      if (error) throw error;

      // 2. تجميع بيانات الملف الشخصي للتخزين المحلي
      const userProfile = {
        dailyGoal: calculatedCalories,
        ...userData
      };
      
      // 3. حفظ البيانات محلياً للوصول السريع
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      await AsyncStorage.setItem('onboardingComplete', 'true');

      // 4. الانتقال إلى الشاشة الرئيسية
      navigation.replace('MainUI', { 
        screen: 'Diary', 
        params: { dailyGoal: calculatedCalories } 
      });

    } catch (e) {
      console.error(t('errorSaving'), e);
      Alert.alert('Error', t('errorSaving'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea(theme)}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <View style={styles.container}>
        <View />
        <View style={styles.mainContent}>
          <Icon name="check-decagram" size={60} color={theme.primary} />
          <Text style={styles.title(theme)}>{t('title')}</Text>
          <Animated.View style={[styles.resultCard(theme), animatedStyle]}>
            <Text style={styles.resultNumber(theme)}>{calculatedCalories}</Text>
            <Text style={styles.resultUnit(theme)}>{t('resultUnit')}</Text>
          </Animated.View>
          <Text style={styles.infoText(theme)}>{t('infoText')}</Text>
        </View>
        <View style={styles.footer}>
          <PrimaryButton title={t('buttonTitle')} onPress={handleStartJourney} theme={theme} />
        </View>
      </View>
    </SafeAreaView>
  );
};

// ===================================================================
// --- 5. الأنماط ---
// ===================================================================
const styles = {
  safeArea: (theme) => ({ flex: 1, backgroundColor: theme.background }),
  container: { flex: 1, padding: 24, justifyContent: 'space-between', alignItems: 'center' },
  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  title: (theme) => ({ fontSize: 28, fontWeight: 'bold', color: theme.textAndIcons, textAlign: 'center', marginTop: 16, marginBottom: 30 }),
  resultCard: (theme) => ({ backgroundColor: theme.white, borderRadius: 16, paddingVertical: 30, paddingHorizontal: 40, alignItems: 'center', width: '100%', shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 5 }, shadowOpacity: theme.cardShadowOpacity, shadowRadius: 15, elevation: 8 }),
  resultNumber: (theme) => ({ fontSize: 64, fontWeight: 'bold', color: theme.primary, fontVariant: ['tabular-nums'] }),
  resultUnit: (theme) => ({ fontSize: 18, color: theme.textAndIcons, marginTop: 8 }),
  infoText: (theme) => ({ fontSize: 15, color: theme.grayText, textAlign: 'center', lineHeight: 24, marginTop: 30, paddingHorizontal: 10 }),
  footer: { width: '100%', paddingTop: 10 },
  button: (theme) => ({ paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%', shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 }),
  buttonEnabled: (theme) => ({ backgroundColor: theme.primary }),
  buttonDisabled: (theme) => ({ backgroundColor: theme.disabled }),
  buttonPressed: { transform: [{ scale: 0.98 }], shadowOpacity: 0.15 },
  buttonText: (theme) => ({ color: theme.buttonTextColor, fontSize: 18, fontWeight: 'bold' }),
};

export default ResultsScreen;