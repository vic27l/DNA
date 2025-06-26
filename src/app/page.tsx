'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Mic, Square, Loader, BrainCircuit } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

// Importações de lógicas e configurações locais
import { PERGUNTAS_DNA, criarPerfilInicial } from '../lib/config';
import { analisarFragmento, gerarSinteseFinal } from '../lib/analysisEngine';
import { initAudio, playAudioFromUrl, startRecording, stopRecording } from '../services/webAudioService';
import type { ExpertProfile, SessionStatus, Pergunta } from '../lib/types';
import LoginButton from '@/components/LoginButton';

// --- Componente Auxiliar de UI para o Rodapé ---
const Footer = () => (
  <footer className="absolute bottom-4 text-center w-full text-xs text-gray-500">
    <p>Plataforma de Análise Narrativa Profunda. Todos os direitos reservados © {new Date().getFullYear()}</p>
  </footer>
);

// --- Cliente Supabase para o Frontend ---
// Usamos as chaves públicas (ANON_KEY) que são seguras para serem expostas no navegador.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Componente Principal da Interface ---
export default function DnaInterface() {
  const { data: session, status: authStatus } = useSession(); // Hook do NextAuth para obter a sessão

  // Estados da Aplicação
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [perguntaAtual, setPerguntaAtual] = useState<Pergunta | null>(null);
  const [perfil, setPerfil] = useState<ExpertProfile>(criarPerfilInicial());
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const perguntaIndex = useRef(0);

  // Inicializa o serviço de áudio uma vez quando o componente é montado
  useEffect(() => {
    initAudio().catch(err => {
      console.error("Erro ao inicializar áudio:", err);
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    });
  }, []);

  // --- Funções Principais do Fluxo de Análise ---

  /**
   * Inicia uma nova sessão de análise.
   * Cria um registro no banco de dados e prepara o estado para a primeira pergunta.
   */
  const iniciarSessao = useCallback(async () => {
    // Graças ao 'next-auth.d.ts' e 'tsconfig.json', o TypeScript agora entende 'session.user.id'
    if (!session?.user?.id) {
      setError("Você precisa estar logado para iniciar uma sessão.");
      return;
    }

    perguntaIndex.current = 0;
    setPerfil(criarPerfilInicial());
    setError(null);
    setStatus('processing');

    try {
      const { data, error: dbError } = await supabase
        .from('analysis_sessions')
        .insert({ user_id: session.user.id }) // Associa a sessão ao usuário logado
        .select('id')
        .single();

      if (dbError || !data) {
        throw dbError || new Error("Não foi possível obter o ID da nova sessão.");
      }

      setCurrentSessionId(data.id);
      fazerProximaPergunta();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Erro desconhecido";
      setError(`Erro ao criar a sessão no banco de dados: ${errorMessage}`);
      setStatus('idle');
    }
  }, [session]); // Depende do objeto session

  /**
   * Apresenta a próxima pergunta ou finaliza a sessão.
   */
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
      setStatus('processing');
      const sinteseFinal = gerarSinteseFinal(perfil);
      
      await supabase
        .from('analysis_sessions')
        .update({ final_synthesis: sinteseFinal })
        .eq('id', currentSessionId!);
        
      setStatus('finished');
    }
  }, [perfil, currentSessionId]);

  /**
   * Inicia a gravação da resposta do usuário.
   */
  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setStatus('recording');
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      setError("Não foi possível iniciar a gravação. Verifique as permissões do microfone.");
    }
  }, []);
  
  /**
   * Para a gravação, envia o áudio para o backend e avança para a próxima pergunta.
   */
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
      console.error("Erro ao processar gravação:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Problema ao processar sua resposta: ${errorMessage}. Continuando...`);
      setTimeout(fazerProximaPergunta, 2000);
    }
  }, [perguntaAtual, perfil, fazerProximaPergunta]);

  /**
   * Envia o áudio para o backend para ser transcrito e salvo.
   */
  const transcreverEProcessarAudio = async (audioBlob: Blob): Promise<string> => {
    if (!currentSessionId || !perguntaAtual) {
        throw new Error("ID da sessão ou pergunta atual não definidos.");
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'resposta.webm');
    formData.append('sessionId', currentSessionId);
    formData.append('questionText', perguntaAtual.texto);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Falha na transcrição no servidor");
    }
    return data.transcript;
  };

  // --- Renderização Condicional da UI ---

  // 1. Tela de Carregamento da Autenticação
  if (authStatus === 'loading') {
    return (
      <div className="main-container flex flex-col items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-green-400" />
      </div>
    );
  }

  // 2. Tela de Login para usuários não autenticados
  if (authStatus !== 'authenticated') {
    return (
      <div className="main-container flex flex-col items-center justify-center text-center p-4">
        <BrainCircuit className="h-16 w-16 text-green-400 mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">DNA - Deep Narrative Analysis</h1>
        <p className="text-lg text-gray-300 mb-8 max-w-xl">
          Faça login com sua conta Google para iniciar uma jornada de autoanálise e descobrir os padrões profundos da sua narrativa pessoal.
        </p>
        <LoginButton />
        <Footer />
      </div>
    );
  }

  // 3. Interface Principal para usuários autenticados
  return (
    <div className="main-container flex flex-col items-center justify-center p-4">
      
      {status === 'idle' && (
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-white">Bem-vindo(a), {session.user?.name}!</h1>
          <p className="text-lg text-gray-300 mb-8">Pronto para começar sua análise narrativa?</p>
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
             <p className="text-gray-300 mb-6">Abaixo está a síntese da sua narrativa. Você pode iniciar uma nova análise a qualquer momento.</p>
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
             <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-white min-h-[8rem] flex items-center justify-center">
                {perguntaAtual?.texto}
             </h2>

             <div className="mb-8 h-8 flex items-center justify-center">
                 {status === 'listening' && <p className="text-blue-400 animate-pulse">Ouvindo a pergunta...</p>}
                 {status === 'processing' && <Loader className="h-8 w-8 text-green-400 animate-spin" />}
                 {status === 'recording' && (
                   <div className="flex items-center text-red-500 animate-pulse">
                     <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                     Gravando sua resposta...
                   </div>
                 )}
             </div>

             <button
                 onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
                 disabled={status !== 'waiting_for_user' && status !== 'recording'}
                 className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-300 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed
                     ${status === 'recording' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/50' : 'bg-green-600 hover:bg-green-700 shadow-green-500/50'}
                     ${status === 'waiting_for_user' ? 'animate-pulse-slow' : ''}
                 `}
             >
                 {status === 'recording' ? <Square size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
             </button>
             {status === 'waiting_for_user' && <p className="mt-4 text-gray-400">Clique no microfone para começar a gravar</p>}
        </div>
      )}
      
      {error && <p className="absolute bottom-10 text-red-400 bg-red-900/50 px-4 py-2 rounded-md">{error}</p>}
      
      <Footer />
    </div>
  );
}
