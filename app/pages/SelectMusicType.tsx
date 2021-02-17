/* eslint-disable react/jsx-one-expression-per-line */
// @ts-nocheck
import React, { FC, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Table, Modal } from 'react-bootstrap';
import { Spinner } from 'react-bootstrap';
import styled from 'styled-components';
import _ from 'lodash';
import { useToasts } from 'react-toast-notifications';
import moment from 'moment';
import getSymbolFromCurrency from 'currency-symbol-map';

import AppContainer from '../components/common/AppContainer';
import { actions as AuthActions } from '../../redux/reducers/AuthReducer';
import { actions as playerActions } from '../../redux/reducers/PlayerReducer';
import {
    actions as EventRedActions,
    constants,
} from '../../redux/reducers/EventReducer';
import { actions as SubscriptionActions } from '../../redux/reducers/SubscriptionReducer';
import { RootState } from '../../redux/reducers/RootReducer';
import Image1 from '../../assets/images/Bitmap.png';
import Image2 from '../../assets/images/Bitmap(1).png';
import Image3 from '../../assets/images/Bitmap(2).png';
import Tick from '../../assets/images/tick.png';
import premium_icon from '../../assets/images/premium_icon.png';
import '../../assets/css/payment.scss';
import LoginModal from '../components/LoginModal';
import { fireLogin } from '../../hooks/useProfile';
import { db, Firebase } from '../../utils/firebase';
import Navbar from '../components/Navbar';
import { config } from '../../utils/config';
import { getUserLocation } from '../../utils/Location';
import AppPlayer from './AppPlayer';
import AlbumDetail from './AlbumDetail';
const publicIp = require('public-ip');

const SelectMusicType: FC = (): JSX.Element => {
    const authState = useSelector((state: RootState) => state.auth);
    const subscriptionState = useSelector(
        (state: RootState) => state.subscription
    );

    const eventValue = useSelector((state: RootState) => {
        return state.event;
    });
    const {
        isLoading,
        isError,
        errorMessage,
        isSuccess,
        successMessage,
        event,
        isPaymentDone,
        showBraintreeModal,
        showRazorpayModal,
        premiumContent,
        currencySymbol,
        clientToken,
        reload,
    } = eventValue;
    const { isLogin, currentUser, location } = authState;
    const dispatch = useDispatch();
    // console.log('location', location);
    // const [selectedPlan, setSelectedPlan] = useState(
    //     subscription ? subscription.planId : ''
    // );
    const [googleProvider] = useState(new Firebase.auth.GoogleAuthProvider());
    const [fbProvider] = useState(new Firebase.auth.FacebookAuthProvider());
    const [showModal, setShowModal] = useState(false);
    const { addToast } = useToasts();
    const submitButtonRef = useRef(null);
    var finalPrice = 0;
    const [userSelectedPlan, setUserSelectedPlan] = useState();
    const [userSelectedPlanBraintree, setUserSelectedPlanBraintree] = useState();

    const [finalPriceforPayment, setfinalPriceforPayment] = useState();
    const [albumId, setalbumId] = useState();
    const [activeAlbum, setActiveAlbum] = useState<any>();
    const [albumListView, setAlbumListView] = useState<boolean>(true);
    const [ipAddress, setipAddress] = useState();
    // const [registeredPlan, setRegisteredPlan] = useState(
    //   plans.find((a: any) => a.id === selectedPlan) || []
    // );

    useEffect(() => {
        var isRefreshed = true;
        if (window.performance) {
            if (performance.navigation.type == 1) {
                isRefreshed = true;
            } else {
                isRefreshed = false;
                dispatch(AuthActions.logOut());
                dispatch(playerActions.addSongs({ contents: [], index: 0 }));
                dispatch(EventRedActions.clearEvent());
            }
        }
    }, []);

    useEffect(async () => {
        dispatch(AuthActions.getUserLocation({
            ipAddress: await publicIp.v4()
        }));
    }, []);

    useEffect(() => {
        if (location)
            dispatch(
                EventRedActions.fetchPremiumContent({
                    countryCode: location.countryCode,
                    uid: currentUser.uid,

                })
            );
    }, [location]);

    useEffect(async () => {
        db.collection('EMS-UserPremiumContent').onSnapshot((snap) => {
            console.log("SNAP SHOT ==> ", snap.docChanges());
            if (location)
                dispatch(
                    EventRedActions.fetchPremiumContent({
                        countryCode: location.countryCode,
                        uid: currentUser.uid,
                    })
                );
        })
    }, [])

    useEffect(() => {
        console.log("reload", reload);
        if (reload == true) {
            refreshPage();
            eventValue.reload = false;
        }
    }, [reload]);


    useEffect(() => {
        if (location)
            dispatch(
                EventRedActions.getCurrencySymbol({
                    'countryCode': location.countryCode
                })
            );
    }, [location]);

    useEffect(() => {
        if (isLogin) {
            dispatch(
                AuthActions.getUserProfile({
                    id: currentUser.id,
                    countryCode: location.countryCode,
                })
            );
        }
    }, [isLogin]);

    useEffect(() => {
        if (isLogin) {
            dispatch(
                EventRedActions.fetchPremiumContent({
                    countryCode: location.countryCode,
                    uid: currentUser.uid,
                })
            );
        }
    }, [isLogin]);

    const toggleShowModal = (): void => {
        setShowModal(!showModal);
    };

    useEffect(() => {
        if (isError) {
            addToast(errorMessage, {
                appearance: 'error',
                autoDismiss: true,
            });
            dispatch(EventRedActions.clearEventError());
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
        // console.log('USER SELECTED ==> ', finalPriceforPayment);
        // alert(userSelectedPlan && userSelectedPlan.priceData.pricing[0].code);
        if (showRazorpayModal && isLogin && userSelectedPlan && event.response) {
            // console.log('Order->ID', event.response, userSelectedPlan);
            var options = {
                key: config.razorpay.key,
                name: userSelectedPlan.albumData.title,
                amount: finalPriceforPayment * 100,
                order_id: event.response.id,
                description: userSelectedPlan.albumData.recordingType,
                prefill: {
                    'name': currentUser.firstName + ' ' + currentUser.lastName,
                    "email": currentUser.email,
                },
                handler: function (response) {
                    console.log('inRazorpYa', response);

                    addToast('Purchased is made successfully. Enjoy premium content', {
                        appearance: 'success',
                        autoDismiss: true,
                    });
                    dispatch(
                        EventRedActions.addRazorpayOrder({
                            albumId: userSelectedPlan.priceData.albumId,
                            countryCode: location.countryCode,
                            transactionId: event.response.id,
                            uid: currentUser.uid,
                            currency: event.response.currency
                        })
                    );
                    dispatch(
                        EventRedActions.fetchPremiumContent({
                            countryCode: location.countryCode,
                            uid: currentUser.uid,
                        })
                    );
                    // refreshPage();
                },
                modal: {
                    ondismiss: async () => {
                        const snapshot = await db.collection('EMS-UserPremiumContent').where('transactionId', '==', event.response.id).get();
                        // console.log(snapshot);
                        if (snapshot.docs.length) {
                            const doc = snapshot.docs[0];
                            console.log("firebase", doc.id);
                            db.collection('EMS-UserPremiumContent').doc(doc.id).delete().then((data) => {
                                // console.log(data);
                            });
                        }
                        dispatch(EventRedActions.toggleRazorpayPopUp());
                    },
                },
            };
            let rzp1 = new Razorpay(options);


            rzp1.open();
        }
    }, [showRazorpayModal, event, userSelectedPlan, finalPriceforPayment]);

    useEffect(() => {
        if (clientToken) {
            // console.log('Token', clientToken);
            dispatch(EventRedActions.toggleBraintreePopUp());
            braintree.dropin.create(
                {
                    authorization: clientToken,
                    selector: '#dropin-container',
                    orderTotal: finalPrice,
                    currency: 'USD',
                },
                function (err, dropinInstance) {
                    submitButtonRef.current.addEventListener('click', function () {
                        dropinInstance.requestPaymentMethod(function (err, payload) {

                            if (err) {
                                // dispatch(
                                //   SubscriptionActions.setBraintreePaymentNonceError({
                                //     message: 'Something went wrong. Please try again later.',
                                //   })
                                // );
                                console.log(err);
                                return;
                            } else {
                                dispatch(
                                    EventRedActions.setBraintreePaymentNonce({
                                        nonce: payload.nonce,
                                        firstName: currentUser.firstName,
                                        lastName: currentUser.lastName,
                                        email: currentUser.email,
                                        uid: currentUser.uid,
                                        countryCode: location.countryCode,
                                        albumId: albumId,
                                    })
                                );
                            }

                        })
                    })
                }
            )
        }

    }, [clientToken, userSelectedPlanBraintree]);


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
        dispatch(playerActions.addSongs({ contents: [], index: 0 }));
        dispatch(EventRedActions.clearEvent());
        addToast('Logged out successfully', {
            appearance: 'success',
            autoDismiss: true,
        });
    };

    const updateSelectedCard = (id: string) => {
        setSelectedPlan(id);
    };

    const handlePayment = (selectedPerformerId) => {
        console.log('handlePayment', selectedPerformerId);
        var isOther = false;
        var currency = '';

        selectedPerformerId.priceData.pricing.map((singlePricing: any) => {
            if (singlePricing.code == 'OT') {
                currency = singlePricing.currency;
            }
        });

        if (!isLogin) {
            setShowModal(!showModal);
            // addToast('Please login to view content.', {
            //     appearance: 'info',
            //     autoDismiss: true,
            // });
            return;
        }
        setUserSelectedPlan(selectedPerformerId);

        // let userSelectedPlan = premiumContent.data.find((a) => a.id === selectedPerformerId);
        // console.log('userSelectedPlan', selectedPerformerId);
        for (var i = 0; i < selectedPerformerId.priceData.pricing.length; i++) {
            if (
                location.countryCode == selectedPerformerId.priceData.pricing[i].code
            ) {
                isOther = true;
                finalPrice = selectedPerformerId.priceData.pricing[i].price;
                currency = selectedPerformerId.priceData.pricing[i].currency;
            }
        }

        setfinalPriceforPayment(finalPrice);
        setalbumId(selectedPerformerId.priceData.albumId);

        console.log("Currency ===> ", currency, location.countryCode);

        dispatch(
            EventRedActions.premiumOrder({
                albumId: selectedPerformerId.priceData.albumId,
                countryCode: isOther == true ? location.countryCode : 'OT',
                uid: currentUser.uid,
                currency: currency,
            })
        );

    };


    const refreshPage = () => {
        console.log("Hello world");
        window.location.reload();
    }

    const handleBraintreePayment = (selectedPerformerId) => {
        if (!isLogin) {
            setShowModal(!showModal);
            return;
        }
        // if (!isLogin) {
        //     addToast('Please login to view content.', {
        //         appearance: 'info',
        //         autoDismiss: true,
        //     });
        //     return;
        // }

        // console.log('user-braintree', selectedPerformerId);

        for (var i = 0; i < selectedPerformerId.priceData.pricing.length; i++) {
            if (location.countryCode == selectedPerformerId.priceData.pricing[i].code) {
                finalPrice = selectedPerformerId.priceData.pricing[i].price;
            }
        }
        setUserSelectedPlanBraintree(selectedPerformerId);
        setfinalPriceforPayment(finalPrice);
        setalbumId(selectedPerformerId.priceData.albumId);
        // console.log("final", finalPrice);
        // userSelectedPlan.priceData

        if (!selectedPerformerId) {
            addToast('Please select a Perfomer.', {
                appearance: 'info',
                autoDismiss: true,
            });
            return;
        } else {
            dispatch(
                EventRedActions.getBraintreeClientToken({
                    userId: currentUser.uid,
                })
            );
        }
    };

    const openPlayer = (): void => {
        // dispatch(playerActions.addSongs({ contents, index }));
    };

    const toggleAlbumView = (data: any): void => {
        if (!isLogin) {
            setShowModal(!showModal);
            // addToast('Please login first to get access.', {
            //     appearance: 'info',
            //     autoDismiss: true,
            // });
            return;
        }
        // console.log('Data is ...', data);
        setActiveAlbum(data.albumData);
        setAlbumListView(false);
    };

    const goBack = (): void => {
        setAlbumListView(true);
    };

    console.log("EVENT STATE ===> ", premiumContent.data);

    return (
        <>
            <LoginModal
                {...{ showModal, setShowModal, article: null, googleLogin, fbLogin }}
            />
            <Modal
                show={showBraintreeModal}
                onHide={(): void => dispatch(EventRedActions.toggleBraintreePopUp())}
                dialogClassName="modal-40w"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter align-center">
                        Confirm Payment
          </Modal.Title>
                </Modal.Header>
                <Modal.Body className="lgBody">
                    Total Payable - ${finalPriceforPayment}
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
                {/* <Navbar
                    login={toggleShowModal}
                    logout={logout}
                    logo={Logo}
                    isAuthorized={isLogin}
                /> */}

                <Card style={{ width: '90%', borderRadius: 10 }}>
                    <Card.Body>
                        <Card.Text className="subTitle">
                            {/* {!isPaymentDone && 'Choose a subscription plan to unlock all the'} */}
                        </Card.Text>
                        <Card.Text className="subTitle">
                            {/* {!isPaymentDone && 'content of the application'} */}
                        </Card.Text>
                        {/* <div className='planselector'>
                            <div className="planselector-1">
                                <Card className={selectedPlan == 'chatra_musicSelect' ? 'activeMembershipPlanCard' : ' TypeSelectingCard'} onClick={() => updateSelectedCard('chatra_musicSelect')}>
                                    <Card.Body>
                                        <Table hover responsive borderless>
                                            <thead >
                                                <tr>
                                                    <Card.Title className="plan-monthly">
                                                        {selectedPlan == "chatra_musicSelect" ? <img src={Tick} alt={'Logo'} className={'tickImage'} /> : null}
                                                    </Card.Title>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <Card.Title className="type_name">Chatra + Music</Card.Title>
                                                    </td>
                                                </tr>
                                            </thead>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </div>
                            <div className="planselector-1">
                                <Card className={selectedPlan == 'musicSelect' ? 'activeMembershipPlanCard' : 'TypeSelectingCard'} onClick={() => updateSelectedCard('musicSelect')}>
                                    <Card.Body>
                                        <Table hover responsive borderless>
                                            <thead >
                                                <tr>
                                                    <Card.Title className="plan-monthly">
                                                        {selectedPlan == "musicSelect" ? <img src={Tick} alt={'Logo'} className={'tickImage'} /> : null}
                                                    </Card.Title>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <Card.Title className="type_name">Music</Card.Title>
                                                    </td>
                                                </tr>
                                            </thead>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </div>
                        </div>
                        <hr /> */}
                        <div className="col-md-12 d-flex align-items-center justify-content-center logo">
                            <div>
                                <img src={premium_icon} alt={'Logo'} />
                            </div>
                            <div className="premium_text ml-2">
                                Premium Content
                            </div>
                        </div>
                        <div>
                            {albumListView ? (
                                premiumContent &&
                                premiumContent.data != undefined &&
                                premiumContent.data.map((data, index) => {
                                    var otherIndex = -1;
                                    var isCountry = false;
                                    return (
                                        <div
                                            className="col-md-4 testClass"
                                            key={index}
                                            onClick={() => {
                                                console.log("DATA ===> ", data.priceData.pricing);
                                                var isOtherFlag = true

                                                data.priceData.pricing.map((singlePricing: any) => {
                                                    if ((singlePricing.code == 'US' && singlePricing.currency == 'USD')
                                                        || (singlePricing.code == 'OT' && singlePricing.currency == 'USD')) {
                                                        isOtherFlag = false;
                                                    }
                                                });

                                                data.isPremium == true && data.purchaseData.status == 'settled'
                                                    ? toggleAlbumView(data)
                                                    : data.purchaseData && data.purchaseData.status == "initiated"
                                                        ? addToast('Please wait for transaction to be completed.', {
                                                            appearance: 'info',
                                                            autoDismiss: true,
                                                        })
                                                        : location &&
                                                            location.countryCode === 'US' && !isOtherFlag
                                                            ? handleBraintreePayment(data)
                                                            : handlePayment(data)
                                            }}

                                            onKeyPress={(): void => toggleAlbumView(data)}
                                        >
                                            <Card>
                                                <Card.Body>
                                                    <Table hover responsive borderless>
                                                        <thead>
                                                            <tr>
                                                                <Card.Title className="plan-monthly slider_image">
                                                                    {data.priceData.pricing.map((data1, index) => {
                                                                        if (data1.code == 'OT') {
                                                                            otherIndex = index;
                                                                        }
                                                                        if (data1.code == location.countryCode) {
                                                                            isCountry = true;
                                                                            return <Card.Title className="peformer_rate">
                                                                                {currencySymbol}{' '}
                                                                                {data1.price}{' '}
                                                                            </Card.Title>
                                                                        }
                                                                        if (isCountry == false && otherIndex != -1) {
                                                                            return <Card.Title className="peformer_rate">
                                                                                {data.priceData.pricing[otherIndex].currency}{' '}
                                                                                {data.priceData.pricing[otherIndex].price}{' '}
                                                                            </Card.Title>
                                                                        }
                                                                    })}
                                                                    <img
                                                                        src={data.albumData.image}
                                                                        alt={'Logo'}
                                                                        className={'slider_image'}
                                                                    />
                                                                    {isLogin ? (
                                                                        data.isPremium == true && data.purchaseData.status == 'settled' ? (
                                                                            <Button
                                                                                variant="success"
                                                                                className="buy_button"
                                                                                size="lg"
                                                                            >
                                                                                Play
                                                                            </Button>
                                                                        ) :
                                                                            data.isPremium == true && data.purchaseData.status == 'initiated' ?
                                                                                (<Button
                                                                                    variant="info"
                                                                                    className="buy_button"
                                                                                    size="lg"
                                                                                >
                                                                                    Pending authorization
                                                                                </Button>)
                                                                                : (
                                                                                    <Button
                                                                                        variant="success"
                                                                                        className="buy_button"
                                                                                        size="lg"
                                                                                    >
                                                                                        Buy now
                                                                                    </Button>
                                                                                )
                                                                    ) : null}
                                                                </Card.Title>

                                                                {/* <Card.Title className="buy_button">Buy</Card.Title> */}
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <Card.Title className="peformer_name">
                                                                        {data.albumData.title}
                                                                    </Card.Title>
                                                                </td>
                                                            </tr>
                                                        </thead>
                                                    </Table>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    );
                                })
                            ) : (
                                    <AlbumDetail {...{ activeAlbum, goBack }} />
                                )}
                        </div>
                    </Card.Body>
                </Card>
                <AppPlayer />
                <div>
                    <div className={'copyRight'}>
                        © 2020 All right reserved to BKRS. Terms & Conditions Privacy Policy
          </div>
                </div>
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
  margin-top: 30px;
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


const BraintreeDropInContainer = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
`;

export default SelectMusicType;
