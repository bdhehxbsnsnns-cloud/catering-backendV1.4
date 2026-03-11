const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. НАСТРОЙКИ ТЕЛЕГРАМ
// ==========================================
const BOT_TOKEN = '8768403997:AAGu0Ns_YsH8R_btcmRFX5XpE134PyTZzDA'; 
const CHAT_ID = '5128572641'; 

// ==========================================
// 2. ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ MONGODB
// ==========================================
const MONGODB_URI = 'mongodb+srv://bdhehxbsnsnns_db_user:Qw7MMqIavYOKyxpS@cluster0.lecqdq2.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Успешно подключились к базе данных MongoDB!'))
  .catch((err) => console.error('❌ Ошибка подключения к MongoDB:', err));

// ==========================================
// 3. СТРУКТУРА ТОВАРА В БАЗЕ (Схема)
// ==========================================
// Добавляем новую схему для Разделов
const categorySchema = new mongoose.Schema({
  name: String
});
const Category = mongoose.model('Category', categorySchema);

// Обновляем схему Товара (добавляем массив categories)
const menuItemSchema = new mongoose.Schema({
  name: String,
  category: String, // оставили для совместимости со старыми товарами
  categories: [String], // НОВОЕ ПОЛЕ: массив ID разделов
  price: Number,
  desc: String,
  image: String
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// ==========================================
// 4. НОВЫЕ ПУТИ ДЛЯ АДМИНКИ (API)
// ==========================================

// --- API ДЛЯ РАЗДЕЛОВ ---
// Получить все разделы
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

// Создать новый раздел
app.post('/api/categories', async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

// Удалить раздел
app.delete('/api/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

// --- API ДЛЯ ТОВАРОВ ---
// Отдать все товары (для витрины и админки)
app.get('/api/menu', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

// Добавить новый товар
app.post('/api/menu', async (req, res) => {
  try {
    const newItem = new MenuItem(req.body);
    await newItem.save();
    res.json({ success: true, item: newItem });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

// Изменить существующий товар (цену, фото или описание)
app.put('/api/menu/:id', async (req, res) => {
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item: updatedItem });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

// Удалить товар
app.delete('/api/menu/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

// ==========================================
// 5. ОТПРАВКА ЗАКАЗА В ТЕЛЕГРАМ
// ==========================================
app.post('/api/order', async (req, res) => {
  try {
    const orderData = req.body;
    console.log('📦 Получен новый заказ:', orderData.details.name);

    let message = `🍽 <b>Новый заказ на кейтеринг!</b>\n\n`;
    message += `👤 <b>Имя:</b> ${orderData.details.name}\n`;
    message += `📞 <b>Телефон:</b> ${orderData.details.phone}\n`;
    message += `📅 <b>Дата:</b> ${orderData.details.date}\n`;
    message += `👥 <b>Гостей:</b> ${orderData.details.guests} чел.\n\n`;
    
    message += `📋 <b>Состав заказа:</b>\n`;
    orderData.items.forEach(item => {
      message += `▫️ ${item.name} (${item.quantity} шт.) — ${item.price * item.quantity} ₽\n`;
    });
    message += `\n💰 <b>ИТОГО:</b> ${orderData.total} ₽`;

    const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' })
    });

    const result = await response.json();
    if (!result.ok) throw new Error(result.description);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту: ${PORT}`);
});
