import {createSlice} from '@reduxjs/toolkit';

export type BGState = {
  color: string;
};

const initialState: BGState = {
  color: '#fff',
};

export const bgSlice = createSlice({
  name: 'bg',
  initialState,
  reducers: {
    setColor: (state, action) => {
      state.color = action.payload;
    },
  },
});

export const {setColor} = bgSlice.actions;
