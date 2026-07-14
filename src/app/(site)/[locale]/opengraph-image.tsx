import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'MJ Barbershop — Premium Barbershop in Dubai';

/** Social share card: ink background, brass ruled lines, serif wordmark. */
export default function OpengraphImage({ params }: { params: { locale: string } }) {
  const isAr = params.locale === 'ar';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          color: '#f5f3ef',
          fontFamily: 'Georgia, serif'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 36,
            right: 36,
            bottom: 36,
            border: '1px solid rgba(245,243,239,0.18)',
            display: 'flex'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          <div style={{ width: 90, height: 1, backgroundColor: '#c9a86a', display: 'flex' }} />
          <div style={{ fontSize: 30, letterSpacing: 14, color: '#c9a86a', display: 'flex' }}>MJ</div>
          <div style={{ width: 90, height: 1, backgroundColor: '#c9a86a', display: 'flex' }} />
        </div>
        <div style={{ fontSize: 84, marginTop: 28, letterSpacing: 6, display: 'flex' }}>BARBERSHOP</div>
        <div
          style={{
            fontSize: 26,
            marginTop: 30,
            color: 'rgba(245,243,239,0.65)',
            letterSpacing: isAr ? 1 : 6,
            display: 'flex'
          }}
        >
          {isAr ? 'صالون حلاقة فاخر · دبي' : 'PREMIUM GROOMING · DUBAI'}
        </div>
      </div>
    ),
    size
  );
}
