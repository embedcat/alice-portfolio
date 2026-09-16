# Alice Portfolio — Agent Rules

## Project Overview

Персональный сайт-портфолио графического дизайнера и художника-сценографа **Анастасии Прошкиной**.
Статический сайт на **Hugo** с темой **Eternity** (форк `embedcat/eternity-hugo`), развёрнутый на VPS через GitHub Actions.

- **Имя**: `Анастасия Прошкина` (`title` в `config.yaml`), на страницах `index.md` и `about.md` — `Анастасия Олеговна Прошкина`. Старая фамилия «Смолова» остаётся только в ссылке на Instagram-аккаунт (`anastasiiasmolova1990`) — это реальный хэндл, менять его нельзя.
- **Production URL**: `https://alice.rockevents.ru`
- **Repo**: `https://github.com/embedcat/alice-portfolio.git`
- **Branch**: `master` (единственная ветка)
- **Hugo version**: `0.120.4` (extended)

## Critical Rules

### Тема — это git submodule
- Тема `eternity` подключена как submodule из `themes/eternity` → `https://github.com/embedcat/eternity-hugo.git`.
- **НИКОГДА** не редактируйте файлы внутри `themes/eternity/` напрямую в этом репозитории. Все кастомизации должны делаться через:
  - Переопределение layouts: создать файл в `layouts/` корневого проекта (Hugo merge strategy).
  - Кастомный CSS: `static/css/colors.css` и `static/css/custom.css`.
  - Конфигурацию: `config.yaml`.

### Язык контента
- Весь контент на **русском языке** (`defaultContentLanguage: 'ru'`).
- Комментарии в коде, commit-сообщения — допустимы и на русском, и на английском.

### Контент — только front matter
- Работы портфолио (`content/work/**/*.md`) содержат **только YAML front matter** без markdown-тела.
- Каждая работа обязана иметь: `weight`, `images`, `tags`.
- Тег `archive` добавляется ко всем работам (общая галерея).

### Главная страница и меню — коммитить вместе
- Главная — это `content/index.md` (`url: index`), на неё указывают `params.homepage: "/index"` и пункт меню `главная`.
- Менять `config.yaml` (homepage/menu) и `content/index.md` нужно **одним коммитом**: если попадёт только config, продакшен-сборка отдаст 404 на `/index/`.

### Файловые соглашения
- Изображения работ хранятся в `assets/images/{category}/` (Hugo Pipes, ресайз).
- Статические файлы (лого, аватар) — в `static/`.
- `resources/` и `public/` — генерируемые каталоги, в `.gitignore`.

### Деплой
- CI/CD: GitHub Actions (`.github/workflows/hugo.yml`).
- Триггер: push в `master`.
- Сборка `hugo --minify` → SCP на VPS: `appleboy/scp-action` копирует каталог `./public` **внутрь** `target`, то есть файлы попадают в `/www/alice/public/` (веб-корень на VPS должен указывать именно туда).
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
│   ├── index.md             # Главная (короткое bio + аватар), url: index
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

*Проверено аудитом 2026-09-16 (`hugo --minify` собирается без ошибок: 53 страницы, 113 изображений).*

- **Warning сборки**: `Content directory "content" have both index.* and _index.* files, pick one.` — в `content/` лежат и `index.md` (главная), и `_index.md` (welcome-страница, обходится через `bypassWelcomePage`). Сборка проходит, но Hugo предупреждает при каждом запуске.
- `static/CNAME` содержит `eternity.bora.sh` — осталось от темы, не актуально для продакшена (деплой идёт по SCP, CNAME не используется).
- `content/work/_index.md` содержит дефолтное описание темы Eternity (не кастомизировано).
- `content/_index.md` содержит дефолтный `desc` темы («Eternity is a minimalist Hugo theme…»); страница скрыта редиректом `bypassWelcomePage`, но текст остаётся в сборке.
- Неиспользуемые изображения в `assets/images/`: `graphics/zebru.jpg` (нет .md), `about.png`, `gtd.png` — нигде не упоминаются.
- Google Analytics не настроен (`googleAnalytics: ''`); Hugo предупреждает, что `_internal/google_analytics_async.html` устарел.
- Plausible analytics не настроен (`plausible: ''`).
- Не закоммичено на момент аудита: `content/index.md`, изменения `config.yaml` (title → Прошкина, homepage → `/index`, пункт меню «главная»), а также `AGENTS.md` и `.claude/skills/`.
