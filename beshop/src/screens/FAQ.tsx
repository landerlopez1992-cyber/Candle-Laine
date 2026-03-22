import React, {useEffect, useState} from 'react';
import * as Accordion from '@radix-ui/react-accordion';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {actions} from '../store/actions';
import {components} from '../components';

const faqData = [
  {
    id: 1,
    question: 'What is the return policy?',
    answer:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    id: 2,
    question: 'How do I track my order?',
    answer:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    id: 3,
    question: 'How do I cancel my order?',
    answer:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    id: 4,
    question: 'How do I return an item?',
    answer:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    id: 5,
    question: 'How do I exchange an item?',
    answer:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    id: 6,
    question: 'How do I return a broken item?',
    answer:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
];

export const FAQ: React.FC = () => {
  hooks.useThemeColor('#FCEDEA');
  const dispatch = hooks.useDispatch();

  const [openItem, setOpenItem] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='FAQ'
        showGoBack={true}
        headerStyle={{backgroundColor: '#FCEDEA'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{
          backgroundColor: 'var(--white-color)',
          padding: 20,
        }}
      >
        <Accordion.Root
          type='single'
          collapsible={true}
        >
          {faqData.map((item: any, index, array) => {
            const isOpen = openItem === item.id;

            const isLast = index === array.length - 1;

            return (
              <Accordion.Item
                key={item.id.toString()}
                value={item.id.toString()}
                style={{
                  backgroundColor: '#fff',
                  marginBottom: isLast ? 0 : 4,
                  border: '1px solid var(--border-color)',
                }}
                onClick={() => setOpenItem(isOpen ? null : item.id)}
              >
                {/* Trigger */}
                <Accordion.Trigger
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    display: 'flex',
                    padding: 20,
                    justifyContent: 'space-between',
                  }}
                >
                  <h5>{item.question}</h5>
                  {isOpen ? <svg.OpenSvg /> : <svg.OpenArrowSvg />}
                </Accordion.Trigger>
                {/* Content */}
                <Accordion.Content
                  style={{paddingLeft: 20, paddingRight: 20, paddingBottom: 20}}
                >
                  <p className='t16'>{item.answer}</p>
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
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
