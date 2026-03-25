import React, {useEffect, useState, useCallback} from 'react';
import {useSearchParams} from 'react-router-dom';

import {hooks} from '../hooks';
import {components} from '../components';
import {actions} from '../store/actions';
import {APP_PALETTE} from '../theme/appPalette';
import {supabase} from '../supabaseClient';
import {Routes} from '../enums';
import {isUuid} from '../utils/isUuid';
import {LEAVE_REVIEW_PRODUCT_ID_KEY} from '../constants/leaveReviewStorage';
import {formatSupabaseError} from '../utils/supabaseError';
import {ensureUserProfile} from '../utils/ensureUserProfile';

type LeaveReviewLocationState = {
  productId?: string;
  productName?: string;
  productImage?: string;
};

export const LeaveAReviews: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();
  const location = hooks.useLocation();
  const [searchParams] = useSearchParams();

  hooks.useThemeColor(APP_PALETTE.appShell);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = location.state as LeaveReviewLocationState | null;
  const fromQuery = searchParams.get('productId') ?? undefined;
  let fromSession: string | undefined;
  try {
    fromSession =
      sessionStorage.getItem(LEAVE_REVIEW_PRODUCT_ID_KEY) ?? undefined;
  } catch {
    fromSession = undefined;
  }
  const rawProductId = state?.productId ?? fromQuery ?? fromSession;
  const productId =
    rawProductId && isUuid(rawProductId) ? rawProductId : undefined;
  const productName = state?.productName;
  const productImage = state?.productImage;

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const submit = useCallback(async () => {
    setError(null);
    if (!productId) {
      setError('Missing product. Open this screen from a product page.');
      return;
    }
    if (rating < 1) {
      setError('Please choose a star rating.');
      return;
    }
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    const {
      data: {session},
    } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate(Routes.SignIn);
      return;
    }

    setSubmitting(true);

    const ensured = await ensureUserProfile(supabase, session.user);
    if (!ensured.ok) {
      setSubmitting(false);
      setError(ensured.errorMessage ?? 'Could not sync profile.');
      return;
    }

    const {data: existing, error: findErr} = await supabase
      .from('product_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (findErr) {
      setSubmitting(false);
      setError(formatSupabaseError(findErr));
      return;
    }

    const payload = {
      rating,
      comment: comment.trim(),
    };

    const writeErr = existing
      ? (
          await supabase
            .from('product_reviews')
            .update(payload)
            .eq('id', existing.id)
        ).error
      : (
          await supabase.from('product_reviews').insert({
            product_id: productId,
            user_id: session.user.id,
            ...payload,
          })
        ).error;

    setSubmitting(false);

    if (writeErr) {
      setError(formatSupabaseError(writeErr));
      return;
    }
    try {
      sessionStorage.removeItem(LEAVE_REVIEW_PRODUCT_ID_KEY);
    } catch {
      /* ignore */
    }
    navigate(-1);
  }, [productId, rating, comment, navigate]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Leave A Review'
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    const hero =
      productImage ||
      'https://george-fx.github.io/beshop_api/assets/other/04.png';

    return (
      <main
        style={{zIndex: 1}}
        className='scrollable container'
      >
        <div style={{paddingTop: 20, paddingBottom: 20}}>
          <img
            src={hero}
            alt=''
            style={{
              width: '80%',
              height: 'auto',
              alignSelf: 'center',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: 30,
            }}
          />
          <h2
            style={{
              textAlign: 'center',
              textTransform: 'capitalize',
              marginBottom: 12,
            }}
          >
            Rate this product
          </h2>
          {productName && (
            <p
              className='t14'
              style={{textAlign: 'center', marginBottom: 16}}
            >
              {productName}
            </p>
          )}
          {!productId && (
            <p
              className='t14'
              style={{
                textAlign: 'center',
                marginBottom: 20,
                color: APP_PALETTE.accent,
              }}
            >
              Open a product in the shop and tap &quot;Write a review&quot; to
              leave a review for that item.
            </p>
          )}
          <components.RatingStars
            containerStyle={{
              marginBottom: 20,
              alignSelf: 'center',
            }}
            setRating={setRating}
            rating={rating}
          />
          <p
            className='t16'
            style={{textAlign: 'center', marginBottom: 30}}
          >
            Your comments help other shoppers and us improve.
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder='Enter your comment'
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: '#fff',
              padding: 20,
              borderRadius: 0,
              width: '100%',
              height: 120,
              resize: 'none',
              marginBottom: 16,
            }}
            className='t16'
          />
          {error && (
            <p
              className='t14'
              style={{color: APP_PALETTE.accent, marginBottom: 12}}
            >
              {error}
            </p>
          )}
          {productId ? (
            <components.Button
              text={submitting ? 'Saving…' : 'submit'}
              onClick={() => void submit()}
              containerStyle={{opacity: submitting ? 0.75 : 1}}
            />
          ) : (
            <components.Button
              text='Go to shop'
              onClick={() => navigate(Routes.TabNavigator)}
            />
          )}
        </div>
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};
