export default function MaintenancePage() {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>UniMath — Sedang Maintenance</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --bg: #050A14;
            --surface: rgba(255,255,255,0.04);
            --border: rgba(255,255,255,0.08);
            --cyan: #00E5FF;
            --cyan-dim: rgba(0,229,255,0.15);
            --cyan-glow: rgba(0,229,255,0.4);
            --amber: #FFB800;
            --amber-dim: rgba(255,184,0,0.12);
            --text: #F0F4FF;
            --text-muted: rgba(240,244,255,0.5);
          }

          html, body {
            min-height: 100vh;
            background: var(--bg);
            font-family: 'Outfit', sans-serif;
            color: var(--text);
            overflow-x: hidden;
          }

          /* Animated grid background */
          body::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image:
              linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px);
            background-size: 60px 60px;
            z-index: 0;
            animation: gridShift 20s linear infinite;
          }
          @keyframes gridShift {
            0% { background-position: 0 0; }
            100% { background-position: 60px 60px; }
          }

          /* Radial glow effects */
          body::after {
            content: '';
            position: fixed;
            inset: 0;
            background:
              radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,229,255,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 80% 100%, rgba(255,184,0,0.06) 0%, transparent 60%);
            z-index: 0;
            pointer-events: none;
          }

          .page {
            position: relative;
            z-index: 1;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1.5rem;
          }

          /* Floating particles */
          .particles {
            position: fixed;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
          }
          .particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: var(--cyan);
            border-radius: 50%;
            opacity: 0;
            animation: floatUp var(--dur) ease-in infinite;
            animation-delay: var(--delay);
            left: var(--x);
            box-shadow: 0 0 4px var(--cyan);
          }
          @keyframes floatUp {
            0% { opacity: 0; transform: translateY(100vh) scale(0.5); }
            10% { opacity: 0.8; }
            90% { opacity: 0.4; }
            100% { opacity: 0; transform: translateY(-10vh) scale(1.2); }
          }

          /* Logo */
          .logo-wrap {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 3rem;
            animation: fadeSlideDown 0.8s ease both;
          }
          .logo-icon {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            background: linear-gradient(135deg, var(--cyan-dim), rgba(0,229,255,0.08));
            border: 1px solid rgba(0,229,255,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 0 20px var(--cyan-dim);
          }
          .logo-text {
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, #fff 0%, var(--cyan) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          /* Main card */
          .card {
            width: 100%;
            max-width: 540px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 28px;
            padding: 3rem 2.5rem;
            backdrop-filter: blur(24px);
            box-shadow:
              0 0 0 1px rgba(0,229,255,0.05),
              0 32px 64px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.06);
            text-align: center;
            animation: fadeSlideUp 0.8s ease both;
            animation-delay: 0.1s;
          }

          /* Animated icon */
          .icon-wrap {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            position: relative;
          }
          .icon-ring {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 2px solid var(--cyan);
            opacity: 0.3;
            animation: ringPulse 2.5s ease-in-out infinite;
          }
          .icon-ring:nth-child(2) {
            inset: -8px;
            opacity: 0.15;
            animation-delay: 0.5s;
          }
          .icon-ring:nth-child(3) {
            inset: -16px;
            opacity: 0.07;
            animation-delay: 1s;
          }
          @keyframes ringPulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.05); opacity: 0.5; }
          }
          .icon-core {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, var(--cyan-dim), rgba(0,229,255,0.05));
            border-radius: 50%;
            border: 1px solid rgba(0,229,255,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            animation: iconFloat 3s ease-in-out infinite;
            box-shadow: 0 0 30px var(--cyan-dim);
          }
          @keyframes iconFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }

          /* Status badge */
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--amber-dim);
            border: 1px solid rgba(255,184,0,0.25);
            color: var(--amber);
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 0.35rem 0.9rem;
            border-radius: 100px;
            margin-bottom: 1.5rem;
          }
          .badge-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--amber);
            animation: blink 1.2s ease-in-out infinite;
            box-shadow: 0 0 6px var(--amber);
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }

          h1 {
            font-size: clamp(1.75rem, 5vw, 2.25rem);
            font-weight: 800;
            letter-spacing: -0.03em;
            margin-bottom: 1rem;
            line-height: 1.15;
            background: linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.7) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .subtitle {
            font-size: 1rem;
            color: var(--text-muted);
            line-height: 1.7;
            margin-bottom: 2.5rem;
          }
          .subtitle strong {
            color: rgba(240,244,255,0.85);
            font-weight: 600;
          }

          /* Progress steps */
          .steps {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 2.5rem;
            text-align: left;
          }
          .step {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.75rem 1rem;
            background: rgba(255,255,255,0.025);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
            font-size: 0.875rem;
          }
          .step-icon {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            flex-shrink: 0;
          }
          .step.done .step-icon {
            background: rgba(0,229,255,0.12);
            border: 1px solid rgba(0,229,255,0.25);
          }
          .step.active .step-icon {
            background: rgba(255,184,0,0.12);
            border: 1px solid rgba(255,184,0,0.3);
            animation: stepPulse 1.5s ease-in-out infinite;
          }
          @keyframes stepPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,184,0,0); }
            50% { box-shadow: 0 0 0 4px rgba(255,184,0,0.1); }
          }
          .step.pending .step-icon {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            opacity: 0.5;
          }
          .step-label {
            flex: 1;
            color: var(--text-muted);
          }
          .step.done .step-label { color: rgba(240,244,255,0.7); }
          .step.active .step-label { color: var(--text); font-weight: 600; }

          /* Divider */
          .divider {
            height: 1px;
            background: var(--border);
            margin-bottom: 2rem;
          }

          /* Contact */
          .contact {
            font-size: 0.8rem;
            color: var(--text-muted);
          }
          .contact a {
            color: var(--cyan);
            text-decoration: none;
            font-weight: 600;
            transition: opacity 0.2s;
          }
          .contact a:hover { opacity: 0.75; }

          /* Scanline effect */
          .card::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--cyan), transparent);
            animation: scanline 4s ease-in-out infinite;
            border-radius: 28px 28px 0 0;
          }
          .card { position: relative; }
          @keyframes scanline {
            0% { opacity: 0; transform: translateY(0); }
            10% { opacity: 1; }
            90% { opacity: 0.3; }
            100% { opacity: 0; transform: translateY(480px); }
          }

          /* Animations */
          @keyframes fadeSlideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Footer */
          .footer {
            margin-top: 2rem;
            font-size: 0.75rem;
            color: rgba(240,244,255,0.2);
            animation: fadeSlideUp 0.8s ease both;
            animation-delay: 0.3s;
          }

          @media (max-width: 500px) {
            .card { padding: 2rem 1.5rem; border-radius: 20px; }
          }
        `}</style>
      </head>
      <body>
        {/* Floating particles */}
        <div className="particles" aria-hidden="true">
          {[
            { x: '10%', dur: '8s', delay: '0s' },
            { x: '20%', dur: '12s', delay: '2s' },
            { x: '35%', dur: '10s', delay: '4s' },
            { x: '50%', dur: '9s', delay: '1s' },
            { x: '65%', dur: '11s', delay: '3s' },
            { x: '80%', dur: '7s', delay: '5s' },
            { x: '90%', dur: '13s', delay: '0.5s' },
          ].map((p, i) => (
            <div
              key={i}
              className="particle"
              style={{ '--x': p.x, '--dur': p.dur, '--delay': p.delay } as React.CSSProperties}
            />
          ))}
        </div>

        <main className="page">
          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-icon">🏗️</div>
            <span className="logo-text">UniMath</span>
          </div>

          {/* Main card */}
          <div className="card">
            {/* Animated icon */}
            <div className="icon-wrap">
              <div className="icon-ring" />
              <div className="icon-ring" />
              <div className="icon-ring" />
              <div className="icon-core">⚙️</div>
            </div>

            {/* Status badge */}
            <div className="badge">
              <span className="badge-dot" />
              Sedang Maintenance
            </div>

            <h1>Platform Sedang<br />Diperbarui</h1>

            <p className="subtitle">
              Kami sedang melakukan <strong>perbaikan dan optimasi sistem</strong>{' '}
              berdasarkan hasil uji coba sebelumnya.{' '}
              Platform akan kembali lebih stabil dan cepat.
            </p>

            {/* Progress steps */}
            <div className="steps">
              <div className="step done">
                <div className="step-icon">✅</div>
                <span className="step-label">Analisis data uji coba selesai</span>
              </div>
              <div className="step active">
                <div className="step-icon">⚡</div>
                <span className="step-label">Optimasi performa database</span>
              </div>
              <div className="step pending">
                <div className="step-icon">🔒</div>
                <span className="step-label">Validasi keamanan data siswa</span>
              </div>
              <div className="step pending">
                <div className="step-icon">🚀</div>
                <span className="step-label">Platform kembali online</span>
              </div>
            </div>

            <div className="divider" />

            <p className="contact">
              Informasi lebih lanjut hubungi{' '}
              <a href="mailto:admin@unimath.app">admin UniMath</a>.<br />
              Data latihan kamu <strong style={{ color: 'rgba(240,244,255,0.7)' }}>aman dan tersimpan</strong> ✨
            </p>
          </div>

          <p className="footer">
            © 2026 UniMath · Platform Latihan Numerasi
          </p>
        </main>
      </body>
    </html>
  )
}
