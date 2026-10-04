import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import { analyzeImageWithGemini, ImageAnalysisRequest } from './geminiVisionService';
import { transcribeAudioFile } from './fileProcessingService';

// Configure ffmpeg path if ffmpeg-static provides binary path
if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

export interface VideoProcessingResult {
  audioTranscription: string;
  videoObservations: string[];
}

/**
 * Process uploaded video files (.mp4, .mov, .avi, .mkv)
 * 1. Extract audio & transcribe using Groq Whisper.
 * 2. Extract key frames & analyze using Gemini Vision.
 * 3. Merge both into structured observations.
 */
export async function processVideoFile(
  file: Express.Multer.File
): Promise<VideoProcessingResult> {
  const tempDir = path.join(
    os.tmpdir(),
    `femcare_vid_${Date.now()}_${Math.random().toString(36).substring(7)}`
  );

  await fs.mkdir(tempDir, { recursive: true });

  const tempVideoPath = path.join(tempDir, file.originalname);
  const tempAudioPath = path.join(tempDir, 'extracted_audio.mp3');

  try {
    const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null);
    if (!buffer) {
      throw new Error('Video buffer is unreadable');
    }

    await fs.writeFile(tempVideoPath, buffer);
    console.log(`🎬 [Video Processor] Saved ${file.originalname} to temporary path: ${tempVideoPath}`);

    // Step 1: Extract Audio using ffmpeg
    const audioExtracted = await new Promise<boolean>((resolve) => {
      ffmpeg(tempVideoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .output(tempAudioPath)
        .on('end', () => {
          console.log(`🎵 [Video Processor] Extracted audio track to ${tempAudioPath}`);
          resolve(true);
        })
        .on('error', (err) => {
          console.warn(`⚠️ [Video Processor] Could not extract audio track:`, err?.message || err);
          resolve(false);
        })
        .run();
    });

    let audioTranscription = '';
    if (audioExtracted && fsSync.existsSync(tempAudioPath)) {
      const audioBuffer = await fs.readFile(tempAudioPath);
      const audioMulterFile: Express.Multer.File = {
        fieldname: 'files',
        originalname: `${file.originalname}_audio.mp3`,
        encoding: '7bit',
        mimetype: 'audio/mp3',
        size: audioBuffer.length,
        buffer: audioBuffer,
        destination: tempDir,
        filename: 'extracted_audio.mp3',
        path: tempAudioPath,
        stream: null as any,
      };

      audioTranscription = await transcribeAudioFile(audioMulterFile);
    } else {
      audioTranscription = "No speech or audio track was detected in this video.";
    }

    // Step 2: Extract 3 keyframes using ffmpeg
    const framesFolder = path.join(tempDir, 'frames');
    await fs.mkdir(framesFolder, { recursive: true });

    const keyframesExtracted = await new Promise<boolean>((resolve) => {
      ffmpeg(tempVideoPath)
        .screenshots({
          count: 3,
          folder: framesFolder,
          filename: 'frame-%i.jpg',
          size: '640x?',
        })
        .on('end', () => {
          console.log(`📷 [Video Processor] Extracted keyframes to ${framesFolder}`);
          resolve(true);
        })
        .on('error', (err) => {
          console.warn(`⚠️ [Video Processor] Keyframe extraction notice:`, err?.message || err);
          resolve(false);
        })
    });

    const videoObservations: string[] = [];

    if (keyframesExtracted && fsSync.existsSync(framesFolder)) {
      const frameFiles = await fs.readdir(framesFolder);
      const jpgFrames = frameFiles.filter((f) => f.endsWith('.jpg') || f.endsWith('.jpeg'));

      for (let i = 0; i < jpgFrames.length; i++) {
        const framePath = path.join(framesFolder, jpgFrames[i]);
        const frameBuffer = await fs.readFile(framePath);
        const req: ImageAnalysisRequest = {
          filename: `${file.originalname}_frame_${i + 1}.jpg`,
          mimeType: 'image/jpeg',
          buffer: frameBuffer,
        };

        const frameObs = await analyzeImageWithGemini(req);
        if (frameObs.length > 0 && !frameObs[0].includes('could not be analyzed')) {
          videoObservations.push(`Frame #${i + 1} Visual Findings: ${frameObs.join('; ')}`);
        }
      }
    }

    if (videoObservations.length === 0) {
      videoObservations.push("No clear distinct medical visuals observed in video keyframes.");
    }

    return {
      audioTranscription,
      videoObservations,
    };
  } catch (err: any) {
    console.error(`❌ [Video Processor Error] Processing ${file.originalname} failed:`, err?.message || err);
    return {
      audioTranscription: "Could not extract speech from uploaded video.",
      videoObservations: ["The uploaded video frames could not be analyzed."],
    };
  } finally {
    // Cleanup temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanErr) {
      // Ignore cleanup error
    }
  }
}
