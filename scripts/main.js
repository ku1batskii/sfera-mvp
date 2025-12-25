// Логика для взаимодействия с карточками событий
console.log('Главная страница загружена');

document.addEventListener('DOMContentLoaded', function () {
	const container = document.querySelector('.tg-cards');
	if (!container) return;

	// Trigger staggered Telegram-like slide-in animation
	// small timeout so that browser can paint initial state
	requestAnimationFrame(() => setTimeout(() => container.classList.add('tg-animate'), 50));

	// Optional: add keyboard accessibility for anchor cards
	container.querySelectorAll('.tg-card').forEach(card => {
		card.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') card.click();
		});
	});
});
