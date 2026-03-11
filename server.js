const express = require('express');
const cors = require('cors');

const app = express();

// Разрешаем React-приложению отправлять сюда данные
app.use(cors());
// Учим сервер понимать JSON
app.use(express.json());

// ==========================================
// ВАШИ НАСТРОЙКИ ТЕЛЕГРАМ
// ==========================================
// Примечание: В будущем лучше перенести эти токены в скрытые переменные (.env)
const BOT_TOKEN = '8768403997:AAGu0Ns_YsH8R_btcmRFX5XpE134PyTZzDA'; 
const CHAT_ID = '5128572641'; 

// Адрес, по которому сервер будет ждать заказы
app.post('/api/order', async (req, res) => {
  try {
    const orderData = req.body;
    console.log('📦 Получен новый заказ:', orderData.details.name);

    // Собираем текст сообщения
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

    // Отправляем в Телеграм
    const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    // В Node.js fetch доступен по умолчанию в последних версиях (v18+)
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.description);
    }

    console.log('✅ Заказ успешно отправлен в Телеграм!');
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Ошибка при отправке в Телеграм:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// ИЗМЕНЕНИЕ ДЛЯ ДЕПЛОЯ: 
// Облачные сервисы (например, Render или Heroku) сами решают, какой порт использовать.
// Мы должны слушать process.env.PORT, а если его нет (на локальном компьютере) — порт 3000.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту: ${PORT}`);
  console.log(`Слушаю заказы по адресу: http://localhost:${PORT}/api/order`);
});