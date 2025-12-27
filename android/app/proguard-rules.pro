# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# --- React Native Reanimated ---
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# --- Google Fit & Google Play Services Fixes ---
# هذه الأسطر تمنع حذف مكتبة جوجل فيت أثناء بناء نسخة الـ Release
-keep class com.google.android.gms.** { *; }
-keep class com.google.api.client.** { *; }
-keep class com.reactnative.googlefit.** { *; }

# --- Suppress Warnings ---
# تجاهل تحذيرات معينة قد توقف البناء
-dontwarn com.google.android.gms.**
-dontwarn com.squareup.okhttp.**

# --- General React Native ---
-keep class com.facebook.react.** { *; }