import React, { FC } from 'react';
import styled from 'styled-components';
import AppBackground from '../../../assets/images/appBg.png';

const AppContainer: FC = (): JSX.Element => {
  return (
    <Container>
      <BgColor />
    </Container>
  );
};

const Container = styled.div`
  background-image: url(${AppBackground});
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  margin: auto;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;
const BgColor = styled.div`
  position: fixed;
  background-color: rgba(38, 38, 40, 0.95);
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export default AppContainer;
