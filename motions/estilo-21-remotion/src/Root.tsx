import React from 'react';
import {Composition} from 'remotion';
import {DURATION, FPS, TracoFino} from './TracoFino';

export const RemotionRoot: React.FC = () => (
  <Composition id="TracoFino" component={TracoFino} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
