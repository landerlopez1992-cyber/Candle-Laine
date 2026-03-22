import {useState, useEffect} from 'react';
import axios from 'axios';

import {URLS} from '../config';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const getOrders = async () => {
    setOrdersLoading(true);

    try {
      const response = await axios.get(URLS.GET_ORDERS);
      setOrders(response.data.orders);
    } catch (error) {
      console.error(error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    getOrders();
  }, []);

  return {ordersLoading, orders};
};
