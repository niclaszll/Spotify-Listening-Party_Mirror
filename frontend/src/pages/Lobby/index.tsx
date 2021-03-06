import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Switch from '@material-ui/core/Switch'
import { Room } from '../../util/types/rooms'
import { getAvailableRooms, newSocketRoom, Response, socket } from '../../util/websocket'
import { ReactComponent as Lock } from '../../img/icons/lock.svg'
import { ReactComponent as LockOpen } from '../../img/icons/lock_open.svg'
import { ReactComponent as People } from '../../img/icons/people.svg'
import * as styles from './styles.module.sass'
import { selectSpotifyState, setUser } from '../../store/modules/spotify'
import PasswordDialog from '../../components/PasswordDialog'
import { getCurrentUserInfo } from '../../util/spotify'

export default function Lobby() {
  const [roomName, setRoomName] = useState<string>('')
  const [roomPublic, setRoomPublic] = useState<boolean>(true)

  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [visibleRooms, setVisibleRooms] = useState<Room[]>([])

  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false)
  const [passwordError, setPasswordError] = useState<String>('')

  const dispatch = useDispatch()
  const history = useHistory()
  const { user, token } = useSelector(selectSpotifyState)

  const togglePasswordDialog = (open: boolean) => {
    setPasswordDialogOpen(open)
  }

  useEffect(() => {
    getAvailableRooms()
    getCurrentUserInfo(token).then((res) => {
      dispatch(setUser(res))
    })
    socket.on('room/create', (data: Response<string>) => {
      history.push(`/room/${data.message.payload}`)
    })
    socket.on('room/set_all', (data: Response<Room[]>) => {
      setAvailableRooms(data.message.payload)
      setVisibleRooms(data.message.payload)
    })
    return () => {
      socket.off('room/create')
      socket.off('room/set_all')
    }
  }, [])

  const createRoom = () => {
    const newRoom = {
      name: roomName,
      roomPublic,
      activeListeners: [],
      queue: [],
      shuffledQueue: [],
      history: [],
      shuffled: false,
      roomPassword: '',
      creatorId: user?.id || '',
      currentTrack: null,
    }
    if (roomName) {
      if (!roomPublic) {
        setPasswordDialogOpen(true)
      } else {
        newSocketRoom(newRoom)
      }
    }
  }

  const joinRoomViaInput = () => {
    if (roomName) {
      history.push(`/room/${roomName}`)
    }
  }

  const joinRoomViaList = (name: string) => {
    if (name) {
      history.push(`/room/${name}`)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e
    setRoomName(target.value)
    if (target.value !== '') {
      setVisibleRooms((previousState) =>
        previousState.filter((room) => room.name.toLowerCase().includes(target.value.toLowerCase()))
      )
    } else {
      setVisibleRooms(availableRooms)
    }
  }

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRoomPublic(event.target.checked)
  }

  return (
    <div className={styles.container}>
      <div className={styles.roomName}>
        <input value={roomName} onChange={handleChange} placeholder="Room name" />
        <FormControlLabel
          control={<Switch color="primary" checked={roomPublic} onChange={handleSwitchChange} />}
          label="Public Room"
        />
      </div>
      <div className={styles.roomActions}>
        <button type="button" onClick={createRoom}>
          Create Room
        </button>
        <button type="button" onClick={joinRoomViaInput}>
          Join Room
        </button>
      </div>
      <div className={styles.rooms}>
        <div>
          <h4>Public rooms</h4>
          <div className={styles.availableRoomsContainer}>
            {visibleRooms.filter((room) => room.roomPublic).length > 0 ? (
              visibleRooms
                .filter((room) => room.roomPublic)
                .map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    className={styles.room}
                    onClick={() => room.id && joinRoomViaList(room.id)}
                  >
                    <div className={styles.info}>
                      <div className={styles.public}>
                        {room.roomPublic ? <LockOpen /> : <Lock />}
                      </div>
                      <div className={styles.listeners}>
                        <People />
                        {` ${room.activeListeners.length}`}
                      </div>
                    </div>
                    <div>{room.name}</div>
                  </button>
                ))
            ) : (
              <span>No public rooms found.</span>
            )}
          </div>
        </div>
        <div>
          <h4>Private rooms</h4>
          <div className={styles.availableRoomsContainer}>
            {visibleRooms.filter((room) => !room.roomPublic).length > 0 ? (
              visibleRooms
                .filter((room) => !room.roomPublic)
                .map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    className={styles.room}
                    onClick={() => room.id && joinRoomViaList(room.id)}
                  >
                    <div className={styles.info}>
                      <div className={styles.public}>
                        {room.roomPublic ? <LockOpen /> : <Lock />}
                      </div>
                      <div className={styles.listeners}>
                        <People />
                        {` ${room.activeListeners.length}`}
                      </div>
                    </div>
                    <div>{room.name}</div>
                  </button>
                ))
            ) : (
              <span>No private rooms found.</span>
            )}
          </div>
        </div>
      </div>
      <PasswordDialog
        open={passwordDialogOpen}
        passwordError={passwordError}
        closePasswordDialog={() => togglePasswordDialog(false)}
        togglePasswordDialog={() => togglePasswordDialog(passwordDialogOpen)}
        submitPassword={(password) => {
          if (password === '') {
            setPasswordError('Please enter a non empty password')
          }
          const newRoom = {
            name: roomName,
            roomPublic,
            activeListeners: [],
            queue: [],
            shuffledQueue: [],
            history: [],
            shuffled: false,
            roomPassword: password,
            creatorId: user?.id || '',
            currentTrack: null,
          }
          newSocketRoom(newRoom)
        }}
      />
    </div>
  )
}
