// // // import React, { useState, useEffect, useRef } from 'react';
// // // import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
// // // import { PERSONAS } from './constants';
// // // import { Persona, PersonaId } from './types';
// // // import Visualizer from './components/Visualizer';
// // // import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './utils/audioUtils';

// // // const App: React.FC = () => {
// // //   const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
// // //   const [isConnected, setIsConnected] = useState(false);
// // //   const [error, setError] = useState<string | null>(null);
// // //   const [interactionMode, setInteractionMode] = useState<'idle' | 'listening' | 'speaking'>('idle');
  
// // //   // Refs for audio handling to avoid re-renders
// // //   const audioContextRef = useRef<AudioContext | null>(null);
// // //   const inputAudioContextRef = useRef<AudioContext | null>(null);
// // //   const nextStartTimeRef = useRef<number>(0);
// // //   const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
// // //   const sessionRef = useRef<Promise<any> | null>(null);
// // //   const streamRef = useRef<MediaStream | null>(null);
// // //   const processorRef = useRef<ScriptProcessorNode | null>(null);

// // //   // Cleanup on unmount
// // //   useEffect(() => {
// // //     return () => {
// // //       disconnect();
// // //     };
// // //     // eslint-disable-next-line react-hooks/exhaustive-deps
// // //   }, []);

// // //   const disconnect = () => {
// // //     if (streamRef.current) {
// // //       streamRef.current.getTracks().forEach(track => track.stop());
// // //       streamRef.current = null;
// // //     }
// // //     if (processorRef.current) {
// // //       processorRef.current.disconnect();
// // //       processorRef.current = null;
// // //     }
// // //     if (inputAudioContextRef.current) {
// // //       inputAudioContextRef.current.close();
// // //       inputAudioContextRef.current = null;
// // //     }
// // //     if (audioContextRef.current) {
// // //       audioContextRef.current.close();
// // //       audioContextRef.current = null;
// // //     }
    
// // //     // We can't strictly "close" the session promise object from the SDK, 
// // //     // but we can stop sending data and drop references.
// // //     if (sessionRef.current) {
// // //         sessionRef.current.then(session => {
// // //             // Check if close exists on session, though typescript definition might vary
// // //             if (typeof session.close === 'function') {
// // //                 session.close();
// // //             }
// // //         }).catch(() => {});
// // //         sessionRef.current = null;
// // //     }
    
// // //     sourcesRef.current.forEach(source => source.stop());
// // //     sourcesRef.current.clear();
    
// // //     setIsConnected(false);
// // //     setInteractionMode('idle');
// // //   };

// // //   const connectToGeminiLive = async () => {
// // //     setError(null);
// // //     try {
// // //       if (!import.meta.env.VITE_API_KEY) {
// // //         throw new Error("API Key is missing in environment variables.");
// // //       }

// // //       // 1. Setup Audio Output Context
// // //       const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
// // //       audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
// // //       nextStartTimeRef.current = audioContextRef.current.currentTime;

// // //       // 2. Setup Audio Input Context & Mic
// // //       inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
// // //       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
// // //       streamRef.current = stream;

// // //       // 3. Initialize Gemini Client
// // //       // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// // //       const ai = new GoogleGenAI({
// // //        apiKey: import.meta.env.VITE_API_KEY,
// // //       });
// // //       // 4. Connect to Live API
// // //       const sessionPromise = ai.live.connect({
// // //         model: 'gemini-2.5-flash-native-audio-preview-09-2025',
// // //         config: {
// // //           responseModalities: [Modality.AUDIO],
// // //           speechConfig: {
// // //             voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedPersona.voiceName } }
// // //           },
// // //           systemInstruction: selectedPersona.systemInstruction,
// // //         },
// // //         callbacks: {
// // //             onopen: () => {
// // //                 setIsConnected(true);
// // //                 setInteractionMode('listening');

// // //                 // Setup Input Processing pipeline
// // //                 if (!inputAudioContextRef.current || !streamRef.current) return;
                
// // //                 const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
// // //                 const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
// // //                 processorRef.current = processor;

// // //                 processor.onaudioprocess = (e) => {
// // //                     const inputData = e.inputBuffer.getChannelData(0);
// // //                     const pcmBlob = createPcmBlob(inputData);
                    
// // //                     sessionPromise.then((session) => {
// // //                         session.sendRealtimeInput({ media: pcmBlob });
// // //                     });
// // //                 };

// // //                 source.connect(processor);
// // //                 processor.connect(inputAudioContextRef.current.destination);
// // //             },
// // //             onmessage: async (message: LiveServerMessage) => {
// // //                 const serverContent = message.serverContent;

// // //                 // Handle Interruption
// // //                 if (serverContent?.interrupted) {
// // //                     sourcesRef.current.forEach(source => {
// // //                         source.stop();
// // //                         sourcesRef.current.delete(source);
// // //                     });
// // //                     if (audioContextRef.current) {
// // //                          nextStartTimeRef.current = audioContextRef.current.currentTime;
// // //                     }
// // //                     setInteractionMode('listening');
// // //                     return;
// // //                 }

// // //                 // Handle Audio Output
// // //                 const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
// // //                 if (base64Audio && audioContextRef.current) {
// // //                     setInteractionMode('speaking');
                    
// // //                     const audioData = base64ToUint8Array(base64Audio);
// // //                     const audioBuffer = await decodeAudioData(
// // //                         audioData,
// // //                         audioContextRef.current,
// // //                         24000,
// // //                         1
// // //                     );

// // //                     // Schedule playback
// // //                     const ctx = audioContextRef.current;
// // //                     const source = ctx.createBufferSource();
// // //                     source.buffer = audioBuffer;
// // //                     source.connect(ctx.destination);
                    
// // //                     // Ensure smooth queueing
// // //                     const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
// // //                     source.start(startTime);
// // //                     nextStartTimeRef.current = startTime + audioBuffer.duration;
                    
// // //                     sourcesRef.current.add(source);

// // //                     source.onended = () => {
// // //                         sourcesRef.current.delete(source);
// // //                         if (sourcesRef.current.size === 0) {
// // //                             setInteractionMode('listening');
// // //                         }
// // //                     };
// // //                 }
                
// // //                 // Handle Turn Complete (optional: strictly to reset state if needed)
// // //                 if (serverContent?.turnComplete) {
// // //                    // Logic if needed when model finishes a turn
// // //                 }
// // //             },
// // //             onclose: () => {
// // //                 setIsConnected(false);
// // //                 setInteractionMode('idle');
// // //             },
// // //             onerror: (e) => {
// // //                 console.error("Gemini Live Error", e);
// // //                 setError("Connection error occurred.");
// // //                 disconnect();
// // //             }
// // //         }
// // //       });
      
// // //       sessionRef.current = sessionPromise;

// // //     } catch (err: any) {
// // //       setError(err.message || "Failed to connect");
// // //       setIsConnected(false);
// // //     }
// // //   };

// // //   const handlePersonaSelect = (persona: Persona) => {
// // //     if (isConnected) {
// // //       // Ideally, we should be able to update config live, but simple approach is restart
// // //       disconnect();
// // //     }
// // //     setSelectedPersona(persona);
// // //   };

// // //   return (
// // //     <div className="min-h-screen bg-studio-900 text-white font-sans selection:bg-accent-pink selection:text-white flex flex-col">
// // //       {/* Header */}
// // //       <header className="border-b border-studio-700 bg-studio-800/50 backdrop-blur-md sticky top-0 z-10">
// // //         <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
// // //           <div className="flex items-center gap-2">
// // //              <div className="w-8 h-8 bg-gradient-to-br from-accent-pink to-purple-600 rounded-full flex items-center justify-center">
// // //                 <span className="text-lg">🎙️</span>
// // //              </div>
// // //              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-studio-400">
// // //                MimiTalks
// // //              </h1>
// // //           </div>
// // //           <div className="text-xs font-medium px-2 py-1 rounded bg-studio-700 text-studio-400">
// // //             AI-Powered
// // //           </div>
// // //         </div>
// // //       </header>

// // //       <main className="flex-grow flex flex-col items-center max-w-5xl mx-auto w-full px-4 py-8 gap-8">
        
// // //         {/* Main Stage */}
// // //         <div className="w-full bg-studio-800 rounded-3xl p-8 border border-studio-700 shadow-2xl relative overflow-hidden">
// // //            {/* Background Glow */}
// // //            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-1000 ${selectedPersona.color}`}></div>

// // //            <div className="relative z-10 flex flex-col items-center gap-6 text-center">
              
// // //               <div className="relative">
// // //                 <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-xl ${selectedPersona.color} transition-transform duration-300 ${interactionMode === 'speaking' ? 'scale-110' : 'scale-100'}`}>
// // //                   {selectedPersona.emoji}
// // //                 </div>
// // //                 {isConnected && (
// // //                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded-full border-2 border-studio-800">
// // //                      LIVE
// // //                    </div>
// // //                 )}
// // //               </div>

// // //               <div>
// // //                 <h2 className="text-3xl font-bold">{selectedPersona.name}</h2>
// // //                 <p className="text-studio-400 mt-2 max-w-md mx-auto">{selectedPersona.description}</p>
// // //               </div>

// // //               {/* Visualizer */}
// // //               <div className="h-24 w-full flex items-center justify-center bg-studio-900/50 rounded-xl border border-studio-700/50">
// // //                   {isConnected ? (
// // //                     <Visualizer isActive={interactionMode !== 'idle'} mode={interactionMode} />
// // //                   ) : (
// // //                     <div className="text-studio-500 text-sm">Ready to start conversation</div>
// // //                   )}
// // //               </div>

// // //               {/* Controls */}
// // //               <div className="flex flex-col items-center gap-4 mt-4">
// // //                  {error && (
// // //                    <div className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50">
// // //                      {error}
// // //                    </div>
// // //                  )}
                 
// // //                  {!isConnected ? (
// // //                    <button 
// // //                      onClick={connectToGeminiLive}
// // //                      className="bg-gradient-to-r from-accent-pink to-purple-600 hover:from-accent-pink/90 hover:to-purple-600/90 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-accent-pink/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
// // //                    >
// // //                      <span>Start Conversation</span>
// // //                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// // //                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
// // //                      </svg>
// // //                    </button>
// // //                  ) : (
// // //                    <button 
// // //                      onClick={disconnect}
// // //                      className="bg-studio-700 hover:bg-red-600/80 text-white font-semibold py-3 px-8 rounded-full transition-colors flex items-center gap-2 border border-studio-600"
// // //                    >
// // //                      <span>End Call</span>
// // //                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// // //                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
// // //                      </svg>
// // //                    </button>
// // //                  )}
// // //               </div>
// // //            </div>
// // //         </div>

// // //         {/* Persona Grid */}
// // //         <div className="w-full">
// // //           <h3 className="text-xl font-semibold mb-4 text-studio-100">Select Personality</h3>
// // //           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
// // //              {PERSONAS.map((persona) => (
// // //                <button
// // //                  key={persona.id}
// // //                  onClick={() => handlePersonaSelect(persona)}
// // //                  className={`group relative p-4 rounded-xl text-left transition-all border ${selectedPersona.id === persona.id ? 'bg-studio-800 border-accent-pink shadow-lg shadow-accent-pink/10' : 'bg-studio-800/50 border-studio-700 hover:border-studio-500 hover:bg-studio-800'}`}
// // //                >
// // //                  <div className="text-3xl mb-2 transform group-hover:scale-110 transition-transform duration-200">
// // //                    {persona.emoji}
// // //                  </div>
// // //                  <div className="font-bold text-sm mb-1">{persona.name}</div>
// // //                  <div className="text-[10px] text-studio-400 leading-tight">
// // //                    {persona.description}
// // //                  </div>
// // //                  {selectedPersona.id === persona.id && (
// // //                     <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-pink animate-pulse"></div>
// // //                  )}
// // //                </button>
// // //              ))}
// // //           </div>
// // //         </div>

// // //         {/* Info Section */}
// // //         <div className="w-full bg-studio-800/30 rounded-xl p-6 border border-studio-700/50 text-sm text-studio-400">
// // //            <h4 className="font-bold text-studio-100 mb-2">How to use:</h4>
// // //            <ul className="list-disc pl-5 space-y-1">
// // //              <li>Select a persona (e.g., Sassy Bestie, Cute Girl).</li>
// // //              <li>Click "Start Conversation" and allow microphone access.</li>
// // //              <li>Speak naturally in Hindi or English. The AI will respond in mixed "Hinglish".</li>
// // //              <li>Perfect for testing content ideas, funny dialogues, or roleplay scenarios.</li>
// // //            </ul>
// // //            <div className="mt-4 pt-4 border-t border-studio-700/50 text-xs text-studio-500 text-center">
// // //               Disclaimer: For entertainment purposes only. Not to be used for deception or real-world impersonation.
// // //            </div>
// // //         </div>

// // //       </main>
// // //     </div>
// // //   );
// // // };

// // // export default App;
// // import React, { useState, useEffect, useRef } from 'react';
// // import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
// // import { PERSONAS } from './constants';
// // import { Persona } from './types';
// // import Visualizer from './components/Visualizer';
// // import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './utils/audioUtils';

// // // --- Icons (Hero Icons Style) ---
// // const MicIcon = ({ className }: { className?: string }) => (
// //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
// //     <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
// //     <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
// //   </svg>
// // );

// // const SparklesIcon = ({ className }: { className?: string }) => (
// //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
// //     <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15.75a.75.75 0 01.721.544l.19.665a1.125 1.125 0 00.773.773l.665.19a.75.75 0 010 1.442l-.665.19a1.125 1.125 0 00-.773.773l-.19.665a.75.75 0 01-1.442 0l-.19-.665a1.125 1.125 0 00-.773-.773l-.665-.19a.75.75 0 010-1.442l.665-.19a1.125 1.125 0 00.773-.773l.19-.665A.75.75 0 019 15.75z" clipRule="evenodd" />
// //   </svg>
// // );

// // const StopIcon = ({ className }: { className?: string }) => (
// //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
// //     <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
// //   </svg>
// // );

// // const PhoneXMarkIcon = ({ className }: { className?: string }) => (
// //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
// //     <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 5.25V4.5z" clipRule="evenodd" />
// //     <path d="M17.25 4.5a.75.75 0 011.5 0v2.25h2.25a.75.75 0 010 1.5h-2.25v2.25a.75.75 0 01-1.5 0v-2.25h-2.25a.75.75 0 010-1.5h2.25V4.5z" />
// //   </svg>
// // );

// // const App: React.FC = () => {
// //   const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
// //   const [isConnected, setIsConnected] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [interactionMode, setInteractionMode] = useState<'idle' | 'listening' | 'speaking'>('idle');
  
// //   // Refs
// //   const audioContextRef = useRef<AudioContext | null>(null);
// //   const inputAudioContextRef = useRef<AudioContext | null>(null);
// //   const nextStartTimeRef = useRef<number>(0);
// //   const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
// //   const sessionRef = useRef<Promise<any> | null>(null);
// //   const streamRef = useRef<MediaStream | null>(null);
// //   const processorRef = useRef<ScriptProcessorNode | null>(null);

// //   // Cleanup
// //   useEffect(() => {
// //     return () => disconnect();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, []);

// //   const disconnect = () => {
// //     if (streamRef.current) {
// //       streamRef.current.getTracks().forEach(track => track.stop());
// //       streamRef.current = null;
// //     }
// //     if (processorRef.current) {
// //       processorRef.current.disconnect();
// //       processorRef.current = null;
// //     }
// //     if (inputAudioContextRef.current) {
// //       inputAudioContextRef.current.close();
// //       inputAudioContextRef.current = null;
// //     }
// //     if (audioContextRef.current) {
// //       audioContextRef.current.close();
// //       audioContextRef.current = null;
// //     }
    
// //     if (sessionRef.current) {
// //         sessionRef.current.then(session => {
// //             if (typeof session.close === 'function') {
// //                 session.close();
// //             }
// //         }).catch(() => {});
// //         sessionRef.current = null;
// //     }
    
// //     sourcesRef.current.forEach(source => source.stop());
// //     sourcesRef.current.clear();
    
// //     setIsConnected(false);
// //     setInteractionMode('idle');
// //   };

// //   const connectToGeminiLive = async () => {
// //     setError(null);
// //     try {
// //       if (!import.meta.env.VITE_API_KEY) {
// //         throw new Error("API Key is missing.");
// //       }

// //       const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
// //       audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
// //       nextStartTimeRef.current = audioContextRef.current.currentTime;

// //       inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
// //       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
// //       streamRef.current = stream;

// //       const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      
// //       const sessionPromise = ai.live.connect({
// //         model: 'gemini-2.5-flash-native-audio-preview-09-2025',
// //         config: {
// //           responseModalities: [Modality.AUDIO],
// //           speechConfig: {
// //             voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedPersona.voiceName } }
// //           },
// //           systemInstruction: selectedPersona.systemInstruction,
// //         },
// //         callbacks: {
// //             onopen: () => {
// //                 setIsConnected(true);
// //                 setInteractionMode('listening');

// //                 if (!inputAudioContextRef.current || !streamRef.current) return;
                
// //                 const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
// //                 const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
// //                 processorRef.current = processor;

// //                 processor.onaudioprocess = (e) => {
// //                     const inputData = e.inputBuffer.getChannelData(0);
// //                     const pcmBlob = createPcmBlob(inputData);
// //                     sessionPromise.then((session) => {
// //                         session.sendRealtimeInput({ media: pcmBlob });
// //                     });
// //                 };
// //                 source.connect(processor);
// //                 processor.connect(inputAudioContextRef.current.destination);
// //             },
// //             onmessage: async (message: LiveServerMessage) => {
// //                 const serverContent = message.serverContent;
// //                 if (serverContent?.interrupted) {
// //                     sourcesRef.current.forEach(source => {
// //                         source.stop();
// //                         sourcesRef.current.delete(source);
// //                     });
// //                     if (audioContextRef.current) {
// //                          nextStartTimeRef.current = audioContextRef.current.currentTime;
// //                     }
// //                     setInteractionMode('listening');
// //                     return;
// //                 }

// //                 const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
// //                 if (base64Audio && audioContextRef.current) {
// //                     setInteractionMode('speaking');
// //                     const audioData = base64ToUint8Array(base64Audio);
// //                     const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
// //                     const ctx = audioContextRef.current;
// //                     const source = ctx.createBufferSource();
// //                     source.buffer = audioBuffer;
// //                     source.connect(ctx.destination);
// //                     const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
// //                     source.start(startTime);
// //                     nextStartTimeRef.current = startTime + audioBuffer.duration;
// //                     sourcesRef.current.add(source);
// //                     source.onended = () => {
// //                         sourcesRef.current.delete(source);
// //                         if (sourcesRef.current.size === 0) setInteractionMode('listening');
// //                     };
// //                 }
// //             },
// //             onclose: () => {
// //                 setIsConnected(false);
// //                 setInteractionMode('idle');
// //             },
// //             onerror: (e) => {
// //                 console.error("Gemini Live Error", e);
// //                 setError("Connection interrupted.");
// //                 disconnect();
// //             }
// //         }
// //       });
// //       sessionRef.current = sessionPromise;
// //     } catch (err: any) {
// //       setError(err.message || "Failed to connect");
// //       setIsConnected(false);
// //     }
// //   };

// //   const handlePersonaSelect = (persona: Persona) => {
// //     if (isConnected) disconnect();
// //     setSelectedPersona(persona);
// //   };

// //   // Helper to map Tailwind classes to inline styles for dynamic glowing colors
// //   const getGlowColor = (tailwindColorClass: string) => {
// //       // Simple mapping for demo purposes, in production use a comprehensive map or hex codes in persona object
// //       if(tailwindColorClass.includes('orange')) return '#f97316'; // Orange
// //       if(tailwindColorClass.includes('pink')) return '#ec4899'; // Pink
// //       if(tailwindColorClass.includes('purple')) return '#a855f7'; // Purple
// //       if(tailwindColorClass.includes('blue')) return '#3b82f6'; // Blue
// //       if(tailwindColorClass.includes('green')) return '#22c55e'; // Green
// //       return '#f97316';
// //   };

// //   const glowColor = getGlowColor(selectedPersona.color);

// //   return (
// //     <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-white/20 flex flex-col relative overflow-x-hidden">
      
// //       {/* --- Ambient Background --- */}
// //       <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
// //          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[120px] animate-pulse" />
// //          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
// //          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gray-900/40 blur-[100px]" />
// //          {/* Dynamic Persona Ambient Glow */}
// //          <div 
// //             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[150px] transition-colors duration-1000 opacity-30"
// //             style={{ backgroundColor: glowColor }}
// //          />
// //       </div>

// //       {/* --- Header --- */}
// //       <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/70 backdrop-blur-xl">
// //         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
// //           <div className="flex items-center gap-3">
// //              <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-xl border border-white/10 flex items-center justify-center shadow-lg shadow-black/50">
// //                 <SparklesIcon className="w-5 h-5 text-white" />
// //              </div>
// //              <h1 className="text-2xl font-bold tracking-tight text-white">
// //                Mimi<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Talks</span>
// //              </h1>
// //           </div>
// //           <div className="flex items-center gap-3">
// //             <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
// //             <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
// //               {isConnected ? 'System Online' : 'Standby'}
// //             </span>
// //           </div>
// //         </div>
// //       </header>

// //       <main className="flex-grow flex flex-col items-center max-w-5xl mx-auto w-full px-6 py-12 gap-12 z-10">
        
// //         {/* --- Main Holographic Stage --- */}
// //         <div className="w-full relative group">
// //             {/* Decorative border glow */}
// //             <div 
// //                 className="absolute -inset-0.5 rounded-[2rem] opacity-75 blur transition duration-1000 group-hover:opacity-100"
// //                 style={{ background: `linear-gradient(to right, ${glowColor}40, transparent, ${glowColor}40)` }}
// //             ></div>
            
// //             <div className="relative w-full bg-[#121212]/80 backdrop-blur-2xl rounded-[2rem] p-8 md:p-12 border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center text-center">
                
// //                 {/* Grid Pattern Overlay */}
// //                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
// //                 <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, #ffffff 25%, #ffffff 26%, transparent 27%, transparent 74%, #ffffff 75%, #ffffff 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #ffffff 25%, #ffffff 26%, transparent 27%, transparent 74%, #ffffff 75%, #ffffff 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}></div>

// //                 {/* Avatar / Emitter */}
// //                 <div className="relative mb-8">
// //                     <div 
// //                         className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-2xl border-4 border-[#1a1a1a] relative z-10 transition-transform duration-500 ${interactionMode === 'speaking' ? 'scale-110' : 'scale-100'}`}
// //                         style={{ backgroundColor: '#1a1a1a' }}
// //                     >
// //                         {selectedPersona.emoji}
                        
// //                         {/* Ripple Effect when speaking */}
// //                         {interactionMode === 'speaking' && (
// //                             <>
// //                                 <div className="absolute inset-0 rounded-full border border-white/30 animate-ping" />
// //                                 <div className="absolute -inset-4 rounded-full border border-white/10 animate-pulse" />
// //                             </>
// //                         )}
// //                     </div>
// //                     {/* Status Badge */}
// //                     {isConnected && (
// //                         <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/90 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full border border-green-500/30 shadow-lg backdrop-blur-md flex items-center gap-1">
// //                             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
// //                             LIVE
// //                         </div>
// //                     )}
// //                 </div>

// //                 {/* Text Content */}
// //                 <div className="relative z-10 mb-8 max-w-2xl">
// //                     <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">
// //                         {selectedPersona.name}
// //                     </h2>
// //                     <p className="text-lg text-gray-400 font-light leading-relaxed">
// //                         {selectedPersona.description}
// //                     </p>
// //                 </div>

// //                 {/* Visualizer Container */}
// //                 <div className="w-full h-24 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center mb-8 overflow-hidden relative">
// //                      {isConnected ? (
// //                          <div className="w-full px-4 opacity-80">
// //                             {/* Passing color to visualizer helps consistency */}
// //                             <Visualizer isActive={interactionMode !== 'idle'} mode={interactionMode} barColor={glowColor} />
// //                          </div>
// //                      ) : (
// //                          <div className="flex items-center gap-2 text-gray-600 text-sm font-mono uppercase tracking-widest">
// //                              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
// //                              Awaiting Audio Input
// //                              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
// //                          </div>
// //                      )}
// //                 </div>

// //                 {/* Action Buttons */}
// //                 <div className="relative z-20 flex flex-col items-center gap-4 w-full">
// //                     {error && (
// //                         <div className="text-red-400 text-sm bg-red-950/30 px-6 py-2 rounded-lg border border-red-500/20 flex items-center gap-2">
// //                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
// //                            {error}
// //                         </div>
// //                     )}

// //                     {!isConnected ? (
// //                         <button 
// //                             onClick={connectToGeminiLive}
// //                             className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center gap-3 overflow-hidden"
// //                         >
// //                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
// //                             <MicIcon className="w-6 h-6" />
// //                             <span>Initialize Voice Link</span>
// //                         </button>
// //                     ) : (
// //                         <button 
// //                             onClick={disconnect}
// //                             className="group px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-lg rounded-full border border-red-500/30 hover:border-red-500/50 transition-all duration-300 flex items-center gap-3 backdrop-blur-md"
// //                         >
// //                             <PhoneXMarkIcon className="w-6 h-6" />
// //                             <span>Terminate Session</span>
// //                         </button>
// //                     )}
// //                 </div>
// //             </div>
// //         </div>

// //         {/* --- Persona Selector --- */}
// //         <div className="w-full">
// //           <div className="flex items-center gap-3 mb-6">
// //              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
// //              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Select Personality</h3>
// //              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
// //           </div>
          
// //           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
// //              {PERSONAS.map((persona) => {
// //                 const isSelected = selectedPersona.id === persona.id;
// //                 return (
// //                     <button
// //                         key={persona.id}
// //                         onClick={() => handlePersonaSelect(persona)}
// //                         className={`
// //                             group relative p-5 rounded-2xl text-left transition-all duration-300 border backdrop-blur-sm
// //                             ${isSelected 
// //                                 ? 'bg-white/10 border-white/20 shadow-2xl scale-[1.02]' 
// //                                 : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
// //                             }
// //                         `}
// //                     >
// //                         {isSelected && (
// //                             <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
// //                         )}
                        
// //                         <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
// //                             {persona.emoji}
// //                         </div>
// //                         <div className={`font-bold text-sm mb-2 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
// //                             {persona.name}
// //                         </div>
// //                         <div className="text-[10px] text-gray-500 leading-tight line-clamp-2 group-hover:text-gray-400">
// //                             {persona.description}
// //                         </div>
// //                     </button>
// //                 );
// //              })}
// //           </div>
// //         </div>

// //         {/* --- Info Footer --- */}
// //         <div className="w-full bg-[#121212]/50 rounded-xl p-6 border border-white/5 text-xs text-gray-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-md">
// //             <div className="flex gap-6">
// //                 <div>
// //                     <span className="font-bold text-gray-300 block mb-1">Usage</span>
// //                     <p>Select persona • Click Initialize • Speak</p>
// //                 </div>
// //                 <div>
// //                     <span className="font-bold text-gray-300 block mb-1">Engine</span>
// //                     <p>Gemini 2.5 Multimodal Live API</p>
// //                 </div>
// //             </div>
// //             <div className="text-right opacity-50">
// //                 MimiTalks AI Interface v2.0<br/>
// //                 Experimental Build
// //             </div>
// //         </div>

// //       </main>
// //     </div>
// //   );
// // };

// // export default App;
// import React, { useState, useEffect, useRef } from 'react';
// import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
// import { PERSONAS } from './constants';
// import { Persona } from './types';
// import Visualizer from './components/Visualizer';
// import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './utils/audioUtils';

// // --- Icons (Inline SVGs to ensure no dependency errors) ---
// const ArrowRightIcon = ({ className }: { className?: string }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
//     <line x1="5" y1="12" x2="19" y2="12"></line>
//     <polyline points="12 5 19 12 12 19"></polyline>
//   </svg>
// );

// const PowerIcon = ({ className }: { className?: string }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
//     <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
//     <line x1="12" y1="2" x2="12" y2="12"></line>
//   </svg>
// );

// const SparklesIcon = ({ className }: { className?: string }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
//     <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15.75a.75.75 0 01.721.544l.19.665a1.125 1.125 0 00.773.773l.665.19a.75.75 0 010 1.442l-.665.19a1.125 1.125 0 00-.773.773l-.19.665a.75.75 0 01-1.442 0l-.19-.665a1.125 1.125 0 00-.773-.773l-.665-.19a.75.75 0 010-1.442l.665-.19a1.125 1.125 0 00.773-.773l.19-.665A.75.75 0 019 15.75z" clipRule="evenodd" />
//   </svg>
// );

// const App: React.FC = () => {
//   // --- STATE & REFS (Original Functionality) ---
//   const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
//   const [isConnected, setIsConnected] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [interactionMode, setInteractionMode] = useState<'idle' | 'listening' | 'speaking'>('idle');
  
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const inputAudioContextRef = useRef<AudioContext | null>(null);
//   const nextStartTimeRef = useRef<number>(0);
//   const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
//   const sessionRef = useRef<Promise<any> | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const processorRef = useRef<ScriptProcessorNode | null>(null);

//   // Cleanup
//   useEffect(() => {
//     return () => disconnect();
//   }, []);

//   const disconnect = () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//       streamRef.current = null;
//     }
//     if (processorRef.current) {
//       processorRef.current.disconnect();
//       processorRef.current = null;
//     }
//     if (inputAudioContextRef.current) {
//       inputAudioContextRef.current.close();
//       inputAudioContextRef.current = null;
//     }
//     if (audioContextRef.current) {
//       audioContextRef.current.close();
//       audioContextRef.current = null;
//     }
//     if (sessionRef.current) {
//         sessionRef.current.then(session => {
//             if (typeof session.close === 'function') session.close();
//         }).catch(() => {});
//         sessionRef.current = null;
//     }
//     sourcesRef.current.forEach(source => source.stop());
//     sourcesRef.current.clear();
//     setIsConnected(false);
//     setInteractionMode('idle');
//   };

//   const connectToGeminiLive = async () => {
//     setError(null);
//     try {
//       if (!import.meta.env.VITE_API_KEY) throw new Error("API Key is missing.");

//       const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
//       audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
//       nextStartTimeRef.current = audioContextRef.current.currentTime;

//       inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;

//       const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      
//       const sessionPromise = ai.live.connect({
//         model: 'gemini-2.5-flash-native-audio-preview-09-2025',
//         config: {
//           responseModalities: [Modality.AUDIO],
//           speechConfig: {
//             voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedPersona.voiceName } }
//           },
//           systemInstruction: selectedPersona.systemInstruction,
//         },
//         callbacks: {
//             onopen: () => {
//                 setIsConnected(true);
//                 setInteractionMode('listening');
//                 if (!inputAudioContextRef.current || !streamRef.current) return;
                
//                 const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
//                 const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
//                 processorRef.current = processor;

//                 processor.onaudioprocess = (e) => {
//                     const inputData = e.inputBuffer.getChannelData(0);
//                     const pcmBlob = createPcmBlob(inputData);
//                     sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
//                 };
//                 source.connect(processor);
//                 processor.connect(inputAudioContextRef.current.destination);
//             },
//             onmessage: async (message: LiveServerMessage) => {
//                 const serverContent = message.serverContent;
//                 if (serverContent?.interrupted) {
//                     sourcesRef.current.forEach(source => {
//                         source.stop();
//                         sourcesRef.current.delete(source);
//                     });
//                     if (audioContextRef.current) nextStartTimeRef.current = audioContextRef.current.currentTime;
//                     setInteractionMode('listening');
//                     return;
//                 }
//                 const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
//                 if (base64Audio && audioContextRef.current) {
//                     setInteractionMode('speaking');
//                     const audioData = base64ToUint8Array(base64Audio);
//                     const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
//                     const ctx = audioContextRef.current;
//                     const source = ctx.createBufferSource();
//                     source.buffer = audioBuffer;
//                     source.connect(ctx.destination);
//                     const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
//                     source.start(startTime);
//                     nextStartTimeRef.current = startTime + audioBuffer.duration;
//                     sourcesRef.current.add(source);
//                     source.onended = () => {
//                         sourcesRef.current.delete(source);
//                         if (sourcesRef.current.size === 0) setInteractionMode('listening');
//                     };
//                 }
//             },
//             onclose: () => { setIsConnected(false); setInteractionMode('idle'); },
//             onerror: (e) => { console.error(e); setError("Connection error."); disconnect(); }
//         }
//       });
//       sessionRef.current = sessionPromise;
//     } catch (err: any) {
//       setError(err.message || "Failed to connect");
//       setIsConnected(false);
//     }
//   };

//   const handlePersonaSelect = (persona: Persona) => {
//     if (isConnected) disconnect();
//     setSelectedPersona(persona);
//   };

//   return (
//     // --- THEME WRAPPER (Deep Dark + Ambient Blobs) ---
//     <div className="min-h-screen w-full flex flex-col items-center bg-[#05050a] text-white font-sans selection:bg-pink-500/30 relative overflow-x-hidden">
      
//       {/* Ambient Background Animation */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
//          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
//          <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[800px] h-[600px] bg-blue-900/5 rounded-full blur-[100px]"></div>
//       </div>

//       {/* --- HEADER --- */}
//       <header className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between z-10">
//          <div className="flex items-center gap-2">
//             <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
//                <SparklesIcon className="w-5 h-5 text-white" />
//             </div>
//             <h1 className="text-2xl font-bold tracking-tighter">
//               Mimi<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">.Talks</span>
//             </h1>
//          </div>
//          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-400">
//              <span className={isConnected ? "text-green-400" : "text-gray-500"}>
//                 ● {isConnected ? 'System Online' : 'Offline'}
//              </span>
//          </div>
//       </header>

//       <main className="flex-grow flex flex-col items-center w-full max-w-5xl px-4 gap-12 z-10">
        
//         {/* Hero Text */}
//         <div className="text-center space-y-0 md:mt-8">
//             <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
//                Discover.
//             </h2>
//             <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 pb-2">
//                Connect.
//             </h2>
//         </div>

//         {/* --- MAIN INTERACTION CARD (The "LoggedIn" Style) --- */}
//         <div className="relative group w-full max-w-2xl mx-auto">
//             {/* 1. The Neon Gradient Border Glow */}
//             <div className={`absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-70 blur-sm transition duration-500 group-hover:opacity-100 group-hover:blur-md ${isConnected ? 'animate-pulse' : ''}`}></div>

//             {/* 2. The Glass Container */}
//             <div className="relative bg-[#0a0a0f] rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl p-2 md:p-3 flex flex-col">
                
//                 <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-8 py-8 min-h-[300px]">
                    
//                     {/* Left: Avatar & Info */}
//                     <div className="flex flex-col items-center md:items-start gap-4 flex-1">
//                         <div className="flex items-center gap-2 mb-2">
//                              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-ping' : 'bg-gray-600'}`}></div>
//                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
//                                  {isConnected ? 'Talking With' : 'Selected Persona'}
//                              </span>
//                         </div>
                        
//                         <div className="relative">
//                              <div className="text-8xl md:text-9xl filter drop-shadow-2xl transition-transform duration-300" style={{ transform: interactionMode === 'speaking' ? 'scale(1.1)' : 'scale(1)' }}>
//                                  {selectedPersona.emoji}
//                              </div>
//                              {/* Dynamic Ring */}
//                              {interactionMode === 'speaking' && (
//                                 <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-ping"></div>
//                              )}
//                         </div>

//                         <div className="text-center md:text-left">
//                              <h3 className="text-3xl font-bold text-white tracking-tight">{selectedPersona.name}</h3>
//                              <p className="text-sm text-gray-400 mt-1 max-w-[200px]">{selectedPersona.description}</p>
//                         </div>
//                     </div>

//                     {/* Divider (Desktop) */}
//                     <div className="hidden md:block w-px h-48 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

//                     {/* Right: Visualizer & Controls */}
//                     <div className="flex flex-col items-center justify-center gap-8 flex-1 w-full">
                        
//                         {/* Visualizer Area */}
//                         <div className="w-full h-24 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
//                             {isConnected ? (
//                                 <Visualizer isActive={interactionMode !== 'idle'} mode={interactionMode} barColor="#c084fc" />
//                             ) : (
//                                 <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Audio Stream Offline</span>
//                             )}
//                         </div>

//                         {/* Error Message */}
//                         {error && (
//                             <div className="text-red-400 text-xs bg-red-900/20 px-3 py-1 rounded border border-red-900/50">
//                                 {error}
//                             </div>
//                         )}

//                         {/* THE BUTTON (Styled like "Go to Dashboard") */}
//                         {!isConnected ? (
//                             <button 
//                                 onClick={connectToGeminiLive}
//                                 className="relative group/btn w-full overflow-hidden rounded-lg bg-white px-6 py-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-95"
//                             >
//                                 <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
//                                 <div className="relative flex items-center justify-center gap-3">
//                                     <span className="text-base font-bold text-black tracking-wide">Start Conversation</span>
//                                     <ArrowRightIcon className="w-5 h-5 text-black transition-transform duration-300 group-hover/btn:translate-x-1" />
//                                 </div>
//                             </button>
//                         ) : (
//                             <button 
//                                 onClick={disconnect}
//                                 className="relative group/btn w-full overflow-hidden rounded-lg bg-red-500/10 border border-red-500/50 px-6 py-4 transition-all duration-300 hover:bg-red-500/20 active:scale-95"
//                             >
//                                 <div className="relative flex items-center justify-center gap-3">
//                                     <span className="text-base font-bold text-red-400 tracking-wide">End Session</span>
//                                     <PowerIcon className="w-5 h-5 text-red-400" />
//                                 </div>
//                             </button>
//                         )}

//                     </div>
//                 </div>
                
//                 {/* Decorative Scanline/Noise Overlay */}
//                 <div className="absolute inset-0 rounded-3xl bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
//             </div>
//         </div>

//         {/* --- PERSONA SELECTOR --- */}
//         <div className="w-full pb-12">
//              <div className="flex items-center gap-4 mb-6 opacity-80">
//                 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
//                 <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Available Personas</span>
//                 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
//              </div>

//              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
//                 {PERSONAS.map((persona) => {
//                     const active = selectedPersona.id === persona.id;
//                     return (
//                         <button
//                             key={persona.id}
//                             onClick={() => handlePersonaSelect(persona)}
//                             className={`relative group p-4 rounded-xl text-left transition-all duration-300 border ${active ? 'bg-white/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}
//                         >
//                              <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform">{persona.emoji}</div>
//                              <div className={`text-sm font-bold mb-1 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{persona.name}</div>
//                              <div className="text-[10px] text-gray-500 leading-tight line-clamp-2">{persona.description}</div>
//                         </button>
//                     )
//                 })}
//              </div>
//         </div>

//       </main>
//     </div>
//   );
// };

// export default App;
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { PERSONAS } from './constants';
import { Persona } from './types';
import Visualizer from './components/Visualizer';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './utils/audioUtils';

// --- Icons (Lucide-style inline SVGs) ---
const MicIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

const PowerIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
    <line x1="12" y1="2" x2="12" y2="12"></line>
  </svg>
);

const WaveformIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v4" />
  </svg>
);

const App: React.FC = () => {
  // --- LOGIC (Unchanged) ---
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<'idle' | 'listening' | 'speaking'>('idle');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => { return () => disconnect(); }, []);

  const disconnect = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (processorRef.current) processorRef.current.disconnect();
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    if (sessionRef.current) sessionRef.current.then(s => s.close && s.close()).catch(() => {});
    sourcesRef.current.forEach(s => s.stop());
    setIsConnected(false);
    setInteractionMode('idle');
  };

  const connectToGeminiLive = async () => {
    setError(null);
    try {
      if (!import.meta.env.VITE_API_KEY) throw new Error("API Key is missing.");
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedPersona.voiceName } } },
          systemInstruction: selectedPersona.systemInstruction,
        },
        callbacks: {
            onopen: () => {
                setIsConnected(true);
                setInteractionMode('listening');
                const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                const processor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                processor.onaudioprocess = (e) => {
                    sessionPromise.then(s => s.sendRealtimeInput({ media: createPcmBlob(e.inputBuffer.getChannelData(0)) }));
                };
                source.connect(processor);
                processor.connect(inputAudioContextRef.current!.destination);
            },
            onmessage: async (msg) => {
                if (msg.serverContent?.interrupted) {
                    sourcesRef.current.forEach(s => s.stop());
                    nextStartTimeRef.current = audioContextRef.current!.currentTime;
                    setInteractionMode('listening');
                    return;
                }
                const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (data && audioContextRef.current) {
                    setInteractionMode('speaking');
                    const buffer = await decodeAudioData(base64ToUint8Array(data), audioContextRef.current, 24000, 1);
                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContextRef.current.destination);
                    const start = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                    source.start(start);
                    nextStartTimeRef.current = start + buffer.duration;
                    sourcesRef.current.add(source);
                    source.onended = () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) setInteractionMode('listening');
                    };
                }
            },
            onclose: () => disconnect(),
            onerror: (e) => { console.error(e); setError("Connection Error"); disconnect(); }
        }
      });
      sessionRef.current = sessionPromise;
    } catch (err: any) { setError(err.message); setIsConnected(false); }
  };

  const handlePersonaSelect = (p: Persona) => { if(isConnected) disconnect(); setSelectedPersona(p); };

  // --- THEME COLORS ---
  // Determine current accent color based on persona or status
  const activeColor = isConnected ? '#22d3ee' : '#a855f7'; // Cyan active, Purple idle

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#030014] text-white font-sans overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* --- FUTURISTIC BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none">
         {/* Grid Pattern */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
         {/* Ambient Orbs */}
         <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
         {/* Noise Overlay for texture */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* --- NAVBAR --- */}
      <header className="relative z-50 w-full border-b border-white/5 bg-[#030014]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex items-center justify-center">
                 <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg blur opacity-50"></div>
                 <div className="relative bg-black/80 rounded-lg p-1.5 border border-white/10">
                    <WaveformIcon className="w-full h-full text-white" />
                 </div>
              </div>
              <h1 className="text-xl font-bold tracking-wide">
                MIMI<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">.AI</span>
              </h1>
           </div>
           <div className="flex items-center gap-3 text-xs font-mono text-cyan-500/80 bg-cyan-950/20 px-3 py-1 rounded-full border border-cyan-900/50">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 animate-ping' : 'bg-gray-600'}`}></div>
              {isConnected ? 'LIVE CONNECTION' : 'SYSTEM STANDBY'}
           </div>
        </div>
      </header>

      <main className="flex-grow relative z-10 flex flex-col items-center justify-center px-4 py-8 gap-12 max-w-6xl mx-auto w-full">
        
        {/* --- MAIN HOLOGRAPHIC STAGE --- */}
        <div className="relative w-full flex flex-col items-center">
            
            {/* The Glow Ring (Behind) */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-[80px] transition-all duration-1000 ${isConnected ? 'opacity-100 scale-110' : 'opacity-30 scale-90'}`}></div>

            {/* The Interface Container */}
            <div className="relative w-full max-w-3xl bg-[#0a0a0f]/60 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl overflow-hidden group">
                
                {/* Animated Border Gradient */}
                <div className={`absolute inset-0 p-[1px] rounded-[3rem] bg-gradient-to-b from-white/10 to-white/0 pointer-events-none`}></div>
                
                {/* Content Layout */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                    
                    {/* Left: Avatar Orb */}
                    <div className="relative flex-shrink-0">
                        {/* Spinning Rings */}
                        {isConnected && (
                           <>
                             <div className="absolute inset-[-20px] border border-cyan-500/30 rounded-full animate-[spin_4s_linear_infinite]"></div>
                             <div className="absolute inset-[-10px] border border-purple-500/30 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>
                           </>
                        )}
                        
                        {/* The Avatar */}
                        <div className={`w-40 h-40 rounded-full bg-[#12121a] border border-white/10 flex items-center justify-center text-7xl shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-10 transition-transform duration-500 ${interactionMode === 'speaking' ? 'scale-105' : 'scale-100'}`}>
                             {selectedPersona.emoji}
                             
                             {/* Speaking Ripples */}
                             {interactionMode === 'speaking' && (
                                 <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping"></div>
                             )}
                        </div>

                        {/* Status Pill */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#030014] text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 text-gray-400 uppercase tracking-widest shadow-lg whitespace-nowrap">
                           {selectedPersona.name}
                        </div>
                    </div>

                    {/* Right: Data & Controls */}
                    <div className="flex-1 w-full flex flex-col gap-6">
                         <div>
                            <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">{selectedPersona.name}</h2>
                            <p className="text-gray-400 leading-relaxed">{selectedPersona.description}</p>
                         </div>

                         {/* Visualizer Box */}
                         <div className="h-20 w-full bg-black/40 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                             {isConnected ? (
                                 <Visualizer isActive={interactionMode !== 'idle'} mode={interactionMode} barColor={activeColor} />
                             ) : (
                                 <div className="flex gap-1 h-3 items-center">
                                     {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-full bg-gray-700 rounded-full"></div>)}
                                     <span className="text-xs text-gray-600 ml-2 font-mono">WAITING_FOR_INPUT</span>
                                 </div>
                             )}
                         </div>

                         {/* Error Area */}
                         {error && <div className="text-red-400 text-xs bg-red-950/20 p-2 rounded border border-red-900">{error}</div>}

                         {/* Main Action Button */}
                         {!isConnected ? (
                             <button 
                                onClick={connectToGeminiLive}
                                className="relative w-full group overflow-hidden bg-white text-black rounded-xl py-4 font-bold text-lg transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                             >
                                 <div className="absolute inset-0 bg-gradient-to-r from-cyan-200 via-white to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                 <div className="relative flex items-center justify-center gap-2">
                                     <MicIcon className="w-5 h-5" />
                                     <span>INITIALIZE LINK</span>
                                 </div>
                             </button>
                         ) : (
                             <button 
                                onClick={disconnect}
                                className="w-full bg-red-500/10 text-red-400 border border-red-500/50 rounded-xl py-4 font-bold text-lg hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                             >
                                 <PowerIcon className="w-5 h-5" />
                                 <span>TERMINATE</span>
                             </button>
                         )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- PERSONA GRID --- */}
        <div className="w-full max-w-5xl">
            <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                <span className="text-xs text-gray-500 font-mono tracking-[0.2em]">SELECT_MATRIX_PERSONALITY</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {PERSONAS.map((persona) => {
                    const active = selectedPersona.id === persona.id;
                    return (
                        <button
                            key={persona.id}
                            onClick={() => handlePersonaSelect(persona)}
                            className={`
                                relative group p-4 h-full rounded-2xl text-left border transition-all duration-300 backdrop-blur-sm
                                ${active 
                                    ? 'bg-white/10 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                }
                            `}
                        >
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-500"></div>

                            <div className="relative z-10">
                                <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">{persona.emoji}</div>
                                <div className={`text-sm font-bold mb-1 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{persona.name}</div>
                                <div className="text-[10px] text-gray-500 leading-tight line-clamp-2">{persona.description}</div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;