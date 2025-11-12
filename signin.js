// SignInScreen.js (الكود الكامل والنهائي - هذا هو الكود الصحيح)

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, Image, StatusBar, Dimensions, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseclient';

import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

const lightTheme = {
    primary: '#4CAF50', background: '#F8F9FA', card: '#FFFFFF', textPrimary: '#212529',
    textSecondary: '#6C757D', borderColor: '#E9ECEF', headerText: '#FFFFFF',
    statusBar: 'light-content', inputBackground: '#FFFFFF',
};
const darkTheme = {
    primary: '#66BB6A', background: '#121212', card: '#1E1E1E', textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0', borderColor: '#2C2C2C', headerText: '#FFFFFF',
    statusBar: 'light-content', inputBackground: '#2C2C2C',
};
const translations = {
    ar: {
        headerTitle: 'أهلاً بك!', headerSubtitle: 'مرحباً بعودتك', cardTitle: 'تسجيل الدخول',
        emailPlaceholder: 'البريد الإلكتروني', passwordPlaceholder: 'كلمة المرور',
        forgotPasswordLink: 'هل نسيت كلمة المرور؟', loginButton: 'تسجيل الدخول',
        dividerText: 'أو سجل الدخول عبر', noAccountText: 'ليس لديك حساب؟ ',
        signUpLink: 'إنشاء حساب', errorTitle: 'خطأ',
        fillFieldsError: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.',
        activationRequiredTitle: 'تفعيل الحساب مطلوب',
        activationRequiredMessage: 'يجب عليك تفعيل حسابك أولاً. برجاء التحقق من الرابط الذي تم إرساله إلى بريدك الإلكتروني.',
        unexpectedError: 'حدث خطأ غير متوقع.',
    },
    en: {
        headerTitle: 'Hello!', headerSubtitle: 'Welcome back', cardTitle: 'Login',
        emailPlaceholder: 'Email', passwordPlaceholder: 'Password',
        forgotPasswordLink: 'Forgot Password?', loginButton: 'Login',
        dividerText: 'Or login with', noAccountText: "Don't have an account? ",
        signUpLink: 'Sign Up', errorTitle: 'Error',
        fillFieldsError: 'Please enter your email and password.',
        activationRequiredTitle: 'Account Activation Required',
        activationRequiredMessage: 'You must activate your account first. Please check the link sent to your email.',
        unexpectedError: 'An unexpected error occurred.',
    }
};

const SignInScreen = ({ navigation, appLanguage }) => {
    const [theme, setTheme] = useState(lightTheme);
    const language = appLanguage || 'en';
    const isRTL = language === 'ar';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordSecure, setIsPasswordSecure] = useState(true);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [facebookLoading, setFacebookLoading] = useState(false);

    const t = (key) => translations[language]?.[key] || key;

    useFocusEffect(
        useCallback(() => {
            const loadTheme = async () => {
                try {
                    const savedTheme = await AsyncStorage.getItem('isDarkMode');
                    setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
                } catch (e) { console.error('Failed to load theme.', e); }
            };
            loadTheme();
        }, [])
    );

    const handleEmailChange = (text) => {
        const englishEmailRegex = /^[a-zA-Z0-9@._-]*$/;
        if (englishEmailRegex.test(text)) { setEmail(text); }
    };
    
    const handleSignIn = async () => {
        if (!email.trim() || !password) {
            Alert.alert(t('errorTitle'), t('fillFieldsError'));
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password: password });
            if (error) { 
                Alert.alert(t('errorTitle'), error.message); 
            } else if (data?.user) {
                if (data.user.email_confirmed_at) {
                    const { user } = data;
                    const isNewUser = !user.user_metadata?.onboarding_complete;
                    const profileData = {
                        email: user.email,
                        firstName: user.user_metadata?.firstName || '',
                        lastName: user.user_metadata?.lastName || '',
                    };
                    await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
                    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                    if (isNewUser) { navigation.replace('BasicInfo'); } else { navigation.replace('MainUI'); }
                } else {
                    Alert.alert(t('activationRequiredTitle'), t('activationRequiredMessage'));
                }
            }
        } catch (error) {
            Alert.alert(t('errorTitle'), t('unexpectedError'));
            console.error(error);
        } finally { setLoading(false); }
    };
    
    const handleSocialSignIn = async (provider) => {
        if (provider === 'google') setGoogleLoading(true);
        if (provider === 'facebook') setFacebookLoading(true);
        try {
            const redirectUri = makeRedirectUri({ scheme: 'calora' }); 
            const { data, error } = await supabase.auth.signInWithOAuth({ provider: provider, options: { redirectTo: redirectUri } });
            if (error) throw error;
            const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
            if (res.type === 'success') {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { user } = session;
                    const isNewUser = !user.user_metadata?.onboarding_complete;
                    const userName = user.user_metadata?.full_name || user.user_metadata?.name || '';
                    const [firstName, ...lastNameParts] = userName.split(' ');
                    const lastName = lastNameParts.join(' ').trim();
                    const profileData = { email: user.email, firstName, lastName };
                    await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
                    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                    if (isNewUser) { navigation.replace('BasicInfo'); } else { navigation.replace('MainUI'); }
                } 
            }
        } catch (error) {
            Alert.alert(t('errorTitle'), error.message || t('unexpectedError'));
        } finally {
            if (provider === 'google') setGoogleLoading(false);
            if (provider === 'facebook') setFacebookLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={styles.header(theme)}>
                        <Image source={require('./assets/leafshadowcorner.png')} style={styles.headerImageTopLeft(isRTL)} resizeMode="contain" />
                        <Image source={require('./assets/palmleaf3.png')} style={styles.headerImageBottomRight(isRTL)} resizeMode="contain" />
                        <Text style={styles.title(theme, isRTL)}>{t('headerTitle')}</Text>
                        <Text style={styles.subtitle(theme, isRTL)}>{t('headerSubtitle')}</Text>
                    </View>
                    <View style={styles.formContainer}>
                        <View style={styles.card(theme)}>
                            <Text style={styles.loginTitle(theme)}>{t('cardTitle')}</Text>
                            <View style={styles.inputContainer(theme, isRTL)}>
                                <Icon name="mail" size={20} color={theme.textSecondary} style={styles.inputIcon(isRTL)} />
                                <TextInput placeholder={t('emailPlaceholder')} placeholderTextColor={theme.textSecondary} style={styles.input(theme, isRTL)} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={handleEmailChange} />
                            </View>
                            <View style={styles.inputContainer(theme, isRTL)}>
                                <Icon name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon(isRTL)} />
                                <TextInput placeholder={t('passwordPlaceholder')} placeholderTextColor={theme.textSecondary} style={styles.input(theme, isRTL)} secureTextEntry={isPasswordSecure} value={password} onChangeText={setPassword} />
                                <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)}>
                                    <Icon name={isPasswordSecure ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={styles.forgotPassword(theme, isRTL)}>{t('forgotPasswordLink')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.loginButton(theme)} onPress={handleSignIn} disabled={loading}>
                                {loading ? <ActivityIndicator color={theme.headerText} /> : <Text style={styles.loginButtonText(theme)}>{t('loginButton')}</Text>}
                            </TouchableOpacity>
                            <View style={styles.dividerContainer(isRTL)}>
                                <View style={styles.dividerLine(theme)} />
                                <Text style={styles.dividerText(theme)}>{t('dividerText')}</Text>
                                <View style={styles.dividerLine(theme)} />
                            </View>
                            <View style={styles.socialContainer}>
                                <TouchableOpacity style={styles.socialButton(theme)} onPress={() => handleSocialSignIn('google')} disabled={googleLoading}>
                                    {googleLoading ? <ActivityIndicator color={theme.primary} /> : <Image source={require('./assets/google.png')} style={styles.socialIconImage} />}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialButton(theme)} onPress={() => handleSocialSignIn('facebook')} disabled={facebookLoading}>
                                    {facebookLoading ? <ActivityIndicator color="#4267B2" /> : <FontAwesome name="facebook-f" size={24} color="#4267B2" />}
                                </TouchableOpacity>
                            </View>
                            <View style={styles.signUpContainer(isRTL)}>
                                <Text style={styles.signUpText(theme)}>{t('noAccountText')}</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                    <Text style={styles.signUpLink(theme)}>{t('signUpLink')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = {
    safeArea: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    header: (theme) => ({ backgroundColor: theme.primary, height: height * 0.35, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, justifyContent: 'flex-start', paddingHorizontal: 30, paddingTop: 60, position: 'relative', overflow: 'hidden' }),
    headerImageTopLeft: (isRTL) => ({ position: 'absolute', top: -60, ...(isRTL ? { right: -70, transform: [{ scaleX: -1 }] } : { left: -70 }), width: 290, height: 290, opacity: 0.8 }),
    headerImageBottomRight: (isRTL) => ({ position: 'absolute', bottom: -7, ...(isRTL ? { left: 20 } : { right: 20 }), width: 130, height: 130, zIndex: 2 }),
    title: (theme, isRTL) => ({ fontSize: 42, fontWeight: 'bold', color: theme.headerText, textAlign: isRTL ? 'right' : 'left' }),
    subtitle: (theme, isRTL) => ({ fontSize: 18, color: theme.headerText, marginTop: 5, textAlign: isRTL ? 'right' : 'left' }),
    formContainer: { flex: 1, paddingHorizontal: 20, marginTop: -40, zIndex: 1 },
    card: (theme) => ({ backgroundColor: theme.card, borderRadius: 30, paddingVertical: 30, paddingHorizontal: 25, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, marginBottom: 20 }),
    loginTitle: (theme) => ({ fontSize: 28, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 20, textAlign: 'center' }),
    inputContainer: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: theme.inputBackground, borderRadius: 15, paddingHorizontal: 20, marginVertical: 8, borderWidth: 1, borderColor: theme.borderColor, height: 55 }),
    inputIcon: (isRTL) => ({ [isRTL ? 'marginLeft' : 'marginRight']: 15 }),
    input: (theme, isRTL) => ({ flex: 1, fontSize: 16, color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }),
    forgotPassword: (theme, isRTL) => ({ textAlign: isRTL ? 'left' : 'right', color: theme.primary, fontSize: 14, fontWeight: '600', marginVertical: 10 }),
    loginButton: (theme) => ({ backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginTop: 8 }),
    loginButtonText: (theme) => ({ color: theme.headerText, fontSize: 18, fontWeight: 'bold' }),
    dividerContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginVertical: 20 }),
    dividerLine: (theme) => ({ flex: 1, height: 1, backgroundColor: theme.borderColor }),
    dividerText: (theme) => ({ marginHorizontal: 15, color: theme.textSecondary }),
    socialContainer: { flexDirection: 'row', justifyContent: 'center', gap: 25 },
    socialButton: (theme) => ({ alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 15, borderWidth: 1, borderColor: theme.borderColor, backgroundColor: theme.card }),
    socialIconImage: { width: 28, height: 28 },
    signUpContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }),
    signUpText: (theme) => ({ color: theme.textSecondary, fontSize: 14 }),
    signUpLink: (theme) => ({ color: theme.primary, fontWeight: 'bold' }),
};

export default SignInScreen;