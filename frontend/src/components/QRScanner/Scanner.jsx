import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// Static ID — never changes, so html5-qrcode can always find the element
const SCANNER_ELEMENT_ID = 'html5-qrcode-element';

// Html5Qrcode internal scan states (numeric)
const STATE = { NOT_STARTED: 0, SCANNING: 1, PAUSED: 2 };

function QRScanner({ onScan, onError }) {
    const [phase, setPhase] = useState('idle'); // 'idle' | 'starting' | 'scanning' | 'stopping'
    const [hasPermission, setHasPermission] = useState(null);
    const [error, setError] = useState(null);

    const instanceRef  = useRef(null);  // Html5Qrcode instance
    const isMountedRef = useRef(true);
    const isStoppingRef = useRef(false);

    // ── Force-kill all camera tracks (hardware fallback) ─────────────────────
    const killTracks = useCallback(() => {
        // Kill tracks on any video element the library may have created
        const el = document.getElementById(SCANNER_ELEMENT_ID);
        if (el) {
            el.querySelectorAll('video').forEach((v) => {
                try {
                    v.srcObject?.getTracks?.().forEach((t) => t.stop());
                    v.srcObject = null;
                } catch (_) {}
            });
        }
    }, []);

    // ── Stop scanner ──────────────────────────────────────────────────────────
    const stopScanner = useCallback(async () => {
        if (isStoppingRef.current) return;
        isStoppingRef.current = true;

        const inst = instanceRef.current;
        instanceRef.current = null; // Clear immediately — prevents re-entrant calls

        if (inst) {
            try {
                const state = inst.getState?.();
                if (state === STATE.SCANNING || state === STATE.PAUSED) {
                    await inst.stop().catch(() => {});
                }
            } catch (_) {}
            // clear() removes the library's injected DOM from the element
            try { inst.clear(); } catch (_) {}
        }

        // Guarantee camera LED goes off
        killTracks();

        if (isMountedRef.current) {
            setPhase('idle');
        }

        isStoppingRef.current = false;
    }, [killTracks]);

    // ── Unmount cleanup ───────────────────────────────────────────────────────
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            stopScanner(); // fire-and-forget on unmount
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Start scanner ─────────────────────────────────────────────────────────
    const startScanner = useCallback(async () => {
        if (phase === 'starting' || phase === 'scanning') return;
        if (instanceRef.current) await stopScanner();

        setError(null);
        setPhase('starting');

        const inst = new Html5Qrcode(SCANNER_ELEMENT_ID);
        // Store ref IMMEDIATELY so cleanup can always find it even during start()
        instanceRef.current = inst;

        try {
            await inst.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 240, height: 240 },
                    aspectRatio: 1.0,
                    videoConstraints: {
                        facingMode: 'environment',
                        width:  { min: 480, ideal: 720, max: 1280 },
                        height: { min: 480, ideal: 720, max: 1280 },
                    },
                },
                async (decodedText) => {
                    console.log('QR scanned:', decodedText);
                    await stopScanner();
                    onScan?.(decodedText);
                },
                () => { /* per-frame decode failures — intentionally silent */ },
            );

            // If the component unmounted while start() was awaiting, stop now
            if (!isMountedRef.current) {
                stopScanner();
                return;
            }

            setPhase('scanning');
            setHasPermission(true);
        } catch (err) {
            // Start failed — clear ref and release any partial camera grab
            instanceRef.current = null;
            killTracks();

            const msg = err?.toString?.() ?? String(err);
            const denied =
                err?.name === 'NotAllowedError' ||
                msg.includes('Permission denied') ||
                msg.includes('NotAllowedError');

            if (denied) {
                setHasPermission(false);
            } else {
                console.error('Scanner start failed:', err);
                setError(err?.message || 'Failed to access camera');
                setHasPermission(false);
                onError?.(err);
            }

            if (isMountedRef.current) setPhase('idle');
        }
    }, [phase, stopScanner, killTracks, onScan, onError]);

    // ── Toggle ────────────────────────────────────────────────────────────────
    const toggle = () => {
        if (phase === 'scanning' || phase === 'starting') {
            stopScanner();
        } else {
            startScanner();
        }
    };

    const isActive   = phase === 'scanning' || phase === 'starting';
    const isLoading  = phase === 'starting';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="qr-scanner-container">
            <div style={{ position: 'relative', width: '100%' }}>

                {/*
                 * ⚠️ IMPORTANT: This div is 100% owned by html5-qrcode.
                 * React MUST NOT render any children here — the library
                 * directly injects/removes DOM nodes inside it.
                 * Placeholder states go in the sibling overlay below.
                 */}
                <div
                    id={SCANNER_ELEMENT_ID}
                    style={{
                        width: '100%',
                        minHeight: '300px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#0a0a12',
                    }}
                />

                {/* Overlay — React's zone. Shown only when library is NOT active. */}
                {phase !== 'scanning' && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        background: 'rgba(10,10,18,0.97)',
                        pointerEvents: 'none',
                    }}>
                        {isLoading ? (
                            <>
                                <div style={{
                                    width: 36, height: 36,
                                    border: '3px solid rgba(99,102,241,0.25)',
                                    borderTopColor: '#6366f1',
                                    borderRadius: '50%',
                                    animation: 'qr-spin 0.75s linear infinite',
                                    marginBottom: 12,
                                }} />
                                <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Opening camera…</p>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '3rem', marginBottom: 10 }}>📷</div>
                                <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', maxWidth: 200 }}>
                                    Press <strong style={{ color: '#94a3b8' }}>Start Scanner</strong> to activate your camera
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div style={{
                    marginTop: 12, padding: '10px 14px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171', borderRadius: 10, fontSize: '0.85rem',
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Permission denied */}
            {hasPermission === false && !error && (
                <div style={{
                    marginTop: 12, padding: 14,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, textAlign: 'center',
                }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 4 }}>
                        Camera permission was denied.
                    </p>
                    <p style={{ color: '#475569', fontSize: '0.75rem' }}>
                        Allow camera access in your browser and try again.
                    </p>
                </div>
            )}

            {/* Toggle button */}
            <div style={{ marginTop: 18, textAlign: 'center' }}>
                <button
                    className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
                    onClick={toggle}
                    disabled={isLoading}
                    style={{ minWidth: 160 }}
                >
                    {phase === 'scanning'
                        ? '⏹ Stop Scanning'
                        : phase === 'starting'
                            ? 'Opening camera…'
                            : '📷 Start Scanner'}
                </button>
            </div>

            <p style={{ marginTop: 14, textAlign: 'center', color: '#334155', fontSize: '0.75rem' }}>
                Position the QR code within the frame to scan
            </p>

            <style>{`
                @keyframes qr-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default QRScanner;
