import {useState, useEffect, useCallback} from 'react';

import {supabase} from '../supabaseClient';
import type {OrderType} from '../types';
import {mapOrderRowToOrderType, SUPABASE_ORDER_SELECT} from '../utils/orderMap';

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const getOrders = useCallback(async () => {
    setOrdersLoading(true);

    if (!supabase) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    const {
      data: {session},
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    const {data, error} = await supabase
      .from('orders')
      .select(SUPABASE_ORDER_SELECT)
      .eq('user_id', session.user.id)
      .order('created_at', {ascending: false});

    if (error) {
      console.error(error);
      setOrders([]);
    } else {
      setOrders((data ?? []).map((row) => mapOrderRowToOrderType(row)));
    }

    setOrdersLoading(false);
  }, []);

  useEffect(() => {
    void getOrders();
  }, [getOrders]);

  return {ordersLoading, orders, refetchOrders: getOrders};
};
