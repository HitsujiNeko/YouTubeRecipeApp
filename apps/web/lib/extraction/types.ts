export type SourceMode = "description+transcript" | "description" | "transcript" | "none";

export type ExtractionStatus = "success" | "partial" | "no_recipe_found" | "no_source";

export type StructuredIngredient = {
  name: string;
  quantity_text: string | null;
  group_label: string | null;
  is_optional: boolean;
  confidence: number;
};

export type StructuredStep = {
  text: string;
  timestamp_sec: number | null;
  timer_sec: number | null;
  is_ai_inferred: boolean;
  confidence: number;
};
