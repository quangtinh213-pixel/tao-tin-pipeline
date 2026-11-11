#!/usr/bin/env python3
"""Local Whisper STT transcription using faster-whisper.

Usage: uv run --python 3.11 --with faster-whisper python scripts/whisper-transcribe.py <audio_path> <output_json_path>
"""
import sys
import json
from faster_whisper import WhisperModel

def main():
    if len(sys.argv) < 3:
        print("Usage: python whisper-transcribe.py <audio_path> <output_json_path>")
        sys.exit(1)

    audio_path = sys.argv[1]
    output_path = sys.argv[2]

    # Use CPU with int8 quantization for fast, lightweight local execution on macOS
    model = WhisperModel("small", device="cpu", compute_type="int8")

    segments_generator, info = model.transcribe(
        audio_path,
        language="vi",
        word_timestamps=True,
        vad_filter=True,
    )

    segments_list = []
    words_list = []

    for seg in segments_generator:
        segments_list.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
        })
        if seg.words:
            for w in seg.words:
                words_list.append({
                    "word": w.word.strip(),
                    "start": round(w.start, 2),
                    "end": round(w.end, 2),
                })

    result = {
        "duration": round(info.duration, 2),
        "segments": segments_list,
        "words": words_list,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Transcribed {len(segments_list)} segments, {len(words_list)} words, duration {result['duration']}s -> {output_path}")

if __name__ == "__main__":
    main()
