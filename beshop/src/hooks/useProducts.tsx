import {useState, useEffect} from 'react';
import axios from 'axios';

import {URLS} from '../config';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const getProducts = async () => {
    setProductsLoading(true);

    try {
      const response = await axios.get(URLS.GET_PRODUCTS);
      setProducts(response.data.products);
    } catch (error) {
      console.error(error);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  return {productsLoading, products};
};
