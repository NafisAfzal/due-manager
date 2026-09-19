const STORAGE_KEY = 'dm_tasks';
const VERSION_KEY = 'dm_version';
const CURRENT_VERSION = '2';

// One-time migration: clears any pre-existing demo data on very first load.
if(!localStorage.getItem(VERSION_KEY)){
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
}

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const counts = document.getElementById('counts');
const emptyMsg = document.getElementById('emptyMsg');
const starToggle = document.getElementById('starToggle');
const searchInput = document.getElementById('search');
const showStarredOnly = document.getElementById('showStarredOnly');
const sortByNewest = document.getElementById('sortByNewest');

let tasks = [];
try {
  tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if(!Array.isArray(tasks)) tasks = [];
} catch {
  tasks = [];
}
let nextId = tasks.length ? Math.max(...tasks.map(t=>t.id))+1 : 1;
let newTaskStarred = false;

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); render(); }

function addTask(title, starred=false){
  title = title && title.trim();
  if(!title) return;
  const task = { id: nextId++, title, starred: !!starred, completed:false, createdAt: Date.now() };
  tasks.push(task);
  save();
  taskInput.value=''; newTaskStarred=false; starToggle.textContent='☆'; starToggle.setAttribute('aria-pressed','false'); taskInput.focus();
}

function render(){
  const active = tasks.filter(t=>!t.completed);
  const q = (searchInput.value || '').toLowerCase();
  let list = active.filter(t => t.title.toLowerCase().includes(q));
  if(showStarredOnly.checked) list = list.filter(t=>t.starred);
  if(sortByNewest.checked) list.sort((a,b)=>b.createdAt - a.createdAt);
  else list.sort((a,b)=> (b.starred - a.starred) || (a.createdAt - b.createdAt));

  taskList.innerHTML='';
  if(list.length===0){ emptyMsg.style.display='block'; } else { emptyMsg.style.display='none' }
  for(const t of list){
    const li = document.createElement('li');
    li.className = 'task-item' + (t.starred ? ' starred' : '');
    li.dataset.id = t.id;

    const left = document.createElement('div');
    left.className = 'task-left';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'complete';
    checkbox.checked = t.completed;
    checkbox.setAttribute('aria-label','Mark "' + t.title + '" as complete');

    const metaWrap = document.createElement('div');
    metaWrap.className = 'task-text';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'task-title';
    titleDiv.title = t.title;
    titleDiv.textContent = t.title;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'task-meta';
    metaDiv.textContent = 'Created: ' + new Date(t.createdAt).toLocaleString();

    metaWrap.appendChild(titleDiv);
    metaWrap.appendChild(metaDiv);
    left.appendChild(checkbox);
    left.appendChild(metaWrap);

    const controls = document.createElement('div');
    controls.className = 'controls';

    const starBtn = document.createElement('button');
    starBtn.className = 'icon-btn star-btn-local';
    starBtn.title = 'Toggle important';
    starBtn.setAttribute('aria-label', (t.starred ? 'Unmark "' : 'Mark "') + t.title + '" as important');
    starBtn.setAttribute('aria-pressed', t.starred ? 'true' : 'false');
    const starSpan = document.createElement('span');
    starSpan.className = 'star';
    starSpan.textContent = t.starred ? '★' : '☆';
    starBtn.appendChild(starSpan);

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn edit-btn';
    editBtn.title = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit "' + t.title + '"');
    editBtn.textContent = '✎';

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn delete';
    delBtn.title = 'Delete';
    delBtn.setAttribute('aria-label', 'Delete "' + t.title + '"');
    delBtn.textContent = '🗑';

    controls.appendChild(starBtn);
    controls.appendChild(editBtn);
    controls.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(controls);
    taskList.appendChild(li);
  }

  const starredCount = active.filter(t=>t.starred).length;
  counts.textContent = `${active.length} active • ${starredCount} important`;
}

taskList.addEventListener('click', (e) => {
  const target = e.target;
  const li = target.closest('.task-item');
  if(!li) return;
  const id = Number(li.dataset.id);
  const task = tasks.find(t=>t.id===id);
  if(!task) return;

  if(target.closest('.complete')){
    task.completed = !task.completed;
    save();
    return;
  }

  if(target.closest('.star-btn-local')){
    task.starred = !task.starred;
    save();
    return;
  }

  if(target.closest('.delete')){
    if(confirm('Delete this task?')){
      tasks = tasks.filter(t=>t.id!==id);
      save();
    }
    return;
  }

  if(target.closest('.edit-btn')){
    const titleEl = li.querySelector('.task-title');
    startInlineEdit(titleEl, task);
    return;
  }
});

function startInlineEdit(titleEl, task){
  const prev = titleEl.textContent;
  titleEl.classList.add('editing');
  const input = document.createElement('input');
  input.type = 'text'; input.value = prev;
  input.className = 'inline-input';
  input.setAttribute('aria-label', 'Edit task');
  titleEl.replaceWith(input);
  input.focus();
  input.select();

  let done = false;

  function finish(saveEdit){
    if(done) return;
    done = true;
    const newVal = input.value.trim();
    if(saveEdit && newVal) task.title = newVal;
    input.replaceWith(titleEl);
    titleEl.textContent = task.title;
    titleEl.classList.remove('editing');
    save();
  }

  input.addEventListener('keydown', (ev)=>{
    if(ev.key === 'Enter'){ finish(true); }
    if(ev.key === 'Escape'){ finish(false); }
  });
  input.addEventListener('blur', ()=> finish(true));
}

addBtn.addEventListener('click', ()=> addTask(taskInput.value, newTaskStarred));
taskInput.addEventListener('keydown', (e)=> { if(e.key==='Enter') addTask(taskInput.value, newTaskStarred); });

starToggle.addEventListener('click', ()=>{
  newTaskStarred = !newTaskStarred;
  starToggle.textContent = newTaskStarred ? '★' : '☆';
  starToggle.setAttribute('aria-pressed', newTaskStarred ? 'true' : 'false');
});

searchInput.addEventListener('input', render);
showStarredOnly.addEventListener('change', render);
sortByNewest.addEventListener('change', render);

render();
