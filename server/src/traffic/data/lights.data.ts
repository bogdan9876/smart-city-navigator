export interface TrafficLight {
  id: number;
  name: string;
  lat: number;
  lng: number;
  green: number;
  red: number;
  start: number;
}

const BASE_START = 1709724000000;

export const trafficLights: TrafficLight[] = [
  // Центр
  { id: 1, name: 'Оперний театр', lat: 49.844447, lng: 24.025374, green: 30, red: 20, start: BASE_START },
  { id: 2, name: 'Пл. Ринок', lat: 49.8416, lng: 24.0324, green: 45, red: 15, start: BASE_START + 5000 },
  { id: 3, name: 'Митна площа', lat: 49.8396, lng: 24.0358, green: 25, red: 35, start: BASE_START + 10000 },
  { id: 4, name: 'Свободи – Дорошенка', lat: 49.8399, lng: 24.0268, green: 35, red: 25, start: BASE_START + 15000 },
  { id: 5, name: 'Шевченка – Гнатюка', lat: 49.8431, lng: 24.0213, green: 30, red: 30, start: BASE_START + 20000 },
  { id: 6, name: 'Франка – Січових Стрільців', lat: 49.8390, lng: 24.0289, green: 28, red: 22, start: BASE_START + 25000 },

  // Захід / вокзал
  { id: 7, name: 'Привокзальна площа', lat: 49.8377, lng: 24.0051, green: 40, red: 30, start: BASE_START + 30000 },
  { id: 8, name: 'Городоцька – Чернівецька', lat: 49.8411, lng: 24.0158, green: 35, red: 25, start: BASE_START + 35000 },
  { id: 9, name: 'Городоцька – Під Дубом', lat: 49.8440, lng: 24.0181, green: 30, red: 20, start: BASE_START + 40000 },
  { id: 10, name: 'Городоцька – Княгині Ольги', lat: 49.8318, lng: 24.0029, green: 45, red: 30, start: BASE_START + 45000 },
  { id: 11, name: 'Любінська – Городоцька', lat: 49.8290, lng: 23.9831, green: 40, red: 35, start: BASE_START + 50000 },

  // Південь / Сихів
  { id: 12, name: 'Стрийська – Наукова', lat: 49.8169, lng: 24.0247, green: 45, red: 30, start: BASE_START + 55000 },
  { id: 13, name: 'Стрийська – Вернадського', lat: 49.8060, lng: 24.0292, green: 40, red: 25, start: BASE_START + 60000 },
  { id: 14, name: 'Стрийська – Хоткевича', lat: 49.7960, lng: 24.0355, green: 45, red: 30, start: BASE_START + 65000 },
  { id: 15, name: 'Чер. Калини – Хоткевича', lat: 49.7953, lng: 24.0572, green: 35, red: 25, start: BASE_START + 70000 },
  { id: 16, name: 'Чер. Калини – Довженка', lat: 49.7901, lng: 24.0468, green: 30, red: 25, start: BASE_START + 75000 },

  // Схід / Личаківка, Пасічна
  { id: 17, name: 'Личаківська – Пекарська', lat: 49.8361, lng: 24.0489, green: 35, red: 25, start: BASE_START + 80000 },
  { id: 18, name: 'Личаківська – Глинянський тракт', lat: 49.8277, lng: 24.0676, green: 40, red: 30, start: BASE_START + 85000 },
  { id: 19, name: 'Зелена – Пасічна', lat: 49.8249, lng: 24.0636, green: 35, red: 25, start: BASE_START + 90000 },
  { id: 20, name: 'Зелена – Стуса', lat: 49.8300, lng: 24.0446, green: 30, red: 20, start: BASE_START + 95000 },

  // Північ / Чорновола, Хмельницького
  { id: 21, name: 'Чорновола – Замарстинівська', lat: 49.8510, lng: 24.0310, green: 40, red: 30, start: BASE_START + 100000 },
  { id: 22, name: 'Чорновола – Липинського', lat: 49.8600, lng: 24.0372, green: 45, red: 30, start: BASE_START + 105000 },
  { id: 23, name: 'Хмельницького – Варшавська', lat: 49.8690, lng: 24.0390, green: 45, red: 35, start: BASE_START + 110000 },
  { id: 24, name: 'Хмельницького – Липинського', lat: 49.8578, lng: 24.0255, green: 35, red: 25, start: BASE_START + 115000 },

  // Захід / Кульпарків, Бандери
  { id: 25, name: 'Кульпарківська – Наукова', lat: 49.8163, lng: 24.0143, green: 40, red: 30, start: BASE_START + 120000 },
  { id: 26, name: 'Кульпарківська – Княгині Ольги', lat: 49.8250, lng: 24.0016, green: 35, red: 25, start: BASE_START + 125000 },
  { id: 27, name: 'Бандери – Коновальця', lat: 49.8355, lng: 24.0174, green: 30, red: 20, start: BASE_START + 130000 },
  { id: 28, name: 'Бандери – Чупринки', lat: 49.8353, lng: 24.0103, green: 30, red: 25, start: BASE_START + 135000 },
];
