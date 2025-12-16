import Papa from "papaparse";
import { GraphData } from "@/app/types/graph";

export function parseCSV(file: File): Promise<GraphData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<GraphData>(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}