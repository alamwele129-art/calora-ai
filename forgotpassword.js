// ForgotPasswordScreen.js

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, StatusBar, Dimensions, Image, Alert, ActivityIndicator,
  KeyboardAvoidingView, 
  Platform,
  ScrollView 
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseclient';

const { width, height } = Dimensions.get('window');

const lightTheme = { primary: '#4CAF50', secondary: '#2ECC71', background: '#FFFFFF', textPrimary: '#212529', textSecondary: '#6C757D', borderColor: '#E9ECEF', headerText: '#FFFFFF', statusBar: 'light-content', inputBackground: '#F7F8F9' };
const darkTheme = { primary: '#66BB6A', secondary: '#81C784', background: '#121212', textPrimary: '#FFFFFF', textSecondary: '#B0B0B0', borderColor: '#2C2C2C', headerText: '#FFFFFF', statusBar: 'light-content', inputBackground: '#1E1E1E' };

const translations = { 
    ar: { headerTitle: 'نسيت كلمة المرور', title: 'هل نسيت كلمة المرور؟', subtitle: 'أدخل عنوان البريد الإلكتروني المرتبط بحسابك.', placeholderEmail: 'البريد الإلكتروني', recoverButtonText: 'إرسال الرمز', alertTitle: 'خطأ', alertMessage: 'الرجاء إدخال عنوان بريد إلكتروني صحيح.', successTitle: 'تم الإرسال', successMessage: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. الرجاء التحقق من صندوق الوارد الخاص بك.' }, 
    en: { headerTitle: 'Forgot Password', title: 'Forgot Your Password?', subtitle: 'Enter the email address associated with your account.', placeholderEmail: 'Email', recoverButtonText: 'Send Link', alertTitle: 'Error', alertMessage: 'Please enter a valid email address.', successTitle: 'Sent', successMessage: 'A password reset link has been sent to your email. Please check your inbox.' } 
};

// 1. الهيدر بيستلم الـ layout عشان يعرف يحط السهم فين
const HeaderComponent = ({ theme, layout, navigation, title }) => {
    const pathData = `M0,0 L${width},0 L${width},${height * 0.12} Q${width / 2},${height * 0.18} 0,${height * 0.12} Z`;
    return (
      <View style={styles.headerContainer}>
        <Svg height={height * 0.18} width={width} style={{ position: 'absolute', top: 0 }}>
          <Defs><LinearGradient id="grad-forgot" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor={theme.primary} /><Stop offset="1" stopColor={theme.secondary} /></LinearGradient></Defs>
          <Path d={pathData} fill="url(#grad-forgot)" />
        </Svg>
        <View style={styles.headerContent}>
          
          {/* 👇 هنا السحر: بنغير مكان السهم بناءً على arrowPosition */}
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
};

const ForgotPasswordScreen = ({ navigation, appLanguage }) => {
    const [theme, setTheme] = useState(lightTheme);
    const language = appLanguage || 'en';
    
    // 2. إعدادات الاتجاهات (بما فيها مكان السهم)
    const layoutConfig = {
        // الإنجليزي: RTL (السهم يمين - أيقونات يمين)
        en: {
            direction: 'row-reverse',
            textAlign: 'left',
            arrowPosition: 'right',  // 👈 السهم هييجي يمين
            arrowIcon: 'arrow-left'
        },
        // العربي: LTR (السهم شمال - أيقونات شمال)
        ar: {
            direction: 'row',
            textAlign: 'right',
            arrowPosition: 'left',   // 👈 السهم هييجي شمال
            arrowIcon: 'arrow-right'
        }
    };

    const currentLayout = language === 'ar' ? layoutConfig.ar : layoutConfig.en;
    const t = (key) => translations[language]?.[key] || key;

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

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

    const validateEmail = (emailToValidate) => /\S+@\S+\.\S+/.test(emailToValidate);

    const handleRecover = async () => {
        if (!validateEmail(email)) { Alert.alert(t('alertTitle'), t('alertMessage')); return; }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {});
            if (error) { Alert.alert(t('alertTitle'), error.message); } 
            else { Alert.alert(t('successTitle'), t('successMessage'), [{ text: 'OK', onPress: () => navigation.goBack() }]); }
        } catch (error) { Alert.alert(t('alertTitle'), 'An unexpected error occurred.'); } 
        finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.safeArea(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    
                    {/* 3. تمرير الـ layout للهيدر */}
                    <HeaderComponent theme={theme} layout={currentLayout} navigation={navigation} title={t('headerTitle')} />
                    
                    <View style={styles.formContainer}>
                        <Text style={styles.title(theme)}>{t('title')}</Text>
                        <Text style={styles.subtitle(theme)}>{t('subtitle')}</Text>
                        
                        {/* استخدام الاتجاهات المعكوسة للحقول أيضاً */}
                        <View style={[styles.inputContainer(theme), { flexDirection: currentLayout.direction }]}>
                            <Icon name="mail" size={20} color={theme.textSecondary} style={{ marginHorizontal: 10 }} />
                            <TextInput
                                placeholder={t('placeholderEmail')}
                                placeholderTextColor={theme.textSecondary}
                                style={[styles.input(theme), { textAlign: currentLayout.textAlign }]}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                        
                        <TouchableOpacity style={styles.recoverButton(theme)} onPress={handleRecover} disabled={loading}>
                            {loading ? <ActivityIndicator color={theme.headerText} /> : <Text style={styles.recoverButtonText(theme)}>{t('recoverButtonText')}</Text>}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.footerImageContainer}>
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
    
    // 👇 شلنا الـ left/right الثابت من هنا عشان بنحطه ديناميك فوق
    backButton: { padding: 10, position: 'absolute', zIndex: 1 },
    
    headerTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.headerText, textAlign: 'center', flex: 1 }),
    formContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 20 },
    title: (theme) => ({ fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'center', marginBottom: 10 }),
    subtitle: (theme) => ({ fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 22 }),
    
    inputContainer: (theme) => ({ alignItems: 'center', backgroundColor: theme.inputBackground, borderRadius: 12, paddingHorizontal: 15, marginBottom: 25, borderWidth: 1, borderColor: theme.borderColor, height: 58 }),
    
    input: (theme) => ({ flex: 1, fontSize: 16, color: theme.textPrimary }),
    
    recoverButton: (theme) => ({ backgroundColor: theme.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: theme.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }),
    recoverButtonText: (theme) => ({ color: theme.headerText, fontSize: 18, fontWeight: 'bold' }),
    footerImageContainer: {},
    footerImage: { width: width, height: 80, resizeMode: 'cover' },
};

export default ForgotPasswordScreen;