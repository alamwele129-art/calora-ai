import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, Image, Dimensions,
  TouchableOpacity, StatusBar, SafeAreaView, I18nManager, Animated, Easing, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// ==========================================================
// ===== الثيمات والبيانات =====
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

// مكون منفصل للنقطة عشان نتحكم في الأنيميشن بتاعها لوحدها
const PaginatorDot = ({ isActive, theme }) => {
    // قيمة مبدئية للعرض (8 لو مش نشطة، 25 لو نشطة)
    const widthAnim = useRef(new Animated.Value(isActive ? 25 : 8)).current;
    const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.3)).current;

    useEffect(() => {
        // الأنيميشن بيحصل لما الحالة (isActive) تتغير
        Animated.parallel([
            Animated.timing(widthAnim, {
                toValue: isActive ? 25 : 8,
                duration: 300, // سرعة الحركة
                useNativeDriver: false,
                easing: Easing.ease,
            }),
            Animated.timing(opacityAnim, {
                toValue: isActive ? 1 : 0.3,
                duration: 300,
                useNativeDriver: false,
            })
        ]).start();
    }, [isActive]);

    return (
        <Animated.View
            style={{
                height: 8,
                borderRadius: 4,
                marginHorizontal: 4,
                backgroundColor: theme.primary,
                width: widthAnim,
                opacity: opacityAnim,
            }}
        />
    );
};

const IndexScreen = ({ navigation, route, appLanguage }) => {
    const [theme, setTheme] = useState(lightTheme);
    const isRTL = I18nManager.isRTL; 
    const language = appLanguage || (isRTL ? 'ar' : 'en');
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef = useRef(null);
    
    const t = (key) => translations[language]?.[key] || key;

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('isDarkMode');
                setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
            } catch (e) { console.error(e); }
        };
        loadTheme();
    }, []);

    // تحديث رقم الصفحة الحالي بدقة
    const onMomentumScrollEnd = (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const handleNextPress = () => {
        const nextSlideIndex = currentIndex + 1;
        if (nextSlideIndex < slidesContent.length) {
            slidesRef.current?.scrollToIndex({ index: nextSlideIndex, animated: true });
            setCurrentIndex(nextSlideIndex);
        }
    };

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
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    // مهم: تحديد اتجاه الليست عشان العربي
                    inverted={isRTL && Platform.OS === 'android' ? false : false} 
                    getItemLayout={(_, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    initialNumToRender={1} 
                    windowSize={3}
                />
            </View>

            <View style={styles.bottomContainer(theme, isRTL)}>
                <View>
                    {/* 
                        تعديل جذري هنا:
                        بنرسم النقط بناءً على الـ currentIndex
                        وده بيضمن إن النقطة الصح هي اللي تنور بغض النظر عن اتجاه اللغة
                    */}
                    <View style={styles.paginatorContainer}>
                        {slides.map((_, i) => {
                            // مقارنة مباشرة: هل النقطة دي هي الصفحة الحالية؟
                            const isActive = i === currentIndex;
                            return (
                                <PaginatorDot 
                                    key={i.toString()} 
                                    isActive={isActive} 
                                    theme={theme} 
                                />
                            );
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

const styles = {
    container: (theme) => ({ flex: 1, backgroundColor: theme.background, }),
    topContainer: (theme) => ({ height: height * 0.55, backgroundColor: theme.background, borderBottomLeftRadius: 80, borderBottomRightRadius: 80, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 8, overflow: 'hidden', justifyContent: 'center' }),
    slideItem: { width: width, height: '100%', alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
    image: { width: width * 0.8, height: height * 0.4 },
    bottomContainer: (theme, isRTL) => ({ flex: 1, paddingHorizontal: 30, paddingTop: 30, paddingBottom: 15, backgroundColor: theme.background, justifyContent: 'space-between',  }),
    title: (theme, isRTL) => ({ fontSize: 28, fontWeight: 'bold', color: theme.text, textAlign: 'left', marginBottom: 12, writingDirection: isRTL ? 'rtl' : 'ltr' }), 
    description: (theme, isRTL) => ({ fontSize: 13, color: theme.text, textAlign: 'left', lineHeight: 20, opacity: 0.7, writingDirection: isRTL ? 'rtl' : 'ltr' }),
    paginatorContainer: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 25, height: 10 },
    button: (theme) => ({ backgroundColor: theme.white, borderRadius: 50, paddingVertical: 18, width: '100%', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, }),
    buttonText: (theme) => ({ fontSize: 16, fontWeight: '600', color: theme.text, }),
    authButtonsContainer: (isRTL) => ({ flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, marginTop: 20, }),
    authButton: (specificStyles) => ({ flex: 1, paddingVertical: 16, borderRadius: 50, alignItems: 'center', justifyContent: 'center', ...specificStyles, }),
    signInButton: (theme) => ({ backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary, }),
    signUpButton: (theme) => ({ backgroundColor: theme.primary, elevation: 5, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 5, }),
    authButtonText: (specificStyles) => ({ fontSize: 16, fontWeight: '600', ...specificStyles, }),
    signInButtonText: (theme) => ({ color: theme.primary, }),
    signUpButtonText: (theme) => ({ color: theme.white, }),
};

export default IndexScreen;