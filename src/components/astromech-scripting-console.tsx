"use client";

import React, { useState, useEffect } from 'react';
import {
    Play,
    Save,
    Trash2,
    Code,
    AlertCircle,
    FileCode,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';

interface Routine {
    id: string;
    name: string;
    script: string;
    createdAt: string;
}

const baseUrl = '/astromech';

// Example routines with proper command structure
const DEFAULT_ROUTINES: Routine[] = [
    {
        id: '1',
        name: 'Dome Panel Wave',
        script: JSON.stringify({
            commands: [
                { servo: "Pie Panel 1", angle: 0 },
                { delay: 500 },
                { servo: "Pie Panel 1", angle: 90 },
                { delay: 500 },
                { servo: "Pie Panel 1", angle: 0 }
            ]
        }, null, 2),
        createdAt: new Date().toISOString()
    }
];

export const AstromechScriptingConsole = () => {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [scriptInput, setScriptInput] = useState('');
    const [routineName, setRoutineName] = useState('');
    const [routineError, setRoutineError] = useState<string | null>(null);
    const [formatSuccess, setFormatSuccess] = useState(false);
    const [expandedRoutines, setExpandedRoutines] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadRoutines();
    }, []);

    const loadRoutines = () => {
        try {
            const savedRoutines = localStorage.getItem('r2d2-routines');
            if (savedRoutines) {
                const parsedRoutines = JSON.parse(savedRoutines);
                setRoutines(parsedRoutines);
            } else {
                // Initialize with default routines if none exist
                setRoutines(DEFAULT_ROUTINES);
                localStorage.setItem('r2d2-routines', JSON.stringify(DEFAULT_ROUTINES));
            }
            // Initialize expanded state
            const expandedState: Record<string, boolean> = {};
            (savedRoutines ? JSON.parse(savedRoutines) : DEFAULT_ROUTINES).forEach((routine: Routine) => {
                expandedState[routine.id] = false;
            });
            setExpandedRoutines(expandedState);
        } catch (err) {
            console.error('Error loading routines:', err);
            setRoutineError('Failed to load saved routines');
        }
    };

    const formatJSON = () => {
        try {
            const parsed = JSON.parse(scriptInput);
            const formatted = JSON.stringify(parsed, null, 2);
            setScriptInput(formatted);
            setRoutineError(null);
            setFormatSuccess(true);
            setTimeout(() => setFormatSuccess(false), 2000);
        } catch (err) {
            setRoutineError('Invalid JSON format');
        }
    };

    const validatecommands = (script: any) => {
        if (!script.commands || !Array.isArray(script.commands)) {
            throw new Error('Script must contain a commands array');
        }

        script.commands.forEach((action: any, index: number) => {
            if (action.servo && (typeof action.angle !== 'number')) {
                throw new Error(`Invalid servo action at position ${index}: must include angle`);
            }
            if (action.delay && typeof action.delay !== 'number') {
                throw new Error(`Invalid delay at position ${index}: must be a number`);
            }
            if (action.audio && typeof action.audio !== 'string') {
                throw new Error(`Invalid audio at position ${index}: must be a string`);
            }
        });
    };

    const saveRoutine = () => {
        if (!routineName.trim()) {
            setRoutineError('Please enter a routine name');
            return;
        }

        try {
            const parsedScript = JSON.parse(scriptInput);
            validatecommands(parsedScript);

            const newRoutine: Routine = {
                id: Date.now().toString(),
                name: routineName.trim(),
                script: JSON.stringify(parsedScript, null, 2),
                createdAt: new Date().toISOString()
            };

            const updatedRoutines = [...routines, newRoutine];
            setRoutines(updatedRoutines);
            localStorage.setItem('r2d2-routines', JSON.stringify(updatedRoutines));

            setRoutineName('');
            setScriptInput('');
            setRoutineError(null);

            setExpandedRoutines(prev => ({
                ...prev,
                [newRoutine.id]: true
            }));

        } catch (err) {
            setRoutineError(err instanceof Error ? err.message : 'Invalid commands format');
        }
    };

    const deleteRoutine = (id: string) => {
        const updatedRoutines = routines.filter(r => r.id !== id);
        setRoutines(updatedRoutines);
        localStorage.setItem('r2d2-routines', JSON.stringify(updatedRoutines));

        const newExpandedRoutines = { ...expandedRoutines };
        delete newExpandedRoutines[id];
        setExpandedRoutines(newExpandedRoutines);
    };

    const runRoutine = async (script: string) => {
        try {
            const parsedScript = JSON.parse(script);
            validatecommands(parsedScript);
            await axios.post(`${baseUrl}/routine`, parsedScript);
            setRoutineError(null);
        } catch (err) {
            console.error('Routine execution error:', err);
            setRoutineError(err instanceof Error ? err.message : 'Failed to execute routine');
        }
    };

    const toggleRoutine = (routineId: string) => {
        setExpandedRoutines(prev => ({
            ...prev,
            [routineId]: !prev[routineId]
        }));
    };

    return (
        <Card className="bg-zinc-800 border-blue-500/30 md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center text-blue-400 font-mono">
                    <Code className="mr-2" /> ASTROMECH SCRIPTING CONSOLE
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* New Routine Input */}
                    <div className="space-y-4 p-4 bg-black/30 rounded-lg">
                        <div className="flex space-x-4">
                            <input
                                type="text"
                                value={routineName}
                                onChange={(e) => setRoutineName(e.target.value)}
                                placeholder="Routine Name"
                                className="flex-1 bg-transparent border border-blue-500/30 rounded-md px-4 py-2
                  text-blue-400 font-mono placeholder:text-blue-400/30 focus:outline-none focus:border-blue-500"
                            />
                            <Button
                                variant="outline"
                                className={`border-blue-500/30 hover:bg-blue-500/10 ${
                                    formatSuccess ? 'text-green-400' : 'text-blue-400/70'
                                }`}
                                onClick={formatJSON}
                            >
                                <FileCode className="w-4 h-4 mr-2" />
                                Format
                            </Button>
                            <Button
                                variant="outline"
                                className="border-blue-500/30 text-blue-400/70 hover:bg-blue-500/10"
                                onClick={saveRoutine}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save
                            </Button>
                        </div>
                        <textarea
                            value={scriptInput}
                            onChange={(e) => setScriptInput(e.target.value)}
                            placeholder={`Enter commands script...
Example:
{
  "commands": [
    { "servo": "head_rotation", "angle": 90 },
    { "delay": 1000 },
    { "audio": "Happy014.mp3" }
  ]
}`}
                            rows={8}
                            className="w-full bg-transparent border border-blue-500/30 rounded-md px-4 py-2
                text-blue-400 font-mono placeholder:text-blue-400/30 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Saved Routines */}
                    <div className="grid grid-cols-1 gap-4">
                        {routines.map((routine) => (
                            <div
                                key={routine.id}
                                className="bg-black/30 rounded-lg border border-blue-500/20"
                            >
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-blue-500/5"
                                    onClick={() => toggleRoutine(routine.id)}
                                >
                                    <div className="flex items-center text-blue-400 font-mono">
                                        {expandedRoutines[routine.id] ?
                                            <ChevronDown className="w-4 h-4 mr-2" /> :
                                            <ChevronRight className="w-4 h-4 mr-2" />
                                        }
                                        {routine.name}
                                        <span className="ml-2 text-xs text-blue-400/50">
                      {new Date(routine.createdAt).toLocaleDateString()}
                    </span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-blue-500/30 text-blue-400/70 hover:bg-blue-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScriptInput(routine.script);
                                                setRoutineName(`${routine.name} (Copy)`);
                                            }}
                                        >
                                            <Code className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-blue-500/30 text-blue-400/70 hover:bg-blue-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                runRoutine(routine.script);
                                            }}
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Run
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-red-500/30 text-red-400/70 hover:bg-red-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteRoutine(routine.id);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                {expandedRoutines[routine.id] && (
                                    <div className="px-4 pb-4">
                    <pre className="text-sm text-blue-400/50 font-mono bg-black/20 p-2 rounded overflow-x-auto">
                      <code>{routine.script}</code>
                    </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Error Display */}
                    {routineError && (
                        <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
                            <AlertCircle className="h-4 h-4" />
                            <AlertDescription className="font-mono">{routineError}</AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default AstromechScriptingConsole;