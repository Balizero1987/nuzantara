import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Riri-a-Porter',
        short_name: 'Riri',
        description: 'Personal AI Stylist & Wardrobe Manager',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#9333ea',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
