import React, {useEffect} from 'react';
import * as Accordion from '@radix-ui/react-accordion';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {svg} from '../assets/svg';
import {OrderType} from '../types';
import {ProductType} from '../types';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';
import {orderStatusLabel} from '../utils/orderMap';

/** Texto oscuro legible sobre `cartCardSurface` (evita --main-color / .t12 que son claros). */
const onCard = {
  primary: 'var(--text-on-light)' as const,
  /** Secundario aún con buen contraste sobre crema */
  secondary: '#4a4038' as const,
  muted: '#545953' as const,
};

export const OrderHistory: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);
  const navigate = hooks.useNavigate();

  const {ordersLoading, orders} = hooks.useOrders();

  const dispatch = hooks.useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Order History'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderStatusIcon = (status: OrderType['status']) => {
    if (status === 'delivered') {
      return <svg.DeliveredSvg />;
    }
    if (status === 'canceled') {
      return <svg.CanceledSvg />;
    }
    if (status === 'paid') {
      return <svg.DeliveredSvg />;
    }
    if (status === 'pending_payment') {
      return <svg.CreditCardSvg />;
    }
    return <svg.WaySvg />;
  };

  const renderContent = (): JSX.Element => {
    if (ordersLoading) {
      return (
        <main
          className='scrollable container'
          style={{
            paddingTop: 40,
            paddingBottom: 40,
            minHeight: '50vh',
            backgroundColor: APP_PALETTE.appShell,
          }}
        >
          <components.Loader />
        </main>
      );
    }

    if (orders.length === 0) {
      return (
        <main
          className='scrollable container'
          style={{
            paddingTop: 20,
            paddingBottom: 20,
            minHeight: '50vh',
            backgroundColor: APP_PALETTE.appShell,
          }}
        >
          <p className='t16' style={{color: APP_PALETTE.textMuted}}>
            No orders yet.
          </p>
        </main>
      );
    }

    return (
      <main
        className='scrollable container'
        style={{
          paddingTop: 20,
          paddingBottom: 20,
          backgroundColor: APP_PALETTE.appShell,
        }}
      >
        <Accordion.Root
          type='single'
          collapsible={true}
        >
          {orders.map((order: OrderType, index, array) => {
            const isLast = index === array.length - 1;

            return (
              <Accordion.Item
                key={order.id}
                value={order.id}
                style={{
                  backgroundColor: APP_PALETTE.cartCardSurface,
                  border: `1px solid ${APP_PALETTE.border}`,
                  marginBottom: isLast ? 0 : 8,
                  borderRadius: 4,
                }}
              >
                <Accordion.Trigger
                  style={{
                    flexDirection: 'column',
                    width: '100%',
                    display: 'flex',
                    padding: 20,
                    textAlign: 'left',
                  }}
                >
                  <div
                    className='row-center-space-between'
                    style={{width: '100%', marginBottom: 3}}
                  >
                    <h5
                      style={{
                        color: onCard.primary,
                        fontWeight: 700,
                      }}
                    >
                      #{order.humanNumber}
                    </h5>
                    {renderStatusIcon(order.status)}
                  </div>
                  <div
                    className='row-center-space-between'
                    style={{width: '100%', marginBottom: 6}}
                  >
                    <span
                      className='t12'
                      style={{
                        color: onCard.primary,
                        fontWeight: 600,
                      }}
                    >
                      {orderStatusLabel(order.status)}
                    </span>
                  </div>
                  <div
                    className='row-center-space-between'
                    style={{width: '100%'}}
                  >
                    <span
                      className='t12'
                      style={{color: onCard.secondary}}
                    >
                      {order.date}
                    </span>
                    <span
                      className='t12'
                      style={{
                        fontWeight: 700,
                        color: onCard.primary,
                      }}
                    >
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </Accordion.Trigger>
                <Accordion.Content
                  style={{
                    padding: 20,
                    borderTop: `1px solid ${APP_PALETTE.border}`,
                    color: onCard.primary,
                  }}
                >
                  {order.products.map(
                    (
                      item: ProductType,
                      itemIndex: number,
                      itemArray: ProductType[],
                    ) => {
                      const itemIsLast = itemIndex === itemArray.length - 1;
                      return (
                        <div key={`${order.id}-${itemIndex}`}>
                          <div
                            style={{
                              width: '100%',
                              marginBottom: itemIsLast ? 6 : 6,
                            }}
                            className='row-center-space-between'
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                minWidth: 0,
                                flex: 1,
                                marginRight: 8,
                              }}
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt=''
                                  style={{
                                    width: 56,
                                    height: 56,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    flexShrink: 0,
                                    backgroundColor: 'var(--image-background)',
                                    border: '1px solid var(--border-color)',
                                  }}
                                />
                              ) : null}
                              <span
                                className='t14'
                                style={{minWidth: 0, color: onCard.primary}}
                              >
                                {item.name}
                                {item.size ? `, ${item.size}` : ''}
                                {item.color ? `, ${item.color}` : ''}
                              </span>
                            </div>
                            <span
                              className='t14'
                              style={{flexShrink: 0, color: onCard.primary}}
                            >
                              {item.quantity} x ${item.price}
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                  <div className='row-center-space-between'>
                    <span className='t14' style={{color: onCard.secondary}}>
                      Discount
                    </span>
                    <span className='t14' style={{color: onCard.secondary}}>
                      -$0
                    </span>
                  </div>
                  {order.paymentMethodDisplay ? (
                    <div
                      className='row-center-space-between'
                      style={{marginTop: 10}}
                    >
                      <span className='t14' style={{color: onCard.secondary}}>
                        Paid with
                      </span>
                      <span className='t14' style={{color: onCard.primary}}>
                        {order.paymentMethodDisplay}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className='row-center-space-between'
                    style={{marginTop: 30}}
                  >
                    <button type='button'>
                      <svg.RepeatOrderSvg />
                    </button>
                    <span
                      className='t14 clickable'
                      style={{color: APP_PALETTE.accent}}
                      onClick={() => navigate(Routes.TabNavigator)}
                    >
                      Leave a review
                    </span>
                  </div>
                  <components.Button
                    text='Track order'
                    onClick={() =>
                      navigate(Routes.TrackYourOrder, {
                        state: {orderId: order.id},
                      })
                    }
                    containerStyle={{width: '100%', marginTop: 16}}
                  />
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
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
