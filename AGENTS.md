# Alice Portfolio — Agent Rules

## Project Overview

Персональный сайт-портфолио графического дизайнера и художника-сценографа **Анастасии Прошкиной**.
Статический сайт на **Hugo** с темой **Eternity** (форк `embedcat/eternity-hugo`), развёрнутый на VPS через GitHub Actions.

- **Имя**: `Анастасия Прошкина` (`title` в `config.yaml`), на страницах `home.md` и `about.md` — `Анастасия Олеговна Прошкина`. Старая фамилия «Смолова» остаётся только в ссылке на Instagram-аккаунт (`anastasiiasmolova1990`) — это реальный хэндл, менять его нельзя.
- **Production URL**: `https://alice.rockevents.ru`
- **Repo**: `https://github.com/embedcat/alice-portfolio.git`
- **Branch**: `master` (единственная ветка)
- **Hugo version**: `0.166.0` (extended) — минимальная: оверрайды в `layouts/` используют `Image.Meta` (Hugo ≥ 0.155), на 0.120 сборка упадёт.

## Critical Rules

### Тема — это git submodule
- Тема `eternity` подключена как submodule из `themes/eternity` → `https://github.com/embedcat/eternity-hugo.git`.
- Форк совпадает коммит-в-коммит с апстримом `boratanrikulu/eternity@main`, а апстрим **заморожен** (последний коммит — «doc: add not-maintained notice»). Обновлять тему неоткуда; всё, что ломается в новых версиях Hugo, чиним оверрайдами в `layouts/`.
- **НИКОГДА** не редактируйте файлы внутри `themes/eternity/` напрямую в этом репозитории. Все кастомизации должны делаться через:
  - Переопределение layouts: создать файл в `layouts/` корневого проекта (Hugo merge strategy).
  - Кастомный CSS: `static/css/colors.css` (палитра) и `assets/css/site.css` (стили проекта).
  - Конфигурацию: `config.yaml`.

### Оверрайды темы (`layouts/`)
Тема не поддерживается и не знает про новые версии Hugo, поэтому в проекте лежат копии её шаблонов с точечными правками. Каждый файл — копия одноимённого из `themes/eternity/layouts/` плюс комментарий-шапка с причиной:

| Файл | Зачем |
|------|-------|
| `layouts/partials/footer.html` | В Hugo ≥ 0.146 удалён внутренний шаблон `_internal/google_analytics_async.html` — строка убрана (иначе сборка падает) |
| `layouts/partials/slides/columns.html` | У term-страниц таксономии больше нет `.Params.Title`; имя тега берётся из `.Data.Term` |
| `layouts/partials/slides/slide.html` | `Image.Exif` → `Image.Meta.Exif`; `alt` из front matter; крупный просмотр 3000px PNG → 2000px WebP |
| `layouts/partials/slides/meta.html` | `Image.Exif` → `Image.Meta.Exif` |
| `layouts/partials/slides/slider.html` | то же + `alt`; превью галереи 1000px PNG → WebP |
| `layouts/partials/header.html` | `<html lang>`, один `<title>` вместо двух, favicon из логотипа, JSON-LD Person, подключение `assets/css/site.css`, убран нерабочий скрипт FontAwesome |
| `layouts/partials/meta.html` | description по страницам, непустой `og:site_name`, `twitter:card: summary_large_image`, og:image 1200x630 |
| `layouts/partials/navbar.html` | `alt` у логотипа, ресайз логотипа в WebP, убран блок иконок соцсетей |
| `layouts/partials/helpers/hidden-menu.html` | Вместо `<p>#Design</p>` — `<h1>` с русским названием раздела |
| `layouts/partials/banner.html` | Новый partial: полоса с волнами (`assets/images/about2.png`) под навигацией на всех страницах |
| `layouts/_default/single.html` | Работы рендерятся через `slides/slide.html` как в теме, текстовые страницы — только контентом (иначе картинка из front matter дублировала полосу в шапке) |
| `layouts/landing/single.html` | Лендинг главной (`content/home.md`, `type: landing`) |
| `layouts/nil/single.html` | Страница 404 на русском вместо логотипа и текста темы |
| `layouts/robots.txt` | `robots.txt` со ссылкой на sitemap (`enableRobotsTXT: true`) |

При обновлении Hugo сверяйте эти файлы с оригиналами в `themes/eternity/layouts/` — правки в теме иначе потеряются.

### Язык контента
- Весь контент на **русском языке** (`defaultContentLanguage: 'ru'`).
- Комментарии в коде, commit-сообщения — допустимы и на русском, и на английском.

### Контент — только front matter
- Работы портфолио (`content/work/**/*.md`) содержат **только YAML front matter** без markdown-тела.
- Каждая работа обязана иметь: `weight`, `images`, `tags`, `alt`.
- `alt` — описание изображения на русском, в кавычках (в тексте есть двоеточия, без кавычек YAML ломается). Без него картинка уходит в сборку с пустым `alt`: поиск её не индексирует, скринридер молчит.
- Тег `archive` добавляется ко всем работам (общая галерея).

### Главная и страницы разделов
- `content/home.md` — лендинг (`type: landing` → `layouts/landing/single.html`): имя, чем занимается, кнопки, карточки разделов, контакты. Текст берётся из тела файла, врезка «обо мне» — из `aboutteaser`.
- Разделы — term-страницы таксономии: `content/tags/{design,arts,graphics,archive}/_index.md`. Задают русский `title` (он же `h1` и `<title>`), `description`, вводный абзац над галереей, а для карточек на главной — `cover`, `cardtext`, `weight`.
- `content/work/_index.md` не рендерится (`build.render: never`): страница `/work/` дублировала галерею, а раньше показывала демо-текст темы Eternity.

### Главная страница — `content/home.md`, не `index.md`
- Файл главной — `content/home.md` с `url: index`, публичный адрес остаётся `/index/`.
- **Нельзя** класть его как `content/index.md`: начиная с Hugo 0.123 файл `index.*` в корне `content/` превращает домашнюю страницу в leaf bundle, и весь остальной контент (все 34 работы и `about`) перестаёт считаться страницами — сайт схлопывается до 7 страниц.
- `params.homepage: "/home"` — это **content-путь** для `relref` (тема резолвит его в `layouts/index.html` и `partials/navbar.html`), а не URL. Переименуете файл — поправьте и этот параметр, иначе сборка упадёт с `REF_NOT_FOUND`.
- Меняете `config.yaml` (homepage/menu) и `content/home.md` — коммитьте одним коммитом, иначе продакшен отдаст 404 на `/index/`.

### Файловые соглашения
- Изображения работ хранятся в `assets/images/{category}/` (Hugo Pipes, ресайз).
- Логотип — `assets/images/brand/logo.png` (из него же генерируются favicon и apple-touch-icon).
- Фото для страниц (`avatar.jpg`) и палитра (`css/colors.css`) — в `static/`.
- `resources/` и `public/` — генерируемые каталоги, в `.gitignore`.

### Деплой
- CI/CD: GitHub Actions (`.github/workflows/hugo.yml`).
- Триггер: push в `master`.
- `HUGO_VERSION` в workflow: `0.166.0` (extended, ставится из `.deb` релиза).
- Деплой — `rsync -rlpt --checksum --delete` по SSH в `/www/alice/public/` (веб-корень, путь не меняется). Каталог создаётся сам через `--rsync-path="mkdir -p … && rsync"` — без этого на свежем сервере rsync падает с `mkdir failed: No such file or directory`, так как создаёт только последний компонент пути. Пользователь деплоя должен иметь право писать в `/www`. Ключ из `VPS_KEY` кладётся в `~/.ssh/deploy_key` прямо в шаге, хост добавляется через `ssh-keyscan`.
- `--checksum` здесь обязателен: Hugo пересоздаёт весь `public/` на каждом прогоне, mtime у всех файлов новый, и стандартная проверка «размер + время» гнала бы все 62 МБ заново. Сравнение по контрольным суммам стоит чтения 60 МБ на сервере (пара секунд) и даёт настоящую инкрементальность.
- Почему rsync, а не SCP: передаются только изменившиеся файлы. Полная заливка 62 МБ занимала ~2.5 минуты каждый деплой, из них 60 МБ — превью картинок, которые почти никогда не меняются. `--delete` заодно выкидывает с сервера файлы, которых больше нет в сборке (SCP этого не умел).
- **Перед rsync обязателен шаг `Sanity-check build`**: проверяет, что в `public/` есть `index.html`, `index/index.html`, `about/index.html` и больше 100 файлов. Без него пустая или битая сборка вместе с `--delete` выкосила бы прод.
- Кэш `resources/_gen` через `actions/cache` — иначе Hugo ресайзит все 105 картинок заново на каждом прогоне (~24 с). Ключ завязан на `HUGO_VERSION` (у разных версий Hugo разная схема имён сгенерированных файлов) и на `hashFiles('assets/images/**')`.
- Dart Sass в CI не ставится: в проекте и теме нет ни одного `.scss` — шаг убран.
- **Секреты**: `VPS_HOST`, `VPS_USERNAME`, `VPS_PORT`, `VPS_KEY`.

## Coding Conventions

### CSS кастомизация
- Цветовая палитра определена через CSS-переменные в `static/css/colors.css`.
- Кастомные стили — в **`assets/css/site.css`**. Он подключается отдельным `<link>` с fingerprint в `layouts/partials/header.html`.
- `static/css/custom.css` оставлен пустой заглушкой: тема тянет его через `@import` внутри `main.css`, и браузеры отдавали закэшированную версию после каждой правки — поэтому стили проекта переехали в `assets/`.
- Тема использует **Bulma CSS** как базовый фреймворк (из `themes/eternity/static/css/bulma.min.css`).
- Темная тема по умолчанию: `--dark: #181818`, `--dark-light: #101010`.

### Иконок FontAwesome в проекте нет
Тема подключала kit `kit.fontawesome.com/bf18cd1a66.js`, принадлежащий её автору: на этом домене он отдаёт **403**, иконки не рисовались нигде, а блок соцсетей в шапке занимал 25px пустоты. Блок и скрипт удалены. Контакты выводятся текстом на главной (`layouts/landing/single.html`) из `params.socials`; оттуда же берётся `sameAs` для JSON-LD, поэтому сам список в `config.yaml` нужен. Добавлять иконки — только своим inline-SVG, не внешним kit'ом.

### Полоса с волнами (шапка)
- Выводится из `layouts/partials/banner.html`, который вызывается в конце `partials/navbar.html` — то есть на всех страницах сразу.
- Зазоры и предельная высота — CSS-переменные в `assets/css/site.css`: `--banner-gap-top`, `--banner-gap-bottom` и `--banner-max-height`. На ширине ≤ 768px переопределяются меньшими значениями.
- `--banner-gap-bottom` на десктопе `0` (контент идёт сразу под волнами), на телефоне `0.9rem` — там полоса тоньше и вплотную смотрелась тесно. Переменная задаёт `padding-top` у `section.section` и отдельно у `#desktop.section` / `#mobile.section`: у галереи свои секции с id, и правило темы `#mobile.section { padding: 3rem 0.8rem }` перебивает селектор по классу.
- На телефоне у `nav.navbar` снят нижний паддинг (30px от темы) — из-за него между меню и полосой зияла дыра.
- В исходной картинке графика занимает не всю высоту: после ресайза до 1800px волны лежат в строках 39–193, остальное — прозрачные поля. `banner.html` отрезает их двумя кропами (Hugo поддерживает только якоря, не смещения), иначе полоса заданной высоты срезала верхушки волн.
- По ширине полоса тянется без искажений (`height: auto`); `--banner-max-height` ограничивает её мягким сжатием (`object-fit: fill`), а не обрезкой — при 1440px это сжатие около 1.2x.
- Раньше эта картинка лежала в `images:` у `home.md` и `about.md` и показывалась только на этих двух страницах.

### Изображения
- Превью галереи — 1000px WebP q82, крупный просмотр — 2000px WebP q85 (задаётся в оверрайдах `slides/slider.html` и `slides/slide.html`). До перехода на WebP сборка весила 113 МБ, сейчас ~25 МБ.
- Логотип и favicon генерируются из `assets/images/brand/logo.png` (в `partials/navbar.html` и `partials/header.html`). В `static/` логотипа больше нет.

### Hugo config
- Markdown: `goldmark` с `unsafe: true` (разрешён raw HTML в контенте).
- Permalinks: `work: ":filename/"`.
- `bypassWelcomePage: true` — пропуск welcome-страницы, редирект на `/index`.
- `disableRadius: true`, `moveIt: true` — кастомные параметры темы.

## Architecture Quick Reference

```
alice-portfolio/
├── AGENTS.md                # Этот файл — правила для агентов
├── .claude/
│   ├── launch.json          # hugo server для локального предпросмотра
│   └── skills/project-overview/SKILL.md   # Подробный обзор проекта (skill)
├── config.yaml              # Hugo конфигурация (params, menu, theme settings)
├── content/
│   ├── _index.md            # Welcome page (bypassed)
│   ├── home.md              # Главная-лендинг (type: landing), url: index
│   ├── about.md             # Полное резюме/CV
│   ├── 404.md
│   ├── tags/
│   │   ├── _index.md
│   │   └── {design,arts,graphics,archive}/_index.md   # Названия и обложки разделов
│   └── work/
│       ├── _index.md        # build.render: never (страница /work/ не нужна)
│       ├── design/          # 14 работ (дизайн: пазлы, машинки, календари...)
│       ├── arts/            # 14 работ (живопись)
│       └── graphics/        # 6 работ (графика: рисунки животных)
├── assets/
│   ├── css/site.css         # Стили проекта (подключаются с fingerprint)
│   └── images/              # Изображения для Hugo Pipes (ресайз, WebP)
│       ├── brand/logo.png   # Логотип → навбар, favicon, apple-touch-icon
│       ├── design/
│       ├── arts/
│       └── graphics/
├── static/
│   ├── css/colors.css       # CSS-переменные (цветовая палитра)
│   ├── css/custom.css       # Пустая заглушка поверх @import темы
│   └── avatar.jpg           # Фото для главной и страницы «обо мне»
├── layouts/                 # Оверрайды шаблонов темы (см. «Оверрайды темы»)
│   ├── landing/single.html  # Главная
│   ├── nil/single.html      # 404
│   ├── robots.txt
│   └── partials/
│       ├── header.html, meta.html, navbar.html, footer.html
│       ├── helpers/hidden-menu.html
│       └── slides/{columns,slide,meta,slider}.html
├── themes/eternity/         # Git submodule (НЕ редактировать!)
└── .github/workflows/
    └── hugo.yml             # CI/CD: сборка Hugo → rsync на VPS
```

## Локальный предпросмотр

`.claude/launch.json` поднимает `hugo server` на порту 1313 с `--baseURL=http://localhost:1313/`.
Без явного baseURL сервер отдаёт страницы из `public/`, собранные с продакшен-адресом, и браузер
подтягивает CSS и JS с `alice.rockevents.ru` — локальные правки стилей не видны.

## Taxonomy & Navigation

| Пункт меню | URL             | Тег      | Колонки (desktop) |
|------------|-----------------|----------|--------------------|
| главная    | `/index/`       | —        | —                  |
| обо мне    | `/about/`       | —        | —                  |
| дизайн     | `/tags/design/` | design   | 3                  |
| живопись   | `/tags/arts/`   | arts     | 3                  |
| графика    | `/tags/graphics/`| graphics | 3                  |
| галерея    | `/tags/archive/`| archive  | 6                  |

## Known Issues & TODOs

*Проверено 2026-09-16 на Hugo 0.166.0: `hugo --minify` собирается без warning'ов (53 страницы, 110 изображений), сборка ~25 МБ.*

- Тема заморожена апстримом: любые несовместимости с будущими версиями Hugo придётся чинить оверрайдами в `layouts/` (сейчас их двенадцать).
- Работы показываются без названий, года и техники (`hideTitle: true` у всех 34 файлов) — есть только `alt`. Названия и подписи под работы ещё не собраны.
- `alt` у работ написан по изображению, а не со слов автора: техника живописи и графики нигде не указана, поэтому в описаниях её нет.
- Неиспользуемые изображения в `assets/images/`: `graphics/zebru.jpg` (нет .md), `about.png`, `gtd.png`, `banner.png` — нигде не упоминаются.
- Аналитика не настроена (ни Google Analytics, ни Plausible) — непонятно, что смотрят на сайте.
- Дизайн и искусство живут в одной галерее `/tags/archive/` вперемешку; отдельных кейсов по дизайну (задача → решение → результат) нет.
- При обновлении Hugo меняется схема имён сгенерированных картинок (`*_hu<hash>.webp`) — старый кэш в `resources/_gen` можно удалять, он пересоберётся.
