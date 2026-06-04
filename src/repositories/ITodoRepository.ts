// repositories/ITodoRepository.ts

import { Todo } from "../models/Todo";

/**
 * Contrato común para todos los motores de persistencia.
 * La UI y el Context SOLO hablan con esta interfaz,
 * nunca con SQLite ni MMKV directamente.
 */
export interface ITodoRepository {
    /** Devuelve todos los todos almacenados en este motor. */
    getAll(): Promise<Todo[]>;

    /** Persiste un nuevo todo. Devuelve el todo guardado. */
    create(todo: Todo): Promise<Todo>;

    /**
     * Actualiza campos parciales de un todo existente.
     * Devuelve el todo actualizado, o null si no existe.
     */
    update(id: string, data: Partial<Omit<Todo, "id" | "createdAt">>): Promise<Todo | null>;

    /** Elimina un todo por su id. Devuelve true si existía. */
    delete(id: string): Promise<boolean>;
}