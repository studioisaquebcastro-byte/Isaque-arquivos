import React from 'react';
import {Composition} from 'remotion';
import {TracoFino} from './TracoFino';

export const RemotionRoot: React.FC = () => (
  <Composition id="TracoFino" component={TracoFino} durationInFrames={450} fps={30} width={1080} height={1920} />
);
