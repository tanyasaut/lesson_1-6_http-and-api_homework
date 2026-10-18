// Стартовая точка домашней работы.
// Спроектируйте модель ресурса, запросы и состояния самостоятельно.

const API_URL = 'http://localhost:3000/movies';

const ui = {
  status: document.querySelector('[data-ui="status"]'),
  collection: document.querySelector('[data-ui="collection"]'),
  reloadBtn: document.querySelector('[data-action="reload"]'),
};

function renderMovies(movies) {
  ui.collection.innerHTML = ''; 
  
  if (movies.length === 0) {
    ui.collection.hidden = true;
    ui.status.hidden = false;
    ui.status.innerHTML = `<strong class="status__title">Список пуст</strong><span class="status__text">Добавьте первый фильм.</span>`;
    return;
  }

  ui.status.hidden = true;
  ui.collection.hidden = false;

  const fragment = document.createDocumentFragment();

  movies.forEach((movie) => {
    const card = document.createElement('article');
    card.className = 'card';

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

    card.append(title, meta);
    fragment.append(card);
  });

  ui.collection.append(fragment);
}

async function fetchMovies() {
  ui.collection.hidden = true;
  ui.status.hidden = false;
  ui.status.className = 'status status--loading';
  ui.status.innerHTML = `<strong class="status__title">Загрузка...</strong><span class="status__text">Получаем данные от API.</span>`;
  ui.reloadBtn.disabled = true;

  try {
    const response = await fetch(API_URL, { method: 'GET' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const movies = await response.json();
    
    renderMovies(movies);
    
  } catch (error) {
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