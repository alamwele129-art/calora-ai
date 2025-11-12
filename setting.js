import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView,
  StatusBar, Animated, I18nManager, Platform, Modal, TextInput, Clipboard,
  DevSettings, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Pedometer } from 'expo-sensors';
import DateTimePicker from '@react-native-community/datetimepicker';
import GoogleFit, { Scopes } from 'react-native-google-fit';

// Assume notificationsdata.js exists in the same directory
import notificationsData from './notificationsdata'; 

const STEPS_NOTIFICATION_TASK = 'steps-notification-task';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const translations = {
  en: {
    settings: 'Settings', notifications: 'Notifications', language: 'Language', darkMode: 'Dark Mode',
    exportData: 'Export Data', deleteAccount: 'Delete Account', mealReminders: 'MEAL REMINDERS',
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks',
    generalReminders: 'GENERAL REMINDERS', waterReminder: 'Water Reminder', weighInReminder: 'Weigh-in Reminder',
    workoutReminder: 'Workout Reminder',
    stepsGoalReminder: 'Steps Goal Reminder',
    stepsGoalReminderDesc: 'Get a notification when you reach your daily step goal.',
    save: 'Save', languageSaved: 'Language Saved', languageSettingsUpdated: 'Language settings updated. The app will now reload.',
    deleteAccountTitle: 'Delete Account Permanently', deleteAccountMessage: 'Are you sure? This action cannot be undone...',
    cancel: 'Cancel', delete: 'Delete',
    exportDataDescription: 'Your entire food log is prepared below as CSV text...',
    exportAllData: 'Prepare Data for Export', copyToClipboard: 'Copy All Text', copied: 'Copied!',
    remindersSaved: 'Reminders Updated',
    notificationsPermissionTitle: 'Notifications Permission',
    notificationsPermissionMessage: 'To receive reminders, please enable notifications for this app in your device settings.',
    changeTime: 'Change Time',
    enterNewTime: 'Enter the new time in HH:MM format (e.g., 14:30)',
    error: 'Error',
    invalidTimeFormat: 'Please enter the time in the correct HH:MM format',
    snackFeatureAlertTitle: "Unsupported Feature",
    snackTimePickerMessage: "This button works! On a real phone, the native time picker would open here.",
    snackTaskManagerMessage: "Step counter background task is not supported in this environment. The reminder is saved as 'ON' but will only work on a real device build.",
    connectedApps: 'Connected Apps',
    googleFit: 'Google Fit',
    connect: 'Connect',
    connected: 'Connected',
    disconnect: 'Disconnect',
    connecting: 'Connecting...',
    connectionSuccess: 'Successfully connected to Google Fit.',
    connectionFailed: 'Failed to connect to Google Fit. Please try again.',
    disconnectSuccess: 'Successfully disconnected from Google Fit.',
  },
  ar: {
    settings: 'الإعدادات', notifications: 'الإشعارات', language: 'اللغة', darkMode: 'الوضع الداكن',
    exportData: 'تصدير البيانات', deleteAccount: 'حذف الحساب', mealReminders: 'تذكيرات الوجبات',
    breakfast: 'الفطور', lunch: 'الغداء', dinner: 'العشاء', snacks: 'وجبات خفيفة',
    generalReminders: 'تذكيرات عامة', waterReminder: 'تذكير شرب الماء', weighInReminder: 'تذكير قياس الوزن',
    workoutReminder: 'تذكير التمرين',
    stepsGoalReminder: 'تذكير هدف الخطوات',
    stepsGoalReminderDesc: 'احصل على إشعار عند وصولك لهدفك اليومي من الخطوات.',
    save: 'حفظ', languageSaved: 'تم حفظ اللغة', languageSettingsUpdated: 'تم تحديث إعدادات اللغة. سيتم الآن إعادة تحميل التطبيق.',
    deleteAccountTitle: 'حذف الحساب نهائياً', deleteAccountMessage: 'هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء...',
    cancel: 'إلغاء', delete: 'حذف',
    exportDataDescription: 'تم تجهيز كامل سجل طعامك في الأسفل كنص CSV...',
    exportAllData: 'تجهيز البيانات للتصدير', copyToClipboard: 'نسخ كل النص', copied: 'تم النسخ!',
    remindersSaved: 'تم تحديث التذكيرات',
    notificationsPermissionTitle: 'إذن الإشعارات',
    notificationsPermissionMessage: 'لتلقي التذكيرات، يرجى تمكين الإشعارات لهذا التطبيق في إعدادات جهازك.',
    changeTime: 'تغيير الوقت',
    enterNewTime: 'أدخل الوقت الجديد بصيغة HH:MM (مثال: 14:30)',
    error: 'خطأ',
    invalidTimeFormat: 'الرجاء إدخال الوقت بالصيغة الصحيحة HH:MM',
    snackFeatureAlertTitle: "ميزة غير مدعومة",
    snackTimePickerMessage: "الزر يعمل! على الهاتف الحقيقي، ستفتح الساعة هنا لتحديد الوقت.",
    snackTaskManagerMessage: "مهمة عداد الخطوات الخلفية غير مدعومة في هذه البيئة. تم حفظ التذكير على أنه 'مفعل' ولكنه لن يعمل إلا على نسخة هاتف حقيقية.",
    connectedApps: 'التطبيقات المرتبطة',
    googleFit: 'Google Fit',
    connect: 'اتصال',
    connected: 'متصل',
    disconnect: 'قطع الاتصال',
    connecting: 'جاري الاتصال...',
    connectionSuccess: 'تم الاتصال بـ Google Fit بنجاح.',
    connectionFailed: 'فشل الاتصال بـ Google Fit. يرجى المحاولة مرة أخرى.',
    disconnectSuccess: 'تم قطع الاتصال بـ Google Fit بنجاح.',
  },
};

const lightTheme = { background: '#F5FBF5', surface: '#FFFFFF', text: '#1C1C1E', secondaryText: '#8A8A8E', iconContainer: '#E8F5E9', separator: '#EAEAEA', iconColor: '#1C1C1E', danger: '#D32F2F', statusBar: 'dark-content', primary: '#4CAF50' };
const darkTheme = { background: '#121212', surface: '#1E1E1E', text: '#FFFFFF', secondaryText: '#A5A5A5', iconContainer: '#3A3A3C', separator: '#38383A', iconColor: '#FFFFFF', danger: '#EF5350', statusBar: 'light-content', primary: '#4CAF50' };

const ScreenHeader = ({ title, onBackPress, theme, isRTL, action }) => (
    <View style={[styles.headerContainer, { backgroundColor: theme.surface, borderBottomColor: theme.separator, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <TouchableOpacity onPress={onBackPress} style={styles.headerButton}>
        <Icon name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={theme.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={action.onPress} style={styles.headerButton}>
          <Text style={[styles.headerActionText, { color: theme.primary }]}>{action.label}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerButton} />
      )}
    </View>
);
// ✅ الخطوة 1: تعديل دالة `formatTime` لتدعم نظام 12 ساعة واللغة
const formatTime = (date, lang = 'en') => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm_en = hours >= 12 ? 'PM' : 'AM';
    const ampm_ar = hours >= 12 ? 'م' : 'ص';
    const ampm = lang === 'ar' ? ampm_ar : ampm_en;
    hours = hours % 12;
    hours = hours ? hours : 12; // الساعة 0 تصبح 12
    return `${hours}:${minutes} ${ampm}`;
};

const DarkModeToggle = ({ value, onValueChange }) => {
  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(animation, { toValue: value ? 1 : 0, duration: 250, useNativeDriver: false, }).start();
  }, [value, animation]);
  const trackColor = animation.interpolate({ inputRange: [0, 1], outputRange: ['#767577', '#4CAF50'], });
  const thumbColor = '#FFFFFF';
  const translateX = animation.interpolate({ inputRange: [0, 1], outputRange: [3, 29], });
  return (
    <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={0.8}>
      <Animated.View style={[styles.toggleContainer, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.toggleThumb, { backgroundColor: thumbColor, transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};
const SettingsActionItem = ({ icon, label, onPress, color, theme, isRTL }) => ( <TouchableOpacity onPress={onPress} style={[styles.settingsItem, { backgroundColor: theme.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }]}><View style={[styles.itemContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><View style={[styles.iconContainer, { backgroundColor: theme.iconContainer }, isRTL ? { marginLeft: 16 } : { marginRight: 16 }]}><Icon name={icon} size={22} color={color || theme.iconColor} /></View><Text style={[styles.label, { color: color || theme.text }]}>{label}</Text></View><Icon name={isRTL ? "chevron-left" : "chevron-right"} size={24} color="#B0B0B0" /></TouchableOpacity> );
const SettingsToggleItem = ({ icon, label, description, value, onValueChange, theme, isRTL, time, onTimePress }) => (
  <View style={[styles.settingsItem, { backgroundColor: theme.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
    <View style={[styles.itemContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.iconContainer }, isRTL ? { marginLeft: 16 } : { marginRight: 16 }]}>
        <Icon name={icon} size={22} color={theme.iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
        {description && <Text style={[styles.description, { color: theme.secondaryText, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text>}
      </View>
    </View>
    {time && value && (
      <TouchableOpacity onPress={onTimePress}>
        <Text style={[styles.timeText, { color: theme.text }]}>{time}</Text>
      </TouchableOpacity>
    )}
    <DarkModeToggle value={value} onValueChange={onValueChange} />
  </View>
);
const LanguageSelectionItem = ({ label, isSelected, onPress, theme, isRTL }) => ( <TouchableOpacity onPress={onPress} style={[styles.settingsItem, { backgroundColor: theme.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }]}><Text style={[styles.label, { color: theme.text, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>{isSelected && <Icon name="check-circle" size={24} color="#4CAF50" />}</TouchableOpacity> );
const SettingsSectionHeader = ({ title, theme, isRTL }) => ( <Text style={[styles.sectionHeader, { color: theme.secondaryText, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text> );

const SettingsIntegrationItem = ({ icon, label, isConnected, onConnect, onDisconnect, theme, isRTL, t, isLoading }) => (
  <View style={[styles.settingsItem, { backgroundColor: theme.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
    <View style={[styles.itemContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.iconContainer }, isRTL ? { marginLeft: 16 } : { marginRight: 16 }]}>
        <Icon name={icon} size={22} color={theme.iconColor} />
      </View>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </View>
    {isLoading ? (
      <ActivityIndicator color={theme.primary} />
    ) : isConnected ? (
      <View style={styles.connectedContainer}>
        <Text style={[styles.connectedText, { color: theme.primary }]}>{t('connected')}</Text>
        <TouchableOpacity onPress={onDisconnect}>
          <Text style={[styles.disconnectText, { color: theme.danger }]}>{t('disconnect')}</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity style={[styles.connectButton, { backgroundColor: theme.primary }]} onPress={onConnect}>
        <Text style={styles.connectButtonText}>{t('connect')}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const SettingsScreen = ({ navigation, onThemeChange, appLanguage }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('main');
  const [activeLanguage, setActiveLanguage] = useState(appLanguage);
  const [selectedLanguage, setSelectedLanguage] = useState(appLanguage);
  const [exportDataContent, setExportDataContent] = useState('');
  const defaultReminderSettings = { breakfast: { enabled: false, time: '08:00' }, lunch: { enabled: false, time: '13:00' }, dinner: { enabled: false, time: '19:00' }, snacks: { enabled: false, time: '16:00' }, water: { enabled: false }, weighIn: { enabled: false, time: '07:30', day: 6 }, workout: { enabled: false, time: '17:00' }, stepsGoal: { enabled: false }, };
  const [reminders, setReminders] = useState(defaultReminderSettings);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [currentReminderKey, setCurrentReminderKey] = useState(null);
  const [tempTime, setTempTime] = useState(new Date());
  const [isGoogleFitConnected, setIsGoogleFitConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  const isRTL = activeLanguage === 'ar';
  const t = (key, lang = activeLanguage) => translations[lang]?.[key] || translations['en'][key];

  // ✅ الخطوة 2: دالة مساعدة لتحويل الوقت المخزن (24 ساعة) إلى صيغة العرض (12 ساعة)
  const displayTime = (timeString, lang) => {
    if (!timeString || !timeString.includes(':')) return '';
    const [hour, minute] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hour, 10));
    date.setMinutes(parseInt(minute, 10));
    return formatTime(date, lang);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      setIsDarkMode(savedTheme === 'true');
      const isConnected = await AsyncStorage.getItem('isGoogleFitConnected') === 'true';
      setIsGoogleFitConnected(isConnected);
      const savedRemindersRaw = await AsyncStorage.getItem('reminderSettings');
      if (savedRemindersRaw) {
        try {
          const savedReminders = JSON.parse(savedRemindersRaw);
          const mergedReminders = { ...defaultReminderSettings };
          for (const key in mergedReminders) {
            if (savedReminders[key]) {
              mergedReminders[key] = { ...mergedReminders[key], ...savedReminders[key] };
            }
          }
          setReminders(mergedReminders);
        } catch (e) {
          console.error("Failed to parse reminder settings:", e);
          setReminders(defaultReminderSettings);
        }
      } else {
        setReminders(defaultReminderSettings);
      }
    };
    loadSettings();
  }, []);

  const scheduleAllNotifications = async (currentSettings, currentLang) => {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const data = notificationsData.notifications[currentLang] || notificationsData.notifications.en;
    for (const key in currentSettings) {
        if (!currentSettings[key] || !currentSettings[key].enabled) continue;
        const settings = currentSettings[key];
        const titleKey = key === 'weighIn' ? 'weighInReminder' : (key === 'water' ? 'waterReminder' : (key === 'workout' ? 'workoutReminder' : key));
        const notificationTitle = t(titleKey, currentLang);
        if (key === 'water') {
            await Notifications.scheduleNotificationAsync({ content: { title: notificationTitle, body: data?.water?.[0] || 'Time to hydrate!' }, trigger: { seconds: 2 * 60 * 60, repeats: true }, identifier: `reminder_water` });
        } else if (settings.time) {
            if (!data) continue;
            let messageList;
            if (data.meal_reminders && data.meal_reminders[key]) { messageList = data.meal_reminders[key]; } else if (data[key]) { messageList = data[key]; }
            if (!messageList || messageList.length === 0) continue;
            const [hour, minute] = settings.time.split(':').map(Number);
            const isWeekly = key === 'weighIn';
            const daysToSchedule = isWeekly ? 4 : 7;
            for (let i = 0; i < daysToSchedule; i++) {
                const messageBody = messageList[i % messageList.length];
                let triggerDate = new Date();
                if (isWeekly) {
                    const targetDay = settings.day;
                    const daysToAdd = (targetDay - triggerDate.getDay() + 7) % 7;
                    triggerDate.setDate(triggerDate.getDate() + daysToAdd + (i * 7));
                } else {
                    triggerDate.setDate(new Date().getDate() + i);
                }
                triggerDate.setHours(hour, minute, 0, 0);
                if (triggerDate < new Date()) { if (isWeekly) continue; triggerDate.setDate(triggerDate.getDate() + 7); }
                await Notifications.scheduleNotificationAsync({ content: { title: notificationTitle, body: messageBody }, trigger: triggerDate, identifier: `reminder_${key}_${i}` });
            }
        }
    }
  };
  const handleToggleStepsReminder = async () => {
    const newReminders = { ...reminders, stepsGoal: { enabled: !reminders.stepsGoal.enabled } };
    setReminders(newReminders);
    await AsyncStorage.setItem('reminderSettings', JSON.stringify(newReminders));
    if (newReminders.stepsGoal.enabled) {
        if (!TaskManager || typeof TaskManager.registerTaskAsync !== 'function') {
            Alert.alert(t('snackFeatureAlertTitle'), t('snackTaskManagerMessage'));
            return;
        }
        const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
        const { status: pedometerStatus } = await Pedometer.requestPermissionsAsync();
        if (notificationStatus !== 'granted' || pedometerStatus !== 'granted') {
            Alert.alert(t('notificationsPermissionTitle'), t('notificationsPermissionMessage'));
            const revertedState = { ...newReminders, stepsGoal: { enabled: false } };
            setReminders(revertedState);
            await AsyncStorage.setItem('reminderSettings', JSON.stringify(revertedState));
            return;
        }
        await TaskManager.registerTaskAsync(STEPS_NOTIFICATION_TASK, { minimumInterval: 15 * 60 });
        Alert.alert(t('remindersSaved'));
    } else {
        if (TaskManager && typeof TaskManager.unregisterTaskAsync === 'function') {
            await TaskManager.unregisterTaskAsync(STEPS_NOTIFICATION_TASK);
        }
        Alert.alert(t('remindersSaved'));
    }
  };
  const showTimePicker = (key) => {
    if (Platform.OS === 'web') { Alert.alert(t('snackFeatureAlertTitle'), t('snackTimePickerMessage')); return; }
    const reminderTime = reminders[key].time;
    const [hour, minute] = reminderTime.split(':').map(Number);
    const newTempTime = new Date();
    newTempTime.setHours(hour, minute);
    setTempTime(newTempTime);
    setCurrentReminderKey(key);
    setTimePickerVisible(true);
  };
  const handleTimeChange = async (event, selectedDate) => {
      setTimePickerVisible(Platform.OS === 'ios');
      if (event.type === 'dismissed' || !selectedDate) return;
      const newTime = selectedDate;
      if (Platform.OS === 'android') {
        // ✅ الخطوة 5: التأكد من الحفظ بصيغة 24 ساعة
        const formattedTimeForStorage = `${newTime.getHours().toString().padStart(2, '0')}:${newTime.getMinutes().toString().padStart(2, '0')}`;
        const updatedReminders = { ...reminders, [currentReminderKey]: { ...reminders[currentReminderKey], time: formattedTimeForStorage } };
        setReminders(updatedReminders);
        await AsyncStorage.setItem('reminderSettings', JSON.stringify(updatedReminders));
        await scheduleAllNotifications(updatedReminders, activeLanguage);
      } else {
        setTempTime(newTime);
      }
  };
  const saveIosTime = async () => {
      // ✅ الخطوة 5: التأكد من الحفظ بصيغة 24 ساعة
      const formattedTimeForStorage = `${tempTime.getHours().toString().padStart(2, '0')}:${tempTime.getMinutes().toString().padStart(2, '0')}`;
      const updatedReminders = { ...reminders, [currentReminderKey]: { ...reminders[currentReminderKey], time: formattedTimeForStorage } };
      setReminders(updatedReminders);
      await AsyncStorage.setItem('reminderSettings', JSON.stringify(updatedReminders));
      await scheduleAllNotifications(updatedReminders, activeLanguage);
      setTimePickerVisible(false);
  };
  const handleToggleReminder = async (key) => {
    if (key === 'stepsGoal') { await handleToggleStepsReminder(); return; }
    const newReminders = { ...reminders, [key]: { ...reminders[key], enabled: !reminders[key].enabled } };
    setReminders(newReminders);
    await AsyncStorage.setItem('reminderSettings', JSON.stringify(newReminders));
    await scheduleAllNotifications(newReminders, activeLanguage);
    Alert.alert(t('remindersSaved'));
  };
  const handleToggleDarkMode = (value) => {
    setIsDarkMode(value);
    if (onThemeChange) { onThemeChange(value); } else { AsyncStorage.setItem('isDarkMode', String(value)).catch(e => console.error(e)); }
  };
  const handleSaveLanguage = async () => {
    if (activeLanguage === selectedLanguage) { setCurrentView('main'); return; }
    try {
      await AsyncStorage.setItem('appLanguage', selectedLanguage);
      I18nManager.forceRTL(selectedLanguage === 'ar');
      Alert.alert( t('languageSaved', selectedLanguage), t('languageSettingsUpdated', selectedLanguage), [ { text: 'OK', onPress: () => { DevSettings.reload(); }, }, ], { cancelable: false });
    } catch (e) { console.error("Failed to save language settings.", e); Alert.alert("Error", "Could not save language settings."); }
  };
  const handleBackPress = () => { if (currentView === 'language') { setSelectedLanguage(activeLanguage); setCurrentView('main'); return; } if (currentView !== 'main') { setCurrentView('main'); setExportDataContent(''); } else if(navigation.canGoBack()) { navigation.goBack(); } };
  const handlePrepareExportData = async () => {
      try {
          const keys = await AsyncStorage.getAllKeys();
          const dateKeys = keys.filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));
          const dataPairs = await AsyncStorage.multiGet(dateKeys);
          let allFoodItems = [];
          const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
          dataPairs.forEach(([date, dataString]) => { if (dataString) { const dayData = JSON.parse(dataString); mealTypes.forEach(meal => { if (dayData[meal] && Array.isArray(dayData[meal])) { dayData[meal].forEach(item => allFoodItems.push({ date, meal, ...item })); } }); } });
          if (allFoodItems.length === 0) { Alert.alert("No Data", "There is no food data to export."); setExportDataContent(''); return; }
          const header = "Date,Meal,Food Name,Quantity,Calories,Protein (g),Carbs (g),Fat (g)\n";
          const rows = allFoodItems.map(item => `${item.date},${item.meal},"${(item.name || '').replace(/"/g, '""')}",${item.quantity || ''},${item.calories || 0},${item.p || 0},${item.c || 0},${item.f || 0}`).join("\n");
          setExportDataContent(header + rows);
      } catch (error) { console.error("Export failed:", error); Alert.alert('Error', 'Could not prepare data for export.'); }
  };
  const copyToClipboard = () => { if (exportDataContent) { Clipboard.setString(exportDataContent); Alert.alert(t('copied')); } };
  const handleDeleteAccount = () => { Alert.alert(t('deleteAccountTitle'), t('deleteAccountMessage'), [{ text: t('cancel'), style: 'cancel' }, { text: t('delete'), style: 'destructive', onPress: () => console.log("Account deleted") }]); };
  
  const handleConnectGoogleFit = async () => {
    setIsConnecting(true);
    const options = { scopes: [ Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_BODY_READ, Scopes.FITNESS_NUTRITION_READ, ], };
    try {
        const authResult = await GoogleFit.authorize(options);
        if (authResult.success) {
            setIsGoogleFitConnected(true);
            await AsyncStorage.setItem('isGoogleFitConnected', 'true');
            Alert.alert('Google Fit', t('connectionSuccess'));
        } else {
            console.log("AUTH_DENIED", authResult.message);
            setIsGoogleFitConnected(false);
            await AsyncStorage.setItem('isGoogleFitConnected', 'false');
            Alert.alert('Google Fit', t('connectionFailed'));
        }
    } catch (error) {
        console.error("AUTH_ERROR", error);
        setIsGoogleFitConnected(false);
        await AsyncStorage.setItem('isGoogleFitConnected', 'false');
        Alert.alert('Google Fit', t('connectionFailed'));
    } finally {
        setIsConnecting(false);
    }
  };
  const handleDisconnectGoogleFit = async () => {
    try {
        await GoogleFit.disconnect();
        setIsGoogleFitConnected(false);
        await AsyncStorage.setItem('isGoogleFitConnected', 'false');
        Alert.alert("Google Fit", t('disconnectSuccess'));
    } catch (error) {
        console.error("DISCONNECT_ERROR", error);
    }
  };

  const renderContent = () => {
    // ✅ الخطوة 3: استخدام `displayTime` لعرض الوقت بصيغة 12 ساعة
    if (currentView === 'notifications') {
      return (
        <>
            <SettingsSectionHeader title={t('mealReminders')} theme={theme} isRTL={isRTL} />
            <SettingsToggleItem icon="food-croissant" label={t('breakfast')} value={reminders.breakfast.enabled} onValueChange={() => handleToggleReminder('breakfast')} time={displayTime(reminders.breakfast.time, activeLanguage)} onTimePress={() => showTimePicker('breakfast')} theme={theme} isRTL={isRTL} />
            <SettingsToggleItem icon="food-turkey" label={t('lunch')} value={reminders.lunch.enabled} onValueChange={() => handleToggleReminder('lunch')} time={displayTime(reminders.lunch.time, activeLanguage)} onTimePress={() => showTimePicker('lunch')} theme={theme} isRTL={isRTL} />
            <SettingsToggleItem icon="food-steak" label={t('dinner')} value={reminders.dinner.enabled} onValueChange={() => handleToggleReminder('dinner')} time={displayTime(reminders.dinner.time, activeLanguage)} onTimePress={() => showTimePicker('dinner')} theme={theme} isRTL={isRTL} />
            <SettingsToggleItem icon="food-apple-outline" label={t('snacks')} value={reminders.snacks.enabled} onValueChange={() => handleToggleReminder('snacks')} time={displayTime(reminders.snacks.time, activeLanguage)} onTimePress={() => showTimePicker('snacks')} theme={theme} isRTL={isRTL} />
            <SettingsSectionHeader title={t('generalReminders')} theme={theme} isRTL={isRTL} />
            <SettingsToggleItem icon="cup-water" label={t('waterReminder')} value={reminders.water.enabled} onValueChange={() => handleToggleReminder('water')} theme={theme} isRTL={isRTL} />
            <SettingsToggleItem icon="scale-bathroom" label={t('weighInReminder')} value={reminders.weighIn.enabled} onValueChange={() => handleToggleReminder('weighIn')} time={displayTime(reminders.weighIn.time, activeLanguage)} onTimePress={() => showTimePicker('weighIn')} theme={theme} isRTL={isRTL} />
            <SettingsToggleItem icon="dumbbell" label={t('workoutReminder')} value={reminders.workout.enabled} onValueChange={() => handleToggleReminder('workout')} time={displayTime(reminders.workout.time, activeLanguage)} onTimePress={() => showTimePicker('workout')} theme={theme} isRTL={isRTL} />
            <SettingsToggleItem icon="walk" label={t('stepsGoalReminder')} description={t('stepsGoalReminderDesc')} value={reminders.stepsGoal.enabled} onValueChange={() => handleToggleReminder('stepsGoal')} theme={theme} isRTL={isRTL} />
        </>
      );
    }
    if (currentView === 'language') { 
        return ( <View style={{ paddingTop: 20 }}><LanguageSelectionItem label="English" isSelected={selectedLanguage === 'en'} onPress={() => setSelectedLanguage('en')} theme={theme} isRTL={isRTL} /><LanguageSelectionItem label="العربية" isSelected={selectedLanguage === 'ar'} onPress={() => setSelectedLanguage('ar')} theme={theme} isRTL={isRTL} /></View> );
    }
    if (currentView === 'export') { 
        return ( <View style={{paddingHorizontal: 16, paddingTop: 20}}><Text style={[styles.exportDescription, { color: theme.secondaryText, textAlign: isRTL ? 'right' : 'left' }]}>{t('exportDataDescription')}</Text><TouchableOpacity style={[styles.exportButton, { backgroundColor: theme.iconColor }]} onPress={handlePrepareExportData}><Icon name="database-arrow-down-outline" size={22} color={theme.background} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} /><Text style={[styles.exportButtonText, { color: theme.background }]}>{t('exportAllData')}</Text></TouchableOpacity>{exportDataContent ? ( <View><TextInput style={[styles.dataBox, { color: theme.text, borderColor: theme.separator, backgroundColor: theme.surface }]} value={exportDataContent} multiline={true} editable={false} /><TouchableOpacity style={[styles.exportButton, { backgroundColor: '#4CAF50', marginTop: 10 }]} onPress={copyToClipboard}><Icon name="content-copy" size={22} color={'#FFFFFF'} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} /><Text style={[styles.exportButtonText, { color: '#FFFFFF' }]}>{t('copyToClipboard')}</Text></TouchableOpacity></View> ) : null}</View> );
    }
    return (
        <>
            <SettingsToggleItem icon="theme-light-dark" label={t('darkMode')} value={isDarkMode} onValueChange={handleToggleDarkMode} theme={theme} isRTL={isRTL} />
            <SettingsActionItem icon="bell-outline" label={t('notifications')} onPress={() => setCurrentView('notifications')} theme={theme} isRTL={isRTL} />
            <SettingsActionItem icon="translate" label={t('language')} onPress={() => setCurrentView('language')} theme={theme} isRTL={isRTL} />
            <SettingsSectionHeader title={t('connectedApps')} theme={theme} isRTL={isRTL} />
            <SettingsIntegrationItem icon="google-fit" label={t('googleFit')} isConnected={isGoogleFitConnected} onConnect={handleConnectGoogleFit} onDisconnect={handleDisconnectGoogleFit} theme={theme} isRTL={isRTL} t={t} isLoading={isConnecting} />
            <View style={{ height: 20 }} />
            <SettingsActionItem icon="export-variant" label={t('exportData')} onPress={() => setCurrentView('export')} theme={theme} isRTL={isRTL} />
            <SettingsActionItem icon="account-remove-outline" label={t('deleteAccount')} onPress={handleDeleteAccount} color={theme.danger} theme={theme} isRTL={isRTL} />
        </>
    );
  };
  const getHeaderTitle = () => { switch(currentView) { case 'notifications': return t('notifications'); case 'language': return t('language'); case 'export': return t('exportData'); default: return t('settings'); } };
  const headerAction = currentView === 'language' ? { label: t('save'), onPress: handleSaveLanguage } : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface} />
      <ScreenHeader title={getHeaderTitle()} onBackPress={handleBackPress} theme={theme} isRTL={isRTL} action={headerAction} />
      <ScrollView style={{backgroundColor: theme.background}} contentContainerStyle={[ styles.scrollContent, { paddingTop: currentView === 'main' ? 20 : 0 } ]}>
        {renderContent()}
      </ScrollView>
      {/* ✅ الخطوة 4: تعديل `DateTimePicker` ليعمل بنظام 12 ساعة */}
      {isTimePickerVisible && Platform.OS !== 'web' && (Platform.OS === 'ios' ? (
          <Modal transparent={true} animationType="slide" visible={isTimePickerVisible} onRequestClose={() => setTimePickerVisible(false)}>
              <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setTimePickerVisible(false)} />
              <View style={[styles.modalContent, {backgroundColor: theme.surface}]}><DateTimePicker value={tempTime} mode="time" is24Hour={false} display="spinner" onChange={handleTimeChange} textColor={theme.text} /><TouchableOpacity style={styles.saveButton} onPress={saveIosTime}><Text style={styles.saveButtonText}>{t('save')}</Text></TouchableOpacity></View>
          </Modal>
      ) : (
          <DateTimePicker value={tempTime} mode="time" is24Hour={false} display="default" onChange={handleTimeChange} />
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { height: 60, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth, },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  headerActionText: { fontSize: 16, fontWeight: '600', },
  scrollContent: { paddingBottom: 20 },
  settingsItem: { alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: 12, marginHorizontal: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  itemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 16, },
  description: { fontSize: 12, paddingTop: 2 },
  sectionHeader: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 28, paddingVertical: 10, marginTop: 10 },
  toggleContainer: { width: 52, height: 26, borderRadius: 13, justifyContent: 'center', padding: 3 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  exportDescription: { fontSize: 15, lineHeight: 22, marginBottom: 24, paddingHorizontal: 12, },
  exportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 12, marginHorizontal: 16, },
  exportButtonText: { fontSize: 16, fontWeight: 'bold', },
  dataBox: { marginTop: 20, padding: 10, height: 200, borderWidth: 1, borderRadius: 8, textAlignVertical: 'top', fontSize: 12, },
  timeText: { fontSize: 16, fontWeight: '600', marginHorizontal: 10, },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { borderTopRightRadius: 20, borderTopLeftRadius: 20, padding: 20, position: 'absolute', bottom: 0, width: '100%' },
  saveButton: { backgroundColor: '#4CAF50', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  connectButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, },
  connectButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, },
  connectedContainer: { alignItems: 'flex-end', },
  connectedText: { fontSize: 14, fontWeight: 'bold', },
  disconnectText: { fontSize: 12, marginTop: 2, },
});

export default SettingsScreen;