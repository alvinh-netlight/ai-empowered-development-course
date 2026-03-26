import { VibeKanbanWebCompanion } from 'vibe-kanban-web-companion';
import { format, parseISO, isToday, isTomorrow, isPast, compareAsc } from 'date-fns';

// Todos array (Feature 1)
let todos = [];
let nextId = 1;

// Current filter (Feature 2)
let currentFilter = 'all';

// Sort state (Feature 3)
let sortByDueDate = false;

document.addEventListener('DOMContentLoaded', () => {
    init();
    initVibeKanban();
});

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('nextId', String(nextId));
}

function loadTodos() {
    const stored = localStorage.getItem('todos');
    todos = stored ? JSON.parse(stored) : [];
    nextId = parseInt(localStorage.getItem('nextId') || '1', 10);
}

function init() {
    loadTodos();

    // Wire up add button
    const addBtn = document.getElementById('addBtn');
    const todoInput = document.getElementById('todoInput');

    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // Wire up filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn:not(.sort-btn)');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // Wire up sort button
    document.getElementById('sortByDueDate').addEventListener('click', toggleSortByDueDate);

    renderTodos();
}

function initVibeKanban() {
    const companion = new VibeKanbanWebCompanion();
    companion.render(document.body);
}

// Feature 1: Add, toggle, delete todos
function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();

    if (text === '') return;

    const dueDateInput = document.getElementById('dueDateInput');
    const dueDate = dueDateInput.value || null;

    todos.push({
        id: nextId++,
        text: text,
        completed: false,
        dueDate: dueDate
    });

    input.value = '';
    dueDateInput.value = '';
    saveTodos();
    renderTodos();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

// Feature 3: Format due date with contextual labels
function formatDueDate(isoString) {
    if (!isoString) return null;
    const date = parseISO(isoString);
    if (isPast(date) && !isToday(date)) return { label: 'Overdue', cssClass: 'due-overdue' };
    if (isToday(date)) return { label: 'Due today', cssClass: 'due-today' };
    if (isTomorrow(date)) return { label: 'Due tomorrow', cssClass: 'due-tomorrow' };
    return { label: format(date, 'MMM d, yyyy'), cssClass: 'due-upcoming' };
}

// Feature 3: Toggle sort by due date
function toggleSortByDueDate() {
    sortByDueDate = !sortByDueDate;
    const btn = document.getElementById('sortByDueDate');
    btn.classList.toggle('active', sortByDueDate);
    renderTodos();
}

// Feature 1: Render todos
function renderTodos() {
    const todoList = document.getElementById('todoList');
    const displayedTodos = getSortedAndFilteredTodos();

    todoList.innerHTML = '';

    displayedTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        if (todo.completed) li.classList.add('completed');

        const dueDateInfo = formatDueDate(todo.dueDate);
        const dueDateHtml = dueDateInfo
            ? `<span class="todo-due-date ${dueDateInfo.cssClass}">${escapeHtml(dueDateInfo.label)}</span>`
            : '';

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            ${dueDateHtml}
            <button class="todo-delete">Delete</button>
        `;

        li.querySelector('.todo-checkbox').addEventListener('change', () => toggleTodo(todo.id));
        li.querySelector('.todo-delete').addEventListener('click', () => deleteTodo(todo.id));

        todoList.appendChild(li);
    });
}

// Feature 2: Filter todos based on current filter
function getFilteredTodos() {
    if (currentFilter === 'active') {
        return todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        return todos.filter(t => t.completed);
    }
    return todos; // 'all'
}

// Feature 3: Sort filtered todos by due date (upcoming first, no due date last)
function getSortedAndFilteredTodos() {
    const filtered = getFilteredTodos();
    if (!sortByDueDate) return filtered;

    return [...filtered].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
    });
}

// Feature 2: Set filter and update UI
function setFilter(filter) {
    currentFilter = filter;

    // Update button styling
    const filterButtons = document.querySelectorAll('.filter-btn:not(.sort-btn)');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    renderTodos();
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
