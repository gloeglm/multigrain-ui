import React, { useEffect, useState } from 'react';
import { WavFile } from '../../shared/types';

interface SampleTechnicalDetailsProps {
  sample: WavFile;
}

export const SampleTechnicalDetails: React.FC<SampleTechnicalDetailsProps> = ({ sample }) => {
  const [metadata, setMetadata] = useState<{
    sampleRate: number;
    bitDepth: number;
    channels: number;
  } | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Load metadata when sample changes
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const meta = await window.electronAPI.readAudioMetadata(sample.path);
        setMetadata({
          sampleRate: meta.sampleRate,
          bitDepth: meta.bitDepth,
          channels: meta.channels,
        });
        setMetadataError(null);
      } catch (error) {
        console.error('Error loading metadata:', error);
        setMetadataError('Error loading metadata');
      }
    };

    loadMetadata();
  }, [sample.path]);

  return (
    <div className="bg-white rounded border-2 border-panel-dark p-4">
      <h4 className="text-sm font-medium text-label-blue mb-3">Technical Details</h4>
      {metadataError ? (
        <p className="text-sm text-red-600">{metadataError}</p>
      ) : metadata ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-label-gray">Sample Rate:</span>
              <span className="ml-2 text-label-black">{metadata.sampleRate} Hz</span>
            </div>
            <div>
              <span className="text-label-gray">Bit Depth:</span>
              <span className="ml-2 text-label-black">{metadata.bitDepth} bit</span>
            </div>
            <div>
              <span className="text-label-gray">Channels:</span>
              <span className="ml-2 text-label-black">{metadata.channels}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-panel text-sm">
            <div className="mb-1">
              <span className="text-label-gray">Size:</span>
              <span className="ml-2 text-label-black">{(sample.size / 1024).toFixed(1)} KB</span>
            </div>
            <div className="text-xs text-label-gray break-all">{sample.path}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-label-gray">Loading...</p>
      )}
    </div>
  );
};
