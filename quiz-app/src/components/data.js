const BD_DIVISIONS = {
  "Barishal": ["Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"],
  "Chattogram": ["Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cumilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"],
  "Dhaka": ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
  "Khulna": ["Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"],
  "Mymensingh": ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
  "Rajshahi": ["Bogra", "Chapai Nawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna", "Rajshahi", "Sirajganj"],
  "Rangpur": ["Dinajpur", "Gaibandha", "Kurigram", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"],
  "Sylhet": ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"]
};

const MCQUIZ_DATA = {
  "user": {
    "name": "Ariful Islam",
    "avatar": "AI",
    "rank": 142,
    "totalQuizzes": 12,
    "totalCorrect": 1840,
    "accuracy": 92,
    "purchasedMagazines": [1, 2],
    "quizHistory": [
      { "month": "March 2026", "score": 195, "correct": 195, "total": 200, "rank": 42 },
      { "month": "February 2026", "score": 182, "correct": 182, "total": 200, "rank": 128 },
      { "month": "January 2026", "score": 175, "correct": 175, "total": 200, "rank": 215 }
    ]
  },
  "quizDeadline": "2026-04-30",
  "resultAnnounceDate": "May 5, 2026",
  "telegramLink": "https://t.me/MCQuizBD",
  "magazines": [
    {
      "id": 1,
      "name": "MCQuiz April 2026 — General Knowledge & Current Affairs",
      "month": "April 2026",
      "pages": 48,
      "color": "#7C6FFF",
      "featured": true,
      "topics": ["BCS 47th Special", "Bank Job Digest", "Monthly International", "Bangladesh Affairs"]
    },
    {
      "id": 2,
      "name": "MCQuiz March 2026 — BCS Special",
      "month": "March 2026",
      "pages": 52,
      "color": "#10B981",
      "featured": false,
      "topics": ["Science & Tech", "Geography", "Constitution", "Modern History"]
    },
    {
      "id": 3,
      "name": "MCQuiz February 2026 — Current Affairs Extra",
      "month": "February 2026",
      "pages": 44,
      "color": "#D4A843",
      "featured": false,
      "topics": ["Sports", "Digital Economy", "International Summits", "Awards"]
    }
  ],
  "leaderboard": [
    { "rank": 1, "name": "Ariful Islam", "avatar": "AI", "score": 198, "district": "Dhaka", "prize": "৳ ১৫,০০০" },
    { "rank": 2, "name": "Nusrat Jahan", "avatar": "NJ", "score": 195, "district": "Chattogram", "prize": "৳ ৫,০০০" },
    { "rank": 3, "name": "Sabbir Ahmed", "avatar": "SA", "score": 192, "district": "Sylhet", "prize": "৳ ১,০০০" },
    { "rank": 4, "name": "Farhana Yasmin", "avatar": "FY", "score": 189, "district": "Rajshahi", "prize": "৳ ১,০০০" },
    { "rank": 5, "name": "Mehedi Hasan", "avatar": "MH", "score": 187, "district": "Khulna", "prize": "৳ ১,০০০" },
    { "rank": 6, "name": "Tanzina Akter", "avatar": "TA", "score": 185, "district": "Dhaka", "prize": "৳ ১,০০০" },
    { "rank": 7, "name": "Kamrul Islam", "avatar": "KI", "score": 184, "district": "Cumilla", "prize": "৳ ১,০০০" },
    { "rank": 8, "name": "Sadia Afrin", "avatar": "SA", "score": 182, "district": "Barishal", "prize": "৳ ১,০০০" },
    { "rank": 9, "name": "Rakibul Hasan", "avatar": "RH", "score": 180, "district": "Bogura", "prize": "৳ ১,০০০" },
    { "rank": 10, "name": "Jannatul Ferdous", "avatar": "JF", "score": 178, "district": "Noakhali", "prize": "৳ ১,০০০" }
  ],
  "quizQuestions": [
    {
      "id": 1,
      "category": "Bangladesh",
      "question": "The historic 7th March speech was delivered at which place?",
      "options": ["Suhrawardy Udyan", "Paltan Maidan", "Shahbag", "Ramna Park"],
      "correct": 0
    },
    {
      "id": 2,
      "category": "International",
      "question": "Which country is known as the 'Land of the Midnight Sun'?",
      "options": ["Japan", "Norway", "Finland", "Sweden"],
      "correct": 1
    },
    {
      "id": 3,
      "category": "Science",
      "question": "What is the chemical symbol for Gold?",
      "options": ["Ag", "Fe", "Au", "Pb"],
      "correct": 2
    }
  ]
};

export { BD_DIVISIONS, MCQUIZ_DATA };
