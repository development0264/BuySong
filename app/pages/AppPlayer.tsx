import React, { useCallback, useRef, useState, useEffect } from 'react';
import { RootState } from '../../redux/reducers/RootReducer';
import styled from 'styled-components';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import Player from 'react-player';
import { Modal } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
// import Icon from '@material-ui/core/Icon';
import Image1 from '../../assets/images/Bitmap.png';

import {
  PlayerState,
  actions as playerActions,
} from '../../redux/reducers/PlayerReducer';
import { secondsToString } from '../../utils/services';
import '../../assets/css/payment.scss';

const AppPlayer = (): JSX.Element => {
  const authState = useSelector((state: RootState) => state.auth);
  const player = useRef(null);
  const handle = useFullScreenHandle();
  const dispatch = useDispatch();
  const playerState = useSelector(
    (state: { player: PlayerState }) => state.player
  );
  const {
    songs,
    currentIndex,
    shuffle,
    playing,
    isMiniPlayer,
    repeat,
  } = playerState;
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { isLogin, currentUser, location } = authState;
  console.log("appPlayer", isLogin);

  const togglePlayer = (): void => {
    dispatch(playerActions.togglePlayer);
  };

  const togglePlay = (): void => {
    dispatch(playerActions.pauseSong);
  };

  const playPrevious = (): void => {
    dispatch(playerActions.playPrevious);
  };
  const playNext = (): void => {
    dispatch(playerActions.playNext);
  };

  const handleSeekMouseDown = (e: any): void => {
    console.log('Mouse down...', e.target.value);
  };
  const handleSeekChange = (e: any): void => {
    setPlayed(e.target.value);
    if (player.current !== null) {
      player.current.seekTo(e.target.value);
    }
  };
  const handleSeekMouseUp = (e: any): void => {
    console.log('Mouse up...', e.target.value);
  };

  const handleProgress = (e: any): void => {
    setPlayedSeconds(e.playedSeconds);
    setPlayed(e.played);
  };
  const handleDuration = (e: any): void => {
    setDuration(e);
  };
  const handleEnd = (): void => {
    dispatch(playerActions.pauseSong);
    if (player.current !== null) {
      player.current.seekTo(0);
    }
  };

  useEffect(() => {
    if (showControls) {
      setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
  }, [showControls]);

  const toggleControls = (e: any): void => {
    e.stopPropagation();
    e.preventDefault();
    setTimeout(() => {
      setShowControls(true);
    }, 100);
  };
  const toggleVolume = (): void => {
    setIsMuted((m) => !m);
  };

  const toggleExapand = (): void => {
    if (!fullScreen) {
      handle.enter();
      setFullScreen(true);
    } else {
      handle.exit();
      setFullScreen(false);
    }
  };

  const reportChange = useCallback(
    (state, hanldeState) => {
      console.log('state, hanlde...', state, hanldeState);
      if (hanldeState === handle) {
        setFullScreen(state);
      }
    },
    [handle]
  );

  if (!isMiniPlayer && isLogin) {
    return (
      <Modal
        show={!isMiniPlayer}
        onHide={togglePlayer}
        backdrop="static"
        dialogClassName="modal-40w"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            <MediaInfo>
              <SongImage src={songs[currentIndex].image || Image1} alt="img" />
              <InfoValue>{`${songs[currentIndex].title}`}</InfoValue>
            </MediaInfo>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="playerBody">
          <FullScreen handle={handle} onChange={reportChange}>
            <MaxPlayer onClick={toggleControls} isFullScreen={fullScreen}>
              <Player
                ref={player}
                width={fullScreen ? '100%' : 498}
                height={fullScreen ? '100%' : 300}
                muted={isMuted}
                playing={playing}
                controls={false}
                onEnded={handleEnd}
                onReady={(): void => console.log('onReady')}
                onStart={(): void => console.log('onStart')}
                onProgress={handleProgress}
                onDuration={handleDuration}
                url={songs[currentIndex]?.streamUrl}
              />

              <MaxControls>
                <PlayIcons show={showControls} fullScreen={fullScreen}>
                  <Controls>
                    <PrevButton onClick={playPrevious}>
                      <i className="fa fa-step-backward" />
                    </PrevButton>
                    <PlayToggle onClick={togglePlay}>
                      {playing ? (
                        <i className="fa fa-pause-circle-o" />
                      ) : (
                          <i className="fa fa-play-circle-o" />
                        )}
                    </PlayToggle>

                    <NextButton onClick={playNext}>
                      <i className="fa fa-step-forward" />
                    </NextButton>
                  </Controls>
                </PlayIcons>
                <BottomControls>
                  <InnterControls>
                    <MaxSeekBar>
                      <SeekBarContainer>
                        <SeekBar
                          type="range"
                          min="0"
                          max="0.999999"
                          value={played}
                          step="any"
                          onMouseDown={handleSeekMouseDown}
                          onChange={handleSeekChange}
                          onMouseUp={handleSeekMouseUp}
                        />
                        <TimeContainer>
                          <span>{secondsToString(playedSeconds)}</span>
                          <span>{secondsToString(duration)}</span>
                        </TimeContainer>
                      </SeekBarContainer>
                    </MaxSeekBar>
                    <MuteView>
                      <i
                        className={`fa fa-volume-${isMuted ? 'off' : 'up'}`}
                        onClick={toggleVolume}
                      />
                    </MuteView>
                    <FullView>
                      <i
                        className={`fa fa-${fullScreen ? 'compress' : 'arrows-alt'
                          }`}
                        onClick={toggleExapand}
                      />
                    </FullView>
                  </InnterControls>
                </BottomControls>
              </MaxControls>
            </MaxPlayer>
          </FullScreen>
        </Modal.Body>
      </Modal>
    );
  }

  if (songs?.length > 0) {
    return (
      <AudioPlayerContainer>
        <SeekBarContainer>
          <SeekBar
            type="range"
            min="0"
            max="0.999999"
            value={played}
            step="any"
            onMouseDown={handleSeekMouseDown}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
          />
          <TimeContainer>
            <span>{secondsToString(playedSeconds)}</span>
            <span>{secondsToString(duration)}</span>
          </TimeContainer>
        </SeekBarContainer>
        <SongRow>
          <SongInfo onClick={togglePlayer}>
            <SongImage src={songs[currentIndex]?.image || Image1} alt="img" />
            <InfoCol>
              <Info>
                Song Name:
                <InfoValue>{` ${songs[currentIndex]?.title}`}</InfoValue>
              </Info>
              <Info>
                Raga:
                <InfoValue>{` ${songs[currentIndex]?.metadata.raga}`}</InfoValue>
              </Info>
              <Info>
                Tala:
                <InfoValue>{` ${songs[currentIndex]?.metadata.tala}`}</InfoValue>
              </Info>
            </InfoCol>
          </SongInfo>
          <PlayerControls>
            <Controls>
              <PrevButton onClick={playPrevious}>
                <i className="fa fa-step-backward" />
              </PrevButton>
              <PlayToggle onClick={togglePlay}>
                {playing ? (
                  <i className="fa fa-pause-circle-o" />
                ) : (
                    <i className="fa fa-play-circle-o" />
                  )}
              </PlayToggle>

              <NextButton onClick={playNext}>
                <i className="fa fa-step-forward" />
              </NextButton>
            </Controls>
          </PlayerControls>
        </SongRow>
        <Player
          ref={player}
          width={632}
          height={0}
          muted={false}
          playing={playing}
          controls={false}
          onReady={() => console.log('onReady')}
          onStart={() => console.log('onStart')}
          onProgress={handleProgress}
          onDuration={handleDuration}
          url={songs[currentIndex]?.fileUrl}
        />
      </AudioPlayerContainer>
    );
  }
  return null;
};

const AudioPlayerContainer = styled.div`
  position: fixed;
  align-self: center;
  width: 50%;
  bottom: 0;
  z-index: 99;
  background-color: rgba(59, 67, 242, 0.8);
  padding: 2px 5px;
  border-radius: 5px;
`;
const PlayerControls = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;
const Controls = styled.div`
  width: 250px;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
`;
const PlayToggle = styled.span`
  color: white;
  font-weight: bold;
  text-align: center;
  .fa {
    font-size: 50px;
    color: ${({ theme }): string => theme.primary};
    cursor: pointer;
  }
`;
const PrevButton = styled.div`
  .fa {
    font-size: 30px;
    color: ${({ theme }): string => theme.primary};
    cursor: pointer;
  }
`;
const NextButton = styled.div`
  .fa {
    font-size: 30px;
    color: ${({ theme }): string => theme.primary};
    cursor: pointer;
  }
`;
const SongRow = styled.div`
  display: flex;
  flex-direction: row;
`;
const SongInfo = styled.div`
  display: flex;
  flex: 1 1;
  align-items: center;
  cursor: pointer;
`;
const SongImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 12px;
`;
const InfoCol = styled.div`
  display: flex;
  flex-direction: column;
`;
const Info = styled.span`
  color: white;
  font-size: 12px;
  padding: 0 10px;
`;
const InfoValue = styled.span`
  font-weight: bold;
  font-size: 14px;
`;
const SeekBarContainer = styled.div`
  width: 100%;
  height: 24px;
  display: flex;
  flex-direction: column;
`;
const SeekBar = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 5px;
  border-radius: 5px;
  background: white;
  border: 0.5px solid ${({ theme }): string => theme.primary};
  outline: none;
  opacity: 0.7;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: ${({ theme }): string => theme.primary};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: ${({ theme }): string => theme.primary};
    cursor: pointer;
  }
`;
const TimeContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  span {
    font-size: 12px;
    color: white;
  }
`;

// Maximized Player controls
const MaxPlayer = styled.div<{ isFullScreen: boolean }>`
  width: ${({ isFullScreen }) => (isFullScreen ? '100%' : '498px')};
  height: ${({ isFullScreen }) => (isFullScreen ? '100%' : '300px')};
  position: relative;
`;

const MaxControls = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const PlayIcons = styled.div<{ show: boolean; fullScreen: boolean }>`
  top: 45%;
  left: ${({ fullScreen }) => (fullScreen ? '38%' : '26%')};
  width: 250px;
  position: absolute;
  opacity: ${({ show }): string => (show ? '1' : '0')};
  transition: opacity 2s;
`;
const MaxSeekBar = styled.div`
  width: 90%;
  padding-left: 15px;
`;
const MediaInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
const BottomControls = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-image: linear-gradient(white, black);
`;
const InnterControls = styled.div`
  display: flex;
  flex-direction: row;
`;
const FullView = styled.div`
  width: 10px;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  i {
    color: white;
  }
`;
const MuteView = styled.div`
  width: 10px;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  i {
    color: white;
  }
`;

export default AppPlayer;
