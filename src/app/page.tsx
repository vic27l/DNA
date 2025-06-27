// src/app/page.tsx (Modificado)
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Mic, Square, Loader2, Play } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { PERGUNTAS_DNA, criarPerfilInicial } from '../lib/config';
import { analisarFragmento, gerarSinteseFinal } from '../lib/analysisEngine';
import { initAudio, playAudioFromUrl, startRecording, stopRecording } from '../services/webAudioService';
import { supabase } from '@/lib/supabaseClient';
import type { ExpertProfile, SessionStatus, Pergunta, UserResponse, AnalysisSession } from '../lib/types';
import LoginButton from '@/components/LoginButton';

// Componentes visuais (FloatingParticles, DottedLines, etc.) permanecem os mesmos...
const FloatingParticles = () => { /* ...código omitido para brevidade... */ return <div className="floating-particles"></div>; };
const DottedLines = () => { /* ...código omitido para brevidade... */ return <></>; };
const AudioVisualizer = ({ isActive }: { isActive: boolean }) => { /* ...código omitido para brevidade... */ return <div className="audio-visualizer"></div>; };
const ProgressIndicator = ({ current, total }: { current: number; total: number }) => { /* ...código omitido para brevidade... */ return <div className="progress-container"></div>; };
const Logo = () => (
  <div className="logo-container">
    <Image 
      src="/logo.png"
      alt="Logo" 
      width={75}
      height={30}
      className="logo-image"
      priority
    />
  </div>
);
const Footer = () => ( <footer className="footer"><div className="footer-content"><p>DNA</p><p>Deep Narrative Analysis - UP LANÇAMENTOS 2025</p></div></footer> );

// Interface principal da aplicação
export default function DnaInterface() {
  const { data: session, status: authStatus } = useSession();
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [perguntaAtual, setPerguntaAtual] = useState<Pergunta | null>(null);
  const [perfil, setPerfil] = useState<ExpertProfile>(criarPerfilInicial());
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [finalReport, setFinalReport] = useState<string | null>(null);

  const perguntaIndex = useRef(0);
  const user = session?.user as { id: string; name?: string; email?: string };

  useEffect(() => {
    initAudio().catch(err => {
      console.error("Erro ao inicializar áudio:", err);
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    });
  }, []);

  const iniciarSessao = useCallback(async () => {
    if (!user) {
      setError("Você precisa estar logado para iniciar uma análise.");
      return;
    }

    setStatus('processing');
    setError(null);
    setFinalReport(null);
    
    try {
      // Cria uma nova sessão no banco de dados
      const { data, error: insertError } = await supabase
        .from('analysis_sessions')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (insertError) throw insertError;

      setCurrentSessionId(data.id);
      perguntaIndex.current = 0;
      setPerfil(criarPerfilInicial());
      await fazerProximaPergunta(0);

    } catch (err: any) {
      console.error("Erro ao iniciar sessão no DB:", err);
      setError("Não foi possível iniciar uma nova sessão. Tente novamente.");
      setStatus('idle');
    }

  }, [user]);
  
  const fazerProximaPergunta = useCallback(async (index: number) => {
    if (index < PERGUNTAS_DNA.length) {
      const pergunta = PERGUNTAS_DNA[index];
      setPerguntaAtual(pergunta);
      setStatus('listening');
      setIsAudioPlaying(true);
      
      try {
        await playAudioFromUrl(pergunta.audioUrl, () => {
          setStatus('waiting_for_user');
          setIsAudioPlaying(false);
        });
        perguntaIndex.current = index + 1;
      } catch (err) {
        console.error("Erro ao reproduzir áudio:", err);
        setError("Erro ao reproduzir a pergunta. Tentando novamente...");
        setTimeout(() => fazerProximaPergunta(index), 2000);
      }
    } else {
      // Finaliza a sessão
      setStatus('processing');
      const sintese = gerarSinteseFinal(perfil);
      setFinalReport(sintese);
      
      // Salva a síntese final no banco de dados
      if (currentSessionId) {
        await supabase
          .from('analysis_sessions')
          .update({ final_synthesis: sintese })
          .eq('id', currentSessionId);
      }
      
      setStatus('finished');
    }
  }, [perfil, currentSessionId]);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setStatus('recording');
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      setError("Não foi possível iniciar a gravação.");
    }
  }, []);
  
  const handleStopRecording = useCallback(async () => {
    setStatus('processing');
    try {
      const audioBlob = await stopRecording();
      if (!currentSessionId || !perguntaAtual) {
        throw new Error("Sessão ou pergunta atual não encontrada.");
      }
      const transcricao = await transcreverAudio(audioBlob, currentSessionId, perguntaAtual.texto);
      
      const perfilAtualizado = analisarFragmento(transcricao, perfil, perguntaAtual);
      setPerfil(perfilAtualizado);
      
      await fazerProximaPergunta(perguntaIndex.current);

    } catch (err) {
      console.error("Erro ao processar gravação:", err);
      setError("Problema ao processar sua resposta. Continuando...");
      setTimeout(() => fazerProximaPergunta(perguntaIndex.current), 2000);
    }
  }, [perguntaAtual, perfil, currentSessionId, fazerProximaPergunta]);

  const transcreverAudio = async (audioBlob: Blob, sessionId: string, questionText: string): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('sessionId', sessionId);
    formData.append('questionText', questionText);

    const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Falha na transcrição");
    }
    
    const data = await response.json();
    return data.transcript;
  };

  const getStatusConfig = () => { /* ...código omitido para brevidade... */ return { text: '', dotClass: '' }; };
  const statusConfig = getStatusConfig();
  const formatQuestionText = (text: string) => text.replace(/\b(você|sua|seu|quem|qual|como|onde|quando|por que)\b/gi, `<span class="question-highlight">$1</span>`);

  // Tela de Login
  if (authStatus !== 'authenticated') {
    return (
        <div className="main-container flex flex-col items-center justify-center">
            <FloatingParticles />
            <DottedLines />
            <Logo />
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Bem-vindo ao <br /> <span className="text-orange-500">Deep Narrative Analysis</span>
                </h1>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl">
                    Desvende as camadas da sua psique através de uma jornada interativa de autoanálise. Faça login para iniciar sua análise.
                </p>
                <LoginButton />
            </div>
            <Footer />
        </div>
    );
  }

  // Tela Inicial (Logado)
  if (status === 'idle') {
    return (
      <div className="main-container">
        <FloatingParticles />
        <DottedLines />
        <div className="absolute top-4 right-4 z-20"><LoginButton /></div>
        <Logo />
        <div className="content-area">
            {/* Conteúdo da tela inicial */}
            <button onClick={iniciarSessao}>Iniciar Análise DNA</button>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Tela de Análise Finalizada
  if (status === 'finished' && finalReport) {
      return (
        <div className="main-container">
            <FloatingParticles />
            <div className="absolute top-4 right-4 z-20"><LoginButton /></div>
            <Logo />
            <div className="content-area">
                <div className="text-center max-w-4xl w-full">
                    <h1 className="question-text">Análise <span className="question-highlight">Concluída</span></h1>
                    <div className="bg-gray-800/50 p-6 rounded-lg max-h-[50vh] overflow-y-auto text-left">
                        <pre className="whitespace-pre-wrap font-mono text-sm">{finalReport}</pre>
                    </div>
                    <button onClick={iniciarSessao} className="mt-8 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg">
                        Fazer Nova Análise
                    </button>
                </div>
            </div>
            <Footer />
        </div>
      );
  }

  // Tela Principal da Análise
  return (
    <div className="main-container">
      <FloatingParticles />
      <DottedLines />
      <div className="absolute top-4 right-4 z-20"><LoginButton /></div>
      <Logo />
      <ProgressIndicator current={perguntaIndex.current} total={PERGUNTAS_DNA.length} />
      <div className="content-area">
        <div className="content-flex">
          {/* ... interface de pergunta e botão de microfone ... */}
          <div style={{ flex: 1 }}>
            <div className="status-indicator">
              <div className={`status-dot ${statusConfig.dotClass}`} />
              <span className="status-text">{statusConfig.text}</span>
            </div>
            <h1 
              className="question-text"
              dangerouslySetInnerHTML={{ __html: perguntaAtual ? formatQuestionText(perguntaAtual.texto) : '' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
             <button
              className={`mic-button ${status === 'recording' ? 'recording' : ''} ${status === 'listening' || status === 'processing' ? 'disabled' : ''}`}
              onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
              disabled={status === 'listening' || status === 'processing'}
            >
              {/* Ícones do botão */}
            </button>
            <AudioVisualizer isActive={isAudioPlaying || status === 'recording'} />
          </div>
        </div>
      </div>
      <Footer />
      {error && <div className="error-toast">{error}</div>}
    </div>
  );
}
