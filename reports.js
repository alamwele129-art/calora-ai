// reports.js - الكود الكامل والمعدل
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const lightTheme = { primary: '#388E3C', background: '#E8F5E9', card: '#FFFFFF', textPrimary: '#212121', textSecondary: '#757575', tooltipBg: '#212121', tooltipText: '#FFFFFF', buttonText: '#FFFFFF', statusBar: 'dark-content', chartColor: (opacity = 1) => `rgba(56, 142, 60, ${opacity})`, chartLabelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`, };
const darkTheme = { primary: '#66BB6A', background: '#121212', card: '#1E1E1E', textPrimary: '#FFFFFF', textSecondary: '#B0B0B0', tooltipBg: '#E0E0E0', tooltipText: '#121212', buttonText: '#FFFFFF', statusBar: 'light-content', chartColor: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`, chartLabelColor: (opacity = 1) => `rgba(224, 224, 224, ${opacity})`, };
const translations = { en: { title: 'Reports', filter7Days: '7 Days', filter30Days: '30 Days', filter3Months: '3 Months', weightCardTitle: 'Weight Progress', weightEmptyText: 'Add at least two weights to see the chart.', nutritionCardTitle: 'Daily Nutrition Average', nutritionEmptyText: 'Not enough nutrition data available.', activityCardTitle: 'Activity Summary', workoutDays: 'Workout Days', caloriesBurned: 'Calories Burned', noData: 'Not enough data to display reports.', caloriesPerDay: 'calories / day', protein: 'Protein', carbs: 'Carbohydrates', fat: 'Fat', weightUnit: 'kg', }, ar: { title: 'التقارير', filter7Days: '7 أيام', filter30Days: '30 يوم', filter3Months: '3 شهور', weightCardTitle: 'تطور الوزن', weightEmptyText: 'أضف وزنين على الأقل لرؤية الرسم البياني.', nutritionCardTitle: 'متوسط التغذية اليومي', nutritionEmptyText: 'لا توجد بيانات كافية عن المغذيات.', activityCardTitle: 'ملخص النشاط', workoutDays: 'يوم تمرين', caloriesBurned: 'سعر حراري محروق', noData: 'لا توجد بيانات كافية لعرض التقارير.', caloriesPerDay: 'سعر حراري / يوم', protein: 'بروتين', carbs: 'كربوهيدرات', fat: 'دهون', weightUnit: 'كج', }, };


const Card = ({ title, children, theme, isRTL }) => (
    <View style={styles.card(theme)}>
        <Text style={styles.cardTitle(theme, isRTL)}>{title}</Text>
        {children}
    </View>
);

const ReportsScreen = ({ appLanguage }) => {
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState(appLanguage || 'ar');
    const [isRTL, setIsRTL] = useState((appLanguage || 'ar') === 'ar');
    const [period, setPeriod] = useState('week');
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [selectedWeightPoint, setSelectedWeightPoint] = useState(null);
    const [chartKey, setChartKey] = useState(0);

    const t = (key) => translations[language]?.[key] || translations['en'][key];

    useEffect(() => {
        if (appLanguage) {
            setLanguage(appLanguage);
            setIsRTL(appLanguage === 'ar');
        }
    }, [appLanguage]);
    
    // ✅ ===== دالة تحميل البيانات (معدلة) ===== ✅
    const loadData = useCallback(async () => {
        setLoading(true);
        setSelectedWeightPoint(null);
        setChartKey(prevKey => prevKey + 1);

        try {
            const savedTheme = await AsyncStorage.getItem('isDarkMode');
            const currentTheme = savedTheme === 'true' ? darkTheme : lightTheme;
            setTheme(currentTheme);
            
            const endDate = new Date();
            const startDate = new Date();
            if (period === 'week') startDate.setDate(endDate.getDate() - 6);
            else if (period === 'month') startDate.setMonth(endDate.getMonth() - 1);
            else if (period === '3months') startDate.setMonth(endDate.getMonth() - 3);
            startDate.setHours(0,0,0,0);

            // قراءة البيانات من AsyncStorage التي تم تحديثها من الشاشات الأخرى
            const weightHistoryJson = await AsyncStorage.getItem('weightHistory'); 
            const allWeightHistory = weightHistoryJson ? JSON.parse(weightHistoryJson) : [];
            const weightDataForPeriod = allWeightHistory
                .filter(entry => new Date(entry.date) >= startDate && new Date(entry.date) <= endDate)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
            let daysWithNutritionData = 0, totalWorkoutDays = 0, totalCaloriesBurned = 0;
            
            const dateKeysToFetch = [];
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) { 
                dateKeysToFetch.push(d.toISOString().slice(0, 10)); 
            }
            
            const dailyLogs = await AsyncStorage.multiGet(dateKeysToFetch);
            dailyLogs.forEach(([key, value]) => {
                if (value) {
                    const dayData = JSON.parse(value);
                    const allFoodItems = [...(dayData.breakfast || []), ...(dayData.lunch || []), ...(dayData.dinner || []), ...(dayData.snacks || [])];
                    if (allFoodItems.length > 0) {
                        daysWithNutritionData++;
                        allFoodItems.forEach(item => { totalCalories += item.calories || 0; totalProtein += item.p || 0; totalCarbs += item.c || 0; totalFat += item.f || 0; });
                    }
                    if (dayData.exercises && dayData.exercises.length > 0) {
                        totalWorkoutDays++;
                        dayData.exercises.forEach(ex => { totalCaloriesBurned += ex.calories || 0; });
                    }
                }
            });

            const avgProtein = daysWithNutritionData > 0 ? Math.round(totalProtein / daysWithNutritionData) : 0;
            const avgCarbs = daysWithNutritionData > 0 ? Math.round(totalCarbs / daysWithNutritionData) : 0;
            const avgFat = daysWithNutritionData > 0 ? Math.round(totalFat / daysWithNutritionData) : 0;
            
            const currentTranslations = translations[language];

            setReportData({
                weight: { 
                    labels: weightDataForPeriod.map(e => new Date(e.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })), 
                    data: weightDataForPeriod.map(e => e.weight), 
                },
                nutrition: { 
                    avgCalories: daysWithNutritionData > 0 ? Math.round(totalCalories / daysWithNutritionData) : 0, 
                    macros: [ 
                        { name: currentTranslations.protein, population: avgProtein || 1, color: '#FF7043', legendFontColor: currentTheme.textSecondary, legendFontSize: 14 }, 
                        { name: currentTranslations.carbs, population: avgCarbs || 1, color: '#007BFF', legendFontColor: currentTheme.textSecondary, legendFontSize: 14 }, 
                        { name: currentTranslations.fat, population: avgFat || 1, color: '#FFC107', legendFontColor: currentTheme.textSecondary, legendFontSize: 14 }, 
                    ] 
                },
                activity: { workoutDays: totalWorkoutDays, totalCaloriesBurned: Math.round(totalCaloriesBurned) }
            });
        } catch (error) { 
            console.error("Error fetching report data:", error); 
        } finally { 
            setLoading(false); 
        }
    }, [period, language]);

    // ✅ استخدام useFocusEffect لضمان تحديث البيانات عند العودة للشاشة
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData]) 
    );
    
    const handleWeightPointClick = (data) => {
        if (selectedWeightPoint && selectedWeightPoint.index === data.index) { setSelectedWeightPoint(null); } else { setSelectedWeightPoint(data); }
    };
    
    const lineChartConfig = { backgroundGradientFrom: theme.card, backgroundGradientTo: theme.card, color: theme.chartColor, labelColor: theme.chartLabelColor, strokeWidth: 2, decimalPlaces: 1, propsForDots: { r: "5", strokeWidth: "2", stroke: theme.background } };
    const pieChartConfig = { backgroundGradientFrom: theme.card, backgroundGradientTo: theme.card, color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, labelColor: theme.chartLabelColor, };

    if (loading) { return <SafeAreaView style={styles.centered(theme)}><ActivityIndicator size="large" color={theme.primary} /></SafeAreaView>; }
    if (!reportData) { return <SafeAreaView style={styles.centered(theme)}><Text style={{color: theme.textPrimary}}>{t('noData')}</Text></SafeAreaView>; }

    return (
        <SafeAreaView style={styles.rootContainer(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.headerTitle(theme, isRTL)}>{t('title')}</Text>
                <View style={styles.filterContainer(isRTL, theme)}>
                    <TouchableOpacity onPress={() => setPeriod('week')} style={[styles.filterButton(theme), period === 'week' && styles.activeFilter(theme)]}><Text style={[styles.filterText(theme), period === 'week' && styles.activeFilterText(theme)]}>{t('filter7Days')}</Text></TouchableOpacity>
                    <View style={styles.separator(theme)} />
                    <TouchableOpacity onPress={() => setPeriod('month')} style={[styles.filterButton(theme), period === 'month' && styles.activeFilter(theme)]}><Text style={[styles.filterText(theme), period === 'month' && styles.activeFilterText(theme)]}>{t('filter30Days')}</Text></TouchableOpacity>
                    <View style={styles.separator(theme)} />
                    <TouchableOpacity onPress={() => setPeriod('3months')} style={[styles.filterButton(theme), period === '3months' && styles.activeFilter(theme)]}><Text style={[styles.filterText(theme), period === '3months' && styles.activeFilterText(theme)]}>{t('filter3Months')}</Text></TouchableOpacity>
                </View>
                <Card title={t('weightCardTitle')} theme={theme} isRTL={isRTL}>
                    <View>
                        {reportData.weight.data.length > 1 ? ( <LineChart key={chartKey} data={{ labels: reportData.weight.labels, datasets: [{ data: reportData.weight.data }] }} width={screenWidth - 70} height={220} yAxisSuffix={` ${t('weightUnit')}`} chartConfig={lineChartConfig} withShadow={true} bezier onDataPointClick={handleWeightPointClick} yAxisLabel={isRTL ? '' : undefined} fromZero={true} /> ) : ( <View style={styles.emptyChart}><Ionicons name="stats-chart-outline" size={40} color={theme.textSecondary}/><Text style={styles.emptyChartText(theme)}>{t('weightEmptyText')}</Text></View> )}
                        {selectedWeightPoint && ( <View style={[styles.tooltipPositioner, { left: selectedWeightPoint.x, top: selectedWeightPoint.y }]}><View style={styles.tooltipContainer}><View style={styles.tooltipBox(theme)}><View style={styles.tooltipContent}><Text style={styles.tooltipValue(theme)}>{selectedWeightPoint.value.toFixed(1)}</Text><Text style={styles.tooltipUnit(theme)}>{t('weightUnit')}</Text></View></View><View style={styles.tooltipArrow(theme)} /></View></View> )}
                    </View>
                </Card>
                <Card title={t('nutritionCardTitle')} theme={theme} isRTL={isRTL}>
                    <Text style={styles.bigNumber(theme)}>{reportData.nutrition.avgCalories}</Text>
                    <Text style={styles.bigNumberLabel(theme)}>{t('caloriesPerDay')}</Text>
                    {(reportData.nutrition.macros.some(m => m.population > 1)) ? ( <PieChart data={reportData.nutrition.macros} width={screenWidth - 70} height={200} chartConfig={pieChartConfig} accessor={"population"} backgroundColor={"transparent"} absolute /> ) : ( <View style={styles.emptyChart}><Ionicons name="pie-chart-outline" size={40} color={theme.textSecondary}/><Text style={styles.emptyChartText(theme)}>{t('nutritionEmptyText')}</Text></View> )}
                </Card>
                <Card title={t('activityCardTitle')} theme={theme} isRTL={isRTL}><View style={styles.summaryContainer(isRTL)}><View style={styles.summaryItem}><Text style={styles.summaryValue(theme)}>{reportData.activity.workoutDays}</Text><Text style={styles.summaryLabel(theme)}>{t('workoutDays')}</Text></View><View style={styles.summaryItem}><Text style={styles.summaryValue(theme)}>🔥 {reportData.activity.totalCaloriesBurned}</Text><Text style={styles.summaryLabel(theme)}>{t('caloriesBurned')}</Text></View></View></Card>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = {
    rootContainer: (theme) => ({ flex: 1, backgroundColor: theme.background }), scrollContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 90 }, centered: (theme) => ({ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, paddingHorizontal: 20 }), headerTitle: (theme, isRTL) => ({ fontSize: 28, fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left', marginBottom: 20, color: theme.textPrimary }), filterContainer: (isRTL, theme) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.primary, overflow: 'hidden', backgroundColor: theme.card }), filterButton: (theme) => ({ flex: 1, paddingVertical: 12, alignItems: 'center', }), separator: (theme) => ({ width: 1, backgroundColor: theme.primary, }), activeFilter: (theme) => ({ backgroundColor: theme.primary }), filterText: (theme) => ({ fontSize: 16, color: theme.primary }), activeFilterText: (theme) => ({ color: theme.buttonText, fontWeight: 'bold' }), card: (theme) => ({ backgroundColor: theme.card, borderRadius: 20, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }), cardTitle: (theme, isRTL) => ({ fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 15, textAlign: isRTL ? 'right' : 'left' }), emptyChart: { height: 180, justifyContent: 'center', alignItems: 'center' }, emptyChartText: (theme) => ({ marginTop: 10, color: theme.textSecondary, fontSize: 14, textAlign: 'center' }), summaryContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', marginTop: 15 }), summaryItem: { alignItems: 'center' }, summaryValue: (theme) => ({ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary }), summaryLabel: (theme) => ({ fontSize: 14, color: theme.textSecondary, marginTop: 5 }), bigNumber: (theme) => ({ fontSize: 42, fontWeight: 'bold', color: theme.primary, textAlign: 'center' }), bigNumberLabel: (theme) => ({ fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 20 }), tooltipPositioner: { position: 'absolute', }, tooltipContainer: { alignItems: 'center', transform: [ { translateX: '-50%' }, { translateY: -54 } ] }, tooltipBox: (theme) => ({ backgroundColor: theme.tooltipBg, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, }), tooltipArrow: (theme) => ({ width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: theme.tooltipBg, }), tooltipContent: { flexDirection: 'row', alignItems: 'baseline', }, tooltipValue: (theme) => ({ color: theme.tooltipText, fontWeight: 'bold', fontSize: 16, }), tooltipUnit: (theme) => ({ color: theme.tooltipText, fontSize: 12, fontWeight: 'normal', marginLeft: 4, }),
};

export default ReportsScreen;