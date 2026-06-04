// context/StorageContext.tsx

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    ReactNode,
} from "react";
import { Todo } from "../models/Todo";
import { ITodoRepository } from "../repositories/ITodoRepository";
import { SqliteTodoRepository } from "../repositories/SqliteTodoRepository";
import { MmkvTodoRepository } from "../repositories/MmkvTodoRepository";

// ─── Logger estructurado ────────────────────────────────────────────────────

const TAG = "[StorageContext]";

function log(level: "DEBUG" | "INFO" | "ERROR", message: string, meta?: object) {
    const entry = {
        level,
        source: "context",
        message,
        timestamp: new Date().toISOString(),
        ...(meta ?? {}),
    };
    if (level === "ERROR") console.error(TAG, JSON.stringify(entry));
    else if (level === "INFO") console.info(TAG, JSON.stringify(entry));
    else console.debug(TAG, JSON.stringify(entry));
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type StorageEngine = "sqlite" | "mmkv";

interface StorageContextValue {
    /** Motor activo en este momento */
    activeEngine: StorageEngine;

    /** Cambia el motor en tiempo real y recarga la lista */
    switchEngine: (engine: StorageEngine) => Promise<void>;

    /** Lista de todos del motor activo */
    todos: Todo[];

    /** true mientras se carga o se cambia de motor */
    loading: boolean;

    /** Operaciones CRUD expuestas a la UI */
    createTodo: (title: string, description?: string) => Promise<void>;
    updateTodo: (id: string, data: Partial<Omit<Todo, "id" | "createdAt">>) => Promise<void>;
    deleteTodo: (id: string) => Promise<void>;

    /** Recarga manual (útil para pull-to-refresh) */
    refresh: () => Promise<void>;
}

// ─── Instancias de repositorios (singletons) ─────────────────────────────────
// Se crean una sola vez fuera del componente para no reinicializar
// la BD en cada render.

const repositories: Record<StorageEngine, ITodoRepository> = {
    sqlite: new SqliteTodoRepository(),
    mmkv: new MmkvTodoRepository(),
};

// ─── Context ────────────────────────────────────────────────────────────────

const StorageContext = createContext<StorageContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

interface StorageProviderProps {
    children: ReactNode;
    /** Motor inicial (por defecto SQLite) */
    initialEngine?: StorageEngine;
}

export function StorageProvider({
    children,
    initialEngine = "sqlite",
}: StorageProviderProps) {
    const [activeEngine, setActiveEngine] = useState<StorageEngine>(initialEngine);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(false);

    // Ref para acceder siempre al repositorio activo sin closures obsoletas
    const repoRef = useRef<ITodoRepository>(repositories[initialEngine]);

    // ── Helpers ────────────────────────────────────────────────────────────────

    const loadTodos = useCallback(async (repo: ITodoRepository, engine: StorageEngine) => {
        try {
            setLoading(true);
            log("DEBUG", "loadTodos()", { engine });
            const data = await repo.getAll();
            setTodos(data);
            log("INFO", "loadTodos() OK", { engine, count: data.length });
        } catch (error) {
            log("ERROR", "loadTodos() falló", { engine, error: String(error) });
            setTodos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Carga inicial ──────────────────────────────────────────────────────────

    useEffect(() => {
        log("INFO", "StorageProvider montado", { initialEngine });
        loadTodos(repositories[initialEngine], initialEngine);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── switchEngine ───────────────────────────────────────────────────────────

    const switchEngine = useCallback(
        async (engine: StorageEngine) => {
            if (engine === activeEngine) {
                log("DEBUG", "switchEngine() — mismo motor, sin cambio", { engine });
                return;
            }
            log("INFO", "switchEngine()", { from: activeEngine, to: engine });
            repoRef.current = repositories[engine];
            setActiveEngine(engine);
            await loadTodos(repositories[engine], engine);
        },
        [activeEngine, loadTodos]
    );

    // ── Operaciones CRUD ───────────────────────────────────────────────────────

    const createTodo = useCallback(
        async (title: string, description: string = "") => {
            const { createTodo: buildTodo } = await import("../models/Todo");
            const todo = buildTodo(title, description);
            log("DEBUG", "createTodo()", { engine: activeEngine, id: todo.id });
            await repoRef.current.create(todo);
            // Actualización optimista: añadir al inicio de la lista
            setTodos((prev) => [todo, ...prev]);
        },
        [activeEngine]
    );

    const updateTodo = useCallback(
        async (id: string, data: Partial<Omit<Todo, "id" | "createdAt">>) => {
            log("DEBUG", "updateTodo()", { engine: activeEngine, id });
            const updated = await repoRef.current.update(id, data);
            if (updated) {
                setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
                log("INFO", "updateTodo() OK", { engine: activeEngine, id });
            }
        },
        [activeEngine]
    );

    const deleteTodo = useCallback(
        async (id: string) => {
            log("DEBUG", "deleteTodo()", { engine: activeEngine, id });
            const deleted = await repoRef.current.delete(id);
            if (deleted) {
                setTodos((prev) => prev.filter((t) => t.id !== id));
                log("INFO", "deleteTodo() OK", { engine: activeEngine, id });
            }
        },
        [activeEngine]
    );

    const refresh = useCallback(async () => {
        await loadTodos(repoRef.current, activeEngine);
    }, [activeEngine, loadTodos]);

    // ── Valor del context ──────────────────────────────────────────────────────

    const value: StorageContextValue = {
        activeEngine,
        switchEngine,
        todos,
        loading,
        createTodo,
        updateTodo,
        deleteTodo,
        refresh,
    };

    return (
        <StorageContext.Provider value={value}>
            {children}
        </StorageContext.Provider>
    );
}

// ─── Hook de consumo ────────────────────────────────────────────────────────

/**
 * Usar dentro de cualquier componente hijo del StorageProvider.
 *
 * @example
 * const { todos, activeEngine, switchEngine } = useStorage();
 */
export function useStorage(): StorageContextValue {
    const ctx = useContext(StorageContext);
    if (!ctx) {
        throw new Error("useStorage debe usarse dentro de <StorageProvider>");
    }
    return ctx;
}