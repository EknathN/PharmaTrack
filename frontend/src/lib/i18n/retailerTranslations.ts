export type RetailerLanguage = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'mr' | 'bn' | 'gu';

export interface LanguageOption {
  code: RetailerLanguage;
  label: string;
  nativeLabel: string;
}

export const RETAILER_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
];

export const TRANSLATIONS: Record<RetailerLanguage, Record<string, string>> = {
  en: {
    // Nav
    navDashboard: "Dashboard",
    navReceive: "Receive Stock",
    navSell: "Record Sale",
    navReturn: "Return Near-Expiry",
    retailerRole: "Retailer",
    logout: "Logout",
    selectLanguage: "Language",

    // Dashboard Header
    title: "Retailer Dashboard",
    subtitle: "Sell medicines, monitor expiry, and manage returns.",
    refresh: "Refresh",
    receiveStockBtn: "Receive Stock",
    recordSaleBtn: "Record Sale",

    // Alert
    nearExpiryAlertTitle: "⚠️ NEAR-EXPIRY ALERT — Batch(es) Require Immediate Action!",
    daysLeftText: "days left!",
    initiateReturnBtn: "Initiate Return →",

    // KPIs
    kpiInventoryItems: "Inventory Items",
    kpiTotalUnits: "Total Units",
    kpiNearExpiry: "Near Expiry",
    kpiIncoming: "Incoming",

    // Inventory Table
    currentInventory: "Current Inventory",
    noInventory: "No inventory yet.",
    receiveStockLink: "Receive stock",
    fromDistributor: "from a distributor.",
    thBatch: "Batch",
    thMedicine: "Medicine",
    thQty: "Qty",
    thExpiry: "Expiry",
    thDaysLeft: "Days Left",
    thAction: "Action",
    lowStock: "Low Stock!",
    returnAction: "Return →",
    sellAction: "Sell →",

    // Live Alerts
    liveAlerts: "Live Alerts",
    noAlerts: "No new alerts.",

    // Incoming & Returns
    incomingTitle: "Incoming Shipments Awaiting Receipt",
    receiveAction: "Receive →",
    returnShipmentsTitle: "Your Return Shipments",
    undoReturnBtn: "Undo Return",
    printMandateBtn: "Print Mandate",
    fromLabel: "From:",
    toLabel: "To:",
    unitsOf: "units of",

    // Statuses
    status_in_stock: "In Stock",
    status_in_transit: "In Transit",
    status_awaiting_proof: "Awaiting Proof",
    status_received: "Received ✓",
    status_near_expiry: "Near Expiry ⚠️",
    status_return_in_transit: "Return In Transit",
    status_disposal_in_transit: "Disposal In Transit",
    status_fully_disposed: "Fully Disposed ✓",
    status_completed: "Completed ✓",
    status_pending: "Pending",
    status_frozen: "Frozen ❄️",

    // Sell Page
    sellPageTitle: "Record a Sale",
    sellPageSubtitle: "Scan the medicine QR code and enter quantity sold to update inventory.",
    scanMedicineQr: "Scan Medicine QR Code",
    quantitySoldLabel: "Quantity Sold",
    quantitySoldPlaceholder: "e.g. 10",
    confirmSaleBtn: "Confirm & Record Sale",
    saleRecordedTitle: "Sale Recorded!",
    unitsSoldMsg: "units of",
    remainingMsg: "units remaining.",
    recordAnotherBtn: "Record Another Sale",
    backToDashboardBtn: "Back to Dashboard",
    lowStockNotice: "Low Stock Alert! Only few units left. Consider ordering more.",

    // Receive Page
    receivePageTitle: "Receive Incoming Stock",
    receivePageSubtitle: "Verify outer crate QR and medicine QR codes, enter verified quantity, and upload courier proof.",
    pendingShipmentsList: "Incoming Shipments Awaiting Receipt",
    shipmentQrLabel: "Outer Shipment Crate QR",
    medicineQrLabel: "Unit Medicine Box QR",
    receivedQtyLabel: "Verified Quantity Received",
    proofPhotoLabel: "Signed Courier Delivery Receipt (POD Photo)",
    confirmReceiptBtn: "Verify Dual-QR & Complete Receipt",
    receiptSuccessTitle: "Stock Received Successfully!",
    receiptSuccessSubtitle: "Inventory has been updated and transfer proof is cryptographically sealed.",
    viewInventoryBtn: "View Inventory",

    // Return Page
    returnPageTitle: "Initiate Near-Expiry Return",
    returnPageSubtitle: "Reverse-logistics return routing directly to distributor or manufacturer.",
    selectBatchLabel: "Select Medicine Batch to Return",
    recipientLabel: "Return Destination",
    distributorOption: "Distributor (Supplier)",
    manufacturerOption: "Manufacturer (Origin)",
    returnQuantityLabel: "Return Quantity (Locked)",
    returnReasonLabel: "Return Reason / Notes",
    submitReturnBtn: "Generate Return Manifest & Lock Units",
    returnSuccessTitle: "Return Shipment Created!",
    returnSuccessSubtitle: "Shipment QR generated. Please upload courier pickup proof to dispatch.",
  },

  hi: {
    // Nav
    navDashboard: "डैशबोर्ड",
    navReceive: "स्टॉक प्राप्त करें",
    navSell: "बिक्री दर्ज करें",
    navReturn: "एक्सपायरी वापसी",
    retailerRole: "दवा विक्रेता (रिटेलर)",
    logout: "लॉग आउट",
    selectLanguage: "भाषा",

    // Dashboard Header
    title: "रिटेलर डैशबोर्ड",
    subtitle: "दवाइयां बेचें, समाप्ति (एक्सपायरी) की निगरानी करें और वापसी प्रबंधित करें।",
    refresh: "रिफ्रेश",
    receiveStockBtn: "स्टॉक प्राप्त करें",
    recordSaleBtn: "बिक्री दर्ज करें",

    // Alert
    nearExpiryAlertTitle: "⚠️ एक्सपायरी अलर्ट — बैच पर तत्काल कार्रवाई आवश्यक है!",
    daysLeftText: "दिन शेष!",
    initiateReturnBtn: "वापसी शुरू करें →",

    // KPIs
    kpiInventoryItems: "कुल इन्वेंट्री दवाएं",
    kpiTotalUnits: "कुल यूनिट्स",
    kpiNearExpiry: "निकट एक्सपायरी",
    kpiIncoming: "आने वाले शिपमेंट",

    // Inventory Table
    currentInventory: "वर्तमान इन्वेंट्री",
    noInventory: "कोई इन्वेंट्री उपलब्ध नहीं है।",
    receiveStockLink: "स्टॉक प्राप्त करें",
    fromDistributor: "वितरक से दवाएं जोड़ें।",
    thBatch: "बैच नंबर",
    thMedicine: "दवा का नाम",
    thQty: "मात्रा (यूनिट)",
    thExpiry: "समाप्ति तिथि",
    thDaysLeft: "शेष दिन",
    thAction: "कार्रवाई",
    lowStock: "स्टॉक कम है!",
    returnAction: "वापसी →",
    sellAction: "बिक्री →",

    // Live Alerts
    liveAlerts: "लाइव अलर्ट्स",
    noAlerts: "कोई नया अलर्ट नहीं है।",

    // Incoming & Returns
    incomingTitle: "प्राप्ति के लिए लंबित शिपमेंट",
    receiveAction: "प्राप्त करें →",
    returnShipmentsTitle: "आपकी वापसी शिपमेंट",
    undoReturnBtn: "वापसी रद्द करें",
    printMandateBtn: "जनादेश प्रिंट करें",
    fromLabel: "प्रेषक:",
    toLabel: "प्राप्तकर्ता:",
    unitsOf: "यूनिट्स दवा",

    // Statuses
    status_in_stock: "स्टॉक में उपलब्ध",
    status_in_transit: "रास्ते में (ट्रांजिट)",
    status_awaiting_proof: "सबूत प्रतीक्षित",
    status_received: "प्राप्त हुआ ✓",
    status_near_expiry: "निकट एक्सपायरी ⚠️",
    status_return_in_transit: "वापसी रास्ते में",
    status_disposal_in_transit: "निस्तारण रास्ते में",
    status_fully_disposed: "पूर्ण निस्तारित ✓",
    status_completed: "पूर्ण हुआ ✓",
    status_pending: "लंबित",
    status_frozen: "रोक लगाई गई ❄️",

    // Sell Page
    sellPageTitle: "दवा बिक्री दर्ज करें",
    sellPageSubtitle: "इन्वेंट्री अपडेट करने के लिए दवा क्यूआर कोड स्कैन करें और बेची गई मात्रा दर्ज करें।",
    scanMedicineQr: "दवा क्यूआर कोड स्कैन करें",
    quantitySoldLabel: "बेची गई मात्रा",
    quantitySoldPlaceholder: "उदा. 10",
    confirmSaleBtn: "बिक्री की पुष्टि करें",
    saleRecordedTitle: "बिक्री सफलतापूर्वक दर्ज हुई!",
    unitsSoldMsg: "यूनिट्स बेची गईं:",
    remainingMsg: "यूनिट्स शेष हैं।",
    recordAnotherBtn: "अन्य बिक्री दर्ज करें",
    backToDashboardBtn: "डैशबोर्ड पर वापस जाएं",
    lowStockNotice: "कम स्टॉक चेतावनी! केवल कुछ ही यूनिट्स शेष हैं। अतिरिक्त ऑर्डर करने पर विचार करें।",

    // Receive Page
    receivePageTitle: "आने वाला स्टॉक प्राप्त करें",
    receivePageSubtitle: "क्रेट क्यूआर और दवा क्यूआर कोड सत्यापित करें, मात्रा दर्ज करें और कूरियर रसीद अपलोड करें।",
    pendingShipmentsList: "प्राप्ति की प्रतीक्षा कर रहे शिपमेंट",
    shipmentQrLabel: "शिपमेंट क्रेट क्यूआर कोड",
    medicineQrLabel: "दवा बॉक्स क्यूआर कोड",
    receivedQtyLabel: "सत्यापित प्राप्त मात्रा",
    proofPhotoLabel: "हस्ताक्षरित कूरियर रसीद (पीओडी फोटो)",
    confirmReceiptBtn: "डुअल-क्यूआर सत्यापित करें और स्टॉक प्राप्त करें",
    receiptSuccessTitle: "स्टॉक सफलतापूर्वक प्राप्त हुआ!",
    receiptSuccessSubtitle: "इन्वेंट्री अपडेट हो गई है और कूरियर हस्तांतरण डिजिटल लेजर में दर्ज हो गया है।",
    viewInventoryBtn: "इन्वेंट्री देखें",

    // Return Page
    returnPageTitle: "एक्सपायरी दवा वापसी शुरू करें",
    returnPageSubtitle: "वितरक या निर्माता को सीधे रिवर्स-लॉजिस्टिक्स वापसी।",
    selectBatchLabel: "वापस करने के लिए दवा बैच चुनें",
    recipientLabel: "वापसी गंतव्य",
    distributorOption: "वितरक (सप्लायर)",
    manufacturerOption: "निर्माता (उत्पादक)",
    returnQuantityLabel: "वापसी मात्रा (लॉक की गई)",
    returnReasonLabel: "वापसी का कारण / टिप्पणी",
    submitReturnBtn: "वापसी मैनिफेस्ट बनाएं और यूनिट्स लॉक करें",
    returnSuccessTitle: "वापसी शिपमेंट तैयार हो गई!",
    returnSuccessSubtitle: "शिपमेंट क्यूआर तैयार है। भेजने के लिए कृपया कूरियर पिकअप रसीद अपलोड करें।",
  },

  ta: {
    // Nav
    navDashboard: "டாஷ்போர்டு",
    navReceive: "மருந்து பெறுதல்",
    navSell: "விற்பனை பதிவு",
    navReturn: "காலாவதி திருப்பியளித்தல்",
    retailerRole: "மருந்தகம் (சில்லறை விற்பனையாளர்)",
    logout: "வெளியேறு",
    selectLanguage: "மொழி",

    // Dashboard Header
    title: "சில்லறை விற்பனையாளர் டாஷ்போர்டு",
    subtitle: "மருந்துகளை விற்றல், காலாவதி கண்காணிப்பு மற்றும் திருப்பியளித்தல் மேலாண்மை.",
    refresh: "புதுப்பி",
    receiveStockBtn: "மருந்து பெறுதல்",
    recordSaleBtn: "விற்பனை பதிவு",

    // Alert
    nearExpiryAlertTitle: "⚠️ காலாவதி எச்சரிக்கை — உடனடி நடவடிக்கை தேவைப்படும் தொகுதிகள்!",
    daysLeftText: "நாட்கள் உள்ளன!",
    initiateReturnBtn: "திருப்பியனுப்ப தொடங்கு →",

    // KPIs
    kpiInventoryItems: "மொத்த மருந்துகள்",
    kpiTotalUnits: "மொத்த அலகுகள்",
    kpiNearExpiry: "விரைவில் காலாவதி",
    kpiIncoming: "வரும் மருந்துகள்",

    // Inventory Table
    currentInventory: "தற்போதைய கையிருப்பு",
    noInventory: "கையிருப்பு எதுவும் இல்லை.",
    receiveStockLink: "மருந்து பெறுக",
    fromDistributor: "விநியோகஸ்தரிடமிருந்து மருந்துகளை சேர்க்கவும்.",
    thBatch: "தொகுதி எண் (Batch)",
    thMedicine: "மருந்து பெயர்",
    thQty: "அளவு",
    thExpiry: "காலாவதி தேதி",
    thDaysLeft: "மீதமுள்ள நாட்கள்",
    thAction: "செயல்பாடு",
    lowStock: "குறைந்த கையிருப்பு!",
    returnAction: "திருப்பியனுப்பு →",
    sellAction: "விற்பனை →",

    // Live Alerts
    liveAlerts: "நேரலை எச்சரிக்கைகள்",
    noAlerts: "புதிய எச்சரிக்கைகள் இல்லை.",

    // Incoming & Returns
    incomingTitle: "வரவிருக்கும் மருந்து தொகுதிகள்",
    receiveAction: "பெறுக →",
    returnShipmentsTitle: "நீங்கள் திருப்பியனுப்பிய தொகுதிகள்",
    undoReturnBtn: "திருப்பியளித்தலை ரத்துசெய்",
    fromLabel: "அனுப்பியவர்:",
    toLabel: "பெறுபவர்:",
    unitsOf: "அலகுகள் மருந்து",

    // Statuses
    status_in_stock: "கையிருப்பில் உள்ளது",
    status_in_transit: "பயணத்தில் உள்ளது",
    status_awaiting_proof: "சான்று தேவை",
    status_received: "பெறப்பட்டது ✓",
    status_near_expiry: "விரைவில் காலாவதி ⚠️",
    status_return_in_transit: "திருப்பியனுப்புதல் பயணத்தில்",
    status_disposal_in_transit: "அழித்தலுக்கு செல்கிறது",
    status_fully_disposed: "முழுமையாக அழிக்கப்பட்டது ✓",
    status_completed: "முடிவுற்றது ✓",
    status_pending: "நிலுவையில்",
    status_frozen: "முடக்கப்பட்டது ❄️",

    // Sell Page
    sellPageTitle: "மருந்து விற்பனை பதிவு",
    sellPageSubtitle: "கையிருப்பை மாற்ற மருந்து QR குறியீட்டை ஸ்கேன் செய்து விற்ற அளவை உள்ளிடவும்.",
    scanMedicineQr: "மருந்து QR குறியீட்டை ஸ்கேன் செய்க",
    quantitySoldLabel: "விற்பனை செய்யப்பட்ட அளவு",
    quantitySoldPlaceholder: "எ.கா: 10",
    confirmSaleBtn: "விற்பனையை உறுதிசெய்",
    saleRecordedTitle: "விற்பனை வெற்றிகரமாக பதிவானது!",
    unitsSoldMsg: "அலகுகள் விற்கப்பட்டன:",
    remainingMsg: "அலகுகள் மீதமுள்ளன.",
    recordAnotherBtn: "மற்றொரு விற்பனை பதிவு செய்க",
    backToDashboardBtn: "டாஷ்போர்டுக்கு திரும்புக",
    lowStockNotice: "குறைந்த கையிருப்பு எச்சரிக்கை! சில அலகுகளே உள்ளன. கூடுதல் ஆர்டர் செய்யுங்கள்.",

    // Receive Page
    receivePageTitle: "வரும் மருந்துகளை பெறுக",
    receivePageSubtitle: "பெட்டி QR மற்றும் மருந்து QR குறியீடுகளை சரிபார்த்து கூரியர் சான்றை பதிவேற்றவும்.",
    pendingShipmentsList: "பெறப்பட வேண்டிய மருந்து தொகுதிகள்",
    shipmentQrLabel: "பெட்டி QR குறியீடு",
    medicineQrLabel: "மருந்து QR குறியீடு",
    receivedQtyLabel: "பெறப்பட்ட சரிபார்க்கப்பட்ட அளவு",
    proofPhotoLabel: "கையொப்பமிட்ட கூரியர் ரசீது படம்",
    confirmReceiptBtn: "இரட்டை QR சரிபார்த்து மருந்துகளை பெறுக",
    receiptSuccessTitle: "மருந்துகள் வெற்றிகரமாக பெறப்பட்டன!",
    receiptSuccessSubtitle: "கையிருப்பு புதுப்பிக்கப்பட்டு டிஜிட்டல் முறையில் பதிவு செய்யப்பட்டது.",
    viewInventoryBtn: "கையிருப்பை பார்க்க",

    // Return Page
    returnPageTitle: "காலாவதி மருந்து திருப்பியனுப்புதல்",
    returnPageSubtitle: "விநியோகஸ்தர் அல்லது உற்பத்தியாளருக்கு திரும்ப அனுப்பவும்.",
    selectBatchLabel: "திருப்பியனுப்ப வேண்டிய தொகுதியை தேர்ந்தெடுக்கவும்",
    recipientLabel: "சேருமிடம்",
    distributorOption: "விநியோகஸ்தர்",
    manufacturerOption: "உற்பத்தியாளர்",
    returnQuantityLabel: "திருப்பும் அளவு (பூட்டப்பட்டது)",
    returnReasonLabel: "காரணம் / குறிப்புகள்",
    submitReturnBtn: "திருப்பியனுப்பும் ஆவணத்தை உருவாக்கு",
    returnSuccessTitle: "திருப்பியனுப்புதல் உருவாக்கப்பட்டது!",
    returnSuccessSubtitle: "QR உருவாக்கப்பட்டது. கூரியர் சான்றை பதிவேற்றவும்.",
  },

  te: {
    // Nav
    navDashboard: "డ్యాష్‌బోర్డ్",
    navReceive: "స్టాక్ స్వీకరించు",
    navSell: "అమ్మకం నమోదు",
    navReturn: "గడువు ముగింపు వాపసు",
    retailerRole: "మందుల దుకాణం (రిటైలర్)",
    logout: "లాగ్ అవుట్",
    selectLanguage: "భాష",

    // Dashboard Header
    title: "రిటైలర్ డ్యాష్‌బోర్డ్",
    subtitle: "మందుల అమ్మకాలు, గడువు పర్యవేక్షణ మరియు వాపసుల నిర్వహణ.",
    refresh: "రిఫ్రెష్",
    receiveStockBtn: "స్టాక్ స్వీకరించు",
    recordSaleBtn: "అమ్మకం నమోదు",

    // Alert
    nearExpiryAlertTitle: "⚠️ గడువు హెచ్చరిక — బ్యాచ్‌లపై తక్షణ చర్య అవసరం!",
    daysLeftText: "రోజులు మిగిలి ఉన్నాయి!",
    initiateReturnBtn: "వాపసు ప్రారంభించండి →",

    // KPIs
    kpiInventoryItems: "మొత్తం మందులు",
    kpiTotalUnits: "మొత్తం యూనిట్లు",
    kpiNearExpiry: "గడువు సమీపంలో",
    kpiIncoming: "వస్తున్న స్టాక్",

    // Inventory Table
    currentInventory: "ప్రస్తుత నిల్వ (ఇన్వెంటరీ)",
    noInventory: "ఇన్వెంటరీ ఏదీ లేదు.",
    receiveStockLink: "స్టాక్ స్వీకరించండి",
    fromDistributor: "డిస్ట్రిబ్యూటర్ నుండి మందులను పొందండి.",
    thBatch: "బ్యాచ్ సంఖ్య",
    thMedicine: "మందు పేరు",
    thQty: "పరిమాణం",
    thExpiry: "గడువు తేదీ",
    thDaysLeft: "మిగిలిన రోజులు",
    thAction: "చర్య",
    lowStock: "తక్కువ నిల్వ!",
    returnAction: "వాపసు →",
    sellAction: "అమ్మకం →",

    // Live Alerts
    liveAlerts: "లైవ్ హెచ్చరికలు",
    noAlerts: "కొత్త హెచ్చరికలు లేవు.",

    // Incoming & Returns
    incomingTitle: "స్వీకరణ కోసం ఎదురుచూస్తున్న షిప్‌మెంట్లు",
    receiveAction: "స్వీకరించు →",
    returnShipmentsTitle: "మీరు వాపసు చేసిన షిప్‌మెంట్లు",
    undoReturnBtn: "వాపసు రద్దు చేయి",
    fromLabel: "పంపినవారు:",
    toLabel: "స్వీకరించేవారు:",
    unitsOf: "యూనిట్ల మందులు",

    // Statuses
    status_in_stock: "స్టాక్‌లో ఉంది",
    status_in_transit: "రవాణాలో ఉంది",
    status_awaiting_proof: "రుజువు అవసరం",
    status_received: "స్వీకరించబడింది ✓",
    status_near_expiry: "గడువు సమీపంలో ⚠️",
    status_return_in_transit: "వాపసు రవాణాలో",
    status_disposal_in_transit: "విసర్జన రవాణాలో",
    status_fully_disposed: "పూర్తిగా నాశనం చేయబడింది ✓",
    status_completed: "పూర్తయింది ✓",
    status_pending: "పెండింగ్‌లో ఉంది",
    status_frozen: "నిలిపివేయబడింది ❄️",

    // Sell Page
    sellPageTitle: "అమ్మకాన్ని నమోదు చేయండి",
    sellPageSubtitle: "ఇన్వెంటరీ అప్‌డేట్ చేయడానికి మందు QR కోడ్ స్కాన్ చేసి పరిమాణాన్ని నమోదు చేయండి.",
    scanMedicineQr: "మందు QR కోడ్ స్కాన్ చేయండి",
    quantitySoldLabel: "అమ్మిన పరిమాణం",
    quantitySoldPlaceholder: "ఉదా: 10",
    confirmSaleBtn: "అమ్మకాన్ని నిర్ధారించండి",
    saleRecordedTitle: "అమ్మకం విజయవంతంగా నమోదైంది!",
    unitsSoldMsg: "యూనిట్లు అమ్మబడ్డాయి:",
    remainingMsg: "యూనిట్లు మిగిలి ఉన్నాయి.",
    recordAnotherBtn: "మరో అమ్మకం నమోదు చేయండి",
    backToDashboardBtn: "డ్యాష్‌బోర్డ్‌కు వెళ్లండి",
    lowStockNotice: "తక్కువ స్టాక్ హెచ్చరిక! కొన్ని యూనిట్లు మాత్రమే మిగిలాయి. మరిన్ని ఆర్డర్ చేయండి.",

    // Receive Page
    receivePageTitle: "వస్తున్న స్టాక్‌ను స్వీకరించండి",
    receivePageSubtitle: "క్రేట్ మరియు మెడిసిన్ QR కోడ్‌లను ధృవీకరించి కొరియర్ రశీదును అప్‌లోడ్ చేయండి.",
    pendingShipmentsList: "రావలసిన మందుల షిప్‌మెంట్లు",
    shipmentQrLabel: "షిప్‌మెంట్ క్రేట్ QR కోడ్",
    medicineQrLabel: "మెడిసిన్ బాక్స్ QR కోడ్",
    receivedQtyLabel: "ధృవీకరించబడిన పరిమాణం",
    proofPhotoLabel: "సంతకం చేసిన డెలివరీ రశీదు (POD ఫోటో)",
    confirmReceiptBtn: "ద్వంద్వ QR ధృవీకరించి స్టాక్ స్వీకరించండి",
    receiptSuccessTitle: "స్టాక్ విజయవంతంగా స్వీకరించబడింది!",
    receiptSuccessSubtitle: "ఇన్వెంటరీ అప్‌డేట్ చేయబడింది మరియు రికార్డ్ భద్రపరచబడింది.",
    viewInventoryBtn: "ఇన్వెంటరీ చూడండి",

    // Return Page
    returnPageTitle: "గడువు ముగిసిన మందుల వాపసు",
    returnPageSubtitle: "డిస్ట్రిబ్యూటర్ లేదా తయారీదారుకు రివర్స్ లాజిస్టిక్స్ ద్వారా వాపసు చేయండి.",
    selectBatchLabel: "వాపసు చేయవలసిన బ్యాచ్‌ను ఎంచుకోండి",
    recipientLabel: "వాపసు గమ్యస్థానం",
    distributorOption: "డిస్ట్రిబ్యూటర్",
    manufacturerOption: "తయారీదారు",
    returnQuantityLabel: "వాపసు పరిమాణం (లాక్ చేయబడింది)",
    returnReasonLabel: "కారణం / గమనికలు",
    submitReturnBtn: "వాపసు నమోదు చేసి యూనిట్లను లాక్ చేయండి",
    returnSuccessTitle: "వాపసు షిప్‌మెంట్ రూపొందించబడింది!",
    returnSuccessSubtitle: "QR కోడ్ సిద్ధమైంది. కొరియర్ రశీదు అప్‌లోడ్ చేయండి.",
  },

  kn: {
    // Nav
    navDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    navReceive: "ಸ್ಟಾಕ್ ಸ್ವೀಕರಿಸಿ",
    navSell: "ಮಾರಾಟ ದಾಖಲಿಸಿ",
    navReturn: "ಮುಕ್ತಾಯದ ಹಿಂತಿರುಗಿಸುವಿಕೆ",
    retailerRole: "ಔಷಧಿ ವ್ಯಾಪಾರಿ (ರೀಟೇಲರ್)",
    logout: "ಲಾಗ್ ಔಟ್",
    selectLanguage: "ಭಾಷೆ",

    // Dashboard Header
    title: "ರೀಟೇಲರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    subtitle: "ಔಷಧಿಗಳ ಮಾರಾಟ, ಮುಕ್ತಾಯ ದಿನಾಂಕ ಪರಿಶೀಲನೆ ಮತ್ತು ಹಿಂತಿರುಗಿಸುವಿಕೆ ನಿರ್ವಹಣೆ.",
    refresh: "ರಿಫ್ರೆಶ್",
    receiveStockBtn: "ಸ್ಟಾಕ್ ಸ್ವೀಕರಿಸಿ",
    recordSaleBtn: "ಮಾರಾಟ ದಾಖಲಿಸಿ",

    // Alert
    nearExpiryAlertTitle: "⚠️ ಮುಕ್ತಾಯ ಎಚ್ಚರಿಕೆ — ಬ್ಯಾಚ್‌ಗಳ ಮೇಲೆ ತಕ್ಷಣ ಕ್ರಮ ಅಗತ್ಯವಿದೆ!",
    daysLeftText: "ದಿನಗಳು ಬಾಕಿ!",
    initiateReturnBtn: "ಹಿಂತಿರುಗಿಸಲು ಪ್ರಾರಂಭಿಸಿ →",

    // KPIs
    kpiInventoryItems: "ಒಟ್ಟು ಔಷಧಿಗಳು",
    kpiTotalUnits: "ಒಟ್ಟು ಯುನಿಟ್‌ಗಳು",
    kpiNearExpiry: "ಮುಕ್ತಾಯ ಸಮೀಪಿಸಿದೆ",
    kpiIncoming: "ಬರುತ್ತಿರುವ ಸ್ಟಾಕ್",

    // Inventory Table
    currentInventory: "ಪ್ರಸ್ತುತ ದಾಸ್ತಾನು (ಇನ್ವೆಂಟರಿ)",
    noInventory: "ಯಾವುದೇ ದಾಸ್ತಾನು ಇಲ್ಲ.",
    receiveStockLink: "ಸ್ಟಾಕ್ ಸ್ವೀಕರಿಸಿ",
    fromDistributor: "ವಿತರಕರಿಂದ ಔಷಧಿಗಳನ್ನು ಪಡೆಯಿರಿ.",
    thBatch: "ಬ್ಯಾಚ್ ಸಂಖ್ಯೆ",
    thMedicine: "ಔಷಧಿಯ ಹೆಸರು",
    thQty: "ಪ್ರಮಾಣ",
    thExpiry: "ಮುಕ್ತಾಯ ದಿನಾಂಕ",
    thDaysLeft: "ಉಳಿದ ದಿನಗಳು",
    thAction: "ಕ್ರಿಯೆ",
    lowStock: "ಕಡಿಮೆ ಸ್ಟಾಕ್!",
    returnAction: "ವಾಪಸ್ಸು →",
    sellAction: "ಮಾರಾಟ →",

    // Live Alerts
    liveAlerts: "ಲೈವ್ ಎಚ್ಚರಿಕೆಗಳು",
    noAlerts: "ಯಾವುದೇ ಹೊಸ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ.",

    // Incoming & Returns
    incomingTitle: "ಸ್ವೀಕಾರಕ್ಕಾಗಿ ಕಾಯುತ್ತಿರುವ ಸಾಗಣೆಗಳು",
    receiveAction: "ಸ್ವೀಕರಿಸಿ →",
    returnShipmentsTitle: "ನಿಮ್ಮ ವಾಪಸ್ಸು ಸಾಗಣೆಗಳು",
    undoReturnBtn: "ವಾಪಸ್ಸು ರದ್ದುಮಾಡಿ",
    fromLabel: "ರವಾನಿಸಿದವರು:",
    toLabel: "ಸ್ವೀಕರಿಸುವವರು:",
    unitsOf: "ಯುನಿಟ್ ಔಷಧಿ",

    // Statuses
    status_in_stock: "ದಾಸ್ತಾನಿನಲ್ಲಿದೆ",
    status_in_transit: "ದಾರಿಯಲ್ಲಿದೆ",
    status_awaiting_proof: "ಪುರಾವೆ ಅಗತ್ಯವಿದೆ",
    status_received: "ಸ್ವೀಕರಿಸಲಾಗಿದೆ ✓",
    status_near_expiry: "ಮುಕ್ತಾಯ ಸಮೀಪಿಸಿದೆ ⚠️",
    status_return_in_transit: "ಹಿಂತಿರುಗುವಿಕೆ ಸಾಗಣೆಯಲ್ಲಿದೆ",
    status_disposal_in_transit: "ನಾಶಪಡಿಸಲು ಸಾಗಣೆಯಲ್ಲಿದೆ",
    status_fully_disposed: "ಸಂಪೂರ್ಣ ನಾಶಪಡಿಸಲಾಗಿದೆ ✓",
    status_completed: "ಪೂರ್ಣಗೊಂಡಿದೆ ✓",
    status_pending: "ಬಾಕಿ ಉಳಿದಿದೆ",
    status_frozen: "ತಡೆಹಿಡಿಯಲಾಗಿದೆ ❄️",

    // Sell Page
    sellPageTitle: "ಮಾರಾಟವನ್ನು ದಾಖಲಿಸಿ",
    sellPageSubtitle: "ದಾಸ್ತಾನು ಅಪ್‌ಡೇಟ್ ಮಾಡಲು ಔಷಧಿಯ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಪ್ರಮಾಣ ನಮೂದಿಸಿ.",
    scanMedicineQr: "ಔಷಧಿ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    quantitySoldLabel: "ಮಾರಾಟವಾದ ಪ್ರಮಾಣ",
    quantitySoldPlaceholder: "ಉದಾ: 10",
    confirmSaleBtn: "ಮಾರಾಟ ಖಚಿತಪಡಿಸಿ",
    saleRecordedTitle: "ಮಾರಾಟ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ!",
    unitsSoldMsg: "ಯುನಿಟ್‌ಗಳು ಮಾರಾಟವಾಗಿವೆ:",
    remainingMsg: "ಯುನಿಟ್‌ಗಳು ಉಳಿದಿವೆ.",
    recordAnotherBtn: "ಇನ್ನೊಂದು ಮಾರಾಟ ದಾಖಲಿಸಿ",
    backToDashboardBtn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    lowStockNotice: "ಕಡಿಮೆ ಸ್ಟಾಕ್ ಎಚ್ಚರಿಕೆ! ಕೆಲವೇ ಯುನಿಟ್‌ಗಳು ಉಳಿದಿವೆ. ಹೆಚ್ಚಿನ ಆರ್ಡರ್ ಮಾಡಲು ಪರಿಗಣಿಸಿ.",

    // Receive Page
    receivePageTitle: "ಬರುತ್ತಿರುವ ಸ್ಟಾಕ್ ಸ್ವೀಕರಿಸಿ",
    receivePageSubtitle: "ಕ್ರೇಟ್ QR ಮತ್ತು ಔಷಧಿ QR ಕೋಡ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಕೊರಿಯರ್ ರಶೀದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
    pendingShipmentsList: "ಸ್ವೀಕಾರಕ್ಕೆ ಬಾಕಿ ಇರುವ ಸಾಗಣೆಗಳು",
    shipmentQrLabel: "ಸಾಗಣೆ ಕ್ರೇಟ್ QR ಕೋಡ್",
    medicineQrLabel: "ಔಷಧಿ ಬಾಕ್ಸ್ QR ಕೋಡ್",
    receivedQtyLabel: "ಪರಿಶೀಲಿಸಿದ ಪ್ರಮಾಣ",
    proofPhotoLabel: "ಸಹಿ ಮಾಡಿದ ಡೆಲಿವರಿ ರಶೀದಿ ಫೋಟೋ",
    confirmReceiptBtn: "ಎರಡೂ QR ಪರಿಶೀಲಿಸಿ ಸ್ಟಾಕ್ ಸ್ವೀಕರಿಸಿ",
    receiptSuccessTitle: "ಸ್ಟಾಕ್ ಯಶಸ್ವಿಯಾಗಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ!",
    receiptSuccessSubtitle: "ದಾಸ್ತಾನು ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ ಮತ್ತು ಡಿಜಿಟಲ್ ಲೆಡ್ಜರ್‌ನಲ್ಲಿ ದಾಖಲಾಗಿದೆ.",
    viewInventoryBtn: "ದಾಸ್ತಾನು ವೀಕ್ಷಿಸಿ",

    // Return Page
    returnPageTitle: "ಮುಕ್ತಾಯದ ಔಷಧಿ ಹಿಂತಿರುಗಿಸುವಿಕೆ",
    returnPageSubtitle: "ವಿತರಕರಿಗೆ ಅಥವಾ ಉತ್ಪಾದಕರಿಗೆ ರಿವರ್ಸ್ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮೂಲಕ ಹಿಂತಿರುಗಿಸಿ.",
    selectBatchLabel: "ಹಿಂತಿರುಗಿಸಲು ಬ್ಯಾಚ್ ಆಯ್ಕೆಮಾಡಿ",
    recipientLabel: "ಗಮ್ಯಸ್ಥಾನ",
    distributorOption: "ವಿತರಕರು",
    manufacturerOption: "ಉತ್ಪಾದಕರು",
    returnQuantityLabel: "ಹಿಂತಿರುಗಿಸುವ ಪ್ರಮಾಣ (ಲಾಕ್ ಆಗಿದೆ)",
    returnReasonLabel: "ಕಾರಣ / ಟಿಪ್ಪಣಿ",
    submitReturnBtn: "ಹಿಂತಿರುಗಿಸುವಿಕೆ ಸೃಷ್ಟಿಸಿ ಮತ್ತು ಲಾಕ್ ಮಾಡಿ",
    returnSuccessTitle: "ಹಿಂತಿರುಗಿಸುವ ಸಾಗಣೆ ಸಿದ್ಧವಾಗಿದೆ!",
    returnSuccessSubtitle: "QR ಸಿದ್ಧವಾಗಿದೆ. ಕೊರಿಯರ್ ರಶೀದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
  },

  ml: {
    // Nav
    navDashboard: "ഡാഷ്‌ബോർഡ്",
    navReceive: "മരുന്ന് സ്വീകരിക്കുക",
    navSell: "വിൽപ്പന രേഖപ്പെടുത്തുക",
    navReturn: "കാലഹരണപ്പെട്ടവ മടക്കിനൽകൽ",
    retailerRole: "റീട്ടെയിലർ (മെഡിക്കൽ ഷോപ്പ്)",
    logout: "ലോഗ് ഔട്ട്",
    selectLanguage: "ഭാഷ",

    // Dashboard Header
    title: "റീട്ടെയിലർ ഡാഷ്‌ബോർഡ്",
    subtitle: "മരുന്നുകളുടെ വിൽപന, കാലാവധി നിരീക്ഷണം, തിരിച്ചയക്കൽ കൈകാര്യം ചെയ്യൽ.",
    refresh: "റിഫ്രഷ്",
    receiveStockBtn: "മരുന്ന് സ്വീകരിക്കുക",
    recordSaleBtn: "വിൽപ്പന രേഖപ്പെടുത്തുക",

    // Alert
    nearExpiryAlertTitle: "⚠️ കാലാവധി മുന്നറിയിപ്പ് — ബാച്ചുകളിൽ അടിയന്തര നടപടി ആവശ്യമാണ്!",
    daysLeftText: "ദിവസങ്ങൾ ബാക്കി!",
    initiateReturnBtn: "തിരിച്ചയക്കാൻ തുടങ്ങുക →",

    // KPIs
    kpiInventoryItems: "ആകെ മരുന്നുകൾ",
    kpiTotalUnits: "ആകെ യൂണിറ്റുകൾ",
    kpiNearExpiry: "ഉടൻ കാലാവധി തീരുന്നവ",
    kpiIncoming: "വരുന്ന സ്റ്റോക്ക്",

    // Inventory Table
    currentInventory: "നിലവിലെ സ്റ്റോക്ക്",
    noInventory: "സ്റ്റോക്ക് ലഭ്യമല്ല.",
    receiveStockLink: "സ്റ്റോക്ക് സ്വീകരിക്കുക",
    fromDistributor: "വിതരണക്കാരിൽ നിന്ന് മരുന്നുകൾ ചേർക്കുക.",
    thBatch: "ബാച്ച് നമ്പർ",
    thMedicine: "മരുന്നിന്റെ പേര്",
    thQty: "അളവ്",
    thExpiry: "കാലാവധി തീയതി",
    thDaysLeft: "ബാക്കി ദിവസങ്ങൾ",
    thAction: "നടപടി",
    lowStock: "കുറഞ്ഞ സ്റ്റോക്ക്!",
    returnAction: "മടക്കിനൽകുക →",
    sellAction: "വിൽക്കുക →",

    // Live Alerts
    liveAlerts: "തത്സമയ മുന്നറിയിപ്പുകൾ",
    noAlerts: "പുതിയ മുന്നറിയിപ്പുകൾ ഇല്ല.",

    // Incoming & Returns
    incomingTitle: "ലഭിക്കാനായി കാത്തിരിക്കുന്ന സ്റ്റോക്കുകൾ",
    receiveAction: "സ്വീകരിക്കുക →",
    returnShipmentsTitle: "നിങ്ങൾ തിരിച്ചയച്ചവ",
    undoReturnBtn: "തിരിച്ചയക്കൽ റദ്ദാക്കുക",
    fromLabel: "അയച്ചയാൾ:",
    toLabel: "സ്വീകർത്താവ്:",
    unitsOf: "യൂണിറ്റ് മരുന്ന്",

    // Statuses
    status_in_stock: "സ്റ്റോക്കിലുണ്ട്",
    status_in_transit: "വഴിയിലാണ്",
    status_awaiting_proof: "തെളിവ് ആവശ്യമാണ്",
    status_received: "ലഭിച്ചു ✓",
    status_near_expiry: "ഉടൻ കാലാവധി തീരും ⚠️",
    status_return_in_transit: "മടക്കി അയക്കൽ വഴിയിലാണ്",
    status_disposal_in_transit: "നശിപ്പിക്കാൻ കൊണ്ടുപോകുന്നു",
    status_fully_disposed: "പൂർണ്ണമായി നശിപ്പിച്ചു ✓",
    status_completed: "പൂർത്തിയായി ✓",
    status_pending: "തീർപ്പുകൽപ്പിച്ചിട്ടില്ല",
    status_frozen: "മരവിപ്പിച്ചു ❄️",

    // Sell Page
    sellPageTitle: "വിൽപ്പന രേഖപ്പെടുത്തുക",
    sellPageSubtitle: "സ്റ്റോക്ക് പുതുക്കാൻ മരുന്നിന്റെ QR കോഡ് സ്കാൻ ചെയ്ത് വിറ്റ അളവ് നൽകുക.",
    scanMedicineQr: "മരുന്ന് QR കോഡ് സ്കാൻ ചെയ്യുക",
    quantitySoldLabel: "വിറ്റ അളവ്",
    quantitySoldPlaceholder: "ഉദാ: 10",
    confirmSaleBtn: "വിൽപ്പന സ്ഥിരീകരിക്കുക",
    saleRecordedTitle: "വിൽപ്പന വിജയകരമായി രേഖപ്പെടുത്തി!",
    unitsSoldMsg: "യൂണിറ്റുകൾ വിറ്റു:",
    remainingMsg: "യൂണിറ്റുകൾ ബാക്കിയുണ്ട്.",
    recordAnotherBtn: "മറ്റൊരു വിൽപ്പന രേഖപ്പെടുത്തുക",
    backToDashboardBtn: "ഡാഷ്‌ബോർഡിലേക്ക് മടങ്ങുക",
    lowStockNotice: "കുറഞ്ഞ സ്റ്റോക്ക് മുന്നറിയിപ്പ്! കുറച്ച് യൂണിറ്റുകൾ മാത്രമേ ശേഷിക്കുന്നുള്ളൂ.",

    // Receive Page
    receivePageTitle: "സ്റ്റോക്ക് സ്വീകരിക്കുക",
    receivePageSubtitle: "ക്രേറ്റ് QR, മരുന്ന് QR എന്നിവ പരിശോധിച്ച് കൊറിയർ രസീത് അപ്‌ലോഡ് ചെയ്യുക.",
    pendingShipmentsList: "ലഭിക്കാനുള്ള ഷിപ്പ്‌മെന്റുകൾ",
    shipmentQrLabel: "ഷിപ്പ്‌മെന്റ് ക്രേറ്റ് QR കോഡ്",
    medicineQrLabel: "മെഡിസിൻ ബോക്സ് QR കോഡ്",
    receivedQtyLabel: "ലഭിച്ച അളവ്",
    proofPhotoLabel: "ഒപ്പിട്ട ഡെലിവറി രസീത് ചിത്രം",
    confirmReceiptBtn: "രണ്ട് QR ഉം പരിശോധിച്ച് സ്റ്റോക്ക് സ്വീകരിക്കുക",
    receiptSuccessTitle: "സ്റ്റോക്ക് വിജയകരമായി സ്വീകരിച്ചു!",
    receiptSuccessSubtitle: "സ്റ്റോക്ക് വിവരങ്ങൾ പുതുക്കുകയും ഡിജിറ്റൽ ലെഡ്ജറിൽ രേഖപ്പെടുത്തുകയും ചെയ്തു.",
    viewInventoryBtn: "സ്റ്റോക്ക് കാണുക",

    // Return Page
    returnPageTitle: "കാലഹരണപ്പെട്ട മരുന്ന് തിരിച്ചയക്കൽ",
    returnPageSubtitle: "വിതരണക്കാരിലേക്കോ നിർമ്മാതാവിലേക്കോ നേരിട്ട് തിരികെ നൽകുക.",
    selectBatchLabel: "തിരിച്ചയക്കേണ്ട ബാച്ച് തിരഞ്ഞെടുക്കുക",
    recipientLabel: "ലക്ഷ്യസ്ഥാനം",
    distributorOption: "വിതരണക്കാരൻ",
    manufacturerOption: "നിർമ്മാതാവ്",
    returnQuantityLabel: "മടക്കിനൽകുന്ന അളവ് (ലോക്ക് ചെയ്‌തത്)",
    returnReasonLabel: "കാരണം / കുറിപ്പുകൾ",
    submitReturnBtn: "രേഖ തയാറാക്കി യൂണിറ്റുകൾ ലോക്ക് ചെയ്യുക",
    returnSuccessTitle: "തിരിച്ചയക്കൽ ഷിപ്പ്‌മെന്റ് തയാറായി!",
    returnSuccessSubtitle: "QR കോഡ് തയാറായി. കൊറിയർ രസീത് അപ്‌ലോഡ് ചെയ്യുക.",
  },

  mr: {
    // Nav
    navDashboard: "डॅशबोर्ड",
    navReceive: "स्टॉक स्वीकारा",
    navSell: "विक्री नोंदवा",
    navReturn: "मुदत संपलेली औषधे परत",
    retailerRole: "औषध विक्रेता (रिटेलर)",
    logout: "लॉग आऊट",
    selectLanguage: "भाषा",

    // Dashboard Header
    title: "रिटेलर डॅशबोर्ड",
    subtitle: "औषधांची विक्री, मुदत समाप्ती निरीक्षण आणि परतावा व्यवस्थापन.",
    refresh: "रिफ्रेश",
    receiveStockBtn: "स्टॉक स्वीकारा",
    recordSaleBtn: "विक्री नोंदवा",

    // Alert
    nearExpiryAlertTitle: "⚠️ मुदत समाप्ती सूचना — बॅचवर त्वरित कारवाई आवश्यक!",
    daysLeftText: "दिवस शिल्लक!",
    initiateReturnBtn: "परतावा सुरू करा →",

    // KPIs
    kpiInventoryItems: "एकूण औषधे",
    kpiTotalUnits: "एकूण युनिट्स",
    kpiNearExpiry: "मुदत संपत आलेली",
    kpiIncoming: "येणारा साठा",

    // Inventory Table
    currentInventory: "सध्याचा साठा (इन्व्हेंटरी)",
    noInventory: "कोणताही साठा उपलब्ध नाही.",
    receiveStockLink: "स्टॉक स्वीकारा",
    fromDistributor: "वितरकाकडून औषधे जोडा.",
    thBatch: "बॅच क्रमांक",
    thMedicine: "औषधाचे नाव",
    thQty: "प्रमाण",
    thExpiry: "समाप्ती तारीख",
    thDaysLeft: "उरलेले दिवस",
    thAction: "कृती",
    lowStock: "कमी साठा!",
    returnAction: "परत →",
    sellAction: "विक्री →",

    // Live Alerts
    liveAlerts: "थेट सूचना (अलर्ट्स)",
    noAlerts: "कोणत्याही नवीन सूचना नाहीत.",

    // Incoming & Returns
    incomingTitle: "स्वीकारण्याच्या प्रतीक्षेत असलेले शिपमेंट्स",
    receiveAction: "स्वीकारा →",
    returnShipmentsTitle: "आपले परतावा शिपमेंट्स",
    undoReturnBtn: "परतावा रद्द करा",
    fromLabel: "कडून:",
    toLabel: "प्रति:",
    unitsOf: "युनिट्स औषधे",

    // Statuses
    status_in_stock: "साठ्यात उपलब्ध",
    status_in_transit: "मार्गावर (ट्रान्झिट)",
    status_awaiting_proof: "पुराव्याची प्रतीक्षा",
    status_received: "प्राप्त झाले ✓",
    status_near_expiry: "मुदत संपत आलेली ⚠️",
    status_return_in_transit: "परतावा मार्गावर",
    status_disposal_in_transit: "विल्हेवाट मार्गावर",
    status_fully_disposed: "पूर्ण विल्हेवाट ✓",
    status_completed: "पूर्ण झाले ✓",
    status_pending: "प्रलंबित",
    status_frozen: "गोठवले (स्थगित) ❄️",

    // Sell Page
    sellPageTitle: "औषध विक्री नोंदवा",
    sellPageSubtitle: "साठा अद्ययावत करण्यासाठी औषधाचा QR कोड स्कॅन करा आणि विकलेले प्रमाण प्रविष्ट करा.",
    scanMedicineQr: "औषध QR कोड स्कॅन करा",
    quantitySoldLabel: "विक्रीचे प्रमाण",
    quantitySoldPlaceholder: "उदा. 10",
    confirmSaleBtn: "विक्रीची पुष्टी करा",
    saleRecordedTitle: "विक्री यशस्वीपणे नोंदवली गेली!",
    unitsSoldMsg: "युनिट्स विकली गेली:",
    remainingMsg: "युनिट्स शिल्लक आहेत.",
    recordAnotherBtn: "दुसरी विक्री नोंदवा",
    backToDashboardBtn: "डॅशबोर्डवर परत जा",
    lowStockNotice: "कमी साठा सूचना! फक्त काही युनिट्स शिल्लक आहेत.",

    // Receive Page
    receivePageTitle: "येणारा साठा स्वीकारा",
    receivePageSubtitle: "क्रेट आणि औषध QR कोड तपासा आणि कुरिअर पावती अपलोड करा.",
    pendingShipmentsList: "स्वीकारण्यासाठी प्रलंबित शिपमेंट्स",
    shipmentQrLabel: "शिपमेंट क्रेट QR कोड",
    medicineQrLabel: "औषध बॉक्स QR कोड",
    receivedQtyLabel: "पडताळणी केलेले प्रमाण",
    proofPhotoLabel: "स्वाक्षरी केलेली डिलिव्हरी पावती (POD फोटो)",
    confirmReceiptBtn: "ड्युअल QR तपासा आणि साठा स्वीकारा",
    receiptSuccessTitle: "साठा यशस्वीरित्या प्राप्त झाला!",
    receiptSuccessSubtitle: "इन्व्हेंटरी अद्यतनित झाली असून डिजिटल लेजरमध्ये नोंदवली गेली आहे.",
    viewInventoryBtn: "इन्व्हेंटरी पहा",

    // Return Page
    returnPageTitle: "मुदत संपलेली औषधे परत करा",
    returnPageSubtitle: "वितरक किंवा उत्पादकाकडे थेट रिव्हर्स लॉजिस्टिकद्वारे परतावा.",
    selectBatchLabel: "परत करण्यासाठी बॅच निवडा",
    recipientLabel: "परतावा गंतव्य",
    distributorOption: "वितरक",
    manufacturerOption: "उत्पादक",
    returnQuantityLabel: "परतावा प्रमाण (लॉक केलेले)",
    returnReasonLabel: "परताव्याचे कारण / टिप्पणी",
    submitReturnBtn: "परतावा दस्तऐवज तयार करा",
    returnSuccessTitle: "परतावा शिपमेंट तयार झाले!",
    returnSuccessSubtitle: "QR कोड तयार आहे. कृपया कुरिअर पावती अपलोड करा.",
  },

  bn: {
    // Nav
    navDashboard: "ড্যাশবোর্ড",
    navReceive: "স্টক গ্রহণ",
    navSell: "বিক্রি রেকর্ড",
    navReturn: "মেয়াদোত্তীর্ণ ফেরত",
    retailerRole: "ঔষধ বিক্রেতা (রিটেইলার)",
    logout: "লগ আউট",
    selectLanguage: "ভাষা",

    // Dashboard Header
    title: "রিটেইলার ড্যাশবোর্ড",
    subtitle: "ঔষধ বিক্রি, মেয়াদ পর্যবেক্ষণ এবং ফেরত ব্যবস্থাপনা।",
    refresh: "রিফ্রেশ",
    receiveStockBtn: "স্টক গ্রহণ",
    recordSaleBtn: "বিক্রি রেকর্ড",

    // Alert
    nearExpiryAlertTitle: "⚠️ মেয়াদ সতর্কতা — ব্যাচে অবিলম্বে ব্যবস্থা নেওয়া প্রয়োজন!",
    daysLeftText: "দিন বাকি!",
    initiateReturnBtn: "ফেরত শুরু করুন →",

    // KPIs
    kpiInventoryItems: "মোট ঔষধ সামগ্রী",
    kpiTotalUnits: "মোট ইউনিট",
    kpiNearExpiry: "মেয়াদ শেষের পথে",
    kpiIncoming: "আসন্ন চালান",

    // Inventory Table
    currentInventory: "বর্তমান স্টক (ইনভেন্টরি)",
    noInventory: "কোনো স্টক নেই।",
    receiveStockLink: "স্টক গ্রহণ করুন",
    fromDistributor: "ডিস্ট্রিবিউটরের কাছ থেকে ঔষধ সংগ্রহ করুন।",
    thBatch: "ব্যাচ নম্বর",
    thMedicine: "ঔষধের নাম",
    thQty: "পরিমাণ",
    thExpiry: "মেয়াদোত্তীর্ণের তারিখ",
    thDaysLeft: "বাকি দিন",
    thAction: "পদক্ষেপ",
    lowStock: "স্টক কম!",
    returnAction: "ফেরত →",
    sellAction: "বিক্রি →",

    // Live Alerts
    liveAlerts: "সরাসরি সতর্কতা",
    noAlerts: "কোনো নতুন সতর্কতা নেই।",

    // Incoming & Returns
    incomingTitle: "গ্রহণের অপেক্ষায় থাকা চালান",
    receiveAction: "গ্রহণ করুন →",
    returnShipmentsTitle: "আপনার ফেরত পাঠানো চালান",
    undoReturnBtn: "ফেরত বাতিল করুন",
    fromLabel: "প্রেরক:",
    toLabel: "প্রাপক:",
    unitsOf: "ইউনিট ঔষধ",

    // Statuses
    status_in_stock: "স্টকে আছে",
    status_in_transit: "পথে আছে",
    status_awaiting_proof: "প্রমাণ অপেক্ষমান",
    status_received: "গৃহীত হয়েছে ✓",
    status_near_expiry: "মেয়াদ শেষের পথে ⚠️",
    status_return_in_transit: "ফেরত পথে আছে",
    status_disposal_in_transit: "বিনষ্ট করার পথে",
    status_fully_disposed: "সম্পূর্ণ বিনষ্ট ✓",
    status_completed: "সম্পন্ন ✓",
    status_pending: "অপেক্ষমান",
    status_frozen: "স্থগিত ❄️",

    // Sell Page
    sellPageTitle: "বিক্রি রেকর্ড করুন",
    sellPageSubtitle: "স্টক আপডেট করতে ঔষধের QR কোড স্ক্যান করুন এবং বিক্রির পরিমাণ লিখুন।",
    scanMedicineQr: "ঔষধের QR কোড স্ক্যান করুন",
    quantitySoldLabel: "বিক্রির পরিমাণ",
    quantitySoldPlaceholder: "যেমন: ১০",
    confirmSaleBtn: "বিক্রি নিশ্চিত করুন",
    saleRecordedTitle: "বিক্রি সফলভাবে রেকর্ড হয়েছে!",
    unitsSoldMsg: "ইউনিট বিক্রি হয়েছে:",
    remainingMsg: "ইউনিট অবশিষ্ট আছে।",
    recordAnotherBtn: "অন্য বিক্রি রেকর্ড করুন",
    backToDashboardBtn: "ড্যাশবোর্ডে ফিরে যান",
    lowStockNotice: "কম স্টক সতর্কতা! মাত্র কয়েকটি ইউনিট বাকি আছে।",

    // Receive Page
    receivePageTitle: "ইনকামিং স্টক গ্রহণ করুন",
    receivePageSubtitle: "ক্রেট QR এবং ঔষধ QR কোড যাচাই করুন এবং কুরিয়ার রসিদ আপলোড করুন।",
    pendingShipmentsList: "গ্রহণের অপেক্ষায় থাকা চালান",
    shipmentQrLabel: "চালান ক্রেট QR কোড",
    medicineQrLabel: "ঔষধ বক্স QR কোড",
    receivedQtyLabel: "যাচাইকৃত প্রাপ্ত পরিমাণ",
    proofPhotoLabel: "স্বাক্ষরিত ডেলিভারি রসিদ (POD ছবি)",
    confirmReceiptBtn: "ডুয়াল QR যাচাই করে স্টক গ্রহণ করুন",
    receiptSuccessTitle: "স্টক সফলভাবে গৃহীত হয়েছে!",
    receiptSuccessSubtitle: "ইনভেন্টরি আপডেট হয়েছে এবং ডিজিটাল লেজারে নথিবদ্ধ হয়েছে।",
    viewInventoryBtn: "ইনভেন্টরি দেখুন",

    // Return Page
    returnPageTitle: "মেয়াদোত্তীর্ণ ঔষধ ফেরত",
    returnPageSubtitle: "ডিস্ট্রিবিউটর বা উৎপাদনকারীর কাছে সরাসরি রিভার্স লজিস্টিক ফেরত।",
    selectBatchLabel: "ফেরত দেওয়ার জন্য ব্যাচ নির্বাচন করুন",
    recipientLabel: "ফেরত গন্তব্য",
    distributorOption: "ডিস্ট্রিবিউটর",
    manufacturerOption: "উৎপাদনকারী",
    returnQuantityLabel: "ফেরতের পরিমাণ (লক করা)",
    returnReasonLabel: "ফেরতের কারণ / মন্তব্য",
    submitReturnBtn: "ফেরত তালিকা তৈরি করুন",
    returnSuccessTitle: "ফেরত চালান তৈরি হয়েছে!",
    returnSuccessSubtitle: "QR প্রস্তুত। কুরিয়ার রসিদ আপলোড করুন।",
  },

  gu: {
    // Nav
    navDashboard: "ડેશબોર્ડ",
    navReceive: "સ્ટોક મેળવો",
    navSell: "વેચાણ નોંધો",
    navReturn: "મુદત વીતેલી દવા પરત",
    retailerRole: "દવા વિક્રેતા (રિટેલર)",
    logout: "લૉગ આઉટ",
    selectLanguage: "ભાષા",

    // Dashboard Header
    title: "રિટેલર ડેશબોર્ડ",
    subtitle: "દવાઓનું વેચાણ, એક્સપાયરી તારીખનું નિરીક્ષણ અને પરત વ્યવસ્થાપન.",
    refresh: "રીફ્રેશ",
    receiveStockBtn: "સ્ટોક મેળવો",
    recordSaleBtn: "વેચાણ નોંધો",

    // Alert
    nearExpiryAlertTitle: "⚠️ એક્સપાયરી એલર્ટ — બેચ પર તાત્કાલિક પગલાં જરૂરી!",
    daysLeftText: "દિવસ બાકી!",
    initiateReturnBtn: "પરત કરવાનું શરૂ કરો →",

    // KPIs
    kpiInventoryItems: "કુલ દવાઓ",
    kpiTotalUnits: "કુલ યુનિટ્સ",
    kpiNearExpiry: "મુદત નજીક છે",
    kpiIncoming: "આવતો સ્ટોક",

    // Inventory Table
    currentInventory: "હાલનો સ્ટોક (ઇન્વેન્ટરી)",
    noInventory: "કોઈ સ્ટોક ઉપલબ્ધ નથી.",
    receiveStockLink: "સ્ટોક મેળવો",
    fromDistributor: "વિતરક પાસેથી દવાઓ ઉમેરો.",
    thBatch: "બેચ નંબર",
    thMedicine: "દવાનું નામ",
    thQty: "જથ્થો (યુનિટ)",
    thExpiry: "એક્સપાયરી તારીખ",
    thDaysLeft: "બાકી દિવસો",
    thAction: "ક્રિયા",
    lowStock: "ઓછો સ્ટોક!",
    returnAction: "પરત →",
    sellAction: "વેચાણ →",

    // Live Alerts
    liveAlerts: "લાઇવ ચેતવણીઓ",
    noAlerts: "કોઈ નવી ચેતવણી નથી.",

    // Incoming & Returns
    incomingTitle: "મેળવવા માટે બાકી શિપમેન્ટ્સ",
    receiveAction: "મેળવો →",
    returnShipmentsTitle: "તમારા પરત કરેલા શિપમેન્ટ્સ",
    undoReturnBtn: "પરત રદ કરો",
    fromLabel: "તરફથી:",
    toLabel: "પ્રતિ:",
    unitsOf: "યુનિટ્સ દવા",

    // Statuses
    status_in_stock: "સ્ટોકમાં ઉપલબ્ધ",
    status_in_transit: "રસ્તામાં છે (ટ્રાન્ઝિટ)",
    status_awaiting_proof: "પુરાવા બાકી",
    status_received: "મળેલ છે ✓",
    status_near_expiry: "મુદત નજીક છે ⚠️",
    status_return_in_transit: "પરત રસ્તામાં છે",
    status_disposal_in_transit: "નિકાલ રસ્તામાં છે",
    status_fully_disposed: "સંપૂર્ણ નિકાલ થયેલ ✓",
    status_completed: "પૂર્ણ થયેલ ✓",
    status_pending: "બાકી",
    status_frozen: "સ્થગિત કરેલ ❄️",

    // Sell Page
    sellPageTitle: "દવાનું વેચાણ નોંધો",
    sellPageSubtitle: "સ્ટોક અપડેટ કરવા માટે દવાનો QR કોડ સ્કેન કરો અને વેચાયેલ જથ્થો દાખલ કરો.",
    scanMedicineQr: "દવા QR કોડ સ્કેન કરો",
    quantitySoldLabel: "વેચાયેલ જથ્થો",
    quantitySoldPlaceholder: "દા.ત. 10",
    confirmSaleBtn: "વેચાણની પુષ્ટિ કરો",
    saleRecordedTitle: "વેચાણ સફળતાપૂર્વક નોંધાયું!",
    unitsSoldMsg: "યુનિટ્સ વેચાયા:",
    remainingMsg: "યુનિટ્સ બાકી છે.",
    recordAnotherBtn: "બીજું વેચાણ નોંધો",
    backToDashboardBtn: "ડેશબોર્ડ પર પાછા જાઓ",
    lowStockNotice: "ઓછા સ્ટોકની ચેતવણી! માત્ર થોડા જ યુનિટ્સ બાકી છે. નવો ઓર્ડર કરો.",

    // Receive Page
    receivePageTitle: "આવતો સ્ટોક મેળવો",
    receivePageSubtitle: "ક્રેટ QR અને દવા QR ચકાસો અને કુરિયર રસીદ અપલોડ કરો.",
    pendingShipmentsList: "મેળવવા માટે પેન્ડિંગ શિપમેન્ટ્સ",
    shipmentQrLabel: "શિપમેન્ટ ક્રેટ QR કોડ",
    medicineQrLabel: "દવા બોક્સ QR કોડ",
    receivedQtyLabel: "ચકાસાયેલ જથ્થો",
    proofPhotoLabel: "સહી કરેલ ડિલિવરી રસીદ (POD ફોટો)",
    confirmReceiptBtn: "ડ્યુઅલ QR ચકાસો અને સ્ટોક મેળવો",
    receiptSuccessTitle: "સ્ટોક સફળતાપૂર્વક મેળવાયો!",
    receiptSuccessSubtitle: "ઇન્વેન્ટરી અપડેટ થઈ અને ડિજિટલ લેજરમાં નોંધાઈ ગઈ છે.",
    viewInventoryBtn: "ઇન્વેન્ટરી જુઓ",

    // Return Page
    returnPageTitle: "મુદત વીતેલી દવા પરત કરો",
    returnPageSubtitle: "વિતરક અથવા ઉત્પાદકને સીધી રિવર્સ લૉજિસ્ટિક્સ દ્વારા પરત.",
    selectBatchLabel: "પરત કરવા માટે બેચ પસંદ કરો",
    recipientLabel: "પરત ગંતવ્ય",
    distributorOption: "વિતરક (ડિસ્ટ્રીબ્યુટર)",
    manufacturerOption: "ઉત્પાદક (મેન્યુફેક્ચરર)",
    returnQuantityLabel: "પરત જથ્થો (લૉક કરેલ)",
    returnReasonLabel: "પરત કરવાનું કારણ / નોંધ",
    submitReturnBtn: "પરત દસ્તાવેજ બનાવો અને યુનિટ્સ લૉક કરો",
    returnSuccessTitle: "પરત શિપમેન્ટ તૈયાર થયું!",
    returnSuccessSubtitle: "QR કોડ તૈયાર છે. કૃપા કરીને કુરિયર રસીદ અપલોડ કરો.",
  }
};
