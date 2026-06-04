// models/Todo.ts

export interface Todo {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    createdAt: number; // timestamp Unix ms
}

/**
 * Crea un Todo nuevo con valores por defecto.
 * El id se genera con Date.now() + random para evitar colisiones.
 */
export function createTodo(title: string, description: string = ""): Todo {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        description,
        completed: false,
        createdAt: Date.now(),
    };
}