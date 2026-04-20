# Frontend — Uber Design System

## Stack
- Expo (managed)
- NativeWind / Tailwind CSS
- React Native

## Design System — Uber Style
Переписуємо весь дизайн під стиль Uber. Дотримуйся цих правил:

### Кольори
- Background: #000000 (чорний)
- Surface/Card: #1A1A1A, #111111
- Primary accent: #FFFFFF (білий текст/кнопки)
- Secondary: #333333
- Success/Active: #00B14F (зелений Uber)
- Text primary: #FFFFFF
- Text secondary: #999999
- Border: #2C2C2C

### Типографіка
- Шрифт: System font або Inter
- Заголовки: font-bold, text-2xl+, tracking-tight
- Body: text-base, text-gray-300
- Кнопки: font-semibold, uppercase або sentence case

### Компоненти
- Кнопки: rounded-xl, py-4, px-6, bg-white (primary), bg-zinc-800 (secondary)
- Картки: bg-zinc-900, rounded-2xl, p-4
- Inputs: bg-zinc-900, border border-zinc-700, rounded-xl
- Bottom sheets: bg-zinc-950, rounded-t-3xl
- Icons: мінімалістичні, лінійні

### Принципи
- Мінімалізм — менше елементів, більше простору
- Dark-first — все темне
- Великі touch targets (мін 48px висота)
- Щедрі відступи (padding: p-4 мінімум)

## Що НЕ чіпати
- Логіка та функціональність
- API calls
- Navigation structure
- State management