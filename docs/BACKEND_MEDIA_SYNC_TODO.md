# Backend sync TODO (соответствие фронту)

Документ фиксирует, что уже сделано на бэкенде (`tgapp-`) и что ещё нужно, чтобы `GET /v1/generate/models` + `POST /v1/generate/*` полностью соответствовали UI фронта (`tgapp_front`).

Обновлено: 2026-07-04.

---

## Архитектура (как договорились с фронтом)

1. **Каталог** — `GET /v1/generate/models` → у каждой модели `price` + `options[].value_prices` (дельты в CyberCoins относительно base).
2. **Списание** — `pkg/billing/*_option_prices.go` → `*GenerationPrice()` в `pkg/generate/handler.go` через `tokenguard`.
3. **Генерация** — те же поля из тела POST должны доходить до WaveSpeed в `pkg/ai/wavespeed_*.go`.
4. Фронт дублирует формулы в `src/lib/mediaGenerationPrice.js` **только как fallback**, если API недоступен. Источник истины — бэкенд.

---

## Уже сделано на бэкенде (проверено / частично в этой сессии)

### Каталог и биллинг (ядро)

| Область | Статус | Файлы |
|---------|--------|-------|
| `GET /v1/generate/models` + `value_prices` | ✅ | `pkg/ai/media_model_options.go` (`withOptionPrices`) |
| Image billing (GPT, Nano Banana, Grok, Qwen size…) | ✅ | `pkg/billing/image_option_prices.go` |
| Video billing (Kling per-sec + resolution tier, Seedance, WAN…) | ✅ | `pkg/billing/video_option_prices.go` |
| Audio billing (Mureka songs, ACE-Step duration, TTS length) | ✅ | `pkg/billing/audio_option_prices.go` |
| 3D billing (Tripo H3.1, Hunyuan V3, Rodin V2.5…) | ✅ | `pkg/billing/three_d_option_prices.go` |
| Списание по опциям в handler | ✅ | `pkg/generate/handler.go` (`ensure*GenerationAccess`) |

### FLUX Dev (последняя правка под WaveSpeed UI)

| Пункт | Статус | Детали |
|-------|--------|--------|
| Опции в каталоге: `aspect_ratio`, `width`, `height`, `seed` | ✅ | `media_model_options.go` case `flux-dev` |
| WaveSpeed: `size` из `width×height` или `size` | ✅ | `wavespeed_image_helpers.go` |
| WaveSpeed: `seed` (-1 = random) | ✅ | там же |
| WaveSpeed: `strength` 0.8 при img2i | ✅ | там же |
| `image` (singular) для img2i | ✅ | `wavespeedImageUsesSingularImage` |
| Default `output_format` jpeg | ✅ | `wavespeed_image.go` |
| Поля `width`, `height`, `guidance_scale`, `num_inference_steps` в `ImageRequest` | ✅ | `service.go` (guidance/steps сейчас **не** уходят в WaveSpeed — ок) |

### Audio / Video / 3D (уже было)

| Пункт | Статус |
|-------|--------|
| ElevenLabs: `similarity`, `stability`, `use_speaker_boost` в POST + WaveSpeed | ✅ `service.go`, `wavespeed_audio.go` |
| Video: `extend_by` | ✅ `wavespeed_video.go` |
| Video: Kling `camera_control`, `sound`, `resolution` tier | ✅ |
| 3D: Tripo texture/geometry/quad, Hunyuan `generate_type`, Rodin tier/addons | ✅ `wavespeed_3d.go` + billing |
| ACE-Step: `tags` из `style_instruction` | ✅ `wavespeed_audio.go` |

---

## TODO на бэкенде (обязательно)

### 1. FLUX Dev — довести каталог и флаги

- [ ] **`supports_edit: true`** в `GET /v1/generate/models` для `flux-dev`  
  Сейчас: `toMediaModel` → `SupportsEdit: m.EditSlug != ""` — у flux нет `EditSlug`, флаг `false`.  
  Фронт: `supportsEdit: true`, загрузка референса включена.  
  **Fix:** в `media_models.go` для `flux-dev` явно `SupportsEdit: true` (img2i на том же slug `wavespeed-ai/flux-dev`).

- [ ] **Валидация `width` / `height`** для flux: clamp **256–2048**, кратность 32 (как WaveSpeed API).  
  Файл: `pkg/ai` validate в `GenerateImage` или в `wavespeed_image_helpers.go`.

- [ ] **Синхронизация aspect_ratio → width/height** на бэкенде (если фронт пришлёт только `aspect_ratio` без width/height):  
  маппинг как на фронте (`1:1`→1024×1024, `16:9`→1024×576, …).

- [ ] **Убрать или не экспортировать** в каталог лишние поля flux (`guidance_scale`, `num_inference_steps`, `num_images`, `output_format`) — на WaveSpeed Image Generator их **нет** в UI.

### 2. ElevenLabs V3 — опции в каталоге API

Фронт отправляет и показывает:
- `voice`
- `similarity` (default 1.0)
- `stability` (default 0.5)
- `use_speaker_boost` (default true)

- [ ] Добавить в `audioModelOptions` case `elevenlabs-v3`:
  ```go
  {Key: "similarity", Type: "range", Values: []string{"0", "1"}, Default: "1.0"},
  {Key: "stability", Type: "range", Values: []string{"0", "1"}, Default: "0.5"},
  {Key: "use_speaker_boost", Type: "boolean", Values: []string{"false", "true"}, Default: "true"},
  ```
- [ ] `text_length` оставить только как tier-подсказки для TTS-цен (не влияет на генерацию ElevenLabs) — как на фронте.

### 3. Image — POST поля, которые шлёт фронт

Проверить, что **все** поля из `pickImageGenerateParams` / `telegramApi.generateImage` доходят до WaveSpeed:

| Модель | Поля POST | Проверка |
|--------|-----------|----------|
| nano-banana-2 | `web_search`, `image_search`, `resolution`, `aspect_ratio`, `output_format` | billing ✅, wavespeed ✅ |
| gpt-image-2/1.5 | `quality`, `resolution`, `aspect_ratio` | billing ✅ |
| grok-imagine-edit | `num_images`, `resolution`, `aspect_ratio` | billing ✅ |
| qwen-image* | `size`, `seed`, `negative_prompt` | wavespeed ✅; **seed в каталоге** ✅ |
| flux-dev | `width`, `height`, `size`, `seed`, `aspect_ratio` | см. §1 |
| seedream | `aspect_ratio`, `output_format` | wavespeed ✅ |

- [ ] **`num_images` для flux** — фронт убрал из UI; бэкенд не должен требовать. Если не передаётся — default 1 в WaveSpeed (сейчас не шлём — ок).

### 4. Video — POST поля

Фронт шлёт через `pickVideoGenerateParams`:

- `aspect_ratio`, `duration`, `resolution`, `negative_prompt`
- `sound`, `generate_audio`, `camera_fixed`, `turbo_mode`
- `extend_by` (happyhorse / veo extend)

- [ ] Убедиться, что **Kling `resolution`** меняет billing model id (`klingEffectiveModel`) **и** slug при генерации.
- [ ] **Seedance v2 edit**: `turbo_mode` + `resolution` → правильный slug (`video-edit-turbo`).
- [ ] **`extend_by`** в каталоге для `happyhorse-video-extend` уже есть; для `veo-3.1-extend` — цена фикс, extend_by не нужен.

- [ ] **Kling camera axes** (`camera_horizontal`, …) — в каталоге есть, фронт шлёт через `camera_control` в POST?  
  **Проверить:** фронт собирает `camera_control` в `handleGenerateVideo` или только локальный state. Если не шлёт — добавить на фронте ИЛИ убрать из каталога.

### 5. Audio — POST поля

| Модель | Поля | Бэкенд |
|--------|------|--------|
| qwen3-tts | `language`, `voice`, `style_instruction`, `reference_text`, clone: `audioBase64`, `mode=clone` | ✅ |
| omnivoice | `style_instruction`, `speed` | ✅ |
| elevenlabs-v3 | `voice`, `similarity`, `stability`, `use_speaker_boost` | WaveSpeed ✅, каталог ❌ (§2) |
| minimax | `voice`, `emotion` | ✅ |
| mureka-v9 | `number_of_songs`, `output_format`, `style_instruction` | billing ✅ |
| ace-step-1.5 | `duration`, `style_instruction`→`tags` | billing ✅ |

- [ ] **TTS billing**: для clone qwen3 длина текста — `reference_text` или `prompt`? Сейчас `audioPromptLength` только prompt. Фронт для clone берёт `referenceText || prompt`. **Синхронизировать** `audioBillingParams`.

### 6. 3D — POST поля

Фронт шлёт `pickThreeDGenerateParams`. Бэкенд `ThreeDRequest` + `threeDBillingParams`:

| Модель | Опции цены | В каталоге | В wavespeed_3d |
|--------|------------|------------|----------------|
| tripo3d-h3.1-* | texture, texture_quality, geometry_quality, quad | ✅ | ✅ |
| hunyuan3d-v3-t2d | generate_type | ✅ | проверить mapping `Geometry/Normal/LowPoly` |
| rodin-v2.5-i2d | tier, addons | ✅ | ✅ |
| meshy6 | mode, art_style, topology | ✅ | ✅ |

- [ ] **Фронт пока не показывает** `generate_type` (Hunyuan), `addons` (Rodin), `texture`/`quad` (Tripo H3.1) — когда добавят UI, каталог уже готов. Бэкенд: без изменений.

- [ ] **`topology` → POST**: meshy использует `topology`, billing 3D может не учитывать — цена фикс для meshy6. Ок.

### 7. Ошибка 402

- [ ] Текст ошибки insufficient balance: фронт ожидает **«Недостаточно монет»** (`402`). Проверить `tokenguard` / HTTP body совпадает с `apiError.js`.

---

## TODO на бэкенде (желательно / техдолг)

### Каталог API

- [ ] Тип опции `range` в JSON: сейчас `Values: ["1","50"]` без `min`/`max`/`step`. Фронт берёт min/max из статики `mediaModelOptions.js`.  
  **Улучшение:** расширить `MediaOption` полями `min`, `max`, `step` для range/number.

- [ ] `label` у опций (локализация) — сейчас пусто, фронт локализует сам.

### Мёртвый код

- [ ] `ImageRequest.GuidanceScale`, `NumInferenceSteps` — не используются после упрощения flux UI. Удалить или оставить зарезервированными с комментарием.

### Тесты

- [ ] `TestFluxDev_*` — width/height → size, seed, img2i strength.
- [ ] Интеграционный тест: `GET /v1/generate/models` snapshot для `flux-dev`, `kling-v3-std`, `mureka-v9`, `tripo3d-h3.1-t2d`.

### Деплой

- [ ] После мержа бэкенда — фронт в prod сможет **убрать** дублирующие формулы в `mediaGenerationPrice.js` (опционально), если каталог всегда доступен.

---

## Матрица: фронт ↔ бэкенд по типам медиа

### Image — расчёт цены

| Модель | Логика цены | `value_prices` в API | Фронт fallback |
|--------|-------------|----------------------|----------------|
| Большинство | `price` + Σ `value_prices` | ✅ | `calculatePrice` |
| flux-dev | фикс 5 coins | нет дельт | фикс |
| gpt-image-2 | quality × resolution table | частично (дельты) | таблица в billing |

### Video — расчёт цены

| Модель | Логика | API `value_prices` на duration |
|--------|--------|--------------------------------|
| Kling * | $/sec × duration, resolution→tier | ✅ `duration` |
| Seedance 1.5 | $/sec × duration × audio | ✅ |
| Seedance v2 edit | turbo/standard × res × 2×duration | ✅ `turbo_mode`, `resolution` |
| WAN, Vidu, HappyHorse, Hailuo | per backend formulas | ✅ |

### Audio

| Модель | Логика | API |
|--------|--------|-----|
| TTS (*-tts, omnivoice, elevenlabs, minimax) | по длине prompt | `text_length` tiers (справочно) |
| mureka-v9 | $0.045 × songs | ✅ `number_of_songs` |
| ace-step-1.5 | $0.0003 × sec | ✅ `duration` |

### 3D

| Модель | Логика | API |
|--------|--------|-----|
| tripo3d-h3.1 | base + texture + geom + quad | ✅ |
| hunyuan3d-v3 | generate_type | ✅ |
| rodin-v2.5 | tier + addons | ✅ |
| v2.5, rapid, meshy6, rodin-v2 | фикс | — |

---

## Чеклист перед релизом (бэкенд)

1. `go test ./pkg/billing/... ./pkg/ai/...`
2. Поднять API, `curl GET /v1/generate/models` — сверить `flux-dev.options` с фронтом.
3. POST smoke:
   - `flux-dev` text2img: `width=1024, height=1024, seed=-1`
   - `kling-v3-std`: `duration=10, resolution=720p`
   - `mureka-v9`: `number_of_songs=2`
   - `tripo3d-h3.1-t2d`: `texture_quality=detailed, geometry_quality=standard`
   - `elevenlabs-v3`: `similarity=1, stability=0.5, use_speaker_boost=true`
4. 402 при цене > баланса — сообщение для UI.

---

## Когда пользователь попросит «полный список для бэка»

Выдать этот файл целиком + актуальный diff `tgapp-` + отметить выполненные `[x]`.

Связанные файлы фронта:
- `src/lib/mediaGenerationPrice.js`
- `src/lib/mediaModelCatalog.js`
- `src/config/mediaModelOptions.js`
- `src/api/telegramApi.js`

Связанные файлы бэка:
- `pkg/ai/media_model_options.go`
- `pkg/ai/media_models.go`
- `pkg/ai/service.go`
- `pkg/ai/wavespeed_*.go`
- `pkg/billing/*_option_prices.go`
- `pkg/generate/handler.go`
