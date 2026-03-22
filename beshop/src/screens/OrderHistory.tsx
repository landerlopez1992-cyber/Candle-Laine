import React, {useEffect} from 'react';
import * as Accordion from '@radix-ui/react-accordion';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {svg} from '../assets/svg';
import {OrderType} from '../types';
import {ProductType} from '../types';
import {actions} from '../store/actions';
import {components} from '../components';

export const OrderHistory: React.FC = () => {
  hooks.useThemeColor('#FCEDEA');
  const navigate = hooks.useNavigate();

  const {ordersLoading, orders} = hooks.useOrders();

  const dispatch = hooks.useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Order History'
        showGoBack={true}
        headerStyle={{backgroundColor: '#FCEDEA'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    if (ordersLoading) return <components.Loader />;

    return (
      <main
        className='scrollable container'
        style={{
          paddingTop: 20,
          paddingBottom: 20,
          backgroundColor: 'var(--white-color)',
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
                key={index}
                value={order.id.toString()}
                style={{
                  backgroundColor: '#FAF9FF',
                  border: `1px solid var(--border-color)`,
                  marginBottom: isLast ? 0 : 4,
                }}
              >
                {/* Trigger */}
                <Accordion.Trigger
                  style={{
                    flexDirection: 'column',
                    width: '100%',
                    display: 'flex',
                    padding: 20,
                  }}
                >
                  <div
                    className='row-center-space-between'
                    style={{width: '100%', marginBottom: 3}}
                  >
                    <h5>#{order.id}</h5>
                    {order.status === 'shipping' && <svg.WaySvg />}
                    {order.status === 'delivered' && <svg.DeliveredSvg />}
                    {order.status === 'canceled' && <svg.CanceledSvg />}
                  </div>
                  <div
                    className='row-center-space-between'
                    style={{width: '100%'}}
                  >
                    <span className='t12'>{order.date}</span>
                    <span
                      className='t12'
                      style={{fontWeight: 700, color: 'var(--main-color)'}}
                    >
                      ${order.total}
                    </span>
                  </div>
                </Accordion.Trigger>
                {/* Content */}
                <Accordion.Content
                  style={{
                    padding: 20,
                    borderTop: `1px solid var(--border-color)`,
                  }}
                >
                  {order.products.map(
                    (
                      item: ProductType,
                      index: number,
                      array: ProductType[],
                    ) => {
                      const isLast = index === array.length - 1;
                      return (
                        <div key={index}>
                          <div
                            style={{
                              width: '100%',
                              marginBottom: isLast ? 6 : 6,
                            }}
                            className='row-center-space-between'
                          >
                            <span className='t14'>
                              {item.name}, {item.size}, {item.color}
                            </span>
                            <span className='t14'>
                              {item.quantity} x {item.price}
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                  <div className='row-center-space-between'>
                    <span className='t14'>Discount</span>
                    <span className='t14'>-$0</span>
                  </div>
                  <div
                    className='row-center-space-between'
                    style={{marginTop: 30}}
                  >
                    <button>
                      <svg.RepeatOrderSvg />
                    </button>
                    <span
                      className='t14 clickable'
                      style={{color: 'var(--accent-color)'}}
                      onClick={() => navigate(Routes.LeaveAReviews)}
                    >
                      Leave a review
                    </span>
                  </div>
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
