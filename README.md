Главное правило: внутренние слои (бизнес-логика) ничего не знают о внешних слоях 
(Pixi.js, Skia, HTML-документ). Они общаются через интерфейсы (инверсия зависимостей).

Domain (Ядро / Сущности): Интерфейсы геометрических фигур, команды рендера, абстрактные события кликов.
Use Cases (Бизнес-логика): Сценарии приложения (например, «Добавить случайную фигуру», «Переключить сцену», «Экспортировать в PDF»).
Infrastructure / Adapters (Адаптеры): Конкретная реализация. Здесь лежат транслятор дерева Pixi в Skia, обертка над CanvasKit (Skia), обработчики системных событий мыши.
Presentation (UI): Простые HTML-компоненты (кнопки, сайдбар), которые вызывают Use Cases.

Архитектурный паттерн трансляции (Pixi -> Skia)
Передать дерево Pixi в Skia. Лучше всего применить паттерн Visitor (Посетитель) или простой Рекурсивный Маппер.
Адаптер SkiaRenderer получает на вход корень PIXI.Container.
-Он вызывает canvas.save() в Skia.
Берет pixiElement.worldTransform (матрицу трансформации Pixi), извлекает коэффициенты a, b, c, d, tx, ty и применяет их в Skia через canvas.concat(skMatrix).
Определяет тип элемента:
Если это PIXI.Graphics, запускает цикл по его graphicsData, разбирает команды (прямоугольник, линия) и рисует аналогичные в Skia через canvas.drawPath().
Если это PIXI.Sprite, берет его текстуру, конвертирует в понятный для Skia формат байт и вызывает canvas.drawImage().
Рекурсивно обходит всех детей pixiElement.children.
В конце обхода вызывает canvas.restore().
Такой подход гарантирует модульность: если завтра компания решит заменить Pixi.js на Three.js или чистый Canvas, вам нужно будет просто переписать один класс в слое infrastructure, не трогая бизнес-логику и UI.

├── .github/                     # Настройки CI/CD (опционально)
├── public/                      # Статические файлы (картинки для PIXI.Sprite, canvaskit.wasm)
│   ├── assets/
│   │   └── sample.png
│   └── canvaskit.wasm           # Скомпилированный WASM-файл Skia
├── src/
│   ├── app.ts                   # Точка входа (Инициализация приложения и DI-контейнер)
│   ├── index.html               # Разметка интерфейса
│   ├── style.css                # Стили интерфейса
│   │
│   ├── core/                    # Слой Domain & Use Cases (Чистый TS, без зависимостей от библиотек)
│   │   ├── entities/            # Базовые модели/типы данных
│   │   │   └── scene.types.ts
│   │   ├── interfaces/          # Контракты для адаптеров (Инверсия зависимостей)
│   │   │   ├── i-vector-renderer.ts
│   │   │   └── i-pdf-exporter.ts
│   │   └── use-cases/           # Сценарии автоматизации
│   │       ├── generate-shape.use-case.ts
│   │       └── export-scene.use-case.ts
│   │
│   ├── infrastructure/          # Слой Реализации (Инфраструктура)
│   │   ├── pixi/                # Всё, что связано с Pixi.js
│   │   │   ├── pixi-service.ts  # Инициализация PIXI.Application с forceCanvas=true
│   │   │   └── pixi-event-bridge.ts # Трансляция pointerDown/pointerUp
│   │   ├── skia/                # Всё, что связано со Skia (CanvasKit)
│   │   │   ├── skia-renderer.ts # Реализация i-vector-renderer.ts (перевод Pixi -> Skia)
│   │   │   └── skia-pdf-exporter.ts # Реализация i-pdf-exporter.ts (wasm backend)
│   │   └── shared/
│   │       └── matrix-math.ts   # Хелперы для работы с трансформациями
│   │
│   └── presentation/            # UI-слой (Взаимодействие с DOM)
│       ├── components/
│       │   ├── control-panel.ts # Кнопки управления
│       │   └── canvas-view.ts   # Контейнеры для отображения Pixi и Skia канвасов
│       └── ui-controller.ts     # Связующее звено между UI и Use Cases
│
├── tests/                       # Папка с тестами (TDD подход)
│   ├── mocks/                   # Моки для Pixi и Skia (чтобы тесты не падали без браузера)
│   ├── core/                    # Тесты бизнес-логики (Use Cases)
│   │   └── generate-shape.spec.ts
│   └── infrastructure/          # Интеграционные тесты адаптеров
│       └── skia-renderer.spec.ts
│
├── tsconfig.json                # Конфигурация TypeScript
├── vite.config.ts               # Конфигурация сборщика Vite (+ плагины для WASM)
├── package.json                 # Скрипты запуска и зависимости
└── README.md                    # Подробная инструкция (требование задания)
