// File: about.js

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, Linking, StatusBar, StyleSheet // ✅ تم إضافة StyleSheet
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- DEFINITIONS (Themes & Translations) ---

const lightTheme = {
    background: '#f0f7f0', card: '#FFFFFF', textPrimary: '#212121',
    textSecondary: '#555555', primary: '#2e7d32', contactBg: '#e8f5e9',
    contactText: '#1b5e20', statusBar: 'dark-content',
};

const darkTheme = {
    background: '#121212', card: '#1E1E1E', textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0', primary: '#66BB6A', contactBg: '#2C2C2C',
    contactText: '#66BB6A', statusBar: 'light-content',
};

const translations = {
    ar: {
        headerTitle: 'حول',
        appName: 'Calora AI', slogan: 'رفيقك الصحي الذكي', aboutUsTitle: 'من نحن؟',
        aboutUsText: '"Calora AI" هو أكثر من مجرد تطبيق لتتبع السعرات الحرارية؛ إنه مساعدك الشخصي للوصول إلى أهدافك الصحية. نحن نؤمن بأن الحفاظ على نمط حياة صحي يجب أن يكون سهلاً ومتاحاً للجميع، وخاصة عند التعامل مع الأطباق المحلية التي نحبها.',
        featuresTitle: 'أهم الميزات', visionTitle: 'رؤيتنا',
        visionText: 'رؤيتنا هي تمكين كل شخص في منطقتنا من السيطرة على صحته من خلال تكنولوجيا بسيطة وذكية ومصممة خصيصاً لتناسب ثقافته وأسلوب حياته.',
        contactTitle: 'تواصل معنا',
        contactIntro: 'نحن هنا لنستمع إليك. إذا كان لديك أي أسئلة، اقتراحات، أو تحتاج إلى مساعدة، لا تتردد في التواصل معنا.',
        version: 'الإصدار 1.0.0', feature1Title: 'حاسبة سعرات بالذكاء الاصطناعي',
        feature1Desc: 'وجّه كاميرتك نحو وجبتك، وسيقوم تطبيقنا بتحليلها فوراً وتقديم معلومات غذائية دقيقة.',
        feature2Title: 'فهم عميق للمطبخ المحلي',
        feature2Desc: 'تم تدريب الذكاء الاصطناعي لدينا خصيصاً على الأطباق المصرية والشرق أوسطية لضمان أعلى دقة.',
        feature3Title: 'تتبع شامل للتقدم',
        feature3Desc: 'سجل وجباتك، تمارينك، شرب الماء، ووزنك في مكان واحد مع رسوم بيانية وتقارير واضحة.',
        feature4Title: 'تذكيرات ذكية ومخصصة',
        feature4Desc: 'لا تفوّت وجبة أو تمرين بعد الآن. قم بتفعيل التذكيرات لتبقى على المسار الصحيح نحو هدفك.',
    },
    en: {
        headerTitle: 'About',
        appName: 'Calora AI', slogan: 'Your Smart Health Companion', aboutUsTitle: 'About Us',
        aboutUsText: '"Calora AI" is more than just a calorie tracking app; it\'s your personal assistant for achieving your health goals. We believe that maintaining a healthy lifestyle should be easy and accessible for everyone, especially when dealing with the local dishes we love.',
        featuresTitle: 'Key Features', visionTitle: 'Our Vision',
        visionText: 'Our vision is to empower everyone in our region to take control of their health through simple, smart technology tailored to their culture and lifestyle.',
        contactTitle: 'Contact Us',
        contactIntro: 'We are here to listen. If you have any questions, suggestions, or need assistance, feel free to contact us.',
        version: 'Version 1.0.0', feature1Title: 'AI-Powered Calorie Counter',
        feature1Desc: 'Just point your camera at your meal, and our app will instantly analyze it, providing accurate nutritional information.',
        feature2Title: 'Deep Understanding of Local Cuisine',
        feature2Desc: 'Our AI is specially trained on Egyptian and Middle Eastern dishes to ensure the highest accuracy.',
        feature3Title: 'Comprehensive Progress Tracking',
        feature3Desc: 'Log your meals, workouts, water intake, and weight in one place with clear charts and reports.',
        feature4Title: 'Smart & Personalized Reminders',
        feature4Desc: 'Never miss a meal or workout again. Enable reminders to stay on track towards your goal.',
    }
};

const AboutScreen = () => {
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('ar');
    const [isRTL, setIsRTL] = useState(true);
    const navigation = useNavigation();

    const t = (key) => translations[language]?.[key] || key;
    
    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                try {
                    const savedTheme = await AsyncStorage.getItem('isDarkMode');
                    setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
                    const savedLang = await AsyncStorage.getItem('appLanguage');
                    const currentLang = savedLang || 'ar';
                    setLanguage(currentLang);
                    setIsRTL(currentLang === 'ar');
                } catch (error) { console.error("Failed to load settings from storage", error); }
            };
            loadSettings();
        }, [])
    );

    const features = useMemo(() => [
        { icon: 'camera-outline', title: t('feature1Title'), description: t('feature1Desc') },
        { icon: 'food-croissant', title: t('feature2Title'), description: t('feature2Desc') },
        { icon: 'chart-line', title: t('feature3Title'), description: t('feature3Desc') },
        { icon: 'bell-ring-outline', title: t('feature4Title'), description: t('feature4Desc') },
    ], [language, t]); // ✅ تم إضافة t للمصفوفة عشان الترجمة تتحدث صح

    const contactEmail = 'optifitstudio0@gmail.com';
    const handleEmailPress = () => { Linking.openURL(`mailto:${contactEmail}`); };

    // ✅ تم تحويل الـ styles object إلى StyleSheet.create لتجنب الأخطاء وتحسين الأداء
    const styles = getStyles(theme, isRTL);

    return (
        <SafeAreaView style={styles.rootContainer}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            
            <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name={isRTL ? "arrow-right" : "arrow-left"} size={28} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('headerTitle')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.appName}>{t('appName')}</Text>
                    <Text style={styles.slogan}>{t('slogan')}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('aboutUsTitle')}</Text>
                    <Text style={styles.sectionText}>{t('aboutUsText')}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('featuresTitle')}</Text>
                    {features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Icon name={feature.icon} size={35} color={theme.primary} style={styles.featureIcon} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('visionTitle')}</Text>
                    <Text style={styles.sectionText}>{t('visionText')}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('contactTitle')}</Text>
                    <Text style={styles.sectionText}>{t('contactIntro')}</Text>
                    <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
                        <Icon name="email-outline" size={24} color={theme.primary} />
                        <Text style={styles.contactText}>{contactEmail}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.footerText}>{t('version')}</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

// --- STYLES ---
// ✅ تم استخدام StyleSheet.create وهي الطريقة الصحيحة
const getStyles = (theme, isRTL) => StyleSheet.create({
    rootContainer: { flex: 1, backgroundColor: theme.background },
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    customHeader: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: theme.background,
    },
    backButton: { padding: 5, width: 40, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.textPrimary },
    header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    appName: { fontSize: 32, fontWeight: 'bold', color: theme.textPrimary },
    slogan: { fontSize: 16, color: theme.textSecondary, marginTop: 4 },
    card: { backgroundColor: theme.card, borderRadius: 12, padding: 20, marginBottom: 20, elevation: 3 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: theme.primary, marginBottom: 15, textAlign: isRTL ? 'right' : 'left' },
    sectionText: { fontSize: 16, lineHeight: 24, color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' },
    featureItem: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-start', marginBottom: 20 },
    featureIcon: { marginRight: isRTL ? 0 : 15, marginLeft: isRTL ? 15 : 0 },
    featureTextContainer: { flex: 1 },
    featureTitle: { fontSize: 17, fontWeight: 'bold', color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
    featureDescription: { fontSize: 14, color: theme.textSecondary, marginTop: 4, lineHeight: 20, textAlign: isRTL ? 'right' : 'left' },
    contactItem: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginTop: 20, backgroundColor: theme.contactBg, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignSelf: isRTL ? 'flex-end' : 'flex-start' },
    contactText: { fontSize: 16, color: theme.contactText, fontWeight: '500', marginHorizontal: 10 },
    footerText: { textAlign: 'center', color: theme.textSecondary, marginTop: 20, fontSize: 12 },
});

export default AboutScreen;