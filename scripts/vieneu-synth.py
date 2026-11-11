#!/usr/bin/env python3
"""VieNeu-TTS bridge for scripts/tts.mjs: python vieneu-synth.py <text-file> <voice> <out.wav>.

Run it with the VieNeu venv interpreter (VIENEU_DIR/.venv/bin/python). CPU/ONNX backend,
48 kHz mono wav; the SDK splits long text into sentence chunks by itself.
"""
import sys

from vieneu import Vieneu

text_path, voice, out_path = sys.argv[1:4]
text = open(text_path, encoding="utf-8").read().strip()
tts = Vieneu(backend="onnx")
available = {voice_id for _, voice_id in tts.list_preset_voices()}
if voice not in available:
    sys.exit(f"Unknown VieNeu voice '{voice}'. Available: {', '.join(sorted(available))}")
tts.save(tts.infer(text, voice=voice), out_path)
