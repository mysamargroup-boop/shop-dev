
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SiteSettings } from '@/lib/types';
import { BLUR_DATA_URL } from '@/lib/constants';

const Bubble = ({ style }: { style: React.CSSProperties }) => (
  <div
    className="absolute rounded-full bg-white/20"
    style={style}
  />
);

const calculateTimeLeft = (endDate: string) => {
  if (!endDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  const difference = +new Date(endDate) - +new Date();
  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }

  return timeLeft;
};

const Timer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTimeLeft(calculateTimeLeft(endDate));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const timerComponents = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  if (!isClient || timeLeft.total <= 0) {
    return null;
  }

  return (
    <div className="flex gap-2 sm:gap-4">
      {timerComponents.map(component => (
        <div key={component.label} className="flex flex-col items-center p-2 rounded-lg bg-white/10 backdrop-blur-sm">
          <span className="text-xl sm:text-3xl font-bold tabular-nums">{String(component.value).padStart(2, '0')}</span>
          <span className="text-[10px] sm:text-xs uppercase tracking-wider">{component.label}</span>
        </div>
      ))}
    </div>
  );
};


const TimerBanner = ({ settings }: { settings: SiteSettings }) => {
  const [bubbles, setBubbles] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles = Array.from({ length: 20 }).map(() => {
        const size = Math.random() * 40 + 10; // 10px to 50px
        return {
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          bottom: `-${size}px`,
          animation: `bubble-rise ${Math.random() * 10 + 5}s linear ${Math.random() * 5}s infinite`,
        };
      });
      setBubbles(newBubbles);
    };
    generateBubbles();
  }, []);

  if (!settings?.timer_banner_enabled) {
    return null;
  }

  const imageUrl = settings.timer_banner_image_url || 'https://images.unsplash.com/photo-1574936142499-56c637651a29?q=80&w=2070&auto=format&fit=crop';
  const title = settings.timer_banner_title || 'Sale is Live!';
  const endDate = settings.timer_banner_end_date || '';

  return (
    <div className="relative w-full rounded-2xl overflow-hidden my-8 aspect-[16/9] md:aspect-[21/9]">
       <style jsx global>{`
        @keyframes bubble-rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
      <Image
        src={imageUrl}
        alt="Timer Banner"
        fill
        className="object-cover"
        data-ai-hint="promotional background"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-red-900/30" />
      
      <div className="absolute inset-0 pointer-events-none">
        {bubbles.map((style, index) => (
          <Bubble key={index} style={style} />
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
        <h2 className="text-3xl md:text-5xl font-extrabold drop-shadow-lg font-headline">
          {title}
        </h2>
        <div className="mt-4 sm:mt-6">
          <Timer endDate={endDate} />
        </div>
      </div>
    </div>
  );
};

export default TimerBanner;
