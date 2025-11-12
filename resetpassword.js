// File: resetpassword.js (الكود الكامل والنهائي)

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, StatusBar, Dimensions, Image, Alert, ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseclient';

const { width, height } = Dimensions.get('window');

const lightTheme = { primary: '#4CAF50', secondary: '#2ECC71', background: '#FFFFFF', textPrimary: '#212529', textSecondary: '#6C757D', borderColor: '#E9ECEF', headerText: '#FFFFFF', statusBar: 'light-content', inputBackground: '#F7F8F9' };
const darkTheme = { primary: '#66BB6A', secondary: '#81C784', background: '#121212', textPrimary: '#FFFFFF', textSecondary: '#B0B0B0', borderColor: '#2C2C2C', headerText: '#FFFFFF', statusBar: 'light-content', inputBackground: '#1E1E1E' };
const translations = { ar: { headerTitle: 'إنشاء كلمة مرور جديدة', title: 'إعادة تعيين كلمة المرور', subtitle: 'يجب أن تكون كلمة مرورك الجديدة مختلفة عن كلمات المرور المستخدمة سابقًا.', newPasswordPlaceholder: 'كلمة المرور الجديدة', confirmPasswordPlaceholder: 'تأكيد كلمة المرور الجديدة', resetButton: 'إعادة تعيين كلمة المرور', errorTitle: 'خطأ', successTitle: 'نجاح', fillFieldsError: 'الرجاء ملء حقلي كلمة المرور.', passwordMismatchError: 'كلمتا المرور غير متطابقتين.', passwordSuccess: 'تم تغيير كلمة المرور بنجاح! جاري تسجيل الدخول...', passwordStrengthError: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' }, en: { headerTitle: 'Create New Password', title: 'Reset Your Password', subtitle: 'Your new password must be different from previously used passwords.', newPasswordPlaceholder: 'New Password', confirmPasswordPlaceholder: 'Confirm New Password', resetButton: 'Reset Password', errorTitle: 'Error', successTitle: 'Success', fillFieldsError: 'Please fill in both password fields.', passwordMismatchError: 'Passwords do not match.', passwordSuccess: 'Your password has been changed successfully! Logging you in...', passwordStrengthError: 'Password must be at least 6 characters.' } };

const HeaderComponent = ({ theme, isRTL, navigation, title }) => (
    <View style={styles.headerContainer}>
        <Svg height={height * 0.18} width={width} style={{ position: 'absolute', top: 0 }}>
            <Defs><LinearGradient id="grad-reset" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor={theme.primary} /><Stop offset="1" stopColor={theme.secondary} /></LinearGradient></Defs>
            <Path d={`M0,0 L${width},0 L${width},${height * 0.12} Q${width / 2},${height * 0.18} 0,${height * 0.12} Z`} fill="url(#grad-reset)" />
        </Svg>
        <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton(isRTL)} onPress={() => navigation.goBack()}>
                <Icon name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={theme.headerText} />
            </TouchableOpacity>
            <Text style={styles.headerTitle(theme)}>{title}</Text>
        </View>
    </View>
);

// 🔧 --- التعديل هنا: استقبال appLanguage --- 🔧
const ResetPasswordScreen = ({ navigation, appLanguage }) => {
    const [theme, setTheme] = useState(lightTheme);

    // ✅ نستخدم اللغة القادمة من App.js مباشرة
    const language = appLanguage || 'en';
    const isRTL = language === 'ar';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordSecure, setIsPasswordSecure] = useState(true);
    const [isConfirmSecure, setIsConfirmSecure] = useState(true);
    const [loading, setLoading] = useState(false);
    
    const t = (key) => translations[language]?.[key] || key;

    // 🔧 --- التعديل هنا: هذا الـ Hook الآن فقط للـ Theme --- 🔧
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

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) { Alert.alert(t('errorTitle'), t('fillFieldsError')); return; }
        if (password !== confirmPassword) { Alert.alert(t('errorTitle'), t('passwordMismatchError')); return; }
        if (password.length < 6) { Alert.alert(t('errorTitle'), t('passwordStrengthError')); return; }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) {
                Alert.alert(t('errorTitle'), error.message);
            } else {
                Alert.alert(t('successTitle'), t('passwordSuccess'), [ { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'MainUI' }] }) } ]);
            }
        } catch (error) {
            Alert.alert(t('errorTitle'), 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <HeaderComponent theme={theme} isRTL={isRTL} navigation={navigation} title={t('headerTitle')} />
                    <View style={styles.formContainer}>
                        <Text style={styles.title(theme)}>{t('title')}</Text>
                        <Text style={styles.subtitle(theme)}>{t('subtitle')}</Text>
                        <View style={styles.inputContainer(theme, isRTL)}>
                            <Icon name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon(isRTL)} />
                            <TextInput placeholder={t('newPasswordPlaceholder')} placeholderTextColor={theme.textSecondary} style={styles.input(theme, isRTL)} secureTextEntry={isPasswordSecure} value={password} onChangeText={setPassword} />
                            <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)}>
                                <Icon name={isPasswordSecure ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputContainer(theme, isRTL)}>
                            <Icon name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon(isRTL)} />
                            <TextInput placeholder={t('confirmPasswordPlaceholder')} placeholderTextColor={theme.textSecondary} style={styles.input(theme, isRTL)} secureTextEntry={isConfirmSecure} value={confirmPassword} onChangeText={setConfirmPassword} />
                            <TouchableOpacity onPress={() => setIsConfirmSecure(!isConfirmSecure)}>
                                <Icon name={isConfirmSecure ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.resetButton(theme)} onPress={handleResetPassword} disabled={loading}>
                            {loading ? <ActivityIndicator color={theme.headerText} /> : <Text style={styles.resetButtonText(theme)}>{t('resetButton')}</Text>}
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
    backButton: (isRTL) => ({ padding: 10, position: 'absolute', [isRTL ? 'right' : 'left']: 15, zIndex: 1 }),
    headerTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.headerText, textAlign: 'center', flex: 1 }),
    formContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 20 },
    title: (theme) => ({ fontSize: 26, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'center', marginBottom: 15 }),
    subtitle: (theme) => ({ fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 22 }),
    inputContainer: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: theme.inputBackground, borderRadius: 12, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: theme.borderColor, height: 58 }),
    inputIcon: (isRTL) => ({ [isRTL ? 'marginLeft' : 'marginRight']: 10 }),
    input: (theme, isRTL) => ({ flex: 1, fontSize: 16, color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }),
    resetButton: (theme) => ({ backgroundColor: theme.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 20, shadowColor: theme.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }),
    resetButtonText: (theme) => ({ color: theme.headerText, fontSize: 18, fontWeight: 'bold' }),
    footerImage: { width: width, height: 80, resizeMode: 'cover' },
};

export default ResetPasswordScreen;