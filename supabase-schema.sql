-- ============================================
-- VizForm: Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categories: Экстерьер / Интерьер / Техническая визуализация
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Экстерьер', 'exterior', 'Визуализация экстерьеров зданий и сооружений', 'exterior', 1),
  ('Интерьер', 'interior', 'Визуализация интерьеров помещений', 'interior', 2),
  ('Техническая визуализация', 'technical', 'Продуктовая и техническая 3D-визуализация', 'technical', 3);

-- Form fields configured by admin
CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL CHECK (field_type IN ('text','textarea','select','checkbox','radio','file','url')),
  label TEXT NOT NULL,
  placeholder TEXT,
  options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Default fields for all categories based on the spec
-- Exterior fields
INSERT INTO form_fields (category_id, field_type, label, placeholder, options, is_required, sort_order)
SELECT c.id, f.field_type, f.label, f.placeholder, f.options::jsonb, f.is_required, f.sort_order
FROM categories c,
(VALUES
  ('text', 'Цели и задачи', 'Презентовать новый продукт / поддержать маркетинговые цели...', '[]', true, 1),
  ('select', 'Предполагаемый рынок распространения', '', '["РБ","РФ","Экспорт","Для внутреннего использования"]', true, 2),
  ('select', 'Целевая аудитория', '', '["B2C","Архитектор","Дилер","Конечный потребитель","Партнёры","Внутреннее использование","Иное"]', true, 3),
  ('checkbox', 'Контекст использования', '', '["Сайт","Презентация","Полиграфия","Иное"]', true, 4),
  ('select', 'Вид работ', '', '["Разработка","Уникализация","Корректировка существующего изображения"]', true, 5),
  ('text', 'Товарное направление / серия', 'ГВ / иное', '[]', false, 6),
  ('checkbox', 'Формат финального файла', '', '["PNG","TIF","PSD"]', true, 7),
  ('text', 'Соотношение сторон, размер в px', '16:9, квадрат, 1920×1080 px...', '[]', true, 8),
  ('text', 'Характеристики продукта', 'Цвет полотна, тип ткани...', '[]', true, 9),
  ('textarea', 'Обязательные элементы сцены', 'Авто, барбекю, бассейн, человек...', '[]', false, 10),
  ('text', 'Погода, время суток', 'Снег, вечер, закат...', '[]', false, 11),
  ('textarea', 'Описание сцены', 'Подробное описание того, что хотелось бы видеть в итоге...', '[]', true, 12),
  ('radio', 'Дополнительная визуализация без людей', '', '["Да","Нет"]', false, 13),
  ('file', 'Референс', 'Приложите изображение-референс', '[]', false, 14),
  ('url', 'Ссылка на stp-файл продукта', 'https://disk.alutech24.com/', '[]', true, 15),
  ('text', 'Желаемый срок готовности', 'Приоритет / дедлайн', '[]', false, 16)
) AS f(field_type, label, placeholder, options, is_required, sort_order)
WHERE c.slug = 'exterior';

-- Interior fields
INSERT INTO form_fields (category_id, field_type, label, placeholder, options, is_required, sort_order)
SELECT c.id, f.field_type, f.label, f.placeholder, f.options::jsonb, f.is_required, f.sort_order
FROM categories c,
(VALUES
  ('text', 'Цели и задачи', 'Презентовать новый продукт / поддержать маркетинговые цели...', '[]', true, 1),
  ('select', 'Предполагаемый рынок распространения', '', '["РБ","РФ","Экспорт","Для внутреннего использования"]', true, 2),
  ('select', 'Целевая аудитория', '', '["B2C","Архитектор","Дилер","Конечный потребитель","Партнёры","Внутреннее использование","Иное"]', true, 3),
  ('checkbox', 'Контекст использования', '', '["Сайт","Презентация","Полиграфия","Иное"]', true, 4),
  ('select', 'Вид работ', '', '["Разработка","Уникализация","Корректировка существующего изображения"]', true, 5),
  ('text', 'Товарное направление / серия', 'ГВ / иное', '[]', false, 6),
  ('checkbox', 'Формат финального файла', '', '["PNG","TIF","PSD"]', true, 7),
  ('text', 'Соотношение сторон, размер в px', '16:9, квадрат, 1920×1080 px...', '[]', true, 8),
  ('text', 'Характеристики продукта', 'Цвет полотна, тип ткани...', '[]', true, 9),
  ('textarea', 'Обязательные элементы сцены', 'Диван, стол, освещение, растения...', '[]', false, 10),
  ('text', 'Погода, время суток, освещение', 'Дневной свет, вечернее освещение...', '[]', false, 11),
  ('textarea', 'Описание сцены', 'Подробное описание интерьера...', '[]', true, 12),
  ('radio', 'Дополнительная визуализация без людей', '', '["Да","Нет"]', false, 13),
  ('file', 'Референс', 'Приложите изображение-референс', '[]', false, 14),
  ('url', 'Ссылка на stp-файл продукта', 'https://disk.alutech24.com/', '[]', true, 15),
  ('text', 'Желаемый срок готовности', 'Приоритет / дедлайн', '[]', false, 16)
) AS f(field_type, label, placeholder, options, is_required, sort_order)
WHERE c.slug = 'interior';

-- Technical visualization fields
INSERT INTO form_fields (category_id, field_type, label, placeholder, options, is_required, sort_order)
SELECT c.id, f.field_type, f.label, f.placeholder, f.options::jsonb, f.is_required, f.sort_order
FROM categories c,
(VALUES
  ('text', 'Цели и задачи', 'Презентовать новый продукт / подготовка материалов...', '[]', true, 1),
  ('select', 'Предполагаемый рынок распространения', '', '["РБ","РФ","Экспорт","Для внутреннего использования"]', true, 2),
  ('select', 'Целевая аудитория', '', '["B2C","Архитектор","Дилер","Конечный потребитель","Партнёры","Внутреннее использование","Иное"]', true, 3),
  ('checkbox', 'Контекст использования', '', '["Сайт","Презентация","Полиграфия","Иное"]', true, 4),
  ('select', 'Вид работ', '', '["Разработка","Уникализация","Корректировка существующего изображения"]', true, 5),
  ('text', 'Товарное направление / серия', 'ГВ / иное', '[]', false, 6),
  ('checkbox', 'Формат финального файла', '', '["PNG","TIF","PSD"]', true, 7),
  ('text', 'Соотношение сторон, размер в px', '16:9, квадрат, 1920×1080 px...', '[]', true, 8),
  ('text', 'Характеристики продукта', 'Цвет полотна, тип ткани...', '[]', true, 9),
  ('select', 'Фон', '', '["С фоном","Без фона"]', true, 10),
  ('select', 'Тени', '', '["С падающими тенями","Без теней"]', true, 11),
  ('textarea', 'Описание визуализации', 'Подробное описание продукта и ракурсов...', '[]', true, 12),
  ('file', 'Референс', 'Приложите изображение-референс', '[]', false, 13),
  ('url', 'Ссылка на stp-файл продукта', 'https://disk.alutech24.com/', '[]', true, 14),
  ('text', 'Желаемый срок готовности', 'Приоритет / дедлайн', '[]', false, 15)
) AS f(field_type, label, placeholder, options, is_required, sort_order)
WHERE c.slug = 'technical';

-- Submissions from clients
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  data JSONB NOT NULL DEFAULT '{}',
  files JSONB DEFAULT '[]',
  status TEXT DEFAULT 'new' CHECK (status IN ('new','in_progress','completed','cancelled')),
  submitter_name TEXT,
  submitter_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- App settings (email, telegram)
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'
);

INSERT INTO app_settings (key, value) VALUES
  ('notifications', '{"email_enabled": false, "email_to": "", "telegram_enabled": false, "telegram_bot_token": "", "telegram_chat_id": ""}'),
  ('admin', '{"password_hash": ""}');

-- Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Public read for categories and fields
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "form_fields_public_read" ON form_fields FOR SELECT USING (true);

-- Public insert for submissions
CREATE POLICY "submissions_public_insert" ON submissions FOR INSERT WITH CHECK (true);

-- Authenticated full access
CREATE POLICY "categories_auth_all" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "form_fields_auth_all" ON form_fields FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "submissions_auth_all" ON submissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "app_settings_auth_all" ON app_settings FOR ALL USING (auth.role() = 'authenticated');

-- For anon access via service key in admin
CREATE POLICY "app_settings_anon_read" ON app_settings FOR SELECT USING (true);
