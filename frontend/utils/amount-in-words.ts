const WORDS = [
  "शून्य",
  "एक",
  "दुई",
  "तीन",
  "चार",
  "पाँच",
  "छ",
  "सात",
  "आठ",
  "नौ",

  "दश",
  "एघार",
  "बाह्र",
  "तेह्र",
  "चौध",
  "पन्ध्र",
  "सोह्र",
  "सत्र",
  "अठार",
  "उन्नाइस",

  "बीस",
  "एक्काइस",
  "बाइस",
  "तेइस",
  "चौबीस",
  "पच्चीस",
  "छब्बीस",
  "सत्ताइस",
  "अठ्ठाइस",
  "उनन्तीस",

  "तीस",
  "एकतीस",
  "बत्तीस",
  "तेत्तीस",
  "चौँतीस",
  "पैँतीस",
  "छत्तीस",
  "सैँतीस",
  "अठतीस",
  "उनन्चालीस",

  "चालीस",
  "एकचालीस",
  "बयालीस",
  "त्रिचालीस",
  "चवालीस",
  "पैँतालीस",
  "छयालीस",
  "सतचालीस",
  "अठचालीस",
  "उनन्चास",

  "पचास",
  "एकाउन्न",
  "बाउन्न",
  "त्रिपन्न",
  "चवन्न",
  "पचपन्न",
  "छपन्न",
  "सन्ताउन्न",
  "अन्ठाउन्न",
  "उनन्साठी",

  "साठी",
  "एकसट्ठी",
  "बयसट्ठी",
  "त्रिसट्ठी",
  "चौँसट्ठी",
  "पैँसट्ठी",
  "छयसट्ठी",
  "सतसट्ठी",
  "अठसट्ठी",
  "उनन्सत्तरी",

  "सत्तरी",
  "एकहत्तर",
  "बहत्तर",
  "त्रिहत्तर",
  "चौहत्तर",
  "पचहत्तर",
  "छयहत्तर",
  "सतहत्तर",
  "अठहत्तर",
  "उनासी",

  "असी",
  "एकासी",
  "बयासी",
  "त्रियासी",
  "चौरासी",
  "पचासी",
  "छयासी",
  "सतासी",
  "अठासी",
  "उनान्नब्बे",

  "नब्बे",
  "एकान्नब्बे",
  "बयान्नब्बे",
  "त्रियान्नब्बे",
  "चौरान्नब्बे",
  "पन्चान्नब्बे",
  "छयान्नब्बे",
  "सन्तान्नब्बे",
  "अन्ठान्नब्बे",
  "उनान्सय",
];

function wholeNumberInWords(number: number): string {
  if (number === 0) return WORDS[0];

  const parts: string[] = [];

  const groups: [number, string][] = [
    [10000000, "करोड"],
    [100000, "लाख"],
    [1000, "हजार"],
    [100, "सय"],
  ];

  for (const [size, label] of groups) {
    const count = Math.floor(number / size);

    if (count > 0) {
      parts.push(`${WORDS[count]} ${label}`);
      number %= size;
    }
  }

  if (number > 0) {
    parts.push(WORDS[number]);
  }

  return parts.join(" ");
}

export function amountInWords(input: string): string {
  // Accept English and Nepali digits.
  const value = input
    .trim()
    .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)));

  // Same limits as the existing voucher API:
  // up to 9 whole-number digits and 2 decimal places.
  // Enter amounts without commas.
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value)) {
    return "";
  }

  const [whole, decimal = ""] = value.split(".");

  const rupees = Number(whole);
  const paisa = Number(decimal.padEnd(2, "0"));

  if (rupees === 0 && paisa === 0) {
    return "";
  }

  const paisaText = paisa > 0 ? ` ${WORDS[paisa]} पैसा` : "";

  return `${wholeNumberInWords(rupees)} रुपैयाँ${paisaText} मात्र`;
}
