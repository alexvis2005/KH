// ⚙️ Настройки
const CONFIG = {
  dataPath: 'data',
  maxVideos: 20 // защита от лагов при 100+ файлах
};

// Основная функция загрузки
async function loadVideos() {
  const horizontalContainer = document.getElementById('horizontal-videos');
  const verticalContainer = document.getElementById('vertical-videos');

  try {
    // Читаем содержимое папок
    const [horizontalFiles, verticalFiles] = await Promise.all([
      getVideoFiles(`${CONFIG.dataPath}/horizontal/`),
      getVideoFiles(`${CONFIG.dataPath}/vertical/`)
    ]);

    // Рендерим
    renderVideos(horizontalContainer, horizontalFiles, 'horizontal');
    renderVideos(verticalContainer, verticalFiles, 'vertical');

  } catch (err) {
    console.warn('Не удалось загрузить видео:', err);
    // Можно показать fallback-надпись
  }
}

// Получаем список файлов из папки (через fetch + HEAD-запросы)
async function getVideoFiles(dir) {
  const files = [];
  let i = 1;

  while (files.length < CONFIG.maxVideos) {
    const name = `video${i}`;
    const mp4Url = `${dir}${name}.mp4`;
    const webmUrl = `${dir}${name}.webm`;
    const txtUrl = `${dir}${name}.txt`;

    // Проверяем, существует ли файл
    try {
      // Сначала пробуем .mp4
      const res = await fetch(mp4Url, { method: 'HEAD' });
      if (res.ok) {
        files.push({ type: 'mp4', url: mp4Url });
        i++; continue;
      }

      // Потом .webm
      const res2 = await fetch(webmUrl, { method: 'HEAD' });
      if (res2.ok) {
        files.push({ type: 'webm', url: webmUrl });
        i++; continue;
      }

      // Потом .txt (для YouTube)
      const res3 = await fetch(txtUrl, { method: 'GET' });
      if (res3.ok) {
        const text = await res3.text();
        const url = text.trim();
        if (url) files.push({ type: 'youtube', url });
        i++; continue;
      }

      // Если ничего нет — выходим
      break;
    } catch (e) {
      break;
    }
  }

  return files;
}

// Рендер видео
function renderVideos(container, files, orientation) {
  container.innerHTML = files.length
    ? files.map(video => createVideoCard(video, orientation)).join('')
    : `<p class="empty">Пока нет видео. Добавьте файлы в папку <code>data/${orientation}/</code></p>`;
}

function createVideoCard(video, orientation) {
  let content = '';

  if (video.type === 'youtube') {
    const v = new URL(video.url).searchParams.get('v') || video.url.split('/').pop();
    content = `<iframe src="https://www.youtube.com/embed/${v}?rel=0&modestbranding=1" 
               frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
               allowfullscreen></iframe>`;
  } else {
    content = `<video controls playsinline><source src="${video.url}" type="video/${video.type}">Ваш браузер не поддерживает видео.</video>`;
  }

  return `
    <div class="video-card ${orientation === 'vertical' ? 'vertical' : ''}">
      ${content}
    </div>
  `;
}

// Intersection Observer для анимаций
document.addEventListener('DOMContentLoaded', () => {
  loadVideos();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('appear');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Мобильное меню
  const hamburger = document.getElementById('hamburger');
  const nav = document.querySelector('.nav');
  hamburger?.addEventListener('click', () => {
    nav.classList.toggle('active');
  });
});
