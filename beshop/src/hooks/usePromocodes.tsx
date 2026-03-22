import {useState, useEffect} from 'react';
import axios from 'axios';

import {URLS} from '../config';

export const usePromocodes = () => {
  const [promocodes, setPromocodes] = useState([]);
  const [promocodesLoading, setPromocodesLoading] = useState(true);

  const getPromocodes = async () => {
    setPromocodesLoading(true);

    try {
      const response = await axios.get(URLS.GET_PROMOCODES);
      setPromocodes(response.data.promocodes);
    } catch (error) {
      console.error(error);
    } finally {
      setPromocodesLoading(false);
    }
  };

  useEffect(() => {
    getPromocodes();
  }, []);

  return {promocodesLoading, promocodes};
};
