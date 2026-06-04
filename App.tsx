// App.tsx

import React from "react";
import { StorageProvider } from "./src/context/StorageContext";
import { TodoListScreen } from "./src/screens/TodoListScreen";

export default function App() {
  return (
    <StorageProvider initialEngine="sqlite">
      <TodoListScreen />
    </StorageProvider>
  );
}