import React, {
    useState, useEffect, useRef, useCallback, useMemo,
    Fragment,
} from 'react'
import Autosuggest from 'react-autosuggest';
import { noop } from 'lodash'
import { Popover } from 'react-tiny-popover'

import { create_client } from './reservise-api'
import { show_error } from './reservise-ui'


export const AddClient = ({
        user_entries,
        reservation_owner,
        onAddEntry,
        onRemoveEntry,
        onModifyEntry,
    }) => {

    const [editorState, setEditorState] = useState({userPicker: PickerState.blank, hasCard: false})

    const onAddOwner = () => {
        if (!reservation_owner) { return }
        onAddEntry({user: reservation_owner, card: true})
    }

    const showAddOwner = !!(
        reservation_owner &&
        !user_entries.some(({user, card}) => card && (user.id === reservation_owner.id))
    )
    const ownerName = reservation_owner.name || reservation_owner.label.replace(/\s\([+0-9]+\)$/, '')

    return (
        <div className="custom-wrapper divWrapper setPaddingLR setPaddingTB">
            <h5 className="gray" style={{marginBottom: '5px'}}>Gracze i karty zniżkowe</h5>
            <div className="divWrapper">
                <ClientEntryEditor
                    userPicker={editorState.userPicker}
                    hasCard={editorState.hasCard}
                    onChange={(update) => setEditorState({...editorState, ...update})}
                    onSubmit={(entry) => {
                        onAddEntry({user: entry.user, card: entry.hasCard})
                        setEditorState({userPicker: PickerState.blank, hasCard: false})}
                    }
                />
               <ClientEntryList
                    user_entries={user_entries}
                    onRemoveEntry={onRemoveEntry}
                    onModifyEntry={onModifyEntry}
                />
                {showAddOwner && (
                    <button
                        onClick={onAddOwner}
                        title="kliknij, jeśli właściciel rezerwacji okazał kartę zniżkową."
                        className="btn"
                        style={{
                            display: 'block',
                            width: '100%',
                            opacity: '0.6',
                            borderColor: 'currentColor',
                            fontSize: '0.8em',
                        }}
                    >
                        <strong>+</strong> dodaj <strong>{ownerName}</strong> z kartą zniżkową
                    </button>
                )}
            </div>
        </div>
    )
}






const ClientEntryList = ({user_entries, onModifyEntry, onRemoveEntry}) => {
    const [editEntry,   setEditEntry]   = useState(null)
    const [editorState, setEditorState] = useState(null)
    const openEditor = useCallback((i, entry) => {
        setEditEntry(i)
        setEditorState({
            userPicker: {type: PickerState.SELECTED, user: entry.user},
            hasCard: entry.card,
        })
    }, [])
    const closeEditor = useCallback(() => {
        setEditEntry(null)
        setEditorState(null)
    }, [])
    
    const [openMenuIndex, setOpenMenuIndex] = useState(null)
    const toggleOpenMenu = useCallback(
        (i) => (openMenuIndex === i ? closeMenu() : setOpenMenuIndex(i)),
        [openMenuIndex]
    )
    const closeMenu = useCallback(() => setOpenMenuIndex(null), [])

    return (
        <ul
            className="list-group"
            style={{marginTop: '0.5em', marginBottom: '0.5em'}}
        >
            {user_entries.map((entry, i) => {
                const {user: {id, label}, card} = entry
                const showEditor = (i === editEntry && editorState)
                const hasOpenMenu = (i === openMenuIndex)
                return <li className="list-group-item" key={`${id}-${i}`} style={showEditor ? {padding: '0'} : {}}>
                    {showEditor &&
                        <InlineClientEntryEditor
                            userPicker={editorState.userPicker}
                            hasCard={editorState.hasCard}
                            onChange={(update) => setEditorState({...editorState, ...update})}
                            onSubmit={(entry) => {
                                closeEditor()
                                onModifyEntry(i, {user: entry.user, card: entry.hasCard})
                            }}
                            onCancel={closeEditor}
                        />
                    }
                    { // !showEditor &&
                        // WORKAROUND
                        // this section shouldn't really be rendered if we're showing the editor,
                        // but <Popover> doesn't like when the anchor element (<button>) suddenly disappears
                        // (i.e. errors about `childRef.current` being null after we call closeMenu()),
                        // so instead we just hide it with display: none
                        <div
                            style={
                                showEditor
                                    ? {display: 'none'}
                                    : {display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                        >
                            <span style={{flexBasis: '100%'}}>
                                <a href={`/clients/c/${id}/`} target="blank">{label}</a>
                            </span>
                            {card && <span className="badge" style={{flexBasis: '15%'}}>MS</span>}
                            <Popover
                                isOpen={hasOpenMenu}
                                position="right"
                                onClickOutside={closeMenu}
                                content={
                                    <div className="btn-group-vertical">
                                        <IconButton
                                            icon={<GlyphIcon name="pencil"/>}
                                            label="Edytuj"
                                            className="btn btn-default"
                                            onClick={() => {
                                                closeMenu()
                                                openEditor(i, entry)
                                            }}/>
                                        <IconButton
                                            icon={<GlyphIcon name="trash"/>}
                                            label="Usuń"
                                            className="btn btn-default"
                                            style={{color: 'tomato'}}
                                            onClick={() => {
                                                closeMenu()
                                                onRemoveEntry(i)
                                            }}
                                        />
                                    </div>
                                }
                            >
                                <button
                                    className="close"
                                    tabIndex="-1"
                                    style={{marginLeft: '0.5em'}}
                                    onClick={() => toggleOpenMenu(i)}
                                >
                                    <span>&nbsp;⋮&nbsp;</span>
                                </button>
                            </Popover>
                        </div>
                    }
                </li>
            })}
        </ul>
    )
}


const makeClientEntryEditor = ({SubmitButton, CancelButton}) => (
    ({userPicker: pickerState, hasCard, onChange = noop, onSubmit = noop, onCancel = noop}) => {
        const canSubmit = (
            (pickerState.type === PickerState.SELECTED) ||
            (pickerState.type === PickerState.CREATE
                && pickerState.data.firstName
                && pickerState.data.lastName
            )
        )

        const onSubmitClicked = async () => {
            let user
            if (pickerState.type === PickerState.SELECTED) {
                user = pickerState.user
                // onSubmit({user: pickerState.user, hasCard})
            } else if (pickerState.type === PickerState.CREATE) {
                const {lastName, firstName, email = '', phone = ''} = pickerState.data
                // TODO: error message?
                let response
                try {
                    response = await create_client({
                        last_name:    lastName,
                        first_name:   firstName,
                        email:        email,
                        phone_number: phone,
                    })
                } catch (err) {
                    console.error('Error submitting user', pickerState.data, err)
                    show_error(err.message)
                    return
                }
                user = {
                    id: response.id,
                    label: `${lastName} ${firstName}` + (phone ? ` (${phone})` : '')
                }
            } else {
                return
            }

            onSubmit({user, hasCard})
            onChange({userPicker: PickerState.blank})
        }

        return (
            <div style={{display: 'flex'}}>
                <ClientInput
                    state={pickerState}
                    onChange={(state) => onChange({userPicker: state})}
                />
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
                        title="Klient ma kartę zniżkową"
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
                { SubmitButton &&
                    <SubmitButton
                        onClick={onSubmitClicked}
                        disabled={!canSubmit}
                    />
                }
                { CancelButton &&
                    <CancelButton
                        onClick={onCancel}
                    />
                }
            </div>
        )
    }
)

const IconButton = ({icon, label, ...props}) => {
    return (
        <button {...props}>
            <div style={{display: 'flex', alignItems: 'center'}}>
                {icon}<span style={{marginLeft: '0.7em'}}>{label}</span>
            </div>
        </button>
    )
}

const GlyphIcon = ({name}) => <span className={`glyphicon glyphicon-${name}`} />

const InlineClientEntryEditor = makeClientEntryEditor({
    SubmitButton: (props) => (
        <button {...props} className="btn btn-link" title="Zapisz"><GlyphIcon name="ok"/></button>
    ),
    CancelButton: (props) => (
        <button {...props} className="btn btn-link" title="Anuluj"><GlyphIcon name="remove"/></button>
    ),
})

// const InlineClientEntryEditor = makeClientEntryEditor({
//     SubmitButton: (props) => (
//         <button {...props} className="btn btn-link" title="Zapisz">✓</button>
//     ),
//     CancelButton: (props) => (
//         <button {...props} className="btn btn-link" title="Anuluj">×</button>
//     ),
// })


const ClientEntryEditor = makeClientEntryEditor({
    SubmitButton: (props) => (
        <button
            {...props}
            title="Dodaj"
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
    )
})


const PickerState = {
    SEARCH:    'search',
    CREATE:    'create',
    SELECTED:  'selected',
}

PickerState.blank = {
    type: PickerState.SEARCH,
    search: '',
}

/*
PickerState
    = { type: 'search', search: string }
    | { type: 'create', data }
    | { type: 'selected', user }
*/

const useTransferFocus = () => {
    const shouldTransferFocus = useRef(false)
    const doTransferFocus = useCallback(() => {
        shouldTransferFocus.current = true
    }, [])
    const focusOnMount = useCallback((node) => {
        if (shouldTransferFocus.current && node) {
            node.focus()
            shouldTransferFocus.current = false
        }
    }, [])
    return [focusOnMount, doTransferFocus]
}

const ClientInput = ({state, onChange}) => {
    // when a user is picked, we hide the search bar and replace it with
    // a dummy input containing the user's name. for proper keyboard navigation,
    // we have to transfer the focus to the new input. 

    // const fakeInputRef = useRef()
    // const transferFocus = useRef(false)
    // useEffect(() => {
    //     if (transferFocus.current && fakeInputRef.current) {
    //         fakeInputRef.current.focus()
    //         transferFocus.current = false
    //     }
    // }, [transferFocus.current])
    
    // console.log('<ClientInput>', state)
    const [focusRef, transferFocus] = useTransferFocus()
    return (
        <div style={{position: 'relative', flex: '1'}}>
            {state.type === PickerState.SELECTED &&
                <Fragment>
                    <input
                        ref={focusRef}
                        className="form-control"
                        style={{
                            cursor: 'default',
                            background: 'rgba(0,0,0, 0.025)',
                        }}
                        type="text" 
                        value={state.user.label}
                        readOnly
                    />
                    <button
                        title="Wyczyść"
                        onClick={() => onChange(PickerState.blank)}
                        className="close"
                        tabIndex="-1"
                        style={{position: 'absolute', top: '5px', right: '3px', opacity: 'inherit'}}
                    >
                        &nbsp;×&nbsp;
                    </button>
                </Fragment>
            }
            {state.type === PickerState.SEARCH && (
                <ClientSearch
                    search={state.search}
                    onSearchChanged={(search) => onChange({...state, search})}
                    onSelect={(user) => {
                        user = user && {id: user.id, label: user.label}
                        // onSelect(user)
                        onChange({type: PickerState.SELECTED, user})
                        transferFocus()
                    }}
                    onCreate={(search) => {
                        const {firstName, lastName} = parseName(search)
                        const data = {
                            lastName: lastName,
                            firstName: firstName,
                            email: '',
                            phone: '',
                        }
                        onChange({type: PickerState.CREATE, data, originalSearch: search})
                        transferFocus()
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
            {state.type === PickerState.CREATE && (
                <div className="form-control" style={{position: 'relative', flex: '1'}}>
                    <ClientEditor
                        {...state.data}
                        onChange={(update) => onChange({...state, data: {...state.data, ...update}})}
                        onCancel={() => onChange({type: PickerState.SEARCH, search: state.originalSearch || ''})}
                        containerProps={{style: {
                            position: 'absolute', zIndex: 2000, top: '0', left: '0',
                            width: '100%',
                            background: 'white',
                            boxShadow: '0 10px 10px rgba(0,0,0, 0.15)',
                        }}}
                        refs={{lastName: focusRef}}
                    />
                </div>
            )}
        </div>
    )
}


const FIELD_LABELS = {
    lastName:  "Nazwisko",
    firstName: "Imię",
    phone:     "Telefon",
    email:     "Email",
}

const ClientEditor = ({onChange, onCancel = noop, containerProps = {}, refs = null, ...props}) => {
    const textFieldProps = (NAME, extras = null) => {
        const res = {
            type: "text",
            value: props[NAME],
            className: "form-control",
            onChange: ({target: {value}}) => onChange({...props, [NAME]: value}),
            title: FIELD_LABELS[NAME],
            placeholder: FIELD_LABELS[NAME],
            style: {minWidth: '0', borderRadius: '0'},
        }
        if (refs && refs[NAME]) {
            res.ref = refs[NAME]
        }
        if (extras) {
            if (extras.style) {
                Object.assign(res.style, extras.style)
            }
        }
        return res
    }
    return (
        <div {...containerProps} >
            <div style={{display: 'flex'}}>
                <input {...textFieldProps('lastName',  {style: {flex: '50%'}})} />
                <input {...textFieldProps('firstName', {style: {flex: '50%'}})} />
            </div>
            <input {...textFieldProps('phone')} />
            <input {...textFieldProps('email')} />
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                {/*<Spinner style={{alignSelf: 'center', marginLeft: '12px'}}/>*/}
                <span/>
                <button
                    style={{display: 'block'}}
                    className="btn btn-link"
                    title="Anuluj tworzenie klienta"
                    tabIndex="-1"
                    onClick={onCancel}
                >
                    Anuluj
                </button>

            </div>
        </div>
    )
}




const ADD_CLIENT_ITEM = { isCreateClient: true, label: 'Stwórz klienta' }

const ClientSearch = ({search, onSearchChanged, onSelect, onCreate, delay=300, ...props}) => {
    const [request, setRequest] = useState({state: 'done'})
    const [_suggestions, setSuggestions] = useState([])
    const suggestions = useMemo(() => [..._suggestions, ADD_CLIENT_ITEM], [_suggestions])

    const onFetch = ({value: search}) => {
        if (!search) { return }
        if (request.state === 'waiting') {
            clearTimeout(request.timeoutToken)
        }
        else if (request.state === 'requested') {
            request.cancel()
        }
        setRequest({
            state: 'waiting',
            timeoutToken: setTimeout(() => {
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
    }

    return (
        <Autosuggest
            theme={SEARCH_THEME}
            suggestions={suggestions}
            onSuggestionsFetchRequested={onFetch}
            onSuggestionsClearRequested={() => setSuggestions([])}
            highlightFirstSuggestion
            // renderInputComponent={(inputProps) =>
            //     <div style={{position: 'relative'}}>
            //         <input {...inputProps}/>
            //         {request.state === 'requested' &&
            //             <Spinner
            //                 text={SPINNER_DOT}
            //                 style={{position: 'absolute', top: '5px', right: '3px'}}
            //             />
            //         }
            //     </div>
            // }
            getSuggestionValue={(item) =>
                item.isCreateClient
                    ? search
                    : `${item.last_name} ${item.first_name}`
            }
            renderSuggestion={(item, {_query, _isHighlighted}) =>
                item.isCreateClient
                    ? <div style={{fontWeight: 'bold'}}>+ {item.label}</div>
                    : <div>{item.label}</div>
            }
            onSuggestionSelected={(event, {suggestion: item, _suggestionValue, _suggestionIndex, _sectionIndex, _method}) => {
                if (item.isCreateClient) {
                    onCreate(search)
                } else {
                    onSelect(item)
                }
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

const SEARCH_THEME = {
    ...Autosuggest.defaultProps.theme,
    suggestionsList: [
        'react-autosuggest__suggestions-list',
        'react-autosuggest__suggestions-list-separate-last',
    ].join(' '),
}

ClientSearch.style = `
    .react-tiny-popover-container {
        z-index: 2000;
    }

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
    .react-autosuggest__suggestions-list.react-autosuggest__suggestions-list-separate-last > li:last-child {
        border-top: 1px solid rgba(0,0,0, 0.1);
    }
    .react-autosuggest__suggestion {
        width: 100%;
        padding: 0.8em;
        font-size: 0.9em;
        cursor: pointer;
    }
    .react-autosuggest__suggestion--first {}
    .react-autosuggest__suggestion--highlighted {
        background-color: #0073ea;
        color: white;
    }

`

// const SPINNER_DOT = '•'
// const SPINNER_DOTS = '•••'

// const Spinner = ({style = null, text = SPINNER_DOT, ...props}) => {
//     const defaultStyle = {color: 'rgba(0,0,0, 0.3)'}
//     const endStyle = style ? {...defaultStyle, ...style} : defaultStyle
//     return (
//         <span className="great-fun-spinner" style={endStyle} {...props}>{text}</span>
//     )
// }

// Spinner.style = `
// .great-fun-spinner {
//     animation: fade-in-out 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
// }

// @keyframes fade-in-out {
//     0%   { opacity: 0; }
//     50%  { opacity: 1; }
//     100% { opacity: 0; }
// }
// `


AddClient.style = [
    ClientSearch.style,
    // Spinner.style
].join('\n')


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
    return {lastName, firstName}
}
