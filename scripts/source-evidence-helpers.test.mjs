import {describe, expect, it} from 'vitest';
import {
  expandImageCandidates,
  expandVideoCandidates,
  prepareMediaCandidates,
  prioritizeMediaCandidates,
} from './source-evidence-helpers.mjs';

describe('source evidence media candidates', () => {
  it('expands article image sources from srcset, lazy attributes, metadata, and network responses', () => {
    const candidates = expandImageCandidates({
      baseUrl: 'https://news.example/articles/story',
      domImages: [
        {
          src: '/images/hero.jpg',
          srcset: '/images/hero-small.jpg 480w, /images/hero-large.jpg 1200w',
          lazySources: ['/images/hero-lazy.jpg'],
          width: 1200,
          height: 800,
        },
      ],
      metadataImages: [{src: 'https://cdn.example/og.jpg'}],
      networkImages: [{src: 'https://cdn.example/network.jpg'}],
    });

    expect(candidates.map((candidate) => candidate.src)).toEqual([
      'https://news.example/images/hero.jpg',
      'https://news.example/images/hero-small.jpg',
      'https://news.example/images/hero-large.jpg',
      'https://news.example/images/hero-lazy.jpg',
      'https://cdn.example/og.jpg',
      'https://cdn.example/network.jpg',
    ]);
  });

  it('prioritizes embedded and metadata videos before article images', () => {
    const videos = expandVideoCandidates({
      baseUrl: 'https://news.example/articles/story',
      embeddedVideos: [
        {
          src: '/video/embedded.mp4',
          sources: ['/video/embedded-source.mp4'],
        },
      ],
      metadataVideos: [{src: '/video/metadata.mp4'}],
      networkVideos: [{src: '/video/network.m3u8'}],
    });
    const images = expandImageCandidates({
      baseUrl: 'https://news.example/articles/story',
      domImages: [{src: '/images/article.jpg', width: 1200, height: 800}],
    });

    const result = prioritizeMediaCandidates({videos, images});

    expect(result.assets.map((asset) => `${asset.kind}:${asset.src}`)).toEqual([
      'video:https://news.example/video/embedded.mp4',
      'video:https://news.example/video/embedded-source.mp4',
      'video:https://news.example/video/metadata.mp4',
      'video:https://news.example/video/network.m3u8',
      'image:https://news.example/images/article.jpg',
    ]);
  });

  it('deduplicates the same media discovered through multiple sources', () => {
    const videos = expandVideoCandidates({
      baseUrl: 'https://news.example/articles/story',
      embeddedVideos: [{src: '/video/story.mp4'}],
      networkVideos: [{src: 'https://news.example/video/story.mp4'}],
    });

    expect(prioritizeMediaCandidates({videos, images: []}).assets).toHaveLength(1);
  });

  it('keeps all acquisition candidates instead of applying a fixed media cap', () => {
    const videos = Array.from({length: 7}, (_, index) => ({
      kind: 'video',
      src: `https://news.example/video-${index + 1}.mp4`,
    }));
    const images = Array.from({length: 13}, (_, index) => ({
      kind: 'image',
      src: `https://news.example/image-${index + 1}.jpg`,
      width: 1200,
      height: 800,
    }));

    const result = prepareMediaCandidates({videos, images});

    expect(result.videos).toHaveLength(7);
    expect(result.images).toHaveLength(13);
  });
});
