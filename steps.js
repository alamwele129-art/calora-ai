// StepsScreen.js - الكود الكامل والمعدل
import React, { useState, useEffect, useCallback } from 'react';
import { 
    StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, 
    ActivityIndicator, Alert, Modal, TextInput, StatusBar 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import GoogleFit, { Scopes } from 'react-native-google-fit';

const STEP_LENGTH_KM = 0.000762;
const CALORIES_PER_STEP = 0.04;
const MAX_STEPS_GOAL = 100000;
const lightTheme = { primary: '#388E3C', primaryDark: '#1B5E20', background: '#E8F5E9',  card: '#FFFFFF',  textPrimary: '#212121',  textSecondary: '#757575', progressUnfilled: '#D6EAD7', inputBackground: '#F5F5F5',  overlay: 'rgba(0,0,0,0.5)', accentOrange: '#FF7043', accentBlue: '#007BFF', white: '#FFFFFF', statusBar: 'dark-content', };
const darkTheme = { primary: '#66BB6A', primaryDark: '#81C784', background: '#121212',  card: '#1E1E1E',  textPrimary: '#FFFFFF',  textSecondary: '#B0B0B0', progressUnfilled: '#2C2C2C', inputBackground: '#2C2C2C',  overlay: 'rgba(0,0,0,0.7)', accentOrange: '#FF8A65', accentBlue: '#42A5F5', white: '#FFFFFF', statusBar: 'light-content', };
const translations = { ar: { todaySteps: 'خطوات اليوم', kmUnit: ' كم', calUnit: ' سعرة', last7Days: 'آخر 7 أيام', last30Days: 'آخر 30 يوم', periodSummary: 'ملخص {period}', week: 'الأسبوع', month: 'الشهر', noData: 'لا توجد بيانات لعرضها.', periodStats: 'إحصائيات {period}', avgSteps: 'متوسط الخطوات اليومي:', totalSteps: 'إجمالي خطوات {period}:', bestDay: 'أفضل يوم في {period}:', changeGoalTitle: 'تغيير الهدف اليومي', changeGoalMsg: 'أدخل هدفك الجديد للخطوات:', goalPlaceholder: 'مثال: 8000', cancel: 'إلغاء', save: 'حفظ', goalTooLargeTitle: 'الهدف كبير جدًا', goalTooLargeMsg: 'الرجاء إدخال رقم أقل من {maxSteps}.', errorTitle: 'خطأ', invalidNumber: 'الرجاء إدخال رقم صحيح.', notAvailableTitle: 'غير متوفر', notAvailableMsg: 'مستشعر عداد الخطوات غير متوفر.', permissionDeniedTitle: 'صلاحية مرفوضة', permissionDeniedMsg: 'يرجى تمكين صلاحية الوصول إلى بيانات الحركة.', weekdays: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] }, en: { todaySteps: "Today's Steps", kmUnit: ' km', calUnit: ' kcal', last7Days: 'Last 7 Days', last30Days: 'Last 30 Days', periodSummary: '{period} Summary', week: 'Week', month: 'Month', noData: 'No data to display.', periodStats: '{period} Statistics', avgSteps: 'Daily Average:', totalSteps: 'Total {period} Steps:', bestDay: 'Best Day in {period}:', changeGoalTitle: 'Change Daily Goal', changeGoalMsg: 'Enter your new step goal:', goalPlaceholder: 'e.g., 8000', cancel: 'Cancel', save: 'Save', goalTooLargeTitle: 'Goal Too Large', goalTooLargeMsg: 'Please enter a number less than {maxSteps}.', errorTitle: 'Error', invalidNumber: 'Please enter a valid number.', notAvailableTitle: 'Not Available', notAvailableMsg: 'Pedometer sensor is not available on this device.', permissionDeniedTitle: 'Permission Denied', permissionDeniedMsg: 'Please enable motion activity permissions.', weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'] } };
const describeArc = (x, y, radius, startAngle, endAngle) => { const clampedEndAngle = Math.min(endAngle, 359.999); const start = { x: x + radius * Math.cos((startAngle - 90) * Math.PI / 180.0), y: y + radius * Math.sin((startAngle - 90) * Math.PI / 180.0) }; const end = { x: x + radius * Math.cos((clampedEndAngle - 90) * Math.PI / 180.0), y: y + radius * Math.sin((clampedEndAngle - 90) * Math.PI / 180.0) }; const largeArcFlag = clampedEndAngle - startAngle <= 180 ? '0' : '1'; const d = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y].join(' '); return d; };
const AnimatedPath = Animated.createAnimatedComponent(Path);

const AnimatedStepsCircle = ({ progress, size, strokeWidth, currentStepCount, theme }) => {
    const INDICATOR_SIZE = strokeWidth * 1.5; const RADIUS = size / 2; const CENTER_RADIUS = RADIUS - strokeWidth / 2; const animatedProgress = useSharedValue(0); useEffect(() => { animatedProgress.value = withTiming(progress, { duration: 800 }); }, [progress]); const animatedPathProps = useAnimatedProps(() => { const angle = animatedProgress.value * 360; if (angle < 0.1) return { d: '' }; return { d: describeArc(size / 2, size / 2, CENTER_RADIUS, 0, angle) }; }); const indicatorAnimatedStyle = useAnimatedStyle(() => { const angleRad = (animatedProgress.value * 360 - 90) * (Math.PI / 180); const x = (size / 2) + CENTER_RADIUS * Math.cos(angleRad); const y = (size / 2) + CENTER_RADIUS * Math.sin(angleRad); return { transform: [{ translateX: x }, { translateY: y }], opacity: 1 }; });
    return ( <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}><Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><Circle cx={size / 2} cy={size / 2} r={CENTER_RADIUS} stroke={theme.progressUnfilled} strokeWidth={strokeWidth} fill="transparent" /><AnimatedPath animatedProps={animatedPathProps} stroke={theme.primary} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" /></Svg><Animated.View style={[ styles.progressIndicatorDot(theme), { width: INDICATOR_SIZE, height: INDICATOR_SIZE, borderRadius: INDICATOR_SIZE / 2, marginLeft: -(INDICATOR_SIZE / 2), marginTop: -(INDICATOR_SIZE / 2) }, indicatorAnimatedStyle ]} /><View style={styles.summaryTextContainer}><Text style={styles.progressCircleText(theme)}>{currentStepCount.toLocaleString()}</Text></View></View> );
};

const GoalPromptModal = ({ visible, onClose, onSubmit, theme, t }) => {
    const [inputValue, setInputValue] = useState(''); const handleSubmit = () => { onSubmit(inputValue); setInputValue(''); onClose(); };
    return ( <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}><TouchableOpacity style={styles.modalOverlay(theme)} activeOpacity={1} onPress={onClose}><TouchableOpacity activeOpacity={1} style={styles.promptContainer(theme)}><Text style={styles.promptTitle(theme)}>{t('changeGoalTitle')}</Text><Text style={styles.promptMessage(theme)}>{t('changeGoalMsg')}</Text><TextInput style={styles.promptInput(theme)} keyboardType="numeric" placeholder={t('goalPlaceholder')} placeholderTextColor={theme.textSecondary} value={inputValue} onChangeText={setInputValue} autoFocus={true} /><View style={styles.promptButtons}><TouchableOpacity style={styles.promptButton} onPress={onClose}><Text style={styles.promptButtonText(theme)}>{t('cancel')}</Text></TouchableOpacity><TouchableOpacity style={[styles.promptButton, styles.promptButtonPrimary(theme)]} onPress={handleSubmit}><Text style={[styles.promptButtonText(theme), styles.promptButtonTextPrimary]}>{t('save')}</Text></TouchableOpacity></View></TouchableOpacity></TouchableOpacity></Modal> );
};

const StepsScreen = () => {
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('ar');
    const [isRTL, setIsRTL] = useState(true);
    const [currentStepCount, setCurrentStepCount] = useState(0);
    const [stepsGoal, setStepsGoal] = useState(10000);
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPromptVisible, setPromptVisible] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('week');

    const t = (key) => translations[language]?.[key] || translations['en'][key];
    const periodLabel = selectedPeriod === 'week' ? t('week') : t('month');

    // ✅ ===== دالة تحميل البيانات (معدلة بالكامل) ===== ✅
    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const fetchData = async () => {
                setLoading(true);
                try {
                    // تحميل الإعدادات
                    const savedTheme = await AsyncStorage.getItem('isDarkMode');
                    if (isMounted) setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
                    const savedLang = await AsyncStorage.getItem('appLanguage');
                    const currentLang = savedLang || 'ar';
                    if (isMounted) { setLanguage(currentLang); setIsRTL(currentLang === 'ar'); }
                    const savedGoal = await AsyncStorage.getItem('stepsGoal');
                    if (isMounted && savedGoal) setStepsGoal(parseInt(savedGoal, 10));

                    // التحقق من حالة الاتصال بـ Google Fit
                    const isGoogleFitConnected = await AsyncStorage.getItem('isGoogleFitConnected') === 'true';

                    let todaySteps = 0;
                    let historicalSteps = [];
                    const todayEnd = new Date();
                    const days = selectedPeriod === 'week' ? 7 : 30;

                    if (isGoogleFitConnected) {
                        // --- جلب البيانات من Google Fit ---
                        try {
                            const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                            const res = await GoogleFit.getDailyStepCountSamples({ startDate: todayStart.toISOString(), endDate: todayEnd.toISOString() });
                            const estimatedSteps = res.find(r => r.source === 'com.google.android.gms:estimated_steps');
                            if (estimatedSteps && estimatedSteps.steps.length > 0) {
                                todaySteps = estimatedSteps.steps.reduce((sum, s) => sum + s.value, 0);
                            }
                            // جلب البيانات التاريخية
                            const historyStart = new Date(); historyStart.setDate(todayEnd.getDate() - (days - 1)); historyStart.setHours(0,0,0,0);
                            const histRes = await GoogleFit.getDailyStepCountSamples({ startDate: historyStart.toISOString(), endDate: todayEnd.toISOString() });
                            const dailySteps = {};
                            if (histRes.length > 0) {
                                histRes[0].steps.forEach(stepSample => {
                                    const date = stepSample.date.split('T')[0];
                                    if(!dailySteps[date]) dailySteps[date] = 0;
                                    dailySteps[date] += stepSample.value;
                                });
                            }
                             for (let i = 0; i < days; i++) {
                                const date = new Date();
                                date.setDate(todayEnd.getDate() - i);
                                const dateString = date.toISOString().split('T')[0];
                                historicalSteps.push({ day: date.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }), steps: dailySteps[dateString] || 0 });
                            }
                        } catch (e) {
                            console.error("Failed to fetch from Google Fit, falling back to Pedometer", e);
                            // خطة بديلة: استخدم Pedometer
                            await fetchFromPedometer();
                        }

                    } else {
                        // --- جلب البيانات من Pedometer (حساس الهاتف) ---
                        await fetchFromPedometer();
                    }

                    if (isMounted) {
                        setCurrentStepCount(todaySteps);
                        setHistoricalData(historicalSteps.reverse());
                    }

                } catch (error) {
                    console.error("Error fetching step data:", error);
                    if (isMounted) { setCurrentStepCount(0); setHistoricalData([]); }
                } finally {
                    if (isMounted) setLoading(false);
                }
            };
            
            const fetchFromPedometer = async () => {
                const isAvailable = await Pedometer.isAvailableAsync();
                if (!isAvailable) { throw new Error("Pedometer not available"); }
                const { status } = await Pedometer.requestPermissionsAsync();
                if (status !== 'granted') { throw new Error("Pedometer permission denied"); }

                const end = new Date();
                const start = new Date(); start.setHours(0, 0, 0, 0);
                const result = await Pedometer.getStepCountAsync(start, end);
                setCurrentStepCount(result ? result.steps : 0);
                
                // جلب البيانات التاريخية من Pedometer
                let histSteps = [];
                const days = selectedPeriod === 'week' ? 7 : 30;
                for (let i = 0; i < days; i++) {
                    const dayEnd = new Date();
                    dayEnd.setDate(dayEnd.getDate() - i);
                    dayEnd.setHours(23, 59, 59, 999);
                    const dayStart = new Date(dayEnd);
                    dayStart.setHours(0, 0, 0, 0);
                    try {
                        const dayResult = await Pedometer.getStepCountAsync(dayStart, dayEnd);
                        histSteps.push({ day: dayStart.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }), steps: dayResult ? dayResult.steps : 0 });
                    } catch (e) {
                         histSteps.push({ day: dayStart.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }), steps: 0 });
                    }
                }
                setHistoricalData(histSteps.reverse());
            };


            fetchData();
            return () => { isMounted = false; };
        }, [selectedPeriod])
    );
    
    const handleSaveGoalFromPrompt = (text) => {
        const newGoal = parseInt(text, 10);
        if (!isNaN(newGoal) && newGoal > 0 && newGoal <= MAX_STEPS_GOAL) {
            AsyncStorage.setItem('stepsGoal', newGoal.toString());
            setStepsGoal(newGoal);
        } else if (newGoal > MAX_STEPS_GOAL) {
            Alert.alert(t('goalTooLargeTitle'), t('goalTooLargeMsg').replace('{maxSteps}', MAX_STEPS_GOAL.toLocaleString()));
        } else if (text) {
            Alert.alert(t('errorTitle'), t('invalidNumber'));
        }
        setPromptVisible(false);
    };

    const distance = (currentStepCount * STEP_LENGTH_KM).toFixed(2);
    const calories = Math.round(currentStepCount * CALORIES_PER_STEP);
    const totalPeriodSteps = historicalData.reduce((sum, day) => sum + day.steps, 0);
    const averagePeriodSteps = historicalData.length > 0 ? Math.round(totalPeriodSteps / historicalData.length) : 0;
    const bestDayInPeriod = historicalData.length > 0 ? Math.max(...historicalData.map(day => day.steps)) : 0;
    const maxChartSteps = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.steps), 1) : 1;

    return (
        <SafeAreaView style={styles.modalPage(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <GoalPromptModal visible={isPromptVisible} onClose={() => setPromptVisible(false)} onSubmit={handleSaveGoalFromPrompt} theme={theme} t={t} />
            <ScrollView contentContainerStyle={styles.modalPageContent}>
                <View style={[styles.card(theme), styles.todaySummaryCard]}>
                    <Text style={styles.todaySummaryLabel(theme)}>{t('todaySteps')}</Text>
                    {loading ? <ActivityIndicator size="large" color={theme.primary} style={{height: 180}} /> :
                    <AnimatedStepsCircle size={180} strokeWidth={15} currentStepCount={currentStepCount} progress={stepsGoal > 0 ? currentStepCount / stepsGoal : 0} theme={theme} />
                    }
                     <View style={styles.subStatsContainer(isRTL)}>
                        <View style={styles.subStatBox}><MaterialCommunityIcons name="map-marker-distance" size={24} color={theme.primary} /><Text style={styles.subStatText(theme)}>{distance}{t('kmUnit')}</Text></View>
                        <View style={styles.subStatBox}><MaterialCommunityIcons name="fire" size={24} color={theme.accentOrange} /><Text style={styles.subStatText(theme)}>{calories}{t('calUnit')}</Text></View>
                        <TouchableOpacity style={styles.subStatBox} onPress={() => setPromptVisible(true)}>
                            <MaterialCommunityIcons name="flag-checkered" size={24} color={theme.accentBlue} />
                            <Text style={styles.subStatText(theme)}>{stepsGoal.toLocaleString()}</Text>
                        </TouchableOpacity>
                     </View>
                </View>
                <View style={styles.card(theme)}>
                    <View style={styles.periodToggleContainer(theme, isRTL)}>
                        <TouchableOpacity style={[styles.periodToggleButton, selectedPeriod === 'week' && styles.activePeriodButton(theme)]} onPress={() => setSelectedPeriod('week')}><Text style={[styles.periodButtonText(theme), selectedPeriod === 'week' && styles.activePeriodText(theme)]}>{t('last7Days')}</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.periodToggleButton, selectedPeriod === 'month' && styles.activePeriodButton(theme)]} onPress={() => setSelectedPeriod('month')}><Text style={[styles.periodButtonText(theme), selectedPeriod === 'month' && styles.activePeriodText(theme)]}>{t('last30Days')}</Text></TouchableOpacity>
                    </View>
                    <Text style={styles.sectionTitle(theme, isRTL)}>{t('periodSummary').replace('{period}', periodLabel)}</Text>
                    {loading ? <ActivityIndicator color={theme.primary}/> : historicalData.length > 0 ? <View style={styles.chartContainer(isRTL)}>{historicalData.map((day, index) => ( <View key={index} style={styles.barWrapper}><View style={[styles.bar(theme), {height: `${(day.steps / maxChartSteps) * 100}%`}]} /><Text style={styles.barLabel(theme)}>{day.day}</Text></View> ))}</View> : <Text style={styles.emptyLogText(theme)}>{t('noData')}</Text>}
                </View>
                <View style={styles.card(theme)}>
                    <Text style={styles.sectionTitle(theme, isRTL)}>{t('periodStats').replace('{period}', periodLabel)}</Text>
                    {loading ? <ActivityIndicator color={theme.primary}/> : <>
                        <View style={styles.statsRow(theme, isRTL)}><Text style={styles.statLabel(theme)}>{t('avgSteps')}</Text><Text style={styles.statValue(theme)}>{averagePeriodSteps.toLocaleString()}</Text></View>
                        <View style={styles.statsRow(theme, isRTL)}><Text style={styles.statLabel(theme)}>{t('totalSteps').replace('{period}', periodLabel)}</Text><Text style={styles.statValue(theme)}>{totalPeriodSteps.toLocaleString()}</Text></View>
                        <View style={styles.statsRow(theme, isRTL)}><Text style={styles.statLabel(theme)}>{t('bestDay').replace('{period}', periodLabel)}</Text><Text style={styles.statValue(theme)}>{bestDayInPeriod.toLocaleString()}</Text></View>
                    </>}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = {
    modalPage: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    modalPageContent: { padding: 20 },
    card: (theme) => ({ backgroundColor: theme.card, borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }),
    sectionTitle: (theme, isRTL) => ({ fontSize: 22, fontWeight: 'bold', color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left', marginBottom: 4, marginTop: 15 }),
    emptyLogText: (theme) => ({ textAlign: 'center', marginTop: 20, marginBottom: 10, fontSize: 16, color: theme.textSecondary }),
    todaySummaryCard: { alignItems: 'center', paddingVertical: 30 },
    todaySummaryLabel: (theme) => ({ fontSize: 16, color: theme.textSecondary, marginBottom: 20 }),
    progressCircleText: (theme) => ({ fontSize: 42, fontWeight: 'bold', color: theme.textPrimary }),
    summaryTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    subStatsContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', width: '100%', marginTop: 25 }),
    subStatBox: { alignItems: 'center', padding: 10 },
    subStatText: (theme) => ({ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginTop: 5 }),
    chartContainer: (isRTL) => ({ flexDirection: isRTL ? 'row' : 'row-reverse', justifyContent: 'space-around', alignItems: 'flex-end', height: 150, marginTop: 20 }),
    barWrapper: { flex: 1, alignItems: 'center', marginHorizontal: 2 },
    bar: (theme) => ({ width: '80%', backgroundColor: theme.primary, borderRadius: 5 }),
    barLabel: (theme) => ({ marginTop: 5, fontSize: 10, color: theme.textSecondary }),
    statsRow: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.background }),
    statLabel: (theme) => ({ fontSize: 16, color: theme.textSecondary }),
    statValue: (theme) => ({ fontSize: 16, fontWeight: 'bold', color: theme.textPrimary }),
    modalOverlay: (theme) => ({ flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', alignItems: 'center' }),
    promptContainer: (theme) => ({ width: '85%', backgroundColor: theme.card, borderRadius: 15, padding: 20, elevation: 10 }),
    promptTitle: (theme) => ({ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: theme.textPrimary }),
    promptMessage: (theme) => ({ fontSize: 14, textAlign: 'center', color: theme.textSecondary, marginTop: 8, marginBottom: 15 }),
    promptInput: (theme) => ({ borderWidth: 1, borderColor: theme.progressUnfilled, backgroundColor: theme.inputBackground, color: theme.textPrimary, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, textAlign: 'center', fontSize: 18, marginBottom: 20 }),
    promptButtons: { flexDirection: 'row', justifyContent: 'space-around' },
    promptButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
    promptButtonPrimary: (theme) => ({ backgroundColor: theme.primary }),
    promptButtonText: (theme) => ({ fontSize: 16, color: theme.primary, fontWeight: '600' }),
    promptButtonTextPrimary: { color: 'white' },
    progressIndicatorDot: (theme) => ({ position: 'absolute', top: 0, left: 0, backgroundColor: theme.primaryDark, borderWidth: 3, borderColor: theme.card, elevation: 5 }),
    periodToggleContainer: (theme, isRTL) => ({ flexDirection: isRTL ? 'row' : 'row-reverse', backgroundColor: theme.background, borderRadius: 10, padding: 4, marginBottom: 10 }),
    periodToggleButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    activePeriodButton: (theme) => ({ backgroundColor: theme.card, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }),
    periodButtonText: (theme) => ({ fontSize: 16, fontWeight: '600', color: theme.textSecondary }),
    activePeriodText: (theme) => ({ color: theme.primary }),
};

export default StepsScreen;