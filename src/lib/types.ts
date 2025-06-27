// src/lib/types.ts (Modificado)

// --- Tipos existentes permanecem os mesmos ---

export interface Pergunta {
  texto: string;
  audioUrl: string;
  dominio: string; 
}

export interface BigFiveMetrics {
  [key: string]: number;
  Openness: number;
  Conscientiousness: number;
  Extraversion: number;
  Agreeableness: number;
  Neuroticism: number;
}

export interface SchwartzValues {
  [key: string]: number;
  'Self-Direction': number;
  Stimulation: number;
  Hedonism: number;
  Achievement: number;
  Power: number;
  Security: number;
  Conformity: number;
  Tradition: number;
  Benevolence: number;
  Universalism: number;
}

export interface PrimaryMotivators {
  [key: string]: number;
  Purpose: number;
  Autonomy: number;
  Mastery: number;
  Connection: number;
}

export type BigFive = keyof BigFiveMetrics;
export type ValorSchwartz = keyof SchwartzValues;
export type Motivador = keyof PrimaryMotivators;

export interface ExpertProfile {
  bigFive: BigFiveMetrics;
  valoresSchwartz: SchwartzValues;
  motivadores: PrimaryMotivators;
  coberturaDominios: {
    [key: string]: number;
  };
  metricas: {
    contradicoes: number;
    metaforas: number;
  };
  metaforasCentrais: string[];
  conflitosDeValorDetectados: string[];
}

export type SessionStatus =
  | 'idle'
  | 'listening'
  | 'waiting_for_user'
  | 'recording'
  | 'processing'
  | 'finished';


// --- NOVOS TIPOS PARA O BANCO DE DADOS ---

// Representa a estrutura da tabela 'analysis_sessions'
export interface AnalysisSession {
  id: string; // uuid
  user_id: string; // uuid, foreign key para users.id
  created_at: string; // timestamp with time zone
  final_synthesis?: string; // text, nullable
}

// Representa a estrutura da tabela 'user_responses'
export interface UserResponse {
  id: string; // uuid
  session_id: string; // uuid, foreign key para analysis_sessions.id
  question_text: string; // text
  transcript_text: string; // text
  audio_file_drive_id: string; // O ID do arquivo no Google Drive
  created_at: string; // timestamp with time zone
}
