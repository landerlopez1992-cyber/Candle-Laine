import React, {useEffect, useMemo} from 'react';
import {Link} from 'react-router-dom';
import {Swiper, SwiperSlide} from 'swiper/react';
import {Autoplay, Pagination} from 'swiper/modules';

import {BRAND_SOCIAL_LINKS} from '../../config/brandLinks';
import {SocialBrandIcon} from '../../components/SocialBrandIcon';
import {Routes} from '../../enums';
import {items} from '../../items';
import {hooks} from '../../hooks';
import {ProductType} from '../../types';
import {components} from '../../components';
import {actions} from '../../store/actions';
import {useBanners} from '../../hooks/useBanners';
import {useHomeCountdown} from '../../hooks/useHomeCountdown';
import {hasHomeStoryContent, useHomeStory} from '../../hooks/useHomeStory';
import {HomeCountdownBlock} from '../../components/HomeCountdownBlock';
import {useProducts} from '../../hooks/useProducts';
import {APP_PALETTE} from '../../theme/appPalette';
import type {HomeBannerView} from '../../types/homeBanner';

type HomeStorySection = {title: string; body: string};

/**
 * Cuerpo con bloques "póster": párrafo(s) opcionales y luego secciones
 * `## Subtítulo` + texto (viñetas con `- ` en líneas sueltas).
 * Cada sección se empareja en orden con `imageUrls[0]`, `imageUrls[1]`, …
 */
function parseHomeStorySections(bodyText: string): {
  intro: string;
  sections: HomeStorySection[];
} {
  const trimmed = bodyText.trim();
  if (!trimmed) {
    return {intro: '', sections: []};
  }

  const lines = trimmed.split(/\n/);
  const sections: HomeStorySection[] = [];
  const introLines: string[] = [];
  let current: {title: string; lines: string[]} | null = null;

  for (const line of lines) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      if (current) {
        sections.push({
          title: current.title,
          body: current.lines.join('\n').trimEnd(),
        });
      }
      current = {title: m[1].trim(), lines: []};
    } else if (current) {
      current.lines.push(line);
    } else {
      introLines.push(line);
    }
  }
  if (current) {
    sections.push({
      title: current.title,
      body: current.lines.join('\n').trimEnd(),
    });
  }

  return {
    intro: introLines.join('\n').trim(),
    sections,
  };
}

/**
 * Parte un texto en N trozos consecutivos por palabras (misma narrativa, reparto equitativo).
 */
function splitTextIntoNContiguousChunks(text: string, n: number): string[] {
  const t = text.trim();
  if (n <= 0) {
    return [];
  }
  if (!t) {
    return Array(n).fill('');
  }
  if (n === 1) {
    return [t];
  }

  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return Array(n).fill('');
  }
  if (words.length < n) {
    const out = words.map((w) => w);
    while (out.length < n) {
      out.push('');
    }
    return out.slice(0, n);
  }

  const base = Math.floor(words.length / n);
  let rem = words.length % n;
  const out: string[] = [];
  let idx = 0;
  for (let i = 0; i < n; i += 1) {
    const take = base + (rem > 0 ? 1 : 0);
    if (rem > 0) {
      rem -= 1;
    }
    out.push(words.slice(idx, idx + take).join(' '));
    idx += take;
  }
  return out;
}

/**
 * Reparte el cuerpo del mural (sin `##`) en intro opcional y un pie por imagen.
 * Si hay menos bloques que imágenes (p. ej. un solo párrafo largo y 2 fotos), el texto
 * se corta en trozos continuos entre todas las imágenes.
 */
function legacyIntroAndCaptions(
  bodyText: string,
  nImages: number,
): {intro: string; captions: string[]} {
  const raw = bodyText.trim();
  if (nImages <= 0) {
    return {intro: raw, captions: []};
  }
  if (!raw) {
    return {intro: '', captions: Array(nImages).fill('')};
  }

  let blocks = raw.split(/\n\s*\n+/).map((s) => s.trim()).filter(Boolean);

  if (blocks.length === 1) {
    const lines = blocks[0].split('\n').map((s) => s.trim()).filter(Boolean);
    if (lines.length > 1) {
      blocks = lines;
    } else {
      const sentences = blocks[0]
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (sentences.length > 1) {
        blocks = sentences;
      }
    }
  }

  if (blocks.length > nImages) {
    const intro = blocks[0];
    const rest = blocks.slice(1);
    if (rest.length === nImages) {
      return {intro, captions: rest};
    }
    const bodyRest = rest.join('\n\n');
    return {
      intro,
      captions: splitTextIntoNContiguousChunks(bodyRest, nImages),
    };
  }

  if (blocks.length === nImages) {
    return {intro: '', captions: blocks};
  }

  const merged = blocks.join('\n\n');
  return {
    intro: '',
    captions: splitTextIntoNContiguousChunks(merged, nImages),
  };
}

export const Home: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  const {bannersLoading, banner1, banner2} = useBanners();
  const {productsLoading, products} = useProducts();
  const {story, storyLoading} = useHomeStory();
  const {display: countdownDisplay, loading: countdownLoading} =
    useHomeCountdown();

  const discountedProducts = useMemo(
    () => products.filter((p) => p.flag_discount === true),
    [products],
  );

  const isLoading = productsLoading || bannersLoading;

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const navigateBannerLink = (path: string) => {
    const p = (path || '/shop').trim() || '/shop';
    if (/^https?:\/\//i.test(p)) {
      window.location.href = p;
      return;
    }
    navigate(p.startsWith('/') ? p : `/${p}`);
  };

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showLogo={true}
        showBasket={true}
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
      />
    );
  };

  const renderBannerBlock = (
    config: HomeBannerView | null,
    keyPrefix: string,
  ): JSX.Element | null => {
    if (!config || config.slides.length === 0) {
      return null;
    }
    const {slideIntervalMs, slides} = config;
    const multi = slides.length > 1;

    return (
      <section
        className='home-banner-swiper'
        style={{marginBottom: 40}}
      >
        <Swiper
          modules={[Autoplay, Pagination]}
          loop={multi}
          pagination={{clickable: true}}
          autoplay={
            multi
              ? {
                  delay: slideIntervalMs,
                  disableOnInteraction: false,
                }
              : false
          }
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={`${keyPrefix}-${index}`}>
              <div
                role='button'
                tabIndex={0}
                className='clickable'
                style={{
                  position: 'relative',
                  width: '100%',
                  lineHeight: 0,
                }}
                onClick={() => navigateBannerLink(slide.linkPath)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateBannerLink(slide.linkPath);
                  }
                }}
              >
                <img
                  alt=''
                  src={slide.imageUrl}
                  style={{
                    width: '100%',
                    display: 'block',
                    verticalAlign: 'top',
                  }}
                />
                {(slide.title || slide.subtitle || slide.buttonLabel) && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      maxWidth: '56%',
                      textAlign: 'left',
                      lineHeight: 1.35,
                      pointerEvents: 'none',
                    }}
                  >
                    {slide.title ? (
                      <h2
                        style={{
                          margin: '0 0 8px',
                          fontFamily: 'League Spartan, sans-serif',
                          fontSize: 22,
                          fontWeight: 600,
                          color: 'var(--text-on-light)',
                        }}
                      >
                        {slide.title}
                      </h2>
                    ) : null}
                    {slide.subtitle ? (
                      <p
                        className='t14'
                        style={{
                          margin: '0 0 12px',
                          color: 'var(--text-on-light)',
                          opacity: 0.92,
                        }}
                      >
                        {slide.subtitle}
                      </p>
                    ) : null}
                    {slide.buttonLabel ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '8px 16px',
                          backgroundColor: '#1C2D18',
                          color: 'var(--white-color)',
                          fontFamily: 'Lato, sans-serif',
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: 0.06,
                          textTransform: 'uppercase',
                        }}
                      >
                        {slide.buttonLabel}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    );
  };

  const renderTrendingProducts = (): JSX.Element => {
    return (
      <div style={{marginBottom: 40}}>
        <components.BlockHeading
          title='Trending Products'
          viewAllOnClick={() => {
            navigate('/shop', {state: {category: 'Trending'}});
          }}
          containerStyle={{marginLeft: 20, marginRight: 20, marginBottom: 18}}
        />
        <div
          className='home-trending-marquee'
          style={{width: '100%'}}
        >
          <div className='home-trending-marquee__track'>
            {products.map(
              (product: ProductType, index: number, array: ProductType[]) => {
                const isLast = index === array.length - 1;
                return (
                  <items.TrendingItem
                    key={`trending-a-${product.id}-${index}`}
                    index={index}
                    isLast={isLast}
                    product={product}
                    omitEdgeMargins
                  />
                );
              },
            )}
            {products.map(
              (product: ProductType, index: number, array: ProductType[]) => {
                const isLast = index === array.length - 1;
                return (
                  <items.TrendingItem
                    key={`trending-b-${product.id}-${index}`}
                    index={index}
                    isLast={isLast}
                    product={product}
                    omitEdgeMargins
                  />
                );
              },
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNewArrivals = (): JSX.Element => {
    return (
      <div style={{paddingBottom: 20}}>
        <components.BlockHeading
          title='New Arrivals'
          viewAllOnClick={() => {
            navigate('/shop', {state: {category: 'New Arrivals'}});
          }}
          containerStyle={{marginLeft: 20, marginRight: 20, marginBottom: 18}}
        />

        <div
          style={{
            columnGap: 15,
            rowGap: 20,
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
          }}
          className='container'
        >
          {products.map(
            (product: ProductType, index: number, array: ProductType[]) => {
              const isLast = index === array.length - 1;
              return (
                <items.NewArrivalItem
                  key={product.id}
                  index={index}
                  isLast={isLast}
                  product={product}
                />
              );
            },
          )}
        </div>
      </div>
    );
  };

  const renderDiscountedItems = (): JSX.Element | null => {
    if (discountedProducts.length === 0) {
      return null;
    }

    return (
      <div style={{marginBottom: 40}}>
        <components.BlockHeading
          title='Discounted Items'
          viewAllOnClick={() => {
            navigate('/shop', {
              state: {
                category: 'Discounted Items',
                discountOnly: true,
              },
            });
          }}
          containerStyle={{marginLeft: 20, marginRight: 20, marginBottom: 18}}
        />
        <div
          className='home-discounted-marquee'
          style={{width: '100%'}}
        >
          <div className='home-discounted-marquee__track'>
            {discountedProducts.map(
              (product: ProductType, index: number, array: ProductType[]) => {
                const isLast = index === array.length - 1;
                return (
                  <items.TrendingItem
                    key={`discounted-a-${product.id}-${index}`}
                    index={index}
                    isLast={isLast}
                    product={product}
                    omitEdgeMargins
                    compactIcons
                  />
                );
              },
            )}
            {discountedProducts.map(
              (product: ProductType, index: number, array: ProductType[]) => {
                const isLast = index === array.length - 1;
                return (
                  <items.TrendingItem
                    key={`discounted-b-${product.id}-${index}`}
                    index={index}
                    isLast={isLast}
                    product={product}
                    omitEdgeMargins
                    compactIcons
                  />
                );
              },
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOurStory = (): JSX.Element | null => {
    if (storyLoading || !story || !hasHomeStoryContent(story)) {
      return null;
    }

    const title = story.title.trim() || 'Nuestra historia';
    const imgs = story.imageUrls;
    const {intro, sections} = parseHomeStorySections(story.bodyText);

    const introStyle: React.CSSProperties = {
      color: APP_PALETTE.textOnDark,
      lineHeight: 1.65,
      fontSize: 15,
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 12,
      paddingBottom: 16,
      maxWidth: 420,
      marginLeft: 'auto',
      marginRight: 'auto',
    };

    const storyFigureStyle: React.CSSProperties = {
      margin: 0,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: APP_PALETTE.imageWell,
      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      flex: '0 0 44%',
      minWidth: 0,
      alignSelf: 'flex-start',
    };

    /** Alto natural de la foto; no se estira junto al texto largo. */
    const storyImgStyle: React.CSSProperties = {
      width: '100%',
      height: 'auto',
      display: 'block',
      verticalAlign: 'top',
    };

    const renderFullWidthFigure = (url: string, key: string) => (
      <figure
        key={key}
        style={{
          margin: '0 0 16px',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: APP_PALETTE.imageWell,
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        }}
      >
        <img
          src={url}
          alt=''
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </figure>
    );

    /** Sin `##`: intro centrada + filas imagen|texto (mismo zigzag que el póster). */
    const renderLegacyFeed = () => {
      const n = imgs.length;
      const {intro, captions} = legacyIntroAndCaptions(story.bodyText, n);

      if (n === 0) {
        const paragraphs = story.bodyText
          .split(/\n\s*\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        return (
          <div style={{marginTop: 8}}>
            {paragraphs.map((p, idx) => (
              <div
                key={`legacy-only-${idx}`}
                className='t16'
                style={{
                  ...introStyle,
                  paddingTop: idx === 0 ? 12 : 14,
                  paddingBottom: 14,
                }}
              >
                {p}
              </div>
            ))}
          </div>
        );
      }

      const rows: JSX.Element[] = [];

      if (intro.trim()) {
        rows.push(
          <div
            key='legacy-intro'
            className='t16'
            style={introStyle}
          >
            {intro}
          </div>,
        );
      }

      for (let i = 0; i < n; i += 1) {
        const url = imgs[i];
        const cap = (captions[i] ?? '').trim();
        const zig = i % 2 === 0;

        if (!cap) {
          rows.push(renderFullWidthFigure(url, `legacy-img-${i}`));
          continue;
        }

        rows.push(
          <div
            key={`legacy-row-${i}`}
            style={{
              display: 'flex',
              flexDirection: zig ? 'row' : 'row-reverse',
              alignItems: 'flex-start',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <figure style={storyFigureStyle}>
              <img
                src={url}
                alt=''
                style={storyImgStyle}
              />
            </figure>
            <div
              style={{
                flex: '1 1 56%',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              <div
                className='t16'
                style={{
                  color: APP_PALETTE.textMuted,
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.65,
                  fontSize: 14,
                }}
              >
                {cap}
              </div>
            </div>
          </div>,
        );
      }

      return <div style={{marginTop: intro.trim() ? 4 : 8}}>{rows}</div>;
    };

    /** Mural tipo póster: intro centrada + filas imagen|texto alternadas. */
    const renderPosterSections = () => {
      const count = Math.max(sections.length, imgs.length);
      const rows: JSX.Element[] = [];

      for (let i = 0; i < count; i += 1) {
        const sec = sections[i];
        const url = imgs[i];
        const zig = i % 2 === 0;

        if (sec && url) {
          rows.push(
            <div
              key={`poster-${i}`}
              style={{
                display: 'flex',
                flexDirection: zig ? 'row' : 'row-reverse',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <figure style={storyFigureStyle}>
                <img
                  src={url}
                  alt=''
                  style={storyImgStyle}
                />
              </figure>
              <div
                style={{
                  flex: '1 1 56%',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 8px',
                    fontSize: 17,
                    fontWeight: 700,
                    color: APP_PALETTE.textOnDark,
                    lineHeight: 1.25,
                  }}
                >
                  {sec.title}
                </h4>
                <div
                  className='t16'
                  style={{
                    color: APP_PALETTE.textMuted,
                    textAlign: 'left',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.65,
                    fontSize: 14,
                  }}
                >
                  {sec.body}
                </div>
              </div>
            </div>,
          );
        } else if (sec && !url) {
          rows.push(
            <div
              key={`poster-t-${i}`}
              style={{marginBottom: 16}}
            >
              <h4
                style={{
                  margin: '0 0 8px',
                  fontSize: 17,
                  fontWeight: 700,
                  color: APP_PALETTE.textOnDark,
                }}
              >
                {sec.title}
              </h4>
              <div
                className='t16'
                style={{
                  color: APP_PALETTE.textMuted,
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.65,
                  fontSize: 14,
                }}
              >
                {sec.body}
              </div>
            </div>,
          );
        } else if (!sec && url) {
          rows.push(
            <figure
              key={`poster-img-${i}`}
              style={{
                margin: '0 0 16px',
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: APP_PALETTE.imageWell,
                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
              }}
            >
              <img
                src={url}
                alt=''
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </figure>,
          );
        }
      }

      return (
        <div style={{marginTop: 8}}>{rows}</div>
      );
    };

    const hasPosterLayout = sections.length > 0;
    const showIntroInPoster = hasPosterLayout && intro.length > 0;

    return (
      <section
        style={{
          paddingBottom: 28,
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <div
          style={{
            borderBottom: '2px solid var(--main-color)',
            paddingBottom: 9,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          <h3 style={{margin: 0}}>{title}</h3>
        </div>

        {showIntroInPoster ? (
          <div
            className='t16'
            style={introStyle}
          >
            {intro}
          </div>
        ) : null}

        {hasPosterLayout ? renderPosterSections() : renderLegacyFeed()}
      </section>
    );
  };

  const renderHomeLegalStrip = (): JSX.Element => {
    const year = new Date().getFullYear();
    const socialLabels: Record<keyof typeof BRAND_SOCIAL_LINKS, string> = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      tiktok: 'TikTok',
    };
    const socialEntries = (
      Object.entries(BRAND_SOCIAL_LINKS) as [
        keyof typeof BRAND_SOCIAL_LINKS,
        string,
      ][]
    ).filter(([, url]) => url.trim().length > 0);

    return (
      <section
        style={{
          paddingTop: 24,
          paddingBottom: 32,
          paddingLeft: 20,
          paddingRight: 20,
          borderTop: '1px solid var(--border-color)',
          marginTop: 8,
        }}
      >
        <div style={{textAlign: 'center'}}>
          <Link
            to={Routes.TermsAndConditions}
            className='t14'
            style={{color: 'var(--accent-color)'}}
          >
            Terms & Conditions
          </Link>
        </div>

        {socialEntries.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 20,
              marginTop: 16,
            }}
          >
            {socialEntries.map(([key, url]) => (
              <a
                key={key}
                href={url.trim()}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={socialLabels[key]}
                className='clickable'
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  color: APP_PALETTE.accent,
                }}
              >
                <SocialBrandIcon
                  network={key}
                  size={32}
                />
                <span
                  className='t10'
                  style={{
                    color: APP_PALETTE.textMuted,
                    textTransform: 'none',
                  }}
                >
                  {socialLabels[key]}
                </span>
              </a>
            ))}
          </div>
        ) : null}

        <p
          className='t10'
          style={{
            textAlign: 'center',
            marginTop: socialEntries.length > 0 ? 16 : 14,
            marginBottom: 0,
            color: APP_PALETTE.textMuted,
          }}
        >
          © {year} Candle-Laine. All rights reserved.
        </p>
      </section>
    );
  };

  const renderFooter = (): JSX.Element => {
    return <components.Footer />;
  };

  const renderContent = (): JSX.Element => {
    if (isLoading) {
      return (
        <components.Loader
          spinnerColor={APP_PALETTE.spinner}
        />
      );
    }

    return (
      <main
        className='scrollable'
        style={{
          backgroundColor: 'var(--main-background)',
        }}
      >
        {renderBannerBlock(banner1, 'b1')}
        {renderTrendingProducts()}
        {renderBannerBlock(banner2, 'b2')}
        {renderNewArrivals()}
        {renderDiscountedItems()}
        {!countdownLoading && countdownDisplay ? (
          <HomeCountdownBlock data={countdownDisplay} />
        ) : null}
        {renderOurStory()}
        {renderHomeLegalStrip()}
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  );
};
