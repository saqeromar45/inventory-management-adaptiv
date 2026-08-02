IMS-ADAPTIV — ربط الأجهزة الأخرى

على جهاز السيرفر (هذا الجهاز):
1) شغّل start.ps1
2) تأكد أن الملف IMS.ADAPTIV.config فيه SERVER_IP الصحيح

على أي جهاز ثاني (نفس الواي فاي):
1) انسخ مجلد shared بالكامل (USB أو مشاركة شبكة)
2) شغّل Connect-IMS-ADAPTIV.bat كمسؤول مرة واحدة
3) افتح المتصفح:

   http://IMS.ADAPTIV:5173

الدخول: admin / admin123

ملاحظة:
إذا تغيّر IP السيرفر، حدّث SERVER_IP في IMS.ADAPTIV.config
ثم أعد تشغيل Connect-IMS-ADAPTIV.bat على الأجهزة الأخرى.
