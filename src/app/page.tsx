'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Square, 
  Loader, 
  ArrowRight, 
  FileText, 
  Check, 
  AlertTriangle,
  Brain,
  Sparkles,
  Timer,
  Volume2,
  VolumeX,
  BarChart3,
  Users,
  Target,
  Zap,
  Play,
  Pause,
  Download,
  Share2,
  Award,
  TrendingUp,
  Eye,
  Lightbulb
} from 'lucide-react';
import { PERGUNTAS_DNA, criarPerfilInicial } from '../lib/config';
import { analisarFragmento, gerarSinteseFinal } from '../lib/analysisEngine';
import { initAudio, playAudioFromUrl, startRecording, stopRecording } from '../services/webAudioService';
import type { ExpertProfile, SessionStatus, Pergunta } from '../lib/types';

// Componente para partículas DNA flutuantes
const DNAParticles = () => (
  <div className="dna-particles-container">
    {[...Array(30)].map((_, i) => (
      <div
        key={i}
        className="dna-particle"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 20}s`,
          animationDuration: `${15 + Math.random() * 10}s`
        }}
      />
    ))}
  </div>
);

// Componente para ondas de áudio animadas
const AudioWaves = ({ isActive }: { isActive: boolean }) => (
  <div className="audio-waves">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className={`audio-wave ${isActive ? 'active' : ''}`}
        style={{ animationDelay: `${i * 0.1}s` }}
      />
    ))}
  </div>
);

// Componente para indicador de progresso avançado
const AdvancedProgressIndicator = ({ current, total }: { current: number; total: number }) => {
  const progress = (current / total) * 100;
  const segments = Array.from({ length: total }, (_, i) => i + 1);
  
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="progress-circle">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="url(#progressGradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Pergunta {current} de {total}</h3>
            <p className="text-white/60">Análise em progresso...</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-400">{current}</div>
          <div className="text-sm text-white/60">Concluídas</div>
        </div>
      </div>
      
      <div className="progress-segments">
        {segments.map((segment) => (
          <div
            key={segment}
            className={`progress-segment ${segment <= current ? 'completed' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

// Componente para estatísticas em tempo real melhoradas
const EnhancedLiveStats = ({ perfil }: { perfil: ExpertProfile }) => {
  const totalResponses = Object.values(perfil.coberturaDominios).reduce((a, b) => a + b, 0);
  const dominantValue = Object.entries(perfil.valoresSchwartz)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Analisando...';
  const dominantTrait = Object.entries(perfil.bigFive)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Analisando...';
  
  const stats = [
    { icon: BarChart3, value: totalResponses, label: 'Respostas Analisadas', color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: Target, value: perfil.metricas.metaforas, label: 'Metáforas Detectadas', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Zap, value: perfil.metricas.contradicoes, label: 'Padrões Complexos', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { icon: Users, value: dominantTrait.slice(0, 8), label: 'Traço Dominante', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="stat-card group"
        >
          <div className={`stat-icon ${stat.bg}`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
          <div className="stat-glow"></div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Componente para a tela inicial premium
const PremiumWelcomeScreen = ({ onStart }: { onStart: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="w-full max-w-6xl text-center"
  >
    <div className="hero-section">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
        className="hero-logo"
      >
        <div className="logo-container">
          <Brain className="w-16 h-16 text-white" />
          <div className="logo-pulse"></div>
        </div>
        <Sparkles className="sparkle-1" />
        <Sparkles className="sparkle-2" />
        <Sparkles className="sparkle-3" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="hero-content"
      >
        <h1 className="hero-title">
          <span className="title-main">DNA</span>
          <span className="title-sub">Deep Narrative Analysis</span>
          <div className="title-accent">Powered by Advanced AI</div>
        </h1>
        
        <p className="hero-description">
          Plataforma profissional de análise psicológica através de narrativa pessoal. 
          Utilizamos inteligência artificial avançada para revelar padrões profundos 
          da sua personalidade e estrutura cognitiva.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="features-grid"
      >
        <div className="feature-card">
          <div className="feature-icon bg-green-500/10">
            <Award className="w-8 h-8 text-green-400" />
          </div>
          <h3>Análise Científica</h3>
          <p>Baseada em modelos psicológicos validados como Big Five e Valores de Schwartz</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon bg-blue-500/10">
            <Brain className="w-8 h-8 text-blue-400" />
          </div>
          <h3>IA Avançada</h3>
          <p>Processamento de linguagem natural com análise semântica profunda</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon bg-purple-500/10">
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
          <h3>Insights Profundos</h3>
          <p>Revelações sobre padrões comportamentais e estruturas de personalidade</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon bg-yellow-500/10">
            <Lightbulb className="w-8 h-8 text-yellow-400" />
          </div>
          <h3>Relatório Detalhado</h3>
          <p>Análise completa com recomendações personalizadas e insights acionáveis</p>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9 }}
        className="cta-section"
      >
        <button
          onClick={onStart}
          className="cta-button group"
        >
          <span className="cta-text">Iniciar Análise Profissional</span>
          <ArrowRight className="cta-icon" />
          <div className="cta-glow"></div>
        </button>
        
        <div className="cta-info">
          <div className="info-item">
            <Timer className="w-4 h-4" />
            <span>~45 minutos</span>
          </div>
          <div className="info-item">
            <Eye className="w-4 h-4" />
            <span>108 perguntas</span>
          </div>
          <div className="info-item">
            <Award className="w-4 h-4" />
            <span>Certificado profissional</span>
          </div>
        </div>
      </motion.div>
    </div>
  </motion.div>
);

// Componente para a tela de sessão premium
const PremiumSessionScreen = ({
  pergunta,
  status,
  onStartRecording,
  onStopRecording,
  perfil,
  currentIndex,
  total
}: {
  pergunta: Pergunta | null;
  status: SessionStatus;
  onStartRecording: () => void;
  onStopRecording: () => void;
  perfil: ExpertProfile;
  currentIndex: number;
  total: number;
}) => {
  const [timer, setTimer] = useState(0);
  const [audioMuted, setAudioMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'recording') {
      intervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimer(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'listening':
        return {
          message: 'Reproduzindo pergunta...',
          icon: Volume2,
          color: 'text-blue-400',
          showWaves: true
        };
      case 'waiting_for_user':
        return {
          message: 'Pronto para gravar sua resposta',
          icon: Mic,
          color: 'text-green-400',
          showWaves: false
        };
      case 'recording':
        return {
          message: 'Gravando sua narrativa...',
          icon: Square,
          color: 'text-red-400',
          showWaves: true
        };
      case 'processing':
        return {
          message: 'Analisando padrões narrativos...',
          icon: Brain,
          color: 'text-purple-400',
          showWaves: false
        };
      default:
        return {
          message: '',
          icon: Mic,
          color: 'text-white',
          showWaves: false
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="w-full max-w-7xl">
      <AdvancedProgressIndicator current={currentIndex} total={total} />
      
      <EnhancedLiveStats perfil={perfil} />
      
      <div className="session-container">
        <div className="question-section">
          <AnimatePresence mode="wait">
            <motion.div
              key={pergunta?.texto}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="question-card"
            >
              <div className="question-header">
                <div className="question-number">
                  <span>{currentIndex}</span>
                </div>
                <div className="question-meta">
                  <div className="domain-tag">{pergunta?.dominio}</div>
                  <div className="question-progress">Pergunta {currentIndex} de {total}</div>
                </div>
              </div>
              
              <div className="question-content">
                <p className="question-text">
                  {pergunta?.texto}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="control-section">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="status-display"
          >
            <div className="status-content">
              <statusConfig.icon className={`status-icon ${statusConfig.color}`} />
              <div className="status-text">
                <div className="status-message">{statusConfig.message}</div>
                {status === 'recording' && (
                  <div className="recording-timer">
                    <Timer className="w-5 h-5 text-red-400" />
                    <span className="timer-display">{formatTime(timer)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {statusConfig.showWaves && <AudioWaves isActive={true} />}
            
            {(status === 'listening' || status === 'processing') && (
              <div className="processing-indicator">
                <div className="processing-dot"></div>
                <div className="processing-dot"></div>
                <div className="processing-dot"></div>
              </div>
            )}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={status === 'recording' ? onStopRecording : onStartRecording}
            disabled={status === 'listening' || status === 'processing'}
            className={`record-button ${status === 'recording' ? 'recording' : ''} ${
              status === 'listening' || status === 'processing' ? 'disabled' : ''
            }`}
          >
            <div className="button-content">
              {status === 'recording' && (
                <>
                  <div className="pulse-ring"></div>
                  <div className="recording-indicator">
                    <Square className="w-12 h-12 text-white" />
                  </div>
                </>
              )}
              
              {status === 'waiting_for_user' && (
                <Mic className="w-12 h-12 text-white" />
              )}
              
              {(status === 'listening' || status === 'processing') && (
                <Loader className="w-12 h-12 text-white animate-spin" />
              )}
            </div>
            
            <div className="button-glow"></div>
          </motion.button>

          <div className="control-options">
            <button
              onClick={() => setAudioMuted(!audioMuted)}
              className="option-button"
            >
              {audioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              <span>{audioMuted ? 'Ativar Áudio' : 'Silenciar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para a tela de relatório premium
const PremiumReportScreen = ({ report, onRestart }: { report: string; onRestart: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8 }}
    className="w-full max-w-7xl"
  >
    <div className="report-header">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="completion-badge"
      >
        <Check className="w-16 h-16 text-white" />
        <div className="badge-glow"></div>
      </motion.div>
      
      <div className="header-content">
        <h1 className="completion-title">Análise Concluída com Sucesso</h1>
        <p className="completion-subtitle">
          Sua jornada narrativa foi processada e analisada. O relatório completo 
          está disponível abaixo com insights profundos sobre sua personalidade.
        </p>
      </div>
    </div>

    <div className="report-container">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <FileText className="w-6 h-6 text-green-400" />
          <h2>Relatório DNA Completo</h2>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-button">
            <Download className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
          <button className="toolbar-button">
            <Share2 className="w-4 h-4" />
            <span>Compartilhar</span>
          </button>
        </div>
      </div>
      
      <div className="report-content">
        <pre className="report-text">
          {report}
        </pre>
      </div>
    </div>

    <div className="report-actions">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        className="restart-button"
      >
        <span>Realizar Nova Análise</span>
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  </motion.div>
);

// Componente de erro premium
const PremiumErrorScreen = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="w-full max-w-lg text-center"
  >
    <div className="error-container">
      <div className="error-icon">
        <AlertTriangle className="w-16 h-16 text-red-400" />
      </div>
      <div className="error-content">
        <h3 className="error-title">Ocorreu um Problema</h3>
        <p className="error-message">{error}</p>
        <button onClick={onRetry} className="error-button">
          Tentar Novamente
        </button>
      </div>
    </div>
  </motion.div>
);

// Componente principal
export default function DnaPage() {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [perguntaAtual, setPerguntaAtual] = useState<Pergunta | null>(null);
  const [perfil, setPerfil] = useState<ExpertProfile>(criarPerfilInicial());
  const [error, setError] = useState<string | null>(null);

  const perguntaIndex = useRef(0);

  useEffect(() => {
    initAudio().catch(err => {
      console.error("Erro ao inicializar áudio:", err);
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    });
  }, []);

  const iniciarSessao = useCallback(() => {
    perguntaIndex.current = 0;
    setPerfil(criarPerfilInicial());
    setError(null);
    fazerProximaPergunta();
  }, []);
  
  const fazerProximaPergunta = useCallback(async () => {
    if (perguntaIndex.current < PERGUNTAS_DNA.length) {
      const pergunta = PERGUNTAS_DNA[perguntaIndex.current];
      setPerguntaAtual(pergunta);
      setStatus('listening');
      try {
        await playAudioFromUrl(pergunta.audioUrl, () => setStatus('waiting_for_user'));
        perguntaIndex.current++;
      } catch (err) {
        console.error("Erro ao reproduzir áudio:", err);
        setError("Erro ao reproduzir a pergunta. Tentando novamente...");
        setTimeout(fazerProximaPergunta, 2000);
      }
    } else {
      setStatus('finished');
    }
  }, []);

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
      setError("Problema ao processar sua resposta. Continuando para a próxima pergunta...");
      setTimeout(fazerProximaPergunta, 2000);
    }
  }, [perguntaAtual, perfil, fazerProximaPergunta]);

  const transcreverAudio = async (audioBlob: Blob): Promise<string> => {
    const response = await fetch('/api/transcribe', { method: 'POST', body: audioBlob });
    if (!response.ok) throw new Error("Falha na transcrição");
    const data = await response.json();
    return data.transcript;
  };

  const renderContent = () => {
    if (error) {
      return <PremiumErrorScreen error={error} onRetry={() => setError(null)} />;
    }

    switch (status) {
      case 'idle':
        return <PremiumWelcomeScreen onStart={iniciarSessao} />;
      case 'finished':
        return <PremiumReportScreen report={gerarSinteseFinal(perfil)} onRestart={iniciarSessao} />;
      default:
        return (
          <PremiumSessionScreen
            pergunta={perguntaAtual}
            status={status}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            perfil={perfil}
            currentIndex={perguntaIndex.current}
            total={PERGUNTAS_DNA.length}
          />
        );
    }
  };

  return (
    <main className="app-container">
      <DNAParticles />
      
      <div className="content-wrapper">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
      
      <footer className="app-footer">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="footer-content"
        >
          <p>DNA - Deep Narrative Analysis © 2024</p>
          <p>Powered by Advanced AI & Psychological Science</p>
        </motion.div>
      </footer>
    </main>
  );
}