/* eslint-disable react/jsx-one-expression-per-line */
// @ts-nocheck
import React, { FC, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Table, Image, Modal } from 'react-bootstrap';
import { Spinner } from 'react-bootstrap';
import styled from 'styled-components';
import _ from 'lodash';
import { useToasts } from 'react-toast-notifications';
import moment from 'moment';
import getSymbolFromCurrency from 'currency-symbol-map';

import AppContainer from '../components/common/AppContainer';
import { actions as AuthActions } from '../../redux/reducers/AuthReducer';
import {
  actions as SubscriptionActions,
  constants,
} from '../../redux/reducers/SubscriptionReducer';
import { RootState } from '../../redux/reducers/RootReducer';
import Logo from '../../assets/images/logo.png';
import '../../assets/css/payment.scss';
import LoginModal from '../components/LoginModal';
import { fireLogin, anonymousSignin } from '../../hooks/useProfile';
import { Firebase } from '../../utils/firebase';
import Navbar from '../components/Navbar';
import { config } from '../../utils/config';
import { getUserLocation } from '../../utils/Location';
const publicIp = require('public-ip');

const Payment: FC = (): JSX.Element => {
  const authState = useSelector((state: RootState) => state.auth);
  const subscriptionState = useSelector(
    (state: RootState) => state.subscription
  );
  const {
    isLoading,
    isError,
    errorMessage,
    isSuccess,
    successMessage,
    subscription,
    plans,
    subscriptionId,
    isSubscribed,
    isPaymentDone,
    showBraintreeModal,
    showRazorpayModal,
  } = subscriptionState;

  const { isLogin, currentUser, location, clientToken } = authState;
  const dispatch = useDispatch();

  const [selectedPlan, setSelectedPlan] = useState(
    subscription ? subscription.planId : ''
  );
  const [googleProvider] = useState(new Firebase.auth.GoogleAuthProvider());
  const [fbProvider] = useState(new Firebase.auth.FacebookAuthProvider());
  const [showModal, setShowModal] = useState(false);
  const { addToast } = useToasts();
  const submitButtonRef = useRef(null);
  // const [registeredPlan, setRegisteredPlan] = useState(
  //   plans.find((a: any) => a.id === selectedPlan) || []
  // );

  // useEffect(() => {
  //   dispatch(AuthActions.getUserLocation());
  // }, []);

  useEffect(async () => {
    dispatch(AuthActions.getUserLocation({
      ipAddress: await publicIp.v4()
    }));
  }, []);

  // useEffect(() => {
  //   setRegisteredPlan(plans.find((a: any) => a.id === selectedPlan));
  // }, [selectedPlan, plans]);

  useEffect(() => {
    if (location) {
      dispatch(
        SubscriptionActions.fetchPlans({ countryCode: location.countryCode })
      );
    }
  }, [location]);

  useEffect(() => {
    if (subscription) {
      setSelectedPlan(subscription.planId);
    }
  }, [subscription]);

  const toggleShowModal = (): void => {
    setShowModal(!showModal);
  };

  useEffect(() => {
    if (isError) {
      addToast(errorMessage, {
        appearance: 'error',
        autoDismiss: true,
      });
      dispatch(SubscriptionActions.clearSubscriptionError());
    }
  }, [isError]);

  useEffect(() => {
    if (isSuccess) {
      addToast(successMessage, {
        appearance: 'success',
        autoDismiss: true,
      });
      dispatch(SubscriptionActions.clearSuccessMessage());
    }
  }, [isSuccess]);

  useEffect(() => {
    if (showRazorpayModal && isLogin) {
      var options = {
        key: config.razorpay.key,
        subscription_id: subscription.subscriptionId,
        name: 'Eppo Music',
        description: 'Subscription Plan Payment',
        prefill: {
          'name': currentUser.firstName + ' ' + currentUser.lastName,
          "email": currentUser.email,
        },
        handler: function (response) {
          // console.log(response);
          dispatch(
            SubscriptionActions.updateRazorpayPaymentDetails({
              paymentId: response.razorpay_payment_id,
              paymentSignature: response.razorpay_signature,
              userId: currentUser.uid,
            })
          );
        },
        modal: {
          ondismiss: function () {
            dispatch(SubscriptionActions.toggleRazorpayPopUp());
          },
        },
      };
      let rzp1 = new Razorpay(options);
      rzp1.open();
    }
  }, [showRazorpayModal, subscription]);

  const googleLogin = (): void => {
    googleProvider.addScope('email');
    fireLogin({
      setShowModal,
      dispatch,
      provider: googleProvider,
      countryCode: location.countryCode,
    });
  };

  const fbLogin = (): void => {
    fbProvider.addScope('email');
    fireLogin({
      setShowModal,
      dispatch,
      provider: fbProvider,
      countryCode: location.countryCode,
    });
  };

  const logout = (): void => {
    dispatch(AuthActions.logOut());
    dispatch(SubscriptionActions.clearSubscription());
    addToast('Logged out successfully', {
      appearance: 'success',
      autoDismiss: true,
    });
  };

  const updateSelectedCard = (id: string) => {
    setSelectedPlan(id);
  };

  const startFreeTrial = () => {
    if (!isLogin) {
      addToast('Please login to start with the trial.', {
        appearance: 'info',
        autoDismiss: true,
      });
      return;
    } else {
      dispatch(
        SubscriptionActions.setUserSubscription({
          trialStartDate: moment().format('x'),
          trialEndDate: moment()
            .add(config.trialPeriodInDays, 'days')
            .startOf('day')
            .format('x'),
          userId: currentUser.uid,
          subscriptionHistory: [
            {
              typeId: 1, // TRIAL_PERIOD_STARTED
              trialStartDate: moment().format('x'),
              trialEndDate: moment()
                .add(config.trialPeriodInDays, 'days')
                .startOf('day')
                .format('x'),
            },
          ],
        })
      );
    }
  };

  const handlePayment = () => {
    if (!isLogin) {
      addToast('Please login to start with the trial.', {
        appearance: 'info',
        autoDismiss: true,
      });
      return;
    }
    if (selectedPlan === '') {
      addToast('Please select a membership plan.', {
        appearance: 'info',
        autoDismiss: true,
      });
      return;
    }
    if (
      subscription.subscriptionId === '' ||
      subscription.subscriptionId === undefined
    ) {
      let userSelectedPlan = plans.find((a) => a.id === selectedPlan);
      let startDate: Number = 0;
      let endDate: Number = 0;
      if (subscription && subscription.trialEndDate !== 0) {
        startDate = moment(Number(subscription.trialEndDate))
          .add(1, 'days')
          .startOf('day');
      } else {
        startDate = moment()
          .add(config.trialPeriodInDays, 'days')
          .startOf('day');
      }

      if (userSelectedPlan) {
        endDate = moment(startDate)
          .add(userSelectedPlan.interval * 30, 'days')
          .endOf('day');
        dispatch(
          SubscriptionActions.subscribeUserToPlan({
            planId: selectedPlan,
            price: userSelectedPlan.price,
            startDate: moment(startDate).format('x'),
            expireDate: moment(endDate).format('x'),
            userId: currentUser.uid,
            planName: userSelectedPlan.name,
            interval:
              _.lowerCase(userSelectedPlan.planName) === 'yearly'
                ? 12
                : userSelectedPlan.interval,
            currency: userSelectedPlan.currency,
            countryCode: location.countryCode,
            startImmediately: config.trialPeriodInDays === 0 ? true : false,
          })
        );
      } else {
        addToast('Please select a subscription plan.', {
          appearance: 'info',
          autoDismiss: true,
        });
        return;
      }
    } else {
      dispatch(SubscriptionActions.toggleRazorpayPopUp());
    }
  };

  const handleBraintreePayment = () => {
    if (!isLogin) {
      addToast('Please login to start with the trial.', {
        appearance: 'info',
        autoDismiss: true,
      });
      return;
    }
    if (selectedPlan === '') {
      addToast('Please select a membership plan.', {
        appearance: 'info',
        autoDismiss: true,
      });
      return;
    }

    let userSelectedPlan = plans.find((a) => a.id === selectedPlan);
    let startDate: Number = 0;
    let endDate: Number = 0;
    if (subscription && subscription.trialEndDate !== 0) {
      startDate = moment(Number(subscription.trialEndDate))
        .add(1, 'days')
        .startOf('day');
    } else {
      startDate = moment().add(config.trialPeriodInDays, 'days');
    }
    if (!userSelectedPlan) {
      addToast('Please select a subscription plan.', {
        appearance: 'info',
        autoDismiss: true,
      });
      return;
    } else {
      dispatch(SubscriptionActions.toggleBraintreePopUp());
      endDate = moment(startDate)
        .add(userSelectedPlan.interval * 30, 'days')
        .endOf('day');
      if (selectedPlan !== subscription.planId) {
        dispatch(
          SubscriptionActions.updateUserSubscription({
            planId: selectedPlan,
            price: userSelectedPlan.price,
            startDate: startDate.format('x'),
            endDate: endDate.format('x'),
            userId: currentUser.uid,
            planName: userSelectedPlan.name,
            currency: userSelectedPlan.currency,
          })
        );
      }
      braintree.dropin.create(
        {
          authorization: clientToken,
          selector: '#dropin-container',
          orderTotal: userSelectedPlan.price,
          currency: 'USD',
        },
        function (err, dropinInstance) {
          if (err) {
            console.error(err);
            return;
          }
          submitButtonRef.current.addEventListener('click', function () {
            dropinInstance.requestPaymentMethod(function (err, payload) {
              // console.log("payloadNonce", payload);
              if (err) {
                dispatch(
                  SubscriptionActions.setBraintreePaymentNonceError({
                    message: 'Something went wrong. Please try again later.',
                  })
                );
                return;
              }
              dispatch(
                SubscriptionActions.setBraintreePaymentNonce({
                  nonce: payload.nonce,
                  planId: selectedPlan,
                  startDate: startDate,
                  firstName: currentUser.firstName,
                  lastName: currentUser.lastName,
                  email: currentUser.email,
                  userId: currentUser.uid,
                })
              );
            });
          });
        }
      );
    }
  };

  const cancelRazorpaySubscription = () => {
    dispatch(
      SubscriptionActions.cancelRazorpaySubscription({
        userId: currentUser.uid,
        subscriptionId: subscription.subscriptionId,
      })
    );
  };

  const cancelBraintreeSubscription = () => {
    dispatch(
      SubscriptionActions.cancelBraintreeSubscription({
        userId: currentUser.uid,
        subscriptionId: subscription.subscriptionId,
      })
    );
  };

  const updateBraintreeSubscription = () => {
    if (selectedPlan === subscription.planId) {
      addToast('You are already subscribed to this plan', {
        appearance: 'info',
        autoDismiss: true,
      });
      return;
    }
    let userSelectedPlan = plans.find((a) => a.id === selectedPlan);
    if (userSelectedPlan) {
      dispatch(
        SubscriptionActions.updateBraintreeSubscription({
          userId: currentUser.uid,
          planId: selectedPlan,
          planName: userSelectedPlan.name,
          price: userSelectedPlan.price,
          nonce: subscription.paymentMethodToken,
          subscriptionId: subscription.subscriptionId,
          startDate: moment(Number(subscription.endDate))
            .add(1, 'days')
            .startOf('day')
            .toISOString(),
          endDate: moment(Number(subscription.endDate))
            .add(userSelectedPlan.interval * 30, 'days')
            .endOf('day')
            .format('x'),
          previousPlanId: subscription.planId,
        })
      );
    }
  };

  const updateRazorpaySubscription = () => {
    if (selectedPlan === subscription.planId) {
      addToast('You are already subscribed to this plan', {
        appearance: 'info',
        autoDismiss: true,
      });
      return;
    }
    let userSelectedPlan = plans.find((a) => a.id === selectedPlan);
    // console.log(subscription);
    // console.log(moment(Number(subscription.endDate)).format('x'));
    dispatch(
      SubscriptionActions.updateRazorpaySubscription({
        userId: currentUser.uid,
        planId: selectedPlan,
        subscriptionId: subscription.subscriptionId,
        interval:
          _.lowerCase(userSelectedPlan.planName) === 'yearly'
            ? 12
            : userSelectedPlan.interval,
        planName: userSelectedPlan.name,
        price: userSelectedPlan.price,
        previousPlanId: subscription.planId,
        endDate: moment(Number(subscription.endDate))
          .add(userSelectedPlan.interval * 30, 'days')
          .endOf('day')
          .format('x'),
      })
    );
  };

  return (
    <>
      <LoginModal
        {...{ showModal, setShowModal, article: null, googleLogin, fbLogin }}
      />
      <Modal
        show={showBraintreeModal}
        onHide={(): void =>
          dispatch(SubscriptionActions.toggleBraintreePopUp())
        }
        dialogClassName="modal-40w"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter align-center">
            Confirm Subscription
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="lgBody">
          Total Payable - $
          {plans && plans.length > 0 &&
            plans.find((a) => a.id === selectedPlan) &&
            plans.find((a) => a.id === selectedPlan).price}
          <BraintreeDropInContainer id="dropin-container" />
          <Button
            variant="primary"
            size="md"
            id="submit-button"
            ref={submitButtonRef}
          >
            Request Payment Method
          </Button>
        </Modal.Body>
      </Modal>

      <Container>
        <AppContainer />
        <Navbar
          login={toggleShowModal}
          logout={logout}
          logo={Logo}
          isAuthorized={isLogin}
        />
        <Card style={{ width: '90%', borderRadius: 10 }}>
          <Card.Body>
            <Card.Title
              style={{
                textAlign: 'center',
                fontWeight: '700',
                fontSize: 28,
                marginTop: 20,
                marginBottom: 20,
              }}
            >
              {isPaymentDone
                ? 'Payment Plans'
                : subscription &&
                  subscription.trialEndDate !== 0 &&
                  moment().startOf('day').format('x') >
                  moment(Number(subscription.trialEndDate))
                    .startOf('day')
                    .format('x')
                  ? 'Trial Period Expired'
                  : 'Payment Plans'}
            </Card.Title>
            <Card.Text className="subTitle">
              {!isPaymentDone && 'Choose a subscription plan to unlock all the'}
            </Card.Text>
            <Card.Text className="subTitle">
              {!isPaymentDone && 'content of the application'}
            </Card.Text>
            <Table borderless className="memberPlansTable">
              <thead>
                <tr>
                  {plans && plans.length > 0 &&
                    plans.map((a) => {
                      return (
                        <td className="membership-col" key={a.id}>
                          <Card
                            className={
                              a.id == selectedPlan
                                ? 'activeMembershipPlanCard'
                                : 'membershipPlanCard'
                            }
                            key={a.id}
                            onClick={() =>
                              config.trialPeriodInDays === 0 ||
                                (subscription && subscription.trialEndDate !== 0)
                                ? updateSelectedCard(a.id)
                                : {}
                            }
                          >
                            <Card.Body>
                              <Table hover responsive>
                                <thead>
                                  <tr>
                                    <td className="plan-col-1">
                                      <Card.Title className="plan-title">
                                        {a.name} Plan
                                      </Card.Title>
                                      <tr>
                                        <td>
                                          <Card.Title className="plan-subtitle">
                                            {getSymbolFromCurrency(a.currency)}
                                            {_.round(a.price, 2)}
                                          </Card.Title>
                                        </td>
                                        <td>
                                          <Card.Title className="plan-subtitle padding-left-3">
                                            {_.lowerCase(a.name) === 'yearly'
                                              ? `billed yearly`
                                              : `billed every ${a.interval} ${a.interval > 1
                                                ? 'months'
                                                : 'month'
                                              }`}
                                          </Card.Title>
                                        </td>
                                      </tr>
                                    </td>
                                    <td className="plan-col-2">
                                      <tr className="plan-price-breakdown">
                                        <td>
                                          <Card.Title className="plan-currency">
                                            {getSymbolFromCurrency(a.currency)}
                                          </Card.Title>
                                        </td>
                                        <td>
                                          <Card.Title className="plan-price">
                                            {_.lowerCase(a.name) === 'yearly'
                                              ? _.round(a.price / 12, 2)
                                              : _.round(
                                                a.price / a.interval,
                                                2
                                              )}
                                          </Card.Title>
                                        </td>
                                        <td>
                                          <Card.Title className="plan-monthly">
                                            /mo
                                          </Card.Title>
                                        </td>
                                      </tr>
                                    </td>
                                  </tr>
                                </thead>
                              </Table>
                            </Card.Body>
                          </Card>
                        </td>
                      );
                    })}
                </tr>
              </thead>
            </Table>
            <div className="text-center">
              {config.trialPeriodInDays > 0 &&
                (subscription === undefined ||
                  (subscription && subscription.trialStartDate === 0)) && (
                  <Button
                    variant="success"
                    className="trialButton"
                    size="lg"
                    onClick={startFreeTrial}
                  >
                    Start Free Trial
                  </Button>
                )}
              {(config.trialPeriodInDays === 0 ||
                (subscription.trialStartDate !== 0 &&
                  moment().startOf('day').format('x') <=
                  moment(Number(subscription.trialEndDate))
                    .startOf('day')
                    .format('x'))) &&
                !isPaymentDone &&
                isLogin && (
                  <Button
                    variant="success"
                    className="continueButton"
                    size="lg"
                    onClick={
                      location && location.countryCode === 'US'
                        ? handleBraintreePayment
                        : handlePayment
                    }
                  >
                    Continue with Payment
                  </Button>
                )}
              {isLogin &&
                isPaymentDone &&
                location.countryCode === 'US' &&
                subscription.subscriptionId !== '' &&
                subscription.paymentMethodToken !== '' &&
                !subscription.isSubscriptionCancelled &&
                moment().format('x') >
                moment(Number(subscription.startDate)).format('x') && (
                  <>
                    <Button
                      variant="primary"
                      className="trialButton"
                      size="lg"
                      onClick={updateBraintreeSubscription}
                    >
                      Update Subscription
                    </Button>
                    {/* <Button
                      variant="danger"
                      className="trialButton"
                      size="lg"
                      onClick={cancelBraintreeSubscription}
                    >
                      Cancel Subscription
                    </Button> */}
                  </>
                )}
              {isLogin &&
                isPaymentDone &&
                location.countryCode !== 'US' &&
                subscription.subscriptionId !== '' &&
                subscription.paymentSignature !== '' &&
                moment().format('x') >
                moment(Number(subscription.startDate)).format('x') && (
                  <>
                    <Button
                      variant="primary"
                      className="trialButton"
                      size="lg"
                      onClick={updateRazorpaySubscription}
                    >
                      Update Subscription
                    </Button>
                    {/* <Button
                      variant="danger"
                      className="trialButton"
                      size="lg"
                      onClick={cancelRazorpaySubscription}
                    >
                      Cancel Subscription
                    </Button> */}
                  </>
                )}
            </div>
          </Card.Body>
        </Card>

        {(isLoading || authState.isLoading) && (
          <SpinnerContainer>
            <Spinner
              animation="border"
              variant="light"
              role="status"
              className="spin"
            >
              <span className="sr-only">Loading...</span>
            </Spinner>
          </SpinnerContainer>
        )}
      </Container>
    </>
  );
};

const Container = styled.div`
  flex: 1,
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: center;
  margin-top: 150px;
`;

const SpinnerContainer = styled.div`
  position: fixed;
  height: 100%;
  width: 100%;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.6);
  .spin {
    position: absolute;
    left: 50%;
    top: 50%;
    height: 60px;
    width: 60px;
    margin: 0px auto;
    z-index: 99999;
  }
`;

const AppLogo = styled.img`
  width: 100px;
  margin-top: 3%;
  margin-bottom: 2%;
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
  position: absolute;
  right: 0;
  margin-right: 30px;
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
  position: absolute;
  right: 0;
  margin-right: 30px;
`;

const HeaderView = styled.div`
  flex-direction: row;
  z-index: 1;
  display: flex;
  margin: 30px 0 30px 0;
`;

const LogoutTxt = styled.span`
  color: ${({ theme }): string => theme.primary};
  padding-left: 5px;
`;

const BraintreeDropInContainer = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
`;

export default Payment;
