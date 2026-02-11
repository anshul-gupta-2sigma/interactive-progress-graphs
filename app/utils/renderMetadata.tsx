import { Metadata } from "@/app/types/graph";

export const renderMetadata = (metadata: Metadata) => {
    const metadataFields = [
      { key: 'snapshot', label: 'Snapshot' },
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'action', label: 'Action' },
      { key: 'correct', label: 'Correct' },
    ];
    const progFields = [
      { key: 'real_progress', label: 'Real Progress' },
      { key: 'reg_est_prog', label: 'Estimated Progress' },
    ]

    return (
      <div className="bg-gray-400 p-4 rounded">
        {metadataFields.map(({ key, label }) => (
          <div key={key} className="mb-2">
            <span className="font-medium">{label}: </span>
            <span>{String(metadata[key] || '-')}</span>
          </div>
        ))}
        {progFields.map(({ key, label }) => (
          <div key={key} className="mb-2">
            <span className="font-medium">{label}: </span>
            <span>{String(((metadata[key] as number)*100).toFixed(2) || '-')}%</span>
          </div>
        ))}
      </div>
    );
};