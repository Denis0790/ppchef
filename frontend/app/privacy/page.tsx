"use client";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", fontFamily: "'DM Sans', sans-serif" }}>

      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #ece7de", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <div onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}>←</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#4F7453" }}>Политика конфиденциальности</div>
      </div>

      <div style={{ padding: "24px 20px 60px", display: "flex", flexDirection: "column", gap: 20 }}>

        <div style={{ fontSize: 12, color: "#aaa" }}>Последнее обновление: март 2026 г.</div>

        {[
          {
            title: "1. Общие положения",
            text: `ПП Шеф (далее — «Сервис», «мы») уважает конфиденциальность пользователей и обязуется защищать их персональные данные в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».\n\nИспользуя Сервис, вы соглашаетесь с настоящей Политикой конфиденциальности.`,
          },
          {
            title: "2. Какие данные мы собираем",
            text: `• Email адрес — при регистрации\n• Данные профиля — суточная норма КБЖУ, стоп-слова (если вы их указали)\n• Избранные рецепты\n• Информация об устройстве и браузере — для улучшения работы Сервиса\n• IP адрес — для безопасности и предотвращения мошенничества`,
          },
          {
            title: "3. Как мы используем данные",
            text: `• Для предоставления функций Сервиса\n• Для отправки уведомлений связанных с аккаунтом (подтверждение email, восстановление пароля)\n• Для улучшения качества Сервиса\n• Для обработки платежей за подписку\n\nМы не продаём и не передаём ваши данные третьим лицам в коммерческих целях.`,
          },
          {
            title: "4. Хранение данных",
            text: `Данные хранятся на защищённых серверах в России. Мы принимаем технические и организационные меры для защиты ваших данных от несанкционированного доступа, изменения или уничтожения.`,
          },
          {
            title: "5. Платёжные данные",
            text: `Платежи обрабатываются через сервис ЮКасса (ООО «ЮМани»). Мы не храним данные банковских карт — они передаются напрямую платёжному оператору по зашифрованному каналу.`,
          },
          {
            title: "6. Cookies",
            text: `Сервис использует cookies для поддержания сессии авторизации. Cookies не содержат персональных данных и не передаются третьим лицам.`,
          },
          {
            title: "7. Ваши права",
            text: `Вы имеете право:\n• Получить информацию о хранящихся данных\n• Исправить неточные данные\n• Удалить аккаунт и все связанные данные\n• Отозвать согласие на обработку данных\n\nДля реализации прав обратитесь: support@ppchef.ru`,
          },
          {
            title: "8. Удаление аккаунта",
            text: `Вы можете запросить удаление аккаунта и всех связанных данных, написав на support@ppchef.ru. Удаление происходит в течение 30 дней.`,
          },
          {
            title: "9. Возраст пользователей",
            text: `Сервис предназначен для лиц старше 18 лет. Мы не собираем намеренно данные несовершеннолетних.`,
          },
          {
            title: "10. Изменения политики",
            text: `Мы можем обновлять настоящую Политику. При существенных изменениях уведомим пользователей по email. Продолжение использования Сервиса после изменений означает согласие с новой редакцией.`,
          },
          {
            title: "11. Контакты",
            text: `По вопросам обработки персональных данных:\nEmail: support@ppchef.ru\nСайт: ppchef.ru`,
          },
        ].map(({ title, text }) => (
          <div key={title} style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: "#4F7453", marginBottom: 10 }}>
              {title}
            </div>
            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8, whiteSpace: "pre-line" }}>
              {text}
            </div>
          </div>
        ))}

        <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", lineHeight: 1.6 }}>
          ПП Шеф · ppchef.ru · support@ppchef.ru
        </div>
      </div>
    </main>
  );
}