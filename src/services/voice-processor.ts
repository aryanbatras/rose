'use client';

/**
 * Voice recording and processing utilities.
 * Runs entirely client-side using MediaRecorder API.
 * FFmpeg.wasm conversion is loaded lazily when needed.
 */

export interface RecordingState {
  status: 'idle' | 'recording' | 'processing' | 'preview' | 'error';
  duration: number;
  audioBlob: Blob | null;
  error?: string;
}

export function createMediaRecorder(): Promise<{
  stream: MediaStream;
  recorder: MediaRecorder;
}> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  }).then((stream) => {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 128000,
    });

    return { stream, recorder };
  });
}

export function recordAudio(
  maxDurationMs = 120000
): Promise<{ blob: Blob; duration: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      const { stream, recorder } = await createMediaRecorder();
      const chunks: Blob[] = [];
      const startTime = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType });
        const duration = Date.now() - startTime;
        resolve({ blob, duration });
      };

      recorder.onerror = (e) => {
        stream.getTracks().forEach((t) => t.stop());
        reject(new Error('Recording error'));
      };

      recorder.start(100);

      if (maxDurationMs > 0) {
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, maxDurationMs);
      }
    } catch (err) {
      reject(err);
    }
  });
}

export function stopRecording(recorder: MediaRecorder, stream: MediaStream): Promise<{ blob: Blob; duration: number }> {
  return new Promise((resolve) => {
    const chunks: Blob[] = [];
    const startTime = Date.now();

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType });
      const duration = Date.now() - startTime;
      resolve({ blob, duration });
    };

    recorder.stop();
  });
}

export async function convertAudioToVideo(
  audioBlob: Blob
): Promise<Blob | null> {
  try {
    // Load FFmpeg.wasm dynamically to avoid blocking
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();
    const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: `${base}/ffmpeg-core.js`,
      wasmURL: `${base}/ffmpeg-core.wasm`,
    });

    await ffmpeg.writeFile('input.webm', await fetchFile(audioBlob));

    // Generate a simple gradient background as PNG via canvas
    const canvas = new OffscreenCanvas(720, 1280);
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 720, 1280);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 720, 1280);
    const bgBlob = await canvas.convertToBlob();
    await ffmpeg.writeFile('bg.png', await fetchFile(bgBlob));

    await ffmpeg.exec([
      '-loop', '1',
      '-i', 'bg.png',
      '-i', 'input.webm',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'stillimage',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-pix_fmt', 'yuv420p',
      '-shortest',
      'output.mp4',
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    await ffmpeg.deleteFile('input.webm');
    await ffmpeg.deleteFile('bg.png');
    await ffmpeg.deleteFile('output.mp4');

    return new Blob([typeof data === 'string' ? data : new Uint8Array(data)], { type: 'video/mp4' });
  } catch (err) {
    console.error('FFmpeg conversion failed:', err);
    return null;
  }
}

export function analyzeAudioFeatures(audioBuffer: AudioBuffer): {
  averageVolume: number;
  spectralCentroid: number;
  duration: number;
  zeroCrossingRate: number;
} {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  let sumSquares = 0;
  const len = channelData.length;
  for (let i = 0; i < len; i++) {
    sumSquares += channelData[i] * channelData[i];
  }
  const rms = Math.sqrt(sumSquares / len);

  let zeroCrossings = 0;
  for (let i = 1; i < len; i++) {
    if ((channelData[i] >= 0 && channelData[i - 1] < 0) ||
        (channelData[i] < 0 && channelData[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }

  return {
    averageVolume: rms,
    spectralCentroid: 0,
    duration: audioBuffer.duration,
    zeroCrossingRate: zeroCrossings / len,
  };
}
