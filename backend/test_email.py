import resend
import os
from dotenv import load_dotenv
load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")
print(f"API Key: {resend.api_key[:10]}...")
print(f"From: {os.getenv('EMAIL_FROM')}")
print(f"From Name: {os.getenv('EMAIL_FROM_NAME')}")

result = resend.Emails.send({
    "from": f"{os.getenv('EMAIL_FROM_NAME')} <{os.getenv('EMAIL_FROM')}>",
    "to": "hmellleva@yandex.ru",
    "subject": "Тест ПП Шеф",
    "html": "<h1>Работает!</h1>",
})
print(f"Результат: {result}")
