import {useState, useEffect} from 'react';
import axios from 'axios';

import {URLS} from '../config';

export const useReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const getProducts = async () => {
    setReviewsLoading(true);

    try {
      const response = await axios.get(URLS.GET_REVIEWS);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error(error);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  return {reviewsLoading, reviews};
};
