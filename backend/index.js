require('dotenv').config();
console.log("🧪 ENV loaded:", process.env.AWS_SECRET_ACCESS_KEY);

const express = require('express');
const cors = require('cors');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
app.use(cors());
app.use(express.json());

// Ruta simplă de test
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Setări AWS
const REGION = process.env.AWS_REGION || 'eu-north-1';
const BUCKET = process.env.BUCKET_NAME || 'facial-recoooo';

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'INSERT_YOUR_KEY',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'INSERT_YOUR_SECRET',
  },
});

app.post('/generate-presigned-url', async (req, res) => {
  const { fileName, fileType, folderName } = req.body;

  if (!fileName || !fileType || !folderName) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const key = `${folderName}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType,
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ url, key });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Could not generate presigned URL' });
  }
});

// Server pornit pe toate IP-urile (vizibil din rețea)
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
