export type MetadataValue = string | number | boolean | null;

export interface Metadata extends Record<string, MetadataValue> {
  snapshot: number;
  timestamp: string;
}

export interface Point {
  code: string | null;
  metadata: Metadata;
  source: string;
}

export type GraphData = Record<string, MetadataValue>;

export interface ChartPoint {
  code: string | null;
  metadata: Metadata;
} 