// Navigation Items
export const NAVIGATION_ITEMS = [
  { id: 'upload', label: 'Upload OMR Sheets', icon: 'Upload' },
  { id: 'results', label: 'View Results', icon: 'BarChart3' },
] as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  TH_LOW: 0.3,
  TH_HIGH: 0.8,
  flag_rate_target: 0.05,
  use_mock_llm: true
} as const;

// Export Formats
export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV Spreadsheet' },
  { value: 'xlsx', label: 'Excel Workbook' },
  { value: 'pdf', label: 'PDF Report' },
  { value: 'json', label: 'JSON Data' },
] as const;

// Report Types
export const REPORT_TYPES = [
  { value: 'overlay', label: 'Overlay Images (ZIP)' },
  { value: 'analysis', label: 'Analysis Report (PDF)' },
  { value: 'flagged', label: 'Flagged Sheets Only' },
] as const;

// Demo Script Steps
export const DEMO_SCRIPT_STEPS = [
  {
    title: "1. Authentication & Upload",
    description: "Show token input, then demonstrate single/bulk upload with drag-and-drop"
  },
  {
    title: "2. Processing & Results", 
    description: "Navigate to processing queue, then results dashboard with filtering"
  },
  {
    title: "3. Interactive Review",
    description: "Open a flagged sheet, show bubble overlay, make corrections, get AI explanation"
  },
  {
    title: "4. Analytics & Export",
    description: "Show analytics dashboard and export functionality"
  }
] as const;
