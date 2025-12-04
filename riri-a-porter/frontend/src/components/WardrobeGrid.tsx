'use client';

export default function WardrobeGrid() {
    // Mock data
    const items = [
        { id: 1, image: 'https://placehold.co/300x400/pink/white?text=Dress', category: 'Dresses' },
        { id: 2, image: 'https://placehold.co/300x300/blue/white?text=Jeans', category: 'Bottoms' },
        { id: 3, image: 'https://placehold.co/300x500/black/white?text=Coat', category: 'Outerwear' },
        { id: 4, image: 'https://placehold.co/300x300/white/black?text=Top', category: 'Tops' },
        { id: 5, image: 'https://placehold.co/300x400/red/white?text=Skirt', category: 'Bottoms' },
        { id: 6, image: 'https://placehold.co/300x300/green/white?text=Bag', category: 'Accessories' },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 p-4 pb-24">
            {items.map((item) => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden shadow-sm bg-white">
                    <img
                        src={item.image}
                        alt={item.category}
                        className="w-full h-auto object-cover aspect-[3/4]"
                        loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-medium">{item.category}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
