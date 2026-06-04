// components/TodoModal.tsx

import React, { useState, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Pressable,
} from "react-native";
import { Todo } from "../models/Todo";

const COLORS = {
    bg: "#0F0F13",
    surface: "#1A1A22",
    surfaceAlt: "#22222E",
    border: "#2E2E3E",
    borderFocused: "#4E4D6A",
    textPrimary: "#F0EFF8",
    textSecondary: "#8885A8",
    textMuted: "#4E4D6A",
    overlay: "rgba(0,0,0,0.75)",
};

interface TodoModalProps {
    visible: boolean;
    todo: Todo | null;          // null = modo creación
    accentColor: string;        // cambia con el motor activo
    onSave: (title: string, description: string) => Promise<void>;
    onClose: () => void;
}

export function TodoModal({
    visible,
    todo,
    accentColor,
    onSave,
    onClose,
}: TodoModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [titleFocused, setTitleFocused] = useState(false);
    const [descFocused, setDescFocused] = useState(false);

    const isEditing = todo !== null;

    // Cargar datos al abrir en modo edición
    useEffect(() => {
        if (visible) {
            setTitle(todo?.title ?? "");
            setDescription(todo?.description ?? "");
            setSaving(false);
        }
    }, [visible, todo]);

    const canSave = title.trim().length > 0;

    const handleSave = async () => {
        if (!canSave || saving) return;
        setSaving(true);
        try {
            await onSave(title.trim(), description.trim());
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Overlay táctil para cerrar */}
            <Pressable style={styles.overlay} onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.kvContainer}
                >
                    {/* Detener propagación del toque dentro del sheet */}
                    <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>

                        {/* Handle visual */}
                        <View style={styles.handle} />

                        {/* Cabecera */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.modalTitle}>
                                    {isEditing ? "Editar tarea" : "Nueva tarea"}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {isEditing ? "Modifica los campos y guarda" : "Añade un título y descripción"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Campo título */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Título *</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    titleFocused && {
                                        borderColor: accentColor,
                                        backgroundColor: accentColor + "0D",
                                    },
                                ]}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="¿Qué hay que hacer?"
                                placeholderTextColor={COLORS.textMuted}
                                onFocus={() => setTitleFocused(true)}
                                onBlur={() => setTitleFocused(false)}
                                maxLength={80}
                                returnKeyType="next"
                                autoFocus={!isEditing}
                            />
                        </View>

                        {/* Campo descripción */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Descripción</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.inputMultiline,
                                    descFocused && {
                                        borderColor: accentColor,
                                        backgroundColor: accentColor + "0D",
                                    },
                                ]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Detalles opcionales…"
                                placeholderTextColor={COLORS.textMuted}
                                onFocus={() => setDescFocused(true)}
                                onBlur={() => setDescFocused(false)}
                                multiline
                                numberOfLines={3}
                                maxLength={200}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Contador de caracteres */}
                        <Text style={styles.charCount}>
                            {title.length}/80
                        </Text>

                        {/* Botones */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    { backgroundColor: accentColor },
                                    (!canSave || saving) && styles.saveButtonDisabled,
                                ]}
                                onPress={handleSave}
                                activeOpacity={0.85}
                                disabled={!canSave || saving}
                            >
                                <Text style={styles.saveText}>
                                    {saving ? "Guardando…" : isEditing ? "Guardar" : "Crear"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </Pressable>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: "flex-end",
    },
    kvContainer: {
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === "ios" ? 36 : 24,
        borderTopWidth: 1,
        borderColor: COLORS.border,
    },

    // Handle
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.border,
        alignSelf: "center",
        marginTop: 12,
        marginBottom: 20,
    },

    // Cabecera
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textPrimary,
        letterSpacing: -0.4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 3,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceAlt,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    closeIcon: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: "700",
    },

    // Campos
    fieldGroup: {
        marginBottom: 16,
        gap: 6,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textSecondary,
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    input: {
        backgroundColor: COLORS.surfaceAlt,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    inputMultiline: {
        height: 80,
        paddingTop: 12,
    },
    charCount: {
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: "right",
        marginTop: -8,
        marginBottom: 20,
    },

    // Botones
    actions: {
        flexDirection: "row",
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        backgroundColor: COLORS.surfaceAlt,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    saveButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
    },
    saveButtonDisabled: {
        opacity: 0.45,
    },
    saveText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0F0F13",
    },
});