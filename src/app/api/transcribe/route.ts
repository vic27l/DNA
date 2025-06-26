// src/app/api/transcribe/route.ts

import { DeepgramClient, createClient } from '@deepgram/sdk';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { uploadAudioToDrive } from '@/services/googleDriveService';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  // Passo 0: Proteger a Rota
  const session = await getServerSession(authOptions);
  
  // Verificação de sessão e email
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado ou sessão inválida.' }, { status: 401 });
  }

  const user = session.user;
  const userId = user.email; // Usando email como identificador único

  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramApiKey) {
    console.error("A chave da API da Deepgram não está configurada.");
    return NextResponse.json({ error: 'Erro de configuração no servidor.' }, { status: 500 });
  }

  const deepgram: DeepgramClient = createClient(deepgramApiKey);

  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob | null;
    const sessionId = formData.get('sessionId') as string | null;
    const questionText = formData.get('questionText') as string | null;
    
    if (!audioBlob || !sessionId || !questionText) {
      return NextResponse.json({ error: 'Dados da requisição incompletos.' }, { status: 400 });
    }
    
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());

    const [driveFileId, deepgramResponse] = await Promise.all([
      uploadAudioToDrive(audioBlob, user.email!, questionText),
      deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model: 'nova-2',
          language: 'pt-BR',
          smart_format: true,
        }
      )
    ]);

    if (deepgramResponse.error) {
      console.error('Erro retornado pela API da Deepgram:', deepgramResponse.error);
      throw deepgramResponse.error;
    }

    const transcript = deepgramResponse.result?.results?.channels[0]?.alternatives[0]?.transcript || '';
    
    const { error: dbError } = await supabase
      .from('user_responses')
      .insert({
        session_id: sessionId,
        question_text: questionText,
        transcript_text: transcript,
        audio_file_drive_id: driveFileId,
        user_id: userId, // Usando email como identificador único
      });

    if (dbError) {
      console.error('Erro ao salvar resposta no Supabase:', dbError);
    }
    
    return NextResponse.json({ transcript });

  } catch (error) {
    console.error('Erro interno na rota de transcrição:', error);
    return NextResponse.json({ error: 'Falha ao processar o áudio.' }, { status: 500 });
  }
}