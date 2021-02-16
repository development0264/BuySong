/* eslint-disable react/jsx-one-expression-per-line */
// @ts-nocheck
import React, { FC } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import AppContainer from '../components/common/AppContainer';

const NotFound: FC = (): JSX.Element => {
  const history = useHistory();
  const gotToHome = (): void => {
    history.replace({
      pathname: `/`,
    });
  };
  return (
    <Container className="notFoundContainer">
      <AppContainer />
      <div className="notFoundBody">
        <h1>Oops!</h1>
        <h2>404 Not Found</h2>
        <p>Sorry, an error has occured, Requested page not found!</p>
        <Button onClick={gotToHome}>
          <i className="fa fa-home" /> Take Me Home
        </Button>
      </div>
    </Container>
  );
};

export default NotFound;
