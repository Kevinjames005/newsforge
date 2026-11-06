// Demo data so the UI works before your backend exists. Enable with VITE_USE_MOCK=true
const source =
  "Collector Anita Menon said the flood relief camp at Erattupetta school opened on 14 October. " +
  "About 320 families are staying there. She said the district has set aside 45 lakh rupees for food and medicine. " +
  "\"No family will be turned away,\" she told reporters. Power is expected to be restored by Friday.";

export const mockArticle = {
  article: {
    id: "demo",
    title: "Flood relief camp opens",
    source_text: source,
    source_type: "interview_notes",
    source_files: [{ name: "menon-interview.docx", size: 18400 }],
    target_language: "English",
    style: "professional_news",
    tone: "neutral",
    status: "review_required",
    created_at: new Date().toISOString(),
  },
  generated: {
    id: "g1",
    version: 1,
    headline: "Relief camp opens at Erattupetta school for 320 flood-hit families",
    subheadline: "District sets aside Rs 45 lakh for food and medicine",
    body: [
      [
        { text: "A flood relief camp opened at Erattupetta school on 14 October, Collector Anita Menon said.", fact_ids: ["f1", "f2"] },
        { text: "About 320 families are staying at the camp.", fact_ids: ["f3"] },
      ],
      [
        { text: "The district has set aside Rs 45 lakh for food and medicine.", fact_ids: ["f4"] },
        { text: "\"No family will be turned away,\" Menon told reporters.", fact_ids: ["f5"] },
        { text: "Officials hope the situation will improve soon.", fact_ids: [] },
      ],
    ],
    model_name: "gemini",
  },
  facts: [
    { id: "f1", fact: "Anita Menon is the Collector", fact_type: "person", source_text: "Collector Anita Menon said" },
    { id: "f2", fact: "Camp opened 14 October at Erattupetta school", fact_type: "date", source_text: "relief camp at Erattupetta school opened on 14 October" },
    { id: "f3", fact: "About 320 families", fact_type: "number", source_text: "About 320 families are staying there" },
    { id: "f4", fact: "45 lakh rupees allocated", fact_type: "number", source_text: "45 lakh rupees for food and medicine" },
    { id: "f5", fact: "Quote from Menon", fact_type: "quote", source_text: "\"No family will be turned away,\"" },
  ],
  fact_checks: [
    { id: "c1", claim: "Camp opened on 14 October", status: "supported", source_evidence: "opened on 14 October", explanation: "Date matches the source." },
    { id: "c2", claim: "320 families are staying at the camp", status: "supported", source_evidence: "About 320 families are staying there", explanation: "Matches the source." },
    { id: "c3", claim: "Officials hope the situation will improve soon", status: "unsupported", source_evidence: null, explanation: "No statement in the source supports this." },
  ],
};

const DAY = 86400000;
const titles = [
  "Flood relief camp opens at Erattupetta school", "Panchayat approves new bus stand", "District science fair draws 900 students",
  "Rubber price rises for third week", "Monsoon session: key bills explained", "Hospital adds dialysis unit",
  "School reopening: what parents should know", "Onam market sees early rush", "Road repair begins on MC Road",
  "Farmers demand higher paddy price", "Coastal erosion survey begins", "Ward delimitation explained",
  "Library network expands to 40 villages", "Houseboat safety drive launched", "New ferry links two islands",
  "Power cut schedule announced", "Students win state robotics title", "Heritage temple restoration approved", "Fishing ban ends this week",
];
const offsets = [0, 2, 4, 9, 14, 19, 27, 35, 44, 58, 71, 90, 105, 130, 160, 190, 230, 270, 320];
const statuses = ["review_required", "verified", "verified", "draft", "verified", "exported", "review_required", "verified", "verified", "exported"];
const types = ["interview_notes", "interview_transcript", "news_brief", "draft"];

export const mockList = titles.map((title, i) => ({
  id: "demo",
  title,
  source_type: types[i % 4],
  target_language: i % 3 === 0 ? "English" : "Malayalam",
  status: statuses[i % statuses.length],
  unsupported_count: statuses[i % statuses.length] === "review_required" ? (i % 3) + 1 : 0,
  created_at: new Date(Date.now() - offsets[i] * DAY).toISOString(),
}));
