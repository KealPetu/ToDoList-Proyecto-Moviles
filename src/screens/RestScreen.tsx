// src/screens/RestScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export function RestScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Módulo REST</Text>
                <Text style={styles.subtitle}>Implementación con JSONPlaceholder</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0F13' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#F0EFF8' },
    subtitle: { fontSize: 16, color: '#8885A8' }
});