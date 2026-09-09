// KisanSetu Mock Data & Initial State

const INITIAL_DATA = {
  farmer: {
    id: "KS-F10293",
    name: "Ramesh Kumar",
    nameHi: "रमेश कुमार",
    nameAs: "ৰমেশ কুমাৰ",
    phone: "+91 98765 43210",
    village: "Sonapur",
    district: "Kamrup Metropolitan",
    state: "Assam",
    aadhaar: "XXXX-XXXX-8921",
    landArea: "4.5 Acres",
    bankAccount: "State Bank of India (****8912)",
    ifsc: "SBIN0001234"
  },
  
  crops: [
    { id: "paddy", name: "Paddy (Dhan - Grade A)", msp: 2300, unit: "Quintal", icon: "🌾", category: "Kharif" },
    { id: "wheat", name: "Wheat (Gehu)", msp: 2275, unit: "Quintal", icon: "🌾", category: "Rabi" },
    { id: "maize", name: "Maize (Makka)", msp: 2090, unit: "Quintal", icon: "🌽", category: "Kharif" },
    { id: "mustard", name: "Mustard (Sarson)", msp: 5650, unit: "Quintal", icon: "🌱", category: "Rabi" },
    { id: "pulses", name: "Gram / Pulses (Chana)", msp: 5440, unit: "Quintal", icon: "🫘", category: "Rabi" }
  ],

  centres: [
    {
      id: "C01",
      name: "XYZ Procurement Centre (Kamrup Central Hub)",
      code: "KMR-PPC-01",
      address: "NH-37, Near APMC Market, Sonapur, Kamrup",
      distanceKm: 4.2,
      lat: 26.1158,
      lng: 91.9825,
      activeCounters: 3,
      avgProcessingMin: 7.4,
      queueCount: 18,
      estimatedWaitMin: 28,
      capacityPercent: 62,
      todayBookings: 120,
      status: "Available",
      statusBadge: "Normal",
      recommended: true,
      officer: "Biraj Kalita (Procurement Manager)"
    },
    {
      id: "C02",
      name: "ABC Procurement Mandi (Guwahati East)",
      code: "GHY-PPC-02",
      address: "State Warehousing Complex, Dispur, Guwahati",
      distanceKm: 7.1,
      lat: 26.1445,
      lng: 91.7968,
      activeCounters: 4,
      avgProcessingMin: 8.5,
      queueCount: 43,
      estimatedWaitMin: 85,
      capacityPercent: 87,
      todayBookings: 210,
      status: "High demand",
      statusBadge: "High",
      recommended: false,
      officer: "Sunil Sharma"
    },
    {
      id: "C03",
      name: "Green Valley Agri Co-op Mandi",
      code: "GV-PPC-03",
      address: "Khetri Main Road, Kamrup East",
      distanceKm: 11.5,
      lat: 26.1280,
      lng: 92.0712,
      activeCounters: 2,
      avgProcessingMin: 6.0,
      queueCount: 12,
      estimatedWaitMin: 18,
      capacityPercent: 45,
      todayBookings: 65,
      status: "Available",
      statusBadge: "Low",
      recommended: false,
      officer: "Pankaj Gogoi"
    },
    {
      id: "C04",
      name: "Nagaon Highway Procurement Hub",
      code: "NGN-PPC-04",
      address: "Jaha Road, Raha, Nagaon",
      distanceKm: 24.0,
      lat: 26.2300,
      lng: 92.5200,
      activeCounters: 5,
      avgProcessingMin: 7.0,
      queueCount: 31,
      estimatedWaitMin: 52,
      capacityPercent: 79,
      todayBookings: 185,
      status: "Moderate",
      statusBadge: "Moderate",
      recommended: false,
      officer: "Animesh Das"
    }
  ],

  activeBooking: {
    id: "BKG-2026-9012",
    token: "A107",
    crop: "Paddy (Dhan - Grade A)",
    cropId: "paddy",
    quantityQuintals: 32,
    centreId: "C01",
    centreName: "XYZ Procurement Centre (Kamrup Central Hub)",
    date: "10 September 2026",
    timeSlot: "10:30 AM – 11:30 AM",
    arrivalWindow: "10:15 AM – 10:45 AM",
    status: "Confirmed",
    queuePosition: 5,
    estimatedWaitMin: 24,
    createdDate: "05 Sep 2026"
  },

  liveQueueList: [
    { token: "A102", farmerName: "Harish Pathak", status: "Serving", counter: "Counter 1", estWait: "Now" },
    { token: "A103", farmerName: "Mohan Lal", status: "Completed", counter: "Counter 2", estWait: "Done" },
    { token: "A104", farmerName: "Biraj Kalita", status: "Completed", counter: "Counter 1", estWait: "Done" },
    { token: "A105", farmerName: "Pranab Saikia", status: "Waiting", counter: "-", estWait: "8 mins" },
    { token: "A106", farmerName: "Dinesh Mahanta", status: "Waiting", counter: "-", estWait: "16 mins" },
    { token: "A107", farmerName: "Ramesh Kumar (YOU)", status: "YOU", counter: "-", estWait: "24 mins", isUser: true },
    { token: "A108", farmerName: "Bhabesh Talukdar", status: "Waiting", counter: "-", estWait: "32 mins" },
    { token: "A109", farmerName: "Nabin Baruah", status: "Waiting", counter: "-", estWait: "40 mins" }
  ],

  procurementProgress: {
    token: "A107",
    procurementId: "PRC10293",
    currentStep: 4, // 0: Booked, 1: CheckedIn, 2: Verification, 3: Weighing, 4: Quality, 5: Procured, 6: PayProcessing, 7: PayCompleted
    steps: [
      { id: 0, title: "Slot Booked", time: "05 Sep, 02:30 PM", done: true },
      { id: 1, title: "Farmer Checked In", time: "10 Sep, 10:18 AM", done: true },
      { id: 2, title: "Verification Complete", time: "10 Sep, 10:28 AM", done: true },
      { id: 3, title: "Weighing Complete", time: "10 Sep, 10:45 AM", done: true },
      { id: 4, title: "Quality Check", time: "In Progress", done: false, active: true },
      { id: 5, title: "Procurement Completed", time: "Pending", done: false },
      { id: 6, title: "Payment Processing", time: "Pending", done: false },
      { id: 7, title: "Payment Completed", time: "Pending", done: false }
    ],
    declaredQty: 32.0,
    actualQty: 31.8,
    moistureContent: "13.2%",
    qualityGrade: "Grade A",
    mspRate: 2300,
    grossAmount: 73140,
    deductions: 0,
    netAmount: 73140
  },

  paymentDetails: {
    procurementId: "PRC10293",
    txnId: "TXN82931-DBT",
    amount: 73140,
    status: "Processing",
    bankName: "State Bank of India",
    accountNo: "****8912",
    ifsc: "SBIN0001234",
    updatedAt: "10 Sep 2026, 11:20 AM",
    timeline: [
      { title: "Procurement Completed", time: "10 Sep, 10:55 AM", done: true },
      { title: "Payment Request Created", time: "10 Sep, 11:05 AM", done: true },
      { title: "Direct Benefit Transfer (DBT) Validation", time: "10 Sep, 11:20 AM", done: false, active: true },
      { title: "Credit to Bank Account", time: "Est. within 24 hrs", done: false }
    ]
  },

  history: [
    { id: "HIS-001", date: "10 Sep 2026", crop: "Paddy (Grade A)", centre: "XYZ Procurement Centre", qty: "31.8 Q", amount: 73140, status: "Processing", receiptNo: "REC-2026-901" },
    { id: "HIS-002", date: "21 Aug 2026", crop: "Paddy (Grade A)", centre: "XYZ Procurement Centre", qty: "28.0 Q", amount: 64400, status: "Paid", receiptNo: "REC-2026-842" },
    { id: "HIS-003", date: "05 Aug 2026", crop: "Maize (Makka)", centre: "ABC Procurement Mandi", qty: "15.0 Q", amount: 31350, status: "Paid", receiptNo: "REC-2026-711" },
    { id: "HIS-004", date: "14 Mar 2026", crop: "Wheat (Gehu)", centre: "Green Valley Mandi", qty: "40.0 Q", amount: 91000, status: "Paid", receiptNo: "REC-2026-309" },
    { id: "HIS-005", date: "18 Nov 2025", crop: "Mustard (Sarson)", centre: "XYZ Procurement Centre", qty: "12.5 Q", amount: 70625, status: "Paid", receiptNo: "REC-2025-112" }
  ],

  notifications: [
    { id: "N1", title: "Slot Confirmed", message: "Your slot at XYZ Procurement Centre is confirmed for 10:30 AM on 10 Sep 2026.", type: "Booking", category: "booking", time: "10 mins ago", read: false },
    { id: "N2", title: "Queue Update", message: "You are now 5 positions away from your turn. Please prepare your produce at Counter 1.", type: "Queue", category: "queue", time: "25 mins ago", read: false },
    { id: "N3", title: "Quality Check", message: "Your produce has successfully completed quality verification (Grade A).", type: "Procurement", category: "procurement", time: "1 hour ago", read: true },
    { id: "N4", title: "Payment Initiated", message: "Payment of ₹73,140 is currently being processed via Direct Benefit Transfer (DBT).", type: "Payment", category: "payment", time: "2 hours ago", read: true },
    { id: "N5", title: "Mandi Guidelines", message: "Government MSP for Paddy Grade A updated to ₹2,300/Quintal for Kharif Marketing Season 2026-27.", type: "System", category: "system", time: "1 day ago", read: true }
  ],

  adminStats: {
    registeredFarmers: 12482,
    activeCentres: 48,
    todayBookings: 1284,
    currentlyWaiting: 237,
    avgWaitMin: 34,
    completedProcurement: 842,
    pendingPayments: 126,
    totalProcurementValue: "₹6.48 Cr"
  }
};
