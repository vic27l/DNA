// src/app/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Loader, BrainCircuit, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

import { PERGUNTAS_DNA, criarPerfilInicial } from '../lib/config';
import { analisarFragmento, gerarSinteseFinal } from '../lib/analysisEngine';
import { initAudio, playAudioFromUrl, startRecording, stopRecording } from '../services/webAudioService';
import type { ExpertProfile, SessionStatus, Pergunta } from '../lib/types';
import LoginButton from '@/components/LoginButton';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DnaInterface() {
  const { data: session, status: authStatus } = useSession();

  const [status, setStatus] = useState<SessionStatus>('idle');
  const [perguntaAtual, setPerguntaAtual] = useState<Pergunta | null>(null);
  const [perfil, setPerfil] = useState<ExpertProfile>(criarPerfilInicial());
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const perguntaIndex = useRef(0);

  useEffect(() => {
    initAudio().catch(err => {
      console.error("Erro ao inicializar áudio:", err);
      setError("Não foi possível acessar o microfone.");
    });
  }, []);

  const iniciarSessao = useCallback(async () => {
    if (!session?.user?.id) return;
    perguntaIndex.current = 0;
    setPerfil(criarPerfilInicial());
    setError(null);
    setStatus('processing');
    try {
      const { data, error: dbError } = await supabase
        .from('analysis_sessions')
        .insert({ user_id: session.user.id })
        .select('id')
        .single();
      if (dbError) throw dbError;
      setCurrentSessionId(data.id);
      fazerProximaPergunta();
    } catch (e) {
      setError("Erro ao criar a sessão no banco de dados.");
      setStatus('idle');
    }
  }, [session]);

  const fazerProximaPergunta = useCallback(async () => {
    if (perguntaIndex.current < PERGUNTAS_DNA.length) {
      const pergunta = PERGUNTAS_DNA[perguntaIndex.current];
      setPerguntaAtual(pergunta);
      setStatus('listening');
      try {
        await playAudioFromUrl(pergunta.audioUrl, () => setStatus('waiting_for_user'));
        perguntaIndex.current++;
      } catch (err) {
        setError("Erro ao reproduzir a pergunta.");
        setTimeout(fazerProximaPergunta, 2000);
      }
    } else {
      setStatus('processing');
      const sinteseFinal = gerarSinteseFinal(perfil);
      await supabase
        .from('analysis_sessions')
        .update({ final_synthesis: sinteseFinal })
        .eq('id', currentSessionId!);
      setStatus('finished');
    }
  }, [perfil, currentSessionId]);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setStatus('recording');
    } catch (err) {
      setError("Não foi possível iniciar a gravação.");
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    setStatus('processing');
    try {
      const audioBlob = await stopRecording();
      const transcricao = await transcreverEProcessarAudio(audioBlob);
      if (perguntaAtual) {
        const perfilAtualizado = analisarFragmento(transcricao, perfil, perguntaAtual);
        setPerfil(perfilAtualizado);
      }
      fazerProximaPergunta();
    } catch (err) {
      setError("Problema ao processar sua resposta.");
      setTimeout(fazerProximaPergunta, 2000);
    }
  }, [perguntaAtual, perfil, fazerProximaPergunta]);

  const transcreverEProcessarAudio = async (audioBlob: Blob): Promise<string> => {
    if (!currentSessionId || !perguntaAtual) throw new Error("Sessão ou pergunta inválida.");
    const formData = new FormData();
    formData.append('audio', audioBlob, 'resposta.webm');
    formData.append('sessionId', currentSessionId);
    formData.append('questionText', perguntaAtual.texto);
    const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha na transcrição.");
    return data.transcript;
  };

  // --- Renderização da UI ---

  // 1. Tela de Carregamento
  if (authStatus === 'loading') {
    return (
      <div className="main-container flex flex-col items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-green-400" />
      </div>
    );
  }

  // 2. NOVA Tela de Login
  if (authStatus !== 'authenticated') {
    return (
      <div className="main-container flex flex-col items-center justify-center text-center p-4">
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
        <div className="relative z-10 flex flex-col items-center">
          <BrainCircuit className="h-20 w-20 text-green-400 mb-6 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white font-mono tracking-wide">
            Deep Narrative Analysis
          </h1>
          <p className="text-lg text-gray-300 mb-10 max-w-xl">
            Desvende os padrões da sua psique. Uma jornada de autoconhecimento através da sua própria voz.
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }
  
  // 3. Interface Principal da Aplicação
  return (
    <div className="main-container flex flex-col items-center justify-center p-4">
      <div className="absolute top-5 right-5 flex items-center gap-4">
        <span className="text-white text-sm hidden sm:inline">{session.user?.name}</span>
        {session.user?.image && (
          <Image src={session.user.image} alt="Avatar" width={40} height={40} className="rounded-full border-2 border-gray-600"/>
        )}
        <button onClick={() => signOut()} className="p-2 rounded-full bg-gray-800 hover:bg-red-700/50 transition-colors">
          <LogOut className="h-5 w-5 text-white"/>
        </button>
      </div>

      {status === 'idle' && (
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-white">Sessão Pronta</h1>
          <p className="text-lg text-gray-300 mb-8">Quando estiver preparado(a), inicie a análise.</p>
          <button
            onClick={iniciarSessao}
            className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-green-500/50"
          >
            Iniciar Análise DNA
          </button>
        </div>
      )}

      {status === 'finished' && (
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
             <h1 className="text-3xl font-bold mb-4 text-white">Análise Concluída</h1>
             <div className="bg-gray-900/50 border border-gray-700 p-6 rounded-lg text-left overflow-auto max-h-[50vh] shadow-inner">
                 <pre className="whitespace-pre-wrap font-mono text-sm text-gray-200">
                    {gerarSinteseFinal(perfil)}
                 </pre>
             </div>
             <button
                onClick={iniciarSessao}
                className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-blue-500/50"
                >
                Fazer Nova Análise
             </button>
        </div>
      )}
      
      {['listening', 'waiting_for_user', 'recording', 'processing'].includes(status) && (
        <div className="text-center animate-fade-in">
             <p className="text-lg mb-2 text-gray-400">Pergunta {perguntaIndex.current} de {PERGUNTAS_DNA.length}</p>
             <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-white min-h-[8rem] flex items-center justify-center px-4">
                {perguntaAtual?.texto}
             </h2>
             <div className="mb-8 h-8 flex items-center justify-center">
                 {status === 'listening' && <p className="text-blue-400 animate-pulse">Ouvindo...</p>}
                 {status === 'processing' && <Loader className="h-8 w-8 text-green-400 animate-spin" />}
                 {status === 'recording' && <div className="flex items-center text-red-500 animate-pulse"><div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>Gravando...</div>}
             </div>
             <button
                 onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
                 disabled={status !== 'waiting_for_user' && status !== 'recording'}
                 className="w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-300 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed
                     ${status === 'recording' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/50' : 'bg-green-600 hover:bg-green-700 shadow-green-500/50'}
                     ${status === 'waiting_for_user' ? 'animate-pulse-slow' : ''}"
             >
                 {status === 'recording' ? <Square size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
             </button>
             {status === 'waiting_for_user' && <p className="mt-4 text-gray-400">Clique no microfone para gravar</p>}
        </div>
      )}
      
      {error && <p className="absolute bottom-10 text-red-400 bg-red-900/50 px-4 py-2 rounded-md">{error}</p>}
    </div>
  );
}
