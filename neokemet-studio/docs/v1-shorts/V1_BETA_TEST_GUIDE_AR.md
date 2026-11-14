# تجربة NeoKemetAI V1 Topic-Aware Shorts — إصدار تجريبي

هذا الفرع **نسخة تطويرية منفصلة**، ولا يستبدل V3 أو مشاريعك الأصلية.

## ما تم تنفيذه بالفعل
- وضع اختياري جديد لاختيار رسوم SVG حسب موضوع النص، دون استخدام أي API مدفوع.
- 15 رسمة/حركة SVG أصلية متخصصة في: الرسم داخل المقابر، صناعة البردي، نقل الحجارة على النيل.
- تغير اللقطة كل نحو 1–2 ثانية ضمن شورتات 15 و30 ثانية، مع توزيع الإطارات الصحيح.
- بداية مرئية بسؤال Hook مرتبط بالموضوع، وترجمة كبيرة متحركة عند توفر الصوت والتوقيت.
- دعم Script وProduction Markdown في وضع V1 الاختياري.
- تنبيه صريح عند عدم توفر رسومات مناسبة بدل استبدال الموضوع برسوم عامة غير مرتبطة.

## على Windows
1. نزّل ZIP للفرع `feature/v1-topic-aware-shorts` من GitHub وفك الضغط.
2. افتح PowerShell في مجلد `neokemet-studio`.
3. نفّذ:
   ```powershell
   npm.cmd ci --no-audit --no-fund
   npm.cmd run typecheck
   npx.cmd tsx server/selftest-v1.ts
   npm.cmd start
   ```
4. افتح `http://127.0.0.1:4173`.
5. اختر **+ New project**، ثم `2 · Script`.
6. ضع تعليقًا صوتيًا مقسمًا إلى 3–6 فقرات، وكل فقرة ستصبح مشهدًا مستقلًا.
7. فعّل **V1 topic-specific illustrated Shorts (beta)** واختر **15 seconds** أو **30 seconds**.
8. اضغط **Build storyboard from script**، ثم راجع كل مشهد في `3 · Storyboard`.
9. اضغط **Preview frame** لكل مشهد للتأكد من أن العناصر تعبّر عن النص.
10. أضف ملفات التعليق الصوتي للمشاهد أو أنشئها بالطريقة التي تريدها؛ راقب مدة الفيديو بعد الصوت، ثم صدّر MP4.

يمكنك كذلك اختيار وضع V1 في `Import Production Script (.md)` قبل اختيار الملف.

## نص سريع للاختبار (15 ثانية)
```text
How did Egyptian artists paint tombs in complete darkness?

They ground colourful pigments and worked by lamplight.

Deep underground, brushes transformed bare stone into the underworld.

Their painted walls survived for thousands of years.
```

## أمثلة جاهزة للمطورين
- `examples/v1-painting-dark-demo/project.json`
- `examples/v1-papyrus-demo/project.json`
- `examples/v1-nile-transport-demo/project.json`

لإظهار أحد هذه الأمثلة في قائمة المشاريع، انسخ مجلد المثال إلى `projects/` في **نسخة الاختبار فقط**. لا تنسخ إلى مجلد مشروع إنتاج قديم.

## قيود هذا الإصدار
- يدعم ثلاثة مجالات مرسومة فقط حتى الآن؛ **ليس مولّد رسومات عامة لأي موضوع**.
- تتكرر بعض العناصر ضمن الموضوع الواحد عند الحاجة إلى عشرات اللقطات؛ استكمال مكتبة الأفعال والأشياء خطوة لاحقة.
- مخطط 15/30 ثانية لا يستطيع فرض مدة خاطئة على صوت أطول؛ عند استيراد MP3 حقيقي ستمدد الأداة المشهد لحماية السرد.
- الترجمة تعتمد على تسجيل/توقيت السرد، وليست ترجمة تلقائية من كلمات تظهر قبل إضافة الصوت.
- لم تُجرَ مقارنة فعلية لاحتفاظ المشاهدين؛ معايير المونتاج ليست ضمانًا لانتشار الشورت.
