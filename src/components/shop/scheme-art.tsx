/** Спрощені технічні креслення вузлів (без логотипів і копій заводських схем). */
const A = "var(--primary)";

function Brakes() {
  return (
    <>
      <rect x={40} y={232} width={190} height={56} rx={10} opacity={0.5} />
      <circle cx={400} cy={260} r={190} />
      <circle cx={400} cy={260} r={168} opacity={0.4} />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i * Math.PI) / 12;
        return <line key={i} x1={400 + 120 * Math.cos(a)} y1={260 + 120 * Math.sin(a)} x2={400 + 160 * Math.cos(a)} y2={260 + 160 * Math.sin(a)} opacity={0.35} />;
      })}
      <circle cx={400} cy={260} r={70} fill={A} stroke="none" opacity={0.18} />
      <circle cx={400} cy={260} r={70} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5;
        return <circle key={`b${i}`} cx={400 + 48 * Math.cos(a)} cy={260 + 48 * Math.sin(a)} r={7} />;
      })}
      <path d="M470 60 L610 100 Q640 110 630 140 L585 250 Q575 275 548 266 L420 222 Z" fill="var(--card)" />
      <path d="M470 60 L610 100 Q640 110 630 140 L585 250 Q575 275 548 266 L420 222 Z" />
      <path d="M478 48 L540 66 L520 128 L458 110 Z" fill={A} stroke="none" opacity={0.9} />
      <circle cx={590} cy={168} r={12} />
      <path d="M630 140 L700 160 L690 230 L612 214" opacity={0.7} />
      <path d="M330 330 L300 380 Q290 400 310 410 L330 420" />
      <rect x={322} y={318} width={30} height={22} rx={4} fill={A} stroke="none" />
      <path d="M690 230 C 720 300, 640 330, 690 360" opacity={0.6} strokeDasharray="8 8" />
      <rect x={640} y={350} width={110} height={80} rx={12} fill="var(--card)" />
      <rect x={640} y={350} width={110} height={80} rx={12} />
      <rect x={670} y={326} width={50} height={26} rx={6} fill={A} stroke="none" />
    </>
  );
}

function Suspension() {
  return (
    <>
      <rect x={40} y={60} width={720} height={44} rx={8} />
      <line x1={40} y1={82} x2={760} y2={82} opacity={0.3} />
      <rect x={60} y={380} width={680} height={40} rx={20} opacity={0.6} />
      <circle cx={250} cy={400} r={60} opacity={0.35} />
      <path d="M190 104 H310 V128 Q340 160 310 192 Q340 224 310 256 V290 H190 V256 Q160 224 190 192 Q160 160 190 128 Z" fill="var(--card)" />
      <path d="M190 104 H310 V128 Q340 160 310 192 Q340 224 310 256 V290 H190 V256 Q160 224 190 192 Q160 160 190 128 Z" />
      <rect x={196} y={104} width={108} height={18} fill={A} stroke="none" opacity={0.9} />
      <path d="M210 290 V380 M290 290 V380" />
      <circle cx={470} cy={120} r={12} /><circle cx={560} cy={360} r={12} />
      <line x1={478} y1={130} x2={552} y2={350} strokeWidth={22} opacity={0.15} />
      <path d="M470 120 L505 222" strokeWidth={14} stroke={A} />
      <path d="M505 222 L560 360" strokeWidth={22} />
      <rect x={640} y={104} width={80} height={56} rx={8} fill="var(--card)" />
      <rect x={640} y={104} width={80} height={56} rx={8} />
      <path d="M680 160 L700 300 L640 380" />
      <circle cx={680} cy={132} r={10} fill={A} stroke="none" />
      <path d="M330 330 L470 370" strokeWidth={10} opacity={0.8} />
      <circle cx={330} cy={330} r={14} /><circle cx={470} cy={370} r={14} />
      <path d="M60 104 V170 H130 V104" fill="var(--card)" />
      <rect x={66} y={112} width={58} height={60} rx={8} fill={A} stroke="none" opacity={0.85} />
    </>
  );
}

function Engine() {
  return (
    <>
      <path d="M180 120 H600 L640 170 V380 H220 L180 330 Z" />
      <path d="M220 160 H600 M220 200 H600" opacity={0.25} />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={240 + i * 60} y={90} width={44} height={36} rx={6} opacity={0.6} />)}
      <circle cx={90} cy={220} r={46} /><circle cx={90} cy={220} r={14} fill={A} stroke="none" />
      <circle cx={100} cy={360} r={40} /><circle cx={100} cy={80} r={42} />
      <rect x={60} y={50} width={80} height={60} rx={22} fill="var(--card)" />
      <rect x={60} y={50} width={80} height={60} rx={22} />
      <path d="M58 80 Q30 220 60 360 M142 80 Q170 220 140 360" strokeWidth={6} stroke={A} opacity={0.85} />
      <rect x={180} y={300} width={56} height={84} rx={10} fill="var(--card)" />
      <rect x={180} y={300} width={56} height={84} rx={10} />
      <rect x={180} y={300} width={56} height={14} rx={4} fill={A} stroke="none" />
      <rect x={290} y={300} width={44} height={84} rx={10} fill="var(--card)" />
      <rect x={290} y={300} width={44} height={84} rx={10} />
      <rect x={290} y={300} width={44} height={12} rx={4} fill={A} stroke="none" />
      <path d="M640 220 H690 V120" />
      <ellipse cx={690} cy={110} rx={70} ry={20} fill="var(--card)" />
      <path d="M620 110 V200 A70 20 0 0 0 760 200 V110" fill="var(--card)" />
      <path d="M620 110 V200 A70 20 0 0 0 760 200 V110" />
      <ellipse cx={690} cy={110} rx={70} ry={20} />
      <ellipse cx={690} cy={110} rx={30} ry={8} fill={A} stroke="none" />
    </>
  );
}

const DRAW: Record<string, () => React.ReactNode> = { "halma-perednoi-osi": Brakes, pnevmopidviska: Suspension, "to-dvyguna": Engine };

export function SchemeArt({ slug, className }: { slug: string; className?: string }) {
  const D = DRAW[slug];
  return (
    <svg viewBox="0 0 800 500" className={className} fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {D && <D />}
    </svg>
  );
}
