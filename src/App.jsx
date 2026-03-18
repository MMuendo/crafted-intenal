import { useState, useRef, useEffect, useCallback } from "react";
import Confetti from "react-confetti";
import { supabase } from "./supabaseClient";

const WEBHOOK_URL = "https://thecraftcatalyst.app.n8n.cloud/webhook/f0c78673-a678-4632-ae82-a9e53180e271";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary: #000000; --accent: #FDB813; --accent-hover: #e5a400;
    --bg: #FFFFFF; --neutral: #F8F9FA; --neutral-dark: #e9ecef;
    --text: #000000; --text-muted: #6c757d; --border: #dee2e6;
    --radius: 16px; --shadow: 0 10px 40px rgba(0,0,0,0.06);
    --shadow-sm: 0 4px 15px rgba(0,0,0,0.03);
    --success: #28a745; --error: #dc3545;
  }

  html, body, #root { height: 100%; }
  body { font-family: "Montserrat", sans-serif; background: var(--bg); color: var(--text); overflow-x: hidden; }
  .app { display: flex; flex-direction: column; min-height: 100vh; }

  /* ── Header ── */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 64px; background: var(--primary);
    position: sticky; top: 0; z-index: 100; flex-shrink: 0;
  }
  .header-logo { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .header-logo span { color: var(--accent); }
  .header-subtitle { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.5); }
  .signout-btn {
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.8); border-radius: 8px; padding: 7px 16px;
    font-size: 12px; font-weight: 600; cursor: pointer; font-family: "Montserrat", sans-serif;
    transition: all 0.2s;
  }
  .signout-btn:hover { background: rgba(255,255,255,0.2); }

  /* ── Buttons ── */
  .btn-primary {
    background: var(--accent); color: var(--primary); border: none; border-radius: 10px;
    padding: 12px 24px; font-size: 14px; font-weight: 700; cursor: pointer;
    transition: all 0.2s; font-family: "Montserrat", sans-serif;
    box-shadow: 0 4px 14px rgba(253,184,19,0.35);
  }
  .btn-primary:hover { transform: translateY(-1px); background: var(--accent-hover); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-secondary {
    background: var(--neutral); color: var(--primary); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px 20px; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; font-family: "Montserrat", sans-serif;
  }
  .btn-secondary:hover { background: var(--neutral-dark); }
  .btn-secondary:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Login card ── */
  .card { background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 40px; box-shadow: var(--shadow); }
  .field-group { display: flex; flex-direction: column; gap: 8px; }
  .field-group label { font-size: 13px; font-weight: 600; color: var(--primary); }
  .field-group input {
    background: var(--bg); border: 2px solid var(--border); border-radius: 12px;
    padding: 14px 16px; color: var(--text); font-family: "Montserrat", sans-serif;
    font-size: 15px; outline: none; transition: all 0.2s; width: 100%;
  }
  .field-group input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px rgba(253,184,19,0.15); }

  /* ── Internal Console Wrapper ── */
  .internal-wrapper { display: flex; flex: 1; height: calc(100vh - 64px); overflow: visible; background: var(--neutral); }

  /* ── Profile Sidebar ── */
  .profile-sidebar {
    width: 224px; min-width: 224px; background: var(--bg); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; overflow-y: auto; padding: 14px; gap: 8px; flex-shrink: 0;
  }
  .sidebar-hdr { display: flex; justify-content: space-between; align-items: center; }
  .sidebar-hdr span { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }
  .sidebar-hdr button { background: none; border: none; font-size: 11px; color: var(--accent); cursor: pointer; font-weight: 600; font-family: "Montserrat", sans-serif; }
  .pf { display: flex; flex-direction: column; gap: 3px; }
  .pf label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .pf select, .pf input {
    padding: 6px 8px; border-radius: 7px; border: 1.5px solid var(--border);
    font-size: 12px; font-family: "Montserrat", sans-serif; outline: none;
    background: var(--bg); color: var(--text); width: 100%;
    appearance: none; -webkit-appearance: none;
  }
  .pf select:focus, .pf input:focus { border-color: var(--accent); }
  .subj-row { display: flex; align-items: center; gap: 6px; }
  .subj-row span { font-size: 11px; flex: 1; color: var(--text); }
  .subj-row select { width: 68px; flex-shrink: 0; padding: 4px 6px; font-size: 11px; border-radius: 6px; border: 1.5px solid var(--border); background: var(--bg); font-family: "Montserrat", sans-serif; outline: none; }
  .subj-row select:focus { border-color: var(--accent); }
  .profile-summary {
    background: var(--neutral); border: 1px solid var(--border); border-radius: 8px;
    padding: 9px 11px; font-size: 11px; line-height: 1.7; color: var(--text-muted); margin-top: 2px;
  }
  .profile-summary strong { color: var(--text); }
  .sidebar-divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* ── Tab Bar (Vertical on Right) ── */
  .int-tab-bar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: var(--bg);
    border-left: 1px solid var(--border);
    width: 200px;
    min-width: 200px;
    flex-shrink: 0;
    /* Stick to viewport while content scrolls */
    position: sticky;
    top: 0;
    height: calc(100vh - 64px);
    overflow-y: auto;
    align-self: flex-start;
  }
  .int-tab {
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--neutral-dark);
    color: var(--text-muted);
    font-family: "Montserrat", sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    text-align: left;
    width: 100%;
  }
  .int-tab:hover { background: var(--neutral); color: var(--text); }
  .int-tab.active { background: var(--accent); color: var(--primary); border-color: var(--accent); }

  /* ── Main Panel ── */
  .main-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    border-radius: 12px 0 0 12px;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    border: 1px solid var(--border);
    border-right: none;
    margin: 12px 0 12px 12px;
    /* Allow main panel to scroll independently of the sticky tab bar */
    min-height: 0;
  }

  /* ── Chat ── */
  .chat-area { flex: 1; overflow-y: auto; padding: 28px 32px; display: flex; flex-direction: column; gap: 18px; }
  .msg { display: flex; gap: 12px; max-width: 88%; }
  .msg-user { flex-direction: row-reverse; align-self: flex-end; }
  .msg-bubble { padding: 13px 18px; border-radius: 14px; font-size: 14px; line-height: 1.65; }
  .bubble-ai { background: var(--neutral); color: var(--text); border-bottom-left-radius: 3px; }
  .bubble-user { background: var(--primary); color: var(--bg); border-bottom-right-radius: 3px; }
  .bubble-ai strong { color: var(--primary); }
  .bubble-ai h2 { font-size: 17px; color: var(--primary); margin: 14px 0 7px; font-weight: 700; }
  .bubble-ai h3 { font-size: 14px; color: var(--accent-hover); margin: 12px 0 5px; font-weight: 600; }
  .bubble-ai h2:first-child, .bubble-ai h3:first-child { margin-top: 0; }
  .bubble-ai ul { padding-left: 18px; margin: 7px 0; }
  .bubble-ai li { margin-bottom: 3px; font-size: 13px; }
  .bubble-ai code { font-family: "Courier New", monospace; font-size: 12px; background: var(--border); padding: 2px 5px; border-radius: 4px; }
  .bubble-ai table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
  .bubble-ai th { background: var(--primary); color: var(--bg); padding: 8px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .bubble-ai td { padding: 7px 12px; border: 1px solid var(--border); color: var(--text); font-size: 13px; }
  .bubble-ai tr:nth-child(even) td { background: var(--neutral); }
  .td-eligible { background: #f0fdf4 !important; color: #14532d !important; font-weight: 600; }
  .td-conditional { background: #fffbea !important; color: #78350f !important; font-weight: 600; }
  .td-not-eligible { background: #fef2f2 !important; color: #991b1b !important; font-weight: 600; }
  .td-lowest-cost { background: #eff6ff !important; color: #1d4ed8 !important; font-weight: 700; }

  .input-bar { padding: 14px 24px; background: var(--bg); border-top: 1px solid var(--border); flex-shrink: 0; }
  .input-row { display: flex; gap: 10px; align-items: flex-end; }
  .input-box { flex: 1; background: var(--neutral); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; color: var(--text); font-family: "Montserrat", sans-serif; font-size: 14px; resize: none; outline: none; transition: border-color 0.2s; }
  .input-box:focus { border-color: var(--primary); background: var(--bg); }
  .send-btn { background: var(--accent); color: var(--primary); border: none; border-radius: 10px; width: 46px; height: 46px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.2s; flex-shrink: 0; }
  .send-btn:hover { transform: translateY(-1px); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* ── Workflow Panels ── */
  .workflow-panel { flex: 1; overflow-y: auto; padding: 24px 32px; }
  .workflow-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .workflow-sub { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; }

  .filter-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 16px; }
  .filter-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; max-width: 560px; }
  .ff { display: flex; flex-direction: column; gap: 5px; }
  .ff label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .ff select, .ff input {
    padding: 9px 12px; border-radius: 9px; border: 1.5px solid var(--border);
    font-size: 13px; font-family: "Montserrat", sans-serif; outline: none;
    background: var(--bg); color: var(--text); appearance: none; -webkit-appearance: none;
  }
  .ff select:focus, .ff input:focus { border-color: var(--accent); }
  .checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
  .checkbox-row input[type="checkbox"] { width: 15px; height: 15px; cursor: pointer; accent-color: var(--primary); }
  .filter-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 4px; }
  .result-count { font-size: 12px; font-weight: 700; color: var(--text-muted); padding: 6px 12px; background: var(--neutral); border-radius: 6px; border: 1px solid var(--border); }

  .results-box { margin-top: 20px; padding: 20px 24px; background: var(--bg); border-radius: 12px; border: 1px solid var(--border); overflow-x: auto; box-shadow: var(--shadow-sm); }
  .results-box table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .results-box th { background: var(--primary); color: var(--bg); padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  .results-box td { padding: 8px 12px; border: 1px solid var(--border); font-size: 13px; }
  .results-box tr:nth-child(even) td { background: var(--neutral); }
  .results-box h2 { font-size: 16px; margin: 16px 0 8px; color: var(--primary); font-weight: 700; }
  .results-box h3 { font-size: 14px; margin: 12px 0 6px; color: var(--accent-hover); font-weight: 600; }
  .results-box strong { color: var(--primary); }
  .results-box ul { padding-left: 18px; margin: 6px 0; }
  .results-box li { font-size: 13px; margin-bottom: 3px; }
  .results-box code { font-family: "Courier New", monospace; font-size: 12px; background: var(--border); padding: 2px 5px; border-radius: 4px; }
  .results-box .td-eligible { background: #f0fdf4 !important; color: #14532d !important; font-weight: 600; }
  .results-box .td-conditional { background: #fffbea !important; color: #78350f !important; font-weight: 600; }
  .results-box .td-not-eligible { background: #fef2f2 !important; color: #991b1b !important; font-weight: 600; }
  .results-box .td-lowest-cost { background: #eff6ff !important; color: #1d4ed8 !important; font-weight: 700; }
  .export-bar { display: flex; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); flex-wrap: wrap; align-items: center; }

  .warning-box { background: #fffbea; border: 1px solid #fde68a; border-radius: 10px; padding: 11px 15px; font-size: 12px; color: #78350f; margin-bottom: 18px; }
  .info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 11px 15px; font-size: 12px; color: #1e40af; margin-bottom: 18px; }

  /* ── Animations ── */
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes typingDot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.35; } 30% { transform: translateY(-5px); opacity: 1; } }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .header { padding: 0 14px; }
    .header-subtitle { display: none; }
    .internal-wrapper { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
    .int-tab-bar { flex-direction: row; overflow-x: auto; flex-wrap: nowrap; padding: 8px; gap: 4px; width: 100%; border-left: none; border-top: 1px solid var(--border); order: 2; position: sticky; bottom: 0; top: auto; height: auto; z-index: 50; background: var(--bg); }
    .int-tab { padding: 8px 12px; font-size: 11px; min-width: 80px; text-align: center; }
    .main-panel { margin: 0; border-radius: 0; border: none; order: 1; }
    .chat-area { padding: 14px 12px; max-height: calc(100vh - 220px); gap: 14px; }
    .msg { max-width: 94%; }
    .msg-bubble { padding: 10px 13px; font-size: 13px; }
    .input-bar { padding: 10px 12px; }
    .input-box { font-size: 14px; padding: 10px 13px; }
    .send-btn { width: 42px; height: 42px; font-size: 17px; }
    .workflow-panel { padding: 14px 12px; }
    .workflow-title { font-size: 15px; }
    .filter-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
    .filter-grid-2 { grid-template-columns: 1fr; }
    .filter-actions { gap: 8px; }
    .btn-primary, .btn-secondary { padding: 11px 16px; font-size: 13px; }
    .results-box { padding: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .results-box table { min-width: 540px; }
    .results-box th, .results-box td { padding: 7px 9px; font-size: 12px; }
    .bubble-ai table { min-width: 400px; overflow-x: auto; display: block; }
    .bubble-ai th, .bubble-ai td { padding: 6px 8px; font-size: 11px; }
  }

  @media (max-width: 400px) {
    .filter-grid { grid-template-columns: 1fr; }
    .int-tab .tab-label { font-size: 10px; }
    .int-tab { padding: 6px 8px; min-width: 70px; }
  }

  /* ── Print ── */
  @media print {
    .int-tab-bar, .input-bar, .header, .filter-actions, .export-bar { display: none !important; }
    .internal-wrapper { height: auto; overflow: visible; }
    .main-panel { box-shadow: none; border: none; margin: 0; overflow: visible; }
    .workflow-panel { padding: 8px; }
    .results-box { box-shadow: none; border: 1px solid #ccc; page-break-inside: avoid; }
    body { background: white; }
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────
const COURSE_CATEGORIES = {
  "Medicine & Health Sciences":         ["Medicine (MBBS)", "Pharmacy", "Nursing", "Physiotherapy", "Biomedical Sciences"],
  "Business, Management & Marketing":   ["Business Administration", "Marketing", "Digital Marketing", "International Business", "Finance", "Accounting", "HR Management"],
  "Computing & Technology":             ["Computer Science", "Software Engineering", "Cybersecurity", "Data Science", "Artificial Intelligence", "IT Management", "Cloud Engineering"],
  "Engineering":                        ["Mechanical Engineering", "Civil Engineering", "Electrical Engineering", "Chemical Engineering", "Mechatronics", "Biomedical Engineering"],
  "Architecture & Design":              ["Architecture", "Interior Design", "Graphic Design", "Animation & VFX", "Fashion Design"],
  "Hospitality & Tourism":              ["Hospitality Management", "Culinary Arts", "Hotel Management", "Tourism Management"],
  "Law":                                ["LLB Law"],
  "Social Sciences & Psychology":       ["Psychology", "Social Sciences", "Education", "Special Needs Education"],
  "Pre-University":                     ["Foundation in Science", "Foundation in Computing", "Foundation in Business", "Foundation in Arts", "A-Levels"],
  "Postgraduate":                       ["MBA", "MSc Computer Science", "MSc Data Science", "MA Communication", "MSc Engineering"],
};

const GRADE_OPTIONS = {
  "KCSE":     ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "E"],
  "IGCSE":    ["A*", "A", "B", "C", "D", "E", "F"],
  "IB":       ["7", "6", "5", "4", "3", "2", "1"],
  "A-Levels": ["A*", "A", "B", "C", "D", "E"],
  "Other":    ["Distinction", "Merit", "Pass", "Fail"],
};

const OVERALL_PLACEHOLDER = {
  "KCSE": "e.g. B+",  "IGCSE": "e.g. 6 Credits (A–C)",
  "IB": "e.g. 32 pts", "A-Levels": "e.g. ABB", "Other": "e.g. GPA 3.5",
};

const NATIONALITIES = [
  "Kenyan","Ugandan","Tanzanian","Rwandan","Ethiopian","Nigerian","Ghanaian",
  "South African","Zimbabwean","Zambian","Malawian","Congolese (DRC)",
  "Cameroonian","Senegalese","Egyptian","Indian","Pakistani","Sri Lankan",
  "Bangladeshi","Nepalese","Chinese","Other",
];
const EXAM_SYSTEMS   = ["KCSE","IGCSE","IB","A-Levels","Other"];
const LEVELS         = ["Undergraduate","Postgraduate","Foundation","Diploma","PhD"];
const FEE_RANGES     = ["Under USD 10,000/yr","USD 10,000–20,000/yr","USD 20,000–35,000/yr","Over USD 35,000/yr"];
const INTAKES        = ["January","May","September","Rolling"];
const IELTS_BANDS    = ["5.0","5.5","6.0","6.5","7.0","7.5+"];
const WORK_EXP       = ["0 years","1–2 years","3–5 years","5+ years"];
const UNIVERSITIES   = ["APU","SEGi","Sunway","Taylor's","INTI","MSU","University of Cyberjaya","Quest International University"];

const UNIVERSITY_PROGRAMS = {
  "APU": {
    "Computing & Technology": ["Computer Science", "Software Engineering", "Cybersecurity", "Data Science", "Artificial Intelligence", "IT Management"],
    "Business, Management & Marketing": ["Business Administration", "Marketing", "Digital Marketing", "International Business", "Finance", "Accounting"],
    "Engineering": ["Mechanical Engineering", "Electrical Engineering", "Mechatronics"],
    "Architecture & Design": ["Architecture", "Interior Design", "Animation & VFX"],
    "Postgraduate": ["MBA", "MSc Computer Science", "MSc Data Science"]
  },
  "SEGi": {
    "Medicine & Health Sciences": ["Medicine (MBBS)", "Pharmacy", "Nursing", "Physiotherapy", "Biomedical Sciences"],
    "Business, Management & Marketing": ["Business Administration", "Marketing", "International Business", "Finance", "Accounting", "HR Management"],
    "Computing & Technology": ["Computer Science", "Software Engineering", "IT Management"],
    "Engineering": ["Civil Engineering", "Electrical Engineering", "Chemical Engineering"],
    "Pre-University": ["Foundation in Science", "Foundation in Computing", "Foundation in Business"],
    "Postgraduate": ["MBA", "MSc Engineering"]
  },
  "Sunway": {
    "Business, Management & Marketing": ["Business Administration", "Marketing", "Digital Marketing", "International Business", "Finance", "Accounting"],
    "Computing & Technology": ["Computer Science", "Software Engineering", "Data Science", "Cybersecurity"],
    "Medicine & Health Sciences": ["Medicine (MBBS)", "Pharmacy", "Nursing"],
    "Hospitality & Tourism": ["Hospitality Management", "Culinary Arts", "Tourism Management"],
    "Architecture & Design": ["Architecture", "Interior Design", "Graphic Design"],
    "Postgraduate": ["MBA", "MA Communication"]
  },
  "Taylor's": {
    "Medicine & Health Sciences": ["Medicine (MBBS)", "Pharmacy", "Biomedical Sciences"],
    "Business, Management & Marketing": ["Business Administration", "Marketing", "Finance", "Accounting"],
    "Computing & Technology": ["Computer Science", "Software Engineering", "Data Science"],
    "Hospitality & Tourism": ["Hospitality Management", "Culinary Arts", "Hotel Management"],
    "Architecture & Design": ["Architecture", "Interior Design", "Fashion Design"],
    "Law": ["LLB Law"],
    "Postgraduate": ["MBA", "MSc Computer Science"]
  },
  "INTI": {
    "Engineering": ["Mechanical Engineering", "Civil Engineering", "Electrical Engineering", "Chemical Engineering"],
    "Business, Management & Marketing": ["Business Administration", "Marketing", "Finance", "Accounting"],
    "Computing & Technology": ["Computer Science", "Software Engineering", "IT Management"],
    "Medicine & Health Sciences": ["Nursing", "Physiotherapy"],
    "Pre-University": ["Foundation in Science", "Foundation in Computing", "A-Levels"],
    "Postgraduate": ["MBA"]
  },
  "MSU": {
    "Medicine & Health Sciences": ["Medicine (MBBS)", "Pharmacy", "Nursing", "Biomedical Sciences"],
    "Business, Management & Marketing": ["Business Administration", "Marketing", "Finance"],
    "Computing & Technology": ["Computer Science", "IT Management"],
    "Social Sciences & Psychology": ["Psychology", "Education"],
    "Postgraduate": ["MBA", "MSc Engineering"]
  },
  "University of Cyberjaya": {
    "Medicine & Health Sciences": ["Medicine (MBBS)", "Pharmacy", "Nursing", "Physiotherapy", "Biomedical Sciences"],
    "Computing & Technology": ["Computer Science", "Cybersecurity", "Data Science"],
    "Business, Management & Marketing": ["Business Administration", "Marketing"],
    "Social Sciences & Psychology": ["Psychology", "Special Needs Education"],
    "Postgraduate": ["MBA", "MSc Computer Science"]
  },
  "Quest International University": {
    "Medicine & Health Sciences": ["Medicine (MBBS)", "Pharmacy", "Nursing"],
    "Business, Management & Marketing": ["Business Administration", "International Business"],
    "Computing & Technology": ["Computer Science", "Software Engineering"],
    "Social Sciences & Psychology": ["Psychology", "Education"],
    "Pre-University": ["Foundation in Science", "Foundation in Business"]
  }
};

const DELIVERY_MODES = ["On-campus","Online","Hybrid"];
const ELIG_STATUS    = ["All results","Eligible only (✓)","Conditional (⚠)","Not eligible (✗)"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\|(.+)\|/g, (m, row) => {
      const cells = row.split("|").map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return "";
      return "<tr>" + cells.map(c => `<td>${c}</td>`).join("") + "</tr>";
    });

  html = html.replace(/(<tr>.*?<\/tr>\s*)+/gs, match => {
    const rows = match.trim().split(/\n/);
    let result = "<table>";
    rows.forEach((row, i) => {
      if (i === 0) result += row.replace(/<td>/g, "<th>").replace(/<\/td>/g, "</th>");
      else result += row;
    });
    return result + "</table>";
  });

  html = html
    .replace(/<td>([^<]*✓[^<]*)<\/td>/g, '<td class="td-eligible">$1</td>')
    .replace(/<td>([^<]*⚠[^<]*)<\/td>/g, '<td class="td-conditional">$1</td>')
    .replace(/<td>([^<]*✗[^<]*)<\/td>/g, '<td class="td-not-eligible">$1</td>');

  html = html.replace(/^- (.+)$/gm, "<li>$1</li>").replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
  html = html.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>");
  html = "<p>" + html + "</p>";
  html = html
    .replace(/<p><h3>/g, "<h3>").replace(/<\/h3><\/p>/g, "</h3>")
    .replace(/<p><h2>/g, "<h2>").replace(/<\/h2><\/p>/g, "</h2>")
    .replace(/<p><ul>/g, "<ul>").replace(/<\/ul><\/p>/g, "</ul>")
    .replace(/<p><table>/g, "<table>").replace(/<\/table><\/p>/g, "</table>")
    .replace(/<p><\/p>/g, "");
  return html;
}

function extractResultCount(html) {
  const matches = html.match(/<tr>/g);
  if (!matches || matches.length < 2) return null;
  return matches.length - 1;
}

async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

const SESSION_ID = Math.random().toString(36).slice(2);

// ─── FIX 1: Broadened response key parsing ────────────────────────────────────
// n8n agent nodes can return text under different keys depending on version and
// node type. This chain tries every known key before falling back to JSON.stringify.
async function callWebhook(message, mode) {
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode, sessionId: SESSION_ID }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();

  // n8n can return arrays or plain objects
  const result = Array.isArray(data) ? data[0] : data;

  // Helper: return value only if it's a non-empty string
  const nonEmpty = (v) => (typeof v === "string" && v.trim() !== "" ? v : undefined);

  // Try every key n8n agent nodes use, in order of likelihood.
  // Using nonEmpty() prevents an empty "" from blocking the fallback chain.
  const text =
    nonEmpty(result?.output) ||
    nonEmpty(result?.response) ||
    nonEmpty(result?.text) ||
    nonEmpty(result?.message) ||
    nonEmpty(result?.data?.output) ||
    nonEmpty(result?.data?.response) ||
    nonEmpty(result?.json?.output) ||
    nonEmpty(result?.json?.response) ||
    (typeof result === "string" && result.trim() !== "" ? result : undefined);

  if (!text) {
    // Surface the raw n8n payload so the counselor can see what came back
    const raw = JSON.stringify(result);
    throw new Error(
      raw === '{"output":""}' || raw === "{}"
        ? "Agent returned an empty response. In n8n, open the LLM — Internal node and raise maxTokens to at least 2000, then save and re-activate the workflow."
        : `Unexpected response from agent: ${raw}`
    );
  }

  return text.replace(/\\n/g, "\n");
}

// ─── Typewriter Hook ──────────────────────────────────────────────────────────
function useTypewriter(speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping]   = useState(false);
  const queueRef = useRef([]); const timerRef = useRef(null); const fullRef = useRef("");

  const stream = useCallback((text) => {
    if (timerRef.current) clearInterval(timerRef.current);
    fullRef.current = text; queueRef.current = text.split(" ");
    setDisplayed(""); setIsTyping(true);
    timerRef.current = setInterval(() => {
      if (queueRef.current.length === 0) { clearInterval(timerRef.current); setIsTyping(false); return; }
      const next = queueRef.current.shift();
      setDisplayed(prev => prev + (prev ? " " : "") + next);
    }, speed);
  }, [speed]);

  const flush = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplayed(fullRef.current); queueRef.current = []; setIsTyping(false);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);
  return { displayed, isTyping, stream, flush };
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ label = "Retrieving from knowledge base…" }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 20px" }}>
      <div style={{ width: 38, height: 38, margin: "0 auto 12px", border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 0.85s linear infinite" }} />
      <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{label}</p>
    </div>
  );
}

// ─── Internal Mode ────────────────────────────────────────────────────────────
function InternalMode() {
  const [tab, setTab] = useState("chat");

  const BLANK_PROFILE = {
    nationality: "", examSystem: "", overallGrade: "",
    subjects: { English: "", Mathematics: "", Biology: "", Chemistry: "", Physics: "" },
    ielts: "", workExp: "0 years", postStudy: false,
  };
  const [profile, setProfile] = useState(BLANK_PROFILE);
  const setP   = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const setSub = (k, v) => setProfile(p => ({ ...p, subjects: { ...p.subjects, [k]: v } }));
  const clearProfile = () => setProfile(BLANK_PROFILE);

  // ── Chat Tab ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const { displayed: streamedText, isTyping, stream: startStream, flush } = useTypewriter(30);
  const [streamingIndex, setStreamingIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatLoading]);

  const sendMessage = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput(""); setChatLoading(true);
    let aiIdx;
    setMessages(m => { aiIdx = m.length + 1; return [...m, { role: "user", text: msg }, { role: "ai", text: "" }]; });
    try {
      const reply = await callWebhook(msg, "internal");
      setTimeout(() => setStreamingIndex(aiIdx), 0);
      startStream(reply);
    } catch (e) {
      setMessages(m => m.map((item, i) => i === aiIdx ? { ...item, text: "⚠️ Error: " + e.message } : item));
      setStreamingIndex(null);
    } finally { setChatLoading(false); }
  }, [input, startStream]);

  useEffect(() => {
    if (streamingIndex === null || isTyping || !streamedText) return;
    setMessages(m => m.map((item, i) => i === streamingIndex ? { ...item, text: streamedText } : item));
    setStreamingIndex(null);
  }, [isTyping]);

  const handleKeyDown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // ── Profile string helper — injects student context into workflow queries ──
  const profileStr = () => {
    const parts = [];
    if (profile.nationality) parts.push(profile.nationality + " student");
    if (profile.examSystem && profile.overallGrade) parts.push(profile.examSystem + " overall: " + profile.overallGrade);
    const subs = Object.entries(profile.subjects).filter(([, v]) => v).map(([k, v]) => k + ": " + v).join(", ");
    if (subs) parts.push("grades: " + subs);
    if (profile.ielts) parts.push("IELTS " + profile.ielts);
    if (profile.workExp !== "0 years") parts.push(profile.workExp + " work experience");
    if (profile.postStudy) parts.push("post-study work is a priority");
    return parts.length ? parts.join(", ") : "";
  };

  // ── Find Options Tab ───────────────────────────────────────────────────────
  const BLANK_FILTERS = { field: "", level: "", feeRange: "", intake: "", delivery: "", scholarship: false, postStudy: false, eligStatus: "All results" };
  const [filters, setFilters]       = useState(BLANK_FILTERS);
  const setF = (k, v)               => setFilters(f => ({ ...f, [k]: v }));
  const [findResult, setFindResult]     = useState(null);
  const [findRaw, setFindRaw]           = useState("");
  const [findLoading, setFindLoading]   = useState(false);
  const [resultCount, setResultCount]   = useState(null);
  const [copySuccess, setCopySuccess]   = useState(false);

  // ─── runFind — compact output to stay within 1000 output token limit ─────────
  const runFind = async () => {
    setFindLoading(true); setFindResult(null); setFindRaw(""); setResultCount(null);
    const ps = profileStr();
    const q = [
      `List ${filters.field || "all"} programmes, ${filters.level || "degree"} level.`,
      filters.feeRange    ? `Fee: ${filters.feeRange}.`         : "",
      filters.intake      ? `Intake: ${filters.intake}.`        : "",
      filters.scholarship ? `Scholarships only.`                : "",
      filters.postStudy   ? `Post-study permit required.`       : "",
      filters.eligStatus !== "All results" ? `${filters.eligStatus} only.` : "",
      ps                  ? `Student: ${ps}.`                   : "",
      `Compact table only — no prose: Programme | University | Fee/yr (USD) | Duration | Eligibility (✓/⚠/✗) | Entry Requirements. Max 10 rows.`,
    ].filter(Boolean).join(" ");

    try {
      const r = await callWebhook(q, "internal");
      setFindRaw(r);
      const html = formatMarkdown(r);
      setFindResult(html);
      setResultCount(extractResultCount(html));
    } catch (e) {
      setFindResult(formatMarkdown("⚠️ Error: " + e.message));
    } finally { setFindLoading(false); }
  };

  const handleCopy = async (raw) => {
    const ok = await copyToClipboard(raw);
    if (ok) { setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2500); }
  };

  // ── Eligibility Check Tab ──────────────────────────────────────────────────
  const [eligTarget, setEligTarget]   = useState({ fieldOfStudy: "", course: "", university: "" });
  const [eligResult, setEligResult]   = useState(null);
  const [eligRaw, setEligRaw]         = useState("");
  const [eligLoading, setEligLoading] = useState(false);

  // ─── FIX 2b: Condensed Eligibility query ──────────────────────────────────
  const runEligibility = async () => {
    setEligLoading(true); setEligResult(null); setEligRaw("");

    const subjectGrades = Object.entries(profile.subjects)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ");

    // Query is kept deliberately compact so the agent response fits within 1000 output tokens.
    // Format requested is a tight structured block — no prose paragraphs.
    const q = [
      `Eligibility check.`,
      profile.nationality ? `Nationality: ${profile.nationality}.` : "",
      `${profile.examSystem} overall: ${profile.overallGrade}.`,
      subjectGrades ? `Grades: ${subjectGrades}.` : "",
      profile.ielts ? `IELTS: ${profile.ielts}.` : "",
      profile.workExp && profile.workExp !== "0 years" ? `Work exp: ${profile.workExp}.` : "",
      `Programme: ${eligTarget.course}${eligTarget.university ? " at " + eligTarget.university : ""}.`,
      `Return ONLY this format — no prose:`,
      `BAND: [GREEN/YELLOW/RED] | VERDICT: [eligibility_band] | PATHWAY: [recommended_pathway] | ENGLISH: [english_pathway] | CREDITS: [total_credits] — [credit_subjects]`,
      `UNIVERSITIES: [eligible_universities]`,
      `CONDITIONS: [conditions_to_note — one per line, or NONE]`,
      `GAP (if RED): [one sentence to student] | QUALIFIES FOR: [Programme — University]`,
    ].filter(Boolean).join(" ");

    try {
      const r = await callWebhook(q, "internal");
      setEligRaw(r); setEligResult(formatMarkdown(r));
    } catch (e) {
      setEligResult(formatMarkdown("⚠️ Error: " + e.message));
    } finally { setEligLoading(false); }
  };

  // ── Compare Tab ────────────────────────────────────────────────────────────
  const [compItems, setCompItems]     = useState([]);
  const [compUni, setCompUni]         = useState("");
  const [compProg, setCompProg]       = useState("");
  const [compResult, setCompResult]   = useState(null);
  const [compRaw, setCompRaw]         = useState("");
  const [compLoading, setCompLoading] = useState(false);

  const addComp = () => {
    if (!compUni || !compProg) return;
    const label = compUni + " — " + compProg;
    if (!compItems.includes(label) && compItems.length < 3) {
      setCompItems(prev => [...prev, label]);
      setCompUni(""); setCompProg("");
    }
  };

  // ─── runCompare — compact output to stay within 1000 output token limit ──────
  const runCompare = async () => {
    setCompLoading(true); setCompResult(null); setCompRaw("");
    const ps = profileStr();

    const q = [
      `Compare: ${compItems.join(" vs ")}.`,
      ps ? `Student: ${ps}.` : "",
      `Compact comparison table, rows only — no prose: Annual Fee (USD) | Duration | Eligibility (✓/⚠/✗) | Scholarship | Post-Study Permit | Entry Requirements.`,
      `Missing data → "Not in source". Highlight lowest cost. No living cost estimates.`,
    ].filter(Boolean).join(" ");

    try {
      const r = await callWebhook(q, "internal");
      setCompRaw(r); setCompResult(formatMarkdown(r));
    } catch (e) {
      setCompResult(formatMarkdown("⚠️ Error: " + e.message));
    } finally { setCompLoading(false); }
  };

  return (
    <div className="internal-wrapper">

      {/* ══ Main Content Panel ══════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, minHeight: 0 }}>
        <div className="main-panel">

          {/* ── Chat Tab ──────────────────────────────────────────────────── */}
          {tab === "chat" && (
            <>
              <div className="chat-area">
                {messages.length === 0 ? (
                  <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Counselor Knowledge Agent</div>
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`msg ${m.role === "user" ? "msg-user" : ""}`}>
                      <div className={`msg-bubble ${m.role === "ai" ? "bubble-ai" : "bubble-user"}`}>
                        {m.role === "ai"
                          ? <div dangerouslySetInnerHTML={{ __html: formatMarkdown(i === streamingIndex ? streamedText : m.text) }} />
                          : m.text}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && !isTyping && (
                  <div className="msg">
                    <div className="msg-bubble bubble-ai" style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 18px" }}>
                      {[0, 0.2, 0.4].map(d => (
                        <span key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block", animation: `typingDot 1s infinite ${d}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                {isTyping && (
                  <div style={{ textAlign: "right", paddingRight: 12 }}>
                    <button onClick={flush} style={{ background: "none", border: "none", fontSize: 11, color: "var(--text-muted)", cursor: "pointer", textDecoration: "underline" }}>Skip →</button>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="input-bar">
                <div className="input-row">
                  <textarea className="input-box" placeholder="Ask anything…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1} />
                  <button className="send-btn" disabled={!input.trim() || chatLoading} onClick={() => sendMessage()}>↑</button>
                </div>
              </div>
            </>
          )}

          {/* ── Find Options Tab ──────────────────────────────────────────── */}
          {tab === "find" && (
            <div className="workflow-panel">
              <div className="workflow-title">🔍 Find Matching Programmes</div>

              <div className="filter-grid">
                <div className="ff">
                  <label>Field of Study *</label>
                  <select value={filters.field} onChange={e => setF("field", e.target.value)}>
                    <option value="">Select field…</option>
                    {Object.keys(COURSE_CATEGORIES).map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="ff">
                  <label>Qualification Level *</label>
                  <select value={filters.level} onChange={e => setF("level", e.target.value)}>
                    <option value="">Select level…</option>
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="ff">
                  <label>Annual Fee Range</label>
                  <select value={filters.feeRange} onChange={e => setF("feeRange", e.target.value)}>
                    <option value="">Any budget</option>
                    {FEE_RANGES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="ff">
                  <label>Intake Month</label>
                  <select value={filters.intake} onChange={e => setF("intake", e.target.value)}>
                    <option value="">Any intake</option>
                    {INTAKES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="ff">
                  <label>Delivery Mode</label>
                  <select value={filters.delivery} onChange={e => setF("delivery", e.target.value)}>
                    <option value="">Any</option>
                    {DELIVERY_MODES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="ff">
                  <label>Eligibility Status</label>
                  <select value={filters.eligStatus} onChange={e => setF("eligStatus", e.target.value)}>
                    {ELIG_STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 18 }}>
                <label className="checkbox-row">
                  <input type="checkbox" checked={filters.scholarship} onChange={e => setF("scholarship", e.target.checked)} />
                  Scholarships only
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" checked={filters.postStudy} onChange={e => setF("postStudy", e.target.checked)} />
                  Post-study work permit required
                </label>
              </div>

              <div className="filter-actions">
                <button className="btn-primary" style={{ maxWidth: 210 }} disabled={!filters.field || !filters.level || findLoading} onClick={runFind}>
                  {findLoading ? "Searching…" : "Search Programmes →"}
                </button>
                <button className="btn-secondary" style={{ maxWidth: 90 }} onClick={() => { setFilters(BLANK_FILTERS); setFindResult(null); setResultCount(null); }}>
                  Reset All
                </button>
                {resultCount !== null && (
                  <div className="result-count">📊 {resultCount} programme{resultCount !== 1 ? "s" : ""} found</div>
                )}
              </div>

              {findLoading && <Spinner label="Searching programmes across all 7 universities…" />}

              {findResult && !findLoading && (
                <div className="results-box">
                  <div dangerouslySetInnerHTML={{ __html: findResult }} />
                  <div className="export-bar">
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setTab("compare")}>Move to Compare →</button>
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => window.print()}>🖨️ Print / Save PDF</button>
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => handleCopy(findRaw)}>
                      {copySuccess ? "✓ Copied!" : "📋 Copy Results"}
                    </button>
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => { setFindResult(null); setResultCount(null); }}>Clear</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Eligibility Check Tab ─────────────────────────────────────── */}
          {tab === "eligibility" && (
            <div className="workflow-panel">
              <div className="workflow-title">✅ Eligibility Check</div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--primary)" }}>Student Profile</div>

                <div className="filter-grid" style={{ marginBottom: 16 }}>
                  <div className="ff">
                    <label>Nationality</label>
                    <select value={profile.nationality} onChange={e => setP("nationality", e.target.value)}>
                      <option value="">Select nationality…</option>
                      {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="ff">
                    <label>Exam System</label>
                    <select value={profile.examSystem} onChange={e => setP("examSystem", e.target.value)}>
                      <option value="">Select…</option>
                      {EXAM_SYSTEMS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="ff">
                    <label>Overall Grade</label>
                    <input
                      placeholder={profile.examSystem ? OVERALL_PLACEHOLDER[profile.examSystem] : "Select exam first"}
                      value={profile.overallGrade}
                      onChange={e => setP("overallGrade", e.target.value)}
                      disabled={!profile.examSystem} />
                  </div>
                </div>

                {profile.examSystem && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase" }}>Subject Grades</div>
                    <div className="filter-grid">
                      {Object.keys(profile.subjects).map(sub => (
                        <div className="ff" key={sub}>
                          <label>{sub}</label>
                          <select value={profile.subjects[sub]} onChange={e => setSub(sub, e.target.value)}>
                            <option value="">–</option>
                            {(GRADE_OPTIONS[profile.examSystem] || GRADE_OPTIONS["KCSE"]).map(g => <option key={g}>{g}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="filter-grid" style={{ marginBottom: 16 }}>
                  <div className="ff">
                    <label>IELTS Band</label>
                    <select value={profile.ielts} onChange={e => setP("ielts", e.target.value)}>
                      <option value="">Not taken / N/A</option>
                      {IELTS_BANDS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="ff">
                    <label>Work Experience</label>
                    <select value={profile.workExp} onChange={e => setP("workExp", e.target.value)}>
                      {WORK_EXP.map(w => <option key={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="ff" style={{ display: "flex", alignItems: "center", paddingTop: 20 }}>
                    <label className="checkbox-row">
                      <input type="checkbox" checked={profile.postStudy} onChange={e => setP("postStudy", e.target.checked)} />
                      Post-study work priority
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <button className="btn-secondary" onClick={clearProfile}>Clear Profile</button>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--primary)" }}>Programme Selection</div>

                <div className="filter-grid-2">
                  <div className="ff">
                    <label>Field of Study *</label>
                    <select value={eligTarget.fieldOfStudy} onChange={e => {
                      setEligTarget(t => ({ ...t, fieldOfStudy: e.target.value, course: "" }));
                    }}>
                      <option value="">Select field…</option>
                      {Object.keys(COURSE_CATEGORIES).map(field => <option key={field}>{field}</option>)}
                    </select>
                  </div>
                  <div className="ff">
                    <label>Programme / Course *</label>
                    <select value={eligTarget.course} onChange={e => setEligTarget(t => ({ ...t, course: e.target.value }))} disabled={!eligTarget.fieldOfStudy}>
                      <option value="">Select programme…</option>
                      {eligTarget.fieldOfStudy && COURSE_CATEGORIES[eligTarget.fieldOfStudy]?.map(course =>
                        <option key={course}>{course}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="filter-grid-2">
                  <div className="ff">
                    <label>University (optional)</label>
                    <select value={eligTarget.university} onChange={e => setEligTarget(t => ({ ...t, university: e.target.value }))}>
                      <option value="">All 7 partner universities</option>
                      {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="filter-actions">
                <button className="btn-primary" style={{ maxWidth: 260 }}
                  disabled={!eligTarget.course || !profile.examSystem || !profile.overallGrade || eligLoading}
                  onClick={runEligibility}>
                  {eligLoading ? "Running eligibility check…" : "Run Full Eligibility Check →"}
                </button>
                <button className="btn-secondary" style={{ maxWidth: 80 }} onClick={() => {
                  setEligResult(null);
                  setEligTarget({ fieldOfStudy: "", course: "", university: "" });
                }}>
                  Clear
                </button>
              </div>

              {(!profile.examSystem || !profile.overallGrade) && (
                <div className="warning-box" style={{ marginTop: 16 }}>
                  ⚠️ Please fill in Exam System and Overall Grade in the Student Profile section above for an accurate eligibility check.
                </div>
              )}

              {eligLoading && <Spinner label="Running Calculate_Eligibility + checking all criteria…" />}

              {eligResult && !eligLoading && (
                <div className="results-box">
                  <div dangerouslySetInnerHTML={{ __html: eligResult }} />
                  <div className="export-bar">
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setTab("compare")}>Move to Compare →</button>
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => window.print()}>🖨️ Print / Save PDF</button>
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => handleCopy(eligRaw)}>
                      {copySuccess ? "✓ Copied!" : "📋 Copy Results"}
                    </button>
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setEligResult(null)}>Clear</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Compare Tab ───────────────────────────────────────────────── */}
          {tab === "compare" && (
            <div className="workflow-panel">
              <div className="workflow-title">⚖️ Compare Programmes</div>

              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div className="ff" style={{ flex: "1 1 180px", minWidth: 150 }}>
                  <label>University</label>
                  <select value={compUni} onChange={e => { setCompUni(e.target.value); setCompProg(""); }}>
                    <option value="">Select university…</option>
                    {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="ff" style={{ flex: "2 1 220px", minWidth: 180 }}>
                  <label>Programme</label>
                  <select value={compProg} onChange={e => setCompProg(e.target.value)} disabled={!compUni}>
                    <option value="">Select programme…</option>
                    {compUni && UNIVERSITY_PROGRAMS[compUni] && Object.entries(UNIVERSITY_PROGRAMS[compUni]).map(([category, programs]) => (
                      <optgroup key={category} label={category}>
                        {programs.map(p => <option key={p} value={p}>{p}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <button
                  className="btn-secondary"
                  onClick={addComp}
                  disabled={!compUni || !compProg || compItems.length >= 3}
                  style={{ flex: "0 0 auto", alignSelf: "flex-end" }}>
                  + Add
                </button>
              </div>

              {compItems.length >= 3 && (
                <div className="info-box" style={{ marginBottom: 12 }}>Maximum 3 programmes reached. Remove one before adding another.</div>
              )}

              {compItems.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {compItems.map((item, i) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--neutral)", padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--primary)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                      {item}
                      <button onClick={() => setCompItems(c => c.filter(x => x !== item))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-muted)", lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {compItems.length < 2 && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
                  Select a university first, then a programme, then click + Add. Add at least 2 to compare (max 3).
                </div>
              )}

              <div className="filter-actions">
                <button className="btn-primary" style={{ maxWidth: 230 }} disabled={compItems.length < 2 || compLoading} onClick={runCompare}>
                  {compLoading ? "Generating comparison…" : "Generate Comparison →"}
                </button>
                <button className="btn-secondary" style={{ maxWidth: 90 }} onClick={() => { setCompItems([]); setCompResult(null); setCompUni(""); setCompProg(""); }}>
                  Clear All
                </button>
              </div>

              {compLoading && <Spinner label="Calling Retrieve_Fees, Retrieve_Prospectus, and Retrieve_Application_Forms…" />}

              {compResult && !compLoading && (
                <div className="results-box">
                  <div dangerouslySetInnerHTML={{ __html: compResult }} />
                  <div className="export-bar">
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => window.print()}>🖨️ Print / Save PDF</button>
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => handleCopy(compRaw)}>
                      {copySuccess ? "✓ Copied!" : "📋 Copy Results"}
                    </button>
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setCompResult(null)}>Clear</button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ══ Vertical Tab Bar (Right Side) ══════════════════════════════════ */}
      <div className="int-tab-bar">
        {[
          { id: "chat",        icon: "💬", label: "Agent"       },
          { id: "find",        icon: "🔍", label: "Find"        },
          { id: "eligibility", icon: "✅", label: "Eligibility" },
          { id: "compare",     icon: "⚖️",  label: "Compare"    },
        ].map(t => (
          <button key={t.id} className={`int-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span> <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}

// ─── Counselor Login ──────────────────────────────────────────────────────────
function CounselorLogin({ onSuccess }) {
  const [pin, setPin]     = useState("");
  const [error, setError] = useState("");

  const attempt = () => {
    if (pin === "thecraftcatalyst123") {
      sessionStorage.setItem("crafted_auth", "1");
      onSuccess();
    } else {
      setError("Incorrect password. Try again.");
      setPin("");
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--neutral)", padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🔐</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Counselors Console</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28 }}>Enter your access password to continue.</p>
        <div className="field-group" style={{ marginBottom: 16 }}>
          <input type="password" placeholder="Password" value={pin}
            onChange={e => { setPin(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && attempt()}
            style={{ textAlign: "center", letterSpacing: "3px", fontSize: 18 }} autoFocus />
        </div>
        {error && <div style={{ color: "var(--error)", fontSize: 12, marginBottom: 14 }}>{error}</div>}
        <button className="btn-primary" onClick={attempt} disabled={!pin}>Access Console →</button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("crafted_auth") === "1");

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="header">
          <div className="header-logo">Craft<span>Ed</span></div>
          <span className="header-subtitle">Counselors Console</span>
          {authed && (
            <button className="signout-btn"
              onClick={() => { sessionStorage.removeItem("crafted_auth"); window.location.reload(); }}>
              Sign Out
            </button>
          )}
        </header>
        {authed ? <InternalMode /> : <CounselorLogin onSuccess={() => setAuthed(true)} />}
      </div>
    </>
  );
}
