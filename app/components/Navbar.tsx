import React, { FC } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import styled from 'styled-components';
import VectorIcon from '../../assets/images/vectorIcon.png';

interface NavBarProps {
  logo: string;
  logout?: () => void;
  login?: () => void;
  isAuthorized: boolean;
}

const NavBar: FC<NavBarProps> = ({
  logo,
  isAuthorized,
  login,
  logout,
}: NavBarProps): JSX.Element => {
  return (
    <Container>
      <Navbar expand="lg" className="fixed-top">
        <Navbar.Brand href="/">
          <Logo src={logo} alt="logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="mr-1">
            {!isAuthorized ? (
              <LoginButton
                onClick={login}
                onKeyPress={login}
                role="button"
                tabIndex={0}
              >
                <span className="badgeIcon">
                  <img src={VectorIcon} alt="bookmark" />
                </span>
                <LoginTxt>Login</LoginTxt>
              </LoginButton>
            ) : (
              <LogoutButton
                onClick={logout}
                onKeyPress={logout}
                role="button"
                tabIndex={0}
              >
                <i className="fa fa-sign-out" />
                <LogoutTxt>Logout</LogoutTxt>
              </LogoutButton>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </Container>
  );
};

const Container = styled.div`
  .fixed-top {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 1030;
    box-shadow: 0px 1px 15px rgba(0, 0, 0, 0.6);
  }
  .navbar {
    background-color: rgba(38, 38, 40, 1);
  }
  .navbar-toggler.collapsed {
    background-color: ${({ theme }): string => theme.white};
  }
`;
const LoginButton = styled.div`
  z-index: 1;
  cursor: pointer;
  display: flex;
  background-color: ${({ theme }): string => theme.green};
  padding: 10px 20px 10px 20px;
  margin: 0.5rem 0;
  outline: none;
  flex-direction: row;
  align-items: center;
  border-radius: 10px;
  .badgeIcon {
    background-color: ${({ theme }): string => theme.white};
    width: 25px;
    height: 25px;
    border-radius: 15px;
    display: inline-block;
    text-align: center;
    margin-right: 10px;
  }
`;

const LoginTxt = styled.div`
  color: ${({ theme }): string => theme.white};
  font-weight: bold;
  cursor: pointer;
  outline: none;
  padding
`;

const LogoutButton = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 25px;
  padding: 4px 12px;
  margin: 0.5rem 0;
  outline: none;
  width: 105px;
  background-color: ${({ theme }): string => theme.white};
  .fa {
    background-color: ${({ theme }): string => theme.primary};
    color: ${({ theme }): string => theme.white};
    width: 30px;
    height: 30px;
    border-radius: 15px;
    margin: 0 0.2rem;
    margin-left: -10px;
    text-align: center;
    padding: 6px 9px;
  }
`;

const LogoutTxt = styled.span`
  color: ${({ theme }): string => theme.primary};
  padding-left: 5px;
`;
const Logo = styled.img`
  width: 100px;
`;
const AppLink = styled.a`
  padding: 0 0.5rem;
  text-align: center;
  margin: 0.2rem 0;
  img {
    width: 150px;
  }
`;

export default NavBar;
