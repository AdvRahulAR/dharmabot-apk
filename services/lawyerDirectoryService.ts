import { LawyerProfile, ServiceArea } from '../types';

const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

const mockLawyers: LawyerProfile[] = [
  {
    id: generateUUID(),
    name: 'Rahul A R',
    practiceAreas: [ServiceArea.CONSUMER_LAW, ServiceArea.CYBER_LAW, ServiceArea.ACCIDENT_LAW],
    city: 'Changanacherry',
    state: 'Kerala',
    email: 'advrahular@gmail.com',
    phone: '8137857655',
    bio: 'Specializing in Consumer Law, Cyber Law, and Accident cases.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Akshainath K R',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.CONSUMER_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS],
    city: 'Thrissur',
    state: 'Kerala',
    email: 'akshainathkr@gmail.com',
    phone: '9495982728',
    bio: 'Experienced in Civil, Criminal, Family, Consumer, and Motor Accident Claims.',
    experienceYears: 7
  },
  {
    id: generateUUID(),
    name: 'Mujeeb Rehuman',
    practiceAreas: [ServiceArea.FAMILY_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.CIVIL_LAW],
    city: 'Mavelikara',
    state: 'Kerala',
    email: 'adv.mujeebrehman@gmail.com',
    phone: '9447503022',
    bio: 'Specializing in Family, Criminal, and Civil matters.',
    experienceYears: 8
  },
  {
    id: generateUUID(),
    name: 'Ayswarya Krishnan',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.INSURANCE_LAW],
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    email: 'advayswaryakrishnanofficial@gmail.com',
    phone: '8078276609',
    bio: 'Expert in Civil, Criminal, Family, MACT, and Health Insurance matters.',
    experienceYears: 6
  },
  {
    id: generateUUID(),
    name: 'AJAYKRISHNAN R',
    practiceAreas: [ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS],
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    email: 'adv.ajaykrishnanr@gmail.com',
    phone: '7356981560',
    bio: 'Specialized in Criminal and Family Law matters.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Lakshmi V S',
    practiceAreas: [ServiceArea.SERVICE_LAW],
    city: 'Ernakulam',
    state: 'Kerala',
    email: 'lachsanthosh1898@gmail.com',
    phone: '9605530081',
    bio: 'Specialized in Service Matters.',
    experienceYears: 4
  },
  {
    id: generateUUID(),
    name: 'PK REJITH KUMAR',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.CONSUMER_LAW, ServiceArea.LABOR_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS],
    city: 'Kalpetta',
    state: 'Kerala',
    email: 'rejithkumar4@gmail.com',
    phone: '9447486284',
    bio: 'Comprehensive legal services in Civil, Criminal, Family, Consumer, and Labour law.',
    experienceYears: 10
  },
  {
    id: generateUUID(),
    name: 'Anna Jes Bino',
    practiceAreas: [ServiceArea.CORPORATE],
    city: 'Bengaluru',
    state: 'Karnataka',
    email: 'annajesbino@gmail.com',
    phone: '9961587486',
    bio: 'Specializing in General Corporate Law.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Adone Mathew Shelly',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.CONSUMER_LAW],
    city: 'Kottayam',
    state: 'Kerala',
    email: 'adonemathewshelly@gmail.com',
    phone: '8281893705',
    bio: 'Practice focused on Civil, Criminal, and Consumer law.',
    experienceYears: 4
  },
  {
    id: generateUUID(),
    name: 'John Zachariah Dominic',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.CONSUMER_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS],
    city: 'Thodupuzha',
    state: 'Kerala',
    email: 'dominic50@gmail.com',
    phone: '7012941527',
    bio: 'Experienced in Civil, Criminal, Family, and Consumer law.',
    experienceYears: 7
  },
  {
    id: generateUUID(),
    name: 'Naveen Shankar A',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CORPORATE, ServiceArea.FAMILY_LAW, ServiceArea.PROPERTY_LAW],
    city: 'Kasaragod',
    state: 'Kerala',
    email: 'nate.nsa@gmail.com',
    phone: '9495545496',
    bio: 'Specializing in Civil, Corporate, Family, and Property Law.',
    experienceYears: 6
  },
  {
    id: generateUUID(),
    name: 'Aparna S',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.ARBITRATION_MEDIATION, ServiceArea.BANKING_LAW],
    city: 'Ernakulam',
    state: 'Kerala',
    email: 'aparna.s@gmail.com',
    phone: '7591987511',
    bio: 'Expert in Civil, Criminal, Arbitration, and Banking Law.',
    experienceYears: 8
  },
  {
    id: generateUUID(),
    name: 'SOORAJ P R',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.CONSUMER_LAW],
    city: 'Ambalavayal',
    state: 'Kerala',
    email: 'soorajprs@gmail.com',
    phone: '7356028916',
    bio: 'Focused on Civil, Criminal, and Consumer Disputes.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'N. K. BALASUBRAMANIAM',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.CONSUMER_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS],
    city: 'Kollam',
    state: 'Kerala',
    email: 'nkbalabalu@yahoo.co.in',
    phone: '9847331591',
    bio: 'Comprehensive practice in Civil, Criminal, Family, and Consumer Law.',
    experienceYears: 15
  },
  {
    id: generateUUID(),
    name: 'Myza Alan Jose',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.CRIMINAL_LAW,
      ServiceArea.FAMILY_LAW,
      ServiceArea.MOTOR_ACCIDENT_CLAIMS,
      ServiceArea.CONSUMER_LAW,
      ServiceArea.CORPORATE,
      ServiceArea.LABOR_LAW,
      ServiceArea.INTELLECTUAL_PROPERTY
    ],
    city: 'Changanassery',
    state: 'Kerala',
    email: 'myzaalan05@gmail.com',
    phone: '9074205189',
    bio: 'Diverse practice areas including Civil, Criminal, Family, Corporate, and IP Law.',
    experienceYears: 6
  },
  {
    id: generateUUID(),
    name: 'Musafar Ahamed Sha P.M',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.CRIMINAL_LAW,
      ServiceArea.FAMILY_LAW,
      ServiceArea.MOTOR_ACCIDENT_CLAIMS,
      ServiceArea.CONSUMER_LAW,
      ServiceArea.CORPORATE,
      ServiceArea.LABOR_LAW,
      ServiceArea.INTELLECTUAL_PROPERTY
    ],
    city: 'Kodungallur',
    state: 'Kerala',
    email: 'musafarahamedshas@gmail.com',
    phone: '8921479980',
    bio: 'Comprehensive legal services across multiple practice areas.',
    experienceYears: 7
  },
  {
    id: generateUUID(),
    name: 'Roshen Roy',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.CONSUMER_LAW],
    city: 'Pala',
    state: 'Kerala',
    email: 'roshanroy187@gmail.com',
    phone: '9539848672',
    bio: 'Practice focused on Civil, Criminal, Family, and Consumer Law.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Navas P S',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.CRIMINAL_LAW,
      ServiceArea.MOTOR_ACCIDENT_CLAIMS,
      ServiceArea.CONSUMER_LAW,
      ServiceArea.FAMILY_LAW,
      ServiceArea.SERVICE_LAW,
      ServiceArea.PROPERTY_LAW
    ],
    city: 'Changanacherry',
    state: 'Kerala',
    email: 'psnavas75@gmail.com',
    phone: '9447720192',
    bio: 'Extensive experience in various legal domains including property disputes.',
    experienceYears: 12
  },
  {
    id: generateUUID(),
    name: 'Sabarinath A',
    practiceAreas: [ServiceArea.BANKING_LAW],
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    email: 'sabarinath.work@gmail.com',
    phone: '8113087801',
    bio: 'Specialized in Banking Matters and SARFAESI cases.',
    experienceYears: 6
  },
  {
    id: generateUUID(),
    name: 'Adersh P G',
    practiceAreas: [ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.CIVIL_LAW],
    city: 'Kollam',
    state: 'Kerala',
    email: 'adershpg@gmail.com',
    phone: '8848983072',
    bio: 'Practice focused on Criminal, Family, and Civil Law.',
    experienceYears: 4
  },
  {
    id: generateUUID(),
    name: 'Pallavi Narayanan',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS],
    city: 'Changanacherry',
    state: 'Kerala',
    email: 'Pallavinarayanan4@gmail.com',
    phone: '8129732340',
    bio: 'Experienced in Civil, Criminal, and Family Law matters.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Saidali M',
    practiceAreas: [
      ServiceArea.CRIMINAL_LAW,
      ServiceArea.CIVIL_LAW,
      ServiceArea.FAMILY_LAW,
      ServiceArea.MOTOR_ACCIDENT_CLAIMS,
      ServiceArea.CONSUMER_LAW,
      ServiceArea.BANKING_LAW
    ],
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    email: 'saidalim4249@gmail.com',
    phone: '8075016958',
    bio: 'Diverse practice including Criminal, Civil, Family, and Banking Law.',
    experienceYears: 8
  },
  {
    id: generateUUID(),
    name: 'Rajesh Kesav S',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.CRIMINAL_LAW,
      ServiceArea.MOTOR_ACCIDENT_CLAIMS,
      ServiceArea.CONSUMER_LAW,
      ServiceArea.FAMILY_LAW,
      ServiceArea.SERVICE_LAW,
      ServiceArea.PROPERTY_LAW
    ],
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    email: 'advrajeshkesavs@gmail.com',
    phone: '9567276921',
    bio: 'Comprehensive legal practice across multiple areas.',
    experienceYears: 10
  },
  {
    id: generateUUID(),
    name: 'Akhil Uthaman',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.CRIMINAL_LAW,
      ServiceArea.FAMILY_LAW,
      ServiceArea.MOTOR_ACCIDENT_CLAIMS,
      ServiceArea.CONSUMER_LAW,
      ServiceArea.CORPORATE,
      ServiceArea.LABOR_LAW,
      ServiceArea.INTELLECTUAL_PROPERTY
    ],
    city: 'Changanacherry',
    state: 'Kerala',
    email: 'advakhil944.18@gmail.com',
    phone: '8089336009',
    bio: 'Multi-disciplinary legal practice with expertise in various domains.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Jefin Padamadan',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.INSURANCE_LAW, ServiceArea.CONSUMER_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS],
    city: 'Ernakulam',
    state: 'Kerala',
    email: 'advjefinpb@gmail.com',
    phone: '8129990624',
    bio: 'Specialized in Civil, Insurance, and Consumer Law.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Rajesh Raju',
    practiceAreas: [ServiceArea.MOTOR_ACCIDENT_CLAIMS],
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    email: 'koikalrajesh@gmail.com',
    phone: '6282143052',
    bio: 'Focused practice in MACT cases.',
    experienceYears: 4
  },
  {
    id: generateUUID(),
    name: 'Vinu Vinay',
    practiceAreas: [ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.CONSUMER_LAW],
    city: 'Pathanamthitta',
    state: 'Kerala',
    email: 'advocatevinuvinay@gmail.com',
    phone: '9446973993',
    bio: 'Expert in Criminal, Family, and Consumer Law.',
    experienceYears: 6
  },
  {
    id: generateUUID(),
    name: 'Indu B R',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.FAMILY_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS],
    city: 'Pathanamthitta',
    state: 'Kerala',
    email: 'advbr.indu@gmail.com',
    phone: '9447569721',
    bio: 'Specialized in Civil and Family Law matters.',
    experienceYears: 7
  },
  {
    id: generateUUID(),
    name: 'Sandra Anna Shibu',
    practiceAreas: [ServiceArea.CRIMINAL_LAW, ServiceArea.CIVIL_LAW],
    city: 'Pathanamthitta',
    state: 'Kerala',
    email: 'sandraannashibu234@gmail.com',
    phone: '9947391973',
    bio: 'Practice focused on Criminal and Civil Law.',
    experienceYears: 3
  },
  {
    id: generateUUID(),
    name: 'Yumna Joseveedan',
    practiceAreas: [ServiceArea.CIVIL_LAW, ServiceArea.CRIMINAL_LAW, ServiceArea.FAMILY_LAW],
    city: 'Kollam',
    state: 'Kerala',
    email: 'yumnaj123@gmail.com',
    phone: '8848174831',
    bio: 'Experienced in Civil, Criminal, and Family Law.',
    experienceYears: 4
  },
  {
    id: generateUUID(),
    name: 'Bhadra S',
    practiceAreas: [ServiceArea.CIVIL_LAW],
    city: 'Alappuzha',
    state: 'Kerala',
    email: 'bhadrasree15@gmail.com',
    phone: '9562573553',
    bio: 'Specialized in Civil Law matters.',
    experienceYears: 3
  },
  {
    id: generateUUID(),
    name: 'Akhila S',
    practiceAreas: [
      ServiceArea.CONSUMER_LAW,
      ServiceArea.MOTOR_ACCIDENT_CLAIMS,
      ServiceArea.FAMILY_LAW,
      ServiceArea.SERVICE_LAW
    ],
    city: 'Ernakulam',
    state: 'Kerala',
    email: 'akhilasanal98@gmail.com',
    phone: '9633693502',
    bio: 'Practice covering Consumer, Family, and Service Law.',
    experienceYears: 4
  },
  {
    id: generateUUID(),
    name: 'Stephine Rajeev',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.MOTOR_ACCIDENT_CLAIMS,
      ServiceArea.CONSUMER_LAW,
      ServiceArea.FAMILY_LAW
    ],
    city: 'Cochin',
    state: 'Kerala',
    email: 'stephinerajeev351@gmail.com',
    phone: '7736256836',
    bio: 'Experienced in Civil, Consumer, and Family Law.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Sangeetha A',
    practiceAreas: [ServiceArea.FAMILY_LAW],
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    email: 'sangeethanair0599@gmail.com',
    phone: '8138988160',
    bio: 'Specialized in Family Law matters.',
    experienceYears: 4
  },
  {
    id: generateUUID(),
    name: 'Sayoojya Ajay',
    practiceAreas: [ServiceArea.CORPORATE],
    city: 'Bengaluru',
    state: 'Karnataka',
    email: 'sayoojyaajay13@gmail.com',
    phone: '8086044569',
    bio: 'Expert in Commercial Law.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Shilpa Pradeep',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.CRIMINAL_LAW,
      ServiceArea.FAMILY_LAW,
      ServiceArea.CONSUMER_LAW
    ],
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    email: 'advocateshilpapradeep@gmail.com',
    phone: '8848369225',
    bio: 'Comprehensive practice in Civil, Criminal, Family, and Consumer Law.',
    experienceYears: 6
  },
  {
    id: generateUUID(),
    name: 'Ashwin Mathews',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.MOTOR_ACCIDENT_CLAIMS,
      ServiceArea.CONSUMER_LAW,
      ServiceArea.FAMILY_LAW
    ],
    city: 'Kottayam',
    state: 'Kerala',
    email: 'ashwinmathews10@yahoo.com',
    phone: '9400830264',
    bio: 'Specialized in Civil Law, Consumer Law, and Family Law.',
    experienceYears: 7
  },
  {
    id: generateUUID(),
    name: 'Rahul Ghosh',
    practiceAreas: [ServiceArea.CRIMINAL_LAW],
    city: 'Thrissur',
    state: 'Kerala',
    email: 'rahulghosh202122@gmail.com',
    phone: '8921567293',
    bio: 'Criminal Law specialist.',
    experienceYears: 3
  },
  {
    id: generateUUID(),
    name: 'Parvathy Suresh',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.CRIMINAL_LAW,
      ServiceArea.FAMILY_LAW
    ],
    city: 'Changanacherry',
    state: 'Kerala',
    email: 'parvathysuresh091@gmail.com',
    phone: '9446891520',
    bio: 'Practice focused on Civil, Criminal, and Family Law.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Ajai K Reji',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.CRIMINAL_LAW,
      ServiceArea.CONSUMER_LAW
    ],
    city: 'Kottayam',
    state: 'Kerala',
    email: 'ajaikreji627@gmail.com',
    phone: '7907685217',
    bio: 'Expert in Civil, Criminal, and Consumer Law.',
    experienceYears: 4
  },
  {
    id: generateUUID(),
    name: 'Abraham P Binu',
    practiceAreas: [ServiceArea.CIVIL_LAW],
    city: 'Ernakulam',
    state: 'Kerala',
    email: 'abrahambinu803@gmail.com',
    phone: '8848854319',
    bio: 'Specialized in Civil Law matters.',
    experienceYears: 5
  },
  {
    id: generateUUID(),
    name: 'Adithyan Sethu Madhavan',
    practiceAreas: [
      ServiceArea.CIVIL_LAW,
      ServiceArea.CRIMINAL_LAW,
      ServiceArea.FAMILY_LAW,
      ServiceArea.CONSUMER_LAW
    ],
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    email: 'Adithyansm46@gmail.com',
    phone: '9567474977',
    bio: 'Comprehensive practice in Civil, Criminal, Family, and Consumer Law.',
    experienceYears: 5
  }
];

export const getLawyers = (): LawyerProfile[] => {
  return mockLawyers;
};

export const getUniqueCities = (): string[] => {
  const cities = new Set(mockLawyers.map(lawyer => lawyer.city));
  return Array.from(cities).sort();
};

export const getAllPracticeAreas = (): ServiceArea[] => {
  return Object.values(ServiceArea).sort();
};