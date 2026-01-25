import { Metadata } from "@/app/types/graph";

export const renderMetadata = (metadata: Metadata) => {
    const fields = [
      { key: 'snapshot', label: 'Snapshot' },
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'action', label: 'Action' },
      { key: 'correct', label: 'Correct' },
    ];

    return (
      <div className="bg-gray-400 p-4 rounded">
        {fields.map(({ key, label }) => (
          <div key={key} className="mb-2">
            <span className="font-medium">{label}: </span>
            <span>{String(metadata[key] || '-')}</span>
          </div>
        ))}
      </div>
    );
};