// EmailVerificationScreen.js

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Dimensions, Image, KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseclient';

const { width, height } = Dimensions.get('window'); 

const lightTheme = { primary: '#4CAF50', secondary: '#2ECC71', background: '#FFFFFF', textPrimary: '#212529', textSecondary: '#6C757D', borderColor: '#E9ECEF', headerText: '#FFFFFF', statusBar: 'light-content', otpBoxBackground: '#F7F8F9' };
const darkTheme = { primary: '#66BB6A', secondary: '#81C784', background: '#121212', textPrimary: '#FFFFFF', textSecondary: '#B0B0B0', borderColor: '#2C2C2C', headerText: '#FFFFFF', statusBar: 'light-content', otpBoxBackground: '#1E1E1E' };

const translations = { 
    ar: { headerTitle: 'التحقق من البريد', title: 'تحقق من بريدك', subtitle: 'لقد أرسلنا رابطًا إلى بريدك الإلكتروني. انقر عليه للوصول إلى شاشة إعادة تعيين كلمة المرور.', backToLogin: 'العودة لتسجيل الدخول' }, 
    en: { headerTitle: 'Email Verification', title: 'Check Your Email', subtitle: 'We have sent a link to your email. Click it to proceed to the password reset screen.', backToLogin: 'Back to Login' } 
};

// 1. تعديل الهيدر ليستقبل layout ويغير مكان وشكل السهم
const HeaderComponent = ({ theme, layout, navigation, title }) => (
    <View style={styles.headerContainer}>
        <Svg height={height * 0.18} width={width} style={{ position: 'absolute', top: 0 }}>
            <Defs><LinearGradient id="grad-verify" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor={theme.primary} /><Stop offset="1" stopColor={theme.secondary} /></LinearGradient></Defs>
            <Path d={`M0,0 L${width},0 L${width},${height * 0.12} Q${width / 2},${height * 0.18} 0,${height * 0.12} Z`} fill="url(#grad-verify)" />
        </Svg>
        <View style={styles.headerContent}>
            {/* تحديد مكان السهم واسم الأيقونة بناءً على الإعدادات */}
            <TouchableOpacity 
                style={[styles.backButton, { [layout.arrowPosition]: 15 }]} 
                onPress={() => navigation.goBack()}
            >
                <Icon name={layout.arrowIcon} size={24} color={theme.headerText} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle(theme)}>{title}</Text>
        </View>
    </View>
);

const EmailVerificationScreen = ({ navigation, appLanguage }) => {
    const [theme, setTheme] = useState(lightTheme);
    const language = appLanguage || 'en';

    // 2. إعدادات الاتجاهات (العربي يمين، والإنجليزي يسار)
    const layoutConfig = {
        en: {
            arrowPosition: 'right',      // مكان السهم يسار
            arrowIcon: 'arrow-left'     // شكل السهم باصص يسار
        },
        ar: {
            arrowPosition: 'left',     // مكان السهم يمين
            arrowIcon: 'arrow-right'    // شكل السهم باصص يمين (للرجوع)
        }
    };

    const currentLayout = language === 'ar' ? layoutConfig.ar : layoutConfig.en;
    
    const t = (key) => translations[language]?.[key] || key;
    
    useFocusEffect(
        useCallback(() => {
            const loadTheme = async () => {
                try {
                    const savedTheme = await AsyncStorage.getItem('isDarkMode');
                    setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
                } catch (e) { console.error('Failed to load settings.', e); }
            };
            loadTheme();
        }, [])
    );

    return (
        <SafeAreaView style={styles.safeArea(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    
                    {/* 3. تمرير الـ layout للهيدر */}
                    <HeaderComponent theme={theme} layout={currentLayout} navigation={navigation} title={t('headerTitle')} />
                    
                    <View style={styles.formContainer}>
                        <Icon name="mail" size={60} color={theme.primary} style={{ marginBottom: 30 }} />
                        <Text style={styles.title(theme)}>{t('title')}</Text>
                        <Text style={styles.subtitle(theme)}>{t('subtitle')}</Text>
                        <TouchableOpacity style={styles.verifyButton(theme)} onPress={() => navigation.navigate('SignIn')}>
                            <Text style={styles.verifyButtonText(theme)}>{t('backToLogin')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View>
                        <Image source={require('./assets/leavesdecoration.png')} style={styles.footerImage} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = {
    safeArea: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    headerContainer: { height: height * 0.22 },
    headerContent: { marginTop: (StatusBar.currentHeight || 40) + 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 60 },
    
    // تم إزالة المنطق من هنا ليتم التحكم به عبر layoutConfig
    backButton: { padding: 10, position: 'absolute', zIndex: 1 },
    
    headerTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.headerText, textAlign: 'center', flex: 1 }),
    formContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, paddingBottom: 20 },
    title: (theme) => ({ fontSize: 26, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'center', marginBottom: 15 }),
    subtitle: (theme) => ({ fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 22, maxWidth: '90%', alignSelf: 'center' }),
    verifyButton: (theme) => ({ backgroundColor: theme.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', width: '100%', shadowColor: theme.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }),
    verifyButtonText: (theme) => ({ color: theme.headerText, fontSize: 18, fontWeight: 'bold' }),
    footerImage: { width: width, height: 80, resizeMode: 'cover' },
};
    
export default EmailVerificationScreen;