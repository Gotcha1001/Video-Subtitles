import SparklesIcon from "./SparklesIcon";

export default function DemoSection() {
  return (
    <section className="flex justify-around mt-8 sm:mt-12 items-center">
      <div className="hidden sm:block bg-gray-800/50 w-[240px] h-[480px] rounded-xl">
        <iframe
          className="w-full h-full rounded-xl"
          src="https://www.youtube.com/embed/V0LfCBYfJtw?autoplay=1"
          frameBorder="0"
          allow="encrypted-media"
          allowFullScreen
        ></iframe>
      </div>
      <div className="hidden sm:block">
        <SparklesIcon />
      </div>
      <div className="bg-gray-800/50 w-[240px] h-[480px] rounded-xl">
        <iframe
          className="w-full h-full rounded-xl"
          src="https://www.youtube.com/embed/P2qbSpQKp2Y?autoplay=1"
          frameBorder="0"
          allow="encrypted-media"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
}
