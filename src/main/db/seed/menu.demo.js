// src/main/db/seed/menu.demo.js
// Demo menu data (is_demo = 1). Removed by categories.clearDemo() + tables.clearDemo().
// All prices in piasters (EGP × 100).

export const DEMO_CATEGORIES = [
  { name_ar: 'مشويات',           sort_order: 1 },
  { name_ar: 'أطباق شرقية',      sort_order: 2 },
  { name_ar: 'مقبلات وسلطات',    sort_order: 3 },
  { name_ar: 'مخبوزات',          sort_order: 4 },
  { name_ar: 'حلويات',           sort_order: 5 },
  { name_ar: 'مشروبات',          sort_order: 6 },
];

// Items per category (by category name_ar)
export const DEMO_ITEMS = {
  'مشويات': [
    { name_ar: 'كباب حلة',   base_price: 8500,  has_sizes: 0, prep_station: 'kitchen' },
    { name_ar: 'كفتة مشوية', base_price: 7500,  has_sizes: 0, prep_station: 'kitchen' },
    { name_ar: 'ريش ضاني',   base_price: 14000, has_sizes: 0, prep_station: 'kitchen' },
    { name_ar: 'فراخ مشوية', base_price: 0,     has_sizes: 1, prep_station: 'kitchen' },
    { name_ar: 'مشكل مشاوي', base_price: 18000, has_sizes: 0, prep_station: 'kitchen' },
  ],
  'أطباق شرقية': [
    { name_ar: 'كشري',       base_price: 0,    has_sizes: 1, prep_station: 'cold' },
    { name_ar: 'ملوخية بالفراخ', base_price: 7000, has_sizes: 0, prep_station: 'kitchen' },
    { name_ar: 'محشي ورق',   base_price: 8000, has_sizes: 0, prep_station: 'kitchen' },
    { name_ar: 'طاجن بامية بالتلت', base_price: 9000, has_sizes: 0, prep_station: 'kitchen' },
    { name_ar: 'فتة لحم',    base_price: 12000, has_sizes: 0, prep_station: 'kitchen' },
  ],
  'مقبلات وسلطات': [
    { name_ar: 'سلطة خضرا',  base_price: 2500, has_sizes: 0, prep_station: 'cold' },
    { name_ar: 'تبولة',       base_price: 3000, has_sizes: 0, prep_station: 'cold' },
    { name_ar: 'حمص بالطحينة', base_price: 3500, has_sizes: 0, prep_station: 'cold' },
    { name_ar: 'بابا غنوج',   base_price: 3500, has_sizes: 0, prep_station: 'cold' },
    { name_ar: 'جبنة بيضا',   base_price: 2000, has_sizes: 0, prep_station: 'cold', tax_exempt: 1 },
  ],
  'مخبوزات': [
    { name_ar: 'فطير مشلتت',  base_price: 0, has_sizes: 1, prep_station: 'kitchen' },
    { name_ar: 'حواوشي',      base_price: 5000, has_sizes: 0, prep_station: 'kitchen' },
    { name_ar: 'سمبوسك',      base_price: 1500, has_sizes: 0, prep_station: 'kitchen' },
    { name_ar: 'خبز عيش بلدي', base_price: 500, has_sizes: 0, prep_station: 'kitchen', service_exempt: 1, tax_exempt: 1 },
  ],
  'حلويات': [
    { name_ar: 'أم علي',      base_price: 4500, has_sizes: 0, prep_station: 'cold' },
    { name_ar: 'كنافة بالقشطة', base_price: 4000, has_sizes: 0, prep_station: 'cold' },
    { name_ar: 'بسبوسة',      base_price: 2500, has_sizes: 0, prep_station: 'cold' },
    { name_ar: 'رز باللبن',    base_price: 3000, has_sizes: 0, prep_station: 'cold' },
  ],
  'مشروبات': [
    { name_ar: 'مياه معدنية', base_price: 1000, has_sizes: 0, prep_station: 'bar', service_exempt: 1 },
    { name_ar: 'عصير مانجو',  base_price: 3500, has_sizes: 0, prep_station: 'bar' },
    { name_ar: 'شاي أحمر',    base_price: 1500, has_sizes: 0, prep_station: 'bar' },
    { name_ar: 'قهوة عربي',   base_price: 2500, has_sizes: 0, prep_station: 'bar' },
  ],
};

// Sizes for sized items (item_name_ar → sizes[])
export const DEMO_SIZES = {
  'فراخ مشوية': [
    { name_ar: 'نصف فرخة', price: 7500, sort_order: 1 },
    { name_ar: 'فرخة كاملة', price: 13000, sort_order: 2 },
  ],
  'كشري': [
    { name_ar: 'صغير', price: 2500, sort_order: 1 },
    { name_ar: 'وسط',  price: 3500, sort_order: 2 },
    { name_ar: 'كبير', price: 5000, sort_order: 3 },
  ],
  'فطير مشلتت': [
    { name_ar: 'فطيرة ربع', price: 3000, sort_order: 1 },
    { name_ar: 'فطيرة نص',  price: 5500, sort_order: 2 },
    { name_ar: 'فطيرة كاملة', price: 10000, sort_order: 3 },
  ],
};

// Demo modifier groups
export const DEMO_MODIFIER_GROUPS = [
  {
    name_ar: 'الإضافات',
    min_select: 0, max_select: 3, is_required: 0,
    options: [
      { name_ar: 'جبن إضافي',     price_delta: 1500 },
      { name_ar: 'شطة حارة',      price_delta: 500 },
      { name_ar: 'صوص طماطم',     price_delta: 500 },
    ],
    items: ['كباب حلة', 'كفتة مشوية', 'حواوشي']
  },
  {
    name_ar: 'درجة الاستواء',
    min_select: 1, max_select: 1, is_required: 1,
    options: [
      { name_ar: 'مضبوط', price_delta: 0 },
      { name_ar: 'وسط',   price_delta: 0 },
      { name_ar: 'جيد',   price_delta: 0 },
    ],
    items: ['ريش ضاني']
  },
];

// Demo dining tables
export const DEMO_TABLES = [
  { code: 'T1', name_ar: 'ترابيزة 1', area: 'صالة', capacity: 4, sort_order: 1 },
  { code: 'T2', name_ar: 'ترابيزة 2', area: 'صالة', capacity: 4, sort_order: 2 },
  { code: 'T3', name_ar: 'ترابيزة 3', area: 'صالة', capacity: 6, sort_order: 3 },
  { code: 'T4', name_ar: 'ترابيزة 4', area: 'صالة', capacity: 4, sort_order: 4 },
  { code: 'T5', name_ar: 'ترابيزة 5', area: 'صالة', capacity: 2, sort_order: 5 },
  { code: 'T6', name_ar: 'ترابيزة 6', area: 'صالة', capacity: 4, sort_order: 6 },
  { code: 'T7', name_ar: 'ترابيزة 7', area: 'صالة', capacity: 8, sort_order: 7 },
  { code: 'T8', name_ar: 'ترابيزة 8', area: 'صالة', capacity: 4, sort_order: 8 },
  { code: 'T9',  name_ar: 'تراس 1', area: 'تراس', capacity: 4, sort_order: 9 },
  { code: 'T10', name_ar: 'تراس 2', area: 'تراس', capacity: 4, sort_order: 10 },
  { code: 'T11', name_ar: 'تراس 3', area: 'تراس', capacity: 6, sort_order: 11 },
  { code: 'T12', name_ar: 'تراس 4', area: 'تراس', capacity: 2, sort_order: 12 },
];

