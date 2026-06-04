package com.anonymous.ToDoListProyectoMoviles

import android.content.Context
import android.content.SharedPreferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

// Instancia global de DataStore como lo pide la documentación de Android
val Context.dataStore by preferencesDataStore(name = "datastore_prefs")

class SecureStorageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SecureStorageModule"
    }

    @ReactMethod
    fun saveSecret(key: String, value: String, mechanism: String, promise: Promise) {
        val context = reactApplicationContext

        try {
            when (mechanism) {
                "SHARED_PREFS" -> {
                    val sharedPref = context.getSharedPreferences("plain_prefs", Context.MODE_PRIVATE)
                    sharedPref.edit().putString(key, value).apply()
                    promise.resolve("Guardado en SharedPreferences (Texto Plano)")
                }
                "ENCRYPTED_PREFS" -> {
                    val masterKey = MasterKey.Builder(context)
                        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                        .build()
                    val encryptedPref = EncryptedSharedPreferences.create(
                        context,
                        "encrypted_prefs",
                        masterKey,
                        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                    )
                    encryptedPref.edit().putString(key, value).apply()
                    promise.resolve("Guardado con AES-256 en EncryptedSharedPreferences")
                }
                "DATASTORE" -> {
                    CoroutineScope(Dispatchers.IO).launch {
                        val dataStoreKey = stringPreferencesKey(key)
                        context.dataStore.edit { preferences ->
                            preferences[dataStoreKey] = value
                        }
                        promise.resolve("Guardado asíncronamente en Jetpack DataStore")
                    }
                }
                else -> promise.reject("ERROR", "Mecanismo desconocido")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getSecret(key: String, mechanism: String, promise: Promise) {
        val context = reactApplicationContext

        try {
            when (mechanism) {
                "SHARED_PREFS" -> {
                    val sharedPref = context.getSharedPreferences("plain_prefs", Context.MODE_PRIVATE)
                    val value = sharedPref.getString(key, null)
                    promise.resolve(value)
                }
                "ENCRYPTED_PREFS" -> {
                    val masterKey = MasterKey.Builder(context)
                        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                        .build()
                    val encryptedPref = EncryptedSharedPreferences.create(
                        context,
                        "encrypted_prefs",
                        masterKey,
                        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                    )
                    val value = encryptedPref.getString(key, null)
                    promise.resolve(value)
                }
                "DATASTORE" -> {
                    CoroutineScope(Dispatchers.IO).launch {
                        val dataStoreKey = stringPreferencesKey(key)
                        val value = context.dataStore.data.map { preferences ->
                            preferences[dataStoreKey]
                        }.first()
                        promise.resolve(value)
                    }
                }
                else -> promise.reject("ERROR", "Mecanismo desconocido")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}