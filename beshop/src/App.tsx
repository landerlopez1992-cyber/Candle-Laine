import {useSelector} from 'react-redux';
import {StackNavigator} from './navigation/StackNavigator';

import {RootState} from './store';

function App() {
  const color = useSelector((state: RootState) => state.bgSlice.color);

  return (
    <div
      className='app'
      style={{backgroundColor: color}}
    >
      <StackNavigator />
    </div>
  );
}

export default App;
