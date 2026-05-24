import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  console.log('📦 1. Building web assets...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('🔄 2. Syncing with Capacitor...');
  execSync('npx cap sync android', { stdio: 'inherit' });

  console.log('⚡ 3. Compiling Android APK...');
  const isWindows = process.platform === 'win32';
  const gradleCmd = isWindows ? 'gradlew.bat assembleDebug' : './gradlew assembleDebug';
  
  execSync(gradleCmd, { 
    cwd: path.join(process.cwd(), 'android'), 
    stdio: 'inherit' 
  });

  console.log('📁 4. Copying APK to root...');
  const srcApk = path.join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const destApk = path.join(process.cwd(), 'how-much-is-left.apk');

  if (fs.existsSync(srcApk)) {
    fs.copyFileSync(srcApk, destApk);
    console.log(`\n🎉 Success! APK generated at: ${destApk}`);
  } else {
    console.error('\n❌ Error: Could not find compiled APK at ' + srcApk);
  }
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
