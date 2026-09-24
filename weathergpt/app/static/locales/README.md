# Frontend translations

The language selector is populated from `/api/languages`. To translate the
frontend for a language, add a UTF-8 JSON file named after its language code
here, for example `ta.json` for Tamil. The file should contain the UI text keys
from the English `T.en` dictionary in `../app.js`:

```json
{
  "nav_home": "…",
  "nav_chat": "…",
  "send": "…"
}
```

Only include translated keys; missing keys fall back to that language's
built-in strings (English or Hindi) and then English. To add a completely new
language, also add its code and display name to `LANGUAGES` in
`../../chat.py`. The frontend loads the matching JSON file when that language
is selected. Alert body translations use keys such as
`alert_HEAVY_RAIN_HARM`, `alert_HEAVY_RAIN_HELP`, `alert_HEATWAVE_HARM`,
`alert_COLD_FROST_HARM`, `alert_STRONG_WIND_HARM`, and `alert_DRY_SPELL_HARM`.
Keep `{amount}` and `{crop}` placeholders in those strings.
The hourly rain chart heading can be translated with the `rain_hourly` key.
