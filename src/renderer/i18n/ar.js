// src/renderer/i18n/ar.js
// Egyptian Arabic translations — ALL Arabic text lives here.
// No Arabic text anywhere else in src/renderer/ except pages/styleguide/sample-data.js.

export const ar = {
  // ── App ────────────────────────────────────────────────────────────────
  app: {
    name:    'كاشير محمد فوزي',
    version: 'الإصدار',
    loading: 'جاري التحميل...',
    ready:   'جاهز',
    error:   'خطأ',
    retry:   'إعادة المحاولة',
    close:   'إغلاق',
    confirm: 'تأكيد',
    cancel:  'إلغاء',
    save:    'حفظ',
    delete:  'حذف',
    edit:    'تعديل',
    add:     'إضافة',
    back:    'رجوع',
    next:    'التالي',
    done:    'تم',
    yes:     'نعم',
    no:      'لا',
    or:      'أو',
    and:     'و',
    search:  'بحث',
    clear:   'مسح',
    reset:   'إعادة ضبط',
    refresh: 'تحديث',
    print:   'طباعة',
    export:  'تصدير',
    today:   'اليوم',
    total:   'الإجمالي',
    monogram:'ك',
  },

  // ── Navigation ─────────────────────────────────────────────────────────
  nav: {
    home:       'الرئيسية',
    cashier:    'الكاشير',
    kitchen:    'المطبخ',
    tables:     'الصالة',
    delivery:   'التوصيل',
    menu:       'المنيو',
    menu_label: 'القائمة الرئيسية',
    inventory:  'المخزون',
    reports:    'التقارير',
    settings:   'الإعدادات',
    users:      'المستخدمين',
    shifts:     'الورديات',
    expenses:   'المصروفات',
    customers:  'العملاء',
    backup:     'النسخ الاحتياطي',
    logout:     'تسجيل الخروج',
    expand:     'توسيع الشريط الجانبي',
    collapse:   'طي الشريط الجانبي',
  },

  // ── Common actions / labels ───────────────────────────────────────────
  common: {
    id:         'الرقم',
    name:       'الاسم',
    description:'الوصف',
    price:      'السعر',
    quantity:   'الكمية',
    total:      'الإجمالي',
    subtotal:   'المجموع قبل الضريبة',
    tax:        'الضريبة',
    service:    'رسوم الخدمة',
    discount:   'الخصم',
    status:     'الحالة',
    date:       'التاريخ',
    time:       'الوقت',
    type:       'النوع',
    category:   'القسم',
    note:       'ملاحظة',
    phone:      'الهاتف',
    address:    'العنوان',
    created:    'تاريخ الإنشاء',
    updated:    'آخر تحديث',
    actions:    'إجراءات',
    amount:     'المبلغ',
    paid:       'المدفوع',
    change:     'الباقي',
    balance:    'الرصيد',
    open:       'مفتوح',
    closed:     'مغلق',
    active:     'نشط',
    inactive:   'غير نشط',
    all:        'الكل',
    none:       'لا يوجد',
    new:        'جديد',
    old:        'قديم',
    from:       'من',
    to:         'إلى',
  },

  // ── App Shell ─────────────────────────────────────────────────────────
  shell: {
    shift: {
      open:    'وردية مفتوحة',
      closed:  'لا توجد وردية',
      elapsed: 'مدة الوردية',
    },
    printer: {
      ok:      'الطابعة جاهزة',
      error:   'خطأ في الطابعة',
      offline: 'الطابعة غير متصلة',
    },
    clock: 'الساعة',
    user:  'المستخدم الحالي',
    version: 'الإصدار',
  },

  // ── Errors ────────────────────────────────────────────────────────────
  errors: {
    VALIDATION:      'بيانات غير صحيحة',
    NOT_FOUND:       'العنصر غير موجود',
    FORBIDDEN:       'غير مصرح بهذه العملية',
    UNAUTHENTICATED: 'يرجى تسجيل الدخول أولاً',
    CONFLICT:        'تعارض في البيانات',
    DB_ERROR:        'خطأ في قاعدة البيانات',
    INTERNAL:        'خطأ داخلي في النظام',
    UNKNOWN_CHANNEL: 'قناة اتصال غير معروفة',
    BAD_CHANNEL:     'اسم قناة غير صحيح',
    BAD_SENDER:      'مصدر غير مصرح به',
    UNKNOWN:         'خطأ غير متوقع',
    network:         'تعذّر الاتصال بالتطبيق',
    timeout:         'انتهت مهلة العملية',
    boot_failed:     'فشل تشغيل التطبيق',
    api_unavailable: 'واجهة التطبيق غير متاحة',
  },

  // ── Router ───────────────────────────────────────────────────────────
  router: {
    load_error: 'خطأ في تحميل الصفحة',
  },

  // ── Table component ────────────────────────────────────────────────────
  table: {
    loading:     'جاري التحميل...',
    empty:       'لا توجد بيانات',
    page:        'الصفحة',
    of:          'من',
    rows:        'صف',
    rowsPerPage: 'صفوف في الصفحة',
    prev:        'السابق',
    next:        'التالي',
    first:       'الأول',
    last:        'الأخير',
    sort_asc:    'ترتيب تصاعدي',
    sort_desc:   'ترتيب تنازلي',
    sort_none:   'بدون ترتيب',
    selected:    'محدد',
    total_rows:  'إجمالي الصفوف',
  },

  // ── Numpad ───────────────────────────────────────────────────────────
  numpad: {
    label_default: 'لوحة الأرقام',
    clear:      'مسح',
    backspace:  'حذف',
    confirm:    'تأكيد',
    cancel:     'إلغاء',
    enter:      'إدخال',
    qty_label:  'الكمية',
    price_label:'السعر',
    amount_label:'المبلغ',
    discount_label: 'الخصم',
  },

  // ── Toast notifications ───────────────────────────────────────────────
  toast: {
    success:  'تمت العملية بنجاح',
    error:    'حدث خطأ',
    warning:  'تحذير',
    info:     'معلومة',
    dismiss:  'إخفاء',
    undo:     'تراجع',
  },

  // ── Confirm dialog ────────────────────────────────────────────────────
  confirm: {
    title:      'تأكيد العملية',
    message:    'هل أنت متأكد من تنفيذ هذه العملية؟',
    confirm_btn:'تأكيد',
    cancel_btn: 'إلغاء',
    delete_title:   'تأكيد الحذف',
    delete_message: 'هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع.',
    delete_btn:     'حذف',
    logout_title:   'تأكيد تسجيل الخروج',
    logout_message: 'هل تريد تسجيل الخروج؟',
    logout_btn:     'تسجيل الخروج',
  },

  // ── Placeholders / empty states ────────────────────────────────────────
  placeholder: {
    in_development: 'قيد التطوير',
    dev_notice:     'هذا القسم قيد التطوير وسيتم بناؤه بالكامل في الجزء المخصص له وفقاً لعقد المشروع.',
    back_home:      'العودة للرئيسية',
    search:   'ابحث هنا...',
    no_data:  'لا توجد بيانات',
    loading:  'جاري التحميل...',
    empty_list: 'القائمة فارغة',
    type_to_search: 'اكتب للبحث...',
    select_option: 'اختر...',
  },

  // ── Not found page ─────────────────────────────────────────────────────
  notFound: {
    title:   'الصفحة غير موجودة',
    message: 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
    btn:     'العودة للرئيسية',
    code:    '404',
  },

  // ── Forbidden page ─────────────────────────────────────────────────────
  forbidden: {
    title:   'غير مصرح',
    message: 'ليس لديك صلاحية الوصول إلى هذه الصفحة.',
    btn:     'العودة للرئيسية',
    code:    '403',
  },

  // ── Boot sequence messages ─────────────────────────────────────────────
  boot: {
    checking_api:    'التحقق من الاتصال...',
    loading_fonts:   'تحميل الخطوط...',
    loading_app:     'تهيئة التطبيق...',
    loading_session: 'تحميل بيانات المستخدم...',
    almost_ready:    'اكتمل التحميل...',
    failed:          'فشل تشغيل التطبيق',
    contact_support: 'يرجى التواصل مع الدعم الفني',
  },

  // ── Home page ─────────────────────────────────────────────────────────
  home: {
    title:         'لوحة التحكم',
    welcome:       'مرحباً',
    welcome_user:  'مرحباً، {{name}}',
    subtitle:      'نظام كاشير محمد فوزي لإدارة نقاط البيع والمطاعم',
    quick_actions: 'الإجراءات السريعة',
    system_status: 'حالة النظام',
    system_info:   'معلومات النظام',
    db_status:     'قاعدة البيانات',
    demo_data:     'بيانات تجريبية',
    ready_status:  'جاهزة',
    empty_status:  'فارغة',
    ipc_connection:'اتصال IPC',
    connected:     'متصل',
    failed:        'فشل',
    latency:       'زمن الاستجابة',
    connection_status: 'حالة الاتصال',
    version_label: 'الإصدار',
    electron_label:'Electron',
    sqlite_label:  'SQLite',
    schema_label:  'إصدار الـ Schema',
    shift_status:  'الوردية الحالية',
    printer_status:'الطابعة',
    go_cashier:    'الكاشير',
    go_kitchen:    'المطبخ',
    go_tables:     'الصالة',
    go_reports:    'التقارير',
    go_settings:   'الإعدادات',
    go_menu:       'المنيو',
    desc_cashier:  'نقطة البيع والطلبات',
    desc_tables:   'إدارة الطاولات والجلسات',
    desc_kitchen:  'شاشة المطبخ والطلبات النشطة',
    desc_menu:     'الأصناف وقوائم الأسعار',
    desc_reports:  'المبيعات والتقارير المالية',
    desc_settings: 'إعدادات النظام والطباعة',
    desc_styleguide:'دليل التصميم والمكونات',
  },

  // ── Styleguide page ────────────────────────────────────────────────────
  styleguide: {
    title:        'دليل التصميم',
    subtitle:     'مكونات ونظام الألوان',
    section: {
      colors:      'الألوان',
      typography:  'الطباعة',
      spacing:     'المسافات',
      icons:       'الأيقونات',
      buttons:     'الأزرار',
      inputs:      'حقول الإدخال',
      select:      'القوائم المنسدلة',
      numpad:      'لوحة الأرقام',
      badges:      'الشارات',
      toasts:      'الإشعارات',
      modals:      'النوافذ المنبثقة',
      tables:      'الجداول',
      tabs:        'التبويبات',
      diagnostics: 'التشخيص',
    },
    diagnostics: {
      title:          'فحص الواجهة',
      network:        'العزل عن الشبكة',
      isolation:      'عزل الـ Context',
      touch_targets:  'أحجام عناصر التفاعل',
      contrast:       'التباين اللوني (WCAG)',
      fonts:          'الخطوط',
      viewport:       'نافذة العرض',
      pass:           'ناجح',
      fail:           'فاشل',
      warn:           'تحذير',
      running:        'جاري الفحص...',
    },
  },
};

// Flatten helper — used by t() for dot notation
function flatten(obj, prefix = '', result = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, result);
    } else {
      result[key] = v;
    }
  }
  return result;
}

export const AR_FLAT = flatten(ar);
