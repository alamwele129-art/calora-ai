// plugins/withForceRtl.js

const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * This is a config plugin to forcefully ensure that the AndroidManifest.xml
 * has the supportsRtl="true" attribute in the <application> tag.
 * This can solve issues where the New Architecture build process might overlook
 * the standard `supportsRtl` property in app.json.
 */
const withForceRtl = (config) => {
  return withAndroidManifest(config, async (config) => {
    // Navigate to the <application> tag in the manifest
    const application = config.modResults.manifest.application[0];

    // Ensure the attributes object exists
    if (!application.$) {
      application.$ = {};
    }

    // Forcefully set the android:supportsRtl attribute to "true"
    application.$['android:supportsRtl'] = 'true';
    
    console.log('✅ Config plugin applied: Forced android:supportsRtl="true" in AndroidManifest.xml');

    return config;
  });
};

module.exports = withForceRtl;
