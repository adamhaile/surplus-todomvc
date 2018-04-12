import S, { DataSignal } from 's-js';
import SArray from 's-array';

// our ToDo model
export const ToDo = (title : string, completed : boolean) => ({
    title: jsonable(S.value(title)),
    completed: jsonable(S.value(completed))
});

export type ToDo = typeof toDoType; const toDoType = returnType(ToDo);

// our main model
export const ToDosModel = (todos: ToDo[]) => ({
    todos: jsonable(SArray(todos))
});

export type ToDosModel = typeof toDosModelType; const toDosModelType = returnType(ToDosModel);

// A couple small utilities

// TypeScript utility: do a little generic pattern matching to extract the return type of any function.
// Lets us name that return type for usage in other function's signatures.
//     const fooReturnType = returnType(Foo);
//     type Foo = typeof fooReturnType;
export function returnType<T>(fn : (...args: any[]) => T) : T { 
    return null! as T; 
}

// Make any signal jsonable by adding a toJSON method that extracts its value during JSONization
function jsonable<T extends () => any>(s : T) : T  { 
    (s as any).toJSON = toJSON;
    return s; 
}

function toJSON(this : () => any) {
    var json = this();
    // if the value has it's own toJSON, call it now
    if (json && json.toJSON) json = json.toJSON();
    return json;
}
