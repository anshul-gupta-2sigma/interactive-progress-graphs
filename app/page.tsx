"use client";

import React, { useEffect, useState } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import python from "react-syntax-highlighter/dist/cjs/languages/hljs/python";
import ReactDiffViewer from 'react-diff-viewer-continued';
import { GraphSection } from "@/app/components/GraphSection";
import { renderMetadata } from "@/app/utils/renderMetadata";
import { Point } from "@/app/types/graph";

SyntaxHighlighter.registerLanguage("python", python);

interface AssignmentOption {
  language: string;
  assignment: string;
  path: string; // e.g., "Java/Assignment1"
}

export default function Home() {
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [globalSelectedPoints, setGlobalSelectedPoints] = useState<Point[]>([]);
  const [astSimilarity, setAstSimilarity] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [astError, setAstError] = useState<string | null>(null);

  // Fetch list of assignments (once)
  useEffect(() => {
    async function loadAssignments() {
      try {
        const res = await fetch('/api/list-assignments');
        const data: AssignmentOption[] = await res.json();
        setAssignments(data);
        // default to first assignment if present
        if (data.length > 0) {
          setSelectedAssignment(data[0].path);
        }
      } catch (err) {
        console.error('Error fetching assignments:', err);
      }
    }
    loadAssignments();
  }, []);

  // Fetch CSV list whenever selectedAssignment changes
  useEffect(() => {
    if (!selectedAssignment) {
      setCsvFiles([]);
      setSelectedFiles([]);
      return;
    }
    async function loadCsvFiles() {
      try {
        const res = await fetch(`/api/list-csv?dir=${encodeURIComponent(selectedAssignment)}`);
        const files: string[] = await res.json();
        // Prepend path so GraphSection can fetch static file directly
        const fullPaths = files.map((f) => `${selectedAssignment}/${f}`);
        setCsvFiles(fullPaths);
        setSelectedFiles(fullPaths.slice(0, 1)); // default select first file if exists
        setGlobalSelectedPoints([]);
      } catch (err) {
        console.error('Error fetching CSV files:', err);
      }
    }
    loadCsvFiles();
  }, [selectedAssignment]);

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAssignment(e.target.value);
  };

  // Calculate AST similarity when two points are selected
  useEffect(() => {
    async function calculateSimilarity() {
      if (globalSelectedPoints.length !== 2) {
        setAstSimilarity(null);
        setAstError(null);
        return;
      }

      const code1 = globalSelectedPoints[0].code || '';
      const code2 = globalSelectedPoints[1].code || '';

      if (!code1 || !code2) {
        setAstSimilarity(null);
        setAstError("Missing code in one or both of the snapshots");
        return;
      }

      try {
        setIsCalculating(true);
        setAstError(null);
        
        const parser = selectedAssignment.substring(0, 4) == "Java" ? "Java" : "Python"
        const response = await fetch('/api/ast-similarity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code1, code2, parser }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Server responded with status: ${response.status}`);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setAstSimilarity(data.similarity);
      } catch (error) {
        console.error('Error calculating AST similarity:', error);
        setAstSimilarity(null);
        setAstError(error instanceof Error ? error.message : "Unknown error occurred");
      } finally {
        setIsCalculating(false);
      }
    }

    calculateSimilarity();
  }, [globalSelectedPoints]);

  const toggleFileSelection = (file: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(file)) {
        setGlobalSelectedPoints(current => 
          current.filter(point => point.source !== file)
        );
        return prev.filter(f => f !== file);
      }
      return [...prev, file];
    });
  };

  const handleGlobalPointSelection = (point: Point | null, isCtrl: boolean) => {
    if (!point) return;

    setGlobalSelectedPoints(prev => {
      if (!isCtrl) {
        // Reset to only the clicked point
        return [point];
      }

      // Ctrl pressed
      if (prev.length === 0) {
        return [point];
      }

      if (prev.length === 1) {
        // If clicked same as first, ignore; else add as second
        const first = prev[0];
        if (first.source === point.source && first.metadata.snapshot === point.metadata.snapshot) {
          return prev;
        }
        return [first, point];
      }

      if (prev.length === 2) {
        const first = prev[0];
        // If clicked same as first, keep first only
        if (first.source === point.source && first.metadata.snapshot === point.metadata.snapshot) {
          return [first];
        }
        return [first, point];
      }

      return prev;
    });
  };

  const formatTimeDifference = (timestamp1: string, timestamp2: string) => {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}, ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}, and ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Progress Graphs</h1>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex flex-col">
            <label className="font-medium mb-1 text-sm">Assignment</label>
            <select
              value={selectedAssignment}
              onChange={handleAssignmentChange}
              className="border rounded px-3 py-1 text-sm"
            >
              {assignments.length === 0 && <option>No assignments found</option>}
              {assignments.map((opt) => (
                <option key={opt.path} value={opt.path}>
                  {opt.language} / {opt.assignment}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="font-medium mb-1 text-sm">Select Graphs</span>
            <div className="flex flex-wrap gap-3 max-w-md">
              {csvFiles.map((filePath) => {
                const fileName = filePath.split('/').slice(-1)[0];
                return (
                  <label key={filePath} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(filePath)}
                      onChange={() => toggleFileSelection(filePath)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{fileName.replace('.csv', '')}</span>
                  </label>
                );
              })}
              {csvFiles.length === 0 && <span className="text-gray-500 text-sm">No CSV files</span>}
            </div>
          </div>
        </div>
      </div>

      {selectedFiles.length === 0 && (
        <div className="text-center text-gray-500 mt-12">Select at least one graph to display.</div>
      )}

      <div className={`grid gap-8 ${selectedFiles.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {selectedFiles.map((file) => (
          <GraphSection 
            key={`${file}-${selectedFiles.length}`} 
            file={file} 
            selectedPoints={globalSelectedPoints} 
            onPointSelect={handleGlobalPointSelection} 
          />
        ))}
      </div>

      {/* Cross-graph comparison view */}
      {globalSelectedPoints.length === 2 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Cross-Graph Comparison</h2>
          
          <div className="grid grid-cols-2 gap-8 mb-6">
            {globalSelectedPoints.map((point, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-2">
                  {point.source.replace('.csv', '')} - Snapshot #{point.metadata.snapshot}
                </h3>
                {renderMetadata(point.metadata)}
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Code Differences</h3>
                <div className={`px-4 py-1 rounded-full text-sm font-medium border ${
                  astError 
                    ? 'bg-red-50 text-red-700 border-red-200' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isCalculating ? (
                    <span>Calculating AST Similarity...</span>
                  ) : astError ? (
                    <span title={astError}>AST Error: {astError.substring(0, 30)}{astError.length > 30 ? '...' : ''}</span>
                  ) : astSimilarity !== null ? (
                    <span>AST Similarity: {(astSimilarity * 100).toFixed(1)}%</span>
                  ) : (
                    <span>AST Similarity: N/A</span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Time between snapshots: {formatTimeDifference(
                  globalSelectedPoints[0].metadata.timestamp,
                  globalSelectedPoints[1].metadata.timestamp
                )}
              </div>
            </div>
            
            <ReactDiffViewer
              oldValue={globalSelectedPoints[0].code || ''}
              newValue={globalSelectedPoints[1].code || ''}
              splitView={true}
              leftTitle={`${globalSelectedPoints[0].source.replace('.csv', '')} - Snapshot #${globalSelectedPoints[0].metadata.snapshot}`}
              rightTitle={`${globalSelectedPoints[1].source.replace('.csv', '')} - Snapshot #${globalSelectedPoints[1].metadata.snapshot}`}
              showDiffOnly={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
