**PRD: личный сайт-блог / портфолио**

*Free-first стек: Next.js + PayloadCMS + MongoDB Atlas + Vercel*

Версия 1.1 · 22 мая 2026

| Ключевое изменение: в MVP Postgres заменяется на MongoDB Atlas Free Tier, чтобы сохранить целевой бюджет \$0 и не держать платный SQL-инстанс. PayloadCMS остается ядром CMS, админки, авторизации и контентной модели. |
|----|

# 1. Контекст и решение по стеку {#контекст-и-решение-по-стеку}

Изначально рассматривался вариант с PostgreSQL. Для учебного проекта это хороший выбор, но для личного блога под резюме важнее другое ограничение: не платить за инфраструктуру, пока нет нагрузки и коммерческого использования.

Решение для MVP: использовать MongoDB Atlas Free Tier как production-базу, Vercel Hobby как hosting/deployment platform, Vercel Blob как object storage для изображений и встроенные возможности PayloadCMS для админки, авторизации и управления контентом.

PostgreSQL не удаляется из долгосрочной картины: миграция на Neon/Supabase/Postgres остается возможной, если проект перерастет формат портфолио или если потребуется больше практики с relational schema, SQL, migrations и transactional consistency.

# 2. Цели продукта {#цели-продукта}

- **Публичное портфолио.** Сайт должен показывать профиль автора, опыт, проекты, контакты и блоговые публикации.

- **Блог.** Автор должен публиковать статьи через админку без ручного редактирования кода.

- **Комментарии.** Посетители должны оставлять комментарии под постами; комментарии проходят модерацию.

- **Базовая аналитика.** Автор должен видеть просмотры, популярные публикации и техническое состояние сайта.

- **Нулевой бюджет MVP.** Инфраструктура должна укладываться в бесплатные тарифы, без платного SQL-инстанса и без обязательного custom domain.

- **Резюме-ценность.** Проект должен демонстрировать владение Next.js, TypeScript, CMS, API, базой данных, деплоем, security basics и analytics basics.

# 3. Не цели MVP {#не-цели-mvp}

- Нет real-time чата в первом релизе.

- Нет платного домена в обязательном объеме MVP; можно использовать vercel.app subdomain.

- Нет email-рассылки, transactional email и push-уведомлений.

- Нет отдельного backend-сервера на NestJS/Express.

- Нет Redis, очередей, микросервисов и сложной event-driven архитектуры.

- Нет полноценной продуктовой аналитики уровня SaaS; достаточно site analytics и post-level counters.

# 4. Пользователи и сценарии {#пользователи-и-сценарии}

Основные роли: публичный посетитель, рекрутер/технический интервьюер, автор-администратор.

- **Посетитель.** Читает страницу About, просматривает проекты, открывает статьи, оставляет комментарий.

- **Рекрутер.** Быстро оценивает стек, качество UI, тексты, проекты и контактные данные.

- **Автор-администратор.** Входит в админку PayloadCMS, создает публикации, загружает изображения, модерирует комментарии, смотрит статистику.

# 5. Free-first ограничения {#free-first-ограничения}

MVP проектируется под жесткое ограничение: ежемесячная стоимость инфраструктуры должна быть равна \$0, пока сайт используется как личное портфолио и блог.

- Hosting: Vercel Hobby. Ограничение: personal/non-commercial use и resource limits.

- Database: MongoDB Atlas Free Tier. Ограничение: shared resources и 512 MB storage.

- Media storage: Vercel Blob Hobby. Ограничение: доступ к Blob может быть приостановлен при превышении лимитов до следующего периода.

- Domain: на MVP допускается бесплатный subdomain вида \*.vercel.app. Custom domain --- отдельная платная опция и не входит в MVP.

- Analytics: Vercel Web Analytics и Speed Insights в рамках включенных лимитов; платные аналитические сервисы не обязательны.

- Backups: ручной export/backup script, так как free tiers обычно имеют ограниченные backup-возможности.

# 6. Рекомендуемый стек MVP {#рекомендуемый-стек-mvp}

- **Language.** TypeScript.

- **Frontend/backend shell.** Next.js App Router.

- **CMS/admin.** PayloadCMS.

- **Database.** MongoDB Atlas Free Tier через @payloadcms/db-mongodb / mongooseAdapter.

- **ORM/query layer.** Prisma, Drizzle и Kysely не используются в MVP, потому что Payload сам работает через database adapter.

- **UI.** Tailwind CSS + shadcn/ui.

- **Auth.** PayloadCMS Auth для админов и авторов.

- **Hosting.** Vercel Hobby.

- **Media.** Vercel Blob для cover images и изображений внутри постов.

- **Analytics.** Vercel Web Analytics + Speed Insights; внутренние счетчики постов в MongoDB опционально.

- **Error monitoring.** Минимально: Vercel Logs. Sentry/PostHog можно добавить позже в рамках free tier, если нужна глубже диагностика.

# 7. Архитектура {#архитектура}

Приложение остается монолитным full-stack проектом. Next.js обслуживает публичные страницы, API/server actions и PayloadCMS admin. PayloadCMS подключается к MongoDB Atlas через MongoDB adapter. Медиафайлы не хранятся в базе и не пишутся на файловую систему Vercel; они загружаются в object storage.

Высокоуровневый поток: пользователь открывает публичную страницу → Next.js рендерит страницу и получает данные из Payload Local API или REST API → Payload читает документы из MongoDB Atlas → изображения подтягиваются из Vercel Blob → просмотры фиксируются через Vercel Analytics и, при необходимости, через lightweight post counter.

Админский поток: автор входит в /admin → создает или редактирует Post в PayloadCMS → загружает Media в Blob → публикует Post → Next.js revalidation обновляет публичные страницы.

# 8. Контентная модель PayloadCMS {#контентная-модель-payloadcms}

Коллекции должны быть минимальными, но достаточными для полноценного блога и портфолио.

- **Users.** Администраторы и авторы. Поля: email, password hash через Payload, role, displayName, avatar, createdAt, updatedAt.

- **Posts.** Публикации блога. Поля: title, slug, excerpt, content, coverImage, status, tags, author, publishedAt, updatedAt, readingTime, seoTitle, seoDescription.

- **Tags.** Теги публикаций. Поля: name, slug, description.

- **Comments.** Комментарии посетителей. Поля: post, parentComment, authorName, authorEmailHash, body, status, ipHash, userAgentHash, createdAt, updatedAt, deletedAt.

- **Media.** Изображения и файлы. Поля: filename, alt, mimeType, size, width, height, blobUrl, storageKey, createdAt.

- **Projects.** Проекты для портфолио. Поля: title, slug, description, stack, repositoryUrl, demoUrl, coverImage, featured, sortOrder.

- **SiteSettings.** Глобальные настройки: name, headline, bio, socialLinks, contactEmail, seoDefaults, navigation.

- **PostMetrics.** Опциональная коллекция для внутренних счетчиков. Поля: post, date, views, uniqueViewsApprox, lastViewedAt.

# 9. Функциональные требования {#функциональные-требования}

## 9.1 Публичный сайт {#публичный-сайт}

- Главная страница с кратким позиционированием автора и ссылками на блог/проекты/контакты.

- Страница About с опытом, стеком, образованием/сертификациями и ссылками на GitHub/LinkedIn/Telegram.

- Страница Projects со списком проектов и отдельными страницами проектов.

- Страница Blog со списком опубликованных постов, пагинацией, тегами и поиском по title/excerpt/content.

- Страница Post с контентом, cover image, тегами, датой публикации, reading time, Open Graph metadata и блоком комментариев.

- Страница Contact без платного email-сервиса: mailto-ссылка или простая форма, сохраняющая сообщения в Payload collection без отправки email.

- Sitemap.xml, robots.txt, RSS feed и canonical URLs.

## 9.2 Админка PayloadCMS {#админка-payloadcms}

- Администратор входит в /admin через PayloadCMS Auth.

- Администратор создает, редактирует, публикует, архивирует и удаляет посты.

- Посты имеют статусы draft, published, archived.

- Администратор загружает cover image и изображения для статьи через Media collection.

- Администратор управляет тегами и проектами.

- Администратор модерирует комментарии: approve, reject, soft delete.

- Администратор видит базовые post-level metrics, если включена коллекция PostMetrics.

## 9.3 Комментарии {#комментарии}

- Гость может оставить комментарий под опубликованным постом.

- Комментарий по умолчанию получает status=pending и не отображается публично до модерации.

- Email автора комментария не отображается публично и хранится только в виде hash, если email вообще собирается.

- HTML в комментариях запрещен. Разрешается plain text и ограниченная длина, например до 2 000 символов.

- Защита от спама: honeypot field, минимальное время заполнения формы, rate limit по ipHash, userAgentHash и postId.

- Ответы на комментарии поддерживаются через parentComment, но глубина дерева ограничена двумя уровнями.

## 9.4 Аналитика и статистика {#аналитика-и-статистика}

- Основная site analytics ведется через Vercel Web Analytics: page views, referrers, top pages.

- Performance analytics ведется через Vercel Speed Insights.

- Для dashboard внутри админки допускается lightweight счетчик просмотров постов в MongoDB.

- Чтобы не раздувать базу, не нужно сохранять каждое событие просмотра как отдельный документ. Предпочтительно хранить агрегат по postId + date.

- Unique views считаются приблизительно через hash cookie/IP/User-Agent с TTL-подходом. Точная идентификация пользователей не требуется.

# 10. Нефункциональные требования {#нефункциональные-требования}

- **Cost.** MVP должен работать на бесплатных тарифах. При достижении лимитов сервис может деградировать или временно остановить часть функциональности, но не должен генерировать неожиданные расходы.

- **Performance.** Публичные страницы должны загружаться быстро за счет статической генерации, ISR/revalidation, image optimization и минимального client-side JavaScript.

- **Availability.** Для MVP допустимо отсутствие enterprise SLA; бесплатные тарифы не рассматриваются как high-availability production infrastructure.

- **Security.** Админка закрыта авторизацией, публичные write endpoints валидируются, секреты хранятся в environment variables.

- **Privacy.** Не хранить лишние персональные данные. Email комментатора хранить только при необходимости и предпочтительно в hash-виде.

- **Maintainability.** Контентная модель должна быть простой; кастомный код не должен дублировать функции PayloadCMS без причины.

- **Accessibility.** UI должен поддерживать keyboard navigation, readable contrast, alt text для изображений и корректную структуру headings.

- **SEO.** Для всех публичных страниц должны быть title, description, Open Graph tags, sitemap и RSS.

# 11. Security requirements {#security-requirements}

- PAYLOAD_SECRET должен быть длинным и храниться только в Vercel Environment Variables.

- MongoDB Atlas должен разрешать подключения только с безопасной конфигурацией network access. Для Vercel может потребоваться аккуратная настройка allowlist/serverless access.

- Доступ к коллекциям Posts, Projects, Tags, Media и SiteSettings на запись разрешен только администраторам.

- Доступ к Comments на создание разрешен публично, но только через валидируемый endpoint и с moderation workflow.

- Все входные данные валидируются: длина, тип, обязательность, forbidden HTML, forbidden scripts.

- Комментарии и формы должны иметь honeypot и rate-limit protection.

- Ошибки не должны раскрывать stack traces публичным пользователям.

- Admin route не должен индексироваться поисковиками.

# 12. Routes {#routes}

- /

- /about

- /projects

- /projects/\[slug\]

- /blog

- /blog/\[slug\]

- /tags/\[slug\]

- /contact

- /rss.xml

- /sitemap.xml

- /admin

- /api/comments

- /api/revalidate или server action для revalidation после публикации

# 13. Environment variables {#environment-variables}

- DATABASE_URI --- MongoDB Atlas connection string.

- PAYLOAD_SECRET --- секрет PayloadCMS.

- NEXT_PUBLIC_SITE_URL --- публичный URL сайта.

- BLOB_READ_WRITE_TOKEN --- токен Vercel Blob, если используется Vercel Blob adapter/integration.

- REVALIDATION_SECRET --- секрет для безопасной revalidation.

- ANALYTICS_ENABLED --- флаг включения аналитики.

- COMMENT_RATE_LIMIT_WINDOW_SECONDS --- окно rate limiting.

- COMMENT_RATE_LIMIT_MAX --- максимальное число комментариев за окно.

# 14. Критерии приемки MVP {#критерии-приемки-mvp}

1.  Сайт деплоится на Vercel Hobby и открывается по бесплатному vercel.app domain.

2.  Администратор может войти в Payload admin panel.

3.  Администратор может создать черновик поста, добавить cover image, опубликовать пост и увидеть его на публичной странице.

4.  Публичная страница поста имеет SEO metadata, readable layout, tags, date, reading time и комментарии.

5.  Гость может отправить комментарий; комментарий появляется в админке в статусе pending.

6.  Администратор может одобрить комментарий, после чего он отображается публично.

7.  Vercel Web Analytics фиксирует просмотры страниц.

8.  Media uploads не пишутся в локальную файловую систему Vercel.

9.  Нет платных ресурсов в обязательной конфигурации MVP.

10. Секреты не закоммичены в репозиторий.

# 15. Риски и компромиссы {#риски-и-компромиссы}

- **MongoDB вместо Postgres.** Уменьшает SQL-практику, но лучше соответствует цели \$0 и хорошо совместим с PayloadCMS.

- **Free tier limits.** При росте трафика или количества медиа возможны ограничения, деградация или необходимость апгрейда.

- **Vercel Hobby non-commercial.** Проект должен оставаться личным портфолио/блогом, а не клиентским или коммерческим приложением.

- **512 MB MongoDB storage.** Достаточно для текстового блога и комментариев, но медиа должны храниться отдельно в Blob, не в базе.

- **No paid domain.** Бесплатный vercel.app domain менее презентабелен, но соответствует MVP. Custom domain можно добавить позже.

- **Backups.** На бесплатных тарифах backup strategy должна быть ручной или полуавтоматической.

# 16. Roadmap {#roadmap}

## MVP

- Next.js + PayloadCMS проект.

- MongoDB Atlas Free Tier подключен как production database.

- Payload collections: Users, Posts, Tags, Comments, Media, Projects, SiteSettings.

- Публичные страницы: home, about, projects, blog, post, contact.

- Админка, публикация постов, moderation comments, media uploads.

- Vercel Web Analytics + Speed Insights.

## V1

- Поиск по блогу.

- RSS feed.

- Sitemap automation.

- Internal post metrics dashboard.

- Dark theme.

- Improved anti-spam.

## V2

- Custom domain.

- Sentry или PostHog free tier.

- Email notifications для новых комментариев.

- Миграция на Postgres/Neon/Supabase, если нужно усилить relational practice.

- Отдельный backend на NestJS, если цель сместится с portfolio delivery на backend practice.

# 17. Решение по базе данных {#решение-по-базе-данных}

Для текущего PRD база MVP --- MongoDB Atlas Free Tier. Postgres остается альтернативой, но не является базовым выбором из-за требования максимального бесплатного запуска. MongoDB подходит для PayloadCMS, потому что Payload официально поддерживает MongoDB adapter, а структура контента в CMS естественно ложится в document model.

Использовать Prisma, Drizzle или Kysely в этом варианте не нужно. Они будут только усложнять архитектуру, потому что Payload уже предоставляет schema/config layer, CRUD, admin UI, access control, hooks и database adapter.

# 18. Открытые вопросы {#открытые-вопросы}

- Нужен ли custom domain сразу или достаточно vercel.app subdomain для MVP?

- Нужно ли собирать email комментаторов или достаточно name + text?

- Нужны ли email-уведомления о новых комментариях или достаточно проверки админки?

- Нужно ли показывать счетчик просмотров публично или только в админке?

- Нужны ли отдельные страницы проектов или достаточно секции на главной?

# 19. Источники и проверенные предпосылки {#источники-и-проверенные-предпосылки}

Актуальность проверена на 22 мая 2026. Тарифы и лимиты бесплатных сервисов могут измениться, поэтому перед production launch нужно повторно проверить pricing pages.

- **PayloadCMS Database docs.** Payload официально поддерживает adapters для MongoDB, Postgres и SQLite. [[https://payloadcms.com/docs/database/overview]{.underline}](https://payloadcms.com/docs/database/overview)

- **MongoDB Atlas Pricing.** Free tier указан как \$0/hour, free forever, 512 MB storage, shared RAM/shared vCPU. [[https://www.mongodb.com/pricing]{.underline}](https://www.mongodb.com/pricing)

- **Vercel Hobby Plan.** Hobby plan бесплатный и предназначен для personal projects / small-scale applications; есть monthly included usage и ограничения non-commercial use. [[https://vercel.com/docs/plans/hobby]{.underline}](https://vercel.com/docs/plans/hobby)

- **Vercel Blob Usage and Pricing.** Vercel Blob free для Hobby users within limits; при превышении лимитов доступ может быть заблокирован до следующего периода, без дополнительной оплаты. [[https://vercel.com/docs/vercel-blob/usage-and-pricing]{.underline}](https://vercel.com/docs/vercel-blob/usage-and-pricing)
