# Inventory Management System - ADAPTIV

نظام ويب متكامل لإدارة المخزون والجرد، يدعم استيراد البيانات من Excel و Odoo.

## الميزات

- **إدارة المنتجات**: SKU، باركود، وحدة، أسعار، حد أدنى للمخزون
- **مخازن متعددة**: تتبع الكميات لكل مخزن على حدة
- **حركات المخزون**: إدخال، إخراج، تحويل بين مخازن
- **الجرد**: مقارنة الكمية الفعلية مع رصيد النظام وتطبيق التعديلات تلقائياً
- **التقارير**: نواقص المخزون، فروقات الجرد، لوحة تحكم
- **استيراد Excel/CSV**: استيراد المنتجات والكميات
- **مزامنة Odoo**: جلب المنتجات والمخزون من Odoo عبر XML-RPC
- **صلاحيات المستخدمين**: مدير، أمين مخزن، مشاهد

## التشغيل

### 1. Backend (Python)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (Node.js)

```powershell
cd frontend
npm install
npm run dev
```

افتح المتصفح على: **http://localhost:5173**

## حسابات الدخول الافتراضية

| المستخدم | كلمة المرور | الصلاحية |
|----------|-------------|----------|
| admin | admin123 | مدير |
| warehouse | warehouse123 | أمين مخزن |

## استيراد Excel

يدعم الملفات بالأعمدة التالية (عربي أو إنجليزي):

| العمود | أسماء مقبولة |
|--------|-------------|
| SKU | sku, code, كود, رمز |
| الاسم | name, اسم, product_name |
| الكمية | quantity, qty, كمية, stock |
| المخزن | warehouse, مخزن |
| سعر التكلفة | cost_price, standard_price |
| ... | وغيرها |

## API Docs

بعد تشغيل Backend: http://localhost:8000/docs
