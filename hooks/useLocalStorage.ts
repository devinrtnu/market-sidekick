'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { z } from 'zod';
import { LocalStorage } from '@/lib/storage';

/**
 * Custom hook for using localStorage with React state
 * 
 * @param key The key to store the value under
 * @param schema Zod schema for type validation
 * @param initialValue Initial value or function that returns the initial value
 * @param options Storage options like prefix
 * @returns [value, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(
  key: string,
  schema: z.ZodType<T>,
  initialValue: T | (() => T),
  options: { prefix?: string } = {}
) {
  // Create storage instance with useMemo to maintain reference stability
  const storage = useMemo(() => new LocalStorage<T>(key, schema, options), [key, schema, options]);
  
  // Use this ref to track if we're mounted (client-side) to prevent hydration mismatch
  const mounted = useRef(false);

  // Handle server vs client logic for initial state
  const getInitialValue = () => {
    // For SSR / first render on client, always use the initialValue to avoid hydration mismatch
    if (typeof window === 'undefined' || !mounted.current) {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
    
    try {
      // After component has mounted on client, we can safely read from localStorage
      const item = storage.get();
      
      // If found and valid, return it
      if (item !== null) {
        return item;
      }
      
      // Otherwise, return initial value
      return initialValue instanceof Function ? initialValue() : initialValue;
    } catch (error) {
      // If error, return initial value
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  };
  
  // Initialize state with initial value
  const [storedValue, setStoredValue] = useState<T>(getInitialValue);
  
  // After mount, update state with localStorage value if it exists
  useEffect(() => {
    mounted.current = true;
    
    const item = storage.get();
    if (item !== null) {
      setStoredValue(item);
    } else if (storedValue !== (initialValue instanceof Function ? initialValue() : initialValue)) {
      // If no stored value but we have a non-initial value, save it
      storage.set(storedValue);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we can use the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Only save to localStorage after component has mounted on client
      if (mounted.current) {
        storage.set(valueToStore);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [storedValue, storage, key]);
  
  // Remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      // Only remove from localStorage after component has mounted on client
      if (mounted.current) {
        storage.remove();
      }
      
      // Set state to initial value
      const initialVal = initialValue instanceof Function ? initialValue() : initialValue;
      setStoredValue(initialVal);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [initialValue, storage, key]);
  
  // Listen for changes to the key in other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    function handleStorageChange(e: StorageEvent) {
      if (e.key === storage['key'] && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          const validatedValue = schema.parse(newValue);
          setStoredValue(validatedValue);
        } catch (error) {
          console.error(`Error handling storage change for key "${key}":`, error);
        }
      }
    }
    
    // Add event listener for storage changes (for cross-tab synchronization)
    window.addEventListener('storage', handleStorageChange);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, schema, storage]);
  
  return [storedValue, setValue, removeValue] as const;
}

/**
 * Custom hook for using localStorage to manage a collection of items
 * 
 * @param key The key to store the collection under
 * @param itemSchema Zod schema for individual items
 * @param options Storage options like prefix
 * @returns Object with CRUD operations for the collection
 */
export function useCollection<T extends { id: string | number }>(
  key: string,
  itemSchema: z.ZodType<T>,
  options: { prefix?: string } = {}
) {
  const arraySchema = z.array(itemSchema);
  const [items, setItems, removeAll] = useLocalStorage<T[]>(key, arraySchema, [], options);
  
  // Create stable references for callback functions using useCallback
  
  // Get a single item by ID
  const getItem = useCallback((id: string | number) => {
    return items.find(item => item.id === id);
  }, [items]);
  
  // Add a new item
  const addItem = useCallback((item: T) => {
    setItems(current => [...current, item]);
  }, [setItems]);
  
  // Update an existing item
  const updateItem = useCallback((item: T) => {
    setItems(current => {
      const index = current.findIndex(i => i.id === item.id);
      if (index === -1) return current;
      
      const updated = [...current];
      updated[index] = item;
      return updated;
    });
  }, [setItems]);
  
  // Remove an item by ID
  const removeItem = useCallback((id: string | number) => {
    setItems(current => current.filter(item => item.id !== id));
  }, [setItems]);
  
  return {
    items,
    getItem,
    addItem,
    updateItem,
    removeItem,
    removeAll,
  };
}

/**
 * Example usage:
 * 
 * ```tsx
 * // Define a schema for your data
 * const TodoSchema = z.object({
 *   id: z.string(),
 *   title: z.string(),
 *   completed: z.boolean(),
 *   createdAt: z.number()
 * });
 * 
 * // Infer TypeScript type from schema
 * type Todo = z.infer<typeof TodoSchema>;
 * 
 * function TodoList() {
 *   // Use the hook with your schema
 *   const {
 *     items: todos,
 *     addItem: addTodo,
 *     updateItem: updateTodo,
 *     removeItem: removeTodo
 *   } = useCollection<Todo>('todos', TodoSchema, { prefix: 'app' });
 * 
 *   const handleAdd = () => {
 *     addTodo({
 *       id: crypto.randomUUID(),
 *       title: 'New Todo',
 *       completed: false,
 *       createdAt: Date.now()
 *     });
 *   };
 * 
 *   // Render todos and provide UI for CRUD operations
 *   return (
 *     <div>
 *       <button onClick={handleAdd}>Add Todo</button>
 *       <ul>
 *         {todos.map(todo => (
 *           <li key={todo.id}>
 *             <input
 *               type="checkbox"
 *               checked={todo.completed}
 *               onChange={() => updateTodo({...todo, completed: !todo.completed})}
 *             />
 *             {todo.title}
 *             <button onClick={() => removeTodo(todo.id)}>Delete</button>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */ 