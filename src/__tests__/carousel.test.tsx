import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { DetailHero, GalleryTab } from '@/components';
import { pageForOffset } from '@/components/organisms/ImageCarousel';

import { breedNamed, renderWithProviders } from './testUtils';

const WIDTH = 350;

async function layout(testID: string) {
  await fireEvent(screen.getByTestId(testID), 'layout', {
    nativeEvent: { layout: { width: WIDTH, height: 240, x: 0, y: 0 } },
  });
}

async function swipeTo(listTestID: string, page: number) {
  await fireEvent(screen.getByTestId(listTestID), 'momentumScrollEnd', {
    nativeEvent: {
      contentOffset: { x: page * WIDTH, y: 0 },
      contentSize: { width: WIDTH * 2, height: 240 },
      layoutMeasurement: { width: WIDTH, height: 240 },
    },
  });
}

describe('pageForOffset', () => {
  it('rounds to the nearest page and clamps', () => {
    expect(pageForOffset(0, 350, 5)).toBe(0);
    expect(pageForOffset(340, 350, 5)).toBe(1);
    expect(pageForOffset(520, 350, 5)).toBe(1);
    expect(pageForOffset(99999, 350, 5)).toBe(4);
    expect(pageForOffset(-50, 350, 5)).toBe(0);
    expect(pageForOffset(100, 0, 5)).toBe(0);
  });
});

describe('DetailHero carousel', () => {
  it('swiping updates the image counter', async () => {
    const breed = breedNamed('Affenpinscher'); // 2 images in the fixture
    await renderWithProviders(<DetailHero breed={breed} group={null} onBack={jest.fn()} />);
    expect(screen.getByText('1 / 2')).toBeOnTheScreen();

    await layout('hero-carousel');
    await swipeTo('hero-carousel-list', 1);
    expect(screen.getByText('2 / 2')).toBeOnTheScreen();

    await swipeTo('hero-carousel-list', 0);
    expect(screen.getByText('1 / 2')).toBeOnTheScreen();
  });

  it('does not show cache status labels', async () => {
    await renderWithProviders(
      <DetailHero breed={breedNamed('Akita')} group={null} onBack={jest.fn()} />,
    );
    expect(screen.queryByText(/CACHED/)).toBeNull();
  });
});

describe('GalleryTab carousel', () => {
  it('swipe, arrows and wrap-around all move the current image and attribution', async () => {
    const breed = breedNamed('Affenpinscher');
    const [first, second] = breed.images;
    await renderWithProviders(<GalleryTab breed={breed} />);
    await layout('gallery-carousel');

    expect(screen.getByText('1 / 2')).toBeOnTheScreen();
    expect(screen.getByText(first!.attribution.author!)).toBeOnTheScreen();

    await swipeTo('gallery-carousel-list', 1);
    expect(screen.getByText('2 / 2')).toBeOnTheScreen();
    expect(screen.getByText(second!.attribution.author!)).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('gallery-next')); // wraps to first
    expect(screen.getByText('1 / 2')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('gallery-prev')); // wraps to last
    expect(screen.getByText('2 / 2')).toBeOnTheScreen();
    expect(screen.queryByText(/CACHED|FETCHING/)).toBeNull();
  });
});
