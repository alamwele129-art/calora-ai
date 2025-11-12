import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// بيانات الاتصال بمشروعك على Supabase
const supabaseUrl = 'https://bucycppxlgshjttpqidn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Y3ljcHB4bGdzaGp0dHBxaWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjAyNTQsImV4cCI6MjA3MDkzNjI1NH0.3lj4eE-vPTX8bywMjBIndUbRF_k_0obqR3QTNPP2rfc';

// هنا نقوم بإنشاء وتصدير العميل (client) الخاص بـ Supabase
// هذا الـ client هو الذي سنستخدمه في كل مكان في التطبيق للتواصل مع Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // نخبر Supabase أن يستخدم AsyncStorage لتخزين بيانات جلسة المستخدم (session)
    autoRefreshToken: true, // يضمن تجديد التوكن تلقائيًا للحفاظ على تسجيل دخول المستخدم
    persistSession: true, // يضمن حفظ الجلسة حتى لو أغلق المستخدم التطبيق
    detectSessionInUrl: false, // هذا الخيار مهم لـ React Native لمنع مشاكل مع الـ deep linking
  },
});

// هذه الدالة التي تستخدمها بالفعل لجلب بيانات الطعام من الجداول
// وهي تستخدم نفس الـ client الذي أنشأناه بالأعلى
export async function searchEgyptianFoodsWithImages(query) {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('egyptian food')
      .select('id, name_ar, name_en, calories, protein, carbs, fat, fiber, sugar, sodium, image_url')
      .or(`name_ar.ilike.%${query}%,name_en.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Supabase search error:', error);
      return [];
    }
    
    return data.map(item => ({
      id: `supa_${item.id}`,
      name: item.name_ar,
      image: item.image_url || null,
      source: 'local',
      calories: item.calories || 0,
      p: item.protein || 0,
      c: item.carbs || 0,
      f: item.fat || 0,
      fib: item.fiber || 0,
      sug: item.sugar || 0,
      sod: item.sodium || 0,
    }));

  } catch (e) {
    console.error("Catch block error during search:", e);
    return [];
  }
}