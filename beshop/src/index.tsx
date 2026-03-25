import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {CartSync} from './components/CartSync';
import {WishlistSync} from './components/WishlistSync';

import {Provider} from 'react-redux';
import {store} from './store';

import 'swiper/css';
import 'swiper/css/pagination';
import './scss/_index.scss';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <CartSync />
      <WishlistSync />
      <App />
    </Provider>
  </React.StrictMode>,
);
