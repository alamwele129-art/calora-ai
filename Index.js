// In IndexScreen.js (الكود الكامل والنهائي والمعدل)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, Dimensions,
  TouchableOpacity, StatusBar, SafeAreaView, Animated, I18nManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// ==========================================================
// ===== الثيمات والترجمات (بدون تغيير) =====
// ==========================================================
const lightTheme = {
    background: '#F6FEF6', primary: '#4CAF50', text: '#333333',
    inactive: '#A5D6A7', white: '#FFFFFF', statusBar: 'dark-content',
};
const darkTheme = {
    background: '#121212', primary: '#66BB6A', text: '#E0E0E0',
    inactive: '#424242', white: '#1E1E1E', statusBar: 'light-content',
};
const translations = {
    ar: {
        cameraTitle: 'الكاميرا هي أخصائي التغذية الخاص بك',
        cameraDesc: 'التقط صورة لوجبتك، وسيقوم الذكاء الاصطناعي بتحليلها فورًا، مزودًا إياك بسعرات حرارية وماكروز دقيقة (بروتين، كربوهيدرات، ودهون) بكل سهولة.',
        accuracyTitle: 'دقة تفهمك',
        accuracyDesc: 'هل سئمت من التطبيقات التي لا تتعرف على أطباقك المحلية المفضلة؟ الذكاء الاصطناعي لدينا مدرب خصيصًا على المطبخ المصري والشرق أوسطي ليمنحك معلومات غذائية تثق بها.',
        resultsTitle: 'حوّل المعرفة إلى نتائج',
        resultsDesc: 'حدد أهدافك، تتبع تقدمك برسوم بيانية واضحة، واتخذ خيارات غذائية أذكى كل يوم. رحلتك الصحية لم تكن بهذه البساطة والوضوح من قبل.',
        nextButton: 'التالي', signInButton: 'تسجيل الدخول', signUpButton: 'إنشاء حساب',
    },
    en: {
        cameraTitle: 'Your Camera is Your Nutritionist',
        cameraDesc: 'Just snap a photo of your meal, and our AI instantly analyzes it, providing you with accurate calories and macros (protein, carbs, and fats) with ease.',
        accuracyTitle: 'Accuracy That Understands You',
        accuracyDesc: 'Tired of apps that don’t recognize your favorite local dishes? Our AI is specially trained on Egyptian & Middle Eastern cuisine to give you nutritional info you can trust.',
        resultsTitle: 'Turn Knowledge into Results',
        resultsDesc: 'Set your goals, track your progress with clear charts, and make smarter food choices every day. Your health journey has never been this simple and clear.',
        nextButton: 'Next', signInButton: 'Sign In', signUpButton: 'Sign Up',
    }
};
const slidesContent = [
    { id: '1', image: require('./assets/scan.png'), titleKey: 'cameraTitle', descriptionKey: 'cameraDesc' },
    { id: '2', image: require('./assets/calorie.png'), titleKey: 'accuracyTitle', descriptionKey: 'accuracyDesc' },
    { id: '3', image: require('./assets/goal.png'), titleKey: 'resultsTitle', descriptionKey: 'resultsDesc' }
];
const getItemLayout = (_, index) => ({ length: width, offset: width * index, index });

const IndexScreen = ({ navigation, route, appLanguage }) => {
    const [theme, setTheme] = useState(lightTheme);
    const language = appLanguage; 
    const isRTL = language === 'ar';
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const t = (key) => translations[language]?.[key] || key;

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('isDarkMode');
                setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
            } catch (e) {
                console.error('Failed to load theme.', e);
            }
        };
        loadTheme();
    }, []);
    
    useFocusEffect(
        useCallback(() => {
            scrollX.setValue(0);
            setCurrentIndex(0);
            if (slidesRef.current) {
                // قد يسبب هذا السطر نفس التحذير عند الدخول للشاشة أول مرة
                // يمكن أيضاً وضعه داخل setTimeout لضمان عدم حدوث مشاكل
                setTimeout(() => {
                  slidesRef.current?.scrollToIndex({ index: 0, animated: false });
                }, 0);
            }
        }, [])
    );

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;
    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
    
    // ✅ ================== التعديل هنا ================== ✅
    const handleNextPress = () => {
        const nextSlideIndex = currentIndex + 1;
        if (nextSlideIndex < slidesContent.length && slidesRef.current) {
            // نستخدم setTimeout لحل مشكلة التوقيت في وضع RTL
            setTimeout(() => {
                slidesRef.current?.scrollToIndex({ index: nextSlideIndex });
            }, 50); // تأخير بسيط جداً يكفي
        }
    };
    // ✅ =============================================== ✅
    
    const slides = slidesContent.map(slide => ({
        ...slide,
        title: t(slide.titleKey),
        description: t(slide.descriptionKey),
    }));

    const currentSlide = slides[currentIndex] || slides[0];

    return (
        <SafeAreaView style={styles.container(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <View style={styles.topContainer(theme)}>
                <FlatList
                    ref={slidesRef}
                    data={slides}
                    renderItem={({ item }) => (
                        <View style={styles.slideItem}>
                            <Image source={item.image} style={styles.image} resizeMode="contain" />
                        </View>
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    getItemLayout={getItemLayout}
                    scrollEventThrottle={32}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    inverted={isRTL} 
                />
            </View>

            <View style={styles.bottomContainer(theme, isRTL)}>
                <View>
                    <View style={styles.paginatorContainer(isRTL)}>
                        {slides.map((_, i) => {
                            const itemIndex = isRTL ? slides.length - 1 - i : i;
                            const inputRange = [(itemIndex - 1) * width, itemIndex * width, (itemIndex + 1) * width];
                            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 25, 8], extrapolate: 'clamp' });
                            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });
                            return <Animated.View key={i.toString()} style={[styles.dot(theme), { width: dotWidth, opacity }]} />;
                        })}
                    </View>

                    <Text style={styles.title(theme, isRTL)}>{currentSlide.title}</Text>
                    <Text style={styles.description(theme, isRTL)}>{currentSlide.description}</Text>
                </View>

                {currentIndex === slides.length - 1 ? (
                    <View style={styles.authButtonsContainer(isRTL)}>
                        <TouchableOpacity style={styles.authButton(styles.signInButton(theme))} onPress={async () => {
                            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                            navigation.navigate('SignIn');
                        }}>
                            <Text style={styles.authButtonText(styles.signInButtonText(theme))}>{t('signInButton')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.authButton(styles.signUpButton(theme))} onPress={async () => {
                            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                            navigation.navigate('SignUp');
                        }}>
                            <Text style={styles.authButtonText(styles.signUpButtonText(theme))}>{t('signUpButton')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.button(theme)} onPress={handleNextPress}>
                        <Text style={styles.buttonText(theme)}>{t('nextButton')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = { /* ... (لا تغيير في الأنماط) ... */ 
    container: (theme) => ({ flex: 1, backgroundColor: theme.background, }),
    topContainer: (theme) => ({ height: height * 0.52, backgroundColor: theme.background, borderBottomLeftRadius: 80, borderBottomRightRadius: 80, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 8, overflow: 'hidden', }),
    slideItem: { width: width, height: '100%', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40, },
    image: { width: width * 0.75, height: height * 0.4, },
    bottomContainer: (theme, isRTL) => ({ flex: 1, paddingHorizontal: 30, paddingTop: 30, paddingBottom: 15, backgroundColor: theme.background, justifyContent: 'space-between',  }),
    title: (theme, isRTL) => ({ fontSize: 28, fontWeight: 'bold', color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 12, }),
    description: (theme, isRTL) => ({ fontSize: 13, color: theme.text, textAlign: isRTL ? 'right' : 'left', lineHeight: 20, opacity: 0.7, }),
    paginatorContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'flex-start', marginBottom: 25, }),
    dot: (theme) => ({ height: 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: theme.primary, }),
    button: (theme) => ({ backgroundColor: theme.white, borderRadius: 50, paddingVertical: 18, width: '100%', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, }),
    buttonText: (theme) => ({ fontSize: 16, fontWeight: '600', color: theme.text, }),
    authButtonsContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', width: '100%', justifyContent: 'space-between', gap: 15, marginTop: 20, }),
    authButton: (specificStyles) => ({ flex: 1, paddingVertical: 16, borderRadius: 50, alignItems: 'center', justifyContent: 'center', ...specificStyles, }),
    signInButton: (theme) => ({ backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary, }),
    signUpButton: (theme) => ({ backgroundColor: theme.primary, elevation: 5, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 5, }),
    authButtonText: (specificStyles) => ({ fontSize: 16, fontWeight: '600', ...specificStyles, }),
    signInButtonText: (theme) => ({ color: theme.primary, }),
    signUpButtonText: (theme) => ({ color: theme.white, }),
};

export default IndexScreen;