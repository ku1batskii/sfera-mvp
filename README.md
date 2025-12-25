# sfera-mvp
Sfera — прототип
Лёгкий прототип, демонстрирующий карту активности в реальном времени на основе событий, отправленных пользователями.

Быстрый запуск (локальный):

Установка зависимостей
npm install
Запустите миграцию (создаст файл SQLite)
npm run migrate
Запуск сервера
npm run dev
Откройте карту в браузере:
http://localhost:3000/pages/map.html
Примечания:

Для простоты в этом примере используется SQLite. Для рабочей среды используйте Postgres + PostGIS.
Авторизация в Telegram — это заготовка: добавьте виджет для входа в Telegram и проверку на стороне сервера, когда будете готовы.
Сведения об аутентификации

Сервер выдает токены JWT (подписанные с помощью JWT_SECRET) при успешной проверке входа в Telegram.
Скопируйте .env.example в .env и установите TELEGRAM_BOT_TOKEN и надежный JWT_SECRET.
Клиент сохраняет токен в localStorage в разделе sfera_token и отправляет его как Authorization: Bearer <token> при публикации событий.
Настройка клиента (React):

cd src/client
npm install
npm run dev
Настройка входа в Telegram (быстрая):

Создайте бота с помощью @BotFather и получите токен бота.
Добавьте TELEGRAM_BOT_TOKEN в .env (скопируйте из .env.example).
В клиенте есть заполнитель для виджета Telegram; отредактируйте src/client/index.html и установите для атрибута data-telegram-login имя вашего бота.
Производство, сборка и обслуживание

# build client and start production server
npm run build:client
npm run start:prod
Это позволяет собрать приложение React в src/client/dist и запустить его с помощью Express по адресу http://localhost:3000/.
