import S from 's-js';
import { ToDo, ToDosModel, returnType } from './models';

export type ToDosCtrl = typeof toDosCtrlType; const toDosCtrlType = returnType(ToDosCtrl);
export function ToDosCtrl({ todos } : ToDosModel) {
    const editing = S.value(null as null | ToDo), // the todo selected for editing, or null if none selected
        filter    = S.value(null as null | boolean), // null = no filtering, true = only completed, false = only incomplete
        newTitle  = S.value(''),
        all       = todos.map(ToDoCtrl),
        completed = all.filter(t => t.completed()),
        remaining = all.filter(t => !t.completed()),
        displayed = () => filter() === null ? all() : filter() ? completed() : remaining();

    return {
        filter,
        newTitle,
        all,
        completed,
        remaining,
        displayed,
        allCompleted  : () => all().length > 0 && remaining().length === 0,
        setAll        : (c : boolean) => S.freeze(() => todos().forEach(t => t.completed(c))),
        clearCompleted: () => todos(todos().filter(t => !t.completed())),
        create        : () => {
            var title = newTitle().trim();
            if (title) {
                newTitle("");
                todos.unshift(ToDo(title, false));
            }
        }
    };

    function ToDoCtrl(todo : ToDo) {
        const title = S.value(S.sample(todo.title));
        return {
            title,
            completed   : todo.completed,
            remove      : () => todos.remove(todo),
            startEditing: () => editing(todo),
            editing     : () => editing() === todo,
            endEditing  : (commit : boolean) => {
                if (commit) {
                    var trimmed = title().trim();
                    if (trimmed) {
                        todo.title(title(trimmed));
                    } else {
                        todos.remove(todo);
                    }
                } else {
                    title(todo.title());
                }
                editing(null);
            }
        };
    }
}