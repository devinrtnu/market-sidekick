import { z } from "zod";

/**
 * A type-safe wrapper around localStorage that uses Zod for schema validation
 */

type StorageOptions = {
  /**
   * Optional prefix to use for all storage keys
   */
  prefix?: string;
};

export class LocalStorage<T> {
  private schema: z.ZodType<T>;
  private key: string;
  
  constructor(key: string, schema: z.ZodType<T>, options: StorageOptions = {}) {
    this.schema = schema;
    this.key = options.prefix ? `${options.prefix}:${key}` : key;
  }
  
  /**
   * Get data from localStorage
   * @returns The data or null if not found or invalid
   */
  get(): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(this.key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      return this.schema.parse(parsed);
    } catch (error) {
      console.error(`Error getting item from localStorage: ${this.key}`, error);
      return null;
    }
  }
  
  /**
   * Set data in localStorage
   * @param value The data to store
   * @returns true if successful, false otherwise
   */
  set(value: T): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      // Validate data against schema before storing
      const validated = this.schema.parse(value);
      localStorage.setItem(this.key, JSON.stringify(validated));
      return true;
    } catch (error) {
      console.error(`Error setting item in localStorage: ${this.key}`, error);
      return false;
    }
  }
  
  /**
   * Remove data from localStorage
   * @returns true if successful, false otherwise
   */
  remove(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch (error) {
      console.error(`Error removing item from localStorage: ${this.key}`, error);
      return false;
    }
  }
  
  /**
   * Check if data exists in localStorage
   * @returns true if exists and valid, false otherwise
   */
  exists(): boolean {
    return this.get() !== null;
  }
  
  /**
   * Update existing data in localStorage
   * @param updater Function that receives current data and returns updated data
   * @returns true if successful, false otherwise
   */
  update(updater: (currentValue: T | null) => T): boolean {
    const current = this.get();
    return this.set(updater(current));
  }
}

/**
 * Create a collection storage that handles arrays of items with CRUD operations
 */
export class CollectionStorage<T extends { id: string | number }> {
  private storage: LocalStorage<T[]>;
  
  constructor(key: string, itemSchema: z.ZodType<T>, options: StorageOptions = {}) {
    const arraySchema = z.array(itemSchema);
    this.storage = new LocalStorage<T[]>(key, arraySchema, options);
  }
  
  /**
   * Get all items in the collection
   */
  getAll(): T[] {
    return this.storage.get() || [];
  }
  
  /**
   * Get a single item by ID
   */
  getById(id: string | number): T | undefined {
    const items = this.getAll();
    return items.find(item => item.id === id);
  }
  
  /**
   * Add a new item to the collection
   */
  add(item: T): boolean {
    const items = this.getAll();
    return this.storage.set([...items, item]);
  }
  
  /**
   * Update an existing item
   */
  update(item: T): boolean {
    const items = this.getAll();
    const index = items.findIndex(i => i.id === item.id);
    
    if (index === -1) return false;
    
    const updatedItems = [...items];
    updatedItems[index] = item;
    
    return this.storage.set(updatedItems);
  }
  
  /**
   * Remove an item by ID
   */
  remove(id: string | number): boolean {
    const items = this.getAll();
    const filtered = items.filter(item => item.id !== id);
    
    if (filtered.length === items.length) return false;
    
    return this.storage.set(filtered);
  }
  
  /**
   * Clear all items
   */
  clear(): boolean {
    return this.storage.set([]);
  }
}

/**
 * Example of creating a schema and storage for a specific type
 * 
 * ```typescript
 * // Define schema for a todo item
 * const TodoSchema = z.object({
 *   id: z.string(),
 *   title: z.string(),
 *   completed: z.boolean(),
 *   createdAt: z.number()
 * });
 * 
 * // Infer TypeScript type from the schema
 * type Todo = z.infer<typeof TodoSchema>;
 * 
 * // Create a storage instance
 * export const todoStorage = new CollectionStorage<Todo>(
 *   'todos',
 *   TodoSchema,
 *   { prefix: 'app' }
 * );
 * ```
 */ 