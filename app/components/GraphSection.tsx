"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import Papa from "papaparse";
import LineChart from "@/app/components/LineChart";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { renderMetadata } from "@/app/utils/renderMetadata";
import { Point, GraphData, Metadata } from "@/app/types/graph";

interface GraphSectionProps {
  file: string;
  selectedPoints: Point[];
  setSelectedPoints: React.Dispatch<React.SetStateAction<Point[]>>
  onPointSelect: (point: Point | null, isCtrl: boolean) => void;
}

export const GraphSection = ({ file, selectedPoints, setSelectedPoints, onPointSelect }: GraphSectionProps) => {
  const [data, setData] = useState<GraphData[]>([]);

  var localSelectedPoints = selectedPoints.filter(point => point.source === file);

  // Load data for this file
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/${file}`);
        const text = await res.text();
        const result = Papa.parse<GraphData>(text, { header: true, dynamicTyping: true });
        setData(result.data);
      } catch (error) {
        console.error(`Error loading CSV ${file}:`, error);
      }
    }
    loadData();
  }, [file]);

  const handleArrowsDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!data) return

    const filteredSelectedPoints = [...selectedPoints]
                  .map((p, i) => ({p, i}))
                  .filter(({p}) => p.source === file)
    const indexSelectedPointStart = filteredSelectedPoints.at(0)?.i
    const indexSelectedPointEnd = filteredSelectedPoints.at(-1)?.i
    if (indexSelectedPointStart === undefined || indexSelectedPointEnd === undefined) return

    const moveSelectedPoint = (index: number, shift: number) => {
      const oldPoint = selectedPoints[index]
      const newGlobalIndex = oldPoint.metadata.snapshot-1+shift
      if (newGlobalIndex+shift >= data.length) return
      if (selectedPoints.length == 2 && 
        selectedPoints[index === 0 ? 1 : 0].metadata.snapshot-1 === newGlobalIndex) return

      const newPoint: Point = {
        code: data[newGlobalIndex]['code'] as string | null,
        metadata: {...data[newGlobalIndex]} as Metadata,
        source: file
      }
      const newSelectedPoints = selectedPoints.map((p, i) => i === index ? newPoint : p)
      setSelectedPoints(newSelectedPoints)
      localSelectedPoints = newSelectedPoints.filter(point => point.source === file);
    }

    if (e.key === 'ArrowRight') moveSelectedPoint(indexSelectedPointEnd, +1); e.preventDefault();
    if (e.key === 'ArrowLeft') moveSelectedPoint(indexSelectedPointEnd, -1); e.preventDefault();
    if (e.key === 'ArrowUp') moveSelectedPoint(indexSelectedPointStart, +1); e.preventDefault();
    if (e.key === 'ArrowDown') moveSelectedPoint(indexSelectedPointStart, -1); e.preventDefault();
  };

  const handlePointClick = (point: { code: string | null; metadata: Metadata } | null, isCtrl: boolean) => {
    const enrichedPoint = point ? ({ ...point, source: file } as Point) : null;
    onPointSelect(enrichedPoint, isCtrl);
  };

  return (
    <div tabIndex={0} onKeyDown={handleArrowsDown} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4">Graph: {file.split('/').slice(-1)[0].replace('.csv', '')}</h2>
      <LineChart data={data} onClickPoint={handlePointClick} selectedPoints={localSelectedPoints} />
      
      {/* Show individual snapshot details only if we're not in cross-graph comparison mode */}
      {localSelectedPoints.length === 1 && selectedPoints.length === 1 && (
        <div className="mt-6">
          <div>
            <h3 className="font-semibold mb-2">Snapshot #{localSelectedPoints[0].metadata.snapshot}</h3>
            {renderMetadata(localSelectedPoints[0].metadata)}
            <h4 className="font-semibold mt-4 mb-2">Code:</h4>
            <SyntaxHighlighter language="python" style={docco} wrapLongLines>
              {localSelectedPoints[0].code || ''}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphSection;