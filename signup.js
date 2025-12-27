import React, { useState, useCallback } from 'react';
import {
  View, Text, SafeAreaView, TextInput,
  TouchableOpacity, Image, StatusBar, Dimensions, Alert, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform
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

// Themes
const lightTheme = { primary: '#4CAF50', background: '#F8F9FA', card: '#FFFFFF', textPrimary: '#212529', textSecondary: '#6C757D', borderColor: '#E9ECEF', headerText: '#FFFFFF', statusBar: 'light-content', inputBackground: '#FFFFFF' };
const darkTheme = { primary: '#66BB6A', background: '#121212', card: '#1E1E1E', textPrimary: '#FFFFFF', textSecondary: '#B0B0B0', borderColor: '#2C2C2C', headerText: '#FFFFFF', statusBar: 'light-content', inputBackground: '#2C2C2C' };

// Translations
const translations = { 
    ar: { headerTitle: 'إنشاء حساب', headerSubtitle: 'انضم إلى مجتمعنا', cardTitle: 'حساب جديد', usernamePlaceholder: 'الاسم بالكامل', emailPlaceholder: 'البريد الإلكتروني', passwordPlaceholder: 'كلمة المرور', confirmPasswordPlaceholder: 'تأكيد كلمة المرور', signUpButton: 'إنشاء حساب', errorTitle: 'خطأ', fillFieldsError: 'الرجاء ملء جميع الحقول.', invalidEmailError: 'الرجاء إدخال بريد إلكتروني صحيح.', passwordMismatchError: 'كلمتا المرور غير متطابقتين.', accountCreationError: 'حدث خطأ أثناء إنشاء الحساب.', successTitle: 'تم بنجاح!', accountSuccess: 'تم إنشاء حسابك. برجاء التحقق من بريدك الإلكتروني لتفعيل الحساب قبل تسجيل الدخول.', dividerText: 'أو أنشئ حساب عبر' }, 
    en: { headerTitle: 'Create Account', headerSubtitle: 'Join our community', cardTitle: 'Sign Up', usernamePlaceholder: 'Full Name', emailPlaceholder: 'Email', passwordPlaceholder: 'Password', confirmPasswordPlaceholder: 'Confirm Password', signUpButton: 'Sign Up', errorTitle: 'Error', fillFieldsError: 'Please fill in all fields.', invalidEmailError: 'Please enter a valid email address.', passwordMismatchError: 'Passwords do not match.', accountCreationError: 'An error occurred while creating the account.', successTitle: 'Success!', accountSuccess: 'Your account has been created. Please check your email to activate your account before signing in.', dividerText: 'Or sign up with' } 
};

const SignUpScreen = ({ navigation, appLanguage }) => {
    const [theme, setTheme] = useState(lightTheme);
    
    // 1. تحديد اللغة
    const language = appLanguage || 'ar'; 
    const isAr = language === 'ar'; // استخدمت isAr عشان الكود يبقى أوضح
    const t = (key) => translations[language]?.[key] || key;

    // 2. عكسنا الإعدادات هنا بناء على طلبك
    const layoutConfig = {
        // إعدادات العربي (خليناه يتصرف LTR زي الانجليزي العادي)
        ar: {
            flexDirection: 'row',           // من الشمال لليمين
            textAlign: 'left',              // محاذاة يسار
            arrowIcon: 'arrow-left',        // سهم باصص شمال
            titleRowDir: 'row',             // العنوان ثم السهم
            inputAlign: 'left',             // الكتابة من الشمال
            headerAlign: 'flex-start',      // الهيدر يبدأ من الشمال
            rotateLeft: '10deg',
            rotateRight: '-9deg'
        },
        // إعدادات الإنجليزي (خليناه يتصرف RTL زي العربي)
        en: {
            flexDirection: 'row-reverse',   // من اليمين للشمال
            textAlign: 'right',             // محاذاة يمين
            arrowIcon: 'arrow-right',       // سهم باصص يمين
            titleRowDir: 'row-reverse',     // يعكس ترتيب العنوان والسهم
            inputAlign: 'right',            // الكتابة من اليمين
            headerAlign: 'flex-end',        // الهيدر يبدأ من اليمين
            rotateLeft: '-260deg',
            rotateRight: '260deg'
        }
    };

    // اختيار الإعداد المناسب
    const currentLayout = isAr ? layoutConfig.ar : layoutConfig.en;

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordSecure, setIsPasswordSecure] = useState(true);
    const [isConfirmPasswordSecure, setIsConfirmPasswordSecure] = useState(true);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [facebookLoading, setFacebookLoading] = useState(false);


    useFocusEffect(useCallback(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('isDarkMode');
                setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
            } catch (e) { console.error('Failed to load theme.', e); }
        };
        loadTheme();
    }, []));
    
    const handleEmailChange = (text) => {
        const englishEmailRegex = /^[a-zA-Z0-9@._-]*$/;
        if (englishEmailRegex.test(text)) { setEmail(text); }
    };

    const handleSignUp = async () => {
        if (!username.trim() || !email.trim() || !password || !confirmPassword) { Alert.alert(t('errorTitle'), t('fillFieldsError')); return; }
        if (!email.includes('@') || !email.includes('.')) { Alert.alert(t('errorTitle'), t('invalidEmailError')); return; }
        if (password !== confirmPassword) { Alert.alert(t('errorTitle'), t('passwordMismatchError')); return; }
        setLoading(true);
        try {
            const [firstName, ...lastNameParts] = username.trim().split(' ');
            const lastName = lastNameParts.join(' ');
            const { data, error } = await supabase.auth.signUp({ email: email.toLowerCase(), password: password, options: { data: { firstName: firstName, lastName: lastName, onboarding_complete: false } } });
            if (error) { Alert.alert(t('errorTitle'), error.message); } 
            else if (data.user) { Alert.alert(t('successTitle'), t('accountSuccess'), [{ text: 'Ok', onPress: () => navigation.navigate('SignIn') }]); }
        } catch (error) { Alert.alert(t('errorTitle'), t('accountCreationError')); } 
        finally { setLoading(false); }
    };
    
    const handleSocialSignIn = async (provider) => {
        // ... نفس كود السوشيال ميديا
    };

    return (
        <SafeAreaView style={styles.container(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    
                    {/* Header Section */}
                    {/* بنستخدم currentLayout.headerAlign عشان نحرك الكلام يمين أو شمال */}
                    <View style={[styles.header(theme), { alignItems: currentLayout.headerAlign }]}>
                        {/* الصور بتلف وتتحرك حسب اللغة */}
                        <Image source={require('./assets/palmleaf1.png')} style={[styles.headerImageLeft, { transform: [{ rotate: currentLayout.rotateLeft }], [isAr ? 'right' : 'left']: -40 }]} resizeMode="contain" />
                        <Image source={require('./assets/palmleaf.png')} style={[styles.headerImageRight, { transform: [{ rotate: currentLayout.rotateRight }], [isAr ? 'left' : 'right']: -40 }]} resizeMode="contain" />
                        
                        <Text style={[styles.title(theme), { textAlign: currentLayout.textAlign }]}>{t('headerTitle')}</Text>
                        <Text style={[styles.subtitle(theme), { textAlign: currentLayout.textAlign }]}>{t('headerSubtitle')}</Text>
                    </View>

                    {/* Card Section */}
                    <View style={styles.card(theme)}>
                        <View style={styles.cardContent}>
                            
                            {/* --- جزء العنوان والسهم --- */}
                            <View style={{ 
                                flexDirection: currentLayout.titleRowDir, // بيعكس الترتيب حسب اللغة
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginBottom: 15 
                            }}>
                                {/* النص */}
                                <Text style={{ 
                                    fontSize: 28, 
                                    fontWeight: 'bold', 
                                    color: theme.textPrimary,
                                }}>
                                    {t('cardTitle')}
                                </Text>
                                
                                {/* السهم - أيقونته بتتغير حسب الكونفيج */}
                                <TouchableOpacity style={{ padding: 5 }} onPress={() => navigation.goBack()}>
                                    <Icon name={currentLayout.arrowIcon} size={28} color={theme.textPrimary} />
                                </TouchableOpacity>
                            </View>
                            {/* ---------------------------------- */}

                            {/* Full Name */}
                            <View style={[styles.inputContainer(theme), { flexDirection: currentLayout.flexDirection }]}>
                                <Icon name="user" size={20} color={theme.textSecondary} style={{ marginHorizontal: 0 }} />
                                <TextInput 
                                    placeholder={t('usernamePlaceholder')} 
                                    placeholderTextColor={theme.textSecondary} 
                                    style={[styles.input(theme), { textAlign: currentLayout.inputAlign }]} 
                                    autoCapitalize="words" 
                                    value={username} 
                                    onChangeText={setUsername} 
                                />
                            </View>

                            {/* Email */}
                            <View style={[styles.inputContainer(theme), { flexDirection: currentLayout.flexDirection }]}>
                                <Icon name="mail" size={20} color={theme.textSecondary} style={{ marginHorizontal: 0 }} />
                                <TextInput 
                                    placeholder={t('emailPlaceholder')} 
                                    placeholderTextColor={theme.textSecondary} 
                                    style={[styles.input(theme), { textAlign: currentLayout.inputAlign }]} 
                                    keyboardType="email-address" 
                                    autoCapitalize="none" 
                                    value={email} 
                                    onChangeText={handleEmailChange} 
                                />
                            </View>

                            {/* Password */}
                            <View style={[styles.inputContainer(theme), { flexDirection: currentLayout.flexDirection }]}>
                                <Icon name="lock" size={20} color={theme.textSecondary} style={{ marginHorizontal: 0 }} />
                                <TextInput 
                                    placeholder={t('passwordPlaceholder')} 
                                    placeholderTextColor={theme.textSecondary} 
                                    style={[styles.input(theme), { textAlign: currentLayout.inputAlign }]} 
                                    secureTextEntry={isPasswordSecure} 
                                    value={password} 
                                    onChangeText={setPassword} 
                                />
                                <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)}>
                                    <Icon name={isPasswordSecure ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Confirm Password */}
                            <View style={[styles.inputContainer(theme), { flexDirection: currentLayout.flexDirection }]}>
                                <Icon name="lock" size={20} color={theme.textSecondary} style={{ marginHorizontal: 0 }} />
                                <TextInput 
                                    placeholder={t('confirmPasswordPlaceholder')} 
                                    placeholderTextColor={theme.textSecondary} 
                                    style={[styles.input(theme), { textAlign: currentLayout.inputAlign }]} 
                                    secureTextEntry={isConfirmPasswordSecure} 
                                    value={confirmPassword} 
                                    onChangeText={setConfirmPassword} 
                                />
                                <TouchableOpacity onPress={() => setIsConfirmPasswordSecure(!isConfirmPasswordSecure)}>
                                    <Icon name={isConfirmPasswordSecure ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.signUpButton(theme)} onPress={handleSignUp} disabled={loading}>
                                {loading ? <ActivityIndicator color={theme.headerText} /> : <Text style={styles.signUpButtonText(theme)}>{t('signUpButton')}</Text>}
                            </TouchableOpacity>

                            <View style={[styles.dividerContainer, { flexDirection: currentLayout.flexDirection }]}>
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
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = {
    container: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    
    header: (theme) => ({ 
        backgroundColor: theme.primary, 
        height: height * 0.3, 
        borderBottomLeftRadius: 50, 
        borderBottomRightRadius: 50, 
        justifyContent: 'center', 
        paddingHorizontal: 30, 
        paddingTop: 20, 
        position: 'relative', 
        overflow: 'hidden' 
    }),
    
    headerImageLeft: { 
        position: 'absolute', 
        top: -40, 
        width: 200, 
        height: 200, 
    },
    headerImageRight: { 
        position: 'absolute', 
        top: -40, 
        width: 200, 
        height: 200, 
    },
    
    title: (theme) => ({ 
        fontSize: 42, 
        fontWeight: 'bold', 
        color: theme.headerText, 
        width: '100%' 
    }),
    subtitle: (theme) => ({ 
        fontSize: 18, 
        color: theme.headerText, 
        marginTop: 5, 
        width: '100%' 
    }),
    
    card: (theme) => ({ marginHorizontal: 20, marginTop: -40, marginBottom: 20, backgroundColor: theme.card, borderRadius: 30, paddingHorizontal: 25, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15 }),
    cardContent: { justifyContent: 'center', paddingVertical: 25 },
    
    inputContainer: (theme) => ({ alignItems: 'center', backgroundColor: theme.inputBackground, borderRadius: 15, paddingHorizontal: 20, marginVertical: 8, borderWidth: 1, borderColor: theme.borderColor, height: 55 }),
    input: (theme) => ({ flex: 1, fontSize: 16, color: theme.textPrimary }),
    
    signUpButton: (theme) => ({ backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginTop: 15 }),
    signUpButtonText: (theme) => ({ color: theme.headerText, fontSize: 18, fontWeight: 'bold' }),
    
    dividerContainer: { alignItems: 'center', marginVertical: 20 },
    dividerLine: (theme) => ({ flex: 1, height: 1, backgroundColor: theme.borderColor }),
    dividerText: (theme) => ({ marginHorizontal: 15, color: theme.textSecondary }),
    
    socialContainer: { flexDirection: 'row', justifyContent: 'center', gap: 25 },
    socialButton: (theme) => ({ alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 15, borderWidth: 1, borderColor: theme.borderColor, backgroundColor: theme.card }),
    socialIconImage: { width: 28, height: 28 },
};

export default SignUpScreen;