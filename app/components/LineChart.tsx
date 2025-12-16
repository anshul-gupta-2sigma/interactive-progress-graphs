"use client";

import { useEffect, useRef, useMemo } from "react";
import { Chart, registerables, ActiveElement, ChartEvent } from "chart.js";
import { Line } from "react-chartjs-2";
import { GraphData, ChartPoint, Metadata } from "@/app/types/graph";

Chart.register(...registerables);

interface LineChartProps {
  data: GraphData[];
  onClickPoint: (point: ChartPoint | null, isCtrl: boolean) => void;
  selectedPoints: ChartPoint[];
}

function LineChartComponent({ data, onClickPoint, selectedPoints }: LineChartProps) {
  // Using any here to bypass complex chart.js generic mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  // Determine selected snapshot numbers (1-based)
  const selectedSnapshots = useMemo(() =>
    selectedPoints.map(p => p.metadata.snapshot),
  [selectedPoints]);
  
  const baseChartData = useMemo(() => ({
    labels: data.map((_, index) => `${index+1}`),
    datasets: [
      {
        label: "Regressor Estimated Progress",
        data: data.map((d) => d.reg_est_prog),
        borderColor: 'rgb(141, 99, 255, 0.5)',
        backgroundColor: 'rgb(141, 99, 255, 0.5)',
        pointRadius: new Array(data.length).fill(4),
        pointBackgroundColor: new Array(data.length).fill('rgb(141, 99, 255)'),
        pointBorderColor: new Array(data.length).fill('rgb(141, 99, 255)'),
        pointBorderWidth: new Array(data.length).fill(1),
      },
      {
        label: "Real Progress",
        data: data.map((d) => d.real_progress),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        pointRadius: new Array(data.length).fill(4),
        pointBackgroundColor: new Array(data.length).fill('rgb(255, 99, 132)'),
        pointBorderColor: new Array(data.length).fill('rgb(255, 99, 132)'),
        pointBorderWidth: new Array(data.length).fill(1),
      },
    ],
  }), [data]);

  const options = useMemo(() => ({
    responsive: true,
    animations: {
      radius: { duration: 0 },
      borderWidth: { duration: 0 },
      backgroundColor: { duration: 0 },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Progress Over Time",
      },
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number }) => {
            const index = context.dataIndex;
            const metadata = data[index];
            const lines: string[] = [];
            
            // Add all metadata fields except code and progress values
            Object.entries(metadata).forEach(([key, value]) => {
              if (key !== 'code' && 
                  key !== 'normalized_code' && 
                  key !== 'dtw_est_progress' && 
                  key !== 'reg_est_progress' && 
                  key !== 'real_progress') {
                lines.push(`${key}: ${value}`);
              }
            });
            
            return lines;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1.025
      },
    },
    onClick: (
      event: ChartEvent,
      elements: ActiveElement[]
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e: any = event;
      const multiSelect = e.altKey || e.ctrlKey || e.metaKey || e.native?.altKey || e.native?.ctrlKey || e.native?.metaKey;
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const point: ChartPoint = {
          code: (data[index] as GraphData)["code"] as string | null,
          metadata: { ...data[index], snapshot: index + 1 } as Metadata,
        };
        onClickPoint(point, multiSelect);
      } else {
        onClickPoint(null, multiSelect);
      }
    },
  }), [data, onClickPoint]);

  // Effect to update point styling without regenerating datasets
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    const total = data.length;
    const createArray = <T,>(callback: (idx: number) => T): T[] => Array.from({ length: total }, (_, idx) => callback(idx));

    const isSelected = (idx:number)=> selectedSnapshots.includes(idx+1);

    // Estimated dataset = 0 , Real =1
    const reg_est = chart.data.datasets[0];
    const real = chart.data.datasets[1];

    reg_est.pointRadius = createArray(i => isSelected(i)?8:4);
    reg_est.pointBorderWidth = createArray(i => isSelected(i)?2:1);
    reg_est.pointBorderColor = createArray(i => isSelected(i)?'black':'rgb(141, 99, 255)');

    real.pointRadius = createArray(i => isSelected(i)?8:4);
    real.pointBorderWidth = createArray(i => isSelected(i)?2:1);
    real.pointBorderColor = createArray(i => isSelected(i)?'black':'rgb(255, 99, 132)');

    chart.update('none');
  }, [selectedSnapshots, data]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <Line ref={chartRef} data={baseChartData} options={options} />
    </div>
  );
}

export default LineChartComponent;
