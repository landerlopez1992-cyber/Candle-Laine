import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {CartSync} from './components/CartSync';

import {Provider} from 'react-redux';
import {store} from './store';

import 'swiper/css';
import './scss/_index.scss';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <CartSync />
      <App />
    </Provider>
  </React.StrictMode>,
);
