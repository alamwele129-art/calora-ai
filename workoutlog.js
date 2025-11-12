// WorkoutLogScreen.js - الكود الكامل والمعدل
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, SafeAreaView, TouchableOpacity,
    TextInput, FlatList, Alert, Modal, StatusBar, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import GoogleFit from 'react-native-google-fit';
import { supabase } from './supabaseclient'; // <-- استيراد Supabase

const wlLightTheme = { primary: '#388E3C', background: '#E8F5E9', card: '#FFFFFF', textPrimary: '#212121', textSecondary: '#757575', disabled: '#BDBDBD', inputBackground: '#F5F5F5', overlay: 'rgba(0,0,0,0.5)', statusBar: 'dark-content', cancelButton: '#eee', cancelButtonText: '#212121', iconContainer: '#C8E6C9', white: '#FFFFFF', };
const wlDarkTheme = { primary: '#66BB6A', background: '#121212', card: '#1E1E1E', textPrimary: '#FFFFFF', textSecondary: '#B0B0B0', disabled: '#424242', inputBackground: '#2C2C2C', overlay: 'rgba(0,0,0,0.7)', statusBar: 'light-content', cancelButton: '#333333', cancelButtonText: '#FFFFFF', iconContainer: '#2E7D32', white: '#FFFFFF', };
const wlTranslations = {
    ar: {
        headerTitle: 'تمارين اليوم', caloriesBurned: 'سعر حراري محروق', emptyTitle: 'لا توجد تمارين مسجلة',
        emptySubtitle: 'اضغط على زر "+" في الأسفل لبدء تسجيل تمارينك اليوم.', addExerciseTitle: 'إضافة تمرين',
        searchPlaceholder: 'ابحث عن تمرين...', addCustomButtonText: 'لم تجد تمرينك؟ أضف واحدًا جديدًا',
        noResults: 'لا توجد نتائج بحث', detailsTitle: 'إضافة تفاصيل لـ "{exerciseName}"',
        durationPlaceholder: 'المدة (بالدقائق)', cancel: 'إلغاء', save: 'حفظ', createCustomTitle: 'إنشاء تمرين مخصص',
        exerciseNamePlaceholder: 'اسم التمرين', intensityLabel: 'اختر شدة التمرين:', low: 'خفيفة', medium: 'متوسطة', high: 'عالية',
        errorTitle: 'خطأ', invalidDuration: 'الرجاء إدخال مدة صحيحة بالدقائق.', errorSavingWorkout: 'حدث خطأ أثناء حفظ التمرين.',
        missingName: 'الرجاء إدخال اسم للتمرين.', successTitle: 'نجاح',
        customExerciseAdded: 'تم إضافة التمرين المخصص بنجاح!', errorSavingCustom: 'حدث خطأ أثناء حفظ التمرين المخصص.', 
        minutesUnit: 'دقيقة', caloriesUnit: 'سعر حراري',
        syncSuccess: 'تم مزامنة {count} تمرين جديد من Google Fit!', syncUpToDate: 'سجل تمارينك محدّث بالفعل.',
        syncNoWorkouts: 'لم يتم العثور على تمارين في Google Fit لهذا اليوم.', syncError: 'تعذرت المزامنة مع Google Fit.',
    },
    en: {
        headerTitle: "Today's Workout", caloriesBurned: 'Calories Burned', emptyTitle: 'No Workouts Logged',
        emptySubtitle: 'Press the "+" button below to start logging your workouts for today.', addExerciseTitle: 'Add Exercise',
        searchPlaceholder: 'Search for an exercise...', addCustomButtonText: "Can't find your exercise? Add a new one",
        noResults: 'No search results', detailsTitle: 'Add Details for "{exerciseName}"',
        durationPlaceholder: 'Duration (in minutes)', cancel: 'Cancel', save: 'Save', createCustomTitle: 'Create Custom Exercise',
        exerciseNamePlaceholder: 'Exercise Name', intensityLabel: 'Choose exercise intensity:', low: 'Low', medium: 'Moderate', high: 'High',
        errorTitle: 'Error', invalidDuration: 'Please enter a valid duration in minutes.', errorSavingWorkout: 'An error occurred while saving the workout.',
        missingName: 'Please enter a name for the exercise.', successTitle: 'Success',
        customExerciseAdded: 'Custom exercise added successfully!', errorSavingCustom: 'An error occurred while saving the custom exercise.', 
        minutesUnit: 'min', caloriesUnit: 'kcal',
        syncSuccess: '{count} new workout(s) synced from Google Fit!', syncUpToDate: 'Your workout log is already up to date.',
        syncNoWorkouts: 'No workouts found in Google Fit for today.', syncError: 'Could not sync workouts from Google Fit.',
    }
};
const WL_BASE_EXERCISES = [ { id: '101', name: { ar: 'بنش برس بالبار', en: 'Barbell Bench Press' }, icon: 'weight-lifter', met: 5.0 }, { id: '102', name: { ar: 'بنش برس بالدمبل', en: 'Dumbbell Bench Press' }, icon: 'dumbbell', met: 5.0 }, { id: '103', name: { ar: 'تمرين الضغط', en: 'Push-ups' }, icon: 'weight-lifter', met: 8.0 }, { id: '104', name: { ar: 'تفتيح بالدمبل', en: 'Dumbbell Flyes' }, icon: 'dumbbell', met: 4.0 }, { id: '105', name: { ar: 'العقلة', en: 'Pull-ups' }, icon: 'weight-lifter', met: 8.0 }, { id: '106', name: { ar: 'سحب بالبار (تجديف)', en: 'Barbell Row' }, icon: 'weight-lifter', met: 5.5 }, { id: '107', name: { ar: 'سحب بالدمبل (تجديف)', en: 'Dumbbell Row' }, icon: 'dumbbell', met: 5.5 }, { id: '108', name: { ar: 'جهاز السحب الأرضي', en: 'Seated Cable Row' }, icon: 'weight-lifter', met: 4.5 }, { id: '109', name: { ar: 'سكوات بالبار', en: 'Barbell Squat' }, icon: 'weight-lifter', met: 6.0 }, { id: '110', name: { ar: 'جهاز ضغط الأرجل', en: 'Leg Press' }, icon: 'weight-lifter', met: 5.0 }, { id: '111', name: { ar: 'الطعنات (Lunges)', en: 'Lunges' }, icon: 'weight-lifter', met: 5.0 }, { id: '112', name: { ar: 'الرفعة الميتة (Deadlift)', en: 'Deadlift' }, icon: 'weight-lifter', met: 6.5 }, { id: '113', name: { ar: 'ضغط أكتاف بالدمبل', en: 'Dumbbell Shoulder Press' }, icon: 'dumbbell', met: 4.5 }, { id: '114', name: { ar: 'تمارين بايسبس بالدمبل', en: 'Dumbbell Bicep Curls' }, icon: 'dumbbell', met: 4.0 }, { id: '115', name: { ar: 'تمارين ترايسبس', en: 'Triceps Extensions' }, icon: 'dumbbell', met: 4.0 }, { id: '201', name: { ar: 'جهاز المشي - سرعة 6 كم/س', en: 'Treadmill - 6 km/h' }, icon: 'run', met: 4.3 }, { id: '202', name: { ar: 'جهاز المشي - سرعة 10 كم/س', en: 'Treadmill - 10 km/h' }, icon: 'run-fast', met: 10.0 }, { id: '203', name: { ar: 'جهاز المشي (مع ميلان)', en: 'Treadmill (Incline)' }, icon: 'run-fast', met: 11.0 }, { id: '204', name: { ar: 'جهاز الإليبتيكال (خفيف)', en: 'Elliptical (Light)' }, icon: 'elliptical', met: 5.0 }, { id: '205', name: { ar: 'جهاز الإليبتيكال (متوسط)', en: 'Elliptical (Moderate)' }, icon: 'elliptical', met: 7.0 }, { id: '206', name: { ar: 'دراجة هوائية ثابتة (متوسط)', en: 'Stationary Bike (Moderate)' }, icon: 'bike-fast', met: 7.0 }, { id: '207', name: { ar: 'جهاز التجديف (متوسط)', en: 'Rowing Machine (Moderate)' }, icon: 'rowing', met: 7.0 }, { id: '301', name: { ar: 'زومبا', en: 'Zumba' }, icon: 'human-female-dance', met: 7.5 }, { id: '302', name: { ar: 'سبيننج', en: 'Spinning' }, icon: 'bike-fast', met: 8.5 }, { id: '303', name: { ar: 'بودي بمب', en: 'BodyPump' }, icon: 'kettlebell', met: 6.0 }, { id: '304', name: { ar: 'انسانيتي', en: 'Insanity' }, icon: 'fire', met: 12.0 }, { id: '401', name: { ar: 'سباحة (عام)', en: 'Swimming (General)' }, icon: 'swim', met: 8.0 }, { id: '402', name: { ar: 'يوجا', en: 'Yoga' }, icon: 'yoga', met: 2.5 }, { id: '403', name: { ar: 'بيلاتس', en: 'Pilates' }, icon: 'yoga', met: 3.0 }, { id: '404', name: { ar: 'قفز الحبل', en: 'Jump Rope' }, icon: 'jump-rope', met: 12.3 }, { id: '405', name: { ar: 'كرة قدم', en: 'Football (Soccer)' }, icon: 'soccer', met: 7.0 }, { id: '406', name: { ar: 'كرة سلة', en: 'Basketball' }, icon: 'basketball', met: 8.0 }, { id: '407', name: { ar: 'تنس', en: 'Tennis' }, icon: 'tennis', met: 7.3 }, { id: '408', name: { ar: 'تسلق الجبال', en: 'Hiking' }, icon: 'hiking', met: 6.0 }, { id: '409', name: { ar: 'ملاكمة', en: 'Boxing' }, icon: 'boxing-glove', met: 9.0 }, { id: '410', name: { ar: 'ركوب الخيل', en: 'Horseback Riding' }, icon: 'horse-human', met: 5.5 }, { id: '411', name: { ar: 'البولينج', en: 'Bowling' }, icon: 'bowling', met: 3.0 }, { id: '501', name: { ar: 'العمل المكتبي/الكتابة', en: 'Office Work/Typing' }, icon: 'desktop-mac-dashboard', met: 1.5 }, { id: '502', name: { ar: 'الوقوف', en: 'Standing' }, icon: 'human-male', met: 1.8 }, { id: '503', name: { ar: 'القيادة', en: 'Driving' }, icon: 'car-side', met: 2.0 }, { id: '504', name: { ar: 'حمل أغراض البقالة', en: 'Carrying Groceries' }, icon: 'cart-outline', met: 3.0 }, { id: '505', name: { ar: 'اللعب مع الحيوانات الأليفة', en: 'Playing with Pets' }, icon: 'dog', met: 3.0 }, { id: '506', name: { ar: 'قص العشب', en: 'Mowing Lawn' }, icon: 'grass', met: 5.0 }, { id: '507', name: { ar: 'تنظيف المنزل (عام)', en: 'House Cleaning (General)' }, icon: 'broom', met: 3.5 }, { id: '508', name: { ar: 'الطهي', en: 'Cooking' }, icon: 'chef-hat', met: 2.5 }, { id: '509', name: { ar: 'جرف الثلج', en: 'Shoveling Snow' }, icon: 'snowflake', met: 6.0 }, { id: '601', name: { ar: 'مشي', en: 'Walking' }, icon: 'walk', met: 3.5 }, { id: '602', name: { ar: 'ركض', en: 'Running' }, icon: 'run', met: 9.8 }, { id: '603', name: { ar: 'فنون قتالية (كاراتيه/جودو)', en: 'Martial Arts (Karate/Judo)' }, icon: 'karate', met: 10.3 }, { id: '605', name: { ar: 'تمارين الإطالة', en: 'Stretching' }, icon: 'stretching', met: 2.3 }, ];
const getExerciseName = (name, lang) => { if (typeof name === 'object' && name !== null) { return name[lang] || name['en']; } return name; };
const formatDateKeyForToday = () => new Date().toISOString().slice(0, 10);

function WorkoutLogScreen({ route, navigation }) {
    const [theme, setTheme] = useState(wlLightTheme);
    const [language, setLanguage] = useState('ar');
    const [isRTL, setIsRTL] = useState(true);
    const t = (key) => wlTranslations[language]?.[key] || wlTranslations['en'][key];
    const dateKey = route?.params?.dateKey || formatDateKeyForToday();
    const [exercises, setExercises] = useState([]);
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isDetailsModalVisible, setDetailsModalVisible] = useState(false);
    const [isCustomExerciseModalVisible, setCustomExerciseModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [duration, setDuration] = useState('');
    const [exerciseList, setExerciseList] = useState(WL_BASE_EXERCISES);
    const [customExerciseName, setCustomExerciseName] = useState('');
    const [customExerciseIntensity, setCustomExerciseIntensity] = useState('medium');
    const [isGFConnected, setIsGFConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // ✅ ===== دالة تحميل البيانات (معدلة) ===== ✅
    const loadCustomExercises = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { // إذا لم يكن هناك مستخدم، حمل من الذاكرة المحلية كخطة بديلة
                const customExercisesJson = await AsyncStorage.getItem('custom_exercises');
                const localCustom = customExercisesJson ? JSON.parse(customExercisesJson) : [];
                setExerciseList([...WL_BASE_EXERCISES, ...localCustom]);
                return;
            }

            const { data, error } = await supabase
                .from('custom_exercises')
                .select('*')
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            const formattedCustomExercises = data.map(item => ({
                id: `custom_${item.id}`,
                name: { en: item.name, ar: item.name },
                icon: item.icon,
                met: item.met_value,
                isCustom: true
            }));

            // دمج التمارين الأساسية مع التمارين المخصصة من السحابة
            setExerciseList([...WL_BASE_EXERCISES, ...formattedCustomExercises]);
            // تخزين نسخة محلية
            await AsyncStorage.setItem('custom_exercises', JSON.stringify(formattedCustomExercises));
        } catch (error) {
            console.error("Failed to load custom exercises from Supabase, falling back to local:", error);
            const customExercisesJson = await AsyncStorage.getItem('custom_exercises');
            const localCustom = customExercisesJson ? JSON.parse(customExercisesJson) : [];
            setExerciseList([...WL_BASE_EXERCISES, ...localCustom]);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            const loadScreenData = async () => {
                try {
                    const savedTheme = await AsyncStorage.getItem('isDarkMode');
                    setTheme(savedTheme === 'true' ? wlDarkTheme : wlLightTheme);
                    const savedLang = await AsyncStorage.getItem('appLanguage');
                    const currentLang = savedLang || 'ar';
                    setLanguage(currentLang);
                    setIsRTL(currentLang === 'ar');
                    const dayJson = await AsyncStorage.getItem(dateKey);
                    if (dayJson) {
                        const data = JSON.parse(dayJson);
                        setExercises(data.exercises || []);
                    } else {
                        setExercises([]);
                    }
                    const googleFitStatus = await AsyncStorage.getItem('isGoogleFitConnected') === 'true';
                    setIsGFConnected(googleFitStatus);
                    
                    // استدعاء دالة تحميل التمارين المخصصة
                    await loadCustomExercises();
                } catch (e) { console.error("Failed to load settings or data", e); }
            };
            loadScreenData();
        }, [dateKey])
    );
    
    // ... (باقي الدوال تبقى كما هي)
    const filteredExercises = exerciseList.filter(exercise => getExerciseName(exercise.name, language).toLowerCase().includes(searchQuery.toLowerCase()));
    const handleSelectExercise = (exercise) => { setSelectedExercise(exercise); setDetailsModalVisible(true); };
    const handleSaveWorkout = async () => {
        const durationMinutes = parseInt(duration, 10);
        if (!selectedExercise || isNaN(durationMinutes) || durationMinutes <= 0) {
            Alert.alert(t('errorTitle'), t('invalidDuration')); return;
        }
        const weightKg = 70; 
        const caloriesBurned = Math.round((selectedExercise.met * 3.5 * weightKg) / 200 * durationMinutes);
        const newWorkout = { exerciseId: selectedExercise.id, name: getExerciseName(selectedExercise.name, language), duration: durationMinutes, calories: caloriesBurned, icon: selectedExercise.icon, id: `logged_${Date.now()}` };
        try {
            const dayJson = await AsyncStorage.getItem(dateKey);
            let dayData = dayJson ? JSON.parse(dayJson) : {};
            const updatedExercises = [...(dayData.exercises || []), newWorkout];
            dayData.exercises = updatedExercises;
            await AsyncStorage.setItem(dateKey, JSON.stringify(dayData));
            
            // تحديث بيانات اليوم في Supabase أيضاً
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('daily_logs').upsert({ user_id: user.id, log_date: dateKey, log_data: dayData }, { onConflict: 'user_id, log_date' });
            }

            setExercises(updatedExercises);
            setDuration('');
            setSearchQuery('');
            setDetailsModalVisible(false);
            setAddModalVisible(false);
        } catch (error) {
            console.error("Error saving workout:", error);
            Alert.alert(t('errorTitle'), t('errorSavingWorkout'));
        }
    };
    
    // ✅ ===== دالة حفظ البيانات (معدلة بالكامل) ===== ✅
    const handleSaveCustomExercise = async () => {
        if (!customExerciseName.trim()) {
            Alert.alert(t('errorTitle'), t('missingName'));
            return;
        }
        const intensityToMet = { low: 3.0, medium: 6.0, high: 9.0 };
        const metValue = intensityToMet[customExerciseIntensity];

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated.");

            // 1. الحفظ في Supabase
            const { data, error } = await supabase
                .from('custom_exercises')
                .insert({
                    user_id: user.id,
                    name: customExerciseName.trim(),
                    met_value: metValue
                })
                .select()
                .single();

            if (error) throw error;
            
            // 2. تحديث الحالة في الواجهة فوراً
            const newCustomExerciseForUI = {
                id: `custom_${data.id}`, 
                name: { en: data.name, ar: data.name },
                icon: data.icon,
                met: data.met_value, 
                isCustom: true,
            };
            setExerciseList(prevList => [...prevList, newCustomExerciseForUI]);
            
            // 3. تحديث النسخة المحلية
            const existingCustom = await AsyncStorage.getItem('custom_exercises');
            const customExercises = existingCustom ? JSON.parse(existingCustom) : [];
            await AsyncStorage.setItem('custom_exercises', JSON.stringify([...customExercises, newCustomExerciseForUI]));

            setCustomExerciseModalVisible(false);
            setCustomExerciseName('');
            setCustomExerciseIntensity('medium');
            Alert.alert(t('successTitle'), t('customExerciseAdded'));
        } catch (error) {
            console.error("Error saving custom exercise:", error);
            Alert.alert(t('errorTitle'), t('errorSavingCustom'));
        }
    };

    // ... (باقي الكود يبقى كما هو)
    const handleSyncWithGoogleFit = async () => {
        if (!isGFConnected || !GoogleFit.isAuthorized) {
            Alert.alert("Not Connected", "Please connect to Google Fit from the settings screen first.");
            return;
        }
        setIsSyncing(true);
        const dayStart = new Date(dateKey); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateKey); dayEnd.setHours(23, 59, 59, 999);
        const options = { startDate: dayStart.toISOString(), endDate: dayEnd.toISOString() };

        try {
            const activitySamples = await GoogleFit.getActivitySamples(options);
            if (!activitySamples || activitySamples.length === 0) {
                Alert.alert(t('successTitle'), t('syncNoWorkouts'));
                setIsSyncing(false);
                return;
            }

            let newWorkoutsFromGF = [];
            const weightKg = 70; // وزن افتراضي لحساب السعرات

            activitySamples.forEach(sample => {
                if (!sample.activity || !sample.startDate || !sample.endDate) return;
                const durationMinutes = Math.round((new Date(sample.endDate) - new Date(sample.startDate)) / 60000);
                if(durationMinutes <= 0) return;

                // محاولة مطابقة التمرين مع القائمة الموجودة
                let matchedExercise = exerciseList.find(ex => getExerciseName(ex.name, 'en').toLowerCase().includes(sample.activity.toLowerCase()));
                if (!matchedExercise) {
                    matchedExercise = { name: { en: sample.activity, ar: sample.activity }, met: 5.0, icon: 'weight-lifter' }; // تمرين افتراضي
                }
                
                // حساب السعرات الحرارية
                const caloriesBurned = sample.calories || Math.round((matchedExercise.met * 3.5 * weightKg) / 200 * durationMinutes);
                
                newWorkoutsFromGF.push({
                    exerciseId: matchedExercise.id || `gf_${sample.activity}`,
                    name: getExerciseName(matchedExercise.name, language),
                    duration: durationMinutes,
                    calories: Math.round(caloriesBurned),
                    icon: matchedExercise.icon,
                    id: `glogged_${sample.startDate}` // ID فريد لتجنب التكرار
                });
            });
            
            const dayJson = await AsyncStorage.getItem(dateKey);
            let dayData = dayJson ? JSON.parse(dayJson) : { exercises: [] };
            const existingIds = new Set(dayData.exercises.map(ex => ex.id));
            const uniqueNewWorkouts = newWorkoutsFromGF.filter(ex => !existingIds.has(ex.id));

            if (uniqueNewWorkouts.length > 0) {
                const updatedExercises = [...dayData.exercises, ...uniqueNewWorkouts];
                dayData.exercises = updatedExercises;
                await AsyncStorage.setItem(dateKey, JSON.stringify(dayData));
                setExercises(updatedExercises);
                Alert.alert(t('successTitle'), t('syncSuccess').replace('{count}', uniqueNewWorkouts.length));
            } else {
                Alert.alert(t('successTitle'), t('syncUpToDate'));
            }

        } catch (error) {
            console.error("Error syncing with Google Fit:", error);
            Alert.alert(t('errorTitle'), t('syncError'));
        } finally {
            setIsSyncing(false);
        }
    };
    const totalCaloriesBurned = exercises.reduce((sum, ex) => sum + (ex.calories || 0), 0);
    const renderEmptyState = () => ( <View style={styles.emptyContainer(theme)}><MaterialCommunityIcons name="clipboard-text-off-outline" size={80} color={theme.disabled} /><Text style={styles.emptyTitle(theme)}>{t('emptyTitle')}</Text><Text style={styles.emptySubtitle(theme)}>{t('emptySubtitle')}</Text></View> );
    const ExerciseListItem = ({ item }) => { let originalExercise = exerciseList.find(ex => ex.id === item.exerciseId); const displayName = originalExercise ? getExerciseName(originalExercise.name, language) : getExerciseName(item.name, language); return ( <View style={styles.exerciseItemContainer(theme, isRTL)}><View style={styles.iconContainer(theme)}><MaterialCommunityIcons name={item.icon || 'weight-lifter'} size={28} color={theme.primary} /></View><View style={styles.exerciseDetails(isRTL)}><Text style={styles.exerciseName(theme)}>{displayName}</Text><Text style={styles.exerciseInfo(theme)}>{item.duration} {t('minutesUnit')} - {Math.round(item.calories)} {t('caloriesUnit')}</Text></View></View> ); };
    const ListHeader = () => ( <View style={styles.summaryContainer(theme)}><Text style={styles.summaryText(theme)}>🔥 {Math.round(totalCaloriesBurned)} {t('caloriesBurned')}</Text></View> );

    return (
        <SafeAreaView style={styles.rootContainer(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <FlatList data={exercises} keyExtractor={(item) => item.id} renderItem={({ item }) => <ExerciseListItem item={item} />} ListHeaderComponent={<ListHeader />} contentContainerStyle={styles.listContentContainer} ListEmptyComponent={renderEmptyState} extraData={language} />
            <TouchableOpacity style={styles.fab(theme, isRTL)} onPress={() => setAddModalVisible(true)}><Ionicons name="add" size={32} color={theme.white} /></TouchableOpacity>
            <Modal visible={isAddModalVisible} animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
                <SafeAreaView style={styles.modalRoot(theme)}>
                    <View style={styles.modalHeader(theme, isRTL)}><TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalCloseButton}><Ionicons name="close" size={30} color={theme.primary} /></TouchableOpacity><Text style={styles.modalHeaderTitle(theme, isRTL)}>{t('addExerciseTitle')}</Text>{isGFConnected && ( <TouchableOpacity onPress={handleSyncWithGoogleFit} disabled={isSyncing} style={{ padding: 5 }}>{isSyncing ? <ActivityIndicator color={theme.primary} /> : <MaterialCommunityIcons name="sync" size={28} color={theme.primary} />}</TouchableOpacity> )}</View>
                    <View style={styles.searchContainer(theme)}><TextInput style={styles.searchInput(theme, isRTL)} placeholder={t('searchPlaceholder')} placeholderTextColor={theme.textSecondary} value={searchQuery} onChangeText={setSearchQuery} /></View>
                    <FlatList data={filteredExercises} keyExtractor={(item) => item.id} renderItem={({ item }) => ( <TouchableOpacity style={styles.modalExerciseItem(theme, isRTL)} onPress={() => handleSelectExercise(item)}><Text style={styles.modalExerciseName(theme, isRTL)}>{getExerciseName(item.name, language)}</Text><View style={styles.modalItemIcons(isRTL)}>{item.isCustom && <MaterialCommunityIcons name="star-circle" size={20} color={theme.primary} style={{ [isRTL ? 'marginLeft' : 'marginRight']: 8 }}/>}<Ionicons name="add-circle-outline" size={28} color={theme.primary} /></View></TouchableOpacity> )} ListFooterComponent={ <TouchableOpacity style={styles.addCustomButton(theme, isRTL)} onPress={() => setCustomExerciseModalVisible(true)}><Ionicons name="add" size={24} color={theme.primary} /><Text style={styles.addCustomButtonText(theme)}>{t('addCustomButtonText')}</Text></TouchableOpacity> } ListEmptyComponent={() => (<View style={styles.emptyListContainer}><Text style={styles.emptyListText(theme)}>{t('noResults')}</Text></View>)} />
                </SafeAreaView>
            </Modal>
            <Modal visible={isDetailsModalVisible} transparent={true} animationType="fade" onRequestClose={() => setDetailsModalVisible(false)}>
                <View style={styles.detailsModalOverlay(theme)}><View style={styles.detailsModalView(theme)}><Text style={styles.detailsModalTitle(theme)}>{t('detailsTitle').replace('{exerciseName}', getExerciseName(selectedExercise?.name, language) || '')}</Text><TextInput style={styles.detailsModalInput(theme, isRTL)} placeholder={t('durationPlaceholder')} placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={duration} onChangeText={setDuration} autoFocus={true}/><View style={styles.detailsModalActions(isRTL)}><TouchableOpacity style={[styles.detailsModalButton, styles.cancelButton(theme)]} onPress={() => setDetailsModalVisible(false)}><Text style={styles.cancelButtonText(theme)}>{t('cancel')}</Text></TouchableOpacity><TouchableOpacity style={[styles.detailsModalButton, styles.saveButton(theme)]} onPress={handleSaveWorkout}><Text style={styles.saveButtonText(theme)}>{t('save')}</Text></TouchableOpacity></View></View></View>
            </Modal>
            <Modal visible={isCustomExerciseModalVisible} transparent={true} animationType="fade" onRequestClose={() => setCustomExerciseModalVisible(false)}>
                <View style={styles.detailsModalOverlay(theme)}><View style={styles.detailsModalView(theme)}><Text style={styles.detailsModalTitle(theme)}>{t('createCustomTitle')}</Text><TextInput style={styles.detailsModalInput(theme, isRTL)} placeholder={t('exerciseNamePlaceholder')} placeholderTextColor={theme.textSecondary} value={customExerciseName} onChangeText={setCustomExerciseName}/><Text style={styles.intensityLabel(theme)}>{t('intensityLabel')}</Text><View style={styles.intensityContainer(isRTL)}><TouchableOpacity style={[styles.intensityButton(theme), customExerciseIntensity === 'low' && styles.intensityButtonSelected(theme)]} onPress={() => setCustomExerciseIntensity('low')}><Text style={[styles.intensityButtonText(theme), customExerciseIntensity === 'low' && styles.intensityButtonTextSelected(theme)]}>{t('low')}</Text></TouchableOpacity><TouchableOpacity style={[styles.intensityButton(theme), customExerciseIntensity === 'medium' && styles.intensityButtonSelected(theme)]} onPress={() => setCustomExerciseIntensity('medium')}><Text style={[styles.intensityButtonText(theme), customExerciseIntensity === 'medium' && styles.intensityButtonTextSelected(theme)]}>{t('medium')}</Text></TouchableOpacity><TouchableOpacity style={[styles.intensityButton(theme), customExerciseIntensity === 'high' && styles.intensityButtonSelected(theme)]} onPress={() => setCustomExerciseIntensity('high')}><Text style={[styles.intensityButtonText(theme), customExerciseIntensity === 'high' && styles.intensityButtonTextSelected(theme)]}>{t('high')}</Text></TouchableOpacity></View><View style={styles.detailsModalActions(isRTL)}><TouchableOpacity style={[styles.detailsModalButton, styles.cancelButton(theme)]} onPress={() => setCustomExerciseModalVisible(false)}><Text style={styles.cancelButtonText(theme)}>{t('cancel')}</Text></TouchableOpacity><TouchableOpacity style={[styles.detailsModalButton, styles.saveButton(theme)]} onPress={handleSaveCustomExercise}><Text style={styles.saveButtonText(theme)}>{t('save')}</Text></TouchableOpacity></View></View></View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = {
    rootContainer: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    summaryContainer: (theme) => ({ backgroundColor: theme.card, padding: 20, alignItems: 'center', marginBottom: 10 }),
    summaryText: (theme) => ({ fontSize: 24, fontWeight: 'bold', color: theme.primary }),
    listContentContainer: { paddingBottom: 100 },
    exerciseItemContainer: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 15, padding: 15, marginBottom: 15, marginHorizontal: 20, }),
    iconContainer: (theme) => ({ width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.iconContainer }),
    exerciseDetails: (isRTL) => ({ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start', [isRTL ? 'marginRight' : 'marginLeft']: 15 }),
    exerciseName: (theme) => ({ fontSize: 18, fontWeight: '600', color: theme.textPrimary, textAlign: 'right' }),
    exerciseInfo: (theme) => ({ fontSize: 14, color: theme.textSecondary, marginTop: 4 }),
    fab: (theme, isRTL) => ({ position: 'absolute', bottom: 30, [isRTL ? 'left' : 'right']: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }),
    emptyContainer: (theme) => ({ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50, backgroundColor: theme.background, marginHorizontal: 20 }),
    emptyTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginTop: 15 }),
    emptySubtitle: (theme) => ({ fontSize: 16, color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 40, marginTop: 10 }),
    modalRoot: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    modalHeader: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', padding: 15, backgroundColor: theme.card }),
    modalCloseButton: { padding: 5 },
    modalHeaderTitle: (theme, isRTL) => ({ flex: 1, textAlign: isRTL ? 'right' : 'left', fontSize: 22, fontWeight: 'bold', color: theme.textPrimary, [isRTL ? 'marginRight' : 'marginLeft']: 10 }),
    searchContainer: (theme) => ({ padding: 15, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.disabled }),
    searchInput: (theme, isRTL) => ({ backgroundColor: theme.inputBackground, height: 50, borderRadius: 10, paddingHorizontal: 15, fontSize: 16, textAlign: isRTL ? 'right' : 'left', color: theme.textPrimary }),
    modalExerciseItem: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.card, padding: 20, borderBottomWidth: 1, borderBottomColor: theme.background }),
    modalExerciseName: (theme, isRTL) => ({ flex: 1, fontSize: 18, color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left', [isRTL ? 'marginRight' : 'marginLeft']: 5 }),
    modalItemIcons: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }),
    emptyListContainer: { paddingTop: 50, alignItems: 'center' },
    emptyListText: (theme) => ({ fontSize: 16, color: theme.textSecondary }),
    detailsModalOverlay: (theme) => ({ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.overlay }),
    detailsModalView: (theme) => ({ width: '85%', backgroundColor: theme.card, borderRadius: 20, padding: 25, alignItems: 'center' }),
    detailsModalTitle: (theme) => ({ fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: theme.textPrimary }),
    detailsModalInput: (theme, isRTL) => ({ width: '100%', backgroundColor: theme.inputBackground, color: theme.textPrimary, padding: 15, borderRadius: 10, textAlign: isRTL ? 'center' : 'left', fontSize: 18, marginBottom: 25 }),
    detailsModalActions: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', width: '100%' }),
    detailsModalButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
    saveButton: (theme) => ({ backgroundColor: theme.primary }),
    saveButtonText: (theme) => ({ color: theme.white, fontWeight: 'bold', fontSize: 16 }),
    cancelButton: (theme) => ({ backgroundColor: theme.cancelButton }),
    cancelButtonText: (theme) => ({ color: theme.cancelButtonText, fontWeight: 'bold', fontSize: 16 }),
    addCustomButton: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.background }),
    addCustomButtonText: (theme) => ({ color: theme.primary, fontSize: 16, fontWeight: 'bold', marginHorizontal: 8 }),
    intensityLabel: (theme) => ({ fontSize: 16, color: theme.textSecondary, marginBottom: 10, textAlign: 'center' }),
    intensityContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', width: '100%', marginBottom: 25 }),
    intensityButton: (theme) => ({ paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: theme.primary }),
    intensityButtonSelected: (theme) => ({ backgroundColor: theme.primary }),
    intensityButtonText: (theme) => ({ color: theme.primary, fontWeight: '600' }),
    intensityButtonTextSelected: (theme) => ({ color: theme.white }),
};

export default WorkoutLogScreen;
