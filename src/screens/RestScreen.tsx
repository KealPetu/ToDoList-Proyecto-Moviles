// src/screens/RestScreen.tsx

import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Paleta de Colores ─────────────
const COLORS = {
    bg: "#0F0F13",
    surface: "#1A1A22",
    border: "#2E2E3E",
    primary: "#6C63FF",
    primaryDisabled: "#6C63FF55",
    textPrimary: "#F0EFF8",
    textSecondary: "#8885A8",
    textMuted: "#4E4D6A",
    success: "#3ECF8E",
    error: "#FF6584",
};

export function RestScreen() {
    // ─── Estados ────────────────────────────────────────────────────────
    const [searchId, setSearchId] = useState("");
    const [post, setPost] = useState({ title: "", body: "" });
    const [isLoadingGet, setIsLoadingGet] = useState(false);
    const [isLoadingPut, setIsLoadingPut] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

    // Bloqueo global de UI si alguna petición está "en vuelo"
    const isBusy = isLoadingGet || isLoadingPut;

    // ─── Petición GET ───────────────────────────────────────────────────
    const handleGetPost = async () => {
        if (!searchId.trim()) return;
        Keyboard.dismiss();
        setIsLoadingGet(true);
        setStatusMessage({ text: "", type: "" });
        setPost({ title: "", body: "" });

        try {
            const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${searchId}`);
            if (!response.ok) throw new Error("No se encontró el post");

            const data = await response.json();
            setPost({ title: data.title, body: data.body });
            setStatusMessage({ text: "Post recuperado con éxito", type: "success" });
        } catch (error) {
            setStatusMessage({ text: "Error: Post no encontrado", type: "error" });
        } finally {
            setIsLoadingGet(false);
        }
    };

    // ─── Petición PUT ───────────────────────────────────────────────────
    const handlePutPost = async () => {
        Keyboard.dismiss();
        setIsLoadingPut(true);
        setStatusMessage({ text: "", type: "" });

        try {
            const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${searchId}`, {
                method: "PUT",
                body: JSON.stringify({
                    id: Number(searchId),
                    title: post.title,
                    body: post.body,
                    userId: 1, // JSONPlaceholder requiere un userId
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                },
            });

            // Capturar código 200 OK para simular éxito
            if (response.status === 200) {
                setStatusMessage({ text: "¡Actualización exitosa! (200 OK)", type: "success" });
            } else {
                throw new Error(`Error de red: ${response.status}`);
            }
        } catch (error) {
            setStatusMessage({ text: "Error al actualizar el post", type: "error" });
        } finally {
            setIsLoadingPut(false);
        }
    };

    // ─── Renderizado ────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.appBar}>
                <Text style={styles.appBarTitle}>Módulo REST API</Text>
            </View>

            <View style={styles.container}>
                {/* Sección GET */}
                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>CONSULTA (GET)</Text>
                    <View style={styles.searchRow}>
                        <TextInput
                            style={[styles.input, styles.searchInput]}
                            placeholder="Ingrese ID del post (ej. 1)"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            value={searchId}
                            onChangeText={setSearchId}
                            editable={!isBusy}
                        />
                        <TouchableOpacity
                            style={[styles.button, isBusy && styles.buttonDisabled]}
                            onPress={handleGetPost}
                            disabled={isBusy || !searchId}
                        >
                            {isLoadingGet ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>Buscar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Mensaje de Estado */}
                {statusMessage.text !== "" && (
                    <Text style={[
                        styles.statusText,
                        statusMessage.type === "success" ? styles.textSuccess : styles.textError
                    ]}>
                        {statusMessage.text}
                    </Text>
                )}

                {/* Sección PUT (Solo visible si hay un post cargado) */}
                {post.title !== "" && (
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>EDICIÓN (PUT)</Text>

                        <Text style={styles.inputLabel}>Título del Post</Text>
                        <TextInput
                            style={styles.input}
                            value={post.title}
                            onChangeText={(text) => setPost({ ...post, title: text })}
                            editable={!isBusy}
                        />

                        <Text style={styles.inputLabel}>Contenido</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={post.body}
                            onChangeText={(text) => setPost({ ...post, body: text })}
                            multiline
                            numberOfLines={4}
                            editable={!isBusy}
                        />

                        <TouchableOpacity
                            style={[styles.button, styles.putButton, isBusy && styles.buttonDisabled]}
                            onPress={handlePutPost}
                            disabled={isBusy}
                        >
                            {isLoadingPut ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>Actualizar (PUT)</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

// ─── Estilos ────────────────────────────────────────────────────────
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
    searchRow: { flexDirection: "row", gap: 10 },
    searchInput: { flex: 1, marginBottom: 0 },
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
    textArea: { height: 100, textAlignVertical: "top" },
    button: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    putButton: { width: "100%", marginTop: 8 },
    buttonDisabled: { backgroundColor: COLORS.primaryDisabled },
    buttonText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
    statusText: {
        textAlign: "center",
        fontWeight: "600",
        marginBottom: 20,
        fontSize: 14,
    },
    textSuccess: { color: COLORS.success },
    textError: { color: COLORS.error },
});