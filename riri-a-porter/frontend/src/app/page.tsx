import ChatInterface from '@/components/ChatInterface';
import WardrobeGrid from '@/components/WardrobeGrid';
import CameraUpload from '@/components/CameraUpload';

export default function Home() {
  return (
    <main className="min-h-screen bg-white max-w-md mx-auto relative shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="p-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-bold text-center font-serif tracking-wide text-gray-900">
          Riri-a-Porter
        </h1>
        <p className="text-xs text-center text-gray-500 uppercase tracking-widest mt-1">
          Paris • Jakarta • Bali
        </p>
      </header>

      {/* Chat Section */}
      <section className="p-4">
        <ChatInterface />
      </section>

      {/* Wardrobe Section */}
      <section className="mt-2">
        <div className="px-4 py-2 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">My Wardrobe</h2>
          <button className="text-xs text-purple-600 font-medium">View All</button>
        </div>
        <WardrobeGrid />
      </section>

      {/* Floating Actions */}
      <CameraUpload />
    </main>
  );
}
