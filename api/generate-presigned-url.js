import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'eu-north-1';
const BUCKET = process.env.BUCKET_NAME || 'facial-recoooo';

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  console.log('req.method:', req.method);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await req.json();  // aici citim body-ul JSON din request
    console.log('Body received:', body);

    const { fileName, fileType, folderName } = body;

    if (!fileName || !fileType || !folderName) {
      console.log('Missing params:', { fileName, fileType, folderName });
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const key = `${folderName}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return res.status(200).json({ url, key });
  } catch (error) {
    console.error('Error:', error);
    return res.status(400).json({ error: 'Invalid JSON or other error' });
  }
}
