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
Заголовок сайта в `config.yaml` — `Анастасия Прошкина`, на страницах (`home.md`, `about.md`) — `Анастасия Олеговна Прошкина`.
Старая фамилия «Смолова» осталась только в URL Instagram-аккаунта (`anastasiiasmolova1990`) — это реальный хэндл.
Сайт демонстрирует работы в трёх категориях: дизайн (детские игрушки, пазлы), живопись и графика.

## Технологический стек

| Компонент       | Технология                     | Версия / Детали                |
|-----------------|--------------------------------|--------------------------------|
| SSG             | Hugo (extended)                | 0.166.0 (минимум — 0.155)      |
| Тема            | Eternity (форк)                | git submodule, апстрим заморожен|
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
- `home.md` — главная (короткое bio + аватар), публичный URL `/index/` через `url: index`
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

## Оверрайды шаблонов темы (`layouts/`)

Тема Eternity больше не развивается (форк `embedcat/eternity-hugo` совпадает с апстримом `boratanrikulu/eternity@main`, последний коммит — пометка «not maintained»), поэтому совместимость с новыми Hugo поддерживается копиями её шаблонов в `layouts/`:

| Файл | Правка | Причина |
|------|--------|---------|
| `partials/footer.html` | убрана строка `_internal/google_analytics_async.html` | внутренний шаблон удалён в Hugo ≥ 0.146 — иначе `error building site` |
| `partials/slides/columns.html` | имя тега берётся из `.Data.Term`, а не `.Params.Title` | у term-страниц больше нет `.Params.Title` → `index ... value is nil` |
| `partials/slides/slide.html` | `Image.Exif` → `Image.Meta.Exif` | `Image.Exif` deprecated с Hugo 0.155 |
| `partials/slides/meta.html` | то же | то же |
| `partials/slides/slider.html` | то же | то же |

Правило: тему (`themes/eternity/`) не трогаем; при обновлении Hugo сверяем оверрайды с оригиналами.

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
| `homepage`                    | `/home`     | **Content-путь** для `relref` (файл `content/home.md`), не URL |
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
Install Hugo 0.166.0 (extended)
    ↓
Checkout@v7 (with submodules: recursive)
    ↓
hugo --minify
    ↓
scp-action@v1 (source "./public", rm: true) → VPS:/www/alice/staging/public
    ↓
ssh-action@v1: public → public.old, staging/public → public, чистка
    ↓
веб-корень /www/alice/public/ (путь не меняется)
```

> **Почему через staging.** `scp-action` копирует каталог `./public` внутрь `target` и ничего не удаляет — при прямой заливке файлы, исчезнувшие из сборки (например, превью со старой схемой имён после апгрейда Hugo), оставались бы на сервере навсегда. Подмена каталога двумя `mv` занимает миллисекунды; при сбое шаг откатывает прошлую версию.
> Dart Sass из пайплайна убран — в проекте и теме нет ни одного `.scss`.
> На сервере нужен запас места под три копии сборки (~190 МБ при текущих 62 МБ).

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

Локально проверено на Hugo `0.166.0+extended`: чистая сборка без warning'ов — 54 страницы, 105 изображений, ~8 с с нуля и ~150 мс инкрементально.
Версии старше 0.155 **не подойдут**: оверрайды используют `Image.Meta`.

## Навигация сайта

```
главная (/index/)          → home.md (bio + аватар)
обо мне (/about/)          → about.md (полное CV)
дизайн (/tags/design/)     → фильтр по тегу design (3 колонки)
живопись (/tags/arts/)      → фильтр по тегу arts (3 колонки)
графика (/tags/graphics/)   → фильтр по тегу graphics (3 колонки)
галерея (/tags/archive/)    → все работы (6 колонок)
```

## Известные проблемы
*Актуально на 2026-09-16, Hugo 0.166.0.*

1. `static/CNAME` содержит `eternity.bora.sh` — мусор от оригинальной темы (на деплой по SCP не влияет)
2. `content/work/_index.md` — дефолтное описание Eternity, не кастомизировано
3. `content/_index.md` — дефолтный `desc` темы («Eternity is a minimalist Hugo theme…»)
4. Неиспользуемые файлы в `assets/images/`: `graphics/zebru.jpg`, `about.png`, `gtd.png`
5. Google Analytics и Plausible не настроены
6. Тема заморожена апстримом — несовместимости с будущими Hugo придётся чинить новыми оверрайдами в `layouts/`
7. `content/home.md` нельзя переименовывать в `index.md`: в Hugo ≥ 0.123 это делает главную leaf bundle и обрушает весь сайт до 7 страниц
