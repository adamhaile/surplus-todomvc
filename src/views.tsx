import * as Surplus from 'surplus'; Surplus;
import { mapSample } from 's-array';
import * as cx from 'classnames';
import data from 'surplus-mixin-data';
import onkey from 'surplus-mixin-onkey';
import focus from 'surplus-mixin-focus';

import { ToDosCtrl } from './controllers';

export const AppView = (ctrl : ToDosCtrl) =>
    <section>
        <section className="todoapp">
            <header className="header">
                <h1>todos</h1>
                <input className="new-todo" placeholder="What needs to be done?" autoFocus={true} 
                    fn1={data(ctrl.newTitle, 'keydown')} 
                    fn2={onkey('enter', ctrl.create)}
					fn3={onkey('esc', () => ctrl.newTitle(''))} />
            </header>
            <section className="main" hidden={ctrl.all().length === 0}>
                <input className="toggle-all" type="checkbox" 
                    checked={ctrl.allCompleted()} />
                <label htmlFor="toggle-all" onClick={() => ctrl.setAll(!ctrl.allCompleted())}>Mark all as complete</label>
                <ul className="todo-list">
                    {mapSample(ctrl.displayed, todo =>
                        <li className={cx({ completed: todo.completed(), editing: todo.editing() })}>
                            <div className="view">
                                <input className="toggle" type="checkbox" fn={data(todo.completed)} />
                                <label onDoubleClick={todo.startEditing}>{todo.title()}</label>
                                <button className="destroy" onClick={todo.remove}></button>
                            </div>
                            <input className="edit" 
                                fn1={data(todo.title, 'keyup')}
                                onBlur={() => todo.endEditing(true)}
							    fn2={onkey('enter', () => todo.endEditing(true))}
							    fn3={onkey('esc', () => todo.endEditing(false))}
							    fn4={focus(todo.editing())} />
                        </li>
                    )}
                </ul>
            </section>
            <footer className="footer" hidden={ctrl.all().length === 0}>
                <span className="todo-count"><strong>{ctrl.remaining().length}</strong> item{ctrl.remaining().length === 1 ? '' : 's'} left</span>
                <ul className="filters">
                    <li>
                        <a className={cx({ selected: ctrl.filter() === null })} href="#/">All</a>
                    </li>
                    <li>
                        <a className={cx({ selected: ctrl.filter() === false })} href="#/active">Active</a>
                    </li>
                    <li>
                        <a className={cx({ selected: ctrl.filter() === true })} href="#/completed">Completed</a>
                    </li>
                </ul>
                <button className="clear-completed" onClick={ctrl.clearCompleted} hidden={ctrl.completed().length === 0}>Clear completed</button>
            </footer>
        </section>
        <footer className="info">
            <p>Double-click to edit a todo</p>
            <p>Template by <a href="http://sindresorhus.com">Sindre Sorhus</a></p>
            <p>Created by <a href="https://github.com/adamhaile">Adam Haile</a></p>
            <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
        </footer>
    </section>;
