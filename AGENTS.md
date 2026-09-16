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
  - Кастомный CSS: `static/css/colors.css` и `static/css/custom.css`.
  - Конфигурацию: `config.yaml`.

### Оверрайды темы (`layouts/`)
Тема не поддерживается и не знает про новые версии Hugo, поэтому в проекте лежат копии её шаблонов с точечными правками. Каждый файл — копия одноимённого из `themes/eternity/layouts/` плюс комментарий-шапка с причиной:

| Файл | Зачем |
|------|-------|
| `layouts/partials/footer.html` | В Hugo ≥ 0.146 удалён внутренний шаблон `_internal/google_analytics_async.html` — строка убрана (иначе сборка падает) |
| `layouts/partials/slides/columns.html` | У term-страниц таксономии больше нет `.Params.Title`; имя тега берётся из `.Data.Term` |
| `layouts/partials/slides/slide.html` | `Image.Exif` → `Image.Meta.Exif` (deprecated с 0.155) |
| `layouts/partials/slides/meta.html` | то же |
| `layouts/partials/slides/slider.html` | то же |

При обновлении Hugo сверяйте эти файлы с оригиналами в `themes/eternity/layouts/` — правки в теме иначе потеряются.

### Язык контента
- Весь контент на **русском языке** (`defaultContentLanguage: 'ru'`).
- Комментарии в коде, commit-сообщения — допустимы и на русском, и на английском.

### Контент — только front matter
- Работы портфолио (`content/work/**/*.md`) содержат **только YAML front matter** без markdown-тела.
- Каждая работа обязана иметь: `weight`, `images`, `tags`.
- Тег `archive` добавляется ко всем работам (общая галерея).

### Главная страница — `content/home.md`, не `index.md`
- Файл главной — `content/home.md` с `url: index`, публичный адрес остаётся `/index/`.
- **Нельзя** класть его как `content/index.md`: начиная с Hugo 0.123 файл `index.*` в корне `content/` превращает домашнюю страницу в leaf bundle, и весь остальной контент (все 34 работы и `about`) перестаёт считаться страницами — сайт схлопывается до 7 страниц.
- `params.homepage: "/home"` — это **content-путь** для `relref` (тема резолвит его в `layouts/index.html` и `partials/navbar.html`), а не URL. Переименуете файл — поправьте и этот параметр, иначе сборка упадёт с `REF_NOT_FOUND`.
- Меняете `config.yaml` (homepage/menu) и `content/home.md` — коммитьте одним коммитом, иначе продакшен отдаст 404 на `/index/`.

### Файловые соглашения
- Изображения работ хранятся в `assets/images/{category}/` (Hugo Pipes, ресайз).
- Статические файлы (лого, аватар) — в `static/`.
- `resources/` и `public/` — генерируемые каталоги, в `.gitignore`.

### Деплой
- CI/CD: GitHub Actions (`.github/workflows/hugo.yml`).
- Триггер: push в `master`.
- `HUGO_VERSION` в workflow: `0.166.0` (extended, ставится из `.deb` релиза).
- Деплой — `rsync -rlpt --checksum --delete` по SSH в `/www/alice/public/` (веб-корень, путь не меняется). Ключ из `VPS_KEY` кладётся в `~/.ssh/deploy_key` прямо в шаге, хост добавляется через `ssh-keyscan`.
- `--checksum` здесь обязателен: Hugo пересоздаёт весь `public/` на каждом прогоне, mtime у всех файлов новый, и стандартная проверка «размер + время» гнала бы все 62 МБ заново. Сравнение по контрольным суммам стоит чтения 60 МБ на сервере (пара секунд) и даёт настоящую инкрементальность.
- Почему rsync, а не SCP: передаются только изменившиеся файлы. Полная заливка 62 МБ занимала ~2.5 минуты каждый деплой, из них 60 МБ — превью картинок, которые почти никогда не меняются. `--delete` заодно выкидывает с сервера файлы, которых больше нет в сборке (SCP этого не умел).
- **Перед rsync обязателен шаг `Sanity-check build`**: проверяет, что в `public/` есть `index.html`, `index/index.html`, `about/index.html` и больше 100 файлов. Без него пустая или битая сборка вместе с `--delete` выкосила бы прод.
- Кэш `resources/_gen` через `actions/cache` — иначе Hugo ресайзит все 105 картинок заново на каждом прогоне (~24 с). Ключ завязан на `HUGO_VERSION` (у разных версий Hugo разная схема имён сгенерированных файлов) и на `hashFiles('assets/images/**')`.
- Dart Sass в CI не ставится: в проекте и теме нет ни одного `.scss` — шаг убран.
- **Секреты**: `VPS_HOST`, `VPS_USERNAME`, `VPS_PORT`, `VPS_KEY`.

## Coding Conventions

### CSS кастомизация
- Цветовая палитра определена через CSS-переменные в `static/css/colors.css`.
- Кастомные стили — в `static/css/custom.css`.
- Тема использует **Bulma CSS** как базовый фреймворк (из `themes/eternity/static/css/bulma.min.css`).
- Темная тема по умолчанию: `--dark: #181818`, `--dark-light: #101010`.

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
│   └── skills/project-overview/SKILL.md   # Подробный обзор проекта (skill)
├── config.yaml              # Hugo конфигурация (params, menu, theme settings)
├── content/
│   ├── _index.md            # Welcome page (bypassed)
│   ├── home.md              # Главная (короткое bio + аватар), url: index
│   ├── about.md             # Полное резюме/CV
│   ├── 404.md
│   ├── tags/_index.md
│   └── work/
│       ├── _index.md        # Описание секции (не кастомизировано)
│       ├── design/          # 14 работ (дизайн: пазлы, машинки, календари...)
│       ├── arts/            # 14 работ (живопись)
│       └── graphics/        # 6 работ (графика: рисунки животных)
├── assets/images/           # Изображения для Hugo Pipes (ресайз, оптимизация)
│   ├── design/
│   ├── arts/
│   └── graphics/
├── static/
│   ├── css/colors.css       # CSS-переменные (цветовая палитра)
│   ├── css/custom.css       # Кастомные стили проекта
│   ├── logo1.png            # Логотип сайта
│   ├── avatar.jpg           # Фото для страницы "обо мне"
│   └── CNAME                # ⚠ Содержит eternity.bora.sh (НЕ актуально)
├── layouts/                 # Оверрайды шаблонов темы (см. «Оверрайды темы»)
│   └── partials/
│       ├── footer.html
│       └── slides/{columns,slide,meta,slider}.html
├── themes/eternity/         # Git submodule (НЕ редактировать!)
└── .github/workflows/
    └── hugo.yml             # CI/CD: сборка Hugo → SCP на VPS
```

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

*Проверено 2026-09-16 на Hugo 0.166.0: `hugo --minify` собирается без единого warning'а (54 страницы, 105 изображений); набор выходных страниц совпадает с тем, что давала 0.120.4.*

- `static/CNAME` содержит `eternity.bora.sh` — осталось от темы, не актуально для продакшена (деплой идёт по SCP, CNAME не используется).
- `content/work/_index.md` содержит дефолтное описание темы Eternity (не кастомизировано).
- `content/_index.md` содержит дефолтный `desc` темы («Eternity is a minimalist Hugo theme…»); страница скрыта редиректом `bypassWelcomePage`, но текст остаётся в сборке.
- Неиспользуемые изображения в `assets/images/`: `graphics/zebru.jpg` (нет .md), `about.png`, `gtd.png` — нигде не упоминаются.
- Google Analytics не настроен (`googleAnalytics: ''`).
- Plausible analytics не настроен (`plausible: ''`).
- Тема заморожена апстримом: любые несовместимости с будущими версиями Hugo придётся чинить оверрайдами в `layouts/` (сейчас их пять).
- При обновлении Hugo меняется схема имён сгенерированных картинок (`*_hu<hash>.jpg`) — старый кэш в `resources/_gen` можно удалять, он пересоберётся.
