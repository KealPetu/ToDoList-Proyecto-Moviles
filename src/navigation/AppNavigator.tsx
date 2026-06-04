// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TodoListScreen } from '../screens/TodoListScreen';
import { RestScreen } from '../screens/RestScreen';
import { SecretsScreen } from '../screens/SecretsScreen';

// Tipado de las rutas
export type RootTabParamList = {
    TareasLocal: undefined;
    RedRest: undefined;
    Secretos: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false, // Ocultamos el header nativo porque ya hay uno personalizado
                tabBarStyle: {
                    backgroundColor: '#1A1A22',
                    borderTopColor: '#2E2E3E',
                },
                tabBarActiveTintColor: '#6C63FF', // El color primario
                tabBarInactiveTintColor: '#8885A8',
            }}
        >
            <Tab.Screen
                name="TareasLocal"
                component={TodoListScreen}
                options={{
                    tabBarLabel: 'Persistencia',
                    // OPCIONAL: añadir un ícono con tabBarIcon
                }}
            />
            <Tab.Screen
                name="RedRest"
                component={RestScreen}
                options={{
                    tabBarLabel: 'Red REST',
                }}
            />
            <Tab.Screen
                name="Secretos"
                component={SecretsScreen}
                options={{ 
                    tabBarLabel: 'Secretos',
                }}
            />
        </Tab.Navigator>
    );
}