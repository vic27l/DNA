"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Mic, Square, Loader, ArrowRight, FileText, Check, AlertTriangle, Brain, 
  Volume2, BarChart3, Users, Target, Zap, Play, Download, Award,
  TrendingUp, Eye, Lightbulb, Menu, X
} from 'lucide-react';

// Types
interface Pergunta {
  id: number;
  texto: string;
  dominio: string;
  audioUrl: string;
}

interface ExpertProfile {
  bigFive: Record<string, number>;
  valoresSchwartz: Record<string, number>;
  coberturaDominios: Record<string, number>;
  metricas: {
    metaforas: number;
    contradicoes: number;
    profundidade: number;
  };
  fragmentos: string[];
}

type SessionStatus = 'idle' | 'listening' | 'waiting_for_user' | 'recording' | 'processing' | 'finished';

// Interface para o mapeamento de status
interface StatusConfig {
  message: string;
  icon: React.ComponentType<any>;
  showWaves?: boolean;
  isProcessing?: boolean;
}

// Configurações e dados
const PERGUNTAS_DNA: Pergunta[] = [
  { id: 1, texto: "Descreva um momento da sua vida em que você se sentiu mais autêntico e verdadeiro consigo mesmo.", dominio: "Autenticidade", audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
  { id: 2, texto: "Conte sobre uma decisão difícil que você tomou e como ela reflete seus valores fundamentais.", dominio: "Valores", audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
  { id: 3, texto: "Qual é sua maior motivação na vida e como ela se manifesta em suas ações diárias?", dominio: "Motivação", audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
  { id: 4, texto: "Descreva um relacionamento que mudou fundamentalmente sua perspectiva sobre si mesmo.", dominio: "Relacionamentos", audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" },
  { id: 5, texto: "Como você lida com conflitos internos entre o que quer fazer e o que sente que deve fazer?", dominio: "Conflitos Internos", audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" }
];

const criarPerfilInicial = (): ExpertProfile => ({
  bigFive: { abertura: 0, conscienciosidade: 0, extroversao: 0, amabilidade: 0, neuroticismo: 0 },
  valoresSchwartz: { universalismo: 0, benevolencia: 0, tradicao: 0, conformidade: 0, seguranca: 0, poder: 0, realizacao: 0, hedonismo: 0, estimulacao: 0, autodeterminacao: 0 },
  coberturaDominios: { Autenticidade: 0, Valores: 0, Motivação: 0, Relacionamentos: 0, "Conflitos Internos": 0 },
  metricas: { metaforas: 0, contradicoes: 0, profundidade: 0 },
  fragmentos: []
});

// Serviços de áudio
const audioService = {
  mediaRecorder: null as MediaRecorder | null,
  audioChunks: [] as Blob[],
  stream: null as MediaStream | null,

  async initAudio() {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
        throw new Error('Não foi possível acessar o microfone. API não disponível.');
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      throw new Error('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  },

  async playAudioFromUrl(url: string, onEnd: () => void) {
    return new Promise<void>((resolve, reject) => {
      if (typeof Audio === "undefined") {
        setTimeout(() => { onEnd(); resolve(); }, 2000);
        return;
      }
      const audio = new Audio(url);
      audio.onended = () => { onEnd(); resolve(); };
      audio.onerror = (e) => {
        console.error('Erro ao reproduzir áudio URL:', e);
        onEnd();
        reject(new Error('Erro ao reproduzir áudio'));
      };
      audio.play().catch(error => {
        console.error('Erro ao tentar tocar áudio:', error);
        onEnd();
        resolve();
      });
    });
  },

  async startRecording() {
    if (!this.stream) throw new Error('Stream de áudio não inicializado');
    if (typeof MediaRecorder === "undefined") throw new Error('MediaRecorder API não está disponível.');

    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) this.audioChunks.push(event.data); };
    this.mediaRecorder.start();
  },

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject(new Error('MediaRecorder não inicializado'));
      if (this.mediaRecorder.state === "inactive") {
        if (this.audioChunks.length > 0) return resolve(new Blob(this.audioChunks, { type: 'audio/wav' }));
        return reject(new Error('MediaRecorder estava inativo e sem chunks de áudio.'));
      }
      this.mediaRecorder.onstop = () => resolve(new Blob(this.audioChunks, { type: 'audio/wav' }));
      this.mediaRecorder.onerror = (event) => reject(new Error(`Erro no MediaRecorder: ${(event as any).error?.name}`));
      this.mediaRecorder.stop();
    });
  }
};

// Engine de análise
const analysisEngine = {
  analisarFragmento(transcricao: string, perfil: ExpertProfile, pergunta: Pergunta): ExpertProfile {
    const novoPerfil = JSON.parse(JSON.stringify(perfil));
    novoPerfil.fragmentos.push(`[${pergunta.dominio}] ${transcricao}`);
    const palavras = transcricao.toLowerCase().split(' ');
    
    if (palavras.some(p => ['criativo', 'inovador', 'original'].includes(p))) novoPerfil.bigFive.abertura = Math.min(100, (novoPerfil.bigFive.abertura || 0) + 10);
    if (palavras.some(p => ['responsável', 'organizado', 'disciplinado'].includes(p))) novoPerfil.bigFive.conscienciosidade = Math.min(100, (novoPerfil.bigFive.conscienciosidade || 0) + 10);
    if (palavras.some(p => ['social', 'grupos', 'pessoas'].includes(p))) novoPerfil.bigFive.extroversao = Math.min(100, (novoPerfil.bigFive.extroversao || 0) + 10);
    if (palavras.some(p => ['ajudar', 'cuidar', 'gentil'].includes(p))) novoPerfil.bigFive.amabilidade = Math.min(100, (novoPerfil.bigFive.amabilidade || 0) + 10);
    if (palavras.some(p => ['ansioso', 'preocupado', 'estressado'].includes(p))) novoPerfil.bigFive.neuroticismo = Math.min(100, (novoPerfil.bigFive.neuroticismo || 0) + 10);

    if (palavras.some(p => ['justiça', 'igualdade', 'mundo'].includes(p))) novoPerfil.valoresSchwartz.universalismo = Math.min(100, (novoPerfil.valoresSchwartz.universalismo || 0) + 8);
    if (palavras.some(p => ['família', 'amigos', 'ajudar'].includes(p))) novoPerfil.valoresSchwartz.benevolencia = Math.min(100, (novoPerfil.valoresSchwartz.benevolencia || 0) + 8);
    if (palavras.some(p => ['sucesso', 'conquista', 'objetivo'].includes(p))) novoPerfil.valoresSchwartz.realizacao = Math.min(100, (novoPerfil.valoresSchwartz.realizacao || 0) + 8);
    if (palavras.some(p => ['liberdade', 'independência', 'autonomia'].includes(p))) novoPerfil.valoresSchwartz.autodeterminacao = Math.min(100, (novoPerfil.valoresSchwartz.autodeterminacao || 0) + 8);

    novoPerfil.coberturaDominios[pergunta.dominio] = (novoPerfil.coberturaDominios[pergunta.dominio] || 0) + 1;
    if (transcricao.includes('como') && (transcricao.includes('igual') || transcricao.includes('parece'))) novoPerfil.metricas.metaforas += 1;
    if (palavras.some(p => ['mas', 'porém', 'entretanto'].includes(p))) novoPerfil.metricas.contradicoes += 1;
    novoPerfil.metricas.profundidade += Math.floor(transcricao.length / 100);
    
    return novoPerfil;
  },

  gerarSinteseFinal(perfil: ExpertProfile): string {
    const traitDominante = Object.entries(perfil.bigFive).sort(([,a], [,b]) => b - a)[0] || ['N/A', 0];
    const valorDominante = Object.entries(perfil.valoresSchwartz).sort(([,a], [,b]) => b - a)[0] || ['N/A', 0];

    return `
=== RELATÓRIO DNA - DEEP NARRATIVE ANALYSIS ===
Data: ${new Date().toLocaleDateString('pt-BR')}

RESUMO EXECUTIVO:
Análise completa baseada em ${perfil.fragmentos.length} narrativas pessoais.

PERFIL DE PERSONALIDADE (Big Five):
- Traço Dominante: ${traitDominante[0]} (Score: ${traitDominante[1]})
- Abertura: ${perfil.bigFive.abertura}/100 | Conscienciosidade: ${perfil.bigFive.conscienciosidade}/100
- Extroversão: ${perfil.bigFive.extroversao}/100 | Amabilidade: ${perfil.bigFive.amabilidade}/100
- Neuroticismo: ${perfil.bigFive.neuroticismo}/100

SISTEMA DE VALORES (Schwartz):
- Valor Principal: ${valorDominante[0]} (Score: ${valorDominante[1]})

MÉTRICAS NARRATIVAS:
- Metáforas Detectadas: ${perfil.metricas.metaforas} | Padrões Complexos: ${perfil.metricas.contradicoes} | Profundidade Narrativa: ${perfil.metricas.profundidade}

INSIGHTS PRINCIPAIS:
Sua narrativa revela um perfil com predominância em ${traitDominante[0]}. O valor predominante de ${valorDominante[0]} sugere motivações profundas que orientam suas decisões.

RECOMENDAÇÕES:
1. Desenvolver ainda mais as características de ${traitDominante[0]}.
2. Explorar oportunidades alinhadas com ${valorDominante[0]}.
3. Considerar coaching para maximizar potencial identificado.

=== FIM DO RELATÓRIO ===`.trim();
  }
};

// Componentes
const FloatingElements = React.memo(() => (
  <div className="floating-elements">
    {[...Array(20)].map((_, i) => (
      <div 
        key={i} 
        className="floating-dot"
        style={{ 
          left: `${Math.random() * 100}%`, 
          animationDelay: `${Math.random() * 20}s`,
          animationDuration: `${15 + Math.random() * 10}s`
        }}
      />
    ))}
  </div>
));
FloatingElements.displayName = "FloatingElements";

const Navigation = React.memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="nav-container">
      <div className="nav-content">
        <div className="nav-logo">
          <div className="logo-container">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={40}
              className="logo-image"
              priority
            />
          </div>
        </div>
        
        <div className="nav-menu">
          <span className="nav-item">About Us</span>
          <span className="nav-item">Services</span>
          <span className="nav-item">Solutions</span>
          <span className="nav-item">Clients</span>
        </div>
        
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </nav>
  );
});
Navigation.displayName = "Navigation";

const AudioWaves = React.memo(({ isActive }: { isActive: boolean }) => {
  const [waveHeight, setWaveHeight] = useState(Array(5).fill(4));
  
  useEffect(() => {
    let animationFrameId: number;
    if (isActive) {
      const updateWaves = () => { 
        setWaveHeight(prev => prev.map((_, i) => Math.sin(Date.now() * 0.01 + i) * 10 + 15)); 
        animationFrameId = requestAnimationFrame(updateWaves); 
      };
      updateWaves();
    } else { 
      setWaveHeight(Array(5).fill(4)); 
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive]);
  
  return (
    <div className="audio-waves">
      {waveHeight.map((height, i) => 
        <div 
          key={i} 
          className="audio-wave" 
          style={{ height: `${Math.max(4, height)}px` }}
        />
      )}
    </div>
  );
});
AudioWaves.displayName = "AudioWaves";

const ProgressIndicator = React.memo(({ current, total }: { current: number; total: number }) => {
  const progress = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-text">
        <span className="text-lg font-semibold text-white">
          Pergunta {Math.min(current, total)} de {total}
        </span>
        <span className="block text-sm text-white/60 mt-1">
          {Math.round(progress)}% concluído
        </span>
      </div>
    </div>
  );
});
ProgressIndicator.displayName = "ProgressIndicator";

const StatsGrid = React.memo(({ perfil }: { perfil: ExpertProfile }) => {
  const stats = [
    { icon: BarChart3, value: Object.values(perfil.coberturaDominios).reduce((a, b) => a + b, 0), label: 'Respostas' },
    { icon: Target, value: perfil.metricas.metaforas, label: 'Metáforas' },
    { icon: Zap, value: perfil.metricas.contradicoes, label: 'Padrões' },
    { icon: Users, value: Object.entries(perfil.bigFive).sort(([,a], [,b]) => b - a)[0]?.[0]?.slice(0,8) || '...', label: 'Traço Dom.' },
  ];
  
  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <stat.icon className="stat-icon" />
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
});
StatsGrid.displayName = "StatsGrid";

const WelcomeScreen = React.memo(({ onStart }: { onStart: () => void }) => (
  <div className="hero-section">
    <div className="hero-badge">
      ACELERE O
    </div>
    
    <div className="hero-title">
      <h1 className="title-main">
        Chance To <span className="title-highlight">Overcome</span>
      </h1>
      <h2 className="title-secondary">Your Potential</h2>
    </div>
    
    <p className="hero-description">
      Estamos aqui para <strong>Conectar</strong> com sua <strong>Audiência</strong> em um nível pessoal e 
      <strong> Ajudá-lo</strong> a <strong>Prosperar</strong> nesta emocionante <strong>Nova Fronteira!</strong>
    </p>
    
    <div className="mic-container">
      <div className="mic-background">
        <div className="mic-glow-ring"></div>
      </div>
      <button onClick={onStart} className="cta-button">
        <span>Iniciar Análise DNA</span>
        <ArrowRight className="w-6 h-6 ml-2" />
      </button>
    </div>
    
    <div className="flex items-center justify-center space-x-8 text-sm text-white/60 mt-8">
      <div className="flex items-center space-x-2">
        <Eye className="w-4 h-4" />
        <span>{PERGUNTAS_DNA.length} perguntas</span>
      </div>
      <div className="flex items-center space-x-2">
        <Award className="w-4 h-4" />
        <span>Certificado</span>
      </div>
    </div>
  </div>
));
WelcomeScreen.displayName = "WelcomeScreen";

const SessionScreen = ({ pergunta, status, onStartRecording, onStopRecording, perfil, currentIndex, total }: { 
  pergunta: Pergunta | null; 
  status: SessionStatus; 
  onStartRecording: () => void; 
  onStopRecording: () => void; 
  perfil: ExpertProfile; 
  currentIndex: number; 
  total: number; 
}) => {
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'recording') { 
      intervalRef.current = setInterval(() => setTimer(prev => prev + 1), 1000); 
    } else { 
      if (intervalRef.current) clearInterval(intervalRef.current); 
      setTimer(0); 
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status]);

  // Mapeamento de status com tipagem correta
  const statusMap: Record<SessionStatus, StatusConfig> = {
    listening: { message: 'Reproduzindo pergunta...', icon: Volume2, showWaves: true },
    waiting_for_user: { message: 'Pronto para gravar', icon: Mic, showWaves: false },
    recording: { message: 'Gravando sua narrativa...', icon: Square, showWaves: true },
    processing: { message: 'Analisando padrões...', icon: Brain, isProcessing: true },
    idle: { message: '', icon: Mic },
    finished: { message: 'Concluído', icon: Check },
  };
  
  const config = statusMap[status];
  const StatusIcon = config.icon;

  if (!pergunta) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-12 h-12 text-green-400 animate-spin" />
        <p className="text-white/80 text-lg ml-4">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <ProgressIndicator current={currentIndex} total={total} />
      <StatsGrid perfil={perfil} />
      
      <div className="question-container">
        <div className="question-card">
          <div className="question-meta">
            <div className="question-number">{currentIndex}</div>
            <div className="question-domain">{pergunta.dominio}</div>
          </div>
          <div className="question-text">
            {pergunta.texto}
          </div>
        </div>
      </div>
      
      <div className="status-container">
        <div className="status-display">
          <StatusIcon className="status-icon text-green-400" />
          <span className="status-text">{config.message}</span>
          {status === 'recording' && (
            <span className="recording-timer ml-4">
              {`${Math.floor(timer / 60).toString().padStart(2, '0')}:${(timer % 60).toString().padStart(2, '0')}`}
            </span>
          )}
        </div>
        
        {config.showWaves && <AudioWaves isActive={true} />}
        
        {config.isProcessing && (
          <div className="flex space-x-2">
            {[0,1,2].map(i => 
              <div 
                key={i} 
                className="w-3 h-3 bg-green-400 rounded-full animate-bounce" 
                style={{animationDelay: `${i*0.2}s`}}
              />
            )}
          </div>
        )}
        
        <div className="mic-container">
          <div className="mic-background">
            <div className="mic-glow-ring"></div>
          </div>
          <button 
            onClick={status === 'recording' ? onStopRecording : onStartRecording}
            disabled={status === 'listening' || status === 'processing'}
            className={`mic-button ${status === 'recording' ? 'recording' : ''} ${(status === 'listening' || status === 'processing') ? 'disabled' : ''}`}
          >
            {status === 'recording' ? 
              <Square className="mic-icon" /> : 
              <Mic className="mic-icon" />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportScreen = React.memo(({ sintese, onRestart }: { 
  perfil: ExpertProfile; 
  sintese: string; 
  onRestart: () => void; 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownload = useCallback(() => {
    setIsDownloading(true);
    setTimeout(() => {
      try { 
        const blob = new Blob([sintese], { type: 'text/plain;charset=utf-8' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `DNA_Report_${new Date().toISOString().split('T')[0]}.txt`; 
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a); 
        URL.revokeObjectURL(url); 
      } catch (e) { 
        console.error("Erro ao baixar:", e); 
      } finally { 
        setIsDownloading(false); 
      }
    }, 500);
  }, [sintese]);
  
  return (
    <div className="report-container">
      <div className="report-header">
        <div className="completion-badge">
          <Check className="w-12 h-12 text-black" />
        </div>
        <h1 className="completion-title">Análise Concluída!</h1>
        <p className="completion-subtitle">
          Seu relatório DNA está pronto. Explore os insights sobre sua personalidade.
        </p>
      </div>
      
      <div className="report-content">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Relatório DNA</h2>
          </div>
          <button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isDownloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isDownloading ? 'Baixando...' : 'Download'}</span>
          </button>
        </div>
        
        <div className="report-text">
          {sintese}
        </div>
      </div>
      
      <div className="text-center mt-8">
        <button onClick={onRestart} className="cta-button">
          <Play className="w-6 h-6 mr-3" />
          Nova Análise
        </button>
      </div>
    </div>
  );
});
ReportScreen.displayName = "ReportScreen";

const ErrorScreen = React.memo(({ message, onRetry }: { message: string; onRetry: () => void; }) => (
  <div className="error-container">
    <AlertTriangle className="error-icon" />
    <h2 className="error-title">Ops! Algo deu errado</h2>
    <p className="error-message">{message}</p>
    <button onClick={onRetry} className="error-button">
      Tentar Novamente
    </button>
  </div>
));
ErrorScreen.displayName = "ErrorScreen";

export default function DNAAnalysisApp() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile>(criarPerfilInicial());
  const [finalReport, setFinalReport] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const currentQuestion = PERGUNTAS_DNA[currentQuestionIndex] || null;

  const playCurrentQuestionInternal = useCallback(async (questionToPlay: Pergunta | null) => {
    if (!questionToPlay) { 
      setError("Nenhuma pergunta para tocar."); 
      setSessionStatus('finished'); 
      return; 
    }
    setSessionStatus('listening');
    try { 
      await audioService.playAudioFromUrl(questionToPlay.audioUrl, () => setSessionStatus('waiting_for_user')); 
    } catch (err) { 
      console.error('Erro ao tocar áudio:', err); 
      setError(err instanceof Error ? err.message : 'Erro ao tocar áudio.'); 
      setSessionStatus('waiting_for_user'); 
    }
  }, []);

  const initializeApp = useCallback(async () => {
    setError(null); 
    setSessionStatus('listening');
    try { 
      await audioService.initAudio(); 
      setIsAudioInitialized(true); 
      await playCurrentQuestionInternal(PERGUNTAS_DNA[0]); 
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Erro ao inicializar.'); 
      setSessionStatus('idle'); 
    }
  }, [playCurrentQuestionInternal]);

  const startRecording = useCallback(async () => {
    if (!isAudioInitialized) { 
      setError("Áudio não inicializado. Permita o acesso ao microfone."); 
      return; 
    }
    setError(null);
    try { 
      await audioService.startRecording(); 
      setSessionStatus('recording'); 
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Erro ao gravar.'); 
      setSessionStatus('waiting_for_user'); 
    }
  }, [isAudioInitialized]);

  const stopRecording = useCallback(async () => {
    setSessionStatus('processing');
    try {
      await audioService.stopRecording();
      if (!currentQuestion) throw new Error("Pergunta atual indefinida.");
      
      const mockTranscription = `Resposta simulada para ${currentQuestion.dominio}: Responsável, organizado, ajudando pessoas. Justiça e igualdade.`;
      const updatedProfile = analysisEngine.analisarFragmento(mockTranscription, expertProfile, currentQuestion);
      setExpertProfile(updatedProfile);
      
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < PERGUNTAS_DNA.length) { 
        setCurrentQuestionIndex(nextIndex); 
        setTimeout(() => playCurrentQuestionInternal(PERGUNTAS_DNA[nextIndex]), 1000); 
      } else { 
        setFinalReport(analysisEngine.gerarSinteseFinal(updatedProfile)); 
        setSessionStatus('finished'); 
      }
    } catch (err) { 
      console.error("Erro ao parar gravação:", err); 
      setError(err instanceof Error ? err.message : 'Erro ao processar gravação.'); 
      setSessionStatus('waiting_for_user'); 
    }
  }, [currentQuestion, currentQuestionIndex, expertProfile, playCurrentQuestionInternal]);

  const restart = useCallback(() => {
    setSessionStatus('idle'); 
    setCurrentQuestionIndex(0); 
    setExpertProfile(criarPerfilInicial()); 
    setFinalReport(''); 
    setError(null); 
    setIsAudioInitialized(false);
    if (audioService.stream) { 
      audioService.stream.getTracks().forEach(track => track.stop()); 
      audioService.stream = null; 
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    if (!isAudioInitialized) initializeApp();
    else if (currentQuestion && (sessionStatus === 'waiting_for_user' || sessionStatus === 'listening')) playCurrentQuestionInternal(currentQuestion);
    else restart();
  }, [isAudioInitialized, initializeApp, currentQuestion, sessionStatus, playCurrentQuestionInternal, restart]);

  useEffect(() => { 
    return () => { 
      if (audioService.stream) { 
        audioService.stream.getTracks().forEach(track => track.stop()); 
      } 
    }; 
  }, []);

  const renderContent = () => {
    if (error) return <ErrorScreen message={error} onRetry={handleRetry} />;
    
    switch (sessionStatus) {
      case 'idle': 
        return <WelcomeScreen onStart={initializeApp} />;
      case 'finished': 
        return <ReportScreen perfil={expertProfile} sintese={finalReport} onRestart={restart} />;
      default: 
        return (
          <SessionScreen 
            pergunta={currentQuestion} 
            status={sessionStatus} 
            onStartRecording={startRecording} 
            onStopRecording={stopRecording} 
            perfil={expertProfile} 
            currentIndex={currentQuestionIndex + 1} 
            total={PERGUNTAS_DNA.length} 
          />
        );
    }
  };

  return (
    <div className="app-container">
      <FloatingElements />
      <Navigation />
      
      <main className="content-wrapper pt-20">
        {renderContent()}
      </main>
      
      <footer className="text-center py-6 text-xs text-white/30">
        <p>© {new Date().getFullYear()} DNA Analysis Platform. Análise psicológica com IA.</p>
      </footer>
    </div>
  );
}