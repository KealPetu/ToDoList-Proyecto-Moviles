// repositories/SqliteTodoRepository.ts

import * as SQLite from "expo-sqlite";
import { Todo } from "../models/Todo";
import { ITodoRepository } from "./ITodoRepository";

// ─── Logger estructurado ────────────────────────────────────────────────────

const TAG = "[SqliteTodoRepository]";

function log(level: "DEBUG" | "INFO" | "ERROR", message: string, meta?: object) {
    const entry = {
        level,
        source: "sqlite",
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

// ─── Implementación ─────────────────────────────────────────────────────────

export class SqliteTodoRepository implements ITodoRepository {
    private db: SQLite.SQLiteDatabase;

    constructor() {
        // expo-sqlite abre (o crea) el archivo .db en el dispositivo
        this.db = SQLite.openDatabaseSync("todos.db");
        this.init();
    }

    /** Crea la tabla si no existe. Se llama una sola vez al instanciar. */
    private init(): void {
        try {
            this.db.execSync(`
        CREATE TABLE IF NOT EXISTS todos (
          id          TEXT PRIMARY KEY NOT NULL,
          title       TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          completed   INTEGER NOT NULL DEFAULT 0,
          created_at  INTEGER NOT NULL
        );
      `);
            log("INFO", "Tabla 'todos' lista");
        } catch (error) {
            log("ERROR", "Error al inicializar tabla", { error: String(error) });
            throw error;
        }
    }

    async getAll(): Promise<Todo[]> {
        try {
            log("DEBUG", "getAll()");
            const rows = this.db.getAllSync<{
                id: string;
                title: string;
                description: string;
                completed: number;
                created_at: number;
            }>("SELECT * FROM todos ORDER BY created_at DESC;");

            const todos: Todo[] = rows.map((row) => ({
                id: row.id,
                title: row.title,
                description: row.description,
                completed: row.completed === 1,
                createdAt: row.created_at,
            }));

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
            this.db.runSync(
                `INSERT INTO todos (id, title, description, completed, created_at)
         VALUES (?, ?, ?, ?, ?);`,
                [todo.id, todo.title, todo.description, todo.completed ? 1 : 0, todo.createdAt]
            );
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

            // Recuperar el registro actual
            const existing = this.db.getFirstSync<{
                id: string;
                title: string;
                description: string;
                completed: number;
                created_at: number;
            }>("SELECT * FROM todos WHERE id = ?;", [id]);

            if (!existing) {
                log("INFO", "update() — id no encontrado", { id });
                return null;
            }

            const updated: Todo = {
                id: existing.id,
                title: data.title ?? existing.title,
                description: data.description ?? existing.description,
                completed: data.completed ?? existing.completed === 1,
                createdAt: existing.created_at,
            };

            this.db.runSync(
                `UPDATE todos
         SET title = ?, description = ?, completed = ?
         WHERE id = ?;`,
                [updated.title, updated.description, updated.completed ? 1 : 0, id]
            );

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
            const result = this.db.runSync("DELETE FROM todos WHERE id = ?;", [id]);
            const deleted = result.changes > 0;
            log("INFO", "delete()", { id, deleted });
            return deleted;
        } catch (error) {
            log("ERROR", "delete() falló", { id, error: String(error) });
            throw error;
        }
    }
}