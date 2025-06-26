// src/services/googleDriveService.ts
import { google } from 'googleapis';
import stream from 'stream';

// Função para criar um cliente OAuth2 autenticado
const getAuthenticatedClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // O URI de redirecionamento pode ser o do OAuth Playground ou da sua app
    'http://localhost:3000/api/auth/callback/google'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_DRIVE_ADMIN_REFRESH_TOKEN,
  });

  return oauth2Client;
};

// Função para fazer upload de um áudio para o Google Drive
export const uploadAudioToDrive = async (
  audioBlob: Blob,
  userEmail: string,
  questionText: string,
  sessionCreatedAt: Date
): Promise<string> => {
  const oauth2Client = getAuthenticatedClient();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  if (!parentFolderId) {
    throw new Error('ID da pasta do Google Drive não configurado.');
  }

  // 1. Encontrar ou criar a pasta para o usuário
  const userFolderName = `DNA_Respostas_${userEmail}`;
  let userFolderId: string | undefined;

  const folderQuery = `mimeType='application/vnd.google-apps.folder' and name='${userFolderName}' and '${parentFolderId}' in parents and trashed=false`;
  const folderRes = await drive.files.list({
    q: folderQuery,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (folderRes.data.files && folderRes.data.files.length > 0) {
    userFolderId = folderRes.data.files[0].id!;
  } else {
    const fileMetadata = {
      name: userFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };
    const newFolder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });
    userFolderId = newFolder.data.id!;
  }

  // 2. Fazer o upload do arquivo de áudio
  const fileName = `resposta_${new Date().toISOString()}.webm`;
  const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
  const bufferStream = new stream.PassThrough();
  bufferStream.end(audioBuffer);

  const fileMetadata = {
    name: fileName,
    parents: [userFolderId],
    description: `Resposta para a pergunta: "${questionText}" na sessão iniciada em ${sessionCreatedAt.toISOString()}`,
  };

  const media = {
    mimeType: audioBlob.type,
    body: bufferStream,
  };

  const uploadedFile = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id',
  });

  if (!uploadedFile.data.id) {
    throw new Error('Falha ao obter o ID do arquivo após o upload.');
  }

  return uploadedFile.data.id;
};
