import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {StackNavigator} from './navigation/StackNavigator';
import {AppSplash, APP_SPLASH_DURATION_MS} from './components/AppSplash';

import {RootState} from './store';

function App() {
  const color = useSelector((state: RootState) => state.bgSlice.color);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSplashVisible(false);
    }, APP_SPLASH_DURATION_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      className='app'
      style={{backgroundColor: color}}
    >
      <StackNavigator />
      {splashVisible ? <AppSplash /> : null}
    </div>
  );
}

export default App;
