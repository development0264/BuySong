import React, { FC, useEffect, useState } from 'react';
import { RootState } from '../../redux/reducers/RootReducer';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import _ from 'lodash';

import { getArticle, getContents } from '../../utils/services';
import PlayIcon from '../../assets/images/playIcon.png';
import DummyImage from '../../assets/images/dummy_performer.png';
import { actions as playerActions } from '../../redux/reducers/PlayerReducer';
import '../../assets/css/payment.scss';
import { useToasts } from 'react-toast-notifications';

interface Props {
  activeAlbum: any;
  activeContents: any[];
  goBack: () => void;
  collection: any;
}

const PerformerImage = ({ id }: { id: string }): JSX.Element => {

  const [artist, setArtist] = useState<any>();

  useEffect(() => {
    getArticle(id).then((rep) => {
      setArtist(rep);
    });
  }, []);

  const loadImage = (e: any): void => {
    e.src = DummyImage;
  };

  return (
    <ArtistImage
      src={artist?.image || DummyImage}
      onError={loadImage}
      alt="artists"
    />
  );
};

const AlbumDetail: FC<Props> = ({
  activeAlbum,
  goBack,
}: Props): JSX.Element => {
  const authState = useSelector((state: RootState) => state.auth);
  const { isLogin, currentUser, location } = authState;
  const { addToast } = useToasts();
  const dispatch = useDispatch();
  const [activeContents, setActiveContents] = useState<any[]>([]);
  let mainPerformer = '';

  useEffect(() => {
    getContents(activeAlbum.docKey).then((resp) => {
      const sortedFiles = _.sortBy(resp, 'sortIndex');
      console.log("Res", sortedFiles);
      setActiveContents(sortedFiles);
    });
  }, []);
  const performersIds: string[] = _.map(activeAlbum?.performers, (obj) => {
    if (obj.type === 'Main') mainPerformer = obj.name;
    return obj.id;
  });
  const calcDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `00:${Math.round(seconds)}`;
    }
    const mins = Math.round(seconds / 60);
    const secs = Math.round(seconds % 60);
    const zMins = mins < 10 ? `0${mins}` : mins;
    const zSecs = secs < 10 ? `0${secs}` : secs;
    return `${zMins}:${zSecs}`;
  };

  const playAudio = (contents: any[], index: number): void => {
    if (!isLogin) {
      addToast('Please login to view content.', {
        appearance: 'info',
        autoDismiss: true,
      });
      return;
    }
    dispatch(playerActions.addSongs({ contents, index }));
  };

  const handleBack = (): void => {
    dispatch(playerActions.addSongs({ contents: [], index: 0 }));
    goBack();
  };

  return (
    <Album>
      <AlbumCard>
        <CardRow>
          <AlbumCardInfo>
            <Image src={activeAlbum.image} alt="albumImage" />
            <Info>
              <TopBlock>
                <Title>{activeAlbum.title}</Title>
                <Artist>{mainPerformer}</Artist>
              </TopBlock>
              <Artists>
                {performersIds.map((id) => (
                  <PerformerImage key={id} {...{ id }} />
                ))}
              </Artists>
            </Info>
          </AlbumCardInfo>
          <RightContainer onClick={handleBack}>
            <Button>
              <i className="fa fa-arrow-circle-o-left" />
              <span className="txt">Back</span>
            </Button>
          </RightContainer>
        </CardRow>
      </AlbumCard>
      <SongsContainer>
        <FilesContainer>
          {activeContents?.length > 0 &&
            activeContents.map((file, index) => {
              return (
                <FileRow
                  key={file.title}
                  isLast={activeContents.length - 1 === index}
                  onClick={(): void => playAudio(activeContents, index)}
                >
                  <PlayImage src={PlayIcon} alt="playIcon" />
                  <FileNames>
                    <SongTitle>{file.title}</SongTitle>
                    <SongArtist>{file.metadata.artist[0].name}</SongArtist>
                  </FileNames>
                  <Duration>
                    <span>{calcDuration(file?.duration || 0)}</span>
                  </Duration>
                </FileRow>
              );
            })}
        </FilesContainer>
      </SongsContainer>
    </Album>
  );
};

const Album = styled.div`
  flex: 1 1 0;
  position: relative;
`;
const AlbumCard = styled.div`
  display: flex;
  justify-content: space-between;
`;
const CardRow = styled.div`
  display: flex;
  justify-content: space-between;
  height: 145px;
  width: 100%;
`;
const Image = styled.img`
  width: 186px;
  height: 145px;
  border-radius: 10px;
`;
const AlbumCardInfo = styled.div`
  display: flex;
  width: 70%;
`;
const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-left: 10px;
`;
const TopBlock = styled.div`
  flex: 1 1 50%;
`;
const Title = styled.h3`
  color: ${({ theme }): string => theme.white};
`;
const Artist = styled.p`
  color: ${({ theme }): string => theme.white};
`;
const Artists = styled.div`
  flex: 1 1 50%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
`;
const ArtistImage = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 15px;
  margin-right: 4px;
`;
const RightContainer = styled.div`
  flex: 1 1 20%;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
`;
const Button = styled.div`
  cursor: pointer;
  width: 100px;
  display: flex;
  align-items: center;
  background-color: #585858;
  border-radius: 25px;
  padding: 5px 12px 4px 4px;
  outline: none;
  .fa {
    color: ${(props): string => props.theme.white};
    font-size: 26px;
  }
  .txt {
    color: ${(props): string => props.theme.white};
    font-size: 18px;
    font-weight: bold;
    padding-left: 2px;
    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
`;

const SongsContainer = styled.div`
  background-color: ${({ theme }): string => theme.white};
  margin-top: 1rem;
  border-radius: 10px;
  font-family: Poppins;
`;
const FilesContainer = styled.div`
  overflow: auto;
`;
const FileRow = styled.div<{ isLast: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: ${({ isLast }): string => (isLast ? '' : '1px solid grey')};
  &:hover {
    cursor: pointer;
  }
`;
const PlayImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 25px;
`;

const FileNames = styled.div`
  width: 80%;
  margin-left: 1rem;
  display: flex;
  justify-content: space-evenly;
  flex-direction: column;
`;
const Duration = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-left: 1rem;
  color: #999999;
  height: 50px;
`;
const SongTitle = styled.span`
  font-size: 14px;
  font-weight: 500;
  width: 100%;
  color: ${({ theme }): string => theme.black};
  display: -webkit-box;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;
const SongArtist = styled.span`
  font-size: 10px;
  font-weight: 300;
  color: ${({ theme }): string => theme.black};
`;

export default AlbumDetail;
