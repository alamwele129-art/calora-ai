import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Pressable, Modal, TouchableOpacity, Alert, Image, FlatList, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';
import { searchEgyptianFoodsWithImages, supabase } from './supabaseclient';

// ---------------------------------------------------------------------------
// --- حل مشكلة إعلانات الفيديو (Safe Rewarded Ad Handler) ---
// ---------------------------------------------------------------------------
let RewardedAd = null;
let RewardedAdEventType = null;
let TestIds = null;
let isAdMobLoaded = false;

const productionAdUnitId = 'ca-app-pub-8833281523608204/3181182826'; // الكود الحقيقي

try {
    // محاولة استدعاء المكتبة الحقيقية (لنسخة الـ Build/APK)
    const adMob = require('react-native-google-mobile-ads');
    RewardedAd = adMob.RewardedAd;
    RewardedAdEventType = adMob.RewardedAdEventType;
    TestIds = adMob.TestIds;
    isAdMobLoaded = true;
} catch (error) {
    console.log("AdMob Rewarded Video not found (Expo Go). Using Mock.");
    
    // تعريفات وهمية لبيئة التطوير Expo Go
    TestIds = { REWARDED: 'mock-rewarded-id' };
    RewardedAdEventType = {
        LOADED: 'loaded',
        EARNED_REWARD: 'earned_reward',
        CLOSED: 'closed',
        ERROR: 'error'
    };

    // كلاس وهمي بيحاكي سلوك الإعلان الحقيقي
    RewardedAd = {
        createForAdRequest: (id, options) => {
            return {
                listeners: {},
                addAdEventListener: function(event, callback) {
                    this.listeners[event] = callback;
                    // دالة لإلغاء الاشتراك
                    return () => { delete this.listeners[event]; };
                },
                load: function() {
                    console.log("Mock Ad Loading...");
                    // محاكاة تحميل الإعلان بعد ثانية واحدة
                    setTimeout(() => {
                        console.log("Mock Ad Loaded");
                        if (this.listeners['loaded']) this.listeners['loaded']();
                    }, 1000);
                },
                show: function() {
                    // بدلاً من عرض فيديو، نعرض رسالة تنبيه
                    Alert.alert(
                        "Ad Simulation (Expo Go)",
                        "في التطبيق الحقيقي سيظهر فيديو هنا. اضغط 'Get Reward' للمتابعة.",
                        [
                            {
                                text: "Get Reward & Close",
                                onPress: () => {
                                    if (this.listeners['earned_reward']) this.listeners['earned_reward']({ amount: 1, type: 'coin' });
                                    if (this.listeners['closed']) this.listeners['closed']();
                                }
                            }
                        ]
                    );
                }
            };
        }
    };
}

// تحديد معرف الإعلان: لو تطوير ومكتبة حقيقية -> TestID، غير كده -> ProductionID (أو الموك)
const adUnitId = (__DEV__ && isAdMobLoaded) ? TestIds.REWARDED : productionAdUnitId;
// ---------------------------------------------------------------------------


const GOOGLE_VISION_API_KEY = 'AIzaSyB7Lo417UOkHMMd7_RPVo4AmOqV2IioSgo'; 
const NUTRIENT_GOALS = { fiber: 30, sugar: 50, sodium: 2300 };
const USDA_API_KEY = 'EwFYKP3Uy9RoPE0MsngLOlh0YHRFDexKBKZuAstd';
const CLARIFAI_PAT = '874e117c459b4589b858a26163d1fae1';

const lightTheme = { background: '#FCFCFC', text: '#212121', secondaryText: '#757575', primary: '#4CAF50', danger: '#F44336', modalBackdrop: 'rgba(0,0,0,0.5)', modalSurface: 'white', macrosBackground: '#F1F8E9', cancelButtonBackground: '#E8F5E9', cancelButtonText: '#4CAF50', permissionIcon: '#BDBDBD', captureButton: 'white', captureBorder: 'rgba(255,255,255,0.5)', cameraBackground: '#000000', textOnDark: '#FFFFFF', modeSelectorBackground: 'rgba(40,40,40,0.8)', modeSelectorActive: 'rgba(255,255,255,0.9)' };
const darkTheme = { background: '#121212', text: '#FFFFFF', secondaryText: '#A5A5A5', primary: '#4CAF50', danger: '#EF5350', modalBackdrop: 'rgba(0,0,0,0.7)', modalSurface: '#1E1E1E', macrosBackground: '#2C3B2A', cancelButtonBackground: '#2C3B2A', cancelButtonText: '#4CAF50', permissionIcon: '#757575', captureButton: '#333333', captureBorder: 'rgba(255,255,255,0.3)', cameraBackground: '#000000', textOnDark: '#FFFFFF', modeSelectorBackground: 'rgba(50,50,50,0.9)', modeSelectorActive: 'rgba(255,255,255,0.2)' };
const translations = { ar: { analyzingPlate: 'جاري تحليل طبقك...', analysisFailed: 'فشل تحليل الصورة.', permissionDenied: 'لا يمكن الوصول للكاميرا', grantPermission: 'منح الإذن', plateResults: 'نتائج طبقك', dailyGoal: 'هدف اليوم', plateCalories: 'سعرات الطبق', remaining: 'متبقي', afterAddingMeal: 'بعد إضافة الوجبة', carbs: 'كربوهيدرات', protein: 'بروتين', fat: 'دهون', fiber: 'ألياف', sugar: 'سكر', sodium: 'صوديوم', cancel: 'إلغاء', addToDiary: 'إضافة لليوميات', mealAddedSuccess: 'تم إضافة الوجبة بنجاح!', mealAddedError: 'حدث خطأ أثناء حفظ الوجبة.', chooseMeal: 'اختر الوجبة', breakfast: 'الفطور', lunch: 'الغداء', dinner: 'العشاء', snacks: 'وجبات خفيفة', scanFood: 'مسح الطعام', barcode: 'باركود', scanning: 'جاري البحث...', productNotFound: 'لم يتم العثور على المنتج', editQuantity: 'تعديل الكمية', newQuantity: 'الكمية الجديدة (جرام)', confirm: 'تأكيد', invalidNumber: 'رجاء إدخال رقم صحيح.', plateTotal: 'إجمالي الطبق', foodIdentified: 'تم التعرف على الأكلة', confirmAdd: 'هل تريد إضافة "{foodName}" ({calories} سعر حراري)؟', tryAgain: 'حاول مرة أخرى', notInLocalDB: 'تعرفنا على الأكلة كـ "{foodName}" ولكنها غير موجودة في قاعدة البيانات المحلية. جاري البحث في قاعدة البيانات العالمية...', scanLabel: 'ملصق', analyzingLabel: 'جاري قراءة الملصق...', labelReadSuccess: 'تمت قراءة الملصق بنجاح!', enterProductName: 'أدخل اسم المنتج', productName: 'اسم المنتج', pleaseEnterName: 'الرجاء إدخال اسم للمنتج.', noNutritionDataFound: 'لم نتمكن من العثور على بيانات غذائية في الصورة.', watchAdTitle: 'تحليل ذكي', watchAdMessage: 'شاهد فيديو قصير للحصول على تحليل دقيق لمكونات طبقك.', watch: 'مشاهدة' } };

async function getNutritionDataFromUSDA(foodName, apiKey) { try { const searchResponse = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&pageSize=1&api_key=${apiKey}`); const searchData = await searchResponse.json(); if (!searchData.foods || searchData.foods.length === 0) return null; const foodId = searchData.foods[0].fdcId; const detailsResponse = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${foodId}?api_key=${apiKey}`); const detailsData = await detailsResponse.json(); const nutrients = detailsData.foodNutrients; const getNutrientValue = (id) => nutrients.find(n => n.nutrient.id === id)?.amount || 0; return { id: foodId, name: detailsData.description.split(',')[0], calories: getNutrientValue(1008), p: getNutrientValue(1003), f: getNutrientValue(1004), c: getNutrientValue(1005), fib: getNutrientValue(1079), sug: getNutrientValue(2000), sod: getNutrientValue(1093), quantity: 100 }; } catch (error) { console.error(`Could not fetch nutrition for ${foodName}`, error); return null; } }

const QuantityEditModal = ({ visible, item, onClose, onConfirm, theme, t, isRTL }) => { const [quantity, setQuantity] = useState(''); const styles = getStyles(theme, isRTL); useEffect(() => { if (item) setQuantity(item.quantity.toString()); }, [item]); const handleConfirm = () => { const numericQuantity = parseFloat(quantity); if (isNaN(numericQuantity) || numericQuantity <= 0) { Alert.alert(t('invalidNumber')); return; } onConfirm(numericQuantity); }; if (!item) return null; return ( <Modal visible={visible} transparent={true} animationType="fade"><View style={styles.mealSelectionBackdrop}><View style={[styles.mealSelectionContainer, { alignItems: 'stretch' }]}><Text style={styles.mealSelectionTitle}>{t('editQuantity')}: {item.name}</Text><Text style={styles.quantityInputLabel}>{t('newQuantity')}</Text><TextInput style={styles.quantityInput} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="e.g., 150" placeholderTextColor={theme.secondaryText} autoFocus={true}/><View style={styles.modalActions}><TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose}><Text style={[styles.actionButtonText, styles.cancelButtonText]}>{t('cancel')}</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.addButton]} onPress={handleConfirm}><Text style={[styles.actionButtonText]}>{t('confirm')}</Text></TouchableOpacity></View></View></View></Modal> );};
const MealSelectionModal = ({ visible, onClose, onSave, theme, t, isRTL }) => { const styles = getStyles(theme, isRTL); return ( <Modal animationType="fade" transparent={true} visible={visible}><TouchableOpacity style={styles.mealSelectionBackdrop} activeOpacity={1} onPress={onClose}><View style={styles.mealSelectionContainer}><Text style={styles.mealSelectionTitle}>{t('chooseMeal')}</Text><TouchableOpacity style={styles.mealOptionButton} onPress={() => onSave('breakfast')}><Text style={styles.mealOptionText}>{t('breakfast')}</Text></TouchableOpacity><TouchableOpacity style={styles.mealOptionButton} onPress={() => onSave('lunch')}><Text style={styles.mealOptionText}>{t('lunch')}</Text></TouchableOpacity><TouchableOpacity style={styles.mealOptionButton} onPress={() => onSave('dinner')}><Text style={styles.mealOptionText}>{t('dinner')}</Text></TouchableOpacity><TouchableOpacity style={styles.mealOptionButton} onPress={() => onSave('snacks')}><Text style={styles.mealOptionText}>{t('snacks')}</Text></TouchableOpacity><TouchableOpacity style={styles.mealCancelButton} onPress={onClose}><Text style={styles.mealCancelButtonText}>{t('cancel')}</Text></TouchableOpacity></View></TouchableOpacity></Modal> );};
const MacroBar = ({ label, consumed, goal, color, theme, isRTL, unit = 'g' }) => { const styles = getStyles(theme, isRTL); return ( <View style={styles.macroBarContainer}><View style={styles.macroHeader}><Text style={styles.macroLabel}>{label}</Text><Text style={styles.macroValue}>{Math.round(consumed)} / {goal} {unit}</Text></View><Progress.Bar progress={goal > 0 ? consumed / goal : 0} width={null} color={color} unfilledColor={`${color}33`} borderWidth={0} height={7} borderRadius={4} /></View> );};
const ProductNameModal = ({ visible, onClose, onConfirm, theme, t, isRTL }) => { const [name, setName] = useState(''); const styles = getStyles(theme, isRTL); const handleConfirm = () => { if (!name.trim()) { Alert.alert(t('pleaseEnterName')); return; } onConfirm(name.trim()); setName(''); }; return ( <Modal visible={visible} transparent={true} animationType="fade"><View style={styles.mealSelectionBackdrop}><View style={[styles.mealSelectionContainer, { alignItems: 'stretch' }]}><Text style={styles.mealSelectionTitle}>{t('enterProductName')}</Text><TextInput style={styles.quantityInput} value={name} onChangeText={setName} placeholder={t('productName')} placeholderTextColor={theme.secondaryText} autoFocus={true} /><View style={styles.modalActions}><TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose}><Text style={[styles.actionButtonText, styles.cancelButtonText]}>{t('cancel')}</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.addButton]} onPress={handleConfirm}><Text style={[styles.actionButtonText]}>{t('confirm')}</Text></TouchableOpacity></View></View></View></Modal> );};

const CameraScreen = () => {
    const cameraRef = useRef(null);
    const navigation = useNavigation();
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('ar');
    const [isRTL, setIsRTL] = useState(true);
    const [permission, requestPermission] = useCameraPermissions();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanMode, setScanMode] = useState('food');
    const [dailyGoal, setDailyGoal] = useState({ calories: 2000, protein: 150, carbs: 224, fat: 67 });
    const [consumedTotals, setConsumedTotals] = useState({ food: 0, protein: 0, carbs: 0, fat: 0, fib: 0, sug: 0, sod: 0 });
    const [analysisResult, setAnalysisResult] = useState(null);
    const [baseAnalysisResult, setBaseAnalysisResult] = useState(null);
    const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
    const [showMealSelection, setShowMealSelection] = useState(false);
    const [isQuantityModalVisible, setQuantityModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isNameModalVisible, setNameModalVisible] = useState(false);
    const [parsedOcrData, setParsedOcrData] = useState(null);
    const t = useCallback((key, params = {}) => { let str = (translations[language] || translations['en'])?.[key] || key; Object.keys(params).forEach(p => { str = str.replace(`{${p}}`, params[p]); }); return str; }, [language]);
    const styles = getStyles(theme, isRTL);

    // 👇 مرجع للاحتفاظ بكائن الإعلان
    const rewardedAdRef = useRef(null);
    const [adLoaded, setAdLoaded] = useState(false);

    // 👇 تحميل الإعلان عند فتح الشاشة
    useEffect(() => {
        const loadAd = () => {
            const rewarded = RewardedAd.createForAdRequest(adUnitId, {
                requestNonPersonalizedAdsOnly: true,
            });

            const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
                setAdLoaded(true);
            });

            const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
                // المستخدم شاهد الإعلان للنهاية
            });

            rewarded.load();
            rewardedAdRef.current = rewarded;

            return () => {
                unsubscribeLoaded();
                unsubscribeEarned();
            };
        };

        const unsubscribe = loadAd();
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!permission?.granted) { requestPermission(); }
    }, [permission]);

    useFocusEffect(useCallback(() => {
        setScanMode('food');
        const loadAllData = async () => { try { const savedTheme = await AsyncStorage.getItem('isDarkMode'); setTheme(savedTheme === 'true' ? darkTheme : lightTheme); const savedLang = await AsyncStorage.getItem('appLanguage'); const currentLang = savedLang || 'ar'; setLanguage(currentLang); setIsRTL(currentLang === 'ar'); const profileJson = await AsyncStorage.getItem('userProfile'); if (profileJson) { const profile = JSON.parse(profileJson); const goal = profile.dailyGoal || 2000; setDailyGoal({ calories: goal, protein: Math.round((goal * 0.30) / 4), carbs: Math.round((goal * 0.40) / 4), fat: Math.round((goal * 0.30) / 9) }); } const todayKey = new Date().toISOString().slice(0, 10); const todayLogJson = await AsyncStorage.getItem(todayKey); const todayLog = todayLogJson ? JSON.parse(todayLogJson) : {}; const allFoodItems = [...(todayLog.breakfast || []), ...(todayLog.lunch || []), ...(todayLog.dinner || []), ...(todayLog.snacks || [])]; const totals = allFoodItems.reduce((acc, item) => ({ food: acc.food + (item.calories || 0), protein: acc.protein + (item.p || 0), carbs: acc.carbs + (item.c || 0), fat: acc.fat + (item.f || 0), fib: acc.fib + (item.fib || 0), sug: acc.sug + (item.sug || 0), sod: acc.sod + (item.sod || 0) }), { food: 0, protein: 0, carbs: 0, fat: 0, fib: 0, sug: 0, sod: 0 }); setConsumedTotals(totals); } catch (e) { console.error("Failed to load data:", e); } };
        loadAllData();
    }, []));

    const showAdThenAnalyze = (imageBase64, analysisFunction) => {
        if (adLoaded && rewardedAdRef.current) {
            // إضافة مستمع لحدث إغلاق الإعلان لبدء التحليل
            const unsubscribeClosed = rewardedAdRef.current.addAdEventListener(RewardedAdEventType.CLOSED, () => {
                setAdLoaded(false); // إعادة تعيين الحالة لتحميل إعلان جديد لاحقاً
                // إعادة تحميل إعلان جديد للمرة القادمة
                rewardedAdRef.current.load(); 
                
                // تنفيذ التحليل
                analysisFunction(imageBase64);
                unsubscribeClosed();
            });

            rewardedAdRef.current.show();
        } else {
            // إذا لم يكن الإعلان جاهزاً (أو الموك بيحمل)، نفذ التحليل مباشرة 
            console.log("Ad not ready yet, skipping ad and analyzing directly.");
            analysisFunction(imageBase64);
        }
    };

    const takePicture = async () => { 
        if (cameraRef.current) { 
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true }); 
            setCapturedPhotoUri(photo.uri); 
            
            if (scanMode === 'food') { 
                // 👇 عرض الإعلان قبل تحليل الطعام
                Alert.alert(
                    t('watchAdTitle'),
                    t('watchAdMessage'),
                    [
                        { text: t('cancel'), style: 'cancel' },
                        { 
                            text: t('watch'), 
                            onPress: () => showAdThenAnalyze(photo.base64, performFoodAnalysis) 
                        }
                    ]
                );
            } else if (scanMode === 'label') { 
                // 👇 عرض الإعلان قبل تحليل الملصق
                Alert.alert(
                    t('watchAdTitle'),
                    t('watchAdMessage'),
                    [
                        { text: t('cancel'), style: 'cancel' },
                        { 
                            text: t('watch'), 
                            onPress: () => showAdThenAnalyze(photo.base64, performLabelAnalysis) 
                        }
                    ]
                );
            } else {
                // Barcode logic is handled in handleBarCodeScanned
            }
        } 
    };

    // 👇 تم فصل منطق التحليل في دالة منفصلة ليتم استدعاؤها بعد الإعلان
    const performFoodAnalysis = async (imageBase64) => { 
        setIsAnalyzing(true); 
        const CLARIFAI_USER_ID = 'calora1'; 
        const CLARIFAI_APP_ID = 'Calorie-ai'; 
        try { 
            const clarifaiResponse = await fetch("https://api.clarifai.com/v2/models/food-item-recognition/outputs", { method: 'POST', headers: { 'Accept': 'application/json', 'Authorization': 'Key ' + CLARIFAI_PAT }, body: JSON.stringify({ "user_app_id": { "user_id": CLARIFAI_USER_ID, "app_id": CLARIFAI_APP_ID }, "inputs": [{ "data": { "image": { "base64": imageBase64 } } }] }) }); 
            const clarifaiData = await clarifaiResponse.json(); 
            if (clarifaiData.status.code !== 10000 || !clarifaiData.outputs[0].data.concepts.length) { throw new Error('Clarifai could not identify the food.'); } 
            const foodNameFromClarifai = clarifaiData.outputs[0].data.concepts[0].name; 
            const localResults = await searchEgyptianFoodsWithImages(foodNameFromClarifai); 
            if (localResults.length > 0) { const matchedFood = { ...localResults[0], quantity: 100 }; setAnalysisResult([matchedFood]); setBaseAnalysisResult([matchedFood]); } else { Alert.alert(t('foodIdentified'), t('notInLocalDB', {foodName: foodNameFromClarifai})); const usdaResult = await getNutritionDataFromUSDA(foodNameFromClarifai, USDA_API_KEY); if (usdaResult) { setAnalysisResult([usdaResult]); setBaseAnalysisResult([usdaResult]); } else { throw new Error('Food not found in any database.'); } } 
        } catch (error) { console.error("Analysis failed:", error); Alert.alert(t('analysisFailed'), error.message, [{ text: t('tryAgain') }]); } finally { setIsAnalyzing(false); } 
    };

    // 👇 تم فصل منطق تحليل الملصق أيضاً
    const performLabelAnalysis = async (imageBase64) => { 
        if (GOOGLE_VISION_API_KEY === 'YOUR_GOOGLE_CLOUD_VISION_API_KEY') { Alert.alert("Error", "Please add your Google Cloud Vision API key to the code."); return; } 
        setIsAnalyzing(true); 
        try { 
            const body = { requests: [{ image: { content: imageBase64 }, features: [{ type: 'TEXT_DETECTION' }] }] }; 
            const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); 
            const result = await response.json(); 
            if (result.responses && result.responses[0].fullTextAnnotation) { const detectedText = result.responses[0].fullTextAnnotation.text; const nutritionData = parseNutritionText(detectedText); if (Object.values(nutritionData).some(val => val > 0)) { setParsedOcrData(nutritionData); setNameModalVisible(true); } else { Alert.alert(t('analysisFailed'), t('noNutritionDataFound')); } } else { throw new Error('No text found in image.'); } 
        } catch (error) { console.error("Label analysis failed:", error); Alert.alert(t('analysisFailed'), error.message); } finally { setIsAnalyzing(false); } 
    };

    const parseNutritionText = (text) => { const cleanedText = text.replace(/,/g, '.'); const nutrition = { calories: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, sod: 0 }; const patterns = { calories: /(calories|energy|السعرات الحرارية|طاقة|kcal)\s*(\d+(\.\d+)?)/i, p: /(protein|بروتين)\s*(\d+(\.\d+)?)\s*g?/i, c: /(carbohydrate|الكربوهيدرات|carbs)\s*(\d+(\.\d+)?)\s*g?/i, f: /(fat|total fat|الدهون)\s*(\d+(\.\d+)?)\s*g?/i, fib: /(fiber|ألياف)\s*(\d+(\.\d+)?)\s*g?/i, sug: /(sugars|سكر)\s*(\d+(\.\d+)?)\s*g?/i, sod: /(sodium|صوديوم)\s*(\d+(\.\d+)?)\s*m?g?/i, }; for (const key in patterns) { const match = cleanedText.match(patterns[key]); if (match && match[2]) { nutrition[key] = parseFloat(match[2]); } } if (nutrition.sod > 10000) nutrition.sod /= 1000; return nutrition; };
    const handleConfirmProductName = (name) => { const finalItem = { id: `ocr-${Date.now()}`, name: name, quantity: 100, ...parsedOcrData }; setAnalysisResult([finalItem]); setBaseAnalysisResult([finalItem]); setNameModalVisible(false); setParsedOcrData(null); };
    const handleBarCodeScanned = async ({ data: barcode }) => { setIsAnalyzing(true); setScanMode('food'); try { const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`); const result = await response.json(); if (result.status === 1 && result.product) { const p = result.product; const n = p.nutriments; const s = parseFloat(p.serving_quantity) || 100; const item = { id: barcode, name: p.product_name || 'Unknown', calories: n['energy-kcal_serving'] || n['energy-kcal_100g'] || 0, p: n.proteins_serving || n.proteins_100g || 0, c: n.carbohydrates_serving || n.carbohydrates_100g || 0, f: n.fat_serving || n.fat_100g || 0, fib: n.fiber_serving || n.fiber_100g || 0, sug: n.sugars_serving || n.sugars_100g || 0, sod: (n.sodium_serving || n.sodium_100g || 0) * 1000, quantity: s, image: p.image_front_url }; setAnalysisResult([item]); setBaseAnalysisResult([item]); } else { Alert.alert(t('productNotFound')); } } catch (error) { Alert.alert(t('analysisFailed')); } finally { setIsAnalyzing(false); } };
    const handleEditQuantityPress = (item) => { setEditingItem(item); setQuantityModalVisible(true); };
    const handleConfirmQuantity = (newQuantity) => { const baseItem = baseAnalysisResult.find(i => i.id === editingItem.id); const ratio = newQuantity / baseItem.quantity; const updatedItem = { ...editingItem, quantity: newQuantity, calories: baseItem.calories * ratio, p: baseItem.p * ratio, c: baseItem.c * ratio, f: baseItem.f * ratio, fib: (baseItem.fib || 0) * ratio, sug: (baseItem.sug || 0) * ratio, sod: (baseItem.sod || 0) * ratio }; setAnalysisResult(analysisResult.map(i => i.id === editingItem.id ? updatedItem : i)); setEditingItem(null); setQuantityModalVisible(false); };
    const handleAddToDiary = () => { if (!analysisResult) return; setShowMealSelection(true); };
    
    const saveMealTo = async (mealKey) => {
        const todayKey = new Date().toISOString().slice(0, 10);
        try {
            const todayLogJson = await AsyncStorage.getItem(todayKey);
            let todayLog = todayLogJson ? JSON.parse(todayLogJson) : {};
            const finalItems = analysisResult.map(item => ({ ...item, quantity: `${Math.round(item.quantity)}g`, capturedImageUri: capturedPhotoUri }));
            todayLog[mealKey] = [...(todayLog[mealKey] || []), ...finalItems];
            await AsyncStorage.setItem(todayKey, JSON.stringify(todayLog));

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('daily_logs')
                    .upsert({ user_id: user.id, log_date: todayKey, log_data: todayLog }, { onConflict: 'user_id, log_date' });
                if (error) throw error;
            }

            setShowMealSelection(false);
            setAnalysisResult(null);
            setBaseAnalysisResult(null);
            setCapturedPhotoUri(null);
            navigation.navigate('DiaryStack', { screen: 'DiaryHome' });
            Alert.alert(t('mealAddedSuccess'));
        } catch (e) {
            console.error("Failed to save meal:", e);
            Alert.alert(t('mealAddedError'));
        }
    };
    
    const handleCancelAnalysis = () => { setAnalysisResult(null); setBaseAnalysisResult(null); setCapturedPhotoUri(null); setNameModalVisible(false); setParsedOcrData(null); };

    if (!permission) { return <View style={styles.permissionContainer}><ActivityIndicator size="large" color={theme.primary} /></View>; }
    if (!permission.granted) { return ( <View style={styles.permissionContainer}><Ionicons name="camera-reverse-outline" size={80} color={theme.permissionIcon} /><Text style={styles.permissionTitle}>{t('permissionDenied')}</Text><TouchableOpacity style={styles.permissionButton} onPress={requestPermission}><Text style={styles.permissionButtonText}>{t('grantPermission')}</Text></TouchableOpacity></View> ); }
    const plateTotals = analysisResult ? analysisResult.reduce((acc, item) => ({ calories: acc.calories + (item.calories || 0), protein: acc.protein + (item.p || 0), carbs: acc.carbs + (item.c || 0), fat: acc.fat + (item.f || 0), fib: acc.fib + (item.fib || 0), sug: acc.sug + (item.sug || 0), sod: acc.sod + (item.sod || 0) }), { calories: 0, protein: 0, carbs: 0, fat: 0, fib: 0, sug: 0, sod: 0 }) : { calories: 0, protein: 0, carbs: 0, fat: 0, fib: 0, sug: 0, sod: 0 };
    const totalConsumedCalories = consumedTotals.food + plateTotals.calories;
    const getLoadingText = () => { if (scanMode === 'food') return t('analyzingPlate'); if (scanMode === 'barcode') return t('scanning'); if (scanMode === 'label') return t('analyzingLabel'); return ''; };

    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={'back'} onBarCodeScanned={scanMode === 'barcode' && !isAnalyzing ? handleBarCodeScanned : undefined} />
            {isAnalyzing && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#FFF" /><Text style={styles.loadingText}>{getLoadingText()}</Text></View>}
            {scanMode === 'barcode' && <View style={styles.barcodeFocusFrame} />}
            {scanMode === 'label' && <View style={styles.ocrFocusFrame} />}
            <View style={styles.bottomContainer}>
                {scanMode !== 'barcode' && (<View style={styles.captureButtonContainer}><Pressable style={styles.captureButton} onPress={takePicture} disabled={isAnalyzing} /></View>)}
                <View style={styles.modeSelectorContainer}>
                    <TouchableOpacity style={[styles.modeButton, scanMode === 'food' && styles.modeButtonActive]} onPress={() => setScanMode('food')}><Ionicons name="camera-outline" size={22} color={scanMode === 'food' ? theme.primary : theme.secondaryText} /><Text style={[styles.modeButtonText, scanMode === 'food' && styles.modeButtonTextActive]}>{t('scanFood')}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.modeButton, scanMode === 'label' && styles.modeButtonActive]} onPress={() => setScanMode('label')}><Ionicons name="document-text-outline" size={22} color={scanMode === 'label' ? theme.primary : theme.secondaryText} /><Text style={[styles.modeButtonText, scanMode === 'label' && styles.modeButtonTextActive]}>{t('scanLabel')}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.modeButton, scanMode === 'barcode' && styles.modeButtonActive]} onPress={() => setScanMode('barcode')}><Ionicons name="barcode-outline" size={22} color={scanMode === 'barcode' ? theme.primary : theme.secondaryText} /><Text style={[styles.modeButtonText, scanMode === 'barcode' && styles.modeButtonTextActive]}>{t('barcode')}</Text></TouchableOpacity>
                </View>
            </View>
            <Modal animationType="slide" transparent={true} visible={!!analysisResult}><View style={styles.modalBackdrop}><View style={styles.modalContainer}><FlatList data={analysisResult} keyExtractor={(item) => item.id.toString()} contentContainerStyle={styles.modalContentPadding} ListHeaderComponent={ <> <Text style={styles.modalTitle}>{t('plateResults')}</Text> {analysisResult && analysisResult.length === 1 && analysisResult[0].image ? (<Image source={{ uri: analysisResult[0].image }} style={styles.productImage} />) : null} </> } renderItem={({ item }) => ( <View style={styles.foodItemContainer}><View style={styles.foodItemText}><Text style={styles.foodItemName}>{item.name}</Text><TouchableOpacity style={styles.quantityButton} onPress={() => handleEditQuantityPress(item)}><Text style={styles.foodItemQuantity}>{Math.round(item.quantity)}g </Text><Ionicons name="pencil" size={14} color={theme.primary} /></TouchableOpacity></View><Text style={styles.foodItemCalories}>{Math.round(item.calories)} Cal</Text></View> )} ListFooterComponent={ <View>{analysisResult && analysisResult.length > 1 && (<View style={styles.plateTotalContainer}><Text style={styles.plateTotalLabel}>{t('plateTotal')}</Text><Text style={styles.plateTotalValue}>{Math.round(plateTotals.calories)} Cal</Text></View>)}<View style={styles.modalSummary}><View style={styles.modalGoalItem}><Text style={styles.modalGoalLabel}>{t('dailyGoal')}</Text><Text style={styles.modalGoalValue}>{Math.round(dailyGoal.calories)}</Text></View><View style={styles.modalProgressCircle}><Progress.Circle size={100} progress={dailyGoal.calories > 0 ? totalConsumedCalories / dailyGoal.calories : 0} color={theme.primary} unfilledColor={`${theme.primary}33`} thickness={8} borderWidth={0} showsText={false} /><View style={styles.circleTextContainer}><Text style={styles.remainingValue}>{Math.round(dailyGoal.calories - totalConsumedCalories)}</Text><Text style={styles.remainingLabel}>{t('remaining')}</Text></View></View><View style={styles.modalGoalItem}><Text style={styles.modalGoalLabel}>{t('plateCalories')}</Text><Text style={[styles.modalGoalValue, { color: theme.danger }]}>+{Math.round(plateTotals.calories)}</Text></View></View><View style={styles.macrosContainer}><Text style={styles.macrosTitle}>{t('afterAddingMeal')}</Text><MacroBar label={t('carbs')} consumed={consumedTotals.carbs + plateTotals.carbs} goal={dailyGoal.carbs} color="#4285F4" theme={theme} isRTL={isRTL} /><MacroBar label={t('protein')} consumed={consumedTotals.protein + plateTotals.protein} goal={dailyGoal.protein} color="#EA4335" theme={theme} isRTL={isRTL} /><MacroBar label={t('fat')} consumed={consumedTotals.fat + plateTotals.fat} goal={dailyGoal.fat} color="#FBBC05" theme={theme} isRTL={isRTL} /><MacroBar label={t('fiber')} consumed={consumedTotals.fib + plateTotals.fib} goal={NUTRIENT_GOALS.fiber} color="#34A853" theme={theme} isRTL={isRTL} /><MacroBar label={t('sugar')} consumed={consumedTotals.sug + plateTotals.sug} goal={NUTRIENT_GOALS.sugar} color="#9C27B0" theme={theme} isRTL={isRTL} /><MacroBar label={t('sodium')} consumed={consumedTotals.sod + plateTotals.sod} goal={NUTRIENT_GOALS.sodium} color="#2196F3" theme={theme} isRTL={isRTL} unit='mg' /></View><View style={styles.modalActions}><TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelAnalysis}><Text style={[styles.actionButtonText, styles.cancelButtonText]}>{t('cancel')}</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.addButton]} onPress={handleAddToDiary}><Text style={[styles.actionButtonText]}>{t('addToDiary')}</Text></TouchableOpacity></View></View> } /></View></View></Modal>
            <MealSelectionModal visible={showMealSelection} onClose={() => setShowMealSelection(false)} onSave={saveMealTo} theme={theme} t={t} isRTL={isRTL} />
            <QuantityEditModal visible={isQuantityModalVisible} item={editingItem} onClose={() => setQuantityModalVisible(false)} onConfirm={handleConfirmQuantity} theme={theme} t={t} isRTL={isRTL} />
            <ProductNameModal visible={isNameModalVisible} onClose={handleCancelAnalysis} onConfirm={handleConfirmProductName} theme={theme} t={t} isRTL={isRTL} />
        </View>
    );
};

const getStyles = (theme, isRTL) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.cameraBackground },
    bottomContainer: { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center', },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }, 
    loadingText: { color: theme.textOnDark, marginTop: 15, fontSize: 18, fontWeight: '600' }, 
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, padding: 20 }, 
    permissionTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 15, marginBottom: 25, textAlign: 'center' }, 
    permissionButton: { backgroundColor: theme.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 }, 
    permissionButtonText: { color: theme.textOnDark, fontSize: 16, fontWeight: 'bold' }, 
    captureButtonContainer: { marginBottom: 15, height: 75, justifyContent: 'center', alignItems: 'center' }, 
    captureButton: { width: 75, height: 75, borderRadius: 40, backgroundColor: theme.captureButton, borderWidth: 4, borderColor: theme.captureBorder }, 
    modeSelectorContainer: { flexDirection: 'row', backgroundColor: theme.modeSelectorBackground, borderRadius: 30, padding: 6, }, 
    modeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 25, }, 
    modeButtonActive: { backgroundColor: theme.modeSelectorActive, }, 
    modeButtonText: { marginLeft: 8, color: theme.secondaryText, fontWeight: '600', fontSize: 14, }, 
    modeButtonTextActive: { color: theme.primary, }, 
    barcodeFocusFrame: { ...StyleSheet.absoluteFillObject, top: '25%', left: '10%', right: '10%', bottom: '45%', borderWidth: 2, borderColor: theme.textOnDark, borderRadius: 20, }, 
    ocrFocusFrame: { ...StyleSheet.absoluteFillObject, top: '20%', left: '5%', right: '5%', bottom: '30%', borderWidth: 2, borderColor: 'rgba(255, 255, 0, 0.8)', borderRadius: 15, borderStyle: 'dashed' }, 
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.modalBackdrop }, 
    modalContainer: { backgroundColor: theme.modalSurface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }, 
    modalContentPadding: { paddingBottom: 30 }, 
    modalTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: theme.text, paddingTop: 20, paddingHorizontal: 20, marginBottom: 10,}, 
    productImage: { width: 100, height: 100, borderRadius: 15, alignSelf: 'center', marginBottom: 15, resizeMode: 'contain' }, 
    foodItemContainer: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.macrosBackground, marginHorizontal: 20, }, 
    foodItemText: { alignItems: isRTL ? 'flex-end' : 'flex-start', flex: 1, [isRTL ? 'marginLeft' : 'marginRight']: 10 }, 
    foodItemName: { fontSize: 16, fontWeight: '600', color: theme.text, textAlign: isRTL ? 'right' : 'left' }, 
    quantityButton: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginTop: 4, padding: 4, alignSelf: isRTL ? 'flex-end' : 'flex-start' }, 
    foodItemQuantity: { fontSize: 14, color: theme.primary, [isRTL ? 'marginLeft' : 'marginRight']: 5 }, 
    foodItemCalories: { fontSize: 16, fontWeight: 'bold', color: theme.text }, 
    plateTotalContainer: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: theme.macrosBackground, marginTop: 10, marginHorizontal: 20, }, 
    plateTotalLabel: { fontSize: 18, fontWeight: 'bold', color: theme.secondaryText, }, 
    plateTotalValue: { fontSize: 18, fontWeight: 'bold', color: theme.danger, }, 
    modalSummary: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20, paddingHorizontal: 20, }, 
    modalGoalItem: { alignItems: 'center', flex: 1 }, 
    modalGoalLabel: { fontSize: 14, color: theme.secondaryText, marginBottom: 4 }, 
    modalGoalValue: { fontSize: 20, fontWeight: 'bold', color: theme.text }, 
    modalProgressCircle: { alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 }, 
    circleTextContainer: { position: 'absolute', alignItems: 'center' }, 
    remainingValue: { fontSize: 24, fontWeight: 'bold', color: theme.text }, 
    remainingLabel: { fontSize: 12, color: theme.secondaryText }, 
    macrosContainer: { marginTop: 5, padding: 15, backgroundColor: theme.macrosBackground, borderRadius: 16, marginHorizontal: 20, }, 
    macrosTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: theme.primary }, 
    macroBarContainer: { marginBottom: 12 }, 
    macroHeader: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, 
    macroLabel: { fontSize: 15, color: theme.text, fontWeight: '600' }, 
    macroValue: { fontSize: 14, color: theme.secondaryText }, 
    modalActions: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginTop: 25, paddingHorizontal: 20, }, 
    actionButton: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginHorizontal: 5 }, 
    addButton: { backgroundColor: theme.primary }, 
    actionButtonText: { color: theme.textOnDark, fontSize: 16, fontWeight: 'bold' }, 
    cancelButton: { backgroundColor: theme.cancelButtonBackground }, 
    cancelButtonText: { color: theme.cancelButtonText, fontWeight: 'bold' }, 
    mealSelectionBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }, 
    mealSelectionContainer: { width: '85%', backgroundColor: theme.modalSurface, borderRadius: 20, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'stretch' }, 
    mealSelectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 20, textAlign: 'center' }, 
    mealOptionButton: { width: '100%', backgroundColor: theme.macrosBackground, paddingVertical: 15, borderRadius: 12, marginBottom: 10 }, 
    mealOptionText: { fontSize: 18, color: theme.primary, textAlign: 'center', fontWeight: '600' }, 
    mealCancelButton: { width: '100%', paddingVertical: 12, marginTop: 5 }, 
    mealCancelButtonText: { fontSize: 16, color: theme.secondaryText, textAlign: 'center', fontWeight: '500' }, 
    quantityInputLabel: { fontSize: 16, color: theme.secondaryText, textAlign: 'center', marginBottom: 10, }, 
    quantityInput: { backgroundColor: theme.macrosBackground, color: theme.text, padding: 12, borderRadius: 10, textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginBottom: 20, },
});

export default CameraScreen;