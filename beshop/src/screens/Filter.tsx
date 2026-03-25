import React, {useEffect} from 'react';
import {Action} from 'redux';
import {ThunkDispatch} from 'redux-thunk';
import {useDispatch, useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {RootState} from '../store';
import {components} from '../components';
import {actions} from '../store/actions';

import {setSelectedTags} from '../store/slices/filterSlice';
import {setSelectedColors} from '../store/slices/filterSlice';
import {setSelectedCategories} from '../store/slices/filterSlice';

import type {ColorType} from '../types';
import { APP_PALETTE } from '../theme/appPalette';

const labels = ['sale', 'top', 'new'];

export const Filter: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<RootState, void, Action>>();

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const {productsLoading, products} = hooks.useProducts();

  const isLoading = productsLoading;

  const uniqueTags = hooks.useUniqueTags(products);
  const uniqueColors = hooks.useUniqueColors(products);

  const {selectedColors, selectedTags, selectedCategories} = useSelector(
    (state: RootState) => state.filterSlice,
  );

  const handleColorClick = (color: ColorType) => {
    if (selectedColors.includes(color.name)) {
      dispatch(
        setSelectedColors(
          selectedColors.filter(
            (selectedColor) => selectedColor !== color.name,
          ),
        ),
      );
    } else {
      dispatch(setSelectedColors([...selectedColors, color.name]));
    }
  };

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      dispatch(
        setSelectedTags(
          selectedTags.filter((selectedTag) => selectedTag !== tag),
        ),
      );
    } else {
      dispatch(setSelectedTags([...selectedTags, tag]));
    }
  };

  const handleCategoryClick = (category: string) => {
    if (selectedCategories.includes(category)) {
      dispatch(
        setSelectedCategories(
          selectedCategories.filter(
            (selectedCategory) => selectedCategory !== category,
          ),
        ),
      );
    } else {
      dispatch(setSelectedCategories([...selectedCategories, category]));
    }
  };

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Filter'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderLabels = (): JSX.Element => {
    return (
      <section
        className='container'
        style={{marginTop: 16, marginBottom: 30}}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
          }}
        >
          {labels.map((item, index) => {
            return (
              <span
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginRight: 30,
                  cursor: 'pointer',
                }}
                onClick={() => handleCategoryClick(item)}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    border: '1px solid #EEEEEE',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8,
                    backgroundColor: 'var(--white-color)',
                  }}
                >
                  {selectedCategories.includes(item) && <svg.AgeCheckSvg />}
                </div>
                <div
                  style={{
                    margin: 0,
                    padding: '0 10px',
                    display: 'flex',
                    backgroundColor:
                      item === 'sale'
                        ? '#51BA74'
                        : item === 'new'
                        ? '#F5C102'
                        : '#FF6262',
                    textTransform: 'uppercase',
                  }}
                >
                  <span
                    className='t10'
                    style={{
                      lineHeight: 1.7,
                      color: 'var(--white-color)',
                      fontWeight: 700,
                    }}
                  >
                    {item}
                  </span>
                </div>
              </span>
            );
          })}
        </div>
      </section>
    );
  };

  const renderColors = (): JSX.Element => {
    return (
      <section
        style={{marginBottom: 40}}
        className='container row-center'
      >
        <h5 style={{marginRight: 14}}>Color</h5>
        <div
          style={{gap: 10}}
          className='row-center-wrap'
        >
          {uniqueColors.map((color: ColorType) => {
            return (
              <button
                key={color.id}
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: color.code,
                  border: `2px solid ${
                    selectedColors.includes(color.name)
                      ? 'var(--main-color)'
                      : color.code
                  }`,
                }}
                className='clickable'
                onClick={() => handleColorClick(color)}
              ></button>
            );
          })}
        </div>
      </section>
    );
  };

  const renderTags = (): JSX.Element => {
    return (
      <section
        className='container'
        style={{marginBottom: 40}}
      >
        <h5 style={{marginBottom: 12}}>Tags</h5>
        <div
          className='row-center-wrap'
          style={{gap: 8}}
        >
          {uniqueTags.map((tag: string) => {
            return (
              <button
                key={tag}
                style={{
                  padding: '5px 18px',
                  border: `1px solid ${
                    selectedTags.includes(tag)
                      ? 'var(--accent-color)'
                      : 'var(--border-color)'
                  }`,
                  backgroundColor: '#FAF9FF',
                }}
                onClick={() => handleTagClick(tag)}
              >
                <span
                  className='t16'
                  style={{
                    color: selectedTags.includes(tag) ? '#666666' : '',
                    marginTop: 2,
                  }}
                >
                  {tag}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  const renderButton = (): JSX.Element => {
    return (
      <section
        className='container'
        style={{marginBottom: 20}}
      >
        <components.Button
          text='apply filters'
          to='back'
        />
      </section>
    );
  };

  const renderContent = (): JSX.Element => {
    if (isLoading) return <components.Loader />;

    return (
      <main
        className='scrollable'
        style={{
          paddingTop: 20,
          paddingBottom: 20,
          backgroundColor: 'var(--white-color)',
        }}
      >
        {renderColors()}
        {renderLabels()}
        {renderTags()}
        {renderButton()}
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};
