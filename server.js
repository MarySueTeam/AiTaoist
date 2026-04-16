import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import {Readable} from 'stream';
import { buildFortuneRequest } from './server/fortuneRequests.js';

const app = express();
const port = Number(process.env.PORT || 9999);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');

dotenv.config({path: envLocalPath});
dotenv.config({path: envPath, override: false});

const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const apiKey = process.env.OPENAI_API_KEY || '';
const responsesUrl = new URL(`${baseUrl.replace(/\/$/, '')}/responses`);
const modelsUrl = new URL(`${baseUrl.replace(/\/$/, '')}/models`);

app.use(express.json({limit: '2mb'}));

app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    res.status(400).json({
      error: {
        message: '请求体不是有效的 JSON。',
      },
    });
    return;
  }

  next(error);
});

app.get('/api/models', async (_req, res) => {
  if (!apiKey) {
    res.status(500).json({
      error: {
        message: 'OPENAI_API_KEY is missing on the server.',
      },
    });
    return;
  }

  try {
    const upstreamResponse = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    const payload = await upstreamResponse.text();
    res.status(upstreamResponse.status).send(payload);
  } catch (error) {
    console.error('Proxy model list request failed:', error);
    res.status(502).json({
      error: {
        message: 'Upstream model list request failed.',
      },
    });
  }
});

app.post('/api/fortune', async (req, res) => {
  if (!apiKey) {
    res.status(500).json({
      error: {
        message: 'OPENAI_API_KEY is missing on the server.',
      },
    });
    return;
  }

  let upstreamBody;
  try {
    upstreamBody = buildFortuneRequest(req.body);
  } catch (error) {
    res.status(400).json({
      error: {
        message: error instanceof Error ? error.message : '请求参数不正确。',
      },
    });
    return;
  }

  try {
    const upstreamResponse = await fetch(responsesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(upstreamBody),
    });

    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    res.status(upstreamResponse.status);

    if (upstreamResponse.body) {
      const cacheControl = upstreamResponse.headers.get('cache-control');
      if (cacheControl) {
        res.setHeader('Cache-Control', cacheControl);
      }

      const connection = upstreamResponse.headers.get('connection');
      if (connection) {
        res.setHeader('Connection', connection);
      }

      Readable.fromWeb(upstreamResponse.body).pipe(res);
      return;
    }

    const payload = await upstreamResponse.text();
    res.send(payload);
  } catch (error) {
    console.error('Fortune request failed:', error);
    res.status(502).json({
      error: {
        message: 'Upstream fortune request failed.',
      },
    });
  }
});

app.use('/api/responses', (_req, res) => {
  res.status(410).json({
    error: {
      message: '通用 OpenAI 代理接口已禁用，请使用业务测算接口。',
    },
  });
});

app.use('/api', (_req, res) => {
  res.status(404).json({
    error: {
      message: '接口不存在。',
    },
  });
});

app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
