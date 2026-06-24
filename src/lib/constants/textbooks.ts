// ============================================================
// DENTORA AI - BDS Textbook Intelligence Library
// Aligned with KNRUHS / Meghna Institute of Dental Sciences
// Final Year BDS Curriculum
// ============================================================

export type TutorMode = "standard" | "indian" | "exam" | "viva" | "quick";

export const TUTOR_MODES: {
  value: TutorMode;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: "standard",
    label: "Standard Reference",
    icon: "📖",
    description: "International textbooks — Hupp, Proffit, Burket's, Grossman",
  },
  {
    value: "indian",
    label: "Indian Author",
    icon: "🇮🇳",
    description: "Indian books — Balaji, Ghom, Nallaswamy, Bhalajhi",
  },
  {
    value: "exam",
    label: "Exam-Oriented",
    icon: "🎯",
    description: "KNRUHS pattern — 10-mark & 5-mark structured answers",
  },
  {
    value: "viva",
    label: "Viva Mode",
    icon: "🎤",
    description: "Crisp viva answers with differentials and clinical pearls",
  },
  {
    value: "quick",
    label: "Quick Revision",
    icon: "⚡",
    description: "5-minute summary — mnemonics, classifications, must-knows",
  },
];

// ============================================================
// SUBJECT TEXTBOOK LIBRARY
// ============================================================

export interface TextbookEntry {
  title: string;
  author: string;
  type: "international" | "indian" | "exam";
  key_chapters: string[];
}

export const SUBJECT_TEXTBOOKS: Record<string, {
  international: TextbookEntry[];
  indian: TextbookEntry[];
  exam_guides: TextbookEntry[];
  high_yield_topics: string[];
  viva_hot_topics: string[];
}> = {
  "Oral Medicine and Radiology": {
    international: [
      {
        title: "Burket's Oral Medicine",
        author: "Greenberg, Glick & Ship",
        type: "international",
        key_chapters: [
          "White Lesions", "Red Lesions", "Vesiculobullous Lesions",
          "Pigmented Lesions", "Salivary Gland Diseases", "Oral Cancer",
          "Systemic Diseases Manifesting in the Oral Cavity", "TMJ Disorders",
        ],
      },
      {
        title: "White and Pharoah's Oral Radiology: Principles and Interpretation",
        author: "White & Pharoah",
        type: "international",
        key_chapters: [
          "Radiographic Interpretation", "Periapical Radiography",
          "Panoramic Radiography", "CBCT", "Jaw Lesions",
          "Radiation Biology and Safety",
        ],
      },
    ],
    indian: [
      {
        title: "Textbook of Oral Medicine",
        author: "Anil Govindrao Ghom",
        type: "indian",
        key_chapters: [
          "Oral Ulcerations", "White Lesions", "Oral Submucous Fibrosis",
          "Potentially Malignant Disorders", "Oral Cancer",
          "Sjögren's Syndrome", "Blood Disorders in Dentistry",
        ],
      },
    ],
    exam_guides: [
      {
        title: "Mastering the BDS IVth Year Vol 1 & 2",
        author: "Hemant Gupta",
        type: "exam",
        key_chapters: ["Short Notes", "Long Essays", "MCQs"],
      },
      {
        title: "Quick Review Series (QRS) for BDS",
        author: "Jyotsna Rao",
        type: "exam",
        key_chapters: ["Subject-wise Question Bank"],
      },
    ],
    high_yield_topics: [
      "Oral Submucous Fibrosis", "Leukoplakia", "Erythroplakia", "Lichen Planus",
      "Aphthous Ulcers", "Pemphigus", "Sjögren's Syndrome", "Oral Cancer",
      "Salivary Gland Tumors", "TMJ Disorders", "Osteonecrosis of Jaw",
      "Radiographic Interpretation of Jaw Cysts", "CBCT",
    ],
    viva_hot_topics: [
      "Classification of White Lesions", "WHO criteria for Leukoplakia",
      "Potentially Malignant Disorders", "Radiographic features of Ameloblastoma",
      "Sjögren's syndrome triad", "Radiation safety — MPD",
    ],
  },

  "Oral Surgery": {
    international: [
      {
        title: "Contemporary Oral and Maxillofacial Surgery",
        author: "James R. Hupp",
        type: "international",
        key_chapters: [
          "Principles of Exodontia", "Surgical Anatomy", "Complications of Exodontia",
          "Impacted Teeth", "Preprosthetic Surgery", "Cysts of Jaw",
          "Odontogenic Tumors", "Oral Cancer", "Facial Fractures",
          "Salivary Gland Diseases", "TMJ Surgery",
        ],
      },
      {
        title: "Handbook of Local Anesthesia",
        author: "Stanley F. Malamed",
        type: "international",
        key_chapters: [
          "Pharmacology of LA", "Nerve Block Techniques", "Complications",
          "Maximum Safe Dose", "Vasoconstrictors",
        ],
      },
    ],
    indian: [
      {
        title: "Textbook of Oral and Maxillofacial Surgery",
        author: "S.M. Balaji",
        type: "indian",
        key_chapters: [
          "Exodontia", "LA in Dentistry", "Impacted Teeth", "Osteomyelitis",
          "Dry Socket", "Odontogenic Infections", "Fractures", "Cysts", "Tumors",
        ],
      },
      {
        title: "Textbook of Oral and Maxillofacial Surgery",
        author: "Neelima Anil Malik",
        type: "indian",
        key_chapters: [
          "Surgical Anatomy", "LA Techniques", "Alveolar Osteitis",
          "TMJ Disorders", "Salivary Gland Surgery",
        ],
      },
    ],
    exam_guides: [
      {
        title: "Mastering the BDS IVth Year",
        author: "Hemant Gupta",
        type: "exam",
        key_chapters: ["Short Notes on OS", "Long Essays"],
      },
    ],
    high_yield_topics: [
      "Dry Socket (Alveolar Osteitis)", "Impacted Mandibular Third Molar",
      "Mandibular Nerve Block", "Osteomyelitis", "Odontogenic Infections",
      "Cysts of Jaw", "Ameloblastoma", "Fractures of Mandible", "TMJ Disorders",
      "Salivary Gland Disorders", "Preprosthetic Surgery",
    ],
    viva_hot_topics: [
      "Lingual nerve — course and relations", "Dry socket — etiology and management",
      "Inferior alveolar nerve block technique", "Classification of impacted teeth",
      "Space infections — boundaries and contents", "Osteomyelitis vs Osteoradionecrosis",
    ],
  },

  "Pedodontics and Preventive Dentistry": {
    international: [
      {
        title: "Dentistry for the Child and Adolescent",
        author: "McDonald and Avery",
        type: "international",
        key_chapters: [
          "Child Psychology", "Behavior Management", "Dental Caries in Children",
          "Pulpotomy", "Pulpectomy", "Space Maintainers", "Fluoride",
          "Pit and Fissure Sealants", "Trauma Management", "Malocclusion",
        ],
      },
    ],
    indian: [
      {
        title: "Textbook of Pediatric Dentistry",
        author: "M.S. Muthu",
        type: "indian",
        key_chapters: [
          "Growth and Development", "Primary Dentition", "Mixed Dentition",
          "Caries Management", "Pulp Therapy", "Preventive Dentistry",
        ],
      },
      {
        title: "Textbook of Pediatric Dentistry",
        author: "Shobha Tandon",
        type: "indian",
        key_chapters: [
          "Behavior Management Techniques", "Local Anesthesia in Children",
          "Oral Habits", "Space Management",
        ],
      },
    ],
    exam_guides: [
      {
        title: "Quick Review Series for BDS",
        author: "Jyotsna Rao",
        type: "exam",
        key_chapters: ["Pedodontics Question Bank"],
      },
    ],
    high_yield_topics: [
      "Tell-Show-Do Technique", "Pulpotomy vs Pulpectomy", "Space Maintainers Classification",
      "Fluoride — mechanism, toxicity, fluorosis", "Pit and Fissure Sealants",
      "Oral Habits — Thumb Sucking, Mouth Breathing", "Primary Tooth Trauma",
      "Eruption Dates", "Stainless Steel Crowns", "CAMBRA",
    ],
    viva_hot_topics: [
      "Frankl's Behavior Rating Scale", "Wright's classification of behavior",
      "Pulpotomy steps in primary molars", "Fluoride toxicity dose",
      "Space maintainer types and indications",
    ],
  },

  "Orthodontics and Dentofacial Orthopaedics": {
    international: [
      {
        title: "Contemporary Orthodontics",
        author: "William R. Proffit",
        type: "international",
        key_chapters: [
          "Growth and Development", "Cephalometrics", "Angle's Classification",
          "Etiology of Malocclusion", "Diagnosis and Treatment Planning",
          "Fixed Appliances", "Functional Appliances", "Retention and Relapse",
          "Surgical Orthodontics",
        ],
      },
    ],
    indian: [
      {
        title: "Orthodontics: The Art and Science",
        author: "S.I. Bhalajhi",
        type: "indian",
        key_chapters: [
          "Index of Orthodontic Treatment Need", "Removable Appliances",
          "Activator and Functional Appliances", "Indian Cephalometric Norms",
        ],
      },
    ],
    exam_guides: [
      {
        title: "Mastering the BDS IVth Year",
        author: "Hemant Gupta",
        type: "exam",
        key_chapters: ["Orthodontics Short Notes and Essays"],
      },
    ],
    high_yield_topics: [
      "Angle's Classification of Malocclusion", "Cephalometrics — Steiner Analysis",
      "Growth and Development — Facial Growth", "Hawley's Retainer",
      "Activator Appliance", "Twin Block Appliance", "Arch Perimeter Analysis",
      "Extraoral Anchorage", "Begg Technique", "MBT vs Edgewise",
    ],
    viva_hot_topics: [
      "Angle's class II division 1 features", "Cephalometric landmarks and planes",
      "Retention vs Relapse — reasons", "Arch length vs Arch perimeter",
      "Functional appliances — mechanism of action",
    ],
  },

  "Periodontics": {
    international: [
      {
        title: "Newman and Carranza's Clinical Periodontology",
        author: "Newman, Takei & Klokkevold",
        type: "international",
        key_chapters: [
          "Anatomy of Periodontium", "Gingival Diseases", "Periodontitis Classification",
          "Systemic Diseases and Periodontium", "Periodontal Examination",
          "Non-Surgical Therapy", "Periodontal Surgery",
          "Regenerative Procedures", "Implantology",
        ],
      },
    ],
    indian: [
      {
        title: "Textbook of Periodontics",
        author: "Shantipriya Reddy",
        type: "indian",
        key_chapters: [
          "Interdental Bone Anatomy", "Furcation Involvement",
          "Mucogingival Surgery", "Periodontal Emergencies",
          "Bone Graft Materials", "Guided Tissue Regeneration",
        ],
      },
    ],
    exam_guides: [
      {
        title: "Quick Review Series for BDS",
        author: "Jyotsna Rao",
        type: "exam",
        key_chapters: ["Periodontics Question Bank"],
      },
    ],
    high_yield_topics: [
      "2017 Classification of Periodontal Diseases", "Junctional Epithelium",
      "Scaling and Root Planing", "Modified Widman Flap",
      "Furcation Involvement — Glickman's Classification",
      "Bone Graft Materials", "GTR Membranes", "Halitosis",
      "Aggressive Periodontitis", "Periodontal Abscess vs Periapical Abscess",
    ],
    viva_hot_topics: [
      "2017 Classification changes from 1999", "Biologic width — clinical significance",
      "Junctional epithelium — unique features", "Scalers vs Curettes",
      "Furcation classification and management", "GTR vs GBR",
    ],
  },

  "Prosthodontics and Crown & Bridge": {
    international: [
      {
        title: "Boucher's Prosthodontic Treatment for Edentulous Patients",
        author: "Zarb, Hobkirk & Eckert",
        type: "international",
        key_chapters: [
          "Anatomic Landmarks", "Impression Making", "Jaw Relations",
          "Occlusion for CDs", "Try-In and Delivery", "Relining and Rebasing",
        ],
      },
      {
        title: "Contemporary Fixed Prosthodontics",
        author: "Stephen F. Rosenstiel",
        type: "international",
        key_chapters: [
          "Tooth Preparation", "Impression Materials", "Provisional Restorations",
          "Ceramics", "Bridge Design", "Implant Crowns",
        ],
      },
      {
        title: "McCracken's Removable Partial Prosthodontics",
        author: "Carr & Brown",
        type: "international",
        key_chapters: [
          "RPD Design", "Clasps", "Major and Minor Connectors",
          "Rests and Rest Seats", "Framework Design",
        ],
      },
    ],
    indian: [
      {
        title: "Textbook of Prosthodontics",
        author: "Deepak Nallaswamy",
        type: "indian",
        key_chapters: [
          "Complete Denture Steps", "RPD Design Principles",
          "Occlusion", "Implant Prosthetics", "Maxillofacial Prosthetics",
        ],
      },
    ],
    exam_guides: [
      {
        title: "Mastering the BDS IVth Year",
        author: "Hemant Gupta",
        type: "exam",
        key_chapters: ["Prosthodontics Long Essays and Short Notes"],
      },
    ],
    high_yield_topics: [
      "Impression Techniques for CD", "Jaw Relation Records",
      "Gothic Arch Tracing", "Balanced Occlusion", "Neutral Zone",
      "Retention in CD — factors", "RPD Major Connectors",
      "Clasp Design — RPI vs RPA", "Crown Preparation Principles",
      "Ferrule Effect", "Implant-supported Overdentures",
    ],
    viva_hot_topics: [
      "Centric relation vs Centric occlusion", "Neutral zone concept",
      "Principal stress bearing areas in mandible", "RPI clasp components",
      "Ferrule effect — definition and significance", "Osseointegration",
    ],
  },

  "Conservative Dentistry and Endodontics": {
    international: [
      {
        title: "Sturdevant's Art and Science of Operative Dentistry",
        author: "Sturdevant",
        type: "international",
        key_chapters: [
          "Dental Caries", "Cavity Preparation", "Composite Restorations",
          "Amalgam Restorations", "Glass Ionomer", "Dentin Bonding",
        ],
      },
      {
        title: "Grossman's Endodontic Practice",
        author: "Grossman",
        type: "international",
        key_chapters: [
          "Pulp Biology", "Pulp Pathology", "Diagnosis", "Access Cavity",
          "Biomechanical Preparation", "Irrigation", "Obturation",
          "Endodontic Surgery",
        ],
      },
      {
        title: "Cohen's Pathways of the Pulp",
        author: "Cohen & Hargreaves",
        type: "international",
        key_chapters: [
          "Pulpal Diagnosis", "Canal Morphology", "Rotary Instrumentation",
          "Ledge Formation and Management", "Root Resorption",
        ],
      },
    ],
    indian: [
      {
        title: "Textbook of Operative Dentistry",
        author: "Vimal K. Sikri",
        type: "indian",
        key_chapters: [
          "GV Black's Cavity Classification", "Cavity Preparation Principles",
          "Bonding Agents", "Tooth Whitening", "Minimal Invasive Dentistry",
        ],
      },
    ],
    exam_guides: [
      {
        title: "Quick Review Series for BDS",
        author: "Jyotsna Rao",
        type: "exam",
        key_chapters: ["Conservative and Endodontics Question Bank"],
      },
    ],
    high_yield_topics: [
      "GV Black's Classification", "Caries Activity Tests", "Smear Layer",
      "NaOCl Concentration and Action", "Working Length Determination",
      "Obturation Techniques — Lateral vs Vertical Condensation",
      "Gutta Percha — properties", "Pulp Capping", "Apexification",
      "Vital Pulp Therapy", "Post and Core",
    ],
    viva_hot_topics: [
      "Smear layer — significance and removal", "Hypochlorite accident management",
      "Electronic apex locator working principle", "Step-back vs Crown-down technique",
      "MTA — composition and uses",
    ],
  },

  "Public Health Dentistry": {
    international: [
      {
        title: "Park's Textbook of Preventive and Social Medicine",
        author: "K. Park",
        type: "international",
        key_chapters: [
          "Epidemiology", "Biostatistics", "Health Education", "Nutrition",
        ],
      },
    ],
    indian: [
      {
        title: "Essentials of Public Health Dentistry",
        author: "Soben Peter",
        type: "indian",
        key_chapters: [
          "Dental Epidemiology", "Biostatistics", "Oral Health Survey",
          "Dental Indices", "Fluoride and Fluorosis", "National Oral Health Programs",
          "Health Education and Promotion", "School Dental Health",
        ],
      },
    ],
    exam_guides: [],
    high_yield_topics: [
      "Dental Indices — DMFT, CPITN, OHI-S", "Fluoride — optimal level, fluorosis",
      "Dean's Fluorosis Index", "Epidemiological Study Designs",
      "National Oral Health Policy India", "School Dental Health Programs",
      "Biostatistics — Mean, Median, Mode, SD", "Questionnaire Design",
    ],
    viva_hot_topics: [
      "DMFT index — components", "CPITN vs PSR", "Dean's index scores",
      "Types of epidemiological studies", "Water fluoridation — optimal ppm",
    ],
  },
};

// ============================================================
// HIGH-YIELD TOPIC DATABASE
// Maps topic → textbook source + exam metadata
// ============================================================

export interface TopicMetadata {
  subject: string;
  recommended_book: string;
  recommended_author: string;
  chapter: string;
  exam_frequency: "very_high" | "high" | "medium" | "low";
  clinical_importance: "very_high" | "high" | "medium" | "low";
  viva_importance: "very_high" | "high" | "medium" | "low";
  marks_type: "10_mark" | "5_mark" | "both" | "mcq";
}

export const TOPIC_METADATA: Record<string, TopicMetadata> = {
  "Dry Socket": {
    subject: "Oral Surgery",
    recommended_book: "Contemporary Oral and Maxillofacial Surgery",
    recommended_author: "Hupp",
    chapter: "Complications of Exodontia",
    exam_frequency: "very_high",
    clinical_importance: "very_high",
    viva_importance: "very_high",
    marks_type: "both",
  },
  "Impacted Mandibular Third Molar": {
    subject: "Oral Surgery",
    recommended_book: "Contemporary Oral and Maxillofacial Surgery",
    recommended_author: "Hupp",
    chapter: "Impacted Teeth",
    exam_frequency: "very_high",
    clinical_importance: "very_high",
    viva_importance: "very_high",
    marks_type: "10_mark",
  },
  "Osteomyelitis": {
    subject: "Oral Surgery",
    recommended_book: "Textbook of Oral and Maxillofacial Surgery",
    recommended_author: "Balaji",
    chapter: "Infections of Jaw",
    exam_frequency: "very_high",
    clinical_importance: "very_high",
    viva_importance: "high",
    marks_type: "10_mark",
  },
  "Oral Submucous Fibrosis": {
    subject: "Oral Medicine and Radiology",
    recommended_book: "Burket's Oral Medicine",
    recommended_author: "Greenberg",
    chapter: "Potentially Malignant Disorders",
    exam_frequency: "very_high",
    clinical_importance: "very_high",
    viva_importance: "very_high",
    marks_type: "10_mark",
  },
  "Leukoplakia": {
    subject: "Oral Medicine and Radiology",
    recommended_book: "Textbook of Oral Medicine",
    recommended_author: "Ghom",
    chapter: "White Lesions",
    exam_frequency: "very_high",
    clinical_importance: "very_high",
    viva_importance: "very_high",
    marks_type: "10_mark",
  },
  "Pulpotomy": {
    subject: "Pedodontics and Preventive Dentistry",
    recommended_book: "Dentistry for the Child and Adolescent",
    recommended_author: "McDonald and Avery",
    chapter: "Pulp Therapy",
    exam_frequency: "very_high",
    clinical_importance: "very_high",
    viva_importance: "very_high",
    marks_type: "both",
  },
  "Angle's Classification": {
    subject: "Orthodontics and Dentofacial Orthopaedics",
    recommended_book: "Contemporary Orthodontics",
    recommended_author: "Proffit",
    chapter: "Classification of Malocclusion",
    exam_frequency: "very_high",
    clinical_importance: "high",
    viva_importance: "very_high",
    marks_type: "5_mark",
  },
  "Scaling and Root Planing": {
    subject: "Periodontics",
    recommended_book: "Newman and Carranza's Clinical Periodontology",
    recommended_author: "Carranza",
    chapter: "Non-Surgical Periodontal Therapy",
    exam_frequency: "high",
    clinical_importance: "very_high",
    viva_importance: "high",
    marks_type: "both",
  },
  "Complete Denture Impression": {
    subject: "Prosthodontics and Crown & Bridge",
    recommended_book: "Boucher's Prosthodontic Treatment",
    recommended_author: "Zarb",
    chapter: "Impression Techniques",
    exam_frequency: "very_high",
    clinical_importance: "very_high",
    viva_importance: "high",
    marks_type: "10_mark",
  },
};

// ============================================================
// STUDY PLANNER TEXTBOOK RECOMMENDATION HELPER
// ============================================================

export function getTextbookForSubject(subjectName: string, mode: "standard" | "indian" | "exam" = "standard") {
  const entry = SUBJECT_TEXTBOOKS[subjectName];
  if (!entry) return null;
  if (mode === "indian") return entry.indian[0] ?? entry.international[0];
  if (mode === "exam") return entry.exam_guides[0] ?? entry.international[0];
  return entry.international[0];
}

export function getTopicMetadata(topic: string): TopicMetadata | null {
  return TOPIC_METADATA[topic] ?? null;
}
