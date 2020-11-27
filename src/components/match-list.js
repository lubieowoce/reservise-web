import React, { useState, useMemo, Fragment } from 'react'
import { Popover } from 'react-tiny-popover'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'

import { keyBy, noop, union, identity, sortBy } from 'lodash'

import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { useSelector, useDispatch } from 'react-redux'


import { fetchAPI } from '../reservise-api'
import { show_success } from '../reservise-ui'
import { Spinner, GlyphIcon } from './utils'

export const createFetchController = () => (
    createStore(
        fetchControllerReducer,
        {status: 'blank'},
        applyMiddleware(thunk)
    )
)

/*
status:
    blank
    loading {promise, cancel}
    done {result}
    // error {msg}

action:
    REQUEST {promise, cancel}
    RECEIVE {result}
    CANCEL
*/

const fetchControllerReducer = (state, action) => {
    // console.log('fetchControllerReducer', state, action)
    switch (action.type) {
        case 'REQUEST': {
            const {promise, cancel} = action
            return {status: 'loading', promise, cancel}
        }
        case 'RECEIVE': {
            const {result} = action
            return {status: 'done', result}
        }
        case 'CANCEL': {
            if (state.status === 'loading') {
                state.cancel()
                return {status: 'blank'}
            } else {
                return state
            }
        }
    }
    return state
}

export const cancelUsersRequest = () => ({type: 'CANCEL'})

export const requestUsers = ({userIds}) => (dispatch, _getState) => {
    const [pendingUsers, cancel] = getClients({clientIds: userIds})
    const promise = pendingUsers.then((users) => {
        dispatch({type: 'RECEIVE', result: users})
    })
    dispatch({type: 'REQUEST', promise, cancel})
}


export const usersFromMatches = (matches) => (
    union(...matches.map(({match: [ids,]}) => ids))
)

export const MatchList = ({matches}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedTab, setSelectedTab] = useState(0)
    const userIds = useMemo(() => (
        usersFromMatches(matches)
    ), [matches])

    const dispatch = useDispatch()
    const fetchState = useSelector(identity)
    // console.log('<MatchList>', {matches, fetchState})
    const onChange = (newIsOpen) => {
        setIsOpen(newIsOpen)
        if (newIsOpen === true) {
            dispatch(requestUsers({userIds}))
        } else {
            dispatch(cancelUsersRequest())
        }
    }

    const flexCentered = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1em',
    }

    return (
        <MatchListInternal
            isOpen={isOpen}
            onChange={onChange}
            matches={matches}
        >
            {fetchState.status === 'done' && (
                matches.length === 0
                    ? (
                        <div style={flexCentered}>
                            <i className="text-muted">Nie znaleziono żadnych meczy.</i>
                        </div>
                    )
                    : (
                        <Tabs selectedIndex={selectedTab} onSelect={setSelectedTab}>
                            <TabList className={['react-tabs__tab-list-sticky', 'react-tabs__tab-list']}>
                                <Tab>Mecze</Tab>
                                <Tab>Gracze</Tab>
                            </TabList>
                            <TabPanel>
                                <MatchTable
                                    matches={matches}
                                    users={keyBy(fetchState.result, 'id')}
                                />
                            </TabPanel>
                            <TabPanel>
                                <UserTable users={fetchState.result}/>
                            </TabPanel>
                        </Tabs>
                    )
            )}
            {fetchState.status === 'blank' &&
                <div style={flexCentered}>
                    <i className="text-muted">Nic tu nie ma.</i>
                </div>
            }
            {fetchState.status === 'loading' &&
                <div style={{...flexCentered, flexDirection: 'column'}}>
                    <Spinner color="lightgray"/>
                    <i className="text-muted">Ładowanie informacji o graczach</i>
                </div>
            }
        </MatchListInternal>
    )
}

const getClients = ({clientIds}) => {
    const controller = new AbortController()
    const signal = controller.signal
    const cancel = () => controller.abort()
    const wrappedFetch = (url, args = {}) => fetch(url, {...args, signal})
    const api = fetchAPI(wrappedFetch)

    const resultPromise = Promise.all(
        clientIds.map((client_id) => api.get_client({client_id}))
    )

    return [resultPromise, cancel]
}


export const MatchListInternal = ({
        isOpen,
        onChange,
        matches,
        className = "",
        onShowReservation = noop,
        onCopy = noop,
        children,
    }) => {
    const toggleOpen = () => onChange(!isOpen)
    const doClose = () => onChange(false)

    return (
        <Modal
            isOpen={isOpen}
            title="Wyniki meczy"
            content={
                <div style={{minWidth: '50vw', maxHeight: '80vh', overflowY: 'auto'}}>
                    {children}
                </div>
            }
            onClose={doClose}
        >
            <button
                className="btn btn-default"
                style={{display: 'block', width: '100%', textAlign: 'left', borderRadius: '0', padding: '1em', borderLeft: 'none', borderRight: 'none'}}
                onClick={toggleOpen}
            >
                <span>Wyniki meczy (<strong>{matches.length}</strong>)</span>
            </button>
        </Modal>
    )
}


const MatchTable = ({matches, users}) => {
    return (
        <table className="table">
            <thead
                // style={{position: 'sticky', top: 0}}
            >
                <tr>
                    <th style={{textAlign: 'right'}}>#</th>
                    <th>Czas</th>
                    <th>Gracz 1</th>
                    <th></th>
                    <th>Gracz 2</th>
                    <th></th>
                    <th>Wynik</th>
                </tr>
            </thead>
            <tbody>
                {matches.map(({event, match: [[id1, id2], score]}, i) => {
                    const date = event.start.format('YYYY-MM-DD HH:mm:ss')
                    return (
                        <tr key={`${event.id}-${id1}-${id2}-${i}`}>
                            <td className="text-muted" style={{textAlign: 'right'}}>{i+1}</td>
                            <td className="text-muted">
                                <span style={{whiteSpace: 'nowrap'}}>{date}</span>
                            </td>
                            {[id1, id2].map((id) => {
                                const user = users[id] || {id, ...UNKNOWN_USER}
                                return (
                                    <Fragment key={id}>
                                    <td>
                                        {makeUserLink(user)}<br/>
                                        <span style={{whiteSpace: 'pre-wrap', fontSize: '0.8em', color: 'rgba(0,0,0, 0.6)'}}>
                                            {user.annotation}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-default btn-sm"
                                            title="Kopiuj imię i nazwisko"
                                            onClick={() => copyText(`${user.first_name} ${user.last_name}`)}
                                        >
                                            <GlyphIcon name="share"/>
                                        </button>
                                    </td>
                                    </Fragment>
                                )
                            })}
                            <td style={{fontSize: '1.5em', fontFamily: 'monospace', textAlign: 'center'}}>
                                {score}
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}



const makeUserLink = (user) => (
    <a href={`/clients/c/${user.id}/`} target="blank">{user.first_name} {user.last_name} ({user.email})</a>
)


const UNKNOWN_USER = {
    first_name: '?',
    last_name: '?',
    annotation: '',
    phone_number: '',
    email: '',
}

const copyText = async (text) => {
    await window.navigator.clipboard.writeText(text)
    show_success(`Skopiowano tekst: "${text}"`)
}

const UserTable = ({users}) => {
    const sortedUsers = useMemo(() => (
        sortBy(users, ['last_name', 'first_name'])
    ), [users])

    return (
        <table className="table">
            <thead>
                <tr>
                    <th style={{textAlign: 'right'}}>#</th>
                    <th>imię</th>
                    <th>nazwisko</th>
                    <th></th>
                    <th>email</th>
                    <th></th>
                    <th>nr. tel</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {sortedUsers.map((user, i) => (
                    <tr key={user.id}>
                        <td className="text-muted" style={{textAlign: 'right'}}>{i+1}</td>
                        <td>{user.first_name}</td>
                        <td>{user.last_name}</td>
                        <td>
                            <button
                                className="btn btn-default btn-sm"
                                title="Kopiuj imię i nazwisko"
                                onClick={() => copyText(`${user.first_name} ${user.last_name}`)}
                            >
                                <GlyphIcon name="share"/>
                            </button>
                        </td>
                        <td>{user.email}</td>
                        <td>
                            <button
                                className="btn btn-default btn-sm"
                                title="Kopiuj email"
                                onClick={() => copyText(user.email)}
                                disabled={!user.email}
                            >
                                <GlyphIcon name="share"/>
                            </button>
                        </td>
                        <td>{user.phone_number}</td>
                        <td>
                            <button
                                className="btn btn-secondary btn-sm"
                                title="Kopiuj dane użytkownika (do wklejenia do TournamentTools)"
                                onClick={async () => {
                                    await window.navigator.clipboard.writeText(JSON.stringify(user))
                                    show_success(`Skopiowano dane użytkownika ${user.first_name} ${user.last_name}`)
                                }}
                            >
                                <GlyphIcon name="user"/>&nbsp;kopiuj
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}




const Modal = ({isOpen, content, onClose, title = '', children, ...props}) => {
    // const container = document.getElementById('confirmations')
    const wrappedContent = (
        <div className="custom-modal">
            <div className="modal-dialog" style={{width: 'unset'}}>
                <div className="modal-content">
                    <div className="modal-header">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h4 className="modal-title">{title}</h4>
                            <button
                                className="close"
                                onClick={onClose}
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                    <div className="modal-body" style={{padding: 0}}>
                        {content}
                    </div>
                    {/*<div className="modal-footer">
                        <div className="btn-group">
                            <button type="button" className="btn {{ reject_button_class }}" data-dismiss="modal" cancel>{{ reject_button_text }}</button>
                            <button type="button" className="btn {{ confirm_button_class }} primary" data-dismiss="modal" confirm>{{ confirm_button_text }}</button>
                        </div>
                    </div>*/}
                </div>
            </div>
        </div>
    )

    return (

        <Popover
            isOpen={isOpen}
            content={wrappedContent}
            positions={["left"]}
            align="center"
            containerStyle={{zIndex: 10000}}
            // contentDestination={container}
            {...props}
        >
            {children}
        </Popover>
    )
}


MatchList.style = `
.match-list__entry + .match-list__entry {
    margin-top: 0.5em;
}
` + "\n" + Spinner.style + `
.react-tabs {
  -webkit-tap-highlight-color: transparent;
}

.react-tabs__tab-list-sticky {
    position: sticky;
    top: 0;
    z-index: 20000;
}

.react-tabs__tab-list {
  border-bottom: 1px solid #aaa;
  margin: 0 0 10px;
  padding: 0;
  padding-top: 0.5em;
  background: #fafafa;
}

.react-tabs__tab {
  display: inline-block;
  border: 1px solid transparent;
  border-bottom: none;
  bottom: -1px;
  position: relative;
  font-size: 1.1em;
  list-style: none;
  padding: 0.5em 1.25em;
  cursor: pointer;
}

.react-tabs__tab:first-child {
    margin-left: 1ch;
}

.react-tabs__tab--selected {
  background: #fff;
  border-color: #aaa;
  color: black;
  border-radius: 5px 5px 0 0;
}

.react-tabs__tab--disabled {
  color: lightgray;
  cursor: default;
}

.react-tabs__tab:focus {
  box-shadow: 0 0 5px hsl(208, 99%, 50%);
  border-color: hsl(208, 99%, 50%);
  outline: none;
}

.react-tabs__tab:focus:after {
  content: "";
  position: absolute;
  height: 5px;
  left: -4px;
  right: -4px;
  bottom: -5px;
  background: #fff;
}

.react-tabs__tab-panel {
  display: none;
}

.react-tabs__tab-panel--selected {
  display: block;
  /* overflow-y: auto; */
}
`
