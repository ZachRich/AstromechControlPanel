// src/types/api.ts
export interface Servo {
  name: string;
  id: number;
  currentAngle: number;
  minAngle: number;
  maxAngle: number;
}

export interface Controller {
  id: number;
  name: string;
  status: 'online' | 'offline';
}

export interface AudioFile {
  name: string;
  duration?: number;
}

export interface AudioDurationResponse {
  duration: number;
}