// src/app/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Mic, Square, Loader } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

import { PERGUNTAS_DNA, criarPerfilInicial } from '../lib/config';
import { analisarFragmento, gerarSinteseFinal } from '../lib/analysisEngine';
import { initAudio, playAudioFromUrl, startRecording, stopRecording } from '../services/webAudioService';
import type { ExpertProfile, SessionStatus, Pergunta } from '../lib/types';

import LoginButton from '@/components/LoginButton'; // Importa o botão de login

// Componentes auxiliares (FloatingParticles, DottedLines, etc. - mantidos como no original)
// ... (O código dos componentes auxiliares pode ser copiado do seu arquivo original)

// --- Adicione os componentes auxiliares que você já tem aqui ---

// Cliente Supabase para o Frontend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Componente principal da interface
export default function DnaInterface() {
  const { data: session, status: authStatus } = useSession();
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [perguntaAtual, setPerguntaAtual] = useState<Pergunta | null>(null);
  const [perfil, setPerfil] = useState<ExpertProfile>(criarPerfilInicial());
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const perguntaIndex = useRef(0);

  useEffect(() => {
    initAudio().catch(err => {
      console.error("Erro ao inicializar áudio:", err);
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    });
  }, []);

  const iniciarSessao = useCallback(async () => {
    if (!session?.user?.id) {
      setError("Você precisa estar logado para iniciar uma sessão.");
      return;
    }

    perguntaIndex.current = 0;
    setPerfil(criarPerfilInicial());
    setError(null);

    // Criar nova sessão no Supabase
    const { data, error: dbError } = await supabase
      .from('analysis_sessions')
      .insert({ user_id: session.user.id })
      .select('id')
      .single();

    if (dbError || !data) {
      setError(`Erro ao criar a sessão: ${dbError?.message}`);
      return;
    }

    setCurrentSessionId(data.id);
    fazerProximaPergunta();
  }, [session]);

  const fazerProximaPergunta = useCallback(async () => {
    if (perguntaIndex.current < PERGUNTAS_DNA.length) {
      const pergunta = PERGUNTAS_DNA[perguntaIndex.current];
      setPerguntaAtual(pergunta);
      setStatus('listening');
      setIsAudioPlaying(true);
      
      try {
        await playAudioFromUrl(pergunta.audioUrl, () => {
          setStatus('waiting_for_user');
          setIsAudioPlaying(false);
        });
        perguntaIndex.current++;
      } catch (err) {
        console.error("Erro ao reproduzir áudio:", err);
        setError("Erro ao reproduzir a pergunta. Tentando novamente...");
        setTimeout(fazerProximaPergunta, 2000);
      }
    } else {
      // Finalizar a sessão e salvar a síntese
      setStatus('finished');
      const sinteseFinal = gerarSinteseFinal(perfil);
      await supabase
        .from('analysis_sessions')
        .update({ final_synthesis: sinteseFinal })
        .eq('id', currentSessionId!);
    }
  }, [perfil, currentSessionId]);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setStatus('recording');
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      setError("Não foi possível iniciar a gravação. Verifique as permissões do microfone.");
    }
  }, []);
  
  const handleStopRecording = useCallback(async () => {
    setStatus('processing');
    try {
      const audioBlob = await stopRecording();
      const transcricao = await transcreverAudio(audioBlob);
      if (perguntaAtual) {
        const perfilAtualizado = analisarFragmento(transcricao, perfil, perguntaAtual);
        setPerfil(perfilAtualizado);
      }
      fazerProximaPergunta();
    } catch (err) {
      console.error("Erro ao processar gravação:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Problema ao processar sua resposta: ${errorMessage}. Continuando...`);
      setTimeout(fazerProximaPergunta, 2000);
    }
  }, [perguntaAtual, perfil, fazerProximaPergunta]);

  const transcreverAudio = async (audioBlob: Blob): Promise<string> => {
    if (!currentSessionId || !perguntaAtual) {
        throw new Error("ID da sessão ou pergunta atual não definidos.");
    }

    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('sessionId', currentSessionId);
    formData.append('questionText', perguntaAtual.texto);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha na transcrição");
    }
    const data = await response.json();
    return data.transcript;
  };

  // Se não estiver autenticado, mostra a tela de login
  if (authStatus !== 'authenticated') {
    return (
      <div className="main-container flex flex-col items-center justify-center">
        {/* <FloatingParticles />
        <DottedLines /> */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">DNA - Deep Narrative Analysis</h1>
          <p className="text-lg mb-8">Faça login para iniciar sua jornada de autoanálise.</p>
          <LoginButton />
        </div>
        {/* <Footer /> */}
      </div>
    );
  }

  // O restante da lógica da UI (idle, finished, em progresso)
  // pode ser mantida, mas a tela 'idle' agora precisa do botão "Iniciar Análise DNA"
  // que chama a nova função `iniciarSessao`.

  // Exemplo da tela 'idle' modificada:
  if (status === 'idle') {
    return (
      <div className="main-container flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo(a), {session?.user?.name}!</h1>
        <p className="text-lg mb-8">Pronto para começar sua análise?</p>
        <button
          onClick={iniciarSessao}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-semibold"
        >
          Iniciar Análise DNA
        </button>
      </div>
    );
  }
  
  // A tela 'finished' e a tela de progresso podem ser mantidas como estão no seu código original,
  // pois a lógica principal delas não muda, apenas a forma como são iniciadas e finalizadas.
  // ...

  // Retorno para o status de progresso (simplificado)
  return (
    <div className="main-container flex flex-col items-center justify-center p-4">
        {status === 'finished' ? (
            <div className="text-center max-w-4xl mx-auto">
                 <h1 className="text-3xl font-bold mb-4">Análise Concluída</h1>
                 <div className="bg-gray-800 p-6 rounded-lg text-left overflow-auto max-h-[60vh]">
                     <pre className="whitespace-pre-wrap font-mono text-sm">
                        {gerarSinteseFinal(perfil)}
                     </pre>
                 </div>
                 <button
                    onClick={iniciarSessao}
                    className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold"
                    >
                    Fazer Nova Análise
                 </button>
            </div>
        ) : (
            <div className="text-center">
                 <p className="text-lg mb-2">Pergunta {perguntaIndex.current} de {PERGUNTAS_DNA.length}</p>
                 <h2 className="text-2xl font-bold mb-8">{perguntaAtual?.texto}</h2>

                 <div className="mb-8">
                     {status === 'listening' && <p>Ouvindo a pergunta...</p>}
                     {status === 'recording' && <p className="text-red-500">Gravando...</p>}
                     {status ===/processing' && <Loader className="mx-auto animate-spin" />}
                 </div>

                 <button
                     onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
                     disabled={status === 'listening' || status === 'processing'}
                     className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-colors ${
                         status === 'recording' ? 'bg-red-500' : 'bg-green-500'
                     } disabled:bg-gray-500`}
                 >
                     {status === 'recording' ? <Square size={48} /> : <Mic size={48} />}
                 </button>
                 {error && <p className="text-red-400 mt-4">{error}</p>}
            </div>
        )}
    </div>
  );
}
