"use client";

import React, { useState, useEffect } from 'react';
import {
    Loader2,
    Volume2,
    RotateCw,
    Power,
    PlayCircle,
    Terminal,
    AlertCircle,
    Activity,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image'
import { AstromechScriptingConsole } from './astromech-scripting-console';
import axios from 'axios';

interface Servo {
    name: string;
    controller_id: string;
    channel: number;
    min_angle: number;
    max_angle: number;
    min_pulse: number;
    max_pulse: number;
    description: string;
}

interface Controller {
    id: string;
    i2c_address: string;
    frequency: number;
}

interface AudioFile {
    name: string;
    path: string;
}

interface ServoResponse {
    [key: string]: Servo;
}

interface ControllerResponse {
    [key: string]: Controller;
}

const baseUrl = '/astromech';

export const IndustrialAutomatonPanel: React.FC = () => {
    const [servos, setServos] = useState<ServoResponse>({});
    const [controllers, setControllers] = useState<ControllerResponse>({});
    const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [servoAngles, setServoAngles] = useState<Record<string, number>>({});
    const [componentStatus, setComponentStatus] = useState({
        servos: false,
        controllers: false,
        audio: false
    });

    useEffect(() => {
        const fetchServos = async () => {
            try {
                console.log('Fetching servos from:', `${baseUrl}/servos`);
                const servosResponse = await axios.get(`${baseUrl}/servos`);
                setServos(servosResponse.data);

                const initialAngles: Record<string, number> = {};
                Object.values(servosResponse.data as ServoResponse).forEach((servo: Servo) => {
                    initialAngles[servo.name] = servo.min_angle;
                });
                setServoAngles(initialAngles);
                setComponentStatus(prev => ({ ...prev, servos: true }));
            } catch (err) {
                console.error('Servo fetch error:', err);
                setError('Warning: Servo data incomplete - Check R2 unit connection');
            }
        };

        const fetchControllers = async () => {
            try {
                console.log('Fetching controllers from:', `${baseUrl}/controllers`);
                const controllersResponse = await axios.get(`${baseUrl}/controllers`);
                setControllers(controllersResponse.data);
                setComponentStatus(prev => ({ ...prev, controllers: true }));
            } catch (err) {
                console.error('Controller fetch error:', err);
                setError('Warning: Controller data incomplete - Check R2 unit connection');
            }
        };

        const fetchAudio = async () => {
            try {
                console.log('Fetching audio from:', `${baseUrl}/audio`);
                const audioResponse = await axios.get(`${baseUrl}/audio`);
                setAudioFiles(audioResponse.data);
                setComponentStatus(prev => ({ ...prev, audio: true }));
            } catch (err) {
                console.error('Audio fetch error:', err);
                setError('Warning: Audio data incomplete - Check R2 unit connection');
            }
        };

        const initializeSystem = async () => {
            setLoading(true);
            await Promise.all([
                fetchServos(),
                fetchControllers(),
                fetchAudio()
            ]);
            setLoading(false);
        };

        initializeSystem();
    }, []);

    const moveServo = async (servoName: string, angle: number) => {
        try {
            await axios.post(`${baseUrl}/servos/${servoName}/move`, { angle });
            setServoAngles(prev => ({ ...prev, [servoName]: angle }));
        } catch (err) {
            console.error('Move servo error:', err);
            setError(`Failed to move servo ${servoName}`);
        }
    };

    const playAudio = async (filename: string) => {
        try {
            await axios.post(`${baseUrl}/audio/play`, { filename });
        } catch (err) {
            console.error('Play audio error:', err);
            setError(`Failed to play audio ${filename}`);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const getPaginatedAudioFiles = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return audioFiles.slice(startIndex, endIndex);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-blue-400">
                <Loader2 className="w-16 h-16 animate-spin mb-4" />
                <div className="text-lg font-mono">INITIALIZING INDUSTRIAL AUTOMATON SYSTEMS</div>
                <div className="text-sm font-mono mt-2">Please stand by...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="border-b border-blue-500/30 pb-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-mono text-blue-400 flex items-center">
                                <Image src="/Industrial_Automaton.png" alt="Industrial Automaton" width={128} height={128}
                                       className="mr-2"/>
                                INDUSTRIAL AUTOMATON
                            </h1>
                            <p className="text-blue-300/70 mt-2 font-mono">
                                R2 Series Astromech Control Interface v0.1.0
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                                Object.values(componentStatus).every(status => status)
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                                <Power className="w-4 h-4" />
                                <span className="font-mono uppercase text-sm">
                  System {Object.values(componentStatus).every(status => status) ? 'Online' : 'Offline'}
                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-500/50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-mono">{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Servo Control Panel */}
                    <Card className="bg-zinc-800 border-blue-500/30">
                        <CardHeader>
                            <CardTitle className="flex items-center text-blue-400 font-mono">
                                <RotateCw className="mr-2" /> PANEL ACTUATOR CONTROL
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(servos).map(([servoName, servo]) => (
                                    <div key={servoName} className="p-4 bg-black/30 rounded-md space-y-3">
                                        <div className="flex flex-col space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-400 font-mono">{servo.name}</span>
                                                <span className="text-blue-400/70 font-mono">
                          {servoAngles[servo.name] || servo.min_angle}°
                        </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-blue-300/70 font-mono">
                                                <span>Controller: {servo.controller_id}</span>
                                                <span>Channel: {servo.channel}</span>
                                                <span>Min Angle: {servo.min_angle}°</span>
                                                <span>Max Angle: {servo.max_angle}°</span>
                                                <span>Min Pulse: {servo.min_pulse}</span>
                                                <span>Max Pulse: {servo.max_pulse}</span>
                                            </div>
                                            {servo.description && (
                                                <span className="text-sm text-blue-300/50 font-mono">
                          {servo.description}
                        </span>
                                            )}
                                        </div>
                                        <Slider
                                            value={[servoAngles[servo.name] || servo.min_angle]}
                                            min={servo.min_angle}
                                            max={servo.max_angle}
                                            step={1}
                                            onValueChange={(value) => moveServo(servo.name, value[0])}
                                            className="mt-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-800 border-blue-500/30">
                        <CardHeader>
                            <CardTitle className="flex items-center text-blue-400 font-mono">
                                <Volume2 className="mr-2" /> AUDIO SYSTEM
                            </CardTitle>
                            <div className="text-sm text-blue-400/70 font-mono">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, audioFiles.length)} of {audioFiles.length} files
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    {getPaginatedAudioFiles().map((file) => (
                                        <Button
                                            key={file.name}
                                            variant="outline"
                                            className="w-full flex justify-between items-center border-blue-500/30
              text-blue-400/70 hover:bg-blue-500/10 font-mono"
                                            onClick={() => playAudio(file.name)}
                                        >
                                            <div className="flex items-center">
                                                <PlayCircle className="mr-2 h-4 w-4" />
                                                <span className="text-left">
                <div>{file.name}</div>
                <div className="text-xs text-blue-300/50">{file.path}</div>
              </span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-blue-500/30">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-blue-500/30 text-blue-400/70 hover:bg-blue-500/10"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        Previous
                                    </Button>

                                    <div className="flex items-center space-x-2 font-mono text-blue-400/70">
                                        <span>Page {currentPage} of {Math.ceil(audioFiles.length / itemsPerPage)}</span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-blue-500/30 text-blue-400/70 hover:bg-blue-500/10"
                                        onClick={() => setCurrentPage(prev =>
                                            Math.min(Math.ceil(audioFiles.length / itemsPerPage), prev + 1)
                                        )}
                                        disabled={currentPage >= Math.ceil(audioFiles.length / itemsPerPage)}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Controller Status Panel */}
                    <Card className="bg-zinc-800 border-blue-500/30 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center text-blue-400 font-mono">
                                <Activity className="mr-2" /> COMM LINK CONTROLLERS
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(controllers).map(([controllerId, controller]) => (
                                    <div
                                        key={controllerId}
                                        className="p-4 rounded-lg bg-black/30 border border-blue-500/20 space-y-2"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-blue-400 text-lg">
                        {controller.id.toUpperCase()}
                      </span>
                                            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                        </div>
                                        <div className="space-y-1 font-mono">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-blue-400/70">I²C Address:</span>
                                                <span className="text-blue-400">{controller.i2c_address}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-blue-400/70">Frequency:</span>
                                                <span className="text-blue-400">{controller.frequency} Hz</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <AstromechScriptingConsole/>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-blue-400/30 font-mono text-sm">
                    INDUSTRIAL AUTOMATON // RESTRICTED ACCESS // AUTHORIZED PERSONNEL ONLY
                </div>
            </div>
        </div>
    );
};

export default IndustrialAutomatonPanel;