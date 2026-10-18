// Стартовая точка домашней работы.
// Спроектируйте модель ресурса, запросы и состояния самостоятельно.

const API_URL = 'http://localhost:3000/movies';

const ui = {
  status: document.querySelector('[data-ui="status"]'),
  collection: document.querySelector('[data-ui="collection"]'),
  reloadBtn: document.querySelector('[data-action="reload"]'),
  sortSelect: document.querySelector('[data-ui="sort"]'),
  form: document.querySelector('[data-form="entry"]'),
  submitBtn: document.querySelector('[data-action="submit"]'),
  searchInput: document.querySelector('[data-ui="search"]'),
};

let currentController = null;
let debounceTimer = null;    

function renderMovies(movies) {
  ui.collection.innerHTML = '';

  if (movies.length === 0) {
    ui.collection.hidden = true;
    ui.status.hidden = false;
    ui.status.className = 'status status--empty';
    ui.status.innerHTML = `<strong class="status__title">Список пуст</strong><span class="status__text">Добавьте первый фильм.</span>`;
    return;
  }

  ui.status.hidden = true;
  ui.collection.hidden = false;

  const fragment = document.createDocumentFragment();

  movies.forEach((movie) => {
    const card = createCard(movie); 
    fragment.append(card);
  });

  ui.collection.append(fragment);
}

function createCard(movie) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.id = movie.id;

  const title = document.createElement('h3');
  title.className = 'card__title';
  title.textContent = movie.title;

  const meta = document.createElement('div');
  meta.className = 'card__meta';
  
  meta.innerHTML = `
    <div class="card__meta-item"><span class="card__label">Режиссер:</span> <span class="card__value"></span></div>
    <div class="card__meta-item"><span class="card__label">Год:</span> <span class="card__value"></span></div>
    <div class="card__meta-item"><span class="card__label">Рейтинг:</span> <span class="card__value"></span></div>
  `;
  const values = meta.querySelectorAll('.card__value');
  values[0].textContent = movie.director;
  values[1].textContent = movie.year;
  values[2].textContent = movie.rating;

  const actions = document.createElement('div');
  actions.className = 'card__actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'button button--secondary';
  editBtn.textContent = 'Изменить';
  editBtn.addEventListener('click', () => openEditMode(movie, card));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'button button--danger';
  deleteBtn.textContent = 'Удалить';
  deleteBtn.style.background = '#ffebeb';
  deleteBtn.style.color = 'var(--color-danger)';
  deleteBtn.addEventListener('click', () => deleteMovie(movie.id, deleteBtn));

  actions.append(editBtn, deleteBtn);
  card.append(title, meta, actions);

  return card;
}

function openEditMode(movie, card) {
  card.classList.add('card--editing');
  card.innerHTML = ''; 

  const form = document.createElement('form');
  form.className = 'edit-form';

  const fields = [
    { name: 'title', label: 'Название', type: 'text', value: movie.title },
    { name: 'director', label: 'Режиссер', type: 'text', value: movie.director },
    { name: 'year', label: 'Год', type: 'number', value: movie.year },
    { name: 'rating', label: 'Рейтинг', type: 'number', step: '0.1', value: movie.rating }
  ];

  fields.forEach(f => {
    const label = document.createElement('label');
    label.className = 'field';
    
    const span = document.createElement('span');
    span.className = 'field__label';
    span.textContent = f.label;

    const input = document.createElement('input');
    input.className = 'field__control';
    input.name = f.name;
    input.type = f.type;
    input.value = f.value;
    input.required = true;
    if (f.step) input.step = f.step;

    label.append(span, input);
    form.append(label);
  });

  const actions = document.createElement('div');
  actions.className = 'card__actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'button button--primary';
  saveBtn.type = 'submit';
  saveBtn.textContent = 'Сохранить';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'button button--secondary';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Отмена';
  
  cancelBtn.addEventListener('click', fetchMovies); 

  actions.append(saveBtn, cancelBtn);
  form.append(actions);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.textContent = 'Сохранение...';

    const formData = new FormData(form);
    const updatedData = {
      title: formData.get('title').trim(),
      director: formData.get('director').trim(),
      year: Number(formData.get('year')),
      rating: Number(formData.get('rating')),
    };

    try {
      const response = await fetch(`${API_URL}/${movie.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      await fetchMovies(); 
    } catch (error) {
      console.error('Ошибка обновления:', error);
      alert('Не удалось сохранить изменения.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Сохранить';
    }
  });

  card.append(form);
}

async function fetchMovies() {
  ui.collection.hidden = true;
  ui.status.hidden = false;
  ui.status.className = 'status status--loading';
  ui.status.innerHTML = `<strong class="status__title">Загрузка...</strong><span class="status__text">Получаем данные от API.</span>`;
  ui.reloadBtn.disabled = true;

  // Отменяем предыдущий незавершенный запрос
  if (currentController) {
    currentController.abort();
  }
  // Создаем новый контроллер для текущего запроса
  currentController = new AbortController();

  let url = API_URL;
  const sortValue = ui.sortSelect.value;
  const searchValue = ui.searchInput.value.trim();

  // Формируем параметры
  const params = new URLSearchParams();
  if (sortValue === 'year_asc') params.append('_sort', 'year');
  if (sortValue === 'year_desc') params.append('_sort', '-year');
  if (sortValue === 'rating_desc') params.append('_sort', '-rating');
  
  // Добавляем поиск (json-server ищет по полю title)
  if (searchValue) {
        params.append('title:contains', searchValue);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  try {
    const response = await fetch(url, { 
      method: 'GET',
      signal: currentController.signal 
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const movies = await response.json();
    renderMovies(movies);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Запрос отменен: устарел или прерван');
      return; 
    }
    console.error('Ошибка загрузки:', error);
    ui.collection.hidden = true;
    ui.status.hidden = false;
    ui.status.className = 'status status--error';
    ui.status.innerHTML = `<strong class="status__title">Ошибка</strong><span class="status__text">Не удалось загрузить данные. Проверьте сервер.</span>`;
  } finally {
    ui.reloadBtn.disabled = false;
  }
}

fetchMovies();

ui.reloadBtn.addEventListener('click', fetchMovies);

const form = document.querySelector('[data-form="entry"]');
const submitBtn = document.querySelector('[data-action="submit"]');

form.addEventListener('submit', async (event) => {
  event.preventDefault(); 

  submitBtn.disabled = true;
  submitBtn.textContent = 'Отправка...';

  const formData = new FormData(form);
  
  const newMovie = {
    title: formData.get('title').trim(),
    director: formData.get('director').trim(),
    year: Number(formData.get('year')),
    rating: Number(formData.get('rating'))
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newMovie)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    form.reset();
    
    await fetchMovies(); 
    
  } catch (error) {
    console.error('Ошибка отправки:', error);
    alert('Не удалось сохранить фильм. Проверьте, запущен ли сервер.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Добавить фильм';
  }
});

ui.sortSelect.addEventListener('change', fetchMovies);

ui.searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(() => {
    fetchMovies(); 
  }, 500);
});