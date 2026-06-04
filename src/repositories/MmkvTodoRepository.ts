// repositories/MmkvTodoRepository.ts

import { MMKV, createMMKV } from "react-native-mmkv";
import { Todo } from "../models/Todo";
import { ITodoRepository } from "./ITodoRepository";

// ─── Logger estructurado ────────────────────────────────────────────────────

const TAG = "[MmkvTodoRepository]";

function log(level: "DEBUG" | "INFO" | "ERROR", message: string, meta?: object) {
    const entry = {
        level,
        source: "mmkv",
        message,
        timestamp: new Date().toISOString(),
        ...(meta ?? {}),
    };
    if (level === "ERROR") {
        console.error(TAG, JSON.stringify(entry));
    } else if (level === "INFO") {
        console.info(TAG, JSON.stringify(entry));
    } else {
        console.debug(TAG, JSON.stringify(entry));
    }
}

// ─── Constantes de almacenamiento ───────────────────────────────────────────

/**
 * MMKV usa un espacio de nombres propio ('todos-store') para no
 * colisionar con otras claves de la app.
 *
 * Estrategia de clave-valor:
 *  - "todos:index"  → JSON.stringify(string[])  — lista de ids
 *  - "todos:<id>"   → JSON.stringify(Todo)       — documento individual
 */
const STORE_ID = "todos-store";
const INDEX_KEY = "todos:index";

// ─── Implementación ─────────────────────────────────────────────────────────

export class MmkvTodoRepository implements ITodoRepository {
    private storage: MMKV;

    constructor() {
        this.storage = createMMKV({ id: STORE_ID });
        log("INFO", "MMKV storage listo", { storeId: STORE_ID });
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    /** Lee el índice de ids almacenado. */
    private readIndex(): string[] {
        const raw = this.storage.getString(INDEX_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw) as string[];
        } catch {
            log("ERROR", "Índice corrompido, reiniciando", {});
            return [];
        }
    }

    /** Escribe el índice de ids. */
    private writeIndex(ids: string[]): void {
        this.storage.set(INDEX_KEY, JSON.stringify(ids));
    }

    /** Lee un Todo por id. Devuelve null si no existe o está corrompido. */
    private readTodo(id: string): Todo | null {
        const raw = this.storage.getString(`todos:${id}`);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as Todo;
        } catch {
            log("ERROR", "Documento corrompido", { id });
            return null;
        }
    }

    /** Persiste un Todo por id. */
    private writeTodo(todo: Todo): void {
        this.storage.set(`todos:${todo.id}`, JSON.stringify(todo));
    }

    // ── Métodos del contrato ──────────────────────────────────────────────────

    async getAll(): Promise<Todo[]> {
        try {
            log("DEBUG", "getAll()");
            const ids = this.readIndex();
            const todos: Todo[] = [];

            for (const id of ids) {
                const todo = this.readTodo(id);
                if (todo) todos.push(todo);
            }

            // Ordenar por createdAt descendente (igual que SQLite)
            todos.sort((a, b) => b.createdAt - a.createdAt);

            log("INFO", "getAll() OK", { count: todos.length });
            return todos;
        } catch (error) {
            log("ERROR", "getAll() falló", { error: String(error) });
            throw error;
        }
    }

    async create(todo: Todo): Promise<Todo> {
        try {
            log("DEBUG", "create()", { id: todo.id });

            // 1. Guardar el documento
            this.writeTodo(todo);

            // 2. Actualizar el índice
            const ids = this.readIndex();
            if (!ids.includes(todo.id)) {
                ids.push(todo.id);
                this.writeIndex(ids);
            }

            log("INFO", "create() OK", { id: todo.id, title: todo.title });
            return todo;
        } catch (error) {
            log("ERROR", "create() falló", { id: todo.id, error: String(error) });
            throw error;
        }
    }

    async update(
        id: string,
        data: Partial<Omit<Todo, "id" | "createdAt">>
    ): Promise<Todo | null> {
        try {
            log("DEBUG", "update()", { id, data });

            const existing = this.readTodo(id);
            if (!existing) {
                log("INFO", "update() — id no encontrado", { id });
                return null;
            }

            const updated: Todo = { ...existing, ...data };
            this.writeTodo(updated);

            log("INFO", "update() OK", { id });
            return updated;
        } catch (error) {
            log("ERROR", "update() falló", { id, error: String(error) });
            throw error;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            log("DEBUG", "delete()", { id });

            const exists = this.readTodo(id) !== null;
            if (!exists) {
                log("INFO", "delete() — id no encontrado", { id });
                return false;
            }

            // 1. Borrar el documento
            this.storage.remove(`todos:${id}`);

            // 2. Quitar del índice
            const ids = this.readIndex().filter((i) => i !== id);
            this.writeIndex(ids);

            log("INFO", "delete() OK", { id });
            return true;
        } catch (error) {
            log("ERROR", "delete() falló", { id, error: String(error) });
            throw error;
        }
    }
}