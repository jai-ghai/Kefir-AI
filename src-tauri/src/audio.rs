use anyhow::Result;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};

// ── Microphone recording via cpal ────────────────────────────────────────────

pub fn start_mic_recording(
    output_path: PathBuf,
    stop: Arc<AtomicBool>,
) -> Result<std::thread::JoinHandle<Result<()>>> {
    use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

    let handle = std::thread::spawn(move || -> Result<()> {
        let host   = cpal::default_host();
        let device = host
            .default_input_device()
            .ok_or_else(|| anyhow::anyhow!("No microphone found"))?;
        let config = device.default_input_config()?;

        let spec = hound::WavSpec {
            channels:        config.channels(),
            sample_rate:     config.sample_rate().0,
            bits_per_sample: 16,
            sample_format:   hound::SampleFormat::Int,
        };
        let writer = Arc::new(Mutex::new(Some(hound::WavWriter::create(&output_path, spec)?)));
        let w2     = Arc::clone(&writer);

        let stream = match config.sample_format() {
            cpal::SampleFormat::I16 => device.build_input_stream(
                &config.into(),
                move |data: &[i16], _| {
                    if let Ok(mut g) = w2.lock() {
                        if let Some(w) = g.as_mut() {
                            for &s in data { let _ = w.write_sample(s); }
                        }
                    }
                },
                |e| eprintln!("Mic err: {e}"),
                None,
            )?,
            cpal::SampleFormat::F32 => device.build_input_stream(
                &config.into(),
                move |data: &[f32], _| {
                    if let Ok(mut g) = w2.lock() {
                        if let Some(w) = g.as_mut() {
                            for &s in data {
                                let s16 = (s * i16::MAX as f32)
                                    .clamp(i16::MIN as f32, i16::MAX as f32) as i16;
                                let _ = w.write_sample(s16);
                            }
                        }
                    }
                },
                |e| eprintln!("Mic err: {e}"),
                None,
            )?,
            fmt => return Err(anyhow::anyhow!("Unsupported sample format: {fmt:?}")),
        };

        stream.play()?;

        while !stop.load(Ordering::Relaxed) {
            std::thread::sleep(std::time::Duration::from_millis(100));
        }

        drop(stream);
        if let Ok(mut g) = writer.lock() {
            if let Some(w) = g.take() { w.finalize()?; }
        }
        Ok(())
    });

    Ok(handle)
}

// ── Windows WASAPI loopback ──────────────────────────────────────────────────

#[cfg(windows)]
pub fn start_loopback_recording(
    output_path: PathBuf,
    stop: Arc<AtomicBool>,
) -> Result<std::thread::JoinHandle<Result<()>>> {
    let handle = std::thread::spawn(move || -> Result<()> {
        unsafe { wasapi_capture(output_path, stop) }
    });
    Ok(handle)
}

#[cfg(windows)]
unsafe fn wasapi_capture(output_path: PathBuf, stop: Arc<AtomicBool>) -> Result<()> {
    use windows::{
        Win32::Media::Audio::*,
        Win32::System::Com::*,
    };

    // S_FALSE means COM already initialized on this thread — that's fine.
    let _ = CoInitializeEx(None, COINIT_MULTITHREADED);

    let enumerator: IMMDeviceEnumerator =
        CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;

    // Capture the *render* (output) endpoint in loopback mode.
    let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole)?;
    let client: IAudioClient = device.Activate(CLSCTX_ALL, None)?;

    let fmt_ptr = client.GetMixFormat()?;
    let fmt     = &*fmt_ptr;
    let channels    = fmt.nChannels;
    let sample_rate = fmt.nSamplesPerSec;

    // AUDCLNT_STREAMFLAGS_LOOPBACK = 0x00020000
    client.Initialize(
        AUDCLNT_SHAREMODE_SHARED,
        0x00020000u32,   // AUDCLNT_STREAMFLAGS_LOOPBACK
        10_000_000i64,   // 1-second buffer in 100ns units
        0,
        fmt_ptr,
        None,
    )?;

    CoTaskMemFree(Some(fmt_ptr as *const _ as *const std::ffi::c_void));

    let capture: IAudioCaptureClient = client.GetService()?;

    let spec = hound::WavSpec {
        channels,
        sample_rate,
        bits_per_sample: 16,
        sample_format:   hound::SampleFormat::Int,
    };
    let mut writer = hound::WavWriter::create(&output_path, spec)?;

    client.Start()?;

    while !stop.load(Ordering::Relaxed) {
        std::thread::sleep(std::time::Duration::from_millis(10));

        let packet_size = match capture.GetNextPacketSize() {
            Ok(n) => n,
            Err(_) => break,
        };
        if packet_size == 0 { continue; }

        let mut data: *mut u8 = std::ptr::null_mut();
        let mut frames: u32  = 0;
        let mut flags: u32   = 0;

        if capture.GetBuffer(&mut data, &mut frames, &mut flags, None, None).is_ok() {
            // AUDCLNT_BUFFERFLAGS_SILENT = 2 — skip silent frames
            if flags & 2 == 0 && frames > 0 {
                let n_samples = (frames as usize) * (channels as usize);
                let float_slice = std::slice::from_raw_parts(data as *const f32, n_samples);
                for &s in float_slice {
                    let s16 = (s * i16::MAX as f32)
                        .clamp(i16::MIN as f32, i16::MAX as f32) as i16;
                    writer.write_sample(s16)?;
                }
            }
            capture.ReleaseBuffer(frames)?;
        }
    }

    client.Stop()?;
    writer.finalize()?;
    CoUninitialize();
    Ok(())
}

// ── Non-Windows stub ─────────────────────────────────────────────────────────

#[cfg(not(windows))]
pub fn start_loopback_recording(
    output_path: PathBuf,
    stop: Arc<AtomicBool>,
) -> Result<std::thread::JoinHandle<Result<()>>> {
    // macOS: use ScreenCaptureKit (future implementation)
    // For now, capture the default input as a fallback.
    eprintln!("Loopback capture is Windows-only in this build. Falling back to mic.");
    start_mic_recording(output_path, stop)
}
