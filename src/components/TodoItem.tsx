// components/TodoItem.tsx

import React, { useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    PanResponder,
    Alert,
    Platform,
    ToastAndroid,
} from "react-native";
import { Todo } from "../models/Todo";

const COLORS = {
    surface: "#1A1A22",
    surfaceAlt: "#22222E",
    border: "#2E2E3E",
    textPrimary: "#F0EFF8",
    textSecondary: "#8885A8",
    textMuted: "#4E4D6A",
    danger: "#FF4D6D",
    dangerDim: "#FF4D6D18",
};

const SWIPE_THRESHOLD = -80;

interface TodoItemProps {
    todo: Todo;
    accentColor: string;
    onToggleComplete: (todo: Todo) => void;
    onEdit: (todo: Todo) => void;
    onDelete: (id: string) => Promise<void>;
}

export function TodoItem({
    todo,
    accentColor,
    onToggleComplete,
    onEdit,
    onDelete,
}: TodoItemProps) {
    const translateX = useRef(new Animated.Value(0)).current;
    const deleteOpacity = useRef(new Animated.Value(0)).current;

    // ── Swipe para revelar botón de borrado ──────────────────────────────────

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) =>
                Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
            onPanResponderMove: (_, g) => {
                const x = Math.min(0, Math.max(-120, g.dx));
                translateX.setValue(x);
                deleteOpacity.setValue(Math.min(1, -x / 80));
            },
            onPanResponderRelease: (_, g) => {
                if (g.dx < SWIPE_THRESHOLD) {
                    // Dejar abierto
                    Animated.spring(translateX, {
                        toValue: -80,
                        useNativeDriver: true,
                    }).start();
                } else {
                    // Cerrar
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                    deleteOpacity.setValue(0);
                }
            },
        })
    ).current;

    const handleDeletePress = () => {
        Alert.alert("Eliminar tarea", `¿Seguro que quieres borrar "${todo.title}"?`, [
            {
                text: "Cancelar",
                style: "cancel",
                onPress: () => {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                    deleteOpacity.setValue(0);
                },
            },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    await onDelete(todo.id);
                    if (Platform.OS === "android") {
                        ToastAndroid.show("Tarea eliminada", ToastAndroid.SHORT);
                    }
                },
            },
        ]);
    };

    // ── Fecha formateada ──────────────────────────────────────────────────────

    const formattedDate = new Date(todo.createdAt).toLocaleDateString("es-EC", {
        day: "numeric",
        month: "short",
    });

    return (
        <View style={styles.rowWrapper}>
            {/* Fondo de borrado (se revela con swipe) */}
            <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeletePress}
                    activeOpacity={0.8}
                >
                    <Text style={styles.deleteIcon}>✕</Text>
                    <Text style={styles.deleteLabel}>Borrar</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Tarjeta principal */}
            <Animated.View
                style={[styles.card, { transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
            >
                {/* Borde izquierdo de acento (cambia con el motor) */}
                <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                {/* Checkbox */}
                <TouchableOpacity
                    style={[
                        styles.checkbox,
                        todo.completed && {
                            backgroundColor: accentColor + "33",
                            borderColor: accentColor,
                        },
                    ]}
                    onPress={() => onToggleComplete(todo)}
                    activeOpacity={0.7}
                >
                    {todo.completed && (
                        <Text style={[styles.checkmark, { color: accentColor }]}>✓</Text>
                    )}
                </TouchableOpacity>

                {/* Contenido */}
                <TouchableOpacity
                    style={styles.content}
                    onPress={() => onEdit(todo)}
                    onLongPress={handleDeletePress}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.title,
                            todo.completed && styles.titleCompleted,
                        ]}
                        numberOfLines={1}
                    >
                        {todo.title}
                    </Text>
                    {todo.description ? (
                        <Text style={styles.description} numberOfLines={2}>
                            {todo.description}
                        </Text>
                    ) : null}
                    <Text style={styles.date}>{formattedDate}</Text>
                </TouchableOpacity>

                {/* Indicador de estado */}
                {todo.completed && (
                    <View style={[styles.badge, { borderColor: accentColor + "55" }]}>
                        <Text style={[styles.badgeText, { color: accentColor }]}>Hecho</Text>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    rowWrapper: {
        position: "relative",
    },

    // Fondo de borrado
    deleteBackground: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
        backgroundColor: COLORS.dangerDim,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.danger + "44",
        alignItems: "center",
        justifyContent: "center",
    },
    deleteButton: {
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        padding: 8,
    },
    deleteIcon: {
        fontSize: 16,
        color: COLORS.danger,
        fontWeight: "700",
    },
    deleteLabel: {
        fontSize: 10,
        color: COLORS.danger,
        fontWeight: "600",
        letterSpacing: 0.3,
    },

    // Tarjeta
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
        minHeight: 68,
    },
    accentBar: {
        width: 3,
        alignSelf: "stretch",
    },

    // Checkbox
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        marginLeft: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    checkmark: {
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 16,
    },

    // Contenido textual
    content: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        gap: 3,
    },
    title: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textPrimary,
        letterSpacing: -0.2,
    },
    titleCompleted: {
        color: COLORS.textMuted,
        textDecorationLine: "line-through",
    },
    description: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    date: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 2,
    },

    // Badge "Hecho"
    badge: {
        marginRight: 14,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.4,
    },
});