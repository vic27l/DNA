// src/app/api/transcribe/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { uploadAudioToDrive } from '@/services/googleDriveService';
import { DeepgramClient, createClient as createDeepgramClient } from '@deepgram/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Passo 0: Proteger a Rota
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não Autorizado' }, { status: 401 });
  }

  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramApiKey) {
    return NextResponse.json({ error: 'Chave da API Deepgram não configurada' }, { status: 500 });
  }
  const deepgram: DeepgramClient = createDeepgramClient(deepgramApiKey);

  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;
    const sessionId = formData.get('sessionId') as string;
    const questionText = formData.get('questionText') as string;

    if (!audioBlob || !sessionId || !questionText) {
      return NextResponse.json({ error: 'Dados incompletos na requisição' }, { status: 400 });
    }

    // Busca a data de criação da sessão para usar na descrição do arquivo do Drive
    const { data: sessionData, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('created_at')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !sessionData) {
        throw new Error(`Sessão não encontrada ou erro ao buscar: ${sessionError?.message}`);
    }

    // Passo 3: Upload e Transcrição em Paralelo
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());

    const [uploadResult, transcribeResult] = await Promise.all([
      uploadAudioToDrive(audioBlob, session.user.email!, questionText, new Date(sessionData.created_at)),
      deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
        model: 'nova-2',
        language: 'pt-BR',
        smart_format: true,
      }),
    ]);
    
    const driveFileId = uploadResult;
    const { result, error: transcribeError } = transcribeResult;

    if (transcribeError) {
      throw transcribeError;
    }
    const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript || '';

    // Passo 4: Salvar no Banco de Dados
    const { error: insertError } = await supabase.from('user_responses').insert({
      session_id: sessionId,
      question_text: questionText,
      transcript_text: transcript,
      audio_file_drive_id: driveFileId,
    });

    if (insertError) {
      // Idealmente, aqui você teria uma lógica para lidar com o fato de que o áudio foi salvo
      // mas o registro no DB falhou (ex: log, retry, etc.)
      console.error('Erro ao salvar no Supabase:', insertError);
      throw new Error('Falha ao salvar a resposta no banco de dados.');
    }

    // Passo 5: Retornar a Transcrição
    return NextResponse.json({ transcript });

  } catch (error) {
    console.error('Erro na rota /api/transcribe:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: `Falha ao processar o áudio: ${errorMessage}` }, { status: 500 });
  }
}
