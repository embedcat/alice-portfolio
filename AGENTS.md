# Alice Portfolio — Agent Rules

## Project Overview

Персональный сайт-портфолио графического дизайнера и художника-сценографа **Анастасии Прошкиной**.
Статический сайт на **Hugo** с темой **Eternity** (форк `embedcat/eternity-hugo`), развёрнутый на VPS через GitHub Actions.

- **Имя**: `Анастасия Прошкина` (`title` и `params.author` в `config.yaml`; имя на главной берётся из `params.author`), в резюме `about.md` — `Анастасия Олеговна Прошкина`. Старая фамилия «Смолова» остаётся только в ссылке на Instagram-аккаунт (`anastasiiasmolova1990`) — это реальный хэндл, менять его нельзя.
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
Тема не поддерживается и не знает про новые версии Hugo, поэтому в проекте лежат копии её шаблонов с точечными правками, а также новые шаблоны проекта. У переопределённых шаблонов есть комментарий-шапка с причиной:

| Файл | Зачем |
|------|-------|
| `layouts/partials/footer.html` | В Hugo ≥ 0.146 удалён внутренний шаблон `_internal/google_analytics_async.html` — строка убрана (иначе сборка падает) |
| `layouts/partials/slides/columns.html` | У term-страниц таксономии больше нет `.Params.Title`; имя тега берётся из `.Data.Term` |
| `layouts/partials/slides/slide.html` | `Image.Exif` → `Image.Meta.Exif`; `alt` из front matter; крупный просмотр 3000px PNG → 2000px WebP; подписи из `alt` через `params.showImageCaptions` |
| `layouts/partials/slides/meta.html` | `Image.Exif` → `Image.Meta.Exif` |
| `layouts/partials/slides/slider.html` | то же + `alt`; превью галереи 1000px PNG → WebP |
| `layouts/partials/header.html` | `<html lang>`, один `<title>` вместо двух, favicon из логотипа, JSON-LD Person, подключение `assets/css/site.css`, убран нерабочий скрипт FontAwesome |
| `layouts/partials/meta.html` | description по страницам, непустой `og:site_name`, `twitter:card: summary_large_image`, og:image 1200x630 |
| `layouts/partials/navbar.html` | `alt` у логотипа, ресайз логотипа в WebP, убраны блок иконок соцсетей и имя в шапке, пункты меню разделены вертикальными чертами |
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
- `content/home.md` — лендинг (`type: landing` → `layouts/landing/single.html`): фото, имя, направления практики, кнопки «Смотреть работы» и «Написать», контакты. Текст берётся из тела файла, имя и подзаголовок — из `params.author` и `params.subtitle`. Карточки разделов и врезка «обо мне» удалены из шаблона; оставшиеся поля `aboutteaser`, `cover`, `cardtext`, `weight` сейчас им не используются.
- Разделы — term-страницы таксономии: `content/tags/{design,arts,graphics,miniatures,theater,archive}/_index.md`. Задают русский `title` (он же `h1` и `<title>`), `description`, вводный абзац над галереей.
- `content/contacts.md` — отдельная страница `/contacts/` с почтой, Instagram и ссылкой на резюме; добавлена в главное меню. Ссылки в её теле заданы вручную: при изменении контактов сверяйте их с `params.socials` в `config.yaml`.
- `content/work/_index.md` не рендерится (`build.render: never`): страница `/work/` дублировала галерею, а раньше показывала демо-текст темы Eternity.

### Главная страница — `content/home.md`, не `index.md`
- Файл главной — `content/home.md` с `url: index`, публичный адрес остаётся `/index/`.
- **Нельзя** класть его как `content/index.md`: начиная с Hugo 0.123 файл `index.*` в корне `content/` превращает домашнюю страницу в leaf bundle, и весь остальной контент (работы и текстовые страницы) перестаёт считаться страницами.
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
- Кэш `resources/_gen` через `actions/cache` — иначе Hugo ресайзит все картинки заново на каждом прогоне. Ключ завязан на `HUGO_VERSION` (у разных версий Hugo разная схема имён сгенерированных файлов) и на `hashFiles('assets/images/**')`.
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
Тема подключала kit `kit.fontawesome.com/bf18cd1a66.js`, принадлежащий её автору: на этом домене он отдаёт **403**, иконки не рисовались нигде, а блок соцсетей в шапке занимал 25px пустоты. Блок и скрипт удалены. Контакты выводятся текстом на главной (`layouts/landing/single.html`) из `params.socials`; оттуда же берётся `sameAs` для JSON-LD, поэтому сам список в `config.yaml` нужен. Отдельная страница контактов хранит ссылки в теле `content/contacts.md`. Добавлять иконки — только своим inline-SVG, не внешним kit'ом.

### Полоса с волнами (шапка)
- Выводится из `layouts/partials/banner.html`, который вызывается в конце `partials/navbar.html` — то есть на всех страницах сразу.
- Зазоры и предельная высота — CSS-переменные в `assets/css/site.css`: `--banner-gap-top`, `--banner-gap-bottom` и `--banner-max-height`. На ширине ≤ 768px переопределяются меньшими значениями.
- `--banner-gap-bottom` на десктопе `0` (контент идёт сразу под волнами), на телефоне `0.9rem` — там полоса тоньше и вплотную смотрелась тесно. Переменная задаёт `padding-top` у `section.section` и отдельно у `#desktop.section` / `#mobile.section`: у галереи свои секции с id, и правило темы `#mobile.section { padding: 3rem 0.8rem }` перебивает селектор по классу.
- На телефоне у `nav.navbar` снят нижний паддинг (30px от темы) — из-за него между меню и полосой зияла дыра.
- В исходной картинке графика занимает не всю высоту: после ресайза до 1800px волны лежат в строках 39–193, остальное — прозрачные поля. `banner.html` отрезает их двумя кропами (Hugo поддерживает только якоря, не смещения), иначе полоса заданной высоты срезала верхушки волн.
- По ширине полоса тянется без искажений (`height: auto`); `--banner-max-height` ограничивает её мягким сжатием (`object-fit: fill`), а не обрезкой — при 1440px это сжатие около 1.2x.
- Раньше эта картинка лежала в `images:` у `home.md` и `about.md` и показывалась только на этих двух страницах.

### Изображения
- `params.showImageCaptions: true` в `config.yaml` глобально включает подписи из `alt` под крупными изображениями — в слайдере и на отдельных страницах работ. Значение `false` скрывает подписи. Сам атрибут `alt` сохраняется в обоих режимах; при скрытых подписях изображению доступно больше высоты. Если параметр не задан, подписи скрыты.
- Подпись выводится как `<figcaption>` внутри `.slide-figure`. Класс `.has-caption` добавляется слайду только при включённом параметре и непустом `alt`; стили в `assets/css/site.css` оставляют место для текста и навигации.
- Превью галереи — 1000px WebP q82, крупный просмотр — 2000px WebP q85 (задаётся в оверрайдах `slides/slider.html` и `slides/slide.html`). WebP уменьшает вес сборки; итоговый размер зависит от набора работ.
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
│   ├── contacts.md          # Контакты, /contacts/
│   ├── 404.md
│   ├── tags/
│   │   ├── _index.md
│   │   └── {design,arts,graphics,miniatures,theater,archive}/_index.md   # Настройки разделов
│   └── work/
│       ├── _index.md        # build.render: never (страница /work/ не нужна)
│       ├── design/          # 17 работ (дизайн: игрушки, пазлы, календари, открытки...)
│       ├── arts/            # 24 работы (живопись)
│       ├── graphics/        # 14 работ (9 рисунков + 5 фотографий выставки и открыток)
│       ├── miniatures/      # 19 работ (миниатюры и макеты)
│       └── theater/         # 27 фото спектаклей + 12 чертежей и моделей
├── assets/
│   ├── css/site.css         # Стили проекта (подключаются с fingerprint)
│   └── images/              # Изображения для Hugo Pipes (ресайз, WebP)
│       ├── brand/logo.png   # Логотип → навбар, favicon, apple-touch-icon
│       ├── design/
│       ├── arts/
│       ├── graphics/
│       └── miniatures/      # JPEG/PNG для сайта, originals/ для исходных HEIC
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

### Порядок работ

Локальный визуальный редактор: `node tools/order-editor/server.mjs` → `http://127.0.0.1:1314/`.
На Windows: `.\tools\order-editor\start.cmd` (находит Node.js в PATH или в `.tools/node/node.exe`,
Hugo — в PATH, `HUGO_BINARY` или локальном `.tools/hugo/hugo.exe`; `.tools/` исключён из Git).
Требует Node.js ≥ 20 и Hugo extended ≥ 0.166.0; путь к Hugo можно передать через `--hugo`.
Подробности — `tools/order-editor/README.md`. Пять разделов, три колонки, перетаскивание;
сохранение перестановки меняет `weight` в front matter выбранного раздела (большие веса раньше).
Клик на изображение открывает редактирование подписи (`alt`); «Применить» меняет черновик,
«Сохранить изменения» записывает его в файлы. При правке только подписей веса не меняются.
Общая галерея сортируется по тем же весам. Единую последовательность для сетки, слайдера
и редактора возвращает `layouts/partials/helpers/portfolio-posts.html`.
`layouts/index.order.json` используется только с дополнительным локальным конфигом
`tools/order-editor/hugo.yaml`; редактор и его JSON не публикуются обычной сборкой.

### Предпросмотр сайта

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
| миниатюры  | `/tags/miniatures/`| miniatures | 3                |
| театр      | `/tags/theater/`| theater  | 3                  |
| галерея    | `/tags/archive/`| archive  | 6                  |
| контакты   | `/contacts/`    | —        | —                  |

### Миниатюры
- Английское имя раздела, тег и каталог — `miniatures`; прежняя папка `assets/images/models/` переименована в `assets/images/miniatures/`.
- Страницы — `content/work/miniatures/`, настройки раздела и обложка — `content/tags/miniatures/_index.md`.
- Для HEIC подготовлены JPEG, которые использует Hugo; исходные HEIC сохранены с описательными именами в `assets/images/miniatures/originals/` и не подключены к страницам.
- Раздел доступен из главного меню; карточки разделов на главной больше не выводятся.

### Театр
- Тег и каталог — `theater`; фотографии — `assets/images/theater/`, страницы — `content/work/theater/`.
- 25 фотографий девяти спектаклей: «Аляска», «Тим в мире бактерий», «Лампёшка», «ШОП», «Конёк-горбунок», «Золотая антилопа», «Дада сказка», «Вокруг света за 80 дней», «Незнайка».
- Каждый кадр — отдельная работа; `title` и `alt` содержат только название спектакля, без описания кадра и слова «Спектакль». Все кадры также входят в `archive`. Порядок по умолчанию следует списку спектаклей выше, внутри спектакля — номеру файла.
- Для 12 рабочих чертежей и моделей декораций `title` и `alt` одинаковы: «Чертежи и модели декораций». Файлы и страницы — `scenery-drawings-models-1` … `scenery-drawings-models-12`.
- У двух фотографий декораций `stage-scenery-1` и `stage-scenery-2` по просьбе автора `title` и `alt` — «Спектакль».
- Раздел доступен в меню и локальном редакторе порядка работ.

## Known Issues & TODOs

*Проверено 2026-11-08 на Hugo 0.166.0: `hugo --minify --panicOnWarning` собирается без warning'ов (137 страниц, 347 обработанных изображений). Подписи ранее проверены во включённом и выключенном режиме; для театра проверены включённые подписи. Всего 113 работ: 17 — дизайн, 24 — живопись, 14 — графика, 19 — миниатюры, 39 — театр (27 фотографий спектаклей и 12 чертежей и моделей). Интеграционный тест редактора проверяет порядок всех пяти разделов в сетке и слайдере.*

- Тема заморожена апстримом: любые несовместимости с будущими версиями Hugo придётся чинить оверрайдами в `layouts/`.
- У большинства работ название скрыто через `hideTitle: true`; авторские сведения о годе и технике ещё не собраны. Видимые подписи берутся из `alt` и управляются через `params.showImageCaptions`.
- `alt` у работ написан по изображению, а не со слов автора: техника живописи и графики нигде не указана, поэтому в описаниях её нет.
- Неиспользуемые изображения в `assets/images/`: `graphics/zebru.jpg` (нет .md), `about.png`, `gtd.png`, `banner.png` — нигде не упоминаются.
- Аналитика не настроена (ни Google Analytics, ни Plausible) — непонятно, что смотрят на сайте.
- Дизайн и искусство живут в одной галерее `/tags/archive/` вперемешку; отдельных кейсов по дизайну (задача → решение → результат) нет.
- При обновлении Hugo меняется схема имён сгенерированных картинок (`*_hu<hash>.webp`) — старый кэш в `resources/_gen` можно удалять, он пересоберётся.
