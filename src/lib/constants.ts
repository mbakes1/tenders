// Filter options for provinces and industries
export const PROVINCES = [
  "All Provinces",
  "Eastern Cape", 
  "Free State", 
  "Gauteng",
  "KwaZulu-Natal", 
  "Limpopo", 
  "Mpumalanga", 
  "Northern Cape", 
  "North West",
  "Western Cape"
];

export const INDUSTRIES = [
  "All Industries",
  "Information Technology",
  "Construction & Infrastructure", 
  "Consulting Services",
  "Marketing & Communications",
  "Health & Medical",
  "Security Services",
  "Education & Training",
  "Financial Services",
  "Transportation & Logistics",
  "Energy & Utilities",
  "Agriculture & Food",
  "Manufacturing",
  "Legal Services",
  "Other"
];

// Province mapping for data enrichment
export const PROVINCE_KEYWORDS = {
  'Eastern Cape': ['eastern cape', 'ec', 'port elizabeth', 'east london', 'grahamstown', 'mthatha'],
  'Free State': ['free state', 'fs', 'bloemfontein', 'welkom', 'kroonstad'],
  'Gauteng': ['gauteng', 'gp', 'johannesburg', 'pretoria', 'soweto', 'sandton', 'midrand', 'centurion'],
  'KwaZulu-Natal': ['kwazulu-natal', 'kzn', 'durban', 'pietermaritzburg', 'newcastle', 'richards bay'],
  'Limpopo': ['limpopo', 'lp', 'polokwane', 'tzaneen', 'thohoyandou'],
  'Mpumalanga': ['mpumalanga', 'mp', 'nelspruit', 'witbank', 'secunda', 'emalahleni'],
  'Northern Cape': ['northern cape', 'nc', 'kimberley', 'upington', 'springbok'],
  'North West': ['north west', 'nw', 'mafikeng', 'potchefstroom', 'klerksdorp', 'rustenburg'],
  'Western Cape': ['western cape', 'wc', 'cape town', 'stellenbosch', 'paarl', 'george', 'worcester']
};

// Industry keywords for categorization
export const INDUSTRY_KEYWORDS = {
  'Information Technology': [
    'it', 'software', 'hardware', 'ict', 'information technology', 'website', 'development',
    'computer', 'system', 'network', 'database', 'programming', 'digital', 'cyber', 'cloud',
    'server', 'application', 'mobile app', 'web development', 'data management'
  ],
  'Construction & Infrastructure': [
    'construction', 'building', 'civil', 'roads', 'infrastructure', 'maintenance',
    'renovation', 'repair', 'plumbing', 'electrical', 'roofing', 'painting',
    'concrete', 'steel', 'bridge', 'highway', 'municipal infrastructure'
  ],
  'Consulting Services': [
    'consulting', 'advisory', 'professional services', 'facilitation', 'strategy',
    'management consulting', 'business consulting', 'technical consulting',
    'project management', 'change management', 'organizational development'
  ],
  'Marketing & Communications': [
    'marketing', 'advertising', 'communication', 'media', 'brand', 'public relations',
    'social media', 'graphic design', 'printing', 'promotional', 'campaign',
    'corporate communications', 'event management'
  ],
  'Health & Medical': [
    'health', 'medical', 'hospital', 'pharmaceutical', 'ppe', 'healthcare',
    'clinic', 'nursing', 'medical equipment', 'laboratory', 'dental',
    'mental health', 'public health', 'medical supplies'
  ],
  'Security Services': [
    'security', 'guarding', 'cctv', 'alarm', 'surveillance', 'access control',
    'security systems', 'patrol', 'monitoring', 'safety', 'protection'
  ],
  'Education & Training': [
    'education', 'training', 'learning', 'school', 'university', 'college',
    'workshop', 'course', 'curriculum', 'teaching', 'academic', 'skills development',
    'capacity building', 'educational services'
  ],
  'Financial Services': [
    'financial', 'banking', 'insurance', 'accounting', 'audit', 'tax',
    'bookkeeping', 'payroll', 'financial management', 'investment',
    'treasury', 'risk management'
  ],
  'Transportation & Logistics': [
    'transport', 'logistics', 'delivery', 'freight', 'shipping', 'courier',
    'vehicle', 'fleet', 'distribution', 'supply chain', 'warehousing'
  ],
  'Energy & Utilities': [
    'energy', 'electricity', 'power', 'solar', 'renewable', 'utilities',
    'water', 'gas', 'fuel', 'generator', 'electrical services'
  ],
  'Agriculture & Food': [
    'agriculture', 'farming', 'food', 'catering', 'agricultural', 'livestock',
    'crops', 'irrigation', 'food services', 'nutrition', 'agricultural equipment'
  ],
  'Manufacturing': [
    'manufacturing', 'production', 'factory', 'industrial', 'machinery',
    'equipment', 'tools', 'fabrication', 'assembly'
  ],
  'Legal Services': [
    'legal', 'law', 'attorney', 'lawyer', 'litigation', 'compliance',
    'regulatory', 'legal advice', 'contract', 'legal services'
  ]
};