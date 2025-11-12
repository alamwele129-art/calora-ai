// editprofile.js - الكود الكامل والمعدل
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, Alert, Platform, Keyboard, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from './supabaseclient'; // <-- استيراد Supabase

// --- (لا توجد تغييرات في هذه الأجزاء) ---
const translations = {
  en: { 
    editProfile: 'EDIT PROFILE', publicInfo: 'PUBLIC INFORMATION', firstName: 'First name', lastName: 'Last name', mail: 'Mail', physicalMetrics: 'PHYSICAL METRICS', gender: 'Gender', male: 'Male', female: 'Female', dob: 'Date of Birth', height: 'Height (cm)', currentWeight: 'Current Weight (kg)', goals: 'GOALS', mainGoal: 'Main Goal', lose: 'Lose', maintain: 'Maintain', gain: 'Gain', targetWeight: 'Target Weight (kg)', activityLevel: 'Activity Level', sedentary: 'Sedentary', light: 'Light', active: 'Active', very_active: 'Very Active', profilePic: 'Profile Picture', chooseNewPic: 'Choose your new picture', takePhoto: 'Take Photo', chooseFromGallery: 'Choose from Gallery', cancel: 'Cancel', success: 'Success', saveSuccess: 'Changes saved successfully!', error: 'Error', saveError: 'An error occurred while saving data.', 
  },
  ar: { 
    editProfile: 'تعديل الملف الشخصي', publicInfo: 'المعلومات العامة', firstName: 'الاسم الأول', lastName: 'الاسم الأخير', mail: 'البريد الإلكتروني', physicalMetrics: 'المقاييس البدنية', gender: 'الجنس', male: 'ذكر', female: 'أنثى', dob: 'تاريخ الميلاد', height: 'الطول (سم)', currentWeight: 'الوزن الحالي (كغ)', goals: 'الأهداف', mainGoal: 'الهدف الرئيسي', lose: 'خسارة وزن', maintain: 'الحفاظ على الوزن', gain: 'زيادة وزن', targetWeight: 'الوزن المستهدف (كغ)', activityLevel: 'مستوى النشاط', sedentary: 'خامل', light: 'خفيف', نشيط: 'active', very_active: 'نشيط جداً', profilePic: 'صورة الملف الشخصي', chooseNewPic: 'اختر صورتك الجديدة', takePhoto: 'التقاط صورة', chooseFromGallery: 'اختيار من المعرض', cancel: 'إلغاء', success: 'نجاح', saveSuccess: 'تم حفظ التغييرات بنجاح!', error: 'خطأ', saveError: 'حدث خطأ أثناء حفظ البيانات.', 
  },
};
const lightTheme = { background: '#F7FDF9', surface: '#FFFFFF', textDark: '#1D1D1D', textGray: '#888888', primary: '#388E3C', border: '#EFEFEF', disabledBackground: '#F7F7F7', icon: '#1D1D1D' };
const darkTheme = { background: '#121212', surface: '#1E1E1E', textDark: '#FFFFFF', textGray: '#A5A5A5', primary: '#66BB6A', border: '#38383A', disabledBackground: '#3A3A3C', icon: '#FFFFFF' };
const calculateCalories = (userData) => { if (!userData || !userData.birthDate || !userData.weight || !userData.height || !userData.gender || !userData.activityLevel || !userData.goal) return 2000; const { birthDate, gender, weight, height, activityLevel, goal } = userData; const age = new Date().getFullYear() - new Date(birthDate).getFullYear(); let bmr = (gender === 'male') ? (10 * weight + 6.25 * height - 5 * age + 5) : (10 * weight + 6.25 * height - 5 * age - 161); const activityMultipliers = { sedentary: 1.2, light: 1.375, active: 1.55, very_active: 1.725 }; const tdee = bmr * (activityMultipliers[activityLevel] || 1.2); let finalCalories; switch (goal) { case 'lose': finalCalories = tdee - 500; break; case 'gain': finalCalories = tdee + 500; break; default: finalCalories = tdee; break; } return Math.max(1200, Math.round(finalCalories)); };
const InfoInput = React.memo(({ label, value, onChangeText, keyboardType = 'default', theme, isRTL }) => { const styles = getStyles(theme, isRTL); return ( <View style={styles.inputContainer}><View style={{flex: 1}}><Text style={styles.inputLabel}>{label}</Text><TextInput style={styles.textInput} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholderTextColor={theme.textGray} /></View>{value && String(value).trim().length > 0 && <Ionicons name="checkmark-circle-outline" size={24} color={theme.primary} />}</View> ); });
const OptionSelector = React.memo(({ label, options, selectedValue, onSelect, theme, isRTL }) => { const styles = getStyles(theme, isRTL); return ( <View style={styles.optionContainer}><Text style={styles.inputLabel}>{label}</Text><View style={styles.optionsWrapper}>{options.map((option) => ( <TouchableOpacity key={option.value} style={[styles.optionButton, selectedValue === option.value && styles.optionButtonSelected]} onPress={() => onSelect(option.value)}><Text style={[styles.optionText, selectedValue === option.value && styles.optionTextSelected]} numberOfLines={1} adjustsFontSizeToFit>{option.label}</Text></TouchableOpacity> ))}</View></View> ); });

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [gender, setGender] = useState(null);
  const [birthDate, setBirthDate] = useState(new Date());
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState(null);
  const [targetWeight, setTargetWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [keyboardPadding, setKeyboardPadding] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('ar');
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  const isRTL = activeLanguage === 'ar';
  const t = (key) => translations[activeLanguage][key] || translations['en'][key];

  // ✅ ===== دالة تحميل البيانات (معدلة بالكامل) ===== ✅
  useFocusEffect(
    useCallback(() => {
      const loadSettingsAndData = async () => {
        setIsLoading(true);
        try {
          // تحميل الإعدادات المحلية أولاً
          const savedLang = await AsyncStorage.getItem('appLanguage');
          const savedTheme = await AsyncStorage.getItem('isDarkMode');
          if (savedLang) setActiveLanguage(savedLang);
          setIsDarkMode(savedTheme === 'true');

          // جلب بيانات المستخدم والإيميل من Supabase Auth
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("User not found for profile loading.");
          setEmail(user.email || '');

          // جلب بيانات الملف الشخصي من جدول 'profiles'
          const { data: supabaseProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = a single row was not returned
            throw error;
          }

          if (supabaseProfile) {
            // إذا وُجدت بيانات في السحابة، استخدمها
            setFirstName(supabaseProfile.first_name || '');
            setLastName(supabaseProfile.last_name || '');
            setProfileImage(supabaseProfile.profile_image_url || null);
            setGender(supabaseProfile.gender || null);
            setBirthDate(supabaseProfile.birth_date ? new Date(supabaseProfile.birth_date) : new Date());
            setHeight(supabaseProfile.height ? String(supabaseProfile.height) : '');
            setWeight(supabaseProfile.weight ? String(supabaseProfile.weight) : '');
            setGoal(supabaseProfile.goal || null);
            setTargetWeight(supabaseProfile.target_weight ? String(supabaseProfile.target_weight) : '');
            setActivityLevel(supabaseProfile.activity_level || null);
          } else {
            // خطة بديلة: إذا لم توجد بيانات في السحابة، حاول تحميلها من الذاكرة المحلية
            const jsonValue = await AsyncStorage.getItem('userProfile');
            if (jsonValue != null) {
              const data = JSON.parse(jsonValue);
              setFirstName(data.firstName || '');
              setLastName(data.lastName || '');
            }
          }
        } catch(e) {
          console.error("Failed to load profile data", e);
          Alert.alert(t('error'), e.message);
        } finally {
          setIsLoading(false);
        }
      };

      loadSettingsAndData();
    }, [])
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => { setKeyboardPadding(e.endCoordinates.height); });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => { setKeyboardPadding(50); });
    return () => { keyboardDidHideListener.remove(); keyboardDidShowListener.remove(); };
  }, []);
  
  const handleImagePicker = useCallback(() => { Alert.alert(t('profilePic'), t('chooseNewPic'), [ { text: t('takePhoto'), onPress: () => launchCamera({ mediaType: 'photo', quality: 0.5 }, (r) => { if (!r.didCancel && r.assets) setProfileImage(r.assets[0].uri); }) }, { text: t('chooseFromGallery'), onPress: () => launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (r) => { if (!r.didCancel && r.assets) setProfileImage(r.assets[0].uri); }) }, { text: t('cancel'), style: 'cancel' } ]); }, [t]);
  const onDateChange = useCallback((event, selectedDate) => { setShowDatePicker(Platform.OS === 'ios'); if (selectedDate) { setBirthDate(selectedDate); } }, []);

  // ✅ ===== دالة حفظ البيانات (معدلة بالكامل) ===== ✅
  const handleSave = useCallback(async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found for profile saving.");

        const userDataForCalories = { firstName, lastName, email, profileImage, gender, birthDate: birthDate.toISOString(), height: parseFloat(height), weight: parseFloat(weight), goal, targetWeight: goal === 'maintain' ? null : parseFloat(targetWeight), activityLevel };
        const newDailyGoal = calculateCalories(userDataForCalories);

        const profileDataForSupabase = {
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            gender: gender,
            birth_date: birthDate.toISOString().split('T')[0], // format YYYY-MM-DD
            height: parseFloat(height) || null,
            weight: parseFloat(weight) || null,
            goal: goal,
            target_weight: goal === 'maintain' ? null : parseFloat(targetWeight) || null,
            activity_level: activityLevel,
            daily_goal: newDailyGoal,
            profile_image_url: profileImage,
            updated_at: new Date().toISOString()
        };

        // 1. الحفظ في Supabase
        const { error } = await supabase.from('profiles').upsert(profileDataForSupabase);
        if (error) throw error;
        
        // 2. تحديث النسخة المحلية في AsyncStorage
        const finalProfileDataForLocal = { ...userDataForCalories, dailyGoal: newDailyGoal };
        await AsyncStorage.setItem('userProfile', JSON.stringify(finalProfileDataForLocal));

        Alert.alert(t('success'), t('saveSuccess'));
        navigation.goBack();

    } catch (error) {
        console.error("Error saving profile:", error);
        Alert.alert(t('error'), t('saveError'));
    }
  }, [firstName, lastName, email, profileImage, gender, birthDate, height, weight, goal, targetWeight, activityLevel, navigation, t]);

  const styles = getStyles(theme, isRTL);

  if (isLoading) { return <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" color={theme.primary} /></View>; }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}><Icon name={isRTL ? "arrow-right" : "arrow-left"} size={28} color={theme.icon} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfile')}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}><Ionicons name="checkmark-outline" size={30} color={theme.icon} /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: keyboardPadding }} keyboardShouldPersistTaps="handled">
        <View style={styles.profileSection}><View style={styles.profileImageContainer}><Image source={profileImage ? { uri: profileImage } : require('./assets/profile.png')} style={styles.profileImage}/><TouchableOpacity style={styles.cameraButton} onPress={handleImagePicker}><Ionicons name="camera" size={18} color={theme.textDark} /></TouchableOpacity></View></View>
        <View style={styles.formSection}><Text style={styles.sectionTitle}>{t('publicInfo')}</Text><InfoInput label={t('firstName')} value={firstName} onChangeText={setFirstName} theme={theme} isRTL={isRTL}/><InfoInput label={t('lastName')} value={lastName} onChangeText={setLastName} theme={theme} isRTL={isRTL}/><View style={[styles.inputContainer, styles.disabledInputContainer]}><View style={{flex: 1}}><Text style={styles.inputLabel}>{t('mail')}</Text><TextInput style={[styles.textInput, styles.disabledTextInput]} value={email} editable={false} /></View><Ionicons name="lock-closed-outline" size={22} color={theme.textGray} /></View></View>
        <View style={styles.formSection}><Text style={styles.sectionTitle}>{t('physicalMetrics')}</Text><OptionSelector label={t('gender')} options={[{ label: t('male'), value: 'male' }, { label: t('female'), value: 'female' }]} selectedValue={gender} onSelect={setGender} theme={theme} isRTL={isRTL} /><TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}><View style={{flex: 1}}><Text style={styles.inputLabel}>{t('dob')}</Text><Text style={styles.textInput}>{birthDate.toLocaleDateString(activeLanguage === 'ar' ? 'ar-EG' : 'en-GB')}</Text></View><Ionicons name="calendar-outline" size={22} color={theme.textGray} /></TouchableOpacity>{showDatePicker && <DateTimePicker value={birthDate} mode="date" display="spinner" onChange={onDateChange} locale={activeLanguage} />}<InfoInput label={t('height')} value={height} onChangeText={setHeight} keyboardType="numeric" theme={theme} isRTL={isRTL}/><InfoInput label={t('currentWeight')} value={weight} onChangeText={setWeight} keyboardType="numeric" theme={theme} isRTL={isRTL}/></View>
        <View style={styles.formSection}><Text style={styles.sectionTitle}>{t('goals')}</Text><OptionSelector label={t('mainGoal')} options={[{ label: t('lose'), value: 'lose' }, { label: t('maintain'), value: 'maintain' }, { label: t('gain'), value: 'gain' }]} selectedValue={goal} onSelect={setGoal} theme={theme} isRTL={isRTL} />{goal !== 'maintain' && <InfoInput label={t('targetWeight')} value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" theme={theme} isRTL={isRTL}/>}<OptionSelector label={t('activityLevel')} options={[{ label: t('sedentary'), value: 'sedentary' }, { label: t('light'), value: 'light' }, { label: t('active'), value: 'active' }, { label: t('very_active'), value: 'very_active' }]} selectedValue={activityLevel} onSelect={setActivityLevel} theme={theme} isRTL={isRTL}/></View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme, isRTL) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background }, 
  header: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.border }, 
  headerButton: { padding: 5, width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.textDark }, 
  profileSection: { alignItems: 'center', marginVertical: 20 }, 
  profileImageContainer: { position: 'relative' }, 
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }, 
  cameraButton: { position: 'absolute', bottom: 0, right: isRTL ? undefined : 0, left: isRTL ? 0 : undefined, backgroundColor: theme.surface, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border, elevation: 3 }, 
  formSection: { paddingHorizontal: 20, marginBottom: 10, paddingTop: 10 }, 
  sectionTitle: { fontSize: 13, color: theme.textGray, fontWeight: '600', marginBottom: 15, textTransform: 'uppercase', textAlign: isRTL ? 'right' : 'left' }, 
  inputContainer: { backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 15, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.border }, 
  inputLabel: { fontSize: 12, color: theme.textGray, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }, 
  textInput: { fontSize: 16, fontWeight: '600', color: theme.textDark, padding: 0, textAlign: isRTL ? 'right' : 'left' }, 
  disabledInputContainer: { backgroundColor: theme.disabledBackground }, 
  disabledTextInput: { color: theme.textGray }, 
  optionContainer: { marginBottom: 15 }, 
  optionsWrapper: { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }, 
  optionButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 5, borderRadius: 8, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface },
  optionButtonSelected: { backgroundColor: theme.primary, borderColor: theme.primary }, 
  optionText: { color: theme.textDark, fontWeight: '600', fontSize: 14 }, 
  optionTextSelected: { color: '#FFFFFF' },
});

export default EditProfileScreen;