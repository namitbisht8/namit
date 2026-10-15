/**
 * Kavach Enterprise PII Detection & Sanitization Module
 * Separate, fully testable zero-retention privacy engine with:
 * - Verhoeff Checksum for Aadhaar validation
 * - 4th Character Holder Type validation for Indian Income Tax PAN
 * - Indian Mobile (+91, 0, spaced, hyphenated, 6-9 prefix)
 * - RFC Email, 11-char IFSC (5th char 0), UPI IDs (name@bank)
 * - Credit Cards with Luhn Checksum Algorithm
 * - Normalization for Zero-width Characters & Line breaks
 */

// -------------------------------------------------------------
// 1. Verhoeff Checksum Algorithm for Aadhaar
// -------------------------------------------------------------
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a number string using the Verhoeff checksum algorithm
 */
export function validateVerhoeff(numStr: string): boolean {
  const cleanDigits = numStr.replace(/\D/g, '');
  if (cleanDigits.length !== 12) return false;
  // Aadhaar rule: first digit must be between 2 and 9
  if (cleanDigits[0] < '2' || cleanDigits[0] > '9') return false;

  let c = 0;
  const digits = cleanDigits.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  return c === 0;
}

/**
 * Calculates the Verhoeff check digit for an 11-digit base string
 */
export function generateVerhoeffCheckDigit(base11: string): number {
  let c = 0;
  const digits = base11.replace(/\D/g, '').split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][digits[i]]];
  }
  return VERHOEFF_INV[c];
}

// -------------------------------------------------------------
// 2. Luhn Checksum Algorithm for Credit Cards
// -------------------------------------------------------------
export function validateLuhn(ccStr: string): boolean {
  const digits = ccStr.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// -------------------------------------------------------------
// 3. PAN Holder Type Validation
// -------------------------------------------------------------
const VALID_PAN_HOLDER_TYPES = new Set(['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G']);

export function validatePanStructure(panStr: string): boolean {
  const clean = panStr.toUpperCase().trim();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean)) return false;
  const fourthChar = clean.charAt(3);
  return VALID_PAN_HOLDER_TYPES.has(fourthChar);
}

// -------------------------------------------------------------
// 4. IFSC Code Validation
// -------------------------------------------------------------
export function validateIFSC(ifscStr: string): boolean {
  const clean = ifscStr.toUpperCase().trim();
  // 11 chars: 4 alpha bank code, 5th char strictly '0', 6 alphanumeric branch code
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean);
}

// -------------------------------------------------------------
// 5. UPI ID Validation (name@bank)
// -------------------------------------------------------------
export function validateUPI(upiStr: string): boolean {
  const clean = upiStr.toLowerCase().trim();
  if (!clean.includes('@')) return false;
  // Should not look like a standard email with dot in domain part (e.g. .com, .in, .org)
  const parts = clean.split('@');
  if (parts.length !== 2) return false;
  const [handle, psp] = parts;
  if (!handle || !psp) return false;
  if (handle.length < 2 || handle.length > 256) return false;
  if (psp.length < 2 || psp.length > 64) return false;

  // Handles common UPI providers or general alphanumeric handle
  const isValidHandle = /^[a-zA-Z0-9.\-_]+$/.test(handle);
  const isValidPsp = /^[a-zA-Z0-9]+$/.test(psp);
  return isValidHandle && isValidPsp;
}

// -------------------------------------------------------------
// 6. Indian Mobile Number Validation
// -------------------------------------------------------------
export function validateIndianMobile(phoneStr: string): boolean {
  const clean = phoneStr.replace(/[\s\-()]/g, '');
  // Match +91, 91, or 0 followed by 10 digits starting with 6-9
  if (/^\+91[6-9]\d{9}$/.test(clean)) return true;
  if (/^91[6-9]\d{9}$/.test(clean)) return true;
  if (/^0[6-9]\d{9}$/.test(clean)) return true;
  if (/^[6-9]\d{9}$/.test(clean)) return true;
  return false;
}

// -------------------------------------------------------------
// Types & Result Interfaces (Zero-Retention by Design)
// -------------------------------------------------------------
export type PIIType =
  | 'Aadhaar Card'
  | 'PAN Card'
  | 'Indian Mobile'
  | 'Email Address'
  | 'IFSC Code'
  | 'UPI ID'
  | 'Credit Card';

export interface PIIDetectionFinding {
  type: PIIType;
  category: 'identity' | 'financial' | 'contact';
  position: {
    start: number;
    end: number;
    line?: number;
  };
  confidence: number;
  placeholder: string;
}

export interface PIIScanResult {
  hasPII: boolean;
  totalEntities: number;
  findings: PIIDetectionFinding[];
  sanitizedText: string;
  typeCounts: Record<PIIType, number>;
  normalizedSourceLength: number;
  executionTimeMs: number;
}

// -------------------------------------------------------------
// Normalizer for Obfuscated / Zero-width PII
// -------------------------------------------------------------
export function stripZeroWidth(str: string): string {
  // \u200B zero-width space, \u200C zwnj, \u200D zwj, \uFEFF bom, \u2060 word joiner, \u00AD soft hyphen
  return str.replace(/[\u200B\u200C\u200D\uFEFF\u2060\u00AD\u200E\u200F]/g, '');
}

/**
 * Detects and redacts PII across the provided text string
 * Performs Verhoeff checksum for Aadhaar and Luhn algorithm for cards.
 * Replaces values with typed placeholders:
 * [AADHAAR_REDACTED], [PAN_REDACTED], [PHONE_REDACTED], [EMAIL_REDACTED],
 * [IFSC_REDACTED], [UPI_REDACTED], [CARD_REDACTED]
 */
export function scanAndSanitizePII(text: string): PIIScanResult {
  const startTime = performance.now();
  const cleanedText = stripZeroWidth(text);

  const findings: PIIDetectionFinding[] = [];
  const typeCounts: Record<PIIType, number> = {
    'Aadhaar Card': 0,
    'PAN Card': 0,
    'Indian Mobile': 0,
    'Email Address': 0,
    'IFSC Code': 0,
    'UPI ID': 0,
    'Credit Card': 0,
  };

  // We build a list of replacements to apply without mutating strings mid-index
  interface ReplacementSpan {
    start: number;
    end: number;
    placeholder: string;
    finding: PIIDetectionFinding;
  }
  const spans: ReplacementSpan[] = [];

  // Helper to test overlap
  const overlaps = (start: number, end: number) => {
    return spans.some((s) => Math.max(s.start, start) < Math.min(s.end, end));
  };

  // 1. Scan Aadhaar with Verhoeff Checksum: 12 digits, 1st digit 2-9, optional 4-4-4 spaces/hyphens
  // Pattern also checks potential line-breaks or zero-width splits
  const aadhaarRegex = /\b[2-9]\d{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b/g;
  let match: RegExpExecArray | null;

  while ((match = aadhaarRegex.exec(cleanedText)) !== null) {
    const rawVal = match[0];
    if (validateVerhoeff(rawVal)) {
      const start = match.index;
      const end = start + rawVal.length;
      if (!overlaps(start, end)) {
        const finding: PIIDetectionFinding = {
          type: 'Aadhaar Card',
          category: 'identity',
          position: { start, end },
          confidence: 0.99,
          placeholder: '[AADHAAR_REDACTED]',
        };
        spans.push({ start, end, placeholder: finding.placeholder, finding });
        findings.push(finding);
        typeCounts['Aadhaar Card']++;
      }
    }
  }

  // 2. Scan Credit Card with Luhn check (13 to 19 digits)
  const ccRegex = /\b(?:\d{4}[\s\-]?){3,4}\d{1,4}\b/g;
  while ((match = ccRegex.exec(cleanedText)) !== null) {
    const rawVal = match[0];
    const digitsOnly = rawVal.replace(/\D/g, '');
    if (digitsOnly.length >= 13 && digitsOnly.length <= 19 && validateLuhn(rawVal)) {
      const start = match.index;
      const end = start + rawVal.length;
      if (!overlaps(start, end)) {
        const finding: PIIDetectionFinding = {
          type: 'Credit Card',
          category: 'financial',
          position: { start, end },
          confidence: 0.98,
          placeholder: '[CARD_REDACTED]',
        };
        spans.push({ start, end, placeholder: finding.placeholder, finding });
        findings.push(finding);
        typeCounts['Credit Card']++;
      }
    }
  }

  // 3. Scan Indian PAN: [A-Z]{5}[0-9]{4}[A-Z] with 4th letter holder check
  const panRegex = /\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b/g;
  while ((match = panRegex.exec(cleanedText)) !== null) {
    const rawVal = match[0];
    if (validatePanStructure(rawVal)) {
      const start = match.index;
      const end = start + rawVal.length;
      if (!overlaps(start, end)) {
        const finding: PIIDetectionFinding = {
          type: 'PAN Card',
          category: 'identity',
          position: { start, end },
          confidence: 0.99,
          placeholder: '[PAN_REDACTED]',
        };
        spans.push({ start, end, placeholder: finding.placeholder, finding });
        findings.push(finding);
        typeCounts['PAN Card']++;
      }
    }
  }

  // 4. Scan Email Addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((match = emailRegex.exec(cleanedText)) !== null) {
    const rawVal = match[0];
    const start = match.index;
    const end = start + rawVal.length;
    if (!overlaps(start, end)) {
      const finding: PIIDetectionFinding = {
        type: 'Email Address',
        category: 'contact',
        position: { start, end },
        confidence: 0.95,
        placeholder: '[EMAIL_REDACTED]',
      };
      spans.push({ start, end, placeholder: finding.placeholder, finding });
      findings.push(finding);
      typeCounts['Email Address']++;
    }
  }

  // 5. Scan UPI IDs (name@bank) - excluding emails that have a recognized TLD
  const upiRegex = /\b[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,32}\b/g;
  while ((match = upiRegex.exec(cleanedText)) !== null) {
    const rawVal = match[0];
    const start = match.index;
    const end = start + rawVal.length;
    // Ensure it was not already flagged as email
    if (!overlaps(start, end) && validateUPI(rawVal)) {
      const finding: PIIDetectionFinding = {
        type: 'UPI ID',
        category: 'financial',
        position: { start, end },
        confidence: 0.92,
        placeholder: '[UPI_REDACTED]',
      };
      spans.push({ start, end, placeholder: finding.placeholder, finding });
      findings.push(finding);
      typeCounts['UPI ID']++;
    }
  }

  // 6. Scan IFSC Code: 4 chars, 0, 6 chars
  const ifscRegex = /\b[A-Za-z]{4}0[A-Za-z0-9]{6}\b/g;
  while ((match = ifscRegex.exec(cleanedText)) !== null) {
    const rawVal = match[0];
    const start = match.index;
    const end = start + rawVal.length;
    if (!overlaps(start, end) && validateIFSC(rawVal)) {
      const finding: PIIDetectionFinding = {
        type: 'IFSC Code',
        category: 'financial',
        position: { start, end },
        confidence: 0.96,
        placeholder: '[IFSC_REDACTED]',
      };
      spans.push({ start, end, placeholder: finding.placeholder, finding });
      findings.push(finding);
      typeCounts['IFSC Code']++;
    }
  }

  // 7. Scan Indian Mobile numbers
  const phoneRegex = /(?:\+?91[\s\-]?)?(?:0[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}\b/g;
  while ((match = phoneRegex.exec(cleanedText)) !== null) {
    const rawVal = match[0];
    const start = match.index;
    const end = start + rawVal.length;
    if (!overlaps(start, end) && validateIndianMobile(rawVal)) {
      const finding: PIIDetectionFinding = {
        type: 'Indian Mobile',
        category: 'contact',
        position: { start, end },
        confidence: 0.94,
        placeholder: '[PHONE_REDACTED]',
      };
      spans.push({ start, end, placeholder: finding.placeholder, finding });
      findings.push(finding);
      typeCounts['Indian Mobile']++;
    }
  }

  // Sort spans in reverse order so replacements do not alter preceding offsets
  spans.sort((a, b) => b.start - a.start);

  let sanitized = cleanedText;
  for (const span of spans) {
    sanitized = sanitized.slice(0, span.start) + span.placeholder + sanitized.slice(span.end);
  }

  const executionTimeMs = +(performance.now() - startTime).toFixed(2);

  return {
    hasPII: findings.length > 0,
    totalEntities: findings.length,
    findings,
    sanitizedText: sanitized,
    typeCounts,
    normalizedSourceLength: cleanedText.length,
    executionTimeMs,
  };
}

// -------------------------------------------------------------
// 7. 30+ Comprehensive Test Cases Suite
// -------------------------------------------------------------
export interface PIITestCase {
  id: string;
  name: string;
  input: string;
  expectedType?: PIIType;
  expectDetected: boolean;
  notes: string;
}

export const PII_TEST_CASES_SUITE: PIITestCase[] = [
  // Aadhaar Cases (Verhoeff Checksum)
  {
    id: 'PII-TEST-01',
    name: 'Valid Aadhaar (Spaced 4-4-4)',
    input: 'Customer identity card 2345 6789 0124 verified by officer.',
    expectedType: 'Aadhaar Card',
    expectDetected: true,
    notes: 'Verhoeff checksum passes for 2345 6789 0124 (check digit 4)',
  },
  {
    id: 'PII-TEST-02',
    name: 'Valid Aadhaar (Hyphenated 4-4-4)',
    input: 'Employee ID is 4920-8821-9917.',
    expectedType: 'Aadhaar Card',
    expectDetected: true,
    notes: 'Standard hyphenated format with valid Verhoeff checksum (check digit 7)',
  },
  {
    id: 'PII-TEST-03',
    name: 'Valid Aadhaar (12 digits continuous)',
    input: 'Direct UIDAI entry: 992144821195',
    expectedType: 'Aadhaar Card',
    expectDetected: true,
    notes: 'Continuous 12 digits passing Verhoeff checksum (check digit 5)',
  },
  {
    id: 'PII-TEST-04',
    name: 'Invalid Aadhaar (Verhoeff checksum mismatch)',
    input: 'Random digits 2345 6789 0125 submitted.',
    expectedType: 'Aadhaar Card',
    expectDetected: false,
    notes: 'Checksum mismatch (last digit 5 instead of 4), must NOT be flagged',
  },
  {
    id: 'PII-TEST-05',
    name: 'Invalid Aadhaar (First digit 0 or 1 disallowed)',
    input: 'Number 0123 4567 8901 is not a valid Aadhaar range.',
    expectedType: 'Aadhaar Card',
    expectDetected: false,
    notes: 'First digit 0 is prohibited by UIDAI specification',
  },
  {
    id: 'PII-TEST-06',
    name: 'Aadhaar Obfuscated with Zero-Width Spaces',
    input: 'Hidden UID: 2\u200B3\u200C4\u200D5\u20606\uFEFF7890124',
    expectedType: 'Aadhaar Card',
    expectDetected: true,
    notes: 'Zero-width characters stripped during normalization layer',
  },

  // PAN Cases (Format + 4th Character Holder Check)
  {
    id: 'PII-TEST-07',
    name: 'Valid PAN (Individual P)',
    input: 'Taxpayer PAN is BKZPR8812M registered under Delhi IT.',
    expectedType: 'PAN Card',
    expectDetected: true,
    notes: '4th character P = Individual / Person',
  },
  {
    id: 'PII-TEST-08',
    name: 'Valid PAN (Company C)',
    input: 'Corporate vendor tax ID: AACTC9902K filed under GSTIN.',
    expectedType: 'PAN Card',
    expectDetected: true,
    notes: '4th character C = Company',
  },
  {
    id: 'PII-TEST-09',
    name: 'Valid PAN (Firm/LLP F)',
    input: 'Audit report for partnership with PAN AABFA1234M.',
    expectedType: 'PAN Card',
    expectDetected: true,
    notes: '4th character F = Partnership Firm',
  },
  {
    id: 'PII-TEST-10',
    name: 'Valid PAN (Trust T)',
    input: 'Charitable foundation tax PAN: AADTA5678B.',
    expectedType: 'PAN Card',
    expectDetected: true,
    notes: '4th character T = Trust',
  },
  {
    id: 'PII-TEST-11',
    name: 'Valid PAN (HUF H in lowercase)',
    input: 'Family account with pan aabhr9901k submitted.',
    expectedType: 'PAN Card',
    expectDetected: true,
    notes: 'Case-insensitive detection with 4th character H = HUF',
  },
  {
    id: 'PII-TEST-12',
    name: 'Invalid PAN (Invalid 4th character X)',
    input: 'Fake format ABCX01234Z does not belong to any legal entity.',
    expectedType: 'PAN Card',
    expectDetected: false,
    notes: 'X is not a valid 4th character holder type',
  },
  {
    id: 'PII-TEST-13',
    name: 'Invalid PAN (Incorrect length)',
    input: 'Malformed entry ABCD1234E has only 4 prefix characters.',
    expectedType: 'PAN Card',
    expectDetected: false,
    notes: 'Requires strictly 5 alpha, 4 numeric, 1 alpha',
  },

  // Indian Mobile Numbers
  {
    id: 'PII-TEST-14',
    name: 'Valid Indian Mobile (+91 Prefix with Spaces)',
    input: 'Call direct line +91 98210 55192 for urgent assistance.',
    expectedType: 'Indian Mobile',
    expectDetected: true,
    notes: '+91 country code with valid 9-series mobile number',
  },
  {
    id: 'PII-TEST-15',
    name: 'Valid Indian Mobile (Hyphenated 91 Prefix)',
    input: 'SMS notification sent to 91-88301-44210.',
    expectedType: 'Indian Mobile',
    expectDetected: true,
    notes: '91 prefix with hyphen separator',
  },
  {
    id: 'PII-TEST-16',
    name: 'Valid Indian Mobile (0 Trunk Prefix)',
    input: 'Dial trunk mobile: 07012345678.',
    expectedType: 'Indian Mobile',
    expectDetected: true,
    notes: 'Trunk prefix 0 followed by 10 digits starting with 7',
  },
  {
    id: 'PII-TEST-17',
    name: 'Valid Indian Mobile (Plain 10 Digits starting with 6)',
    input: 'Customer mobile 6912345678 updated in KYC portal.',
    expectedType: 'Indian Mobile',
    expectDetected: true,
    notes: 'Valid 6-series mobile number without prefix',
  },
  {
    id: 'PII-TEST-18',
    name: 'Invalid Phone Number (Starts with 4 - Landline)',
    input: 'Landline number 4821055192 cannot receive SMS.',
    expectedType: 'Indian Mobile',
    expectDetected: false,
    notes: 'Indian mobile numbers strictly start with 6, 7, 8, or 9',
  },
  {
    id: 'PII-TEST-19',
    name: 'Invalid Phone Number (Too short, 8 digits)',
    input: 'Short code 98210551 rejected.',
    expectedType: 'Indian Mobile',
    expectDetected: false,
    notes: 'Less than 10 digits',
  },

  // Credit Card Numbers (Luhn Checksum)
  {
    id: 'PII-TEST-20',
    name: 'Valid Credit Card (Visa test 4111 1111 1111 1111)',
    input: 'Authorize card 4111 1111 1111 1111 for checkout.',
    expectedType: 'Credit Card',
    expectDetected: true,
    notes: 'Luhn modulo 10 checksum valid',
  },
  {
    id: 'PII-TEST-21',
    name: 'Invalid Credit Card (Fails Luhn Check)',
    input: 'Card 4111 1111 1111 1112 has a wrong checksum digit.',
    expectedType: 'Credit Card',
    expectDetected: false,
    notes: 'Luhn check fails for last digit 2',
  },
  {
    id: 'PII-TEST-22',
    name: 'Credit Card with Zero-Width Obfuscation',
    input: 'Smuggled card: 4\u200B1\u200C1\u200D1\uFEFF111111111111',
    expectedType: 'Credit Card',
    expectDetected: true,
    notes: 'Zero-width space removed prior to Luhn computation',
  },

  // IFSC Codes
  {
    id: 'PII-TEST-23',
    name: 'Valid IFSC Code (HDFC Bank)',
    input: 'Wire transfer to IFSC code HDFC0001234 Mumbai branch.',
    expectedType: 'IFSC Code',
    expectDetected: true,
    notes: '11 chars, 4 letters + 0 + 6 alphanumeric',
  },
  {
    id: 'PII-TEST-24',
    name: 'Valid IFSC Code (State Bank of India)',
    input: 'RTGS details: SBIN0000456 Main Delhi Branch.',
    expectedType: 'IFSC Code',
    expectDetected: true,
    notes: 'Valid SBI branch code with 5th char 0',
  },
  {
    id: 'PII-TEST-25',
    name: 'Invalid IFSC Code (5th character not 0)',
    input: 'Invalid code HDFC1001234 rejected by NEFT clearing.',
    expectedType: 'IFSC Code',
    expectDetected: false,
    notes: 'RBI requires strictly 0 at character index 5',
  },
  {
    id: 'PII-TEST-26',
    name: 'Invalid IFSC Code (Wrong character count)',
    input: 'Incomplete code SBIN00045 lacks required digits.',
    expectedType: 'IFSC Code',
    expectDetected: false,
    notes: 'Must be exactly 11 characters',
  },

  // UPI IDs
  {
    id: 'PII-TEST-27',
    name: 'Valid UPI ID (Axis Bank)',
    input: 'Send payment to merchant.store@okaxis immediately.',
    expectedType: 'UPI ID',
    expectDetected: true,
    notes: 'Standard VPA structure with @okaxis handle',
  },
  {
    id: 'PII-TEST-28',
    name: 'Valid UPI ID (Mobile VPA @paytm)',
    input: 'Paytm wallet VPA is 9876543210@paytm.',
    expectedType: 'UPI ID',
    expectDetected: true,
    notes: 'Phone-based UPI address format',
  },
  {
    id: 'PII-TEST-29',
    name: 'Valid UPI ID (Generic @upi)',
    input: 'Govt e-Challan payment address: police.traffic@upi.',
    expectedType: 'UPI ID',
    expectDetected: true,
    notes: 'Official NPCI @upi handle',
  },

  // Email Addresses
  {
    id: 'PII-TEST-30',
    name: 'Valid Corporate Email Address',
    input: 'Contact security desk at devops-team.india@kavach.defense.gov.in for keys.',
    expectedType: 'Email Address',
    expectDetected: true,
    notes: 'Full domain hierarchy with valid RFC format',
  },
  {
    id: 'PII-TEST-31',
    name: 'Invalid Email (Missing domain)',
    input: 'Corrupted address admin@localhost is not valid internet email.',
    expectedType: 'Email Address',
    expectDetected: false,
    notes: 'Lacks valid top-level domain',
  },

  // Mixed Multi-Entity Payload
  {
    id: 'PII-TEST-32',
    name: 'Mixed Multi-PII Bundle (Aadhaar + PAN + Phone + UPI)',
    input: 'Onboarding packet: Aadhaar 2345 6789 0124, PAN BKZPR8812M, Phone +91 98210 55192, and UPI pay@okaxis.',
    expectedType: 'Aadhaar Card',
    expectDetected: true,
    notes: 'Tests multi-entity simultaneous redaction and placeholder typing',
  },
];

/**
 * Runs the full 30+ test suite and returns individual and aggregate test results
 */
export function runPIISuiteVerification(): {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  results: Array<{
    testId: string;
    name: string;
    status: 'PASS' | 'FAIL';
    detected: boolean;
    expectedDetected: boolean;
    findingsCount: number;
    sanitizedSnippet: string;
    notes: string;
  }>;
} {
  const results = PII_TEST_CASES_SUITE.map((tc) => {
    const scan = scanAndSanitizePII(tc.input);
    const wasDetected = scan.hasPII && (tc.expectedType ? scan.findings.some((f) => f.type === tc.expectedType) : true);
    const passed = wasDetected === tc.expectDetected;

    return {
      testId: tc.id,
      name: tc.name,
      status: (passed ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL',
      detected: wasDetected,
      expectedDetected: tc.expectDetected,
      findingsCount: scan.findings.length,
      sanitizedSnippet: scan.sanitizedText,
      notes: tc.notes,
    };
  });

  const passed = results.filter((r) => r.status === 'PASS').length;
  const total = results.length;
  const passRate = +((passed / total) * 100).toFixed(1);

  return {
    total,
    passed,
    failed: total - passed,
    passRate,
    results,
  };
}
