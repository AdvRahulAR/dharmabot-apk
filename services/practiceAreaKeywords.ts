import { ServiceArea } from '../types';

export const PRACTICE_AREA_KEYWORDS: Record<string, ServiceArea[]> = {
  // Family Law keywords
  'divorce': [ServiceArea.FAMILY_LAW, ServiceArea.FAMILY_LAW_PRIVATE_CLIENT],
  'custody': [ServiceArea.FAMILY_LAW, ServiceArea.FAMILY_LAW_PRIVATE_CLIENT],
  'child support': [ServiceArea.FAMILY_LAW, ServiceArea.FAMILY_LAW_PRIVATE_CLIENT],
  'alimony': [ServiceArea.FAMILY_LAW, ServiceArea.FAMILY_LAW_PRIVATE_CLIENT],
  'marriage': [ServiceArea.FAMILY_LAW, ServiceArea.FAMILY_LAW_PRIVATE_CLIENT],
  'adoption': [ServiceArea.FAMILY_LAW, ServiceArea.FAMILY_LAW_PRIVATE_CLIENT],
  'prenup': [ServiceArea.FAMILY_LAW, ServiceArea.FAMILY_LAW_PRIVATE_CLIENT],
  'prenuptial': [ServiceArea.FAMILY_LAW, ServiceArea.FAMILY_LAW_PRIVATE_CLIENT],
  'domestic violence': [ServiceArea.FAMILY_LAW, ServiceArea.CRIMINAL_LAW],
  'family': [ServiceArea.FAMILY_LAW, ServiceArea.FAMILY_LAW_PRIVATE_CLIENT],

  // Accident and Motor Vehicle keywords
  'accident': [ServiceArea.ACCIDENT_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.LITIGATION],
  'car accident': [ServiceArea.ACCIDENT_LAW, ServiceArea.MOTOR_ACCIDENT_CLAIMS],
  'motor accident': [ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.ACCIDENT_LAW],
  'mact': [ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.ACCIDENT_LAW],
  'personal injury': [ServiceArea.ACCIDENT_LAW, ServiceArea.LITIGATION],
  'injury': [ServiceArea.ACCIDENT_LAW, ServiceArea.LITIGATION],
  'vehicle accident': [ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.ACCIDENT_LAW],
  'traffic accident': [ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.ACCIDENT_LAW],
  'hit and run': [ServiceArea.MOTOR_ACCIDENT_CLAIMS, ServiceArea.CRIMINAL_LAW],

  // Criminal Law keywords
  'criminal': [ServiceArea.CRIMINAL_LAW, ServiceArea.LITIGATION],
  'arrest': [ServiceArea.CRIMINAL_LAW],
  'bail': [ServiceArea.CRIMINAL_LAW],
  'charges': [ServiceArea.CRIMINAL_LAW],
  'theft': [ServiceArea.CRIMINAL_LAW],
  'fraud': [ServiceArea.CRIMINAL_LAW, ServiceArea.WHITE_COLLAR_CRIME_INVESTIGATIONS],
  'assault': [ServiceArea.CRIMINAL_LAW],
  'dui': [ServiceArea.CRIMINAL_LAW],
  'drugs': [ServiceArea.CRIMINAL_LAW],
  'murder': [ServiceArea.CRIMINAL_LAW],
  'robbery': [ServiceArea.CRIMINAL_LAW],
  'burglary': [ServiceArea.CRIMINAL_LAW],

  // Civil Law keywords
  'civil': [ServiceArea.CIVIL_LAW, ServiceArea.LITIGATION],
  'contract dispute': [ServiceArea.CIVIL_LAW, ServiceArea.GENERAL_CORPORATE_COMMERCIAL],
  'property dispute': [ServiceArea.CIVIL_LAW, ServiceArea.PROPERTY_LAW, ServiceArea.REAL_ESTATE_CONSTRUCTION],
  'money recovery': [ServiceArea.CIVIL_LAW, ServiceArea.LITIGATION],
  'breach of contract': [ServiceArea.CIVIL_LAW, ServiceArea.GENERAL_CORPORATE_COMMERCIAL],
  'defamation': [ServiceArea.CIVIL_LAW, ServiceArea.LITIGATION],
  'negligence': [ServiceArea.CIVIL_LAW, ServiceArea.LITIGATION],

  // Consumer Law keywords
  'consumer': [ServiceArea.CONSUMER_LAW],
  'consumer protection': [ServiceArea.CONSUMER_LAW],
  'product liability': [ServiceArea.CONSUMER_LAW, ServiceArea.LITIGATION],
  'warranty': [ServiceArea.CONSUMER_LAW],
  'refund': [ServiceArea.CONSUMER_LAW],
  'consumer complaint': [ServiceArea.CONSUMER_LAW],

  // Corporate Law keywords
  'corporate': [ServiceArea.CORPORATE, ServiceArea.GENERAL_CORPORATE_COMMERCIAL],
  'business': [ServiceArea.CORPORATE, ServiceArea.GENERAL_CORPORATE_COMMERCIAL],
  'company': [ServiceArea.CORPORATE, ServiceArea.GENERAL_CORPORATE_COMMERCIAL],
  'startup': [ServiceArea.STARTUP_ADVISORY, ServiceArea.CORPORATE],
  'merger': [ServiceArea.MERGERS_ACQUISITIONS],
  'acquisition': [ServiceArea.MERGERS_ACQUISITIONS],
  'joint venture': [ServiceArea.JOINT_VENTURES_STRATEGIC_ALLIANCES],
  'partnership': [ServiceArea.GENERAL_CORPORATE_COMMERCIAL],

  // Employment/Labor Law keywords
  'employment': [ServiceArea.LABOUR_EMPLOYMENT, ServiceArea.LABOR_LAW],
  'labor': [ServiceArea.LABOUR_EMPLOYMENT, ServiceArea.LABOR_LAW],
  'workplace': [ServiceArea.LABOUR_EMPLOYMENT, ServiceArea.LABOR_LAW],
  'wrongful termination': [ServiceArea.LABOUR_EMPLOYMENT, ServiceArea.LABOR_LAW],
  'discrimination': [ServiceArea.LABOUR_EMPLOYMENT, ServiceArea.LABOR_LAW],
  'harassment': [ServiceArea.LABOUR_EMPLOYMENT, ServiceArea.LABOR_LAW],
  'wages': [ServiceArea.LABOUR_EMPLOYMENT, ServiceArea.LABOR_LAW],
  'overtime': [ServiceArea.LABOUR_EMPLOYMENT, ServiceArea.LABOR_LAW],

  // Property/Real Estate keywords
  'property': [ServiceArea.PROPERTY_LAW, ServiceArea.REAL_ESTATE_CONSTRUCTION],
  'real estate': [ServiceArea.REAL_ESTATE_CONSTRUCTION, ServiceArea.PROPERTY_LAW],
  'land': [ServiceArea.PROPERTY_LAW, ServiceArea.REAL_ESTATE_CONSTRUCTION],
  'construction': [ServiceArea.REAL_ESTATE_CONSTRUCTION],
  'landlord': [ServiceArea.PROPERTY_LAW, ServiceArea.REAL_ESTATE_CONSTRUCTION],
  'tenant': [ServiceArea.PROPERTY_LAW, ServiceArea.REAL_ESTATE_CONSTRUCTION],
  'eviction': [ServiceArea.PROPERTY_LAW, ServiceArea.REAL_ESTATE_CONSTRUCTION],
  'rent': [ServiceArea.PROPERTY_LAW, ServiceArea.REAL_ESTATE_CONSTRUCTION],

  // Banking/Finance keywords
  'banking': [ServiceArea.BANKING_LAW, ServiceArea.BANKING_FINANCE_REGULATORY_TRANSACTIONAL],
  'loan': [ServiceArea.BANKING_LAW, ServiceArea.BANKING_FINANCE_REGULATORY_TRANSACTIONAL],
  'mortgage': [ServiceArea.BANKING_LAW, ServiceArea.REAL_ESTATE_CONSTRUCTION],
  'debt': [ServiceArea.BANKING_LAW, ServiceArea.INSOLVENCY_BANKRUPTCY_RESTRUCTURING],
  'bankruptcy': [ServiceArea.INSOLVENCY_BANKRUPTCY_RESTRUCTURING],
  'insolvency': [ServiceArea.INSOLVENCY_BANKRUPTCY_RESTRUCTURING],
  'sarfaesi': [ServiceArea.BANKING_LAW, ServiceArea.BANKING_FINANCE_REGULATORY_TRANSACTIONAL],

  // Insurance keywords
  'insurance': [ServiceArea.INSURANCE_LAW, ServiceArea.INSURANCE],
  'claim': [ServiceArea.INSURANCE_LAW, ServiceArea.INSURANCE],
  'policy': [ServiceArea.INSURANCE_LAW, ServiceArea.INSURANCE],
  'health insurance': [ServiceArea.INSURANCE_LAW, ServiceArea.HEALTHCARE_PHARMACEUTICALS_LIFE_SCIENCES],

  // Intellectual Property keywords
  'patent': [ServiceArea.INTELLECTUAL_PROPERTY],
  'trademark': [ServiceArea.INTELLECTUAL_PROPERTY],
  'copyright': [ServiceArea.INTELLECTUAL_PROPERTY],
  'ip': [ServiceArea.INTELLECTUAL_PROPERTY],
  'intellectual property': [ServiceArea.INTELLECTUAL_PROPERTY],
  'trade secret': [ServiceArea.INTELLECTUAL_PROPERTY],

  // Tax keywords
  'tax': [ServiceArea.TAXATION_DIRECT_INDIRECT],
  'taxation': [ServiceArea.TAXATION_DIRECT_INDIRECT],
  'gst': [ServiceArea.TAXATION_DIRECT_INDIRECT],
  'income tax': [ServiceArea.TAXATION_DIRECT_INDIRECT],
  'tax audit': [ServiceArea.TAXATION_DIRECT_INDIRECT],

  // Cyber Law keywords
  'cyber': [ServiceArea.CYBER_LAW, ServiceArea.DATA_PROTECTION_PRIVACY],
  'cybercrime': [ServiceArea.CYBER_LAW, ServiceArea.CRIMINAL_LAW],
  'data protection': [ServiceArea.DATA_PROTECTION_PRIVACY, ServiceArea.CYBER_LAW],
  'privacy': [ServiceArea.DATA_PROTECTION_PRIVACY],
  'hacking': [ServiceArea.CYBER_LAW, ServiceArea.CRIMINAL_LAW],
  'online fraud': [ServiceArea.CYBER_LAW, ServiceArea.CRIMINAL_LAW],

  // Service Law keywords
  'service': [ServiceArea.SERVICE_LAW],
  'government service': [ServiceArea.SERVICE_LAW, ServiceArea.GOVERNMENT_PUBLIC_SECTOR],
  'pension': [ServiceArea.SERVICE_LAW],
  'promotion': [ServiceArea.SERVICE_LAW],

  // Arbitration keywords
  'arbitration': [ServiceArea.ARBITRATION_MEDIATION],
  'mediation': [ServiceArea.ARBITRATION_MEDIATION],
  'dispute resolution': [ServiceArea.ARBITRATION_MEDIATION, ServiceArea.LITIGATION],

  // Constitutional Law keywords
  'constitutional': [ServiceArea.CONSTITUTIONAL],
  'fundamental rights': [ServiceArea.CONSTITUTIONAL],
  'writ': [ServiceArea.CONSTITUTIONAL, ServiceArea.LITIGATION],

  // Environmental Law keywords
  'environmental': [ServiceArea.ENVIRONMENTAL, ServiceArea.ENVIRONMENTAL_SOCIAL_GOVERNANCE_ESG],
  'pollution': [ServiceArea.ENVIRONMENTAL],
  'environment': [ServiceArea.ENVIRONMENTAL, ServiceArea.ENVIRONMENTAL_SOCIAL_GOVERNANCE_ESG],

  // Technology/TMT keywords
  'technology': [ServiceArea.TECHNOLOGY_MEDIA_TELECOMMUNICATIONS_TMT, ServiceArea.LEGAL_TECH_AI_SOLUTIONS],
  'software': [ServiceArea.TECHNOLOGY_MEDIA_TELECOMMUNICATIONS_TMT],
  'telecom': [ServiceArea.TECHNOLOGY_MEDIA_TELECOMMUNICATIONS_TMT],
  'telecommunications': [ServiceArea.TECHNOLOGY_MEDIA_TELECOMMUNICATIONS_TMT],
  'media': [ServiceArea.TECHNOLOGY_MEDIA_TELECOMMUNICATIONS_TMT],

  // Healthcare keywords
  'medical': [ServiceArea.HEALTHCARE_PHARMACEUTICALS_LIFE_SCIENCES],
  'healthcare': [ServiceArea.HEALTHCARE_PHARMACEUTICALS_LIFE_SCIENCES],
  'medical malpractice': [ServiceArea.HEALTHCARE_PHARMACEUTICALS_LIFE_SCIENCES, ServiceArea.LITIGATION],
  'pharmaceutical': [ServiceArea.HEALTHCARE_PHARMACEUTICALS_LIFE_SCIENCES],

  // Competition Law keywords
  'competition': [ServiceArea.COMPETITION_ANTITRUST],
  'antitrust': [ServiceArea.COMPETITION_ANTITRUST],
  'monopoly': [ServiceArea.COMPETITION_ANTITRUST],

  // Infrastructure keywords
  'infrastructure': [ServiceArea.INFRASTRUCTURE_PROJECTS_ENERGY],
  'energy': [ServiceArea.INFRASTRUCTURE_PROJECTS_ENERGY],
  'power': [ServiceArea.INFRASTRUCTURE_PROJECTS_ENERGY],

  // Maritime/Aviation keywords
  'maritime': [ServiceArea.MARITIME_AVIATION_LOGISTICS],
  'aviation': [ServiceArea.MARITIME_AVIATION_LOGISTICS],
  'shipping': [ServiceArea.MARITIME_AVIATION_LOGISTICS],
  'logistics': [ServiceArea.MARITIME_AVIATION_LOGISTICS],

  // General litigation keywords
  'litigation': [ServiceArea.LITIGATION],
  'court': [ServiceArea.LITIGATION],
  'lawsuit': [ServiceArea.LITIGATION],
  'legal case': [ServiceArea.LITIGATION],
  'trial': [ServiceArea.LITIGATION],
};