export type ListingType =
  | "semen"
  | "embryos"
  | "eggs"
  | "live_buck"
  | "live_doe"
  | "pregnant_doe"
  | "recipient_doe";

export type DetailField = {
  key: string;
  label: string;
  input?: "text" | "date" | "number" | "select";
  options?: string[];
  hint?: string;
};

type TypeInfo = {
  label: string;
  short: string;
  live: boolean;
  sex: "buck" | "doe" | "any";
  defaultUnit: string;
  fields: DetailField[];
};

export const LISTING_TYPES: Record<ListingType, TypeInfo> = {
  semen: {
    label: "Semen straws",
    short: "Semen",
    live: false,
    sex: "buck",
    defaultUnit: "per straw",
    fields: [
      { key: "collection_date", label: "Collection date", input: "date" },
      { key: "collection_center", label: "Collection or storage center" },
      { key: "post_thaw_motility", label: "Post-thaw motility (%)", input: "number" },
      { key: "storage_location", label: "Where the straws are stored" },
    ],
  },
  embryos: {
    label: "Embryos",
    short: "Embryos",
    live: false,
    sex: "doe",
    defaultUnit: "per embryo",
    fields: [
      { key: "sire", label: "Sire of the embryos" },
      { key: "embryo_grade", label: "Embryo grade", input: "select", options: ["", "1", "2", "3"] },
      { key: "collection_date", label: "Flush date", input: "date" },
      { key: "collection_center", label: "Collection or storage center" },
      { key: "freezing_method", label: "Freezing method", input: "select", options: ["", "Direct transfer", "Glycerol", "Vitrified"] },
    ],
  },
  eggs: {
    label: "Eggs / oocytes",
    short: "Eggs",
    live: false,
    sex: "doe",
    defaultUnit: "per egg",
    fields: [
      { key: "collection_date", label: "Collection date", input: "date" },
      { key: "collection_center", label: "Collection or storage center" },
    ],
  },
  live_buck: {
    label: "Live buck",
    short: "Buck",
    live: true,
    sex: "buck",
    defaultUnit: "each",
    fields: [
      { key: "weight", label: "Current weight (lb)", input: "number" },
      { key: "proven", label: "Proven breeder", input: "select", options: ["", "Yes", "No"] },
    ],
  },
  live_doe: {
    label: "Live doe",
    short: "Doe",
    live: true,
    sex: "doe",
    defaultUnit: "each",
    fields: [
      { key: "weight", label: "Current weight (lb)", input: "number" },
      { key: "kidding_history", label: "Kidding history" },
    ],
  },
  pregnant_doe: {
    label: "Pregnant doe",
    short: "Pregnant doe",
    live: true,
    sex: "doe",
    defaultUnit: "each",
    fields: [
      { key: "sire", label: "Bred to (sire)" },
      { key: "method", label: "How bred", input: "select", options: ["", "Natural", "AI", "ET"] },
      { key: "bred_date", label: "Bred date", input: "date" },
      { key: "due_date", label: "Due date", input: "date" },
      { key: "confirmed_by", label: "Pregnancy confirmed by", input: "select", options: ["", "Ultrasound", "Blood test", "Not confirmed"] },
    ],
  },
  recipient_doe: {
    label: "Recipient doe",
    short: "Recipient",
    live: true,
    sex: "doe",
    defaultUnit: "each",
    fields: [
      { key: "kidding_history", label: "Kidding history" },
      { key: "health_status", label: "Health status" },
      { key: "ready", label: "Ready for transfer", input: "select", options: ["", "Synced and ready", "Can be synced", "Not yet"] },
    ],
  },
};

export const LISTING_TYPE_KEYS = Object.keys(LISTING_TYPES) as ListingType[];

export const BREED_GRADES = [
  { value: "fullblood", label: "Fullblood" },
  { value: "purebred", label: "Purebred" },
  { value: "percentage", label: "Percentage" },
  { value: "cross", label: "Cross" },
  { value: "other", label: "Other / unregistered" },
];

export const BREEDS = [
  "Boer",
  "Kiko",
  "Savanna",
  "Spanish",
  "Myotonic",
  "Nubian",
  "Alpine",
  "LaMancha",
  "Saanen",
  "Toggenburg",
  "Oberhasli",
  "Nigerian Dwarf",
  "Pygmy",
  "Boer cross",
  "Other",
];

export const REGISTRIES = ["ABGA", "USBGA", "IBGA", "ADGA", "AGS", "IKGA", "Other", "None"];

export const HEALTH_TESTS = ["CAE", "CL", "Johne's", "Brucellosis", "Q fever", "TB", "Other"];

export const EPD_FIELDS = [
  { key: "bw", label: "Birth weight" },
  { key: "ww", label: "Weaning weight" },
  { key: "pwg", label: "Post-weaning gain" },
  { key: "nlw", label: "Number of kids weaned" },
  { key: "mww", label: "Maternal weaning weight" },
];

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export function gradeLabel(v: string) {
  return BREED_GRADES.find((g) => g.value === v)?.label ?? v;
}
