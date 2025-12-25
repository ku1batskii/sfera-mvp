// Переход на страницу карты
document.addEventListener('DOMContentLoaded', () => {
  const mapBtn = document.getElementById('openMapBtn');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      window.location.href = "pages/map.html";
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const mapBtn = document.getElementById('openMapBtn');

  mapBtn.addEventListener('click', () => {
    window.location.href = "pages/map.html";
  });

  // Пример анимации открытия карточки как в Telegram
  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.add('tg-slide-in'); // добавляем класс анимации
      // можно редиректить на страницу подробного события
      // window.location.href = "pages/event-details.html";
    });
  });
});
