import React from 'react';
import { WavFile } from '../../shared/types';
import { AudioWaveform } from './AudioWaveform';
import { SampleInfo } from './SampleInfo';
import { SampleTechnicalDetails } from './SampleTechnicalDetails';

interface SampleViewProps {
  sample: WavFile;
  autoPlay?: boolean;
  onRenameComplete?: (newPath: string) => void;
}

export const SampleView: React.FC<SampleViewProps> = ({ sample, autoPlay = false, onRenameComplete }) => {
  return (
    <div className="space-y-4">
      {/* Section 1: Editable information (Name, Description) */}
      <SampleInfo sample={sample} onRenameComplete={onRenameComplete} />

      {/* Section 2: Audio player (waveform and controls) */}
      <AudioWaveform samplePath={sample.path} autoPlay={autoPlay} />

      {/* Section 3: Technical data (sample rate, bit depth, channels) */}
      <SampleTechnicalDetails sample={sample} />
    </div>
  );
};
