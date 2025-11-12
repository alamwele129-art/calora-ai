// WaterScreen.js - الكود الكامل والمعدل
import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, TextInput, Dimensions, Alert, StatusBar
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';
import { supabase } from './supabaseclient'; // <-- استيراد Supabase

const screenWidth = Dimensions.get('window').width;
const lightTheme = { primary: '#388E3C', background: '#E8F5E9', card: '#FFFFFF', textPrimary: '#212121', textSecondary: '#757575', disabled: '#BDBDBD', water: '#007BFF', inputBorder: '#388E3C', inputBackground: '#FFFFFF', buttonText: '#FFFFFF', statusBar: 'dark-content', chartLine: (opacity = 1) => `rgba(56, 142, 60, ${opacity})`, chartLabel: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`, };
const darkTheme = { primary: '#66BB6A', background: '#121212', card: '#1E1E1E', textPrimary: '#FFFFFF', textSecondary: '#B0B0B0', disabled: '#424242', water: '#4FC3F7', inputBorder: '#66BB6A', inputBackground: '#2C2C2C', buttonText: '#FFFFFF', statusBar: 'light-content', chartLine: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`, chartLabel: (opacity = 1) => `rgba(224, 224, 224, ${opacity})`, };
const translations = { ar: { todaysWater: 'مياه اليوم', waterLog: 'سجل الماء', cupsUnit: 'أكواب', mlUnit: 'مل', settings: 'الإعدادات', dailyGoal: 'الهدف اليومي (أكواب)', cupSize: 'حجم الكوب (مل)', saveSettings: 'حفظ الإعدادات', historyTitle: 'سجل آخر 7 أيام', chartEmpty: 'لا يوجد سجل لعرضه. ابدأ بتسجيل شرب الماء.', inputErrorTitle: 'خطأ في الإدخال', goalError: 'الرجاء إدخال هدف يومي بين 1 و 50 كوبًا.', cupSizeError: 'الرجاء إدخال حجم كوب بين 50 و 2000 مل.', successTitle: 'نجاح', settingsSaved: 'تم حفظ الإعدادات بنجاخ.', errorTitle: 'خطأ', saveError: 'حدث خطأ أثناء حفظ الإعدادات.', limitReachedTitle: 'تم الوصول للحد الأقصى', limitReachedMessage: 'لا يمكن تسجيل أكثر من {MAX_CUPS_PER_DAY} كوبًا في اليوم.', cupSuffix: ' كوب', goalCompletedTitle: 'الهدف مكتمل!', goalCompletedMessage: 'لقد أكملت هدفك اليومي وهو {goal} {unit}.', viewingPastDay: 'أنت تعرض سجلاً ليوم سابق.', }, en: { todaysWater: "Today's Water", waterLog: 'Water Log', cupsUnit: 'cups', mlUnit: 'ml', settings: 'Settings', dailyGoal: 'Daily Goal (cups)', cupSize: 'Cup Size (ml)', saveSettings: 'Save Settings', historyTitle: 'Last 7 Days Log', chartEmpty: 'No log to display. Start tracking your water intake.', inputErrorTitle: 'Input Error', goalError: 'Please enter a daily goal between 1 and 50 cups.', cupSizeError: 'Please enter a cup size between 50 and 2000 ml.', successTitle: 'Success', settingsSaved: 'Settings saved successfully.', errorTitle: 'Error', saveError: 'An error occurred while saving settings.', limitReachedTitle: 'Limit Reached', limitReachedMessage: 'You cannot log more than {MAX_CUPS_PER_DAY} cups a day.', cupSuffix: ' cup', goalCompletedTitle: 'Goal Completed!', goalCompletedMessage: "You've completed your daily goal of {goal} {unit}.", viewingPastDay: 'You are viewing a log for a past day.', } };
const formatDateKey = (date) => { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; };

const WaterScreen = () => {
    const route = useRoute();
    const targetDateKey = useMemo(() => route.params?.dateKey || formatDateKey(new Date()), [route.params?.dateKey]);
    const isToday = useMemo(() => targetDateKey === formatDateKey(new Date()), [targetDateKey]);

    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('ar');
    const [isRTL, setIsRTL] = useState(true);
    const [waterGoal, setWaterGoal] = useState(8);
    const [cupSize, setCupSize] = useState(250);
    const [currentIntake, setCurrentIntake] = useState(0);
    const [history, setHistory] = useState([]);
    const [tempGoal, setTempGoal] = useState(waterGoal.toString());
    const [tempCupSize, setTempCupSize] = useState(cupSize.toString());

    const t = (key) => translations[language]?.[key] || key;
    
    // ✅ ===== دالة تحميل البيانات (معدلة) ===== ✅
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    // تحميل الإعدادات من الذاكرة المحلية (سريع ولا يحتاج سحابة حالياً)
                    const savedTheme = await AsyncStorage.getItem('isDarkMode');
                    setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
                    const savedLang = await AsyncStorage.getItem('appLanguage');
                    const currentLang = savedLang || 'ar';
                    setLanguage(currentLang);
                    setIsRTL(currentLang === 'ar');
                    const settingsJson = await AsyncStorage.getItem('waterSettings');
                    if (settingsJson) {
                        const settings = JSON.parse(settingsJson);
                        setWaterGoal(settings.goal || 8); setCupSize(settings.cupSize || 250);
                        setTempGoal((settings.goal || 8).toString()); setTempCupSize((settings.cupSize || 250).toString());
                    }

                    // جلب بيانات الماء للأيام السابقة من الذاكرة المحلية (التي تم تحديثها من mainui.js)
                    const dateParts = targetDateKey.split('-').map(Number);
                    const targetDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                    const historyData = [];
                    let intakeForTargetDay = 0;
                    for (let i = 6; i >= 0; i--) {
                        const date = new Date(targetDate);
                        date.setDate(targetDate.getDate() - i);
                        const dayKey = formatDateKey(date);
                        const dayJson = await AsyncStorage.getItem(dayKey); // الاعتماد على النسخة المحلية المحدثة
                        const dayData = dayJson ? JSON.parse(dayJson) : {};
                        const waterIntake = dayData.water || 0;
                        historyData.push({ date: date.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }), intake: waterIntake });
                        if (dayKey === targetDateKey) { intakeForTargetDay = waterIntake; }
                    }
                    setCurrentIntake(intakeForTargetDay);
                    setHistory(historyData);
                } catch (error) { console.error("Failed to load water data", error); }
            };
            loadData();
        }, [targetDateKey])
    );
    
    const handleSaveSettings = async () => {
        const newGoal = parseInt(tempGoal, 10);
        const newCupSize = parseInt(tempCupSize, 10);
        if (isNaN(newGoal) || newGoal < 1 || newGoal > 50) { Alert.alert(t('inputErrorTitle'), t('goalError')); return; }
        if (isNaN(newCupSize) || newCupSize < 50 || newCupSize > 2000) { Alert.alert(t('inputErrorTitle'), t('cupSizeError')); return; }
        if (currentIntake > newGoal) { setCurrentIntake(newGoal); }
        setWaterGoal(newGoal);
        setCupSize(newCupSize);
        try {
            await AsyncStorage.setItem('waterSettings', JSON.stringify({ goal: newGoal, cupSize: newCupSize }));
            Alert.alert(t('successTitle'), t('settingsSaved'));
        } catch (error) { console.error("Failed to save water settings", error); Alert.alert(t('errorTitle'), t('saveError')); }
    };

    // ✅ ===== دالة تحديث البيانات (معدلة بالكامل) ===== ✅
    const updateWaterIntake = async (change) => {
        if (!isToday) return;
        if (change > 0 && currentIntake >= waterGoal) { Alert.alert(t('goalCompletedTitle'), t('goalCompletedMessage').replace('{goal}', waterGoal).replace('{unit}', t('cupsUnit'))); return; }
        const MAX_CUPS_PER_DAY = 99;
        let newIntake = Math.max(0, currentIntake + change);
        if (newIntake > MAX_CUPS_PER_DAY) { Alert.alert(t('limitReachedTitle'), t('limitReachedMessage').replace('{MAX_CUPS_PER_DAY}', MAX_CUPS_PER_DAY)); newIntake = MAX_CUPS_PER_DAY; }
        
        setCurrentIntake(newIntake); // تحديث الواجهة فوراً
        const updatedHistory = [...history];
        if (updatedHistory.length > 0) { updatedHistory[updatedHistory.length - 1].intake = newIntake; setHistory(updatedHistory); }
        
        try {
            // جلب بيانات اليوم الحالية من الذاكرة المحلية
            const dayJson = await AsyncStorage.getItem(targetDateKey);
            let dayData = dayJson ? JSON.parse(dayJson) : {};
            dayData.water = newIntake; // تحديث قيمة الماء
            
            // 1. الحفظ في الذاكرة المحلية
            await AsyncStorage.setItem(targetDateKey, JSON.stringify(dayData));
            
            // 2. الحفظ في Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('daily_logs')
                    .upsert({ user_id: user.id, log_date: targetDateKey, log_data: dayData }, { onConflict: 'user_id, log_date' });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Failed to update water intake in Supabase:", error);
            // يمكنك هنا إظهار رسالة خطأ للمستخدم
        }
    };

    const chartData = { labels: history.map(item => item.date), datasets: [{ data: history.map(item => item.intake) }], };
    const displayDrops = Math.min(waterGoal, 12);

    return (
        <SafeAreaView style={styles.rootContainer(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card(theme)}>
                    {!isToday && ( <View style={styles.readOnlyBanner(theme)}><Ionicons name="information-circle-outline" size={20} color={theme.primary} style={{marginRight: 8}}/><Text style={styles.readOnlyText(theme)}>{t('viewingPastDay')}</Text></View> )}
                    <Text style={styles.sectionTitle(theme, isRTL)}>{isToday ? t('todaysWater') : t('waterLog')}</Text>
                    <Text style={styles.progressText(theme)}>{currentIntake} / {waterGoal} {t('cupsUnit')} ({currentIntake * cupSize} {t('mlUnit')})</Text>
                    <View style={styles.waterControlContainer(isRTL)}>
                        <TouchableOpacity style={styles.waterButton(theme, !isToday)} onPress={() => updateWaterIntake(1)} disabled={!isToday}><Ionicons name="add" size={32} color={!isToday ? theme.disabled : theme.water} /></TouchableOpacity>
                        <View style={styles.waterVisualizer(isRTL)}>{Array.from({ length: displayDrops }).map((_, index) => ( <Ionicons key={index} name={index < currentIntake ? 'water' : 'water-outline'} size={30} color={index < currentIntake ? theme.water : theme.disabled} style={styles.waterDrop} /> ))}</View>
                        <TouchableOpacity style={styles.waterButton(theme, !isToday)} onPress={() => updateWaterIntake(-1)} disabled={!isToday}><Ionicons name="remove" size={32} color={!isToday ? theme.disabled : theme.water} /></TouchableOpacity>
                    </View>
                </View>
                <View style={styles.card(theme)}>
                    <Text style={styles.sectionTitle(theme, isRTL)}>{t('settings')}</Text>
                    <View style={styles.settingRow(isRTL)}><Text style={styles.settingLabel(theme)}>{t('dailyGoal')}</Text><TextInput style={styles.settingInput(theme)} value={tempGoal} onChangeText={setTempGoal} keyboardType="number-pad" returnKeyType="done" maxLength={2} /></View>
                    <View style={styles.settingRow(isRTL)}><Text style={styles.settingLabel(theme)}>{t('cupSize')}</Text><TextInput style={styles.settingInput(theme)} value={tempCupSize} onChangeText={setTempCupSize} keyboardType="number-pad" returnKeyType="done" maxLength={4} /></View>
                    <TouchableOpacity style={styles.saveButton(theme)} onPress={handleSaveSettings}><Text style={styles.saveButtonText(theme)}>{t('saveSettings')}</Text></TouchableOpacity>
                </View>
                <View style={styles.card(theme)}>
                    <Text style={styles.sectionTitle(theme, isRTL)}>{t('historyTitle')}</Text>
                     {history.length > 0 && history.some(d => d.intake > 0) ? (
                        <BarChart data={chartData} width={screenWidth - 80} height={220} yAxisLabel="" yAxisSuffix={t('cupSuffix')} chartConfig={{ backgroundColor: theme.card, backgroundGradientFrom: theme.card, backgroundGradientTo: theme.card, decimalPlaces: 0, color: theme.chartLine, labelColor: theme.chartLabel, propsForBackgroundLines: { stroke: `${theme.disabled}80`, strokeDasharray: '' }, }} style={{ marginVertical: 8, borderRadius: 16 }} fromZero={true} showValuesOnTopOfBars={true} />
                    ) : ( <Text style={styles.emptyText(theme)}>{t('chartEmpty')}</Text> )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = {
    rootContainer: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    container: { padding: 20, paddingBottom: 50 },
    card: (theme) => ({ backgroundColor: theme.card, borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 }),
    sectionTitle: (theme, isRTL) => ({ fontSize: 22, fontWeight: 'bold', color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left', marginBottom: 15 }),
    progressText: (theme) => ({ fontSize: 18, color: theme.textSecondary, textAlign: 'center', marginBottom: 20, fontWeight: '600' }),
    waterControlContainer: (isRTL) => ({ flexDirection: isRTL ? 'row' : 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }),
    waterVisualizer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', justifyContent: 'center', flex: 1, marginHorizontal: 10 }),
    waterDrop: { margin: 2 },
    waterButton: (theme, disabled) => ({ padding: 10, borderRadius: 50, backgroundColor: disabled ? theme.disabled + '30' : theme.background, }),
    settingRow: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 }),
    settingLabel: (theme) => ({ fontSize: 16, color: theme.textPrimary, fontWeight: '500' }),
    settingInput: (theme) => ({ borderBottomWidth: 1.5, borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.textPrimary, width: 80, textAlign: 'center', fontSize: 18, paddingBottom: 5, fontWeight: 'bold' }),
    saveButton: (theme) => ({ marginTop: 10, paddingVertical: 15, borderRadius: 15, backgroundColor: theme.primary, alignItems: 'center' }),
    saveButtonText: (theme) => ({ color: theme.buttonText, fontSize: 16, fontWeight: 'bold' }),
    emptyText: (theme) => ({ textAlign: 'center', color: theme.textSecondary, marginTop: 20, fontSize: 16, lineHeight: 24, paddingHorizontal: 10 }),
    readOnlyBanner: (theme) => ({ backgroundColor: `${theme.primary}20`, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }),
    readOnlyText: (theme) => ({ color: theme.primary, fontWeight: 'bold', fontSize: 14 }),
};

export default WaterScreen;