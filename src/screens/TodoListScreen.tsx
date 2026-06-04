// screens/TodoListScreen.tsx

import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Switch,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    SafeAreaView,
    Platform,
} from "react-native";
import { useStorage } from "../context/StorageContext";
import { Todo } from "../models/Todo";
import { TodoItem } from "../components/TodoItem";
import { TodoModal } from "../components/TodoModal";

// ─── Paleta ─────────────────────────────────────────────────────────────────

const COLORS = {
    bg: "#0F0F13",
    surface: "#1A1A22",
    surfaceAlt: "#22222E",
    border: "#2E2E3E",
    primary: "#6C63FF",
    primaryDim: "#6C63FF22",
    accent: "#FF6584",
    sqlite: "#3ECF8E",     // verde esmeralda → SQLite
    sqliteDim: "#3ECF8E22",
    mmkv: "#F97316",       // naranja → MMKV
    mmkvDim: "#F9731622",
    textPrimary: "#F0EFF8",
    textSecondary: "#8885A8",
    textMuted: "#4E4D6A",
};

// ─── Chip de origen activo ───────────────────────────────────────────────────

function EngineChip({ engine }: { engine: "sqlite" | "mmkv" }) {
    const isSqlite = engine === "sqlite";
    return (
        <View
            style={[
                styles.chip,
                {
                    backgroundColor: isSqlite ? COLORS.sqliteDim : COLORS.mmkvDim,
                    borderColor: isSqlite ? COLORS.sqlite : COLORS.mmkv,
                },
            ]}
        >
            <View
                style={[
                    styles.chipDot,
                    { backgroundColor: isSqlite ? COLORS.sqlite : COLORS.mmkv },
                ]}
            />
            <Text
                style={[
                    styles.chipText,
                    { color: isSqlite ? COLORS.sqlite : COLORS.mmkv },
                ]}
            >
                {isSqlite ? "SQLite" : "MMKV"}
            </Text>
        </View>
    );
}

// ─── Pantalla principal ──────────────────────────────────────────────────────

export function TodoListScreen() {
    const {
        todos,
        loading,
        activeEngine,
        switchEngine,
        createTodo,
        updateTodo,
        deleteTodo,
        refresh,
    } = useStorage();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    const isMmkv = activeEngine === "mmkv";

    // ── Handlers ────────────────────────────────────────────────────────────────

    const handleSwitchToggle = useCallback(
        (value: boolean) => {
            switchEngine(value ? "mmkv" : "sqlite");
        },
        [switchEngine]
    );

    const handleOpenCreate = useCallback(() => {
        setEditingTodo(null);
        setModalVisible(true);
    }, []);

    const handleOpenEdit = useCallback((todo: Todo) => {
        setEditingTodo(todo);
        setModalVisible(true);
    }, []);

    const handleSave = useCallback(
        async (title: string, description: string) => {
            if (editingTodo) {
                await updateTodo(editingTodo.id, { title, description });
            } else {
                await createTodo(title, description);
            }
            setModalVisible(false);
        },
        [editingTodo, createTodo, updateTodo]
    );

    const handleToggleComplete = useCallback(
        (todo: Todo) => {
            updateTodo(todo.id, { completed: !todo.completed });
        },
        [updateTodo]
    );

    const handleDelete = useCallback(
        (id: string) => {
            deleteTodo(id);
        },
        [deleteTodo]
    );

    // ── Render vacío ─────────────────────────────────────────────────────────

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>◈</Text>
                <Text style={styles.emptyTitle}>Sin tareas</Text>
                <Text style={styles.emptySubtitle}>
                    Motor activo: {activeEngine.toUpperCase()}
                </Text>
            </View>
        );
    };

    // ── AppBar ────────────────────────────────────────────────────────────────

    const renderHeader = () => (
        <View style={styles.appBar}>
            {/* Título + chip */}
            <View style={styles.appBarLeft}>
                <Text style={styles.appBarTitle}>Tareas</Text>
                <EngineChip engine={activeEngine} />
            </View>

            {/* Switch de motor */}
            <View style={styles.appBarRight}>
                <Text style={[styles.switchLabel, !isMmkv && styles.switchLabelActive]}>
                    SQL
                </Text>
                <Switch
                    value={isMmkv}
                    onValueChange={handleSwitchToggle}
                    trackColor={{ false: COLORS.sqliteDim, true: COLORS.mmkvDim }}
                    thumbColor={isMmkv ? COLORS.mmkv : COLORS.sqlite}
                    ios_backgroundColor={COLORS.border}
                    style={styles.switch}
                />
                <Text style={[styles.switchLabel, isMmkv && styles.switchLabelActive]}>
                    MMKV
                </Text>
            </View>
        </View>
    );

    // ── Separador de sección ──────────────────────────────────────────────────

    const renderSectionHeader = () => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
                {todos.length} {todos.length === 1 ? "tarea" : "tareas"}
            </Text>
            <View style={styles.sectionLine} />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

            {renderHeader()}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        color={isMmkv ? COLORS.mmkv : COLORS.sqlite}
                        size="large"
                    />
                    <Text style={styles.loadingText}>Cargando desde {activeEngine}…</Text>
                </View>
            ) : (
                <FlatList
                    data={todos}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        todos.length === 0 && styles.listContentEmpty,
                    ]}
                    ListHeaderComponent={todos.length > 0 ? renderSectionHeader : null}
                    ListEmptyComponent={renderEmpty}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={refresh}
                            tintColor={isMmkv ? COLORS.mmkv : COLORS.sqlite}
                            colors={[isMmkv ? COLORS.mmkv : COLORS.sqlite]}
                        />
                    }
                    renderItem={({ item }) => (
                        <TodoItem
                            todo={item}
                            accentColor={isMmkv ? COLORS.mmkv : COLORS.sqlite}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleOpenEdit}
                            onDelete={handleDelete}
                        />
                    )}
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={[
                    styles.fab,
                    { backgroundColor: isMmkv ? COLORS.mmkv : COLORS.sqlite },
                ]}
                onPress={handleOpenCreate}
                activeOpacity={0.85}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Modal de creación / edición */}
            <TodoModal
                visible={modalVisible}
                todo={editingTodo}
                accentColor={isMmkv ? COLORS.mmkv : COLORS.sqlite}
                onSave={handleSave}
                onClose={() => setModalVisible(false)}
            />
        </SafeAreaView>
    );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    // AppBar
    appBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.bg,
    },
    appBarLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    appBarTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    appBarRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    switch: {
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
    },
    switchLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textMuted,
        letterSpacing: 0.5,
    },
    switchLabelActive: {
        color: COLORS.textSecondary,
    },

    // Chip de origen
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    chipText: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.6,
    },

    // Lista
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
        paddingTop: 8,
    },
    listContentEmpty: {
        flexGrow: 1,
    },
    separator: {
        height: 8,
    },

    // Sección header
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
        marginTop: 4,
    },
    sectionLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: "600",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    sectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },

    // Empty
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingBottom: 80,
    },
    emptyIcon: {
        fontSize: 40,
        color: COLORS.textMuted,
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textSecondary,
    },
    emptySubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
    },

    // FAB
    fab: {
        position: "absolute",
        bottom: 32,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabIcon: {
        fontSize: 28,
        color: "#0F0F13",
        fontWeight: "700",
        lineHeight: 32,
    },
});