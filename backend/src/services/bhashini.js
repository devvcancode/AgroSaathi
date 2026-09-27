const LANGUAGE_CODES = new Set(['as', 'bn', 'brx', 'doi', 'en', 'gu', 'hi', 'kn', 'ks', 'kok', 'mai', 'ml', 'mni', 'mr', 'ne', 'or', 'pa', 'sa', 'sat', 'sd', 'ta', 'te', 'ur']);

function normalizeBhashiniLanguage(language) {
  const normalized = String(language || 'hi').trim().toLowerCase().split('-')[0];
  return LANGUAGE_CODES.has(normalized) ? normalized : 'hi';
}

function getTaskConfiguration(task) {
  const prefix = task === 'asr' ? 'BHASHINI_ASR' : 'BHASHINI_TTS';
  const endpoint = String(process.env[`${prefix}_ENDPOINT`] || '').trim();
  const authorization = String(process.env[`${prefix}_INFERENCE_KEY`] || '').trim();
  return endpoint && authorization ? { endpoint, authorization } : null;
}

async function infer(task, payload) {
  const configuration = getTaskConfiguration(task);
  if (!configuration) throw new Error(`Bhashini ${task.toUpperCase()} is not configured`);

  const response = await fetch(configuration.endpoint, {
    method: 'POST',
    headers: {
      Authorization: configuration.authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Bhashini ${task.toUpperCase()} request failed (${response.status})`);
  return data;
}

function isBhashiniAsrConfigured() {
  return Boolean(getTaskConfiguration('asr'));
}

function isBhashiniTtsConfigured() {
  return Boolean(getTaskConfiguration('tts'));
}

async function recognizeSpeech({ audioContent, language = 'hi', audioFormat = 'webm', samplingRate = 48000 }) {
  const content = String(audioContent || '').replace(/^data:audio\/[^;]+;base64,/i, '');
  if (!content || content.length > 12_000_000) throw new Error('Audio is empty or exceeds the supported size');

  const data = await infer('asr', {
    pipelineTasks: [{
      taskType: 'asr',
      config: {
        language: { sourceLanguage: normalizeBhashiniLanguage(language) },
        audioFormat,
        samplingRate: Number(samplingRate) || 48000,
      },
    }],
    inputData: { audio: [{ audioContent: content }] },
  });
  const transcript = data.pipelineResponse?.find((item) => item.taskType === 'asr')?.output?.[0]?.source
    || data.pipelineResponse?.[0]?.output?.[0]?.source;
  if (typeof transcript !== 'string' || !transcript.trim()) throw new Error('Bhashini did not return a transcript');
  return transcript.trim();
}

async function synthesizeSpeech({ text, language = 'hi', gender = 'female', samplingRate = 22050 }) {
  const source = String(text || '').trim();
  if (!source) throw new Error('Text is required for Bhashini speech synthesis');

  const data = await infer('tts', {
    pipelineTasks: [{
      taskType: 'tts',
      config: {
        language: { sourceLanguage: normalizeBhashiniLanguage(language) },
        gender,
        samplingRate: Number(samplingRate) || 22050,
      },
    }],
    inputData: { input: [{ source }] },
  });
  const audioContent = data.pipelineResponse?.find((item) => item.taskType === 'tts')?.audio?.[0]?.audioContent
    || data.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
  if (typeof audioContent !== 'string' || !audioContent) throw new Error('Bhashini did not return synthesized audio');
  return { audioContent, mimeType: 'audio/wav' };
}

module.exports = {
  isBhashiniAsrConfigured,
  isBhashiniTtsConfigured,
  normalizeBhashiniLanguage,
  recognizeSpeech,
  synthesizeSpeech,
};