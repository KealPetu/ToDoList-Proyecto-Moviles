// __tests__/StorageContext.test.tsx
//
// Ejecutar con:  npx jest StorageContext.test.tsx

import React from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import { StorageProvider, useStorage } from "../context/StorageContext";
import { ITodoRepository } from "../repositories/ITodoRepository";
import { Todo } from "../models/Todo";

// ─── Mocks de repositorios en memoria ────────────────────────────────────────

function makeInMemoryRepo(): ITodoRepository {
    const store: Todo[] = [];
    return {
        async getAll() {
            return [...store].sort((a, b) => b.createdAt - a.createdAt);
        },
        async create(todo) {
            store.push(todo);
            return todo;
        },
        async update(id, data) {
            const idx = store.findIndex((t) => t.id === id);
            if (idx === -1) return null;
            store[idx] = { ...store[idx], ...data };
            return store[idx];
        },
        async delete(id) {
            const idx = store.findIndex((t) => t.id === id);
            if (idx === -1) return false;
            store.splice(idx, 1);
            return true;
        },
    };
}

// Sobreescribir los singletons del context con repos en memoria
jest.mock("../repositories/SqliteTodoRepository", () => ({
    SqliteTodoRepository: jest.fn().mockImplementation(() => makeInMemoryRepo()),
}));

jest.mock("../repositories/MmkvTodoRepository", () => ({
    MmkvTodoRepository: jest.fn().mockImplementation(() => makeInMemoryRepo()),
}));

// ─── Wrapper ──────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StorageProvider initialEngine="sqlite">{children}</StorageProvider>
);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useStorage — operaciones CRUD", () => {
    test("createTodo() agrega un todo a la lista", async () => {
        const { result, waitForNextUpdate } = renderHook(() => useStorage(), { wrapper });
        await waitForNextUpdate();

        await act(async () => {
            await result.current.createTodo("Primer todo", "Descripción");
        });

        expect(result.current.todos).toHaveLength(1);
        expect(result.current.todos[0].title).toBe("Primer todo");
    });

    test("updateTodo() actualiza el todo en la lista", async () => {
        const { result, waitForNextUpdate } = renderHook(() => useStorage(), { wrapper });
        await waitForNextUpdate();

        await act(async () => {
            await result.current.createTodo("Original");
        });

        const id = result.current.todos[0].id;

        await act(async () => {
            await result.current.updateTodo(id, { title: "Editado", completed: true });
        });

        const updated = result.current.todos.find((t) => t.id === id);
        expect(updated?.title).toBe("Editado");
        expect(updated?.completed).toBe(true);
    });

    test("deleteTodo() elimina el todo de la lista", async () => {
        const { result, waitForNextUpdate } = renderHook(() => useStorage(), { wrapper });
        await waitForNextUpdate();

        await act(async () => {
            await result.current.createTodo("Para borrar");
        });

        const id = result.current.todos[0].id;

        await act(async () => {
            await result.current.deleteTodo(id);
        });

        expect(result.current.todos.find((t) => t.id === id)).toBeUndefined();
    });
});

describe("useStorage — cambio de motor", () => {
    test("switchEngine() cambia activeEngine y recarga la lista vacía", async () => {
        const { result, waitForNextUpdate } = renderHook(() => useStorage(), { wrapper });
        await waitForNextUpdate();

        // Crear un todo en SQLite
        await act(async () => {
            await result.current.createTodo("Todo en SQLite");
        });
        expect(result.current.todos).toHaveLength(1);

        // Cambiar a MMKV
        await act(async () => {
            await result.current.switchEngine("mmkv");
        });

        expect(result.current.activeEngine).toBe("mmkv");
        // MMKV está vacío — los datos de SQLite no se filtran
        expect(result.current.todos).toHaveLength(0);
    });

    test("switchEngine() al mismo motor no recarga", async () => {
        const { result, waitForNextUpdate } = renderHook(() => useStorage(), { wrapper });
        await waitForNextUpdate();

        await act(async () => {
            await result.current.createTodo("Todo persistente");
        });

        // "cambiar" al mismo motor sqlite
        await act(async () => {
            await result.current.switchEngine("sqlite");
        });

        // La lista no se vacía
        expect(result.current.todos).toHaveLength(1);
        expect(result.current.activeEngine).toBe("sqlite");
    });
});