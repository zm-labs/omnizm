'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from 'embla-carousel-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];
type CarouselPlugin = Parameters<typeof useEmblaCarousel>[1];

interface CarouselProps {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: CarouselApi) => void;
  className?: string;
  children: ReactNode;
}

interface CarouselContextValue extends CarouselProps {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: CarouselApi;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

const useCarousel = () => {
  const context = useContext(CarouselContext);
  if (!context)
    throw new Error('useCarousel must be used within a <Carousel />');
  return context;
};

const Carousel = ({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  className,
  children,
}: CarouselProps) => {
  const [carouselRef, api] = useEmblaCarousel(
    { ...opts, axis: orientation === 'horizontal' ? 'x' : 'y' },
    plugins
  );
  const [scrollable, setScrollable] = useState({ prev: false, next: false });

  const updateScrollButtons = useCallback((api: CarouselApi) => {
    if (!api) return;
    setScrollable({
      prev: api.canScrollPrev(),
      next: api.canScrollNext(),
    });
  }, []);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext]
  );

  useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  useEffect(() => {
    if (!api) return;

    updateScrollButtons(api);
    api.on('reInit', updateScrollButtons);
    api.on('select', updateScrollButtons);

    return () => {
      api.off('select', updateScrollButtons);
    };
  }, [api, updateScrollButtons]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev: scrollable.prev,
        canScrollNext: scrollable.next,
        children,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
};
Carousel.displayName = 'Carousel';

const CarouselContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { carouselRef, orientation } = useCarousel();
  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        className={cn(
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          className
        )}
        {...props}
      />
    </div>
  );
};
CarouselContent.displayName = 'CarouselContent';

const CarouselItem = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    role="group"
    aria-roledescription="slide"
    className={cn(
      'min-w-0 shrink-0 grow-0 basis-full',
      useCarousel().orientation === 'horizontal' ? 'pl-4' : 'pt-4',
      className
    )}
    {...props}
  />
);
CarouselItem.displayName = 'CarouselItem';

const createNavigationButton = (
  direction: 'prev' | 'next',
  Icon: typeof ArrowLeftIcon | typeof ArrowRightIcon
) => {
  const NavigationButton = ({
    className,
    variant = 'outline',
    size = 'icon',
    ...props
  }: React.ComponentProps<typeof Button>) => {
    const {
      orientation,
      [direction === 'prev' ? 'scrollPrev' : 'scrollNext']: scroll,
      [direction === 'prev' ? 'canScrollPrev' : 'canScrollNext']: canScroll,
    } = useCarousel();

    return (
      <Button
        variant={variant}
        size={size}
        className={cn(
          'absolute h-8 w-8 rounded-full',
          orientation === 'horizontal'
            ? `${
                direction === 'prev' ? '-left-12' : '-right-12'
              } top-1/2 -translate-y-1/2`
            : `${
                direction === 'prev' ? '-top-12' : '-bottom-12'
              } left-1/2 -translate-x-1/2 rotate-90`,
          className
        )}
        disabled={!canScroll}
        onClick={scroll}
        {...props}
      >
        <Icon className="h-4 w-4" />
        <span className="sr-only">
          {direction === 'prev' ? 'Previous' : 'Next'} slide
        </span>
      </Button>
    );
  };

  NavigationButton.displayName = `Carousel${
    direction === 'prev' ? 'Previous' : 'Next'
  }`;
  return NavigationButton;
};

const CarouselPrevious = createNavigationButton('prev', ArrowLeftIcon);
const CarouselNext = createNavigationButton('next', ArrowRightIcon);

export type { CarouselApi };
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};