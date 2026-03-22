import {useState, useEffect} from 'react';
import axios from 'axios';

import {URLS} from '../config';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const getCategories = async () => {
    setCategoriesLoading(true);

    try {
      const response = await axios.get(URLS.GET_CATEGORIES);
      setCategories(response.data.categories);
    } catch (error) {
      console.error(error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  return {categoriesLoading, categories};
};
