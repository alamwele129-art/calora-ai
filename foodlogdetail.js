import React, { useState, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, ScrollView, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =========================================================================
// --- أنظمة الثيم واللغة ---
// =========================================================================

const lightTheme = { 
    primary: '#388E3C', 
    background: '#E8F5E9', 
    card: '#FFFFFF', 
    textPrimary: '#212121', 
    textSecondary: '#757575',
    carbs: '#007BFF', 
    protein: '#FF7043', 
    fat: '#FFC107', 
    fiber: '#4CAF50', 
    sugar: '#9C27B0', 
    sodium: '#2196F3',
    statusBar: 'dark-content',
};

const darkTheme = { 
    primary: '#66BB6A', 
    background: '#121212', 
    card: '#1E1E1E', 
    textPrimary: '#FFFFFF', 
    textSecondary: '#B0B0B0',
    carbs: '#42A5F5', 
    protein: '#FF8A65', 
    fat: '#FFCA28', 
    fiber: '#81C784', 
    sugar: '#BA68C8', 
    sodium: '#64B5F6',
    statusBar: 'light-content',
};

const translations = {
    ar: {
        kcalUnit: ' سعرة',
        proteinMacro: 'ب: ',
        carbsMacro: 'ك: ',
        fatMacro: 'د: ',
        fiberMacro: 'أ: ',
        sugarMacro: 'س: ',
        sodiumMacro: 'ص: ',
        emptyLogText: 'لم يتم إضافة أي وجبات لهذا اليوم.',
        gUnit: 'g', // جرام
        mgUnit: 'mg', // ميليجرام
    },
    en: {
        kcalUnit: ' kcal',
        proteinMacro: 'P: ',
        carbsMacro: 'C: ',
        fatMacro: 'F: ',
        fiberMacro: 'Fib: ',
        sugarMacro: 'Sug: ',
        sodiumMacro: 'Sod: ',
        emptyLogText: 'No meals were added for this day.',
        gUnit: 'g',
        mgUnit: 'mg',
    }
};

// =========================================================================
// --- المكونات ---
// =========================================================================

const FoodLogItem = ({ item, theme, t, isRTL, showMacros = true }) => {
    let imageSource = null;
    if (item.capturedImageUri) {
        imageSource = { uri: item.capturedImageUri };
    } else if (item.image && (item.image.startsWith('http') || item.image.startsWith('data:'))) {
        imageSource = { uri: item.image };
    } else if (item.image) {
        imageSource = { uri: `https://spoonacular.com/cdn/ingredients_100x100/${item.image}` };
    }

    return (
        <View style={styles.foodLogItemContainer(theme, isRTL)}>
            {imageSource ? (
                <Image source={imageSource} style={styles.foodLogItemImage(isRTL)} />
            ) : (
                <View style={styles.foodLogItemImagePlaceholder(theme, isRTL)}>
                    <Ionicons name="restaurant-outline" size={24} color={theme.primary} />
                </View>
            )}
            <View style={styles.foodLogItemDetails}>
                <View style={styles.foodLogItemHeader(isRTL)}>
                    <Text style={styles.foodLogItemName(theme, isRTL)} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.foodLogItemCalories(theme, isRTL)}>{Math.round(item.calories || 0)}{t('kcalUnit')}</Text>
                </View>
                {showMacros && (
                    <View style={styles.foodLogItemMacros(isRTL)}>
                        <Text style={styles.macroText(theme, isRTL)}><Text style={{ color: theme.protein }}>{t('proteinMacro')}</Text>{Math.round(item.p || 0)}{t('gUnit')}</Text>
                        <Text style={styles.macroText(theme, isRTL)}><Text style={{ color: theme.carbs }}>{t('carbsMacro')}</Text>{Math.round(item.c || 0)}{t('gUnit')}</Text>
                        <Text style={styles.macroText(theme, isRTL)}><Text style={{ color: theme.fat }}>{t('fatMacro')}</Text>{Math.round(item.f || 0)}{t('gUnit')}</Text>
                        <Text style={styles.macroText(theme, isRTL)}><Text style={{ color: theme.fiber }}>{t('fiberMacro')}</Text>{Math.round(item.fib || 0)}{t('gUnit')}</Text>
                        <Text style={styles.macroText(theme, isRTL)}><Text style={{ color: theme.sugar }}>{t('sugarMacro')}</Text>{Math.round(item.sug || 0)}{t('gUnit')}</Text>
                        <Text style={styles.macroText(theme, isRTL)}><Text style={{ color: theme.sodium }}>{t('sodiumMacro')}</Text>{Math.round(item.sod || 0)}{t('mgUnit')}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const FoodLogDetailScreen = ({ route }) => {
    const { items, dateString } = route.params;
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('ar');
    const [isRTL, setIsRTL] = useState(true);

    const t = (key) => translations[language]?.[key] || translations['en'][key];
    
    const loadSettings = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('isDarkMode');
            const currentTheme = savedTheme === 'true' ? darkTheme : lightTheme;
            setTheme(currentTheme);

            const savedLang = await AsyncStorage.getItem('appLanguage');
            const currentLang = savedLang || 'ar';
            setLanguage(currentLang);
            setIsRTL(currentLang === 'ar');
        } catch (e) { console.error('Failed to load settings.', e); }
    };

    useFocusEffect(useCallback(() => { loadSettings(); }, []));

    return (
        <SafeAreaView style={styles.rootContainer(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <ScrollView contentContainerStyle={styles.detailScreenContainer}>
                <Text style={styles.detailDateText(theme)}>{dateString}</Text>
                
                {items && items.length > 0 ? (
                    items.map((item, index) => (
                        <FoodLogItem 
                            key={`${item.id}-${index}`} 
                            item={item} 
                            theme={theme} 
                            t={t} 
                            isRTL={isRTL} 
                            showMacros={true} 
                        />
                    ))
                ) : (
                    <Text style={styles.emptyLogText(theme)}>{t('emptyLogText')}</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

// =========================================================================
// --- الأنماط ---
// =========================================================================

const styles = {
    rootContainer: (theme) => ({ 
        flex: 1, 
        backgroundColor: theme.background 
    }),
    detailScreenContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 30,
    },
    detailDateText: (theme) => ({
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.textPrimary,
        textAlign: 'center',
        marginBottom: 20,
        backgroundColor: theme.card,
        padding: 10,
        borderRadius: 10,
    }),
    emptyLogText: (theme) => ({ 
        textAlign: 'center', 
        marginTop: 50, 
        fontSize: 16, 
        color: theme.textSecondary, 
    }),
    foodLogItemContainer: (theme, isRTL) => ({ 
        flexDirection: isRTL ? 'row-reverse' : 'row', 
        alignItems: 'center', 
        padding: 15, 
        backgroundColor: theme.card,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
    }),
    foodLogItemImage: (isRTL) => ({ 
        width: 60, 
        height: 60, 
        borderRadius: 10, 
        [isRTL ? 'marginLeft' : 'marginRight']: 15, 
    }),
    foodLogItemImagePlaceholder: (theme, isRTL) => ({ 
        width: 60, 
        height: 60, 
        borderRadius: 10, 
        [isRTL ? 'marginLeft' : 'marginRight']: 15, 
        backgroundColor: theme.background, 
        justifyContent: 'center', 
        alignItems: 'center', 
    }),
    foodLogItemDetails: { 
        flex: 1, 
    },
    foodLogItemHeader: (isRTL) => ({ 
        flexDirection: isRTL ? 'row-reverse' : 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 8, 
    }),
    foodLogItemName: (theme, isRTL) => ({ 
        fontSize: 17, 
        fontWeight: '700', 
        color: theme.textPrimary, 
        flex: 1, 
        textAlign: isRTL ? 'right' : 'left', 
    }),
    foodLogItemCalories: (theme, isRTL) => ({ 
        fontSize: 14, 
        fontWeight: '600', 
        color: theme.primary, 
        [isRTL ? 'marginRight' : 'marginLeft']: 8, 
    }),
    foodLogItemMacros: (isRTL) => ({ 
        flexDirection: isRTL ? 'row-reverse' : 'row', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        marginTop: 4, 
    }),
    macroText: (theme, isRTL) => ({ 
        fontSize: 12, 
        color: theme.textSecondary, 
        [isRTL ? 'marginLeft' : 'marginRight']: 12, 
        marginBottom: 4, 
        minWidth: 50,
    }),
};

export default FoodLogDetailScreen;
