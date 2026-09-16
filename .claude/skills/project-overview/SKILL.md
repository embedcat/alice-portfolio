---
name: project-overview
description: >
  Полный обзор архитектуры проекта alice-portfolio: Hugo-сайт портфолио
  графического дизайнера. Структура контента, тема Eternity (submodule),
  система тегов, CI/CD деплой на VPS, CSS кастомизация. Используй для
  любых задач, связанных с пониманием проекта, добавлением контента,
  стилизацией или деплоем.
---

# Project Overview: Alice Portfolio

> Краткие правила работы с репозиторием — в `AGENTS.md` в корне проекта.

## Назначение
Персональный сайт-портфолио **Анастасии Прошкиной** — графического дизайнера и художника-сценографа.
Заголовок сайта в `config.yaml` — `Анастасия Прошкина`, на страницах (`index.md`, `about.md`) — `Анастасия Олеговна Прошкина`.
Старая фамилия «Смолова» осталась только в URL Instagram-аккаунта (`anastasiiasmolova1990`) — это реальный хэндл.
Сайт демонстрирует работы в трёх категориях: дизайн (детские игрушки, пазлы), живопись и графика.

## Технологический стек

| Компонент       | Технология                     | Версия / Детали                |
|-----------------|--------------------------------|--------------------------------|
| SSG             | Hugo (extended)                | 0.120.4                        |
| Тема            | Eternity (форк)                | git submodule                  |
| CSS Framework   | Bulma                          | через тему                     |
| CI/CD           | GitHub Actions                 | push → master                  |
| Хостинг         | VPS (SCP deploy)               | `/www/alice/public/`           |
| Домен           | `alice.rockevents.ru`          | —                              |
| Репозиторий     | `embedcat/alice-portfolio`     | ветка `master`                 |

## Структура контента

### Работы портфолио (`content/work/`)
Каждая работа — отдельный `.md` файл с front matter:

```yaml
---
weight: 1                    # Порядок сортировки (меньше = выше)
images:
- /images/design/abc.png     # Путь к изображению в assets/images/
tags:
- archive                    # ОБЯЗАТЕЛЬНО для всех (общая галерея)
- design                     # Категория: design | arts | graphics
hideTitle: true              # Опционально (прячет заголовок)
hideExif: true               # Опционально (прячет EXIF)
hideDate: true               # Опционально (прячет дату)
---
```

### Статистика контента
- **design/**: 14 работ (пазлы, алфавит, машинки, календари, Лондон, пингвины, волшебная зима)
- **arts/**: 14 работ (живопись, серии arts1–arts5)
- **graphics/**: 6 работ (дино, рыба, рыбы, сова, глаз, кролик)
- **Итого**: 34 работы (сверено с `content/work/` 2026-09-16)
- Пути в `images:` указываются от корня `assets/` без префикса `assets`: файл `assets/images/design/abc.png` → `/images/design/abc.png`

### Страницы
- `index.md` — главная (короткое bio + аватар)
- `about.md` — полное CV/резюме с историей карьеры
- `_index.md` — welcome page (bypassed через `bypassWelcomePage: true`)
- `404.md` — страница ошибки

## Добавление новой работы

### Шаги:
1. Добавить изображение в `assets/images/{category}/` (где category = design|arts|graphics)
2. Создать `content/work/{category}/{slug}.md`:
   ```yaml
   ---
   weight: 10
   images:
   - /images/{category}/{filename}.png
   tags:
   - archive
   - {category}
   hideTitle: true
   hideExif: true
   hideDate: true
   ---
   ```
3. Выбрать `weight` в соответствии с желаемой позицией (меньше = первее)

### Поддерживаемые категории и теги:
- `design` — дизайн
- `arts` — живопись
- `graphics` — графика
- `archive` — все работы (добавляется ВСЕГДА)

## Кастомизация стилей

### Цветовая палитра (`static/css/colors.css`)
```css
:root {
    --main: #198ce9;         /* Акцентный цвет (синий) */
    --main-light: #84bdef;   /* Светлый акцент */
    --dark: #181818;          /* Основной фон */
    --dark-light: #101010;    /* Тёмный фон */
    --white: #a09b9b;         /* Текст (серовато-белый) */
    --grey: rgb(169, 169, 169); /* Вторичный текст */
}
```

### Кастомные стили (`static/css/custom.css`)
- `.avatar` — размер аватарки (200px)
- `h1-h6` — переопределены на `var(--white)`

### Правила кастомизации
- **НЕ трогать** `themes/eternity/static/css/` — это submodule.
- Добавлять стили через `static/css/custom.css`.
- Менять палитру через `static/css/colors.css`.
- Тема использует Bulma, можно использовать Bulma-классы в контенте.

## Параметры темы (`config.yaml`)

| Параметр                       | Значение    | Назначение                           |
|-------------------------------|-------------|--------------------------------------|
| `bypassWelcomePage`           | `true`      | Пропуск welcome → redirect на /index |
| `disableRadius`               | `true`      | Без скруглений на изображениях       |
| `moveIt`                      | `true`      | Title/meta видны только при скролле  |
| `disableAlwaysResize`         | `false`     | Всегда ресайзить изображения         |
| `homepage`                    | `/index`    | Куда ведёт лого и редирект с `/`     |
| `specialPages`                | `work`, `archive` | Спец-страницы (мета в слайдах) |
| `disableWelcomePageBackground`| `false`     | Фон на welcome-странице включён      |
| `dontShowSource`              | `true`      | Скрыть ссылку на исходник темы       |
| `portfolio.columns.desktop.*` | `3` / `6`   | Кол-во колонок (archive = 6)         |
| `portfolio.columns.mobile.*`  | `1`         | 1 колонка на мобильных               |

## CI/CD Pipeline

```
push to master
    ↓
GitHub Actions (hugo.yml)
    ↓
Install Hugo 0.120.4 (extended) + Dart Sass
    ↓
Checkout (with submodules: recursive)
    ↓
hugo --minify
    ↓
SCP (appleboy/scp-action, source "./public") → VPS:/www/alice/
    ↓
файлы оказываются в /www/alice/public/
```

> `scp-action` копирует каталог `./public` **внутрь** `target`, поэтому веб-корень на VPS — `/www/alice/public/`, а не `/www/alice/`.

**Secrets** (GitHub repo settings):
- `VPS_HOST` — адрес сервера
- `VPS_USERNAME` — пользователь SSH
- `VPS_PORT` — порт SSH
- `VPS_KEY` — приватный ключ SSH

## Локальная разработка

```bash
# Клонирование (с submodule)
git clone --recurse-submodules https://github.com/embedcat/alice-portfolio.git

# Запуск dev-сервера
hugo server -D

# Сборка для продакшена
hugo --minify
```

Локально проверено: Hugo `0.120.4+extended` собирает сайт без ошибок (53 страницы, 113 обработанных изображений).
Единственный warning — `content` содержит и `index.*`, и `_index.*` (см. «Известные проблемы»).

## Навигация сайта

```
главная (/index/)          → index.md (bio + аватар)
обо мне (/about/)          → about.md (полное CV)
дизайн (/tags/design/)     → фильтр по тегу design (3 колонки)
живопись (/tags/arts/)      → фильтр по тегу arts (3 колонки)
графика (/tags/graphics/)   → фильтр по тегу graphics (3 колонки)
галерея (/tags/archive/)    → все работы (6 колонок)
```

## Известные проблемы
*Актуально на 2026-09-16.*

1. Warning сборки: `Content directory "content" have both index.* and _index.* files, pick one` — рядом лежат `index.md` (главная) и `_index.md` (welcome)
2. `static/CNAME` содержит `eternity.bora.sh` — мусор от оригинальной темы (на деплой по SCP не влияет)
3. `content/work/_index.md` — дефолтное описание Eternity, не кастомизировано
4. `content/_index.md` — дефолтный `desc` темы («Eternity is a minimalist Hugo theme…»)
5. Неиспользуемые файлы в `assets/images/`: `graphics/zebru.jpg`, `about.png`, `gtd.png`
6. Google Analytics и Plausible не настроены; Hugo предупреждает об устаревшем `_internal/google_analytics_async.html`
7. Не закоммичено: `content/index.md` и правки `config.yaml` (title, `homepage: /index`, пункт меню «главная»). Коммитить их нужно вместе — иначе `/index/` даст 404 на продакшене
