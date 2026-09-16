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
alt: "Деревянный пазл-алфавит: буквы-вкладыши"  # ОБЯЗАТЕЛЬНО, в кавычках
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

`alt` — описание картинки по-русски; выводится в превью галереи и в крупном
просмотре. Кавычки обязательны: в описаниях есть двоеточия, без них YAML падает.

### Статистика контента
- **design/**: 14 работ (пазлы, алфавит, машинки, календари, Лондон, пингвины, волшебная зима)
- **arts/**: 14 работ (живопись, серии arts1–arts5)
- **graphics/**: 6 работ (дино, рыба, рыбы, сова, глаз, кролик)
- **Итого**: 34 работы (сверено с `content/work/` 2026-09-16)
- Пути в `images:` указываются от корня `assets/` без префикса `assets`: файл `assets/images/design/abc.png` → `/images/design/abc.png`

### Страницы
- `home.md` — главная-лендинг (`type: landing` → `layouts/landing/single.html`): кто она и чем занимается, кнопки «Смотреть работы» / «Написать», карточки трёх разделов, контакты. Публичный URL `/index/` через `url: index`
- `about.md` — полное CV/резюме с историей карьеры
- `tags/{design,arts,graphics,archive}/_index.md` — русские названия разделов (`title` → `h1` и `<title>`), `description`, вводный абзац, а также `cover`/`cardtext`/`weight` для карточек на главной
- `_index.md` — welcome page (bypassed через `bypassWelcomePage: true`)
- `404.md` — страница ошибки (`type: nil` → `layouts/nil/single.html`, текст на русском)
- `work/_index.md` — `build.render: never`, страница `/work/` не публикуется

## Добавление новой работы

### Шаги:
1. Добавить изображение в `assets/images/{category}/` (где category = design|arts|graphics)
2. Создать `content/work/{category}/{slug}.md`:
   ```yaml
   ---
   alt: "Что изображено на картинке"
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

Тема Eternity больше не развивается (форк `embedcat/eternity-hugo` совпадает с апстримом `boratanrikulu/eternity@main`, последний коммит — пометка «not maintained»), поэтому всё, что нужно поправить, живёт копиями её шаблонов в `layouts/`:

| Файл | Правка | Причина |
|------|--------|---------|
| `partials/footer.html` | убрана строка `_internal/google_analytics_async.html` | внутренний шаблон удалён в Hugo ≥ 0.146 |
| `partials/slides/columns.html` | имя тега из `.Data.Term` | у term-страниц больше нет `.Params.Title` |
| `partials/slides/slide.html` | `Image.Meta.Exif`, `alt`, 2000px WebP | deprecated API; пустые alt; вес сборки |
| `partials/slides/meta.html` | `Image.Meta.Exif` | то же |
| `partials/slides/slider.html` | `Image.Meta.Exif`, `alt`, превью в WebP | то же |
| `partials/header.html` | `<html lang>`, один `<title>`, favicon из логотипа, JSON-LD Person, `assets/css/site.css`, убран скрипт FontAwesome | язык страницы, дублирующийся title, иконка темы, kit отдавал 403 |
| `partials/meta.html` | description по страницам, `og:site_name`, `summary_large_image`, og:image 1200x630 | одно описание на весь сайт, пустой site_name |
| `partials/navbar.html` | alt логотипа, логотип в WebP, убран блок иконок соцсетей | доступность, вес, нерабочий kit FontAwesome |
| `partials/helpers/hidden-menu.html` | `<h1>` с русским названием раздела | было `<p>#Design</p>` при русском меню |
| `partials/banner.html` | полоса с волнами на всех страницах | картинка была привязана к двум страницам |
| `_default/single.html` | работы — через `slides/slide.html`, текстовые страницы — только контент | картинка из front matter дублировала полосу в шапке |
| `landing/single.html` | лендинг главной | раньше главная = имя и фото |
| `nil/single.html` | 404 на русском | была страница с логотипом Eternity |
| `robots.txt` | robots со ссылкой на sitemap | `robots.txt` отдавал 404 |

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

### Кастомные стили (`assets/css/site.css`)
- Подключается отдельным `<link>` с fingerprint из `partials/header.html`
- Полоса с волнами в шапке: `--banner-max-height`, `--banner-gap-top`, `--banner-gap-bottom` — предельная высота и зазоры правятся этими переменными, на ≤768px они переопределяются. Прозрачные поля исходника отрезаны в `partials/banner.html`, ограничение высоты работает сжатием, а не обрезкой
- `.landing-*` — блоки главной, `.section-title` — заголовки разделов, `.notfound-*` — 404
- Мобильные правки шапки темы (логотип и имя занимали весь первый экран)
- `static/css/custom.css` оставлен пустым: тема импортирует его внутри `main.css`, и браузеры отдавали закэшированную версию после каждой правки

### Правила кастомизации
- **НЕ трогать** `themes/eternity/static/css/` — это submodule.
- Добавлять стили через `assets/css/site.css`.
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
actions/cache@v6: restore resources/_gen (ресайзнутые картинки)
    ↓
hugo --minify
    ↓
Sanity-check build (index.html, index/, about/, >100 файлов)
    ↓
rsync -rlpt --checksum --delete по SSH → VPS:/www/alice/public/
```

> **Почему rsync, а не SCP.** `scp-action` заливал весь сайт целиком: 62 МБ, из них 60 МБ — превью картинок, которые почти не меняются. В логах деплоя это ~134 секунды чистой передачи при ~450 КБ/с. rsync отправляет только изменившееся, а `--delete` сам убирает с сервера файлы, пропавшие из сборки.
> **`--checksum` обязателен:** Hugo пересоздаёт `public/` целиком, поэтому mtime всегда новый — без него rsync считал бы изменившимися все файлы и лил бы те же 62 МБ.
> **Sanity-check обязателен:** `--delete` без него при пустой сборке снёс бы прод.
> **Кэш `resources/_gen`** экономит ~24 с на ресайзе 105 картинок. Ключ включает `HUGO_VERSION`, потому что схема имён сгенерированных файлов меняется между версиями Hugo.
> Dart Sass из пайплайна убран — в проекте и теме нет ни одного `.scss`.

**Secrets** (GitHub repo settings):
- `VPS_HOST` — адрес сервера
- `VPS_USERNAME` — пользователь SSH
- `VPS_PORT` — порт SSH
- `VPS_KEY` — приватный ключ SSH

## Локальная разработка

```bash
# Клонирование (с submodule)
git clone --recurse-submodules https://github.com/embedcat/alice-portfolio.git

# Запуск dev-сервера (baseURL обязателен: иначе CSS и JS тянутся с продакшена)
hugo server --port=1313 --baseURL=http://localhost:1313/ --appendPort=false

# Сборка для продакшена
hugo --minify
```

Тот же запуск описан в `.claude/launch.json` — его использует предпросмотр в Claude Code.

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

1. Тема заморожена апстримом — несовместимости с будущими Hugo придётся чинить новыми оверрайдами в `layouts/` (сейчас их двенадцать)
2. У работ нет названий, года и техники: `hideTitle: true` у всех 34 файлов, в front matter только `alt`
3. `alt` написан по изображению, а не со слов автора — техника живописи и графики нигде не зафиксирована
4. Неиспользуемые файлы в `assets/images/`: `graphics/zebru.jpg`, `about.png`, `gtd.png`, `banner.png`
5. Аналитика не настроена (ни Google Analytics, ни Plausible)
6. Дизайн и искусство лежат в общей галерее вперемешку; кейсов по дизайну (задача → решение → результат) нет
7. `content/home.md` нельзя переименовывать в `index.md`: в Hugo ≥ 0.123 это делает главную leaf bundle и обрушает весь сайт до 7 страниц
