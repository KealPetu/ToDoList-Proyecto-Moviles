// App.tsx

import React from "react";
import { StorageProvider } from "./src/context/StorageContext";
import { NavigationContainer } from "@react-navigation/native";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <StorageProvider initialEngine="sqlite">
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </StorageProvider>
  );
}