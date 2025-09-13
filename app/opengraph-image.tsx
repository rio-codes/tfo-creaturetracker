import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'TFO.creaturetracker';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
    // The logo URL from the README/original metadata
    const logoUrl =
        'https://github.com/user-attachments/assets/ef9b624e-8c48-4721-980e-4531b21563f0';

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#3C2D63', // pompaca-purple
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <img
                    src={logoUrl}
                    alt="TFO.creaturetracker Logo"
                    style={{ width: 500, height: 500, objectFit: 'contain' }}
                />
            </div>
        ),
        { ...size }
    );
}
