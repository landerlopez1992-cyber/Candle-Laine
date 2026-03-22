import {useState, useEffect} from 'react';
import axios from 'axios';

import {URLS} from '../config';

export const useBanners = () => {
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  const getProducts = async () => {
    setBannersLoading(true);

    try {
      const response = await axios.get(URLS.GET_BANNERS);
      setBanners(response.data.banners);
    } catch (error) {
      console.error(error);
    } finally {
      setBannersLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  return {bannersLoading, banners};
};
