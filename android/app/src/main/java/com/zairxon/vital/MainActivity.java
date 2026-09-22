package com.zairxon.vital;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

/**
 * Запрет скриншотов документов (FLAG_SECURE). Переключатель в настройках
 * (src/lib/auth.js, isScreenshotBlockEnabled) пишет своё значение через
 * @capacitor/preferences в тот же SharedPreferences-файл "CapacitorStorage",
 * который читается здесь при запуске — живого переключения без перезапуска
 * нет, это сознательное упрощение: значение применяется при следующем
 * открытии приложения.
 */
public class MainActivity extends BridgeActivity {
    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String PREF_KEY = "vital.blockScreenshots";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        // По умолчанию включено — документы приватные, пока пользователь
        // сам не выключит запрет в настройках.
        boolean blocked = !"false".equals(prefs.getString(PREF_KEY, null));

        if (blocked) {
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        }
    }
}
