import S from 's-js';
import { ToDo, ToDosModel } from './models';

const LOCAL_STORAGE_KEY = 'todos-surplus';

export function LocalStoragePersistence(model : ToDosModel) {
    // load stored todos on init
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) model.todos(JSON.parse(stored).todos.map((t : any) => ToDo(t.title, t.completed)));

    // store JSONized todos whenever they change
    S(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(model));
    });
}