import * as maplibregl from "./vendor/maplibre-gl.mjs";

/* ------------------------------------------------------------------
   Settings you may want to change
   ------------------------------------------------------------------ */
// Boundary files for the map, inside app/static/. Add one line per state file.
const MAP_FILES = [];
// Property names that may hold the district name inside those files.
const NAME_KEYS = ["district", "DISTRICT", "dtname", "DT_NAME", "NAME_2", "dist_name", "district_name", "name", "NAME"];

const VIEWS = ["home", "chat", "crops", "soil", "nutrients", "map", "alerts"];

/* ------------------------------------------------------------------
   Interface text. To add a language: copy the "en" block, translate it,
   and use the language code from /api/languages (for example "ta").
   Missing keys fall back to English.
   ------------------------------------------------------------------ */
const T = {
  en: {
    app_tag: "Know the weather before it reaches your field.",
    hero_sub: "Live forecasts, soil health and crop advice for your district, in your own language.",
    login: "Log in", register_tab: "Register", phone: "Phone number", otp: "OTP",
    sendotp: "Send OTP", verify: "Verify and log in", name: "Name", state: "State", district: "District",
    crop_main: "Main crop", register_btn: "Create account",
    demo_otp: "Demo mode: tap to fill OTP {otp}", registered: "Account created. Now log in.",
    nav_home: "Home", nav_chat: "Chat", nav_crops: "Crops", nav_soil: "Soil", nav_nutrients: "Nutrients", nav_map: "Map", nav_alerts: "Alerts",
    nutrient_title: "Soil Health Card nutrient dashboard", nutrient_download: "Download project workbook", nutrient_national: "All-India figures from the supplied PDF dashboard", nutrient_cycle: "Cycle",
    nutrient_n_samples: "N sample records", nutrient_p_samples: "P sample records", nutrient_k_samples: "K sample records", nutrient_oc_samples: "OC sample records",
    nutrient_state_coverage: "State workbook coverage: {n} rows. Those state counts are listed separately below and do not sum to the all-India PDF totals.",
    nutrient_state_rows: "State and union territory workbook rows", nutrient_state_label: "State / UT", nutrient_choose_state: "Choose state or union territory",
    nutrient_source: "Source: supplied Soil Health Card RKVY workbook and matching PDF dashboard.", nutrient_data_note: "NUTRIENTS has state-level sample counts and approximate map points. NUTRIENT_SUMMARY has all-India counts from the supplied PDF.", nutrient_map_title: "Soil Health Card map",
    nutrient_map_help: "Select a nutrient above. Larger circles indicate higher reported counts. Click a state point for its nutrient breakdown.",
    nutrient_map_location: "Locations are approximate state/UT centers; this dataset does not include boundary polygons.",
    nutrient_map_loaded: "{n} state/UT points loaded from the project workbook.", nutrient_map_approx: "Map point is an approximate state/UT center.",
    map_metric: "Map metric", map_farm_areas: "Mapped farm areas", map_hide_fields: "Hide field areas", map_show_fields: "Show field areas",
    ng_n: "Nitrogen (N)", ng_p: "Phosphorus (P)", ng_k: "Potassium (K)", ng_oc: "Organic carbon (OC)", ng_ph: "pH", ng_ec: "Electrical conductivity (EC)",
    ng_s: "Sulfur", ng_fe: "Iron", ng_zn: "Zinc", ng_cu: "Copper", ng_b: "Boron", ng_mn: "Manganese",
    nutrient_high: "High", nutrient_medium: "Medium", nutrient_low: "Low", nutrient_alkaline: "Alkaline", nutrient_acidic: "Acidic", nutrient_neutral: "Neutral",
    nutrient_non_saline: "Non-saline", nutrient_saline: "Saline", nutrient_sufficient: "Sufficient", nutrient_deficient: "Deficient",
    nutrient_n_low: "Nitrogen low", nutrient_p_low: "Phosphorus low", nutrient_k_low: "Potassium low", nutrient_oc_low: "Organic carbon low",
    nutrient_s_deficient: "Sulfur deficient", nutrient_fe_deficient: "Iron deficient", nutrient_zn_deficient: "Zinc deficient", nutrient_cu_deficient: "Copper deficient", nutrient_b_deficient: "Boron deficient", nutrient_mn_deficient: "Manganese deficient",
    nutrient_th: "State / UT", nutrient_n: "N low", nutrient_p: "P low", nutrient_k: "K low", nutrient_oc: "OC low", nutrient_fe: "Fe deficient", nutrient_zn: "Zn deficient",
    logout: "Log out", hello: "Hello, {n}",
    weather_in: "Weather in {d}", humidity: "Humidity", wind: "Wind", rain24: "Rain, next 24 hours", rain_chance: "Chance of rain today", rain_hourly: "Rain chance by hour",
    rain5: "Rain, next 5 days", range5: "5-day range", demo_data: "Demo data",
    ask: "Ask", ph_msg: "Ask about your crop, soil or weather",
    install_app: "Install app",
    q1: "Should I sow now?", q2: "Will it rain this week?", q3: "How is my soil?",
    crop_title: "Your crop: {c}", soil_title: "Soil health", alerts_title: "Recent alerts", view_all: "See all",
    field_crops_title: "Crops at this location", crop_name_label: "Crop name", crop_name_placeholder: "e.g. Wheat",
    crop_area_label: "Planted area", crop_area_unit: "Area unit", area_acres: "Acres", area_hectares: "Hectares",
    save_crop_field: "Save crop", remove_crop_field: "Remove", no_saved_crop_fields: "No crop records saved for this location yet.",
    saved_crop_field: "Saved {crop} on {area} {unit}.", crop_field_location_required: "Choose a village or district before saving crop details.",
    alert_HEAVY_RAIN_HARM: "Heavy rain expected ({amount} mm in 24 hours). Protect your {crop_area} at {location}: harvest ripe produce, keep drainage channels clear and delay spraying or fertilizer.",
    alert_HEAVY_RAIN_HELP: "Good rain expected ({amount} mm in 24 hours). This may help your {crop_area} at {location}. Plan transplanting or sowing and keep field drainage open.",
    alert_HEATWAVE_HARM: "Very hot weather expected (up to {amount}°C). Protect your {crop_area} at {location}: irrigate early morning or evening, mulch the soil and avoid spraying in the afternoon.",
    alert_COLD_FROST_HARM: "Cold weather expected (as low as {amount}°C). Protect your {crop_area} at {location}: light evening irrigation and covering young plants can reduce frost damage.",
    alert_STRONG_WIND_HARM: "Strong winds expected (gusts up to {amount} km/h). Protect your {crop_area} at {location}: support tall crops, delay spraying and secure covers.",
    alert_DRY_SPELL_HARM: "Almost no rain in the next 5 days ({amount} mm). Plan irrigation for your {crop_area} at {location} and use mulch to save soil moisture.",
    your_location: "your saved location",
    crop_wheat: "Wheat", crop_rice: "rice", crop_paddy: "paddy", crop_maize: "maize", crop_corn: "corn",
    crop_mustard: "mustard", crop_potato: "potato", crop_tomato: "tomato", crop_sugarcane: "sugarcane",
    no_district: "Your profile has no district yet, so we cannot show local weather.",
    no_crop: "Your profile has no main crop yet.", no_crop_data: "We have no data for {c} in your region yet.",
    no_alerts: "No alerts yet. We will warn you before the weather turns.",
    send: "Send", chat_welcome: "Hello {n}! Ask me about weather, crops or your soil.",
    ph_crop: "Search a crop, for example wheat", search: "Search",
    ideal: "Ideal temperature", irrigation: "Irrigation", tips: "Tips", suited: "Suited crops", source: "Source",
    wx_line: "Weather in {d} now: {t}°C, {s}", no_soil: "No soil data for {d} yet.",
    map_click: "Click a district on the map to see its soil health.", map_offline: "The map needs an internet connection.",
    nodata: "No data", server_error: "Cannot reach the server. Check that it is running.",
    v_GOOD: "Good to go", v_IRRIGATE: "Irrigate", v_WAIT: "Wait", v_CHECK_SOIL: "Check soil",
    r_Good: "Good", r_Moderate: "Moderate", r_Poor: "Poor",
    l_Low: "Low", l_Medium: "Medium", l_High: "High", l_Neutral: "Neutral", l_Acidic: "Acidic", l_Alkaline: "Alkaline",
    e_HEAVY_RAIN: "Heavy rain", e_HEATWAVE: "Heatwave", e_COLD_FROST: "Cold and frost", e_STRONG_WIND: "Strong wind", e_DRY_SPELL: "Dry spell",
    s_ph: "pH", s_n: "Nitrogen (N)", s_p: "Phosphorus (P)", s_k: "Potassium (K)", s_moisture: "Moisture",
    s_oc: "Organic carbon", texture: "Soil texture", sand_l: "sand", silt_l: "silt", clay_l: "clay", tg_Sandy: "Sandy", tg_Loamy: "Loamy", tg_Clayey: "Clayey",
    modelled_note: "Organic carbon and soil texture are modelled estimates from SoilGrids (about 250 m resolution).",
    partial_note: "This rating uses only a few readings, so treat it as a rough guide."
  },
  hi: {
    app_tag: "मौसम आपके खेत तक पहुँचने से पहले जानें।",
    hero_sub: "आपके ज़िले का लाइव पूर्वानुमान, मिट्टी की सेहत और फसल सलाह, आपकी अपनी भाषा में।",
    login: "लॉग इन", register_tab: "पंजीकरण", phone: "फ़ोन नंबर", otp: "OTP",
    sendotp: "OTP भेजें", verify: "जाँचें और लॉग इन करें", name: "नाम", state: "राज्य", district: "ज़िला",
    crop_main: "मुख्य फसल", register_btn: "खाता बनाएँ",
    demo_otp: "डेमो मोड: OTP {otp} भरने के लिए दबाएँ", registered: "खाता बन गया। अब लॉग इन करें।",
    nav_home: "होम", nav_chat: "चैट", nav_crops: "फसलें", nav_soil: "मिट्टी", nav_nutrients: "पोषक तत्व", nav_map: "नक्शा", nav_alerts: "अलर्ट",
    nutrient_title: "मृदा स्वास्थ्य कार्ड पोषक तत्व डैशबोर्ड", nutrient_download: "प्रोजेक्ट की कार्यपुस्तिका डाउनलोड करें", nutrient_national: "दिए गए PDF डैशबोर्ड के अखिल भारतीय आँकड़े", nutrient_cycle: "चक्र",
    nutrient_n_samples: "N नमूना रिकॉर्ड", nutrient_p_samples: "P नमूना रिकॉर्ड", nutrient_k_samples: "K नमूना रिकॉर्ड", nutrient_oc_samples: "OC नमूना रिकॉर्ड",
    nutrient_state_coverage: "राज्य की कार्यपुस्तिका में {n} पंक्तियाँ हैं। राज्य के आँकड़े नीचे अलग दिए हैं और इनका योग PDF के अखिल भारतीय आँकड़ों के बराबर नहीं है।",
    nutrient_state_rows: "राज्य और केंद्रशासित प्रदेश की कार्यपुस्तिका पंक्तियाँ", nutrient_state_label: "राज्य / केंद्रशासित प्रदेश", nutrient_choose_state: "राज्य या केंद्रशासित प्रदेश चुनें",
    nutrient_source: "स्रोत: दी गई मृदा स्वास्थ्य कार्ड RKVY कार्यपुस्तिका और संबंधित PDF डैशबोर्ड।", nutrient_data_note: "NUTRIENTS शीट में राज्य-स्तर के नमूना आँकड़े और नक्शे के अनुमानित बिंदु हैं। NUTRIENT_SUMMARY शीट में दिए गए PDF के अखिल भारतीय आँकड़े हैं।", nutrient_map_title: "मृदा स्वास्थ्य कार्ड नक्शा",
    nutrient_map_help: "ऊपर पोषक तत्व चुनें। बड़े गोले अधिक दर्ज संख्या दिखाते हैं। पोषक तत्वों का विवरण देखने के लिए राज्य के बिंदु पर क्लिक करें।",
    nutrient_map_location: "स्थान राज्य/केंद्रशासित प्रदेश के अनुमानित केंद्र हैं; इस डेटा में सीमा मानचित्र शामिल नहीं हैं।",
    nutrient_map_loaded: "प्रोजेक्ट कार्यपुस्तिका से {n} राज्य/केंद्रशासित प्रदेश बिंदु लोड हुए।", nutrient_map_approx: "नक्शे का बिंदु राज्य/केंद्रशासित प्रदेश का अनुमानित केंद्र है।",
    map_metric: "नक्शे का मापदंड", map_farm_areas: "नक्शे पर खेत के क्षेत्र", map_hide_fields: "खेत के क्षेत्र छिपाएँ", map_show_fields: "खेत के क्षेत्र दिखाएँ",
    ng_n: "नाइट्रोजन (N)", ng_p: "फॉस्फोरस (P)", ng_k: "पोटैशियम (K)", ng_oc: "जैविक कार्बन (OC)", ng_ph: "pH", ng_ec: "विद्युत चालकता (EC)",
    ng_s: "सल्फर", ng_fe: "लोहा", ng_zn: "जस्ता", ng_cu: "तांबा", ng_b: "बोरॉन", ng_mn: "मैंगनीज़",
    nutrient_high: "अधिक", nutrient_medium: "मध्यम", nutrient_low: "कम", nutrient_alkaline: "क्षारीय", nutrient_acidic: "अम्लीय", nutrient_neutral: "तटस्थ",
    nutrient_non_saline: "गैर-लवणीय", nutrient_saline: "लवणीय", nutrient_sufficient: "पर्याप्त", nutrient_deficient: "कमी",
    nutrient_n_low: "नाइट्रोजन कम", nutrient_p_low: "फॉस्फोरस कम", nutrient_k_low: "पोटैशियम कम", nutrient_oc_low: "जैविक कार्बन कम",
    nutrient_s_deficient: "सल्फर की कमी", nutrient_fe_deficient: "लोहे की कमी", nutrient_zn_deficient: "जस्ते की कमी", nutrient_cu_deficient: "तांबे की कमी", nutrient_b_deficient: "बोरॉन की कमी", nutrient_mn_deficient: "मैंगनीज़ की कमी",
    nutrient_th: "राज्य / केंद्रशासित प्रदेश", nutrient_n: "N कम", nutrient_p: "P कम", nutrient_k: "K कम", nutrient_oc: "OC कम", nutrient_fe: "Fe की कमी", nutrient_zn: "Zn की कमी",
    logout: "लॉग आउट", hello: "नमस्ते, {n}",
    weather_in: "{d} का मौसम", humidity: "नमी", wind: "हवा", rain24: "बारिश, अगले 24 घंटे", rain_chance: "आज बारिश की संभावना", rain_hourly: "हर घंटे बारिश की संभावना",
    rain5: "बारिश, अगले 5 दिन", range5: "5 दिन का तापमान", demo_data: "डेमो डेटा",
    ask: "पूछें", ph_msg: "अपनी फसल, मिट्टी या मौसम के बारे में पूछें",
    install_app: "ऐप इंस्टॉल करें",
    q1: "क्या अभी बुवाई करूँ?", q2: "क्या इस हफ़्ते बारिश होगी?", q3: "मेरी मिट्टी कैसी है?",
    crop_title: "आपकी फसल: {c}", soil_title: "मिट्टी की सेहत", alerts_title: "हाल के अलर्ट", view_all: "सभी देखें",
    field_crops_title: "इस जगह की फसलें", crop_name_label: "फसल का नाम", crop_name_placeholder: "जैसे गेहूँ",
    crop_area_label: "बोया गया क्षेत्र", crop_area_unit: "क्षेत्र की इकाई", area_acres: "एकड़", area_hectares: "हेक्टेयर",
    save_crop_field: "फसल सेव करें", remove_crop_field: "हटाएँ", no_saved_crop_fields: "इस जगह के लिए अभी कोई फसल सेव नहीं है।",
    saved_crop_field: "{area} {unit} में {crop} सेव की गई।", crop_field_location_required: "फसल सेव करने से पहले गाँव या ज़िला चुनें।",
    no_district: "आपकी प्रोफ़ाइल में ज़िला नहीं है, इसलिए स्थानीय मौसम नहीं दिखा सकते।",
    no_crop: "आपकी प्रोफ़ाइल में मुख्य फसल नहीं है।", no_crop_data: "आपके क्षेत्र में {c} का डेटा अभी नहीं है।",
    no_alerts: "अभी कोई अलर्ट नहीं। मौसम बदलने से पहले हम आपको बताएँगे।",
    send: "भेजें", chat_welcome: "नमस्ते {n}! मौसम, फसल या मिट्टी के बारे में पूछिए।",
    ph_crop: "फसल खोजें, जैसे wheat", search: "खोजें",
    ideal: "आदर्श तापमान", irrigation: "सिंचाई", tips: "सुझाव", suited: "उपयुक्त फसलें", source: "स्रोत",
    wx_line: "{d} में अभी मौसम: {t}°C, {s}", no_soil: "{d} के लिए मिट्टी का डेटा अभी नहीं है।",
    map_click: "मिट्टी की सेहत देखने के लिए नक्शे पर ज़िले पर क्लिक करें।", map_offline: "नक्शे के लिए इंटरनेट चाहिए।",
    nodata: "डेटा नहीं", server_error: "सर्वर से संपर्क नहीं हो पा रहा। जाँचें कि वह चल रहा है।",
    v_GOOD: "शुरू करें", v_IRRIGATE: "सिंचाई करें", v_WAIT: "रुकें", v_CHECK_SOIL: "मिट्टी जाँचें",
    r_Good: "अच्छी", r_Moderate: "मध्यम", r_Poor: "कमज़ोर",
    l_Low: "कम", l_Medium: "मध्यम", l_High: "अधिक", l_Neutral: "सामान्य", l_Acidic: "अम्लीय", l_Alkaline: "क्षारीय",
    e_HEAVY_RAIN: "भारी बारिश", e_HEATWAVE: "गर्मी की लहर", e_COLD_FROST: "ठंड और पाला", e_STRONG_WIND: "तेज़ हवा", e_DRY_SPELL: "सूखा दौर",
    crop_wheat: "गेहूँ", crop_rice: "धान", crop_paddy: "धान", crop_maize: "मक्का", crop_corn: "मक्का",
    crop_mustard: "सरसों", crop_potato: "आलू", crop_tomato: "टमाटर", crop_sugarcane: "गन्ना",
    alert_HEAVY_RAIN_HARM: "अगले 24 घंटों में भारी बारिश ({amount} मिमी) होने की संभावना है। {location} में अपनी {crop_area} बचाएँ: पकी उपज काटें, जल निकासी नालियाँ साफ रखें और छिड़काव या खाद डालना टालें।",
    alert_HEAVY_RAIN_HELP: "अगले 24 घंटों में अच्छी बारिश ({amount} मिमी) की संभावना है। इससे {location} में आपकी {crop_area} को मदद मिल सकती है। रोपाई या बुवाई की योजना बनाएँ और खेत की जल निकासी खुली रखें।",
    alert_HEATWAVE_HARM: "अगले दिनों में बहुत गर्मी (तापमान {amount}°C तक) पड़ने की संभावना है। {location} में अपनी {crop_area} बचाएँ: सुबह जल्दी या शाम को सिंचाई करें, मिट्टी पर पलवार डालें और दोपहर में छिड़काव न करें।",
    alert_COLD_FROST_HARM: "ठंड ({amount}°C तक) पड़ने की संभावना है। {location} में अपनी {crop_area} बचाएँ: शाम को हल्की सिंचाई और छोटे पौधों को ढकने से पाले का नुकसान घट सकता है।",
    alert_STRONG_WIND_HARM: "तेज़ हवाएँ ({amount} किमी/घंटा तक) चलने की संभावना है। {location} में अपनी {crop_area} बचाएँ: ऊँची फसलों को सहारा दें, छिड़काव टालें और ढकने वाली चादरें सुरक्षित करें।",
    alert_DRY_SPELL_HARM: "अगले 5 दिनों में लगभग बारिश नहीं होगी ({amount} मिमी)। {location} में अपनी {crop_area} के लिए सिंचाई की योजना बनाएँ और मिट्टी की नमी बचाने के लिए पलवार डालें।",
    area_acres: "एकड़", area_hectares: "हेक्टेयर", your_location: "आपकी चुनी हुई जगह",
    s_ph: "pH", s_n: "नाइट्रोजन (N)", s_p: "फॉस्फोरस (P)", s_k: "पोटैशियम (K)", s_moisture: "नमी",
    s_oc: "जैविक कार्बन", texture: "मिट्टी की बनावट", sand_l: "रेत", silt_l: "गाद", clay_l: "चिकनी मिट्टी", tg_Sandy: "रेतीली", tg_Loamy: "दोमट", tg_Clayey: "चिकनी",
    modelled_note: "जैविक कार्बन और मिट्टी की बनावट SoilGrids (लगभग 250 मी. विभेदन) के मॉडल अनुमान हैं।",
    partial_note: "यह रेटिंग केवल कुछ मापों पर आधारित है, इसे मोटा अनुमान समझें।"
  }
};

/* ------------------------------------------------------------------
   Helpers and state
   ------------------------------------------------------------------ */
const $ = id => document.getElementById(id);
const enc = encodeURIComponent;
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let token = localStorage.getItem("token");
let me = null;
let lang = localStorage.getItem("lang") || "en";
let view = "home";
let pendingQ = null;
let localeOverrides = {};
let homeMap = null;
let homeMarker = null;
let homeFieldsVisible = true;
let soilMap = null;
let soilGeoJSON = null;
let soilFieldsVisible = true;
let soilMarker = null;
let nutrientMapMarkers = [];
let soilMapLoaded = false;
let stateNutrientGeoJSON = null;

function t(key, vars) {
  let s = localeOverrides[key] || (T[lang] && T[lang][key]) || T.en[key] || key;
  if (vars) Object.keys(vars).forEach(k => { s = s.split("{" + k + "}").join(vars[k]); });
  return s;
}
// Look up a translated label for an API value, for example tx("l_", "Low")
function tx(prefix, val) {
  const k = prefix + String(val).replace(/ /g, "_");
  return (T[lang] && T[lang][k]) || T.en[k] || val;
}

const vSuffix = v => ({ GOOD: "good", IRRIGATE: "info", WAIT: "warn", "CHECK SOIL": "bad" }[v] || "warn");
const rSuffix = r => ({ Good: "good", Moderate: "warn", Poor: "bad" }[r] || "warn");
const EVENT_EMOJI = { HEAVY_RAIN: "\u{1F327}\uFE0F", HEATWAVE: "\u{1F525}", COLD_FROST: "\u2744\uFE0F", STRONG_WIND: "\u{1F4A8}", DRY_SPELL: "\u{1F3DC}\uFE0F" };

function skyClass(d) {
  d = String(d || "").toLowerCase();
  if (/thunder|storm/.test(d)) return "sky-storm";
  if (/rain|drizzle|shower/.test(d)) return "sky-rain";
  if (/mist|fog|haze|smoke/.test(d)) return "sky-mist";
  if (/cloud|overcast/.test(d)) return "sky-cloud";
  return "sky-clear";
}
function wxIcon(d) {
  d = String(d || "").toLowerCase();
  if (/thunder|storm/.test(d)) return "\u26C8\uFE0F";
  if (/rain|drizzle|shower/.test(d)) return "\u{1F327}\uFE0F";
  if (/mist|fog|haze|smoke/.test(d)) return "\u{1F32B}\uFE0F";
  if (/cloud|overcast/.test(d)) return "\u26C5";
  return "\u2600\uFE0F";
}
const cleanDesc = d => String(d || "").replace(/\s*\(MOCK DATA\)/i, "");

function countUp(el, to) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 700;
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

async function api(path, method, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  try {
    const r = await fetch("/api" + path, { method: method || "GET", headers, body: body ? JSON.stringify(body) : undefined });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401 && token && path.indexOf("/login") !== 0) logout();
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: t("server_error") } };
  }
}

/* ------------------------------------------------------------------
   Language
   ------------------------------------------------------------------ */
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i]").forEach(el => { el.textContent = t(el.dataset.i); });
  document.querySelectorAll("[data-p]").forEach(el => { el.placeholder = t(el.dataset.p); });
  document.querySelectorAll(".langsel").forEach(s => { s.value = lang; });
  const soilToggle = $("soil-fields-toggle");
  if (soilToggle) soilToggle.textContent = t(soilFieldsVisible ? "map_hide_fields" : "map_show_fields");
}

async function loadLanguages() {
  const r = await api("/languages");
  const list = r.ok && Array.isArray(r.data) ? r.data : [{ code: "en", name: "English" }];
  const html = list.map(l => '<option value="' + esc(l.code) + '">' + esc(l.name) + "</option>").join("");
  document.querySelectorAll(".langsel").forEach(s => { s.innerHTML = html; });
  if (!list.some(l => l.code === lang)) lang = "en";
}

async function setLang(code, save) {
  lang = code;
  localStorage.setItem("lang", code);
  let overrides = {};
  // Optional locale files let every language exposed by /api/languages
  // translate the full interface without adding another hard-coded JS block.
  try {
    const r = await fetch("locales/" + encodeURIComponent(code) + ".json", { cache: "no-cache" });
    overrides = r.ok ? await r.json() : {};
    if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) overrides = {};
  } catch (e) { overrides = {}; }
  if (lang !== code) return;
  localeOverrides = overrides;
  applyLang();
  nutrientMapMarkers.forEach(({ bubble, row }) => {
    const label = bubble.nextElementSibling;
    if (label) label.textContent = nutrientStateName(row);
    bubble.parentElement.title = `${nutrientStateName(row)}: ${fmtCount(row.n_low)} ${t("nutrient_n_low")}`;
    bubble.parentElement.setAttribute("aria-label", `${t("nutrient_choose_state")}: ${nutrientStateName(row)}`);
  });
  if (view === "map" && $("mapcard")) $("mapcard").innerHTML = mapIntro();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  updateVoiceControls();
  if (me) { renderMini(); route(); }
  if (save && token) await api("/me", "PUT", { language: code });
}
document.querySelectorAll(".langsel").forEach(s => s.addEventListener("change", e => setLang(e.target.value, true)));

/* ------------------------------------------------------------------
   Login and register
   ------------------------------------------------------------------ */
function authMode(mode) {
  $("mode-login").classList.toggle("on", mode === "login");
  $("mode-register").classList.toggle("on", mode === "register");
  $("login-pane").classList.toggle("hidden", mode !== "login");
  $("register-pane").classList.toggle("hidden", mode !== "register");
}
$("mode-login").addEventListener("click", () => authMode("login"));
$("mode-register").addEventListener("click", () => authMode("register"));

$("lreq").addEventListener("click", async () => {
  $("lerr").textContent = "";
  const r = await api("/login/request", "POST", { phone: $("lphone").value });
  if (!r.ok) { $("lerr").textContent = r.data.error || "Error"; return; }
  $("otpbox").classList.remove("hidden");
  const fill = $("fillotp");
  if (r.data.demo_otp) {
    fill.textContent = t("demo_otp", { otp: r.data.demo_otp });
    fill.dataset.otp = r.data.demo_otp;
    fill.classList.remove("hidden");
  } else {
    fill.classList.add("hidden");
  }
  $("lotp").focus();
});
$("fillotp").addEventListener("click", () => { $("lotp").value = $("fillotp").dataset.otp || ""; });

$("lver").addEventListener("click", async () => {
  $("lerr").textContent = "";
  const r = await api("/login/verify", "POST", { phone: $("lphone").value, otp: $("lotp").value });
  if (!r.ok) { $("lerr").textContent = r.data.error || "Error"; return; }
  token = r.data.token;
  localStorage.setItem("token", token);
  me = r.data.farmer;
  await setLang(me.language || "en", false);
  enterApp();
});

$("rbtn").addEventListener("click", async () => {
  const r = await api("/register", "POST", {
    name: $("rname").value, phone: $("rphone").value, state: $("rstate").value,
    district: $("rdistrict").value, language: lang
  });
  $("rmsg").className = "msg " + (r.ok ? "ok" : "err");
  $("rmsg").textContent = r.ok ? t("registered") : (r.data.error || "Error");
  if (r.ok) { $("lphone").value = $("rphone").value; authMode("login"); }
});

$("lphone").addEventListener("keydown", e => { if (e.key === "Enter") $("lreq").click(); });
$("lotp").addEventListener("keydown", e => { if (e.key === "Enter") $("lver").click(); });

function logout() {
  token = null; me = null;
  localStorage.removeItem("token");
  $("shell").classList.add("hidden");
  $("auth").classList.remove("hidden");
  $("otpbox").classList.add("hidden");
  $("lotp").value = "";
  history.replaceState(null, "", location.pathname);
}
$("logout").addEventListener("click", logout);

function renderMini() {
  $("me-mini").innerHTML = "<b>" + esc(me.name) + "</b>" + esc([me.village, me.district, me.state].filter(Boolean).join(", "));
  if ($("location-in")) $("location-in").value = me.village || me.district || "";
}

function weatherPath(district) {
  let path = "/weather/" + enc(district);
  if (hasSavedCoordinates(me) && district === me.district) {
    path += "?lat=" + enc(me.latitude) + "&lon=" + enc(me.longitude);
    if (me.village) path += "&name=" + enc([me.village, me.district, me.state].filter(Boolean).join(", "));
  }
  return path;
}

let locationTimer;
async function searchLocations(query) {
  const box = $("location-results");
  if (query.trim().length < 2) { box.classList.add("hidden"); return; }
  const response = await api("/locations/search?q=" + enc(query.trim()));
  if (!response.ok) box.innerHTML = '<div class="location-empty">' + esc(response.data.error || "Search unavailable") + '</div>';
  else if (!response.data.results.length) box.innerHTML = '<div class="location-empty">No matching villages, towns or PIN codes.</div>';
  else {
    box.innerHTML = response.data.results.map((item, index) => {
      const area = [item.district, item.state].filter(Boolean).join(", ");
      const postal = item.postal_code ? " | PIN " + item.postal_code : "";
      return '<button type="button" class="location-result" role="option" data-location-index="' + index + '"><b>' + esc(item.name) + '</b><small>' + esc(area + postal) + '</small></button>';
    }).join("");
    box.querySelectorAll("[data-location-index]").forEach(button => button.addEventListener("click", () => chooseLocation(response.data.results[Number(button.dataset.locationIndex)])));
  }
  box.classList.remove("hidden");
}

$("location-in").addEventListener("input", e => {
  clearTimeout(locationTimer);
  const value = e.target.value;
  locationTimer = setTimeout(() => searchLocations(value), 250);
});
$("location-in").addEventListener("focus", () => { if ($("location-in").value.trim().length >= 2) searchLocations($("location-in").value); });
document.addEventListener("click", e => { if (!e.target.closest(".location-search")) $("location-results").classList.add("hidden"); });

async function chooseLocation(item) {
  const input = $("location-in"), button = $("location-go"), message = $("location-msg");
  button.disabled = true;
  $("location-results").classList.add("hidden");
  message.textContent = "Loading weather for " + item.name + "...";
  const weather = await api("/weather/" + enc(item.district || item.name) + "?lat=" + enc(item.latitude) + "&lon=" + enc(item.longitude) + "&name=" + enc([item.name, item.district, item.state].filter(Boolean).join(", ")));
  if (!weather.ok) { message.textContent = weather.data.error || "Could not load weather for that location."; button.disabled = false; return; }
  const updated = await api("/me", "PUT", { district: item.district || item.name, state: item.state, village: item.name,
    postal_code: item.postal_code, latitude: item.latitude, longitude: item.longitude });
  button.disabled = false;
  if (!updated.ok) { message.textContent = updated.data.error || "Could not save this location."; return; }
  me = updated.data;
  input.value = item.name;
  renderMini();
  message.textContent = "Location updated to " + [item.name, item.district, item.state, item.postal_code && "PIN " + item.postal_code].filter(Boolean).join(", ") + ".";
  if (view === "home") loadHome();
  else if (view === "soil") loadSoilFull();
  else if (view === "nutrients") loadNutrientOutput();
  else if (view === "map") initMap();
}

$("location-form").addEventListener("submit", async e => {
  e.preventDefault();
  const query = $("location-in").value.trim();
  if (!query) { $("location-msg").textContent = "Enter a village, district or PIN code in India."; $("location-in").focus(); return; }
  await searchLocations(query);
});

function enterApp() {
  $("auth").classList.add("hidden");
  $("shell").classList.remove("hidden");
  renderMini();
  route();
  checkAlertDot();
}

/* ------------------------------------------------------------------
   Router (#home, #chat, #crops, #soil, #nutrients, #map, #alerts)
   ------------------------------------------------------------------ */
function route() {
  if (!me) return;
  const v = (location.hash || "#home").slice(1);
  show(VIEWS.indexOf(v) >= 0 ? v : "home");
}
window.addEventListener("hashchange", route);

function show(v) {
  view = v;
  VIEWS.forEach(x => $("v-" + x).classList.toggle("hidden", x !== v));
  document.querySelectorAll("#nav a").forEach(a => a.classList.toggle("on", a.dataset.view === v));
  $("title").textContent = v === "home" ? t("hello", { n: (me.name || "").split(" ")[0] }) : t("nav_" + v);
  ({ home: loadHome, chat: loadChat, crops: () => {}, soil: loadSoilFull, nutrients: loadNutrientOutput, map: initMap, alerts: loadAlerts })[v]();
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------------
   Shared renderers
   ------------------------------------------------------------------ */
function levelFill(level) {
  if (level === "Low") return ["f-low", 33];
  if (level === "Acidic" || level === "Alkaline") return ["f-low", 45];
  if (level === "Medium") return ["f-mid", 66];
  return ["f-good", 100];
}

function soilHtml(c, full) {
  let h = '<span class="badge b-' + rSuffix(c.rating) + '">' + esc(tx("r_", c.rating)) + '</span> <span class="sub">' +
          esc(c.score) + "/" + esc(c.max_score) + "</span><div class=\"bars\">";
  Object.keys(c.readings).forEach(k => {
    const v = c.readings[k], f = levelFill(v.level);
    h += '<div class="bar-row"><div class="lab"><span>' + esc(tx("s_", k)) + "</span><b>" + esc(v.value) + " (" + esc(tx("l_", v.level)) +
         ')</b></div><div class="bar"><i class="' + f[0] + '" style="width:' + f[1] + '%"></i></div>' +
         (full ? '<div class="tip">' + esc(v.tip) + "</div>" : "") + "</div>";
  });
  h += "</div>";
  if (full && c.suitable_crops && c.suitable_crops.length)
    h += '<p class="suited"><b>' + esc(t("suited")) + ":</b> " + c.suitable_crops.map(esc).join(", ") + "</p>";
  if (full && c.texture) {
    const x = c.texture;
    h += '<p class="suited"><b>' + esc(t("texture")) + ":</b> " + esc(tx("tg_", x.group)) + " (" + esc(x.class) + "), " +
         esc(t("sand_l")) + " " + esc(Math.round(x.sand)) + "%, " + esc(t("silt_l")) + " " + esc(Math.round(x.silt)) + "%, " +
         esc(t("clay_l")) + " " + esc(Math.round(x.clay)) + "%</p>";
  }
  if (full && c.modelled) h += '<p class="sub">' + esc(t("modelled_note")) + "</p>";
  if (full && c.partial) h += '<p class="sub">' + esc(t("partial_note")) + "</p>";
  if (full) h += '<p class="sub">' + esc(t("source")) + ": " + esc(c.source) + "</p>";
  return h;
}

function alertItem(a) {
  const crop = a.crop || (me && me.crop) || "crop";
  const cropKey = "crop_" + crop.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_");
  const translatedCrop = localeOverrides[cropKey] || (T[lang] && T[lang][cropKey]) || crop;
  const areaUnitKey = a.crop_area_unit === "hectares" ? "area_hectares" : "area_acres";
  const cropArea = a.crop_area == null ? translatedCrop + " crop" : translatedCrop + " (" + a.crop_area + " " + t(areaUnitKey) + ")";
  const alertLocation = a.location || [me && me.village, me && me.district, me && me.state].filter(Boolean).join(", ") || t("your_location");
  const effect = a.event === "HEAVY_RAIN" && /(rice|paddy)/i.test(crop) ? "HELP" : "HARM";
  const bodyKey = "alert_" + a.event + "_" + effect;
  const patterns = {
    HEAVY_RAIN: /\(([\d.]+)\s*mm in 24 hours\)/i,
    HEATWAVE: /up to\s+([\d.]+)\s*°?C/i,
    COLD_FROST: /as low as\s+([\d.]+)\s*°?C/i,
    STRONG_WIND: /gusts up to\s+([\d.]+)\s*km\/h/i,
    DRY_SPELL: /\(([\d.]+)\s*mm\)/i
  };
  const amount = (patterns[a.event] && a.message.match(patterns[a.event]) || [])[1];
  const bodyTemplate = (localeOverrides[bodyKey] || (T[lang] && T[lang][bodyKey]) || (lang === "en" && T.en[bodyKey]));
  const body = amount && bodyTemplate ? t(bodyKey, { amount, crop: translatedCrop, crop_area: cropArea, location: alertLocation }) : a.message;
  return '<div class="alert-item"><div class="em" aria-hidden="true">' + (EVENT_EMOJI[a.event] || "\u26A0\uFE0F") + "</div><div><b>" +
         esc(tx("e_", a.event)) + "</b><time>" + esc(new Date(a.at + "Z").toLocaleString()) + "</time><div>" + esc(body) + "</div></div></div>";
}

const errHtml = r => '<p class="empty">' + esc((r && r.data && r.data.error) || "Error") + "</p>";

/* ------------------------------------------------------------------
   Home
   ------------------------------------------------------------------ */
async function loadHome() {
  const d = me.district;
  $("home-map-card").classList.add("hidden");
  $("chips").innerHTML = ["q1", "q2", "q3"].map(k => '<button data-q="' + k + '">' + esc(t(k)) + "</button>").join("");
  ["c-weather", "c-crop", "c-soil", "c-alerts"].forEach(id => { $(id).innerHTML = '<div class="skeleton"></div>'; });
  $("c-weather").className = "hero sky-cloud";
  const savedFields = await api("/crops/fields");
  if (view !== "home") return;
  renderCropFields(savedFields);
  const fieldCrop = savedFields.ok && savedFields.data.results.length ? savedFields.data.results[0].crop : me.crop;

  if (!d) {
    $("c-weather").innerHTML = "<p>" + esc(t("no_district")) + "</p>";
    ["c-crop", "c-soil"].forEach(id => { $(id).innerHTML = '<p class="empty">' + esc(t("no_district")) + "</p>"; });
  }
  const [w, s, c, a] = await Promise.all([
    d ? api(weatherPath(d)) : null,
    d ? api("/soil/" + enc(d)) : null,
    d && fieldCrop ? api("/crops/search?q=" + enc(fieldCrop) + "&district=" + enc(d) + "&state=" + enc(me.state || "")) : null,
    api("/alerts")
  ]);
  if (view !== "home") return;
  if (w) renderWeather(w);
  if (d) { renderCrop(c, fieldCrop); renderSoilCard(s); }
  renderAlertsCard(a);
}

function renderCropFields(response) {
  const list = $("crop-field-list"), save = $("crop-field-save");
  save.disabled = !me.district;
  $("crop-fields-location").textContent = response && response.ok ? response.data.location : "";
  if (!response || !response.ok) {
    list.innerHTML = '<p class="empty">' + esc(response && response.data.error || "Could not load crop records.") + "</p>";
    return;
  }
  if (!response.data.results.length) {
    list.innerHTML = '<p class="empty">' + esc(t("no_saved_crop_fields")) + "</p>";
    return;
  }
  list.innerHTML = response.data.results.map(field =>
    '<div class="saved-crop-field"><span><b>' + esc(field.crop) + '</b><small>' + esc(field.area) + " " + esc(t(field.area_unit === "hectares" ? "area_hectares" : "area_acres")) +
    '</small></span><button type="button" data-remove-crop="' + field.id + '" aria-label="' + esc(t("remove_crop_field") + " " + field.crop) + '">' + esc(t("remove_crop_field")) + "</button></div>"
  ).join("");
}

$("crop-field-form").addEventListener("submit", async event => {
  event.preventDefault();
  const status = $("crop-field-msg"), save = $("crop-field-save");
  if (!me.district) { status.textContent = t("crop_field_location_required"); return; }
  save.disabled = true;
  status.textContent = "";
  const response = await api("/crops/fields", "POST", {
    crop: $("crop-field-name").value.trim(),
    area: $("crop-field-area").value,
    area_unit: $("crop-field-unit").value
  });
  save.disabled = false;
  if (!response.ok) { status.textContent = response.data.error || "Could not save this crop."; return; }
  status.textContent = t("saved_crop_field", {
    crop: response.data.field.crop, area: response.data.field.area,
    unit: t(response.data.field.area_unit === "hectares" ? "area_hectares" : "area_acres")
  });
  $("crop-field-name").value = "";
  $("crop-field-area").value = "";
  await loadHome();
});

$("crop-field-list").addEventListener("click", async event => {
  const button = event.target.closest("[data-remove-crop]");
  if (!button) return;
  button.disabled = true;
  const response = await api("/crops/fields/" + enc(button.dataset.removeCrop), "DELETE");
  if (!response.ok) {
    $("crop-field-msg").textContent = response.data.error || "Could not remove this crop.";
    button.disabled = false;
    return;
  }
  await loadHome();
});

function renderWeather(r) {
  const el = $("c-weather");
  if (!r.ok) {
    $("rain-hourly-card").classList.add("hidden");
    $("home-map-card").classList.add("hidden");
    el.className = "hero sky-cloud";
    el.innerHTML = '<div class="where">' + esc(t("weather_in", { d: me.village || me.district })) + "</div><p>" + esc(r.data.error || "Error") + "</p>";
    return;
  }
  const w = r.data;
  renderRainByHour(w.rain_probability_by_hour || []);
  showHomeLocation(w);
  el.className = "hero " + skyClass(w.description);
  const stat = (label, value) => "<div><span>" + esc(t(label)) + "</span><b>" + esc(value) + "</b></div>";
  el.innerHTML =
    '<div class="hero-top"><div><div class="where">' + esc(t("weather_in", { d: w.location_name || w.district })) + "</div>" +
    '<div class="temp"><span id="tempnum">' + esc(Math.round(w.temp)) + "</span><small>°C</small></div>" +
    '<div class="desc">' + esc(cleanDesc(w.description)) + "</div>" +
    (w.mock ? '<span class="tagdemo">' + esc(t("demo_data")) + "</span>" : "") +
    '</div><div class="wxicon" aria-hidden="true">' + wxIcon(w.description) + "</div></div>" +
    '<div class="stats">' + stat("humidity", w.humidity + "%") + stat("wind", w.wind_kmh + " km/h") +
    stat("rain_chance", w.rain_probability_today == null ? "—" : w.rain_probability_today + "%") +
    stat("rain24", w.rain_24h + " mm") + stat("rain5", w.rain_5d + " mm") +
    stat("range5", Math.round(w.temp_min_5d) + "° / " + Math.round(w.temp_max_5d) + "°") + "</div>";
  countUp($("tempnum"), Math.round(w.temp));
}

function renderRainByHour(hours) {
  const card = $("rain-hourly-card"), chart = $("rain-hourly");
  const available = (hours || []).filter(h => h && h.time && h.probability != null);
  if (!available.length) { card.classList.add("hidden"); return; }
  card.classList.remove("hidden");
  $("rain-hourly-title").textContent = t("rain_hourly");
  chart.innerHTML = available.map((h, i) => {
    const timeText = /(?:Z|[+-]\d{2}:\d{2})$/i.test(h.time) ? h.time : h.time + "+05:30";
    const date = new Date(timeText);
    const label = Number.isNaN(date.getTime()) ? String(h.time).split("T")[1] :
      new Intl.DateTimeFormat(lang, { hour: "numeric", timeZone: "Asia/Kolkata" }).format(date);
    const probability = Math.max(0, Math.min(100, Number(h.probability) || 0));
    const height = Math.max(3, probability);
    return '<div class="rain-hour" title="' + esc(label + ": " + probability + "%") + '" aria-label="' + esc(label + ": " + probability + "%") + '">' +
      '<div class="rain-hour-value">' + probability + '%</div><div class="rain-hour-track"><i style="height:' + height + '%"></i></div>' +
      '<span>' + (i % 3 === 0 ? esc(label) : "&nbsp;") + '</span></div>';
  }).join("");
}

function showHomeLocation(weather) {
  const card = $("home-map-card");
  if (weather.latitude == null || weather.longitude == null) { card.classList.add("hidden"); return; }
  const lat = Number(weather.latitude), lon = Number(weather.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) { card.classList.add("hidden"); return; }
  card.classList.remove("hidden");
  $("home-map-title").textContent = weather.location_name || weather.district || me.district;
  $("home-map-note").textContent = "Field outlines show areas mapped in OpenStreetMap; coverage varies by village.";
  if (!maplibregl.Map) { $("home-map-note").textContent = "3D map is unavailable. Check your internet connection."; return; }
  if (!homeMap) {
    homeMap = new maplibregl.Map({
      container: "home-map", style: "https://tiles.openfreemap.org/styles/bright",
      center: [lon, lat], zoom: 15.3, pitch: 58, bearing: -18,
      canvasContextAttributes: { antialias: true }
    });
    homeMap.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    homeMap.on("load", () => {
      addFarmLandLayer(homeMap, "home");
      add3DBuildings(homeMap, "home");
      setFarmLandVisibility(homeMap, "home", homeFieldsVisible);
    });
  } else {
    homeMap.flyTo({ center: [lon, lat], zoom: 15.3, pitch: 58, bearing: -18, duration: 900 });
  }
  if (homeMarker) homeMarker.remove();
  const markerLabel = weather.location_name || me.village || weather.district || me.district;
  const markerElement = document.createElement("div");
  markerElement.className = "map-location-marker";
  const markerDot = document.createElement("span");
  markerDot.className = "map-location-dot";
  markerDot.setAttribute("aria-hidden", "true");
  const markerText = document.createElement("span");
  markerText.className = "map-location-label";
  markerText.textContent = markerLabel;
  markerElement.append(markerText, markerDot);
  homeMarker = new maplibregl.Marker({ element: markerElement, anchor: "bottom" })
    .setLngLat([lon, lat]).addTo(homeMap);
  requestAnimationFrame(() => homeMap.resize());
}

function add3DBuildings(map, prefix) {
  try {
    const sourceId = prefix + "-buildings";
    if (map.getSource(sourceId)) return;
    const labelLayer = map.getStyle().layers.find(layer =>
      layer.type === "symbol" && layer.layout && layer.layout["text-field"]
    );
    map.addSource(sourceId, { type: "vector", url: "https://tiles.openfreemap.org/planet" });
    map.addLayer({
      id: prefix + "-3d-buildings", source: sourceId, "source-layer": "building",
      type: "fill-extrusion", minzoom: 14,
      filter: ["!=", ["get", "hide_3d"], true],
      paint: {
        "fill-extrusion-color": "#c8d5ca",
        "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14, 0, 15.5, ["get", "render_height"]],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.88
      }
    }, labelLayer && labelLayer.id);
  } catch (error) { console.warn("Could not add 3D buildings", error); }
}

function hasSavedCoordinates(profile) {
  return !!profile && profile.latitude !== null && profile.latitude !== undefined && profile.longitude !== null && profile.longitude !== undefined &&
    Number.isFinite(Number(profile.latitude)) && Number.isFinite(Number(profile.longitude));
}

function setFarmLandVisibility(map, prefix, visible) {
  [prefix + "-farm-area-fill", prefix + "-farm-area-outline"].forEach(id => {
    if (map && map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  });
}

function addFarmLandLayer(map, prefix) {
  const sourceId = prefix + "-farm-landcover";
  if (map.getSource(sourceId)) return;
  map.addSource(sourceId, { type: "vector", url: "https://tiles.openfreemap.org/planet" });
  const before = map.getStyle().layers.find(layer =>
    layer.type === "symbol" && layer.layout && layer.layout["text-field"]
  );
  const filter = ["any",
    ["==", ["get", "class"], "farmland"],
    ["in", ["get", "subclass"], ["literal", ["farmland", "orchard", "vineyard", "allotments", "farm"]]]
  ];
  map.addLayer({
    id: prefix + "-farm-area-fill", type: "fill", source: sourceId, "source-layer": "landcover",
    filter,
    paint: { "fill-color": ["match", ["get", "subclass"], "orchard", "#91ad55", "vineyard", "#98b86e", "#79ac66"],
      "fill-opacity": 0.38 }
  }, before && before.id);
  map.addLayer({
    id: prefix + "-farm-area-outline", type: "line", source: sourceId, "source-layer": "landcover",
    filter,
    paint: { "line-color": "#547b3d", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 16, 1.8],
      "line-opacity": 0.86 }
  }, before && before.id);
  map.on("click", prefix + "-farm-area-fill", event => {
    const feature = event.features && event.features[0];
    if (!feature) return;
    const kind = feature.properties.subclass || feature.properties.class || "agricultural land";
    new maplibregl.Popup({ closeButton: true, offset: 10 })
      .setLngLat(event.lngLat)
      .setText(kind.charAt(0).toUpperCase() + kind.slice(1) + " area - mapped in OpenStreetMap")
      .addTo(map);
  });
  map.on("mouseenter", prefix + "-farm-area-fill", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", prefix + "-farm-area-fill", () => { map.getCanvas().style.cursor = ""; });
}

$("home-fields-toggle").addEventListener("click", event => {
  homeFieldsVisible = !homeFieldsVisible;
  setFarmLandVisibility(homeMap, "home", homeFieldsVisible);
  event.currentTarget.setAttribute("aria-pressed", String(homeFieldsVisible));
  event.currentTarget.textContent = homeFieldsVisible ? "Hide field areas" : "Show field areas";
});

$("soil-fields-toggle").addEventListener("click", event => {
  soilFieldsVisible = !soilFieldsVisible;
  setFarmLandVisibility(soilMap, "soil", soilFieldsVisible);
  event.currentTarget.setAttribute("aria-pressed", String(soilFieldsVisible));
  event.currentTarget.textContent = t(soilFieldsVisible ? "map_hide_fields" : "map_show_fields");
});

function renderCrop(r, cropName = me.crop) {
  const el = $("c-crop");
  if (!cropName) { el.innerHTML = "<h3>" + esc(t("nav_crops")) + '</h3><p class="empty">' + esc(t("no_crop")) + "</p>"; return; }
  if (!r || !r.ok) {
    el.innerHTML = "<h3>" + esc(t("crop_title", { c: cropName })) + '</h3><p class="empty">' + esc(t("no_crop_data", { c: cropName })) + "</p>";
    return;
  }
  const c = r.data.results[0], v = c.fit.verdict;
  el.innerHTML = "<h3>" + esc(t("crop_title", { c: c.crop })) + '</h3><div class="verdict v-' + vSuffix(v) + '">' + esc(tx("v_", v)) + "</div>" +
    '<ul class="reasons">' + c.fit.reasons.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" +
    '<p class="sub">' + esc(t("ideal")) + ": " + esc(c.ideal.temp[0]) + " to " + esc(c.ideal.temp[1]) + "°C</p>";
}

function renderSoilCard(r) {
  const el = $("c-soil");
  if (!r || !r.ok) { el.innerHTML = "<h3>" + esc(t("soil_title")) + '</h3><p class="empty">' + esc(t("no_soil", { d: me.district })) + "</p>"; return; }
  el.innerHTML = "<h3>" + esc(t("soil_title")) + "</h3>" + soilHtml(r.data, false) +
    '<p><button class="link" data-go="soil">' + esc(t("view_all")) + "</button></p>";
}

function renderAlertsCard(r) {
  const el = $("c-alerts");
  let h = "<h3>" + esc(t("alerts_title")) + "</h3>";
  if (!r || !r.ok) h += errHtml(r);
  else if (!r.data.length) h += '<p class="empty">' + esc(t("no_alerts")) + "</p>";
  else h += r.data.slice(0, 3).map(alertItem).join("") + '<p><button class="link" data-go="alerts">' + esc(t("view_all")) + "</button></p>";
  el.innerHTML = h;
}

/* quick ask + shortcuts on the home screen */
function askQuestion(text) {
  text = (text || "").trim();
  if (!text) return;
  pendingQ = text;
  $("askin").value = "";
  location.hash = "#chat";
}
$("askgo").addEventListener("click", () => askQuestion($("askin").value));
$("askin").addEventListener("keydown", e => { if (e.key === "Enter") askQuestion($("askin").value); });
$("chips").addEventListener("click", e => { if (e.target.dataset.q) askQuestion(t(e.target.dataset.q)); });
document.addEventListener("click", e => { if (e.target.dataset && e.target.dataset.go) location.hash = "#" + e.target.dataset.go; });

/* ------------------------------------------------------------------
   Chat
   ------------------------------------------------------------------ */
function bubble(role, text, cls) {
  const d = document.createElement("div");
  d.className = "bubble " + (role === "user" ? "u" : "a") + (cls ? " " + cls : "");
  d.textContent = text;
  $("msgs").appendChild(d);
  $("msgs").scrollTop = $("msgs").scrollHeight;
  return d;
}

async function loadChat() {
  const r = await api("/chat/history");
  $("msgs").innerHTML = "";
  if (r.ok && r.data.length) r.data.forEach(m => bubble(m.role, m.message));
  else bubble("assistant", t("chat_welcome", { n: me.name }));
  if (pendingQ) { const q = pendingQ; pendingQ = null; sendMsg(q); }
  else $("msg").focus();
}

async function sendMsg(text) {
  text = (text || $("msg").value).trim();
  if (!text) return;
  $("msg").value = "";
  $("send").disabled = true;
  bubble("user", text);
  const wait = bubble("assistant", "...", "typing");
  const r = await api("/chat", "POST", { message: text, language: lang });
  wait.classList.remove("typing");
  wait.textContent = r.ok ? r.data.reply : (r.data.error || "Error");
  if (!r.ok) wait.classList.add("err");
  if (!r.ok) voiceStatus(r.data.error || "Could not get a reply. Please try again.");
  else if (voiceReplies) speakReply(r.data.reply);
  else voiceStatus("Reply ready. Turn on the speaker to hear it.");
  $("msgs").scrollTop = $("msgs").scrollHeight;
  $("send").disabled = false;
  $("msg").focus();
}
$("send").addEventListener("click", () => sendMsg());
$("msg").addEventListener("keydown", e => { if (e.key === "Enter") sendMsg(); });

let voiceReplies = false;
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let activeRecorder = null;
let recorderStream = null;
let recorderChunks = [];
let recorderLimit = null;
const voiceStatus = text => { $("voice-status").textContent = text; };
function speechLang() {
  // All selector languages are Indian languages; derive the locale so newly
  // added selector entries work without adding another voice-specific mapping.
  const code = String(lang || "en").trim().replace(/_/g, "-");
  if (code.includes("-")) return code;
  return code + "-IN";
}
function speakReply(text) {
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
    voiceStatus("Spoken replies are not supported in this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLang();
  const voices = window.speechSynthesis.getVoices();
  const locale = utterance.lang.toLowerCase();
  utterance.voice = voices.find(v => v.lang.toLowerCase() === locale)
    || voices.find(v => v.lang.toLowerCase().split("-")[0] === locale.split("-")[0])
    || null;
  utterance.onerror = () => voiceStatus("Could not play the spoken reply. Check your device audio settings.");
  window.speechSynthesis.speak(utterance);
}
function updateVoiceControls() {
  const name = document.querySelector(".langsel option:checked")?.textContent || lang;
  $("voice-output").title = voiceReplies ? "Turn spoken replies off" : "Turn spoken replies on";
  voiceStatus(voiceReplies ? "Spoken replies are on in " + name + "." : "Chat replies use " + name + ". Turn on the speaker to hear them.");
}
$("voice-output").addEventListener("click", () => {
  voiceReplies = !voiceReplies;
  $("voice-output").setAttribute("aria-pressed", String(voiceReplies));
  $("voice-output").setAttribute("aria-label", voiceReplies ? "Turn spoken replies off" : "Turn spoken replies on");
  $("voice-output").title = voiceReplies ? "Turn spoken replies off" : "Turn spoken replies on";
  if (!voiceReplies && window.speechSynthesis) window.speechSynthesis.cancel();
  updateVoiceControls();
  if (voiceReplies) {
    const previousReply = [...document.querySelectorAll("#msgs .bubble.a:not(.typing)")].pop();
    if (previousReply) speakReply(previousReply.textContent);
  }
});

async function transcribeRecordedVoice(blob) {
  const form = new FormData();
  const extension = (blob.type.match(/\/(\w+)/) || [null, "webm"])[1];
  form.append("audio", blob, "voice." + extension);
  form.append("language", speechLang());
  voiceStatus("Transcribing your message…");
  try {
    const headers = {};
    if (token) headers.Authorization = "Bearer " + token;
    const response = await fetch("/api/chat/transcribe", { method: "POST", headers, body: form });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && token) logout();
    if (!response.ok) throw new Error(data.error || "Voice transcription failed. Please try again.");
    const transcript = (data.text || "").trim();
    if (!transcript) throw new Error("I could not hear any words. Please try again.");
    $("msg").value = transcript;
    voiceStatus("Sending your message…");
    sendMsg(transcript);
  } catch (error) {
    voiceStatus(error.message || "Voice transcription failed. Please try again.");
  } finally {
    $("voice-input").disabled = false;
  }
}

function stopRecordedVoice() {
  if (recorderLimit) clearTimeout(recorderLimit);
  recorderLimit = null;
  if (activeRecorder && activeRecorder.state !== "inactive") activeRecorder.stop();
}

async function startRecordedVoice() {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    voiceStatus("Microphone voice needs a supported browser on HTTPS or localhost. Allow microphone access and try again.");
    return;
  }
  try {
    recorderStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
      .find(type => MediaRecorder.isTypeSupported(type));
    activeRecorder = new MediaRecorder(recorderStream, preferred ? { mimeType: preferred } : undefined);
    recorderChunks = [];
    activeRecorder.ondataavailable = event => { if (event.data && event.data.size) recorderChunks.push(event.data); };
    activeRecorder.onerror = () => {
      voiceStatus("Microphone recording failed. Check microphone permission and try again.");
      $("voice-input").disabled = false;
    };
    activeRecorder.onstop = () => {
      const blob = new Blob(recorderChunks, { type: activeRecorder.mimeType || "audio/webm" });
      recorderStream?.getTracks().forEach(track => track.stop());
      recorderStream = null;
      activeRecorder = null;
      $("voice-input").setAttribute("aria-pressed", "false");
      if (blob.size) transcribeRecordedVoice(blob);
      else { $("voice-input").disabled = false; voiceStatus("The recording was empty. Please try again."); }
    };
    activeRecorder.start();
    $("voice-input").disabled = false;
    $("voice-input").setAttribute("aria-pressed", "true");
    voiceStatus("Listening… Tap the microphone to stop. Recording stops after 20 seconds.");
    recorderLimit = setTimeout(stopRecordedVoice, 20000);
  } catch (error) {
    recorderStream?.getTracks().forEach(track => track.stop());
    recorderStream = null;
    $("voice-input").disabled = false;
    voiceStatus(error.name === "NotAllowedError"
      ? "Allow microphone access in your browser, then try again."
      : "Could not start the microphone. Check permission and try again.");
  }
}

function startBrowserRecognition() {
  const recognition = new Recognition();
  recognition.lang = speechLang();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  $("voice-input").disabled = true;
  voiceStatus("Listening…");
  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript.trim();
    $("msg").value = transcript;
    voiceStatus(transcript ? "Sending your message…" : "I didn’t hear anything. Try again.");
    if (transcript) sendMsg(transcript);
  };
  recognition.onerror = event => {
    voiceStatus(event.error === "not-allowed"
      ? "Allow microphone access to use voice input."
      : "Voice input failed. Please allow microphone access or try again.");
  };
  recognition.onend = () => { $("voice-input").disabled = false; };
  try { recognition.start(); }
  catch (error) { $("voice-input").disabled = false; voiceStatus("Could not start voice input. Please try again."); }
}
$("voice-input").addEventListener("click", () => {
  if (activeRecorder) {
    $("voice-input").disabled = true;
    stopRecordedVoice();
    return;
  }
  // A farmer who starts with the microphone should hear the answer too,
  // without needing to discover and enable the separate speaker control.
  if (!voiceReplies) {
    voiceReplies = true;
    $("voice-output").setAttribute("aria-pressed", "true");
    $("voice-output").setAttribute("aria-label", "Turn spoken replies off");
    updateVoiceControls();
  }
  // Use Groq Whisper through the server when MediaRecorder is available. This
  // supports browsers that do not implement the experimental Web Speech API.
  if (window.MediaRecorder && navigator.mediaDevices?.getUserMedia) {
    $("voice-input").disabled = true;
    startRecordedVoice().finally(() => {
      if (!activeRecorder) $("voice-input").disabled = false;
    });
  } else if (Recognition) startBrowserRecognition();
  else voiceStatus("Voice input is unavailable in this browser. Use HTTPS or localhost and allow microphone access.");
});

/* ------------------------------------------------------------------
   Crops
   ------------------------------------------------------------------ */
async function searchCrop() {
  const q = $("q").value.trim();
  if (!q) return;
  const r = await api("/crops/search?q=" + enc(q) + "&district=" + enc(me.district || "") + "&state=" + enc(me.state || ""));
  if (!r.ok) { $("cropout").innerHTML = '<div class="card">' + errHtml(r) + "</div>"; return; }
  const w = r.data.weather;
  let h = '<p class="sub">' + esc(t("wx_line", { d: r.data.district, t: w.temp, s: cleanDesc(w.description) })) + "</p>";
  r.data.results.forEach(c => {
    const v = c.fit.verdict;
    h += '<article class="card crop-card"><div class="crop-head"><h3>' + esc(c.crop) + ' <span class="sub">(' + esc(c.state) + ')</span></h3>' +
         '<span class="badge b-' + vSuffix(v) + '">' + esc(tx("v_", v)) + "</span></div>" +
         '<ul class="reasons">' + c.fit.reasons.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" +
         '<div class="crop-meta"><div><span>' + esc(t("ideal")) + ":</span> " + esc(c.ideal.temp[0]) + " to " + esc(c.ideal.temp[1]) + "°C</div>" +
         "<div><span>" + esc(t("irrigation")) + ":</span> " + esc(c.irrigation) + "</div>" +
         "<div><span>" + esc(t("tips")) + ":</span> " + esc(c.tips) + "</div></div></article>";
  });
  $("cropout").innerHTML = h;
}
$("qbtn").addEventListener("click", searchCrop);
$("q").addEventListener("keydown", e => { if (e.key === "Enter") searchCrop(); });

/* ------------------------------------------------------------------
   Soil
   ------------------------------------------------------------------ */
async function loadSoilFull() {
  const el = $("soilfull");
  if (!me.district) { el.innerHTML = '<p class="empty">' + esc(t("no_district")) + "</p>"; return; }
  el.innerHTML = '<div class="skeleton"></div>';
  const r = await api("/soil/" + enc(me.district));
  if (view !== "soil") return;
  el.innerHTML = r.ok ? "<h3>" + esc(r.data.district) + "</h3>" + soilHtml(r.data, true)
                      : "<h3>" + esc(me.district) + '</h3><p class="empty">' + esc(t("no_soil", { d: me.district })) + "</p>";
}

/* ------------------------------------------------------------------
   Map
   ------------------------------------------------------------------ */
const MAP_COLORS = { Good: "#2e7d4f", Moderate: "#e8a317", Poor: "#c23b2b" };
const MAP_NONE = "#c5cec7";

function mapIntro() {
  return `<h3>${esc(t("nutrient_map_title"))}</h3><p class="sub">${esc(t("nutrient_map_help"))}</p><p class="sub">${esc(t("nutrient_map_location"))}</p>`;
}

async function showMapCard(name) {
  const r = await api("/soil/" + enc(name));
  $("mapcard").innerHTML = "<h3>" + esc(name) + "</h3>" +
    (r.ok ? soilHtml(r.data, true) : '<p class="empty">' + esc(t("no_soil", { d: name })) + "</p>");
}

async function initMap() {
  if (!maplibregl.Map) { $("mapcard").innerHTML = '<p class="empty">' + esc(t("map_offline")) + "</p>"; return; }
  if (soilMap) {
    setTimeout(() => soilMap.resize(), 60);
    soilMap.flyTo({ center: [80, 22.5], zoom: 4.5, pitch: 0, duration: 500 });
    updateSoilMapMarker();
    return;
  }
  $("mapcard").innerHTML = mapIntro();
  const hasProfilePoint = hasSavedCoordinates(me);
  soilMap = new maplibregl.Map({
    container: "map", style: "https://tiles.openfreemap.org/styles/bright",
    center: [80, 22.5], zoom: 4.5, pitch: 0, bearing: 0,
    canvasContextAttributes: { antialias: true }
  });
  soilMap.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  $("nutrient-map-metric").addEventListener("change", updateNutrientMapStyle);
  soilMap.on("load", () => {
    soilMapLoaded = true;
    addFarmLandLayer(soilMap, "soil");
    setFarmLandVisibility(soilMap, "soil", soilFieldsVisible);
    add3DBuildings(soilMap, "soil");
    if (soilGeoJSON) addSoilDistrictLayer(soilGeoJSON);
    updateSoilMapMarker();
    if (stateNutrientGeoJSON) addNutrientMapLayer(stateNutrientGeoJSON);
  });

  const soil = await api("/soil");
  const rating = {};
  (soil.ok ? soil.data : []).forEach(s => { rating[String(s.district).trim().toLowerCase()] = s.rating; });
  const norm = s => String(s || "").trim().toLowerCase();
  const nameOf = f => { for (const k of NAME_KEYS) if (f.properties && f.properties[k]) return f.properties[k]; return ""; };
  const features = [];
  for (const file of MAP_FILES) {
    try {
      const gj = await (await fetch(file)).json();
      (gj.features || []).forEach(feature => {
        const name = nameOf(feature);
        feature.properties = { ...(feature.properties || {}), _districtName: name, _soilRating: rating[norm(name)] || "None" };
        features.push(feature);
      });
    } catch (e) { console.warn("Could not load", file, e); }
  }
  soilGeoJSON = { type: "FeatureCollection", features };
  if (soilMap.loaded()) addSoilDistrictLayer(soilGeoJSON);
  const bounds = new maplibregl.LngLatBounds();
  const extend = coordinates => {
    if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") bounds.extend(coordinates);
    else coordinates.forEach(extend);
  };
  features.forEach(feature => extend(feature.geometry.coordinates));
  if (!bounds.isEmpty()) soilMap.fitBounds(bounds, { padding: 24, pitch: 48, duration: 0 });
  else if (hasProfilePoint) soilMap.easeTo({ center: [Number(me.longitude), Number(me.latitude)], zoom: 15, pitch: 55, duration: 0 });
  const nutrientData = await api("/nutrients");
  if (!nutrientData.ok) {
    $("mapcard").innerHTML = mapIntro() + '<p class="empty">' + esc(nutrientData.data.error || "Nutrient map data could not be loaded.") + "</p>";
  } else {
    try {
      const points = nutrientData.data.states.map(row => ({ type: "Feature", geometry: { type: "Point", coordinates: row.coordinates }, properties: row }));
      stateNutrientGeoJSON = { type: "FeatureCollection", features: points };
      if (soilMapLoaded) addNutrientMapLayer(stateNutrientGeoJSON);
      if (bounds.isEmpty()) {
        const stateBounds = new maplibregl.LngLatBounds();
        points.forEach(point => stateBounds.extend(point.geometry.coordinates));
        if (!stateBounds.isEmpty()) soilMap.fitBounds(stateBounds, { padding: 48, pitch: 0, duration: 0 });
      }
      if (!nutrientMapMarkers.length) $("mapcard").innerHTML = mapIntro() + '<p class="empty">State nutrient markers were not created.</p>';
      else $("mapcard").innerHTML = mapIntro() + `<p class="sub">${esc(t("nutrient_map_loaded", { n: nutrientMapMarkers.length }))}</p>`;
    } catch (error) {
      console.error("Could not render state nutrient markers", error);
      $("mapcard").innerHTML = mapIntro() + '<p class="empty">' + esc(error.message || "State nutrient markers could not be rendered.") + "</p>";
    }
  }
  setTimeout(() => soilMap.resize(), 60);
}

function updateNutrientMapStyle() {
  if (!soilMap || !nutrientMapMarkers.length) return;
  const metric = $("nutrient-map-metric").value;
  nutrientMapMarkers.forEach(({ bubble, row }) => {
    const size = Math.round(12 + Math.sqrt(Math.max(0, Number(row[metric]) || 0)) / 30);
    bubble.style.width = size + "px";
    bubble.style.height = size + "px";
  });
}

function addNutrientMapLayer(data) {
  if (!soilMapLoaded) return;
  if (!soilMap || nutrientMapMarkers.length) return;
  data.features.forEach(feature => {
    const row = feature.properties;
    const element = document.createElement("button");
    element.type = "button";
    element.className = "nutrient-map-marker";
    element.title = `${nutrientStateName(row)}: ${fmtCount(row.n_low)} ${t("nutrient_n_low")}`;
    element.setAttribute("aria-label", `${t("nutrient_choose_state")}: ${nutrientStateName(row)}`);
    const bubble = document.createElement("span");
    bubble.className = "nutrient-map-bubble";
    const label = document.createElement("span");
    label.className = "nutrient-map-label";
    label.textContent = nutrientStateName(row);
    element.append(bubble, label);
    element.addEventListener("click", event => {
      event.stopPropagation();
      showNutrientMapCard(row);
    });
    const marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat(row.coordinates).addTo(soilMap);
    nutrientMapMarkers.push({ marker, bubble, row });
  });
  updateNutrientMapStyle();
}

function showNutrientMapCard(row) {
  $("mapcard").innerHTML = `<h3>${esc(nutrientStateName(row))}</h3><p class="sub">${esc(row.scheme)} · ${esc(t("nutrient_cycle"))} ${esc(row.cycle)}; ${esc(t("nutrient_map_approx"))}</p>${nutrientGroupTable(row)}`;
}

function updateSoilMapMarker() {
  if (!soilMap || !hasSavedCoordinates(me)) return;
  if (soilMarker) soilMarker.remove();
  const name = [me.village, me.district, me.state].filter(Boolean).join(", ") || me.district || "Selected location";
  const element = document.createElement("div");
  element.className = "map-location-marker";
  const label = document.createElement("span");
  label.className = "map-location-label";
  label.textContent = name;
  const dot = document.createElement("span");
  dot.className = "map-location-dot";
  dot.setAttribute("aria-hidden", "true");
  element.append(label, dot);
  soilMarker = new maplibregl.Marker({ element, anchor: "bottom" })
    .setLngLat([Number(me.longitude), Number(me.latitude)]).addTo(soilMap);
}

function addSoilDistrictLayer(data) {
  if (!soilMap || soilMap.getSource("soil-districts")) return;
  soilMap.addSource("soil-districts", { type: "geojson", data });
  const before = soilMap.getLayer("soil-3d-buildings") ? "soil-3d-buildings" : undefined;
  soilMap.addLayer({
    id: "district-soil-fill", type: "fill", source: "soil-districts",
    paint: {
      "fill-color": ["match", ["get", "_soilRating"],
        "Good", MAP_COLORS.Good, "Moderate", MAP_COLORS.Moderate, "Poor", MAP_COLORS.Poor, MAP_NONE],
      "fill-opacity": 0.48
    }
  }, before);
  soilMap.addLayer({
    id: "district-soil-outline", type: "line", source: "soil-districts",
    paint: {
      "line-color": ["case", ["==", ["downcase", ["get", "_districtName"]], (me.district || "").toLowerCase()], "#16211b", "#3d4a43"],
      "line-width": ["case", ["==", ["downcase", ["get", "_districtName"]], (me.district || "").toLowerCase()], 3, 1]
    }
  }, before);
  soilMap.on("click", "district-soil-fill", e => {
    const name = e.features && e.features[0] && e.features[0].properties._districtName;
    if (name) showMapCard(name);
  });
  soilMap.on("mouseenter", "district-soil-fill", () => { soilMap.getCanvas().style.cursor = "pointer"; });
  soilMap.on("mouseleave", "district-soil-fill", () => { soilMap.getCanvas().style.cursor = ""; });
  if (me.district && data.features.length) showMapCard(me.district);
}

/* ------------------------------------------------------------------
   Alerts
   ------------------------------------------------------------------ */
async function loadAlerts() {
  const el = $("alertlist");
  el.innerHTML = '<div class="skeleton"></div>';
  const r = await api("/alerts");
  if (view !== "alerts") return;
  el.innerHTML = !r.ok ? errHtml(r)
    : !r.data.length ? '<p class="empty">' + esc(t("no_alerts")) + "</p>"
    : r.data.map(alertItem).join("");
  localStorage.setItem("alertsSeen", new Date().toISOString());
  $("alert-dot").classList.add("hidden");
}

async function checkAlertDot() {
  const r = await api("/alerts");
  if (!r.ok || !r.data.length || view === "alerts") return;
  const seen = localStorage.getItem("alertsSeen") || "";
  $("alert-dot").classList.toggle("hidden", !(r.data[0].at + "Z" > seen));
}

/* ------------------------------------------------------------------
   State level nutrient output from the supplied Soil Health Card files
   ------------------------------------------------------------------ */
const NUTRIENT_GROUPS = [
  { label: "ng_n", keys: ["n_high", "n_medium", "n_low"], names: ["nutrient_high", "nutrient_medium", "nutrient_low"] },
  { label: "ng_p", keys: ["p_high", "p_medium", "p_low"], names: ["nutrient_high", "nutrient_medium", "nutrient_low"] },
  { label: "ng_k", keys: ["k_high", "k_medium", "k_low"], names: ["nutrient_high", "nutrient_medium", "nutrient_low"] },
  { label: "ng_oc", keys: ["oc_high", "oc_medium", "oc_low"], names: ["nutrient_high", "nutrient_medium", "nutrient_low"] },
  { label: "ng_ph", keys: ["p_h_alkaline", "p_h_acidic", "p_h_neutral"], names: ["nutrient_alkaline", "nutrient_acidic", "nutrient_neutral"] },
  { label: "ng_ec", keys: ["ec_non_saline", "ec_saline"], names: ["nutrient_non_saline", "nutrient_saline"] },
  ...[["ng_s", "s"], ["ng_fe", "fe"], ["ng_zn", "zn"], ["ng_cu", "cu"], ["ng_b", "b"], ["ng_mn", "mn"]]
    .map(([label, key]) => ({ label, keys: [key + "_sufficient", key + "_deficient"], names: ["nutrient_sufficient", "nutrient_deficient"] }))
];
const STATE_NAMES_HI = {
  "Andhra Pradesh": "आंध्र प्रदेश", "Arunachal Pradesh": "अरुणाचल प्रदेश", "Assam": "असम", "Bihar": "बिहार", "Chhattisgarh": "छत्तीसगढ़", "Goa": "गोवा", "Gujarat": "गुजरात", "Haryana": "हरियाणा", "Himachal Pradesh": "हिमाचल प्रदेश", "Jharkhand": "झारखंड", "Karnataka": "कर्नाटक", "Kerala": "केरल", "Madhya Pradesh": "मध्य प्रदेश", "Maharashtra": "महाराष्ट्र", "Manipur": "मणिपुर", "Meghalaya": "मेघालय", "Mizoram": "मिज़ोरम", "Nagaland": "नागालैंड", "Odisha": "ओडिशा", "Punjab": "पंजाब", "Rajasthan": "राजस्थान", "Sikkim": "सिक्किम", "Tamil Nadu": "तमिलनाडु", "Telangana": "तेलंगाना", "Tripura": "त्रिपुरा", "Uttar Pradesh": "उत्तर प्रदेश", "Uttarakhand": "उत्तराखंड", "West Bengal": "पश्चिम बंगाल", "Andaman and Nicobar Islands": "अंडमान और निकोबार द्वीपसमूह", "Chandigarh": "चंडीगढ़", "Dadra and Nagar Haveli and Daman and Diu": "दादरा और नगर हवेली तथा दमन और दीव", "Delhi": "दिल्ली", "Jammu and Kashmir": "जम्मू और कश्मीर", "Ladakh": "लद्दाख", "Lakshadweep": "लक्षद्वीप", "Puducherry": "पुदुचेरी"
};
let selectedNutrientState = "BIHAR";

function fmtCount(value) { return Number(value || 0).toLocaleString(); }
function nutrientStateName(row) { return lang === "hi" ? (STATE_NAMES_HI[row.state] || row.state) : row.state; }
function groupTotal(row, group) { return group.keys.reduce((sum, key) => sum + Number(row[key] || 0), 0); }
function nutrientGroupTable(row) {
  return NUTRIENT_GROUPS.map(group => {
    const total = groupTotal(row, group);
    const parts = group.keys.map((key, i) => `<span><b>${esc(t(group.names[i]))}</b> ${fmtCount(row[key])}${total ? ` (${(100 * row[key] / total).toFixed(1)}%)` : ""}</span>`).join("");
    return `<div class="nutrient-row"><b>${esc(t(group.label))}</b><div>${parts}</div></div>`;
  }).join("");
}

async function loadNutrientOutput() {
  const el = $("nutrient-output");
  el.innerHTML = '<article class="card"><div class="skeleton"></div></article>';
  const r = await api("/nutrients");
  if (!r.ok) { el.innerHTML = '<article class="card"><p class="empty">' + esc(r.data.error || "Nutrient data unavailable") + "</p></article>"; return; }
  const data = r.data, states = data.states || [];
  const stateOptions = states.map(row => `<option value="${esc(row.state_key)}">${esc(nutrientStateName(row))}</option>`).join("");
  const national = data.national_pdf || {};
  const selected = states.find(row => row.state_key === selectedNutrientState) || states.find(row => row.state_key === "BIHAR") || states[0];
  const displayState = row => nutrientStateName(row);
  const detail = selected ? `<article class="card nutrient-detail"><div class="nutrient-heading"><div><h3>${esc(displayState(selected))}</h3><p class="sub">${esc(data.source.scheme)} · ${esc(t("nutrient_cycle"))} ${esc(data.source.cycle)}</p></div><select id="nutrient-state" aria-label="${esc(t("nutrient_choose_state"))}">${stateOptions}</select></div>${nutrientGroupTable(selected)}</article>` : "";
  el.innerHTML = `<article class="card nutrient-overview"><div class="nutrient-heading"><div><h3>${esc(t("nutrient_title"))}</h3><p class="sub">${esc(data.source.scheme)} · ${esc(t("nutrient_cycle"))} ${esc(data.source.cycle)}</p></div><a class="link" href="/api/nutrients/download">${esc(t("nutrient_download"))}</a></div><p class="sub">${esc(t("nutrient_national"))}</p><div class="nutrient-summary"><div><b>${fmtCount(national.n_high + national.n_medium + national.n_low)}</b><span>${esc(t("nutrient_n_samples"))}</span></div><div><b>${fmtCount(national.p_high + national.p_medium + national.p_low)}</b><span>${esc(t("nutrient_p_samples"))}</span></div><div><b>${fmtCount(national.k_high + national.k_medium + national.k_low)}</b><span>${esc(t("nutrient_k_samples"))}</span></div><div><b>${fmtCount(national.oc_high + national.oc_medium + national.oc_low)}</b><span>${esc(t("nutrient_oc_samples"))}</span></div></div>${nutrientGroupTable(national)}<p class="sub">${esc(t("nutrient_state_coverage", { n: states.length }))}</p></article>${detail}<article class="card nutrient-table-card"><h3>${esc(t("nutrient_state_rows"))}</h3><div class="nutrient-table-scroll"><table class="nutrient-table"><thead><tr><th>${esc(t("nutrient_th"))}</th><th>${esc(t("nutrient_n"))}</th><th>${esc(t("nutrient_p"))}</th><th>${esc(t("nutrient_k"))}</th><th>${esc(t("nutrient_oc"))}</th><th>${esc(t("nutrient_fe"))}</th><th>${esc(t("nutrient_zn"))}</th></tr></thead><tbody>${states.map(row => `<tr data-state="${esc(row.state_key)}"><td>${esc(displayState(row))}</td><td>${fmtCount(row.n_low)}</td><td>${fmtCount(row.p_low)}</td><td>${fmtCount(row.k_low)}</td><td>${fmtCount(row.oc_low)}</td><td>${fmtCount(row.fe_deficient)}</td><td>${fmtCount(row.zn_deficient)}</td></tr>`).join("")}</tbody></table></div></article><p class="nutrient-source sub">${esc(t("nutrient_source"))} ${esc(t("nutrient_data_note"))}</p>`;
  const picker = $("nutrient-state");
  picker.value = selected.state_key;
  picker.addEventListener("change", () => { selectedNutrientState = picker.value; loadNutrientOutput(); });
  el.querySelectorAll("tr[data-state]").forEach(row => row.addEventListener("click", () => { selectedNutrientState = row.dataset.state; loadNutrientOutput(); }));
}

/* ------------------------------------------------------------------
   Installable web app
   ------------------------------------------------------------------ */
let pendingInstall = null;
const installButton = $("install-app");
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  pendingInstall = event;
  installButton.classList.remove("hidden");
});
installButton.addEventListener("click", async () => {
  if (!pendingInstall) return;
  pendingInstall.prompt();
  await pendingInstall.userChoice;
  pendingInstall = null;
  installButton.classList.add("hidden");
});
window.addEventListener("appinstalled", () => {
  pendingInstall = null;
  installButton.classList.add("hidden");
});
if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("/static/service-worker.js", { scope: "/static/" }).catch(() => {});
}

/* ------------------------------------------------------------------
   Start
   ------------------------------------------------------------------ */
(async function init() {
  await loadLanguages();
  await setLang(lang, false);
  if (token) {
    const r = await api("/me");
    if (r.ok) { me = r.data; enterApp(); } else { logout(); }
  }
})();
