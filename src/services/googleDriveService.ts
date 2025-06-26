// services/googleDriveService.ts

import { google } from 'googleapis';
import { Readable } from 'stream';

// Configuração da autenticação com Google Drive
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Função para criar uma pasta no Google Drive
 */
async function createFolder(name: string, parentId?: string): Promise<string> {
  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId && { parents: [parentId] }),
  };

  try {
    const file = await drive.files.create({
      requestBody: fileMetadata, // Corrigido: usar requestBody ao invés de resource
      fields: 'id',
    });
    if (!file.data.id) throw new Error('A criação da pasta não retornou um ID.');
    return file.data.id;
  } catch (error) {
    console.error('Erro ao criar pasta no Google Drive:', error);
    throw new Error('Falha ao criar pasta no Google Drive.');
  }
}

/**
 * Função para verificar se uma pasta existe
 */
async function folderExists(name: string, parentId?: string): Promise<string | null> {
  try {
    const query = parentId
      ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
      : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
    });

    return response.data.files && response.data.files.length > 0 
      ? response.data.files[0].id || null 
      : null;
  } catch (error) {
    console.error('Erro ao verificar existência da pasta:', error);
    return null;
  }
}

/**
 * Função para obter ou criar uma pasta
 */
async function getOrCreateFolder(name: string, parentId?: string): Promise<string> {
  let folderId = await folderExists(name, parentId);
  if (!folderId) {
    folderId = await createFolder(name, parentId);
  }
  return folderId;
}

/**
 * Função principal para upload de áudio
 */
export async function uploadAudioToDrive(
  audioBlob: Blob,
  userEmail: string,
  questionText: string
): Promise<string> {
  try {
    // 1. Criar/obter pasta "DNA Audio Responses"
    const mainFolderId = await getOrCreateFolder('DNA Audio Responses');

    // 2. Criar/obter pasta do usuário
    const userFolderId = await getOrCreateFolder(userEmail, mainFolderId);

    // 3. Preparar dados do arquivo
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `audio_${timestamp}.webm`;

    const fileMetadata = {
      name: fileName,
      parents: [userFolderId],
      description: `Pergunta: ${questionText}`,
    };

    // 4. Upload do arquivo
    const media = {
      mimeType: 'audio/webm',
      body: stream,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata, // Corrigido: usar requestBody ao invés de resource
      media: media,
      fields: 'id',
    });

    if (!file.data.id) {
      throw new Error('Upload não retornou um ID de arquivo.');
    }

    console.log(`Arquivo de áudio enviado com sucesso. ID: ${file.data.id}`);
    return file.data.id;

  } catch (error) {
    console.error('Erro no upload para Google Drive:', error);
    throw new Error('Falha no upload do áudio para o Google Drive.');
  }
}