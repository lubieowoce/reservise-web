import { create_client } from './reservise-api'
import { show_error } from './reservise-ui'
import Autosuggest from 'react-autosuggest';


import React, {
    useState,
    Fragment,
} from 'react'




export const AddClient = ({user_entries, reservation_owner, onChange}) => {

    const [editorState, setEditorState] = useState({user: null, hasCard: false})

    const onAddEntry = (entry) => {
        const new_user_entries = append([...user_entries], entry)
        onChange(new_user_entries)
    }

    const onRemoveEntry = (index) => {
        const new_user_entries = remove_index([...user_entries], index)
        onChange(new_user_entries)
    }

    const onAddOwner = () => {
        if (!reservation_owner) { return }
        onAddEntry({user: reservation_owner, card: true})
    }

    const show_add_owner = !!(
        reservation_owner &&
        !user_entries.some(({user, card}) => card && (user.id === reservation_owner.id))
    )

    return (
        <div className="custom-wrapper divWrapper setPaddingLR setPaddingTB">
            <h5 className="gray" style={{marginBottom: '5px'}}>Gracze</h5>
            <div className="divWrapper">
                <ClientEntryEditor
                    user={editorState.user}
                    hasCard={editorState.hasCard}
                    onChange={(update) => setEditorState({...editorState, ...update})}
                    onSubmit={(entry) => {onAddEntry(entry); setEditorState({user: null, hasCard: false})}}
                />
               <ClientEntryList
                    user_entries={user_entries}
                    onRemoveEntry={onRemoveEntry}
                />
                {show_add_owner && (
                    <button
                        onClick={onAddOwner}
                        className="btn"
                        style={{
                            display: 'block',
                            width: '100%',
                            opacity: '0.6',
                            borderColor: 'currentColor',
                            fontSize: '0.8em',
                        }}
                    >
                        dodaj <strong>{reservation_owner.label}</strong>
                    </button>
                )}
            </div>
        </div>
    )
}






const ClientEntryList = ({user_entries, onRemoveEntry}) => {
    return (
        <ul
            className="list-group"
            style={{marginTop: '0.7em', marginBottom: '0.7em'}}
        >
            {user_entries.map(({user: {id, label}, card}, i) =>
                <li className="list-group-item" key={`${id}-${i}`}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{flexBasis: '100%'}}>
                            <a href={`/clients/c/${id}/`} target="blank">{label}</a>
                        </span>
                        {card && <span className="badge" style={{flexBasis: '15%'}}>MS</span>}
                        <button
                            className="close"
                            tabIndex="-1"
                            style={{marginLeft: '0.5em'}}
                            onClick={() => onRemoveEntry(i)}
                        >
                            &nbsp;×&nbsp;
                        </button>
                    </div>
                </li>
            )}
        </ul>
    )
} 

const ClientEntryEditor = ({user, hasCard, onChange, onSubmit}) => {
    const hasUser = !!user

    return (
        <div style={{display: 'flex'}}>
            {hasUser
                ? (
                    <div
                        className="form-control"
                        style={{
                            background: 'rgba(0,0,0, 0.025)',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>{user.label}</span>
                        <button
                            onClick={() => onChange({user: null})}
                            className="close"
                            tabIndex="-1"
                            style={{opacity: 'inherit'}}
                        >
                            &nbsp;×&nbsp;
                        </button>
                    </div>
                )
                : (
                    <ClientPicker
                        onSelect={(user) => onChange({user})}
                    />
                )
            }
            <div style={{
                    flexShrink: '0',
                    paddingLeft: '0.5em',
                    paddingRight: '0.5em',
                    border: '1px solid #e1e1e1',
                    display: 'flex',
                    alignItems: 'center',
                }}>
                <span>MS</span>
                <input
                    type="checkbox"
                    checked={hasCard}
                    onChange={({target: {checked}}) => onChange({hasCard: !!checked})}
                    style={{
                        width: 'auto',
                        margin: 'initial',
                        marginLeft: '5px',
                        display: 'inline',
                    }}
                />
            </div>
            <button
                onClick={() => onSubmit({user, hasCard})}
                disabled={!hasUser}
                className="btn btn-primary"
                style={{
                    borderTopLeftRadius: '0px',
                    borderBottomLeftRadius: '0px',
                    background: '#3276b1',
                    padding: 'initial',
                    lineHeight: 'initial',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                    fontSize: '23px',
                }}
            >
                +
            </button>
        </div>
    )

}




const initial_state = () => {
    return {
        mode: 'search',
        search: '',
        user: null,
        last_name:  null,
        first_name: null,
    }
}

const ClientPicker = ({onSelect}) => {
    const [state, setState] = useState(initial_state())

    const onSubmit = () => {
        const {mode} = state
        let user_promise, card
        if (mode === 'search') {
            card = state.card
            user_promise = promise_pure(state.user)
        } else if (mode === 'create') {
            card = state.card
            const {last_name, first_name} = state
            user_promise = create_client({last_name: last_name, first_name: first_name}).then((client) => (
                {id: client.id, label: last_name + ' ' + first_name} 
            ))
        } else {
            throw new Error(`Invalid custom_input mode: "${mode}"`)
        }

        return (
            user_promise
                .then((user) => {
                    const entry = {user, card}
                    onSelect(entry)
                    setState(initial_state())
                })
                .catch((err) => {
                    const msg = (
                        typeof err === 'object' && err.message !== undefined
                            ? err.message
                            : 'Unknown error'
                    )
                    console.error('Error submitting user', state, err)
                    show_error(msg)
                })
        )
    }

    return (
        <div style={{display: 'flex'}}>
            {state.mode === 'search' && (
                <ClientSearch
                    search={state.search}
                    onSearchChanged={(search) => setState({...state, search})}
                    onSelect={(user) => {
                        // const name = `${user.last_name} ${user.first_name}`
                        user = user && {id: user.id, label: user.label}
                        // setState({...state, user, search: name})
                        onSelect(user)
                    }}
                    className="form-control"
                    placeholder="Nazwisko klienta lub numer telefonu"
                    style={{
                        borderTopRightRadius: '0px',
                        borderBottomRightRadius: '0px',
                        borderRight: 'none',
                    }}
                />
            )}
            {state.mode === 'create' && (
                <Fragment>
                <input
                    type="text"
                    value={state.last_name}
                    className="form-control"
                    onChange={({target: {value}}) => setState({...state, last_name: value})}
                    placeholder="Nazwisko"
                    style={{
                        flexBasis: '40%',
                        minWidth: '0',
                        borderTopRightRadius: '0px',
                        borderBottomRightRadius: '0px',
                        borderRight: 'none',
                    }}
                />
                <input
                    type="text"
                    value={state.first_name}
                    className="form-control"
                    onChange={({target: {value}}) => setState({...state, first_name: value})}
                    placeholder="Imię"
                    style={{
                        flexBasis: '40%',
                        minWidth: '0',
                        borderRadius: '0px',
                    }}
                />
                </Fragment>
            )}
        </div>
    )
}


const ClientSearch = ({search, onSearchChanged, onSelect, delay=300, ...props}) => {
    const [request, setRequest] = useState({state: 'done'})
    const [suggestions, setSuggestions] = useState([])

    const searchClients = (term) => {
        const controller = new AbortController()
        const signal = controller.signal
        const cancel = () => controller.abort()

        const resultPromise = (async () => {
            const searchURL = `/clients/clients_autocomplete/?exclude=&term=${term}`
            const response = await fetch(searchURL, {signal})
            const {clients = []} = await response.json()
            return clients
        })()

        return [resultPromise, cancel]
    }

    return (
        <Autosuggest
            suggestions={suggestions}
            // Autosuggest will call this function every time you need to update suggestions.
            onSuggestionsFetchRequested={({value: search}) => {
                if (!search) { return }
                if (request.state === 'waiting') {
                    clearTimeout(request.token)
                }
                else if (request.state === 'requested') {
                    request.cancel()
                }
                setRequest({
                    state: 'waiting',
                    token: setTimeout(() => {
                        const [req, cancel] = searchClients(search)
                        setRequest({
                            state: 'requested',
                            cancel,
                            request: req.then((clients) => {
                                setRequest({state: 'done'})
                                setSuggestions(clients)
                            }).catch(()=>{})
                        })
                    }, delay)
                })
            }}
            // Autosuggest will call this function every time you need to clear suggestions.
            onSuggestionsClearRequested={() =>
                setSuggestions([])
            }
            highlightFirstSuggestion
            // When suggestion is clicked, Autosuggest needs to populate the input
            // element based on the clicked suggestion.
            getSuggestionValue={(item) => `${item.last_name} ${item.first_name}`}
            renderSuggestion={(item, {_query, _isHighlighted}) => <div>{item.label}</div>}
            onSuggestionSelected={(event, {suggestion, _suggestionValue, _suggestionIndex, _sectionIndex, _method}) => {
                // onSearchChanged(suggestionValue)
                onSelect(suggestion)
            }}

            // Autosuggest will pass through all these props to the input.
            inputProps={{
                value: search,
                onChange: (event, {newValue: newSearch}) => onSearchChanged(newSearch),
                ...props,
            }}
        />
    )
}

AddClient.style = `
    .react-autosuggest__container {
        width: 100%;
    }
    .react-autosuggest__container--open {}
    .react-autosuggest__input {}
    .react-autosuggest__input--open {}
    .react-autosuggest__input--focused {}
    .react-autosuggest__suggestions-container {
        width: 100%;
        position: relative;
    }
    .react-autosuggest__suggestions-container--open {}
    .react-autosuggest__suggestions-list {
        background-color: white;
        border: 1px solid rgb(225, 225, 225);
        padding: 0;
        list-style: none;
        width: 100%;
        position: absolute;
        z-index: 1000;
        top: 0; left: 0;
    }
    .react-autosuggest__suggestion {
        width: 100%;
        padding: 0.8em;
        font-size: 0.9em;
    }
    .react-autosuggest__suggestion--first {}
    .react-autosuggest__suggestion--highlighted {
        background-color: #0073ea;
        color: white;
    }

`



const remove_index = (xs, i) => {xs.splice(i, 1); return xs}
const append = (xs, x) => {xs.push(x); return xs}


const promise_pure = (x) => (new Promise((resolve)=>resolve(x)))

const titleCaseWord = (word) => (
    word ? word[0].toUpperCase() + word.substr(1).toLowerCase() : word
)

const parseName = (s) => {
    const parts = s.trim().split(' ').map(titleCaseWord)
    let lastName, firstName
    if (parts.length === 0) {
        lastName  = ''
        firstName = ''
    } else if (parts.length === 1) {
        lastName  = parts[0]
        firstName = ''
    } else {
        lastName  = parts.slice(0, -1).join(' ')
        firstName = parts[parts.length-1]
    }
    return [lastName, firstName]
}
