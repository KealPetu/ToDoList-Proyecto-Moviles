// __tests__/repositories.test.ts
//
// Ejecutar con:  npx jest repositories.test.ts
//
// Estos tests validan:
//  1. Escritura y lectura en SqliteTodoRepository
//  2. Escritura y lectura en MmkvTodoRepository
//  3. Independencia de datos entre motores (el núcleo del examen)

import { createTodo } from "../models/Todo";
import { SqliteTodoRepository } from "../repositories/SqliteTodoRepository";
import { MmkvTodoRepository } from "../repositories/MmkvTodoRepository";
import { ITodoRepository } from "../repositories/ITodoRepository";

// ─── Mocks ───────────────────────────────────────────────────────────────────
// expo-sqlite y react-native-mmkv no existen en el entorno de Node/Jest,
// por lo que los reemplazamos con implementaciones en memoria.

jest.mock("expo-sqlite", () => {
    const rows: Record<string, any> = {};

    return {
        openDatabaseSync: () => ({
            execSync: jest.fn(),
            runSync: jest.fn((_sql: string, params: any[]) => {
                const sql = _sql.trim().toUpperCase();
                if (sql.startsWith("INSERT")) {
                    const [id, title, description, completed, created_at] = params;
                    rows[id] = { id, title, description, completed, created_at };
                } else if (sql.startsWith("UPDATE")) {
                    const [title, description, completed, id] = params;
                    if (rows[id]) Object.assign(rows[id], { title, description, completed });
                } else if (sql.startsWith("DELETE")) {
                    delete rows[params[0]];
                }
                return { changes: 1 };
            }),
            getAllSync: jest.fn(() => Object.values(rows)),
            getFirstSync: jest.fn((_sql: string, params: any[]) => rows[params[0]] ?? null),
        }),
    };
});

jest.mock("react-native-mmkv", () => {
    const stores: Record<string, Record<string, string>> = {};

    return {
        MMKV: jest.fn().mockImplementation(({ id }: { id: string }) => {
            if (!stores[id]) stores[id] = {};
            const store = stores[id];
            return {
                getString: jest.fn((key: string) => store[key]),
                set: jest.fn((key: string, value: string) => { store[key] = value; }),
                delete: jest.fn((key: string) => { delete store[key]; }),
            };
        }),
    };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildRepo(engine: "sqlite" | "mmkv"): ITodoRepository {
    return engine === "sqlite"
        ? new SqliteTodoRepository()
        : new MmkvTodoRepository();
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SqliteTodoRepository", () => {
    let repo: ITodoRepository;

    beforeEach(() => {
        repo = buildRepo("sqlite");
    });

    test("create() persiste un todo y getAll() lo devuelve", async () => {
        const todo = createTodo("Comprar leche", "En el supermercado");
        await repo.create(todo);

        const todos = await repo.getAll();
        expect(todos.length).toBeGreaterThanOrEqual(1);
        expect(todos.find((t) => t.id === todo.id)).toBeDefined();
    });

    test("update() modifica los campos correctos", async () => {
        const todo = createTodo("Tarea inicial");
        await repo.create(todo);

        const updated = await repo.update(todo.id, { title: "Tarea actualizada", completed: true });
        expect(updated).not.toBeNull();
        expect(updated!.title).toBe("Tarea actualizada");
        expect(updated!.completed).toBe(true);
    });

    test("delete() elimina el todo y devuelve true", async () => {
        const todo = createTodo("Eliminar esto");
        await repo.create(todo);

        const deleted = await repo.delete(todo.id);
        expect(deleted).toBe(true);
    });

    test("delete() devuelve false si el id no existe", async () => {
        const deleted = await repo.delete("id-inexistente-123");
        expect(deleted).toBe(false);
    });
});

describe("MmkvTodoRepository", () => {
    let repo: ITodoRepository;

    beforeEach(() => {
        repo = buildRepo("mmkv");
    });

    test("create() persiste un todo y getAll() lo devuelve", async () => {
        const todo = createTodo("Leer libro", "Capítulo 5");
        await repo.create(todo);

        const todos = await repo.getAll();
        expect(todos.find((t) => t.id === todo.id)).toBeDefined();
    });

    test("update() actualiza los campos sin crear uno nuevo", async () => {
        const todo = createTodo("Original");
        await repo.create(todo);

        const updated = await repo.update(todo.id, { completed: true });
        expect(updated!.id).toBe(todo.id);
        expect(updated!.completed).toBe(true);
        expect(updated!.title).toBe("Original"); // no cambia
    });

    test("delete() elimina el todo del índice y el documento", async () => {
        const todo = createTodo("Borrar este");
        await repo.create(todo);

        await repo.delete(todo.id);
        const todos = await repo.getAll();
        expect(todos.find((t) => t.id === todo.id)).toBeUndefined();
    });
});

describe("Independencia de datos entre motores", () => {
    test("un todo creado en SQLite NO aparece en MMKV", async () => {
        const sqliteRepo = buildRepo("sqlite");
        const mmkvRepo = buildRepo("mmkv");

        const todo = createTodo("Solo en SQLite");
        await sqliteRepo.create(todo);

        const mmkvTodos = await mmkvRepo.getAll();
        expect(mmkvTodos.find((t) => t.id === todo.id)).toBeUndefined();
    });

    test("un todo creado en MMKV NO aparece en SQLite", async () => {
        const sqliteRepo = buildRepo("sqlite");
        const mmkvRepo = buildRepo("mmkv");

        const todo = createTodo("Solo en MMKV");
        await mmkvRepo.create(todo);

        const sqliteTodos = await sqliteRepo.getAll();
        expect(sqliteTodos.find((t) => t.id === todo.id)).toBeUndefined();
    });
});