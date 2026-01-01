import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import 'react-native-gesture-handler';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, 
    Dimensions, Image, Platform, TextInput, FlatList, ActivityIndicator, 
    Alert, Modal, StatusBar, I18nManager, BackHandler, InteractionManager
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigationState, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSequence, withDelay, useAnimatedProps } from 'react-native-reanimated';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { Pedometer } from 'expo-sensors';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import GoogleFit, { Scopes } from 'react-native-google-fit'; 

// 🔥 1. إضافة مكتبة الإعلانات هنا
import { TestIds, useInterstitialAd } from 'react-native-google-mobile-ads';

import ProfileScreen from './profile';
import CameraScreen from './camera';
import WorkoutLogScreen from './workoutlog';
import WaterScreen from './watertracker';
import WeightScreen from './weighttracker';
import StepsScreen from './steps';
import ReportsScreen from './reports';
import FoodLogDetailScreen from './foodlogdetail';
import { searchEgyptianFoodsWithImages, supabase } from './supabaseclient';
import EditProfileScreen from './editprofile';
import SettingsScreen from './setting'; 
import AboutScreen from './about';

// 🔥 2. تحديد المعرف الإعلاني (استخدم TestIds أثناء التطوير لتجنب الحظر)
const AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8833281523608204/5252812391'; // استبدل بـ ID الحقيقي عند النشر

const STEPS_NOTIFICATION_TASK = 'steps-notification-task';

const getFlexDirection = (language) => {
    const isAppRTL = language === 'ar';
    const isSystemRTL = I18nManager.isRTL;
    return isAppRTL === isSystemRTL ? 'row' : 'row-reverse';
};

const getTextAlign = (language) => {
    return language === 'ar' ? 'right' : 'left';
};

// ... (باقي تعريفات التاسك والألوان والترجمات كما هي بدون تغيير) ...
// (تم اختصار الأجزاء اللي مش هتتغير عشان المساحة، الكود بالأسفل هو DiaryScreen المعدل)

TaskManager.defineTask(STEPS_NOTIFICATION_TASK, async () => { /* ... نفس الكود ... */ return BackgroundFetch.BackgroundFetchResult.NoData; });
const lightTheme = { primary: '#388E3C', background: '#E8F5E9', card: '#FFFFFF', textPrimary: '#212121', textSecondary: '#757575', progressUnfilled: '#D6EAD7', disabled: '#BDBDBD', carbs: '#007BFF', protein: '#FF7043', fat: '#FFC107', fiber: '#4CAF50', sugar: '#9C27B0', sodium: '#2196F3', overLimit: '#D32F2F', tabBarBackground: '#FFFFFF', tabBarIndicator: '#4CAF50', tabBarIcon: '#222327', white: '#FFFFFF', readOnlyBanner: '#FFA000', indicatorDot: '#1B5E20', statusBar: 'dark-content', };
const darkTheme = { primary: '#66BB6A', background: '#121212', card: '#1E1E1E', textPrimary: '#FFFFFF', textSecondary: '#B0B0B0', progressUnfilled: '#2C2C2C', disabled: '#424242', carbs: '#42A5F5', protein: '#FF8A65', fat: '#FFCA28', fiber: '#81C784', sugar: '#BA68C8', sodium: '#64B5F6', overLimit: '#EF9A9A', tabBarBackground: '#1E1E1E', tabBarIndicator: '#81C784', tabBarIcon: '#E0E0E0', white: '#FFFFFF', readOnlyBanner: '#D48604', indicatorDot: '#A5D6A7', statusBar: 'light-content', };
const translations = { ar: { remainingCalories: 'سعر حراري متبقي', readOnlyBanner: 'أنت تعرض يوماً سابقاً. السجل للقراءة فقط.', mealSectionsTitle: 'أقسام الوجبات', mealSectionsDesc: 'هذا هو السجل التفصيلي لليوم.', breakfast: 'الفطور', lunch: 'الغداء', dinner: 'العشاء', snacks: 'وجبات خفيفة', add_to_meal: '+ أضف إلى {meal}', protein: 'بروتين', carbs: 'كربوهيدرات', fat: 'دهون', fiber: 'ألياف', sugar: 'سكر', sodium: 'صوديوم', g_unit: 'جم', mg_unit: 'مجم', kcal_unit: 'kcal', weight: 'الوزن', water: 'الماء', workouts: 'التمارين', steps: 'الخطوات', not_logged: 'غير مرتبط', unsupported: 'غير مدعوم', kg_unit: 'كجم', burned_cal: 'سعر حراري', goal: 'الهدف: ', dailyLogTitle: 'سجل وجبات اليوم', add_to: 'إضافة إلى', search_placeholder: 'ابحث عن كشري، ملوخية، تفاح...', no_results: 'لا توجد نتائج بحث.', local_food: 'أكلة محلية 🇪🇬', error: 'خطأ', search_error_msg: 'الرجاء إدخال اسم طعام للبحث.', fetch_error_msg: 'حدث خطأ أثناء جلب تفاصيل الطعام.', save_error_msg: 'حدث خطأ أثناء حفظ البيانات.', diaryTab: 'يومياتي', reportsTab: 'تقارير', cameraTab: 'كاميرا', profileTab: 'حسابي', weightTrackerTitle: 'تتبع الوزن', waterTrackerTitle: 'تتبع الماء', workoutLogTitle: 'سجل التمارين', stepsReportTitle: 'تقرير الخطوات', foodLogDetailTitle: 'تفاصيل سجل الوجبات', weekdays: ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'], p_macro: 'ب: ', c_macro: 'ك: ', f_macro: 'د: ', fib_macro: 'أ: ', sug_macro: 'س: ', sod_macro: 'ص: ', editProfile: 'تعديل الملف الشخصي', settings: 'الإعدادات', about: 'حول التطبيق', not_connected: 'غير متصل', }, en: { remainingCalories: 'Calories Remaining', readOnlyBanner: "You are viewing a past day. The log is read-only.", mealSectionsTitle: 'Meal Sections', mealSectionsDesc: 'This is the detailed log for the day.', breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks', add_to_meal: '+ Add to {meal}', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', fiber: 'Fiber', sugar: 'Sugar', sodium: 'Sodium', g_unit: 'g', mg_unit: 'mg', kcal_unit: 'kcal', weight: 'Weight', water: 'Water', workouts: 'Workouts', steps: 'Steps', not_logged: 'Not connected', unsupported: 'Unsupported', kg_unit: 'kg', burned_cal: 'calories', goal: 'Goal: ', dailyLogTitle: "Today's Food Log", add_to: 'Add to', search_placeholder: 'Search for koshari, molokhia, apple...', no_results: 'No search results found.', local_food: 'Local Food 🇪🇬', error: 'Error', search_error_msg: 'Please enter a food name to search.', fetch_error_msg: 'An error occurred while fetching food details.', save_error_msg: 'An error occurred while saving data.', diaryTab: 'Diary', reportsTab: 'Reports', cameraTab: 'Camera', profileTab: 'Profile', weightTrackerTitle: 'Weight Tracker', waterTrackerTitle: 'Water Tracker', workoutLogTitle: 'Workout Log', stepsReportTitle: 'Steps Report', foodLogDetailTitle: 'Food Log Details', weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], p_macro: 'P: ', c_macro: 'C: ', f_macro: 'F: ', fib_macro: 'Fib: ', sug_macro: 'Sug: ', sod_macro: 'Sod: ', editProfile: 'Edit Profile', settings: 'Settings', about: 'About', not_connected: 'Not Connected', } };
const SPOONACULAR_API_KEY = '8752a2c73388456888fef7aac64bcba6';
const NUTRIENT_GOALS = { fiber: 30, sugar: 50, sodium: 2300 };
const EMPTY_DAY_DATA = { food: 0, exercise: 0, breakfast: [], lunch: [], dinner: [], snacks: [], water: 0, weight: 0, exercises: [] };
const describeArc = (x, y, radius, startAngle, endAngle) => { 'worklet'; const clampedEndAngle = Math.min(endAngle, 359.999); const start = { x: x + radius * Math.cos((startAngle - 90) * Math.PI / 180.0), y: y + radius * Math.sin((startAngle - 90) * Math.PI / 180.0), }; const end = { x: x + radius * Math.cos((clampedEndAngle - 90) * Math.PI / 180.0), y: y + radius * Math.sin((clampedEndAngle - 90) * Math.PI / 180.0), }; const largeArcFlag = clampedEndAngle - startAngle <= 180 ? '0' : '1'; const d = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,].join(' '); return d; };
const LeafAnimation = ({ trigger }) => { const opacity = useSharedValue(0); const translateY = useSharedValue(-20); const rotate = useSharedValue(0); useEffect(() => { opacity.value = 0; translateY.value = -20; rotate.value = Math.random() > 0.5 ? -10 : 10; opacity.value = withSequence(withTiming(0.7, { duration: 400 }), withDelay(800, withTiming(0, { duration: 600 }))); translateY.value = withTiming(70, { duration: 2200 }); rotate.value = withTiming(rotate.value > 0 ? 25 : -25, { duration: 2200 }); }, [trigger]); const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }, { rotateZ: `${rotate.value}deg` }], })); return (<Animated.View style={[styles.leafAnimationContainer, animatedStyle]}><Image source={require('./assets/leafbar.png')} style={styles.leafImage} /></Animated.View>); };
const calculateMacroGoals = (totalCalories) => { const caloriesPerGram = { protein: 4, carbs: 4, fat: 9 }; const macroSplit = { protein: 0.30, carbs: 0.40, fat: 0.30 }; return { protein: Math.round((totalCalories * macroSplit.protein) / caloriesPerGram.protein), carbs: Math.round((totalCalories * macroSplit.carbs) / caloriesPerGram.carbs), fat: Math.round((totalCalories * macroSplit.fat) / caloriesPerGram.fat), }; };
const formatDateKey = (date) => { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; };
const AnimatedPath = Animated.createAnimatedComponent(Path);
async function registerForPushNotificationsAsync() { if (Platform.OS === 'android') { await Notifications.setNotificationChannelAsync('default', { name: 'default', importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 250, 250, 250], lightColor: '#FF231F7C', }); } if (Device.isDevice) { const { status: existingStatus } = await Notifications.getPermissionsAsync(); let finalStatus = existingStatus; if (existingStatus !== 'granted') { const { status } = await Notifications.requestPermissionsAsync(); finalStatus = status; } if (finalStatus !== 'granted') { console.log('User did not grant notification permissions.'); return; } } else { console.log('Must use physical device for Push Notifications'); } }

// ... (DateNavigator, SummaryCard, NutrientRow, NutrientSummaryCard, FoodLogItem, DailyFoodLog, MealLoggingSection, AddFoodModal - كلها زي ما هي) ...
// (تم إخفاء مكونات الـ UI الفرعية للإيجاز، لكنها موجودة في الكود الأصلي)
const DateNavigator = ({ selectedDate, onDateSelect, referenceToday, theme, t, language }) => { /* ... */ return (<View style={styles.dateNavContainer(theme)}>{/*...*/}</View>); };
const SummaryCard = ({ data, dailyGoal, theme, t, language }) => { /* ... */ return (<View style={[styles.card(theme), { alignItems: 'center' }]}>{/*...*/}</View>); };
const NutrientRow = ({ label, consumed, goal, color, unit = 'جم', isLimit = false, theme, language }) => { /* ... */ return (<View style={styles.nutrientRowContainer}>{/*...*/}</View>); };
const NutrientSummaryCard = ({ data, theme, t, language }) => { /* ... */ return (<View style={styles.card(theme)}>{/*...*/}</View>); };
const FoodLogItem = ({ item, theme, t, showMacros = true, language }) => { /* ... */ return (<View style={[styles.foodLogItemContainer, { flexDirection: getFlexDirection(language) }]}>{/*...*/}</View>); };
const DailyFoodLog = ({ items, onPress, theme, t, language }) => { /* ... */ return (<TouchableOpacity onPress={onPress} activeOpacity={0.8}><View style={[styles.card(theme), styles.dailyLogCard]}>{/*...*/}</View></TouchableOpacity>); };
const MealLoggingSection = ({ title, iconName, items, onAddPress, mealKey, isEditable, theme, t, language }) => { /* ... */ return (<View style={styles.card(theme)}>{/*...*/}</View>); };
const AddFoodModal = ({ visible, onClose, onFoodSelect, mealKey, theme, t }) => { /* ... نفس الكود ... */ return (<Modal visible={visible} onRequestClose={() => onClose()} animationType="slide" transparent={true}><View style={styles.modalOverlay}><View style={styles.modalView(theme)}>{/* ... */}</View></View></Modal>);};
const SmallWeightCard = ({ weight, onPress, theme, t, language }) => ( <TouchableOpacity style={styles.smallCard(theme)} onPress={onPress}> {/*...*/} </TouchableOpacity> );
const SmallWaterCard = ({ water, waterGoal, onPress, theme, t, language }) => { /*...*/ return (<TouchableOpacity style={styles.smallCard(theme)} onPress={onPress}>{/*...*/}</TouchableOpacity>); };
const SmallWorkoutCard = ({ totalCaloriesBurned = 0, onPress, theme, t, language }) => { /*...*/ return (<TouchableOpacity style={styles.smallCard(theme)} onPress={onPress}>{/*...*/}</TouchableOpacity>); };
const SmallStepsCard = ({ navigation, theme, t, language }) => { /* ... نفس الكود ... */ return (<TouchableOpacity style={styles.smallCard(theme)} onPress={() => navigation.navigate('Steps')}>{/*...*/}</TouchableOpacity>); };


const DashboardGrid = ({ weight, water, waterGoal, totalExerciseCalories, onWeightPress, onWaterPress, onWorkoutPress, navigation, theme, t, language }) => (
    <View style={[styles.dashboardGridContainer, { flexDirection: getFlexDirection(language) }]}>
        <SmallWeightCard weight={weight} onPress={onWeightPress} theme={theme} t={t} language={language} />
        <SmallWaterCard water={water} waterGoal={waterGoal} onPress={onWaterPress} theme={theme} t={t} language={language} />
        <SmallWorkoutCard totalCaloriesBurned={totalExerciseCalories} onPress={onWorkoutPress} theme={theme} t={t} language={language} />
        <SmallStepsCard navigation={navigation} theme={theme} t={t} language={language} />
    </View>
);

function DiaryScreen({ navigation, route, setHasProgress, theme, t, language }) { 
    const referenceToday = new Date(); 
    referenceToday.setHours(0, 0, 0, 0); 
    const [selectedDate, setSelectedDate] = useState(referenceToday); 
    const [dailyData, setDailyData] = useState(EMPTY_DAY_DATA); 
    const passedGoal = route.params?.dailyGoal;
    const [dailyGoal, setDailyGoal] = useState(2000); 
    const [macroGoals, setMacroGoals] = useState({ protein: 0, carbs: 0, fat: 0 }); 
    const [isFoodModalVisible, setFoodModalVisible] = useState(false); 
    const [currentMealKey, setCurrentMealKey] = useState(null); 
    const [waterGoal, setWaterGoal] = useState(8); 
    const isToday = formatDateKey(selectedDate) === formatDateKey(new Date()); 

    // 🔥 3. إعداد الإعلان البيني (Interstitial)
    const { isLoaded, isClosed, load, show } = useInterstitialAd(AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
    });

    // 🔥 4. إعادة تحميل الإعلان كل ما يتقفل عشان يبقى جاهز للمرة الجاية
    useEffect(() => {
        load();
    }, [load, isClosed]);

    const loadAllData = useCallback(async () => { 
        try { 
            const profileJson = await AsyncStorage.getItem('userProfile');
            const savedProfile = profileJson ? JSON.parse(profileJson) : null;
            let goalToSet = 2000;
            if (savedProfile && savedProfile.dailyGoal) {
                goalToSet = savedProfile.dailyGoal;
            } else if (passedGoal) {
                goalToSet = passedGoal;
                const profileToSave = savedProfile || {};
                profileToSave.dailyGoal = goalToSet;
                await AsyncStorage.setItem('userProfile', JSON.stringify(profileToSave));
            } else {
                 const { data: { user } } = await supabase.auth.getUser();
                 if (user?.user_metadata?.daily_goal) {
                     goalToSet = user.user_metadata.daily_goal;
                     const profileToSave = savedProfile || {};
                     profileToSave.dailyGoal = goalToSet;
                     await AsyncStorage.setItem('userProfile', JSON.stringify(profileToSave));
                 }
            }
            setDailyGoal(goalToSet);
            const settingsJson = await AsyncStorage.getItem('waterSettings'); 
            setWaterGoal(settingsJson ? (JSON.parse(settingsJson).goal || 8) : 8);
            const dateKey = formatDateKey(selectedDate); 
            const dayJson = await AsyncStorage.getItem(dateKey); 
            let currentDayData = dayJson ? JSON.parse(dayJson) : { ...EMPTY_DAY_DATA }; 
            const weightHistoryJson = await AsyncStorage.getItem('weightHistory'); 
            const weightHistory = weightHistoryJson ? JSON.parse(weightHistoryJson) : []; 
            if (weightHistory.length > 0) { 
                weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date)); 
                const endOfDay = new Date(selectedDate); 
                endOfDay.setHours(23, 59, 59, 999); 
                const weightForDate = weightHistory.filter(entry => new Date(entry.date) <= endOfDay).pop(); 
                currentDayData.displayWeight = weightForDate ? weightForDate.weight : 0; 
            } else { 
                currentDayData.displayWeight = 0; 
            } 
            setDailyData(currentDayData); 
        } catch (e) { 
            console.error("Failed to load data on focus:", e); 
            setDailyData(EMPTY_DAY_DATA); 
            setDailyGoal(2000);
        } 
    }, [selectedDate, passedGoal]);
    useFocusEffect(useCallback(() => { loadAllData(); }, [loadAllData])); 
    
    const saveData = async (dataToSave) => { try { const dateKey = formatDateKey(selectedDate); await AsyncStorage.setItem(dateKey, JSON.stringify(dataToSave)); } catch (e) { console.error("Failed to save data:", e); Alert.alert(t('error'), t('save_error_msg')); } }; 
    
    const handleAddItem = (mealKey, foodItem) => { 
        if (!mealKey || !foodItem) return; 
        const updatedMealArray = [...(dailyData[mealKey] || []), foodItem]; 
        const updatedData = { ...dailyData, [mealKey]: updatedMealArray }; 
        saveData(updatedData); 
        setDailyData(updatedData); 
        
        // 🔥 5. إظهار الإعلان بعد حفظ الوجبة (High Revenue Spot)
        // ده أحسن مكان لأن المستخدم خلص اللي بيعمله ومش هيتضايق
        if (isLoaded) {
            show();
        }
    }; 
    
    const handleOpenModal = (mealKey) => { setCurrentMealKey(mealKey); setFoodModalVisible(true); }; 
    const handleFoodSelectedFromModal = (foodItem) => { handleAddItem(currentMealKey, foodItem); }; 
    useEffect(() => { if (dailyGoal > 0) { setMacroGoals(calculateMacroGoals(dailyGoal)); } }, [dailyGoal]); 
    const allFoodItems = [...(dailyData.breakfast || []), ...(dailyData.lunch || []), ...(dailyData.dinner || []), ...(dailyData.snacks || []),]; 
    const calculatedTotals = allFoodItems.reduce((acc, item) => { return { food: acc.food + (item.calories || 0), protein: acc.protein + (item.p || 0), carbs: acc.carbs + (item.c || 0), fat: acc.fat + (item.f || 0), fiber: acc.fiber + (item.fib || 0), sugar: acc.sugar + (item.sug || 0), sodium: acc.sodium + (item.sod || 0), }; }, { food: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }); 
    const totalExerciseCalories = (dailyData.exercises || []).reduce((sum, ex) => sum + (ex.calories || 0), 0); 
    useEffect(() => { const progressMade = calculatedTotals.food > 0 || totalExerciseCalories > 0; setHasProgress(progressMade); }, [calculatedTotals.food, totalExerciseCalories, setHasProgress]); 
    
    const flexDirection = getFlexDirection(language);
    const textAlign = getTextAlign(language);

    // 🔥 6. دالة خاصة للتنقل تعرض الإعلان الأول (Gateway Ad)
    const navigateWithAd = (screenName, params = {}) => {
        if (isLoaded) {
            show();
            // الانتقال هيحصل لما المستخدم يقفل الإعلان (أو ممكن ننتقل فوراً والإعلان يظهر فوق)
            // الأفضل في تجربة المستخدم الانتقال بعد الإغلاق، بس للربح العالي، اعرض وانتقل في الخلفية
            navigation.navigate(screenName, params);
        } else {
            navigation.navigate(screenName, params);
        }
    };

    return ( 
        <SafeAreaView style={styles.rootContainer(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <AddFoodModal visible={isFoodModalVisible} onClose={() => setFoodModalVisible(false)} onFoodSelect={handleFoodSelectedFromModal} mealKey={currentMealKey} theme={theme} t={t} />
            <ScrollView contentContainerStyle={styles.container}>
                <DateNavigator selectedDate={selectedDate} onDateSelect={setSelectedDate} referenceToday={referenceToday} theme={theme} t={t} language={language} />
                {!isToday && (
                    <View style={[styles.readOnlyBanner(theme), { flexDirection: flexDirection }]}>
                        <Ionicons name="information-circle-outline" size={20} color={theme.white} style={language === 'ar' ? { marginLeft: 8 } : { marginRight: 8 }} />
                        <Text style={[styles.readOnlyBannerText(theme), { textAlign: textAlign }]}>{t('readOnlyBanner')}</Text>
                    </View>
                )}
                <SummaryCard data={{ food: calculatedTotals.food, exercise: totalExerciseCalories }} dailyGoal={dailyGoal} theme={theme} t={t} language={language} />
                <NutrientSummaryCard data={{ protein: { consumed: calculatedTotals.protein, goal: macroGoals.protein }, carbs: { consumed: calculatedTotals.carbs, goal: macroGoals.carbs }, fat: { consumed: calculatedTotals.fat, goal: macroGoals.fat }, fiber: { consumed: calculatedTotals.fiber, goal: NUTRIENT_GOALS.fiber }, sugar: { consumed: calculatedTotals.sugar, goal: NUTRIENT_GOALS.sugar }, sodium: { consumed: calculatedTotals.sodium, goal: NUTRIENT_GOALS.sodium }, }} theme={theme} t={t} language={language} />
                
                {/* 🔥 7. استخدام دالة التنقل مع الإعلان في الداشبورد */}
                <DashboardGrid 
                    weight={dailyData.displayWeight || 0} 
                    water={dailyData.water || 0} 
                    waterGoal={waterGoal} 
                    totalExerciseCalories={totalExerciseCalories} 
                    onWeightPress={() => navigateWithAd('Weight')} 
                    onWaterPress={() => navigateWithAd('Water', { dateKey: formatDateKey(selectedDate) })} 
                    onWorkoutPress={() => navigateWithAd('WorkoutLog', { dateKey: formatDateKey(selectedDate) })} 
                    navigation={navigation} 
                    theme={theme} 
                    t={t} 
                    language={language} 
                />
                
                <DailyFoodLog items={allFoodItems} onPress={() => navigation.navigate('FoodLogDetail', { items: allFoodItems, dateString: selectedDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) })} theme={theme} t={t} language={language} />
                <View style={[styles.sectionHeaderContainer, { alignItems: language === 'ar' ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.sectionTitle(theme), { textAlign: textAlign }]}>{t('mealSectionsTitle')}</Text>
                    <Text style={[styles.sectionDescription(theme), { textAlign: textAlign }]}>{t('mealSectionsDesc')}</Text>
                </View>
                <MealLoggingSection title={t('breakfast')} iconName="sunny-outline" items={dailyData.breakfast || []} onAddPress={handleOpenModal} mealKey="breakfast" isEditable={isToday} theme={theme} t={t} language={language} />
                <MealLoggingSection title={t('lunch')} iconName="partly-sunny-outline" items={dailyData.lunch || []} onAddPress={handleOpenModal} mealKey="lunch" isEditable={isToday} theme={theme} t={t} language={language} />
                <MealLoggingSection title={t('dinner')} iconName="moon-outline" items={dailyData.dinner || []} onAddPress={handleOpenModal} mealKey="dinner" isEditable={isToday} theme={theme} t={t} language={language} />
                <MealLoggingSection title={t('snacks')} iconName="nutrition-outline" items={dailyData.snacks || []} onAddPress={handleOpenModal} mealKey="snacks" isEditable={isToday} theme={theme} t={t} language={language} />
            </ScrollView>
        </SafeAreaView> 
    ); 
}

// ... (باقي الكود: MagicLineTabBar, StackNavigators, MainUIScreen, styles... كما هو) ...

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INDICATOR_DIAMETER = 70;

const MagicLineTabBar = ({ state, descriptors, navigation, theme, t, language }) => {
    // ... نفس الكود بدون تغيير ...
    const TAB_COUNT = state.routes.length;
    const TAB_WIDTH = Dimensions.get('window').width / TAB_COUNT;
    const [profileImage, setProfileImage] = useState(null);

    const orderEn = ['ProfileStack', 'Camera', 'ReportsStack', 'DiaryStack'];
    const orderAr = ['DiaryStack', 'ReportsStack', 'Camera', 'ProfileStack']; 
    
    const offsets = {
        en: [0, -180, -360, -540], 
        ar: [0, -180, -360, -540]  
    };
    
    const currentOrderNames = language === 'ar' ? orderAr : orderEn;
    
    const orderedRoutes = currentOrderNames.map(name => 
        state.routes.find(r => r.name === name)
    ).filter(Boolean);

    const currentActiveRouteName = state.routes[state.index].name;
    const activeIndex = currentOrderNames.indexOf(currentActiveRouteName);
    const manualCorrection = language === 'ar' ? offsets.ar[activeIndex] : offsets.en[activeIndex];
    const finalTranslateX = (activeIndex * TAB_WIDTH) + (manualCorrection || 0);

    const translateX = useSharedValue(finalTranslateX);

    useEffect(() => {
        translateX.value = withTiming(finalTranslateX, { duration: 300 });
    }, [finalTranslateX]);

    useFocusEffect(useCallback(() => {
        const loadProfileImage = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem('userProfile');
                setProfileImage(jsonValue ? JSON.parse(jsonValue).profileImage : null);
            } catch (e) { console.error(e); }
        };
        loadProfileImage();
    }, []));

    const indicatorAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    return (
        <View style={[styles.tabBarContainer(theme), { flexDirection: 'row', direction: 'ltr' }]}>
            <View style={styles.animationWrapper}>
                <LeafAnimation trigger={activeIndex} />
            </View>
            <Animated.View style={[
                styles.indicatorContainer, 
                { width: TAB_WIDTH, left: 0 }, 
                indicatorAnimatedStyle
            ]}>
                <View style={[styles.indicator(theme), { backgroundColor: theme.tabBarIndicator }]}>
                    <View style={[styles.cutout, styles.cutoutLeft(theme)]} />
                    <View style={[styles.cutout, styles.cutoutRight(theme)]} />
                </View>
            </Animated.View>
            {orderedRoutes.map((route, index) => {
                const descriptor = descriptors[route.key];
                const { options } = descriptor;
                const isFocused = currentActiveRouteName === route.name;
                const onPress = () => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) { navigation.navigate(route.name); }
                };
                const iconAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: withTiming(isFocused ? -32 : 0, { duration: 500 }) }], }));
                const textAnimatedStyle = useAnimatedStyle(() => ({ opacity: withTiming(isFocused ? 1 : 0, { duration: 500 }), transform: [{ translateY: withTiming(isFocused ? 10 : 20, { duration: 500 }) }], }));
                const isProfileTab = route.name === 'ProfileStack';
                return (
                    <TouchableOpacity key={route.key} style={[styles.tabItem, { width: TAB_WIDTH, zIndex: 1 }]} onPress={onPress}>
                        <Animated.View style={[styles.tabIconContainer, iconAnimatedStyle]}>
                            {isProfileTab ? ( <Image source={profileImage ? { uri: profileImage } : require('./assets/profile.png')} style={styles.profileTabIcon} /> ) : ( <Ionicons name={options.tabBarIconName || 'alert-circle-outline'} size={28} color={isFocused ? theme.textPrimary : theme.tabBarIcon} /> )}
                        </Animated.View>
                        <Animated.Text style={[styles.tabText(theme), textAnimatedStyle]}>{options.tabBarLabel}</Animated.Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const Tab = createBottomTabNavigator();
const DiaryStack = createStackNavigator();
const ReportsStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const commonStackOptions = (theme) => ({ 
  headerStyle: { backgroundColor: theme.card, elevation: 0, shadowOpacity: 0 }, 
  headerTintColor: theme.textPrimary, 
  headerTitleStyle: { fontWeight: 'bold' }, 
  headerTitleAlign: 'center',
  cardStyle: { flex: 1, backgroundColor: theme.background }, 
});

function DiaryStackNavigator({ setHasProgress, theme, t, isRTL, language }) { 
  return ( 
    <DiaryStack.Navigator screenOptions={commonStackOptions(theme)}>
      <DiaryStack.Screen name="DiaryHome" options={{ headerShown: false }}>
        {props => <DiaryScreen {...props} setHasProgress={setHasProgress} theme={theme} t={t} language={language} />}
      </DiaryStack.Screen>
      <DiaryStack.Screen name="Weight" component={WeightScreen} options={{ title: t('weightTrackerTitle') }} />
      <DiaryStack.Screen name="Water" component={WaterScreen} options={{ title: t('waterTrackerTitle') }} />
      <DiaryStack.Screen name="WorkoutLog" component={WorkoutLogScreen} options={{ title: t('workoutLogTitle') }} />
      <DiaryStack.Screen name="Steps" component={StepsScreen} options={{ title: t('stepsReportTitle') }} />
      <DiaryStack.Screen name="FoodLogDetail" component={FoodLogDetailScreen} options={{ title: t('foodLogDetailTitle') }} />
    </DiaryStack.Navigator> 
  ); 
}

function ReportsStackNavigator({ theme, language }) { 
  return ( 
    <ReportsStack.Navigator screenOptions={commonStackOptions(theme)}>
      <ReportsStack.Screen name="ReportsHome" options={{ headerShown: false }}>
        {props => <ReportsScreen {...props} appLanguage={language} />}
      </ReportsStack.Screen>
    </ReportsStack.Navigator> 
  ); 
}

function ProfileStackNavigator({ theme, t, onThemeChange, appLanguage }) {
  return (
    <ProfileStack.Navigator screenOptions={commonStackOptions(theme)}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Settings" options={{ headerShown: false }}>
        {props => <SettingsScreen {...props} onThemeChange={onThemeChange} appLanguage={appLanguage} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
    </ProfileStack.Navigator>
  );
}

function MainUIScreen({ appLanguage }) {
  const [theme, setTheme] = useState(lightTheme);
  const [language, setLanguage] = useState(appLanguage);
  const [hasProgress, setHasProgress] = useState(false);
  const navState = useNavigationState(state => state);

  useFocusEffect(
    React.useCallback(() => {
        if (Platform.OS !== 'android') {
            return;
        }
        const onBackPress = () => {
            if (!navState) { return false; }
            const mainUIRoute = navState.routes.find(route => route.name === 'MainUI');
            if (!mainUIRoute || !mainUIRoute.state) { return false; }
            const tabState = mainUIRoute.state;
            const currentTabRoute = tabState.routes[tabState.index];
            const isTabAtRoot = !currentTabRoute.state || currentTabRoute.state.index === 0;
            if (isTabAtRoot) { BackHandler.exitApp(); return true; }
            return false;
        };
        BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navState])
  );
  
  useEffect(() => { 
    setLanguage(appLanguage); 
  }, [appLanguage]);

  const handleThemeChange = async (isDark) => {
    const newTheme = isDark ? darkTheme : lightTheme;
    setTheme(newTheme);
    try { await AsyncStorage.setItem('isDarkMode', String(isDark)); } catch (e) { console.error('Failed to save theme setting.', e); }
  };
  const t = useCallback((key, params) => { let string = translations[language]?.[key] || translations['en'][key] || key; if (params) { Object.keys(params).forEach(pKey => { string = string.replace(`{${pKey}}`, params[pKey]); }); } return string; }, [language]);
  const loadSettings = async () => { try { const savedTheme = await AsyncStorage.getItem('isDarkMode'); setTheme(savedTheme === 'true' ? darkTheme : lightTheme); } catch (e) { console.error('Failed to load settings.', e); } };
  useFocusEffect(useCallback(() => { loadSettings(); }, []));
  
  useEffect(() => {
    const setupInitialTasks = async () => {
      try {
        await registerForPushNotificationsAsync();
        Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, }), });
        const settingsRaw = await AsyncStorage.getItem('reminderSettings');
        const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
        if(settings.stepsGoal?.enabled) {
            const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(STEPS_NOTIFICATION_TASK);
            if (!isTaskRegistered) { await BackgroundFetch.registerTaskAsync(STEPS_NOTIFICATION_TASK, { minimumInterval: 15 * 60, stopOnTerminate: false, startOnBoot: true, }); }
        }
      } catch (error) { console.error("Error setting up initial tasks:", error); }
    };
    setupInitialTasks();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        const route = props.state.routes[props.state.index];
        const routeName = getFocusedRouteNameFromRoute(route);
        const screensToHideTabBar = ['Weight', 'Water', 'WorkoutLog', 'Steps', 'FoodLogDetail', 'EditProfile', 'Settings', 'About'];
        if (screensToHideTabBar.includes(routeName)) { return null; }
        return <MagicLineTabBar {...props} theme={theme} t={t} language={language} />;
      }}
    >
      <Tab.Screen name="DiaryStack" options={{ tabBarLabel: t('diaryTab'), tabBarIconName: 'journal-outline' }}>
          {props => <DiaryStackNavigator {...props} setHasProgress={setHasProgress} theme={theme} t={t} language={language} />}
      </Tab.Screen>
      <Tab.Screen name="ReportsStack" options={{ tabBarLabel: t('reportsTab'), tabBarIconName: 'stats-chart-outline' }}>
          {props => <ReportsStackNavigator {...props} theme={theme} language={language} />}
      </Tab.Screen>
      <Tab.Screen name="Camera" component={CameraScreen} options={{ tabBarLabel: t('cameraTab'), tabBarIconName: 'camera-outline' }} />
      <Tab.Screen name="ProfileStack" options={{ tabBarLabel: t('profileTab'), }}>
        {props => <ProfileStackNavigator {...props} theme={theme} t={t} onThemeChange={handleThemeChange} appLanguage={appLanguage} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({ 
    rootContainer: (theme) => ({ flex: 1, backgroundColor: theme.background }), 
    container: { paddingHorizontal: 20, paddingBottom: 80 }, 
    card: (theme) => ({ backgroundColor: theme.card, borderRadius: 20, padding: 20, marginBottom: 15 }), 
    dateNavContainer: (theme) => ({ marginVertical: 10, backgroundColor: theme.card, borderRadius: 20, paddingVertical: 15, paddingHorizontal: 10 }), 
    dateNavHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5, },
    arrowButton: { padding: 5 }, 
    dateNavMonthText: (theme) => ({ flex: 1, fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'center', marginHorizontal: 10, }), 
    weekContainer: { justifyContent: 'space-around', marginBottom: 10 },
    weekDayText: (theme) => ({ fontSize: 14, color: theme.textSecondary, fontWeight: '500', width: 40, textAlign: 'center' }), 
    datesContainer: { justifyContent: 'space-around' }, 
    dateCircle: { width: 40, height: 40, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    dateText: (theme) => ({ fontSize: 16, color: theme.textPrimary, fontWeight: '600' }), 
    activeText: (theme) => ({ color: theme.white }), 
    disabledDateText: (theme) => ({ color: theme.disabled }), 
    summaryCircleContainer: { justifyContent: 'center', position: 'relative' }, 
    summaryTextContainer: { position: 'absolute', alignItems: 'center', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' }, 
    remainingCaloriesText: (theme) => ({ fontSize: 42, fontWeight: 'bold', color: theme.textPrimary }), 
    remainingLabel: (theme) => ({ fontSize: 14, color: theme.textSecondary }), 
    progressIndicatorDot: (theme) => ({ position: 'absolute', top: 0, left: 0, backgroundColor: theme.indicatorDot, borderWidth: 3, borderColor: theme.card }), 
    sectionHeaderContainer: { marginTop: 15, marginBottom: 10, }, 
    sectionTitle: (theme) => ({ fontSize: 22, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 0, flexShrink: 1 }),
    sectionDescription: (theme) => ({ fontSize: 14, color: theme.textSecondary, }),
    mealSectionHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, },
    mealSectionHeaderLeft: { alignItems: 'center' },
    mealIcon: { marginEnd: 10 }, 
    mealSectionTitle: (theme) => ({ fontSize: 22, fontWeight: 'bold', color: theme.textPrimary }), 
    mealSectionTotalCalories: (theme) => ({ fontSize: 16, color: theme.textSecondary, fontWeight: '600' }), 
    mealMacrosContainer: (theme) => ({ justifyContent: 'flex-start', alignItems: 'center', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.background, flexWrap: 'wrap' }), 
    macroSummaryItem: { marginEnd: 20, marginBottom: 5 }, 
    macroSummaryText: (theme) => ({ fontSize: 13, color: theme.textSecondary, fontWeight: '600' }), 
    smartAddButton: (theme) => ({ marginTop: 15, paddingVertical: 15, borderRadius: 15, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', width: '100%' }), 
    smartAddButtonText: (theme) => ({ color: theme.white, fontSize: 18, fontWeight: 'bold' }), 
    disabledButton: (theme) => ({ backgroundColor: theme.disabled }), 
    readOnlyBanner: (theme) => ({ backgroundColor: theme.readOnlyBanner, borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 15 }), 
    readOnlyBannerText: (theme) => ({ color: theme.white, fontSize: 14, fontWeight: 'bold', flex: 1 }), 
    nutrientRowHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, }, 
    nutrientRowContainer: { marginBottom: 15, }, 
    nutrientRowLabel: (theme) => ({ fontSize: 16, color: theme.textPrimary, fontWeight: '600', }), 
    nutrientRowValue: (theme) => ({ fontSize: 14, color: theme.textSecondary, }), 
    tabBarContainer: (theme) => ({ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: theme.tabBarBackground }),
    tabItem: { height: 70, justifyContent: 'center', alignItems: 'center' }, 
    tabIconContainer: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center', },
    tabText: (theme) => ({ position: 'absolute', color: theme.tabBarIcon, fontSize: 12, fontWeight: '400' }), 
    indicatorContainer: { position: 'absolute', top: -35, height: INDICATOR_DIAMETER, alignItems: 'center', zIndex: 0 }, 
    indicator: (theme) => ({ width: INDICATOR_DIAMETER, height: INDICATOR_DIAMETER, borderRadius: INDICATOR_DIAMETER / 2, borderWidth: 6, borderColor: theme.background }), 
    cutout: { position: 'absolute', top: '50%', width: 20, height: 20, backgroundColor: 'transparent', shadowOpacity: 1, shadowRadius: 0 }, 
    cutoutLeft: (theme) => ({ left: -22, borderTopRightRadius: 20, shadowColor: theme.background, shadowOffset: { width: 1, height: -10 } }), 
    cutoutRight: (theme) => ({ right: -22, borderTopLeftRadius: 20, shadowColor: theme.background, shadowOffset: { width: -1, height: -10 } }), 
    profileTabIcon: { width: 32, height: 32, borderRadius: 16 }, 
    animationWrapper: { position: 'absolute', top: 0, left: 0, right: 0, height: 70, overflow: 'hidden', }, 
    leafAnimationContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', pointerEvents: 'none', }, 
    leafImage: { width: '100%', height: 50, resizeMode: 'cover', }, 
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }, 
    modalView: (theme) => ({ width: '90%', maxHeight: '80%', backgroundColor: theme.background, borderRadius: 20, padding: 0, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, overflow: 'hidden' }), 
    modalHeader: (theme) => ({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: theme.card }), 
    modalTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.textPrimary }), 
    searchContainer: { flexDirection: 'row', padding: 15, backgroundColor: 'transparent' }, 
    searchInput: (theme) => ({ flex: 1, height: 50, backgroundColor: theme.background, borderRadius: 10, paddingHorizontal: 15, fontSize: 16, textAlign: 'left', color: theme.textPrimary }), 
    searchButton: (theme) => ({ width: 50, height: 50, backgroundColor: theme.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginStart: 10 }), 
    resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }, 
    foodName: (theme) => ({ fontSize: 16, color: theme.textPrimary }), 
    emptyText: (theme) => ({ textAlign: 'center', marginTop: 50, fontSize: 16, color: theme.textSecondary }), 
    dashboardGridContainer: { justifyContent: 'space-between', marginBottom: 15, flexWrap: 'wrap', rowGap: 15, }, 
    smallCard: (theme) => ({ width: '48.5%', backgroundColor: theme.card, borderRadius: 20, padding: 15, minHeight: 120, justifyContent: 'space-between', }), 
    smallCardHeader: { alignItems: 'center', }, 
    smallCardIconContainer: (theme) => ({ width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.progressUnfilled }), 
    smallCardTitle: (theme) => ({ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginStart: 8 }), 
    smallCardValue: (theme) => ({ fontSize: 28, fontWeight: 'bold', color: theme.textPrimary, }), 
    smallCardSubValue: (theme) => ({ fontSize: 14, color: theme.textSecondary, textAlign: 'left', marginTop: -5, }), 
    smallCardContent: { }, 
    waterVisualizerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', rowGap: 5, }, 
    waterDropIcon: { marginHorizontal: 1, }, 
    stepsCardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 5 }, 
    stepsCardCircleContainer: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginVertical: 5, position: 'relative' }, 
    stepsCardTextContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10 }, 
    stepsCardCountText: (theme) => ({ fontSize: 15, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'center', width: '90%' }), 
    stepsCardGoalText: (theme) => ({ fontSize: 13, color: theme.textSecondary, marginTop: 2, }), 
    foodLogItemContainer: { alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }, 
    foodLogItemImage: { width: 50, height: 50, borderRadius: 10, marginEnd: 15, }, 
    foodLogItemImagePlaceholder: (theme) => ({ width: 50, height: 50, borderRadius: 10, marginEnd: 15, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', }), 
    foodLogItemDetails: { flex: 1, }, 
    foodLogItemHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, }, 
    foodLogItemName: (theme) => ({ fontSize: 16, fontWeight : '600', color: theme.textPrimary, flex: 1, }), 
    foodLogItemCalories: (theme) => ({ fontSize: 14, fontWeight: '500', color: theme.primary, marginStart: 8, }), 
    foodLogItemMacros: { alignItems: 'center', flexWrap: 'wrap', marginTop: 6, }, 
    macroText: (theme) => ({ fontSize: 13, color: theme.textSecondary, marginEnd: 15, marginBottom: 4, }), 
    dailyLogCard: { paddingVertical: 18, paddingHorizontal: 15, }, 
    dailyLogContentContainer: { justifyContent: 'space-between', alignItems: 'center', }, 
    dailyLogLeftContainer: { alignItems: 'center', }, 
    foodPreviewContainer: { alignItems: 'center', }, 
    previewImage: (theme) => ({ width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: theme.card, backgroundColor: '#f0f0f0', }), 
    previewImagePlaceholder: (theme) => ({ justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }), 
    previewCounterCircle: (theme) => ({ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.progressUnfilled, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.card, }), 
    previewCounterText: (theme) => ({ color: theme.primary, fontWeight: 'bold', fontSize: 12, }),
});
 
export default MainUIScreen;