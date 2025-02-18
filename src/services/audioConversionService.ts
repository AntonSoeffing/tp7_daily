import { App, TFile } from 'obsidian';
import { join } from 'path';
import lamejs from '@breezystack/lamejs';

interface ConversionResult {
    vaultFile: TFile;
    transcriptionFile: File;
}

const TARGET_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const MIN_BITRATE = 32; // Minimum acceptable bitrate (kbps)
const MAX_BITRATE = 320; // Maximum MP3 bitrate (kbps)

function calculateBitrate(durationSeconds: number, targetSizeBytes: number): number {
    const targetBitsPerSecond = (targetSizeBytes * 8 * 0.9) / durationSeconds;
    let bitrate = Math.floor(targetBitsPerSecond / 1000);
    const validBitrates = [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
    bitrate = validBitrates.reduce((prev, curr) => 
        Math.abs(curr - bitrate) < Math.abs(prev - bitrate) ? curr : prev
    );
    return Math.max(MIN_BITRATE, Math.min(bitrate, MAX_BITRATE));
}

async function getAudioDuration(audioContext: AudioContext, arrayBuffer: ArrayBuffer): Promise<number> {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    return audioBuffer.duration;
}

export async function convertAudioFile(
    app: App,
    inputFile: File,
    recordingsFolder: string
): Promise<ConversionResult> {
    console.log(`Starting audio conversion for file: ${inputFile.name}`);

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    try {
        const arrayBuffer = await inputFile.arrayBuffer();
        const duration = await getAudioDuration(audioContext, arrayBuffer);
        console.log(`Audio duration: ${duration} seconds`);
        const bitrate = calculateBitrate(duration, TARGET_SIZE_BYTES);
        console.log(`Calculated bitrate: ${bitrate}kbps`);
        
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const mp3Data = await convertToMp3(audioBuffer, bitrate);
        
        const outputFileName = inputFile.name.replace(/\.[^.]+$/, '.mp3');
        const outputPath = join(recordingsFolder, outputFileName);
        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        await app.vault.createBinary(outputPath, await blob.arrayBuffer());
        
        const vaultFile = app.vault.getAbstractFileByPath(outputPath) as TFile;
        const transcriptionFile = new File([blob], outputFileName, { type: 'audio/mp3' });
        
        return { vaultFile, transcriptionFile };
    } finally {
        audioContext.close();
    }
}

function convertToMp3(audioBuffer: AudioBuffer, bitrate: number): Int8Array[] {
    const channels = 1; // Force mono for compatibility with whisper
    const sampleRate = audioBuffer.sampleRate;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
    
    // Convert to mono and Int16Array
    const samples = new Int16Array(audioBuffer.length);
    const channelData = audioBuffer.getChannelData(0);
    
    // If stereo, mix down to mono
    if (audioBuffer.numberOfChannels === 2) {
        const channelData2 = audioBuffer.getChannelData(1);
        for (let i = 0; i < audioBuffer.length; i++) {
            const mono = (channelData[i] + channelData2[i]) / 2;
            const sample = Math.max(-1, Math.min(1, mono));
            samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
    } else {
        for (let i = 0; i < audioBuffer.length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
    }

    // Encode in chunks
    const mp3Data = [];
    const sampleBlockSize = 1152; // Must be multiple of 576 for lamejs

    for (let i = 0; i < samples.length; i += sampleBlockSize) {
        const sampleChunk = samples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(new Int8Array(mp3buf));
        }
    }

    // Get the last chunk
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
    }

    return mp3Data;
}
