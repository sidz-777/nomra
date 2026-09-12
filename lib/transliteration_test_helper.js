const COMMON_ARABIC_NAMES = {
  fatima: 'فاطمة',
  fatimah: 'فاطمة',
  aisha: 'عائشة',
  ayesha: 'عائشة',
  mohammed: 'محمد',
  muhammad: 'محمد',
  mohamed: 'محمد',
  ali: 'علي',
  omar: 'عمر',
  umar: 'عمر',
  maryam: 'مريم',
  mariam: 'مريم',
  sara: 'سارة',
  sarah: 'سارة',
  hassan: 'حسن',
  hasan: 'حسن',
  hussain: 'حسين',
  hussein: 'حسين',
  ibrahim: 'إبراهيم',
  yusuf: 'يوسف',
  zara: 'زارا',
  zahra: 'زهراء',
  tariq: 'طارق',
  namora: 'نامورا',
  zainab: 'زينب',
  khadija: 'خديجة',
  bilal: 'بلال',
  hamza: 'حمزة',
  aayan: 'آيان',
  ayaan: 'آيان',
  rayan: 'ريان',
  aya: 'آية',
  noor: 'نور',
  zayd: 'زيد',
  zaid: 'زيد',
  amira: 'أميرة',
  yasmin: 'ياسمين',
  yasmine: 'ياسمين',
  usman: 'عثمان',
  uthman: 'عثمان',
  saad: 'سعد',
  farhan: 'فرحان',
  ananya: 'أنانيا',
};

const PHONETIC_MAP = {
  th: 'ث',
  kh: 'خ',
  sh: 'ش',
  dh: 'ذ',
  gh: 'غ',
  ph: 'ف',
  a: 'ا',
  b: 'ب',
  c: 'ك',
  d: 'د',
  e: 'ي',
  f: 'ف',
  g: 'ج',
  h: 'ه',
  i: 'ي',
  j: 'ج',
  k: 'ك',
  l: 'ل',
  m: 'م',
  n: 'ن',
  o: 'و',
  p: 'ب',
  q: 'ق',
  r: 'ر',
  s: 'س',
  t: 'ت',
  u: 'و',
  v: 'ف',
  w: 'و',
  x: 'كس',
  y: 'ي',
  z: 'ز',
};

function suggestArabicSpelling(enText) {
  if (!enText) {
    return { text: '', isExact: false };
  }
  const clean = enText.trim().toLowerCase();
  if (COMMON_ARABIC_NAMES[clean]) {
    return {
      text: COMMON_ARABIC_NAMES[clean],
      isExact: true,
    };
  }
  let res = '';
  let i = 0;
  while (i < clean.length) {
    if (i < clean.length - 1 && PHONETIC_MAP[clean.substring(i, i + 2)]) {
      res += PHONETIC_MAP[clean.substring(i, i + 2)];
      i += 2;
    } else if (PHONETIC_MAP[clean[i]]) {
      res += PHONETIC_MAP[clean[i]];
      i++;
    } else {
      res += clean[i];
      i++;
    }
  }
  return {
    text: res,
    isExact: false,
  };
}

module.exports = { suggestArabicSpelling };
