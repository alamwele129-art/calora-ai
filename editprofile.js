import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, Alert, Platform, Keyboard, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from './supabaseclient';

// تأكد أن المسار هذا صحيح وموجود فعلاً
const defaultProfileImage = require('./assets/profile.png'); 

const translations = {
  en: { 
    editProfile: 'EDIT PROFILE', publicInfo: 'PUBLIC INFORMATION', firstName: 'First name', lastName: 'Last name', mail: 'Mail', physicalMetrics: 'PHYSICAL METRICS', gender: 'Gender', male: 'Male', female: 'Female', dob: 'Date of Birth', height: 'Height (cm)', currentWeight: 'Current Weight (kg)', goals: 'GOALS', mainGoal: 'Main Goal', lose: 'Lose', maintain: 'Maintain', gain: 'Gain', targetWeight: 'Target Weight (kg)', activityLevel: 'Activity Level', sedentary: 'Sedentary', light: 'Light', active: 'Active', very_active: 'Very Active', profilePic: 'Profile Picture', chooseNewPic: 'Choose your new picture', takePhoto: 'Take Photo', chooseFromGallery: 'Choose from Gallery', cancel: 'Cancel', success: 'Success', saveSuccess: 'Changes saved successfully!', error: 'Error', saveError: 'An error occurred while saving data.', 
  },
  ar: { 
    editProfile: 'تعديل الملف الشخصي', publicInfo: 'المعلومات العامة', firstName: 'الاسم الأول', lastName: 'الاسم الأخير', mail: 'البريد الإلكتروني', physicalMetrics: 'المقاييس البدنية', gender: 'الجنس', male: 'ذكر', female: 'أنثى', dob: 'تاريخ الميلاد', height: 'الطول (سم)', currentWeight: 'الوزن الحالي (كغ)', goals: 'الأهداف', mainGoal: 'الهدف الرئيسي', lose: 'خسارة وزن', maintain: 'الحفاظ على الوزن', gain: 'زيادة وزن', targetWeight: 'الوزن المستهدف (كغ)', activityLevel: 'مستوى النشاط', sedentary: 'خامل', light: 'خفيف', active: 'نشيط', very_active: 'نشيط جداً', profilePic: 'صورة الملف الشخصي', chooseNewPic: 'اختر صورتك الجديدة', takePhoto: 'التقاط صورة', chooseFromGallery: 'اختيار من المعرض', cancel: 'إلغاء', success: 'نجاح', saveSuccess: 'تم حفظ التغييرات بنجاح!', error: 'خطأ', saveError: 'حدث خطأ أثناء حفظ البيانات.', 
  },
};

const lightTheme = { background: '#F7FDF9', surface: '#FFFFFF', textDark: '#1D1D1D', textGray: '#888888', primary: '#388E3C', border: '#EFEFEF', disabledBackground: '#F7F7F7', icon: '#1D1D1D' };
const darkTheme = { background: '#121212', surface: '#1E1E1E', textDark: '#FFFFFF', textGray: '#A5A5A5', primary: '#66BB6A', border: '#38383A', disabledBackground: '#3A3A3C', icon: '#FFFFFF' };

const calculateCalories = (userData) => { if (!userData || !userData.birthDate || !userData.weight || !userData.height || !userData.gender || !userData.activityLevel || !userData.goal) return 2000; const { birthDate, gender, weight, height, activityLevel, goal } = userData; const age = new Date().getFullYear() - new Date(birthDate).getFullYear(); let bmr = (gender === 'male') ? (10 * weight + 6.25 * height - 5 * age + 5) : (10 * weight + 6.25 * height - 5 * age - 161); const activityMultipliers = { sedentary: 1.2, light: 1.375, active: 1.55, very_active: 1.725 }; const tdee = bmr * (activityMultipliers[activityLevel] || 1.2); let finalCalories; switch (goal) { case 'lose': finalCalories = tdee - 500; break; case 'gain': finalCalories = tdee + 500; break; default: finalCalories = tdee; break; } return Math.max(1200, Math.round(finalCalories)); };

const InfoInput = React.memo(({ label, value, onChangeText, keyboardType = 'default', theme, isRTL }) => { 
  return ( 
    <View style={styles.inputContainer(theme, isRTL)}>
        <View style={{flex: 1}}>
            <Text style={styles.inputLabel(theme, isRTL)}>{label}</Text>
            <TextInput 
                style={styles.textInput(theme, isRTL)} 
                value={value} 
                onChangeText={onChangeText} 
                keyboardType={keyboardType} 
                placeholderTextColor={theme.textGray}
                writingDirection={isRTL ? 'ltr' : 'rtl'}
            />
        </View>
        {value && String(value).trim().length > 0 && <Ionicons name="checkmark-circle-outline" size={24} color={theme.primary} />}
    </View> 
  ); 
});

const OptionSelector = React.memo(({ label, options, selectedValue, onSelect, theme, isRTL }) => { 
  return ( 
    <View style={styles.optionContainer}>
        <Text style={styles.inputLabel(theme, isRTL)}>{label}</Text>
        <View style={styles.optionsWrapper(isRTL)}>
            {options.map((option) => ( 
                <TouchableOpacity key={option.value} style={[styles.optionButton(theme), selectedValue === option.value && styles.optionButtonSelected(theme)]} onPress={() => onSelect(option.value)}>
                    <Text style={[styles.optionText(theme), selectedValue === option.value && styles.optionTextSelected]} numberOfLines={1} adjustsFontSizeToFit>{option.label}</Text>
                </TouchableOpacity> 
            ))}
        </View>
    </View> 
  ); 
});

const EditProfileScreen = ({ appLanguage }) => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  // States للصورة
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false); // <--- تم إضافة هذا المتغير

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
  
  const [activeLanguage, setActiveLanguage] = useState(appLanguage || 'en');
  const isRTL = activeLanguage === 'ar';

  const theme = isDarkMode ? darkTheme : lightTheme;
  const t = (key) => translations[activeLanguage]?.[key] || translations['en'][key];

  useFocusEffect(
    useCallback(() => {
      const loadSettingsAndData = async () => {
        setIsLoading(true);
        try {
          const savedLang = await AsyncStorage.getItem('appLanguage');
          const savedTheme = await AsyncStorage.getItem('isDarkMode');
          
          if (savedLang) setActiveLanguage(savedLang);
          else if (appLanguage) setActiveLanguage(appLanguage);

          setIsDarkMode(savedTheme === 'true');

          const jsonValue = await AsyncStorage.getItem('userProfile');
          if (jsonValue != null) {
            const data = JSON.parse(jsonValue);
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            if (data.email) setEmail(data.email);
          }

          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
             if (user.email) setEmail(user.email);
             const { data: supabaseProfile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
             if (!error && supabaseProfile) {
                setFirstName(supabaseProfile.first_name || firstName);
                setLastName(supabaseProfile.last_name || lastName);
                
                // تحميل الصورة ومسح حالة الخطأ
                setProfileImage(supabaseProfile.profile_image_url || null);
                setImageError(false); 

                setGender(supabaseProfile.gender || null);
                if (supabaseProfile.birth_date) setBirthDate(new Date(supabaseProfile.birth_date));
                setHeight(supabaseProfile.height ? String(supabaseProfile.height) : '');
                setWeight(supabaseProfile.weight ? String(supabaseProfile.weight) : '');
                setGoal(supabaseProfile.goal || null);
                setTargetWeight(supabaseProfile.target_weight ? String(supabaseProfile.target_weight) : '');
                setActivityLevel(supabaseProfile.activity_level || null);
             }
          }
        } catch(e) {
          console.error("Failed to load profile data", e);
        } finally {
          setIsLoading(false);
        }
      };
      loadSettingsAndData();
    }, [appLanguage])
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => { setKeyboardPadding(e.endCoordinates.height); });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => { setKeyboardPadding(50); });
    return () => { keyboardDidHideListener.remove(); keyboardDidShowListener.remove(); };
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  const handleImagePicker = useCallback(() => { 
    Alert.alert(t('profilePic'), t('chooseNewPic'), [ 
      { text: t('takePhoto'), onPress: () => launchCamera({ mediaType: 'photo', quality: 0.5 }, (r) => { 
        if (!r.didCancel && r.assets) {
            setProfileImage(r.assets[0].uri); 
            setImageError(false); // <--- إعادة تعيين الخطأ عند التقاط صورة جديدة
        }
      }) }, 
      { text: t('chooseFromGallery'), onPress: () => launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (r) => { 
        if (!r.didCancel && r.assets) {
            setProfileImage(r.assets[0].uri); 
            setImageError(false); // <--- إعادة تعيين الخطأ عند اختيار صورة جديدة
        }
      }) }, 
      { text: t('cancel'), style: 'cancel' } 
    ]); 
  }, [t]);

  const onDateChange = useCallback((event, selectedDate) => { setShowDatePicker(Platform.OS === 'ios'); if (selectedDate) { setBirthDate(selectedDate); } }, []);

  const handleSave = useCallback(async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found");
        const userDataForCalories = { firstName, lastName, email, profileImage, gender, birthDate: birthDate.toISOString(), height: parseFloat(height), weight: parseFloat(weight), goal, targetWeight: goal === 'maintain' ? null : parseFloat(targetWeight), activityLevel };
        const newDailyGoal = calculateCalories(userDataForCalories);
        const profileDataForSupabase = { id: user.id, first_name: firstName, last_name: lastName, gender: gender, birth_date: birthDate.toISOString().split('T')[0], height: parseFloat(height) || null, weight: parseFloat(weight) || null, goal: goal, target_weight: goal === 'maintain' ? null : parseFloat(targetWeight) || null, activity_level: activityLevel, daily_goal: newDailyGoal, profile_image_url: profileImage, updated_at: new Date().toISOString() };
        const { error } = await supabase.from('profiles').upsert(profileDataForSupabase);
        if (error) throw error;
        const finalProfileDataForLocal = { ...userDataForCalories, dailyGoal: newDailyGoal };
        await AsyncStorage.setItem('userProfile', JSON.stringify(finalProfileDataForLocal));
        Alert.alert(t('success'), t('saveSuccess'));
        navigation.goBack();
    } catch (error) {
        console.error("Error saving profile:", error);
        Alert.alert(t('error'), t('saveError'));
    }
  }, [firstName, lastName, email, profileImage, gender, birthDate, height, weight, goal, targetWeight, activityLevel, navigation, t]);

  if (isLoading) { return <View style={[styles.container(theme), {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" color={theme.primary} /></View>; }

  return (
    <SafeAreaView style={styles.container(theme)}>
      <View style={styles.header(theme, isRTL)}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Icon name={isRTL ? "arrow-right" : "arrow-left"} size={28} color={theme.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle(theme)}>{t('editProfile')}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Ionicons name="checkmark-outline" size={30} color={theme.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: keyboardPadding }} keyboardShouldPersistTaps="handled">
        <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
                {/* --- تعديل هام هنا لعرض الصورة بشكل صحيح --- */}
                <Image 
                    source={
                        (profileImage && !imageError) 
                        ? { uri: profileImage } 
                        : defaultProfileImage
                    }
                    style={styles.profileImage(theme)}
                    onError={() => setImageError(true)} // إذا فشل التحميل، اعتبر الصورة غير موجودة
                />
                {/* -------------------------------------- */}
                
                <TouchableOpacity style={styles.cameraButton(theme)} onPress={handleImagePicker}>
                    <Ionicons name="camera" size={18} color={theme.textDark} />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.formSection}>
            <Text style={styles.sectionTitle(theme, isRTL)}>{t('publicInfo')}</Text>
            <InfoInput label={t('firstName')} value={firstName} onChangeText={setFirstName} theme={theme} isRTL={isRTL} />
            <InfoInput label={t('lastName')} value={lastName} onChangeText={setLastName} theme={theme} isRTL={isRTL} />
            
            <View style={[styles.inputContainer(theme, isRTL), styles.disabledInputContainer(theme)]}>
                <View style={{flex: 1}}>
                    <Text style={styles.inputLabel(theme, isRTL)}>{t('mail')}</Text>
                    <TextInput 
                        style={[styles.textInput(theme, isRTL), styles.disabledTextInput(theme)]} 
                        value={email} 
                        editable={false} 
                        writingDirection={isRTL ? 'ltr' : 'rtl'}
                    />
                </View>
                <Ionicons name="lock-closed-outline" size={22} color={theme.textGray} />
            </View>
        </View>

        <View style={styles.formSection}>
            <Text style={styles.sectionTitle(theme, isRTL)}>{t('physicalMetrics')}</Text>
            <OptionSelector label={t('gender')} options={[{ label: t('male'), value: 'male' }, { label: t('female'), value: 'female' }]} selectedValue={gender} onSelect={setGender} theme={theme} isRTL={isRTL} />
            
            <TouchableOpacity style={styles.inputContainer(theme, isRTL)} onPress={() => setShowDatePicker(true)}>
                <View style={{flex: 1}}>
                    <Text style={styles.inputLabel(theme, isRTL)}>{t('dob')}</Text>
                    <Text 
                        style={[
                            styles.textInput(theme, isRTL), 
                            { textAlign: isRTL ? 'left' : 'right' } 
                        ]} 
                        writingDirection={isRTL ? 'rtl' : 'ltr'}
                    >
                        {formatDate(birthDate)}
                    </Text>
                </View>
                <Ionicons name="calendar-outline" size={22} color={theme.textGray} />
            </TouchableOpacity>
            {showDatePicker && <DateTimePicker value={birthDate} mode="date" display="spinner" onChange={onDateChange} locale={activeLanguage} />}
            
            <InfoInput label={t('height')} value={height} onChangeText={setHeight} keyboardType="numeric" theme={theme} isRTL={isRTL} />
            <InfoInput label={t('currentWeight')} value={weight} onChangeText={setWeight} keyboardType="numeric" theme={theme} isRTL={isRTL} />
        </View>

        <View style={styles.formSection}>
            <Text style={styles.sectionTitle(theme, isRTL)}>{t('goals')}</Text>
            <OptionSelector label={t('mainGoal')} options={[{ label: t('lose'), value: 'lose' }, { label: t('maintain'), value: 'maintain' }, { label: t('gain'), value: 'gain' }]} selectedValue={goal} onSelect={setGoal} theme={theme} isRTL={isRTL} />
            {goal !== 'maintain' && <InfoInput label={t('targetWeight')} value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" theme={theme} isRTL={isRTL} />}
            <OptionSelector label={t('activityLevel')} options={[{ label: t('sedentary'), value: 'sedentary' }, { label: t('light'), value: 'light' }, { label: t('active'), value: 'active' }, { label: t('very_active'), value: 'very_active' }]} selectedValue={activityLevel} onSelect={setActivityLevel} theme={theme} isRTL={isRTL} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: (theme) => ({ flex: 1, backgroundColor: theme.background }), 
  
  header: (theme, isRTL) => ({ 
    flexDirection: isRTL ? 'row' : 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    backgroundColor: theme.background, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border 
  }), 
  headerButton: { padding: 5, width: 40, alignItems: 'center' },
  headerTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.textDark }), 
  
  profileSection: { alignItems: 'center', marginVertical: 20 }, 
  profileImageContainer: { position: 'relative' }, 
  profileImage: (theme) => ({ width: 100, height: 100, borderRadius: 50, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }), 
  cameraButton: (theme) => ({ 
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: theme.surface, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border, elevation: 3 
  }), 
  
  formSection: { paddingHorizontal: 20, marginBottom: 10, paddingTop: 10 }, 
  
  sectionTitle: (theme, isRTL) => ({ 
    fontSize: 13, 
    color: theme.textGray, 
    fontWeight: '600', 
    marginBottom: 15, 
    textTransform: 'uppercase', 
    textAlign: isRTL ? 'left' : 'right' 
  }), 
  
  inputContainer: (theme, isRTL) => ({ 
    backgroundColor: theme.surface, 
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    marginBottom: 15, 
    flexDirection: isRTL ? 'row' : 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: theme.border 
  }), 
  
  inputLabel: (theme, isRTL) => ({ 
    fontSize: 12, 
    color: theme.textGray, 
    marginBottom: 4, 
    textAlign: isRTL ? 'left' : 'right' 
  }), 
  
  textInput: (theme, isRTL) => ({ 
    fontSize: 16, 
    fontWeight: '600', 
    color: theme.textDark, 
    padding: 0, 
    textAlign: isRTL ? 'right' : 'left' 
  }), 
  
  disabledInputContainer: (theme) => ({ backgroundColor: theme.disabledBackground }), 
  disabledTextInput: (theme) => ({ color: theme.textGray }), 
  
  optionContainer: { marginBottom: 15 }, 
  
  optionsWrapper: (isRTL) => ({ 
    flexDirection: isRTL ? 'row' : 'row-reverse', 
    gap: 8 
  }), 
  
  optionButton: (theme) => ({ flex: 1, paddingVertical: 12, paddingHorizontal: 5, borderRadius: 8, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface }),
  optionButtonSelected: (theme) => ({ backgroundColor: theme.primary, borderColor: theme.primary }), 
  optionText: (theme) => ({ color: theme.textDark, fontWeight: '600', fontSize: 14 }), 
  optionTextSelected: { color: '#FFFFFF' },
};

export default EditProfileScreen;