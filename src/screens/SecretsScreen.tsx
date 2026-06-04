// src/screens/SecretsScreen.tsx

import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Keyboard,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SecureStorage, StorageMechanism } from "../modules/SecureStorage";

// ─── Paleta de Colores (consistente con el resto de la app) ────────
const COLORS = {
    bg: "#0F0F13",
    surface: "#1A1A22",
    border: "#2E2E3E",
    primary: "#6C63FF",
    textPrimary: "#F0EFF8",
    textSecondary: "#8885A8",
    textMuted: "#4E4D6A",
    success: "#3ECF8E",
    error: "#FF6584",
    chipBg: "#22222E",
    chipActiveBg: "#6C63FF22",
};

export function SecretsScreen() {
    // ─── Estados ───────────────────────────────────────────────────────
    const [key, setKey] = useState("");
    const [value, setValue] = useState("");
    const [mechanism, setMechanism] = useState<StorageMechanism>("SHARED_PREFS");
    const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

    // ─── Lógica Transaccional ──────────────────────────────────────────

    const handleSave = async () => {
        if (!key.trim() || !value.trim()) {
            setStatusMessage({ text: "La llave y el valor son obligatorios para guardar", type: "error" });
            return;
        }
        Keyboard.dismiss();
        setStatusMessage({ text: "Guardando...", type: "info" });

        try {
            const result = await SecureStorage.saveSecret(key, value, mechanism);
            setStatusMessage({ text: `Éxito: ${result}`, type: "success" });
            setValue(""); // Limpiamos el valor por seguridad visual
        } catch (error) {
            setStatusMessage({ text: "Error al guardar el secreto", type: "error" });
        }
    };

    const handleRecover = async () => {
        if (!key.trim()) {
            setStatusMessage({ text: "Ingresa la llave para recuperar", type: "error" });
            return;
        }
        Keyboard.dismiss();
        setStatusMessage({ text: "Buscando...", type: "info" });
        setValue(""); // Limpiamos el campo valor antes de buscar

        try {
            const recoveredValue = await SecureStorage.getSecret(key, mechanism);

            if (recoveredValue) {
                setValue(recoveredValue); // Revela el secreto en el input
                setStatusMessage({ text: "¡Secreto recuperado con éxito!", type: "success" });
            } else {
                // Notificación genérica de inexistencia requerida por la rúbrica
                setStatusMessage({ text: "El secreto no existe en este compartimento", type: "error" });
            }
        } catch (error) {
            setStatusMessage({ text: "El secreto no existe en este compartimento", type: "error" });
        }
    };

    // ─── Renderizado del Selector Gráfico ──────────────────────────────
    const renderMechanismSelector = () => {
        const options: { label: string; value: StorageMechanism }[] = [
            { label: "SharedPrefs\n(Plano)", value: "SHARED_PREFS" },
            { label: "DataStore\n(Reactivo)", value: "DATASTORE" },
            { label: "EncryptedPrefs\n(AES-256)", value: "ENCRYPTED_PREFS" },
        ];

        return (
            <View style={styles.selectorContainer}>
                {options.map((opt) => {
                    const isActive = mechanism === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.chip, isActive && styles.chipActive]}
                            onPress={() => setMechanism(opt.value)}
                        >
                            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    // ─── Renderizado Principal ─────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.appBar}>
                <Text style={styles.appBarTitle}>Gestión de Secretos</Text>
            </View>

            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>1. COMPARTIMENTO NATIVO</Text>
                    {renderMechanismSelector()}

                    <Text style={[styles.sectionLabel, { marginTop: 20 }]}>2. DATOS TRANSACCIONALES</Text>

                    <Text style={styles.inputLabel}>Llave (Identificador)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. token_api, user_password..."
                        placeholderTextColor={COLORS.textMuted}
                        value={key}
                        onChangeText={setKey}
                        autoCapitalize="none"
                    />

                    <Text style={styles.inputLabel}>Valor (Secreto)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="El dato a proteger o revelar..."
                        placeholderTextColor={COLORS.textMuted}
                        value={value}
                        onChangeText={setValue}
                    />

                    {/* Botones de Acción */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.button, styles.btnRecover]} onPress={handleRecover}>
                            <Text style={styles.buttonText}>Recuperar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, styles.btnSave]} onPress={handleSave}>
                            <Text style={styles.buttonText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Mensajes de Estado */}
                {statusMessage.text !== "" && (
                    <Text style={[
                        styles.statusText,
                        statusMessage.type === "success" ? styles.textSuccess : styles.textError,
                        statusMessage.type === "info" && { color: COLORS.textSecondary }
                    ]}>
                        {statusMessage.text}
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
}

// ─── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    appBar: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.bg,
    },
    appBarTitle: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary },
    container: { padding: 20 },
    card: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 12,
    },
    selectorContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },
    chip: {
        flex: 1,
        backgroundColor: COLORS.chipBg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    chipActive: {
        backgroundColor: COLORS.chipActiveBg,
        borderColor: COLORS.primary,
    },
    chipText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        textAlign: "center",
        fontWeight: "600",
    },
    chipTextActive: {
        color: COLORS.primary,
        fontWeight: "bold",
    },
    inputLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 6,
        fontWeight: "500",
    },
    input: {
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        color: COLORS.textPrimary,
        fontSize: 15,
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    btnSave: {
        backgroundColor: COLORS.primary,
    },
    btnRecover: {
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    buttonText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
    statusText: {
        textAlign: "center",
        fontWeight: "600",
        marginTop: 10,
        fontSize: 14,
    },
    textSuccess: { color: COLORS.success },
    textError: { color: COLORS.error },
});