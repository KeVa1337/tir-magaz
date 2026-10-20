/**
 * Нейтральні технічні ілюстрації деталей за типом (замість фото, поки їх немає в каталозі).
 * Ключ — slug категорії. Лінії беруть колір тексту, акценти — бурштиновий токен.
 */
import { cn } from "@/lib/utils";

const A = "var(--primary)";

type Art = () => React.ReactNode;

const filter = (w: number, h: number, ribs: number): Art => function FilterArt() {
  const x = 120 - w / 2, y = 90 - h / 2;
  return (
    <>
      <rect x={x} y={y + 10} width={w} height={h - 10} rx={10} />
      <rect x={x + 6} y={y} width={w - 12} height={16} rx={4} fill={A} stroke="none" opacity={0.9} />
      {Array.from({ length: ribs }, (_, i) => {
        const lx = x + 12 + (i * (w - 24)) / (ribs - 1);
        return <line key={i} x1={lx} y1={y + 32} x2={lx} y2={y + h - 14} opacity={0.45} />;
      })}
      <line x1={x} y1={y + h - 6} x2={x + w} y2={y + h - 6} />
    </>
  );
};

const ART: Record<string, Art> = {
  "filtry-olyvni": filter(84, 112, 7),
  "filtry-palyvni": filter(60, 120, 5),
  "filtry-povitriani": () => (
    <>
      <ellipse cx={120} cy={50} rx={70} ry={18} />
      <path d="M50 50 V130 A70 18 0 0 0 190 130 V50" />
      <ellipse cx={120} cy={50} rx={36} ry={9} fill={A} stroke="none" opacity={0.9} />
      {Array.from({ length: 13 }, (_, i) => <line key={i} x1={56 + i * 10.6} y1={66} x2={56 + i * 10.6} y2={140} opacity={0.4} />)}
    </>
  ),
  "remeni-ta-roliky": () => (
    <>
      <path d="M60 60 A30 30 0 0 0 60 120 H180 A30 30 0 0 0 180 60 Z" />
      <path d="M60 70 A20 20 0 0 0 60 110 H180 A20 20 0 0 0 180 70 Z" opacity={0.5} />
      <circle cx={60} cy={90} r={14} fill={A} stroke="none" />
      <circle cx={180} cy={90} r={14} fill={A} stroke="none" opacity={0.7} />
    </>
  ),
  "pompy-vodiani": () => (
    <>
      <circle cx={120} cy={90} r={52} />
      <circle cx={120} cy={90} r={16} fill={A} stroke="none" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <path key={i} d={`M${120 + 18 * Math.cos(a)} ${90 + 18 * Math.sin(a)} Q${120 + 40 * Math.cos(a + 0.5)} ${90 + 40 * Math.sin(a + 0.5)} ${120 + 46 * Math.cos(a + 0.2)} ${90 + 46 * Math.sin(a + 0.2)}`} opacity={0.7} />;
      })}
      <rect x={168} y={80} width={34} height={20} rx={4} />
    </>
  ),
  "kolodky-halmivni": () => (
    <>
      <path d="M40 60 Q120 30 200 60 L196 84 Q120 58 44 84 Z" />
      <path d="M48 86 Q120 62 192 86 L190 96 Q120 74 50 96 Z" fill={A} stroke="none" opacity={0.85} />
      <path d="M40 104 Q120 74 200 104 L196 128 Q120 102 44 128 Z" />
      <path d="M48 130 Q120 106 192 130 L190 140 Q120 118 50 140 Z" fill={A} stroke="none" opacity={0.6} />
    </>
  ),
  "dysky-halmivni": () => (
    <>
      <circle cx={120} cy={90} r={66} />
      <circle cx={120} cy={90} r={56} opacity={0.4} />
      <circle cx={120} cy={90} r={26} fill={A} stroke="none" opacity={0.9} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3;
        return <circle key={i} cx={120 + 15 * Math.cos(a)} cy={90 + 15 * Math.sin(a)} r={3} fill="currentColor" stroke="none" />;
      })}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI) / 8;
        return <circle key={`h${i}`} cx={120 + 42 * Math.cos(a)} cy={90 + 42 * Math.sin(a)} r={2.5} opacity={0.6} />;
      })}
    </>
  ),
  suporty: () => (
    <>
      <path d="M150 30 A70 70 0 0 1 150 150" opacity={0.35} />
      <path d="M70 40 H160 Q184 40 184 64 V116 Q184 140 160 140 H70 Q56 140 56 126 V54 Q56 40 70 40 Z" />
      <rect x={76} y={56} width={60} height={68} rx={8} fill={A} stroke="none" opacity={0.85} />
      <circle cx={160} cy={66} r={7} /><circle cx={160} cy={114} r={7} />
    </>
  ),
  "halmivni-krany": () => (
    <>
      <rect x={70} y={50} width={100} height={80} rx={10} />
      <rect x={96} y={24} width={48} height={28} rx={6} fill={A} stroke="none" />
      {[90, 120, 150].map((x) => <rect key={x} x={x - 8} y={130} width={16} height={22} rx={3} />)}
      <circle cx={52} cy={90} r={10} /><line x1={62} y1={90} x2={70} y2={90} />
    </>
  ),
  pnevmokrany: () => (
    <>
      <rect x={76} y={60} width={88} height={60} rx={10} />
      <path d="M164 90 H206" /><circle cx={206} cy={90} r={6} fill={A} stroke="none" />
      <path d="M120 60 V34 H170" /><rect x={100} y={74} width={40} height={32} rx={6} fill={A} stroke="none" opacity={0.6} />
      <line x1={88} y1={120} x2={88} y2={146} /><line x1={152} y1={120} x2={152} y2={146} />
    </>
  ),
  osushuvachi: () => (
    <>
      <path d="M78 46 Q78 30 94 30 H146 Q162 30 162 46 V140 H78 Z" />
      <rect x={70} y={136} width={100} height={18} rx={4} fill={A} stroke="none" />
      <circle cx={120} cy={144} r={5} fill="currentColor" stroke="none" />
      {[60, 80, 100, 120].map((y) => <line key={y} x1={86} y1={y} x2={154} y2={y} opacity={0.3} />)}
    </>
  ),
  pnevmopodushky: () => (
    <>
      <rect x={66} y={22} width={108} height={14} rx={4} fill={A} stroke="none" />
      <path d="M74 36 Q50 60 74 82 Q50 104 74 128 H166 Q190 104 166 82 Q190 60 166 36 Z" />
      <path d="M90 128 V150 H150 V128" />
      <line x1={78} y1={82} x2={162} y2={82} opacity={0.4} />
    </>
  ),
  amortyzatory: () => (
    <>
      <circle cx={120} cy={22} r={10} /><circle cx={120} cy={158} r={10} />
      <rect x={104} y={32} width={32} height={58} rx={6} fill={A} stroke="none" opacity={0.85} />
      <line x1={120} y1={90} x2={120} y2={102} />
      <rect x={98} y={100} width={44} height={50} rx={6} />
    </>
  ),
  "amortyzatory-kabiny": () => (
    <>
      <circle cx={120} cy={30} r={9} /><circle cx={120} cy={150} r={9} />
      <rect x={108} y={39} width={24} height={46} rx={5} fill={A} stroke="none" opacity={0.85} />
      <line x1={120} y1={85} x2={120} y2={96} />
      <rect x={102} y={96} width={36} height={45} rx={5} />
      <path d="M86 70 Q120 58 154 70" opacity={0.4} />
    </>
  ),
  resory: () => (
    <>
      <path d="M30 70 Q120 120 210 70" /><path d="M44 82 Q120 124 196 82" opacity={0.7} /><path d="M62 94 Q120 126 178 94" opacity={0.5} />
      <circle cx={30} cy={66} r={9} /><circle cx={210} cy={66} r={9} />
      <rect x={104} y={104} width={32} height={24} rx={3} fill={A} stroke="none" />
    </>
  ),
  stabilizatory: () => (
    <>
      <line x1={60} y1={124} x2={180} y2={56} strokeWidth={10} opacity={0.85} />
      <circle cx={56} cy={126} r={18} /><circle cx={56} cy={126} r={8} fill={A} stroke="none" />
      <circle cx={184} cy={54} r={18} /><circle cx={184} cy={54} r={8} fill={A} stroke="none" />
    </>
  ),
  dzerkala: () => (
    <>
      <rect x={84} y={20} width={72} height={124} rx={12} />
      <rect x={92} y={28} width={56} height={108} rx={8} fill={A} stroke="none" opacity={0.25} />
      <path d="M156 70 H196 V160" /><line x1={100} y1={44} x2={118} y2={36} opacity={0.6} />
    </>
  ),
  fary: () => (
    <>
      <path d="M40 54 H200 Q208 54 206 64 L196 128 Q194 136 186 136 H54 Q46 136 44 128 L34 64 Q32 54 40 54 Z" />
      <circle cx={90} cy={95} r={24} fill={A} stroke="none" opacity={0.85} /><circle cx={150} cy={95} r={20} />
      <line x1={180} y1={80} x2={190} y2={80} opacity={0.5} /><line x1={178} y1={110} x2={188} y2={110} opacity={0.5} />
    </>
  ),
  zcheplennia: () => (
    <>
      <circle cx={120} cy={90} r={66} />
      <circle cx={120} cy={90} r={46} fill={A} stroke="none" opacity={0.25} />
      <circle cx={120} cy={90} r={20} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <line key={i} x1={120 + 22 * Math.cos(a)} y1={90 + 22 * Math.sin(a)} x2={120 + 44 * Math.cos(a)} y2={90 + 44 * Math.sin(a)} opacity={0.7} />;
      })}
    </>
  ),
  "heneratory-startery": () => (
    <>
      <rect x={60} y={50} width={110} height={80} rx={36} />
      {Array.from({ length: 6 }, (_, i) => <line key={i} x1={82 + i * 14} y1={58} x2={82 + i * 14} y2={122} opacity={0.4} />)}
      <rect x={170} y={78} width={22} height={24} rx={3} /><circle cx={204} cy={90} r={12} fill={A} stroke="none" />
      <circle cx={60} cy={90} r={10} fill={A} stroke="none" opacity={0.6} />
    </>
  ),
  datchyky: () => (
    <>
      <rect x={60} y={74} width={50} height={32} rx={6} fill={A} stroke="none" />
      <path d="M110 90 H140" /><path d="M140 90 C 180 90, 160 40, 200 40" /><circle cx={200} cy={40} r={6} />
      <rect x={30} y={82} width={30} height={16} rx={3} />
    </>
  ),
  "sidelni-prystroi": () => (
    <>
      <path d="M40 80 Q40 40 120 40 Q200 40 200 80 L180 110 H60 Z" />
      <path d="M120 40 V86" strokeWidth={10} opacity={0.3} /><path d="M100 86 L120 110 L140 86" fill={A} stroke="none" />
      <rect x={60} y={110} width={120} height={18} rx={4} />
    </>
  ),
  "osi-bpw": hub,
  "osi-saf": hub,
  "osi-ror": hub,
  "motorni-olyvy": canister,
  "okholodzhuiuchi-ridyny": canister,
};

function hub() {
  return (
    <>
      <circle cx={120} cy={90} r={64} />
      <circle cx={120} cy={90} r={42} opacity={0.5} />
      <circle cx={120} cy={90} r={22} fill={A} stroke="none" opacity={0.9} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5;
        return <circle key={i} cx={120 + 53 * Math.cos(a)} cy={90 + 53 * Math.sin(a)} r={4} fill="currentColor" stroke="none" opacity={0.7} />;
      })}
    </>
  );
}

function canister() {
  return (
    <>
      <path d="M70 46 H150 L170 66 V150 Q170 158 162 158 H78 Q70 158 70 150 Z" />
      <rect x={146} y={28} width={26} height={18} rx={4} fill={A} stroke="none" />
      <path d="M92 46 V34 H128 V46" />
      <rect x={84} y={84} width={70} height={46} rx={6} fill={A} stroke="none" opacity={0.3} />
      <line x1={94} y1={100} x2={144} y2={100} /><line x1={94} y1={114} x2={130} y2={114} opacity={0.6} />
    </>
  );
}

export function hasPartArt(kind?: string | null) {
  return !!kind && kind in ART;
}

export function PartArt({ kind, className, title }: { kind: string; className?: string; title?: string }) {
  const draw = ART[kind];
  if (!draw) return null;
  return (
    <svg viewBox="0 0 240 180" className={cn("text-muted-foreground", className)} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={title}>
      {draw()}
    </svg>
  );
}
